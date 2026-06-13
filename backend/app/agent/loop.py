"""Server-side multi-turn agent loop — port of useAgentEngine.sendMessage().

Accepts a single user message, drives turns until the model stops emitting
tool calls (or MAX_TURNS is reached), executes all tools server-side, persists
everything to the DB, and streams expanded SSE events to the client.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from typing import Any, AsyncIterator

from sqlalchemy.orm import Session

from app.agent.context_compressor import (
    AgentMessage,
    compress_context,
    sanitize_and_compress,
)
from app.agent.device_tools import (
    DeviceMode,
    build_device_system_suffix,
    get_tools_for_device_mode,
)
from app.agent.registries.agents import get_workspace_agent
from app.agent.registries.prompts import build_prompt_index_text
from app.agent.registries.tools import TOOL_REGISTRY
from app.agent.streaming import (
    _stream_anthropic,
    _stream_gemini,
    _stream_openai_compatible,
    _env_gemini_key,
)
from app.agent.tool_pairs import flatten_tool_results_for_api, sanitize_tool_pairs
from app.agent.tools.executor import INTERACTIVE_TOOLS, execute_tool
from app.db import repo

log = logging.getLogger(__name__)

MAX_TURNS = 20
AGENT_MAX_CONTEXT = 128_000


# ── SSE encoding ──────────────────────────────────────────────────────────────

def _sse(event: dict) -> bytes:
    return f"data: {json.dumps(event)}\n\n".encode("utf-8")


# ── Tool spec builders (provider-aware) ───────────────────────────────────────

def _build_tool_specs(tool_names: list[str], provider: str) -> list[dict]:
    """Build tool specs for native tool use for the given provider."""
    specs = []
    tool_map = {t["name"]: t for t in TOOL_REGISTRY}
    for name in tool_names:
        if name not in tool_map:
            continue
        t = tool_map[name]
        # Build a minimal input_schema
        properties = {}
        for tool_full in (t,):
            pass  # TOOL_REGISTRY already has basic metadata; use simple open schemas
        specs.append({
            "name": t["name"],
            "description": f"{t.get('emoji', '')} {t.get('label', t['name'])}",
            "input_schema": {
                "type": "object",
                "properties": {
                    "_summary": {"type": "string", "description": "Short present-tense description of what this call does"},
                },
                "required": ["_summary"],
                "additionalProperties": True,
            },
        })
    return specs


# ── System prompt assembly ─────────────────────────────────────────────────────

def _build_system_prompt(device_mode: DeviceMode, override: str | None = None) -> str:
    if override:
        return override
    agent = get_workspace_agent()
    base = f"{agent['purpose']}\n\n{agent['instructions']}"
    base += f"\n\n{build_prompt_index_text()}"
    base += build_device_system_suffix(device_mode)
    return base


# ── Provider selection ────────────────────────────────────────────────────────

def _resolve_provider(model_config: dict) -> tuple[str, str, str, str | None]:
    """Returns (provider, api_key, model, base_url)."""
    import os
    api_key = (model_config.get("apiKey") or "").strip()
    has_custom = len(api_key) > 10
    if has_custom:
        provider = model_config.get("provider", "gemini")
        model = model_config.get("model", "")
        base_url = model_config.get("baseUrl")
        return provider, api_key, model, base_url
    # Env key fallback
    key = _env_gemini_key()
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
    return "gemini", key, model, None


async def _call_provider_turn(
    provider: str,
    api_key: str,
    model: str,
    messages: list[dict],
    system_prompt: str,
    tools: list[dict] | None,
    temperature: float,
    max_tokens: int,
    base_url: str | None,
) -> AsyncIterator[bytes]:
    if provider == "gemini":
        return _stream_gemini(api_key, model, messages, system_prompt, temperature, max_tokens, base_url, tools)
    elif provider == "anthropic":
        return _stream_anthropic(api_key, model, messages, system_prompt, temperature, max_tokens, tools)
    else:
        default_base = "https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1"
        return _stream_openai_compatible(api_key, model, messages, base_url or default_base, provider, temperature, max_tokens, tools)


# ── Main loop ─────────────────────────────────────────────────────────────────

async def run_agent_loop(
    workspace_id: str,
    user_message: str,
    model_config: dict,
    device_mode: DeviceMode,
    db: Session,
) -> AsyncIterator[bytes]:
    """Full multi-turn agent loop — yields SSE bytes.

    Protocol:
      message_start       — loop started
      text_delta          — streaming text from model
      thinking            — extended thinking (Anthropic)
      tool_call_start     — tool about to execute
      tool_call_end       — tool done (with result preview, elapsed, usage)
      file_update         — a project file changed (name, content, type)
      wiring_update       — wiring manifest changed
      usage               — token counts for the turn
      done                — loop finished
      error               — fatal error
    """
    # Ensure workspace exists
    ws = repo.get_or_create_workspace(db, workspace_id, mode=device_mode)
    db.commit()

    # Persist user message to DB transcript
    user_msg_row = repo.append_chat_message(db, workspace_id, role="user", content=user_message)
    db.commit()

    yield _sse({"type": "message_start", "workspace_id": workspace_id})

    # Load conversation history from DB
    history: list[AgentMessage] = []
    for turn in repo.list_agent_turns(db, workspace_id):
        try:
            content = json.loads(turn.content) if turn.content.startswith(("[", "{")) else turn.content
        except Exception:
            content = turn.content
        history.append({"role": turn.role, "content": content if isinstance(content, str) else json.dumps(content)})  # type: ignore[typeddict-item]

    history.append({"role": "user", "content": user_message})

    provider, api_key, model, base_url = _resolve_provider(model_config)
    temperature = float(model_config.get("temperature") or 0.2)
    max_tokens = int(model_config.get("maxTokens") or 8192)
    system_override = (model_config.get("systemPromptOverride") or "").strip() or None

    system_prompt = _build_system_prompt(device_mode, system_override)
    tool_names = get_tools_for_device_mode(device_mode)
    tool_specs = _build_tool_specs(tool_names, provider)

    # Track pending files/wiring across turns for APPLY_CHANGES
    pending_files: list[dict] | None = None
    pending_wiring: dict | None = None

    # Append the user turn to DB agent history
    repo.append_agent_turn(db, workspace_id, role="user", content=user_message)
    db.commit()

    for turn_num in range(MAX_TURNS):
        # Build API message list
        sanitized = sanitize_tool_pairs(history)
        compressed = compress_context(sanitized)
        api_messages = flatten_tool_results_for_api(compressed)

        # Collect streaming output for this turn
        streaming_text = ""
        thinking_text = ""
        native_tool_calls: list[dict] = []
        turn_usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

        try:
            stream = await _call_provider_turn(
                provider, api_key, model,
                api_messages, system_prompt,
                tool_specs, temperature, max_tokens, base_url,
            )

            async for raw_chunk in stream:
                try:
                    chunk = json.loads(raw_chunk.decode("utf-8").lstrip("data: ").strip())
                except Exception:
                    continue

                ctype = chunk.get("type")
                if ctype == "text_delta":
                    streaming_text += chunk.get("text", "")
                    yield _sse(chunk)
                elif ctype == "thinking":
                    thinking_text += chunk.get("text", "")
                    yield _sse(chunk)
                elif ctype == "tool_call":
                    native_tool_calls.append({
                        "tool": chunk.get("tool"),
                        "args": chunk.get("args") or {},
                        "call_id": chunk.get("call_id") or str(uuid.uuid4()),
                    })
                elif ctype == "usage":
                    turn_usage = {
                        "prompt_tokens": chunk.get("prompt_tokens", 0),
                        "completion_tokens": chunk.get("completion_tokens", 0),
                        "total_tokens": chunk.get("total_tokens", 0),
                    }
                    yield _sse({**chunk, "turn": turn_num + 1})
                elif ctype == "error":
                    yield _sse(chunk)
                    return
                elif ctype == "done":
                    break

        except Exception as exc:
            log.exception("Provider stream failed on turn %d", turn_num + 1)
            yield _sse({"type": "error", "message": str(exc)})
            return

        # Persist assistant text turn to DB
        if streaming_text or thinking_text:
            assistant_row = repo.append_chat_message(
                db, workspace_id,
                role="assistant", content=streaming_text,
                thinking=thinking_text or None,
            )
            db.commit()

        # Persist agent turn
        repo.append_agent_turn(db, workspace_id, role="assistant", content=streaming_text or "(tool calls only)")
        db.commit()

        history.append({"role": "assistant", "content": streaming_text})

        # Log usage
        if turn_usage.get("total_tokens"):
            repo.log_usage(db, workspace_id, provider=provider, model=model, task_type="agent_turn", **turn_usage)
            db.commit()

        if not native_tool_calls:
            break  # Model is done

        # ── Execute tools ─────────────────────────────────────────────────────
        interactive = [tc for tc in native_tool_calls if tc["tool"] in INTERACTIVE_TOOLS]
        parallel = [tc for tc in native_tool_calls if tc["tool"] not in INTERACTIVE_TOOLS][:8]

        tool_result_parts: list[str] = []

        async def _run_one_tool(tc: dict) -> None:
            nonlocal pending_files, pending_wiring
            tool_name = tc["tool"]
            args = tc["args"]
            call_id = tc["call_id"]

            # Lookup label/emoji from registry
            reg_entry = next((t for t in TOOL_REGISTRY if t["name"] == tool_name), None)
            label = reg_entry.get("label", tool_name) if reg_entry else tool_name
            emoji = reg_entry.get("emoji", "🔧") if reg_entry else "🔧"

            # Create DB record
            tc_row = repo.create_tool_call(
                db, workspace_id, tool=tool_name, label=label, emoji=emoji, args=args, tc_id=call_id,
            )
            db.commit()

            yield _sse({"type": "tool_call_start", "id": call_id, "tool": tool_name, "label": label, "emoji": emoji, "args": args})

            started = time.time()
            try:
                result = await execute_tool(
                    tool_name, args,
                    workspace_id=workspace_id,
                    device_mode=device_mode,
                    model_config=model_config,
                    db=db,
                    pending_files=pending_files,
                    pending_wiring=pending_wiring,
                )
                elapsed_ms = int((time.time() - started) * 1000)
                status = "error" if result.text.startswith("ERROR:") else "success"

                # Update pending state
                if result.files:
                    pending_files = result.files
                if result.wiring:
                    pending_wiring = result.wiring

                # Persist tool call result
                repo.finish_tool_call(
                    db, call_id,
                    status=status,
                    result=result.text[:500],
                    elapsed_ms=elapsed_ms,
                    provider=provider,
                    model=model,
                    files_modified=result.files_modified or None,
                )
                db.commit()

                tool_result_parts.append(result.text)

                # Emit file/wiring update events for live client sync
                if result.files:
                    for f in result.files:
                        yield _sse({"type": "file_update", "name": f["name"], "content": f["content"], "file_type": f.get("type", "code")})
                if result.wiring:
                    yield _sse({"type": "wiring_update", "manifest": result.wiring})

                yield _sse({
                    "type": "tool_call_end",
                    "id": call_id,
                    "tool": tool_name,
                    "status": status,
                    "result_preview": result.text[:200],
                    "elapsed_ms": elapsed_ms,
                    "provider": provider,
                    "model": model,
                    "files_modified": result.files_modified,
                })

            except Exception as exc:
                elapsed_ms = int((time.time() - started) * 1000)
                err_text = f"ERROR: {exc}"
                repo.finish_tool_call(db, call_id, status="error", result=err_text[:500], elapsed_ms=elapsed_ms)
                db.commit()
                tool_result_parts.append(err_text)
                yield _sse({"type": "tool_call_end", "id": call_id, "tool": tool_name, "status": "error",
                            "result_preview": err_text[:200], "elapsed_ms": elapsed_ms})

        # Run interactive tools serially, parallel tools concurrently
        if interactive:
            async for chunk in _run_one_tool(interactive[0]):
                yield chunk

        if parallel:
            tasks = [_collect_tool_chunks(_run_one_tool(tc)) for tc in parallel]
            results_with_chunks = await asyncio.gather(*tasks)
            for chunks in results_with_chunks:
                for chunk in chunks:
                    yield chunk

        # Append tool results to history
        combined = "\n\n".join(tool_result_parts)
        history.append({"role": "tool_result", "content": combined, "tool": ",".join(tc["tool"] for tc in native_tool_calls)})  # type: ignore[typeddict-item]
        repo.append_agent_turn(db, workspace_id, role="tool", content=combined,
                                tool=",".join(tc["tool"] for tc in native_tool_calls))
        db.commit()

    yield _sse({"type": "done", "stop_reason": "stop"})


async def _collect_tool_chunks(agen: AsyncIterator[bytes]) -> list[bytes]:
    """Collect all chunks from an async generator into a list (for parallel execution)."""
    chunks = []
    async for chunk in agen:
        chunks.append(chunk)
    return chunks
