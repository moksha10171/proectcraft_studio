"""Server-side assistant loop for Studio projects.

One user message drives model turns until the model stops calling tools (or AGENT_MAX_TURNS). Tools run
serially against a ProjectSession: reads see the draft, edits change only the draft, checks compile and
wiring-check it. When the run ends, a changed draft is verified (if the model did not already check its
final state) and staged as a single proposal for the user to apply or reject.

SSE events: message_start, text_delta, thinking, tool_call_start, tool_call_end, patch_ready, usage, error, done.
"""
from __future__ import annotations

import json
import logging
import re
import time
import uuid
from typing import AsyncIterator

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.agent.context_compressor import AgentMessage, compress_context
from app.agent.prompt import system_prompt
from app.agent.providers import resolve_provider
from app.agent.session import RESULT_LIMIT, TOOL_MAP, ProjectSession, available_tools
from app.agent.settings import AGENT_DEFAULT_MAX_TOKENS, AGENT_DEFAULT_TEMPERATURE, AGENT_MAX_TURNS
from app.agent.streaming import _stream_anthropic, _stream_gemini, _stream_openai_compatible
from app.agent.tool_pairs import flatten_tool_results_for_api, sanitize_tool_pairs
from app.db import repo
from app.db.models import ExperimentProject
from app.domain.project import BOARDS

log = logging.getLogger(__name__)

MAX_TURNS = AGENT_MAX_TURNS
MAX_CALLS_PER_TURN = 8


def _sse(event: dict) -> bytes:
    return f"data: {json.dumps(event)}\n\n".encode("utf-8")


def _tool_specs(names: list[str]) -> list[dict]:
    return [{"name": n, "description": TOOL_MAP[n]["description"], "input_schema": TOOL_MAP[n]["input_schema"]} for n in names]


async def _call_provider_turn(provider, api_key, model, messages, system, tools, temperature, max_tokens, base_url) -> AsyncIterator[bytes]:
    if provider == "gemini":
        return _stream_gemini(api_key, model, messages, system, temperature, max_tokens, base_url, tools)
    if provider == "anthropic":
        return _stream_anthropic(api_key, model, messages, system, temperature, max_tokens, tools)
    default_base = "https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1"
    return _stream_openai_compatible(api_key, model, [{"role": "system", "content": system}, *messages], base_url or default_base,
                                     provider, temperature, max_tokens, tools)


def _load_history(db: Session, workspace_id: str) -> list[AgentMessage]:
    history: list[AgentMessage] = []
    for turn in repo.list_agent_turns(db, workspace_id):
        try:
            content = json.loads(turn.content) if turn.content.startswith(("[", "{")) else turn.content
        except ValueError:
            content = turn.content
        if isinstance(content, dict) and "text" in content and ("calls" in content or "call_id" in content):
            history.append({"role": turn.role, "content": content["text"], **{k: content[k] for k in ("calls", "call_id", "tool") if k in content}})  # type: ignore[typeddict-item]
        else:
            history.append({"role": turn.role, "content": content if isinstance(content, str) else json.dumps(content)})
    return history


async def run_agent_loop(workspace_id: str, user_message: str, model_config: dict, device_mode: str, db: Session,
                         intent: str = "modify") -> AsyncIterator[bytes]:
    if db.get(ExperimentProject, workspace_id) is None:
        yield _sse({"type": "error", "message": "The assistant works on Studio projects. Open or create a project first."})
        return
    try:
        provider, api_key, model, base_url = resolve_provider(model_config)
    except ValueError as exc:
        yield _sse({"type": "error", "message": str(exc)})
        return

    session = ProjectSession(db, workspace_id)
    mode = BOARDS[session.project.boardId]["mode"]
    repo.get_or_create_workspace(db, workspace_id, mode=mode)
    repo.append_chat_message(db, workspace_id, role="user", content=user_message)
    history = _load_history(db, workspace_id)
    repo.append_agent_turn(db, workspace_id, role="user", content=user_message)
    db.commit()
    yield _sse({"type": "message_start", "workspace_id": workspace_id})

    # The snapshot lives only in this request's copy of the message; stored history keeps the user's words.
    history.append({"role": "user", "content": f"{session.snapshot()}\n\n{user_message}"})

    temperature = float(model_config.get("temperature", AGENT_DEFAULT_TEMPERATURE))
    max_tokens = int(model_config.get("maxTokens") or AGENT_DEFAULT_MAX_TOKENS)
    native = bool(model_config.get("supportsNativeTools", provider != "custom"))
    tool_names = available_tools(intent, session.project.boardId)
    specs = _tool_specs(tool_names)
    system = system_prompt(intent, mode, specs, native, (model_config.get("systemPromptOverride") or "").strip() or None)

    final_text = ""
    finished = False
    for turn_num in range(MAX_TURNS):
        compressed = compress_context(sanitize_tool_pairs(history))
        api_messages = [dict(m) for m in compressed] if native else flatten_tool_results_for_api(compressed)
        text, thinking, calls = "", "", []
        try:
            stream = await _call_provider_turn(provider, api_key, model, api_messages, system, specs if native else None,
                                               temperature, max_tokens, base_url)
            async for raw in stream:
                try:
                    chunk = json.loads(raw.decode("utf-8").removeprefix("data: ").strip())
                except ValueError:
                    continue
                kind = chunk.get("type")
                if kind == "text_delta":
                    text += chunk.get("text", "")
                    yield _sse(chunk)
                elif kind == "thinking":
                    thinking += chunk.get("text", "")
                    yield _sse(chunk)
                elif kind == "tool_call":
                    calls.append({"tool": chunk.get("tool"), "args": chunk.get("args") or {},
                                  "call_id": chunk.get("call_id") or uuid.uuid4().hex, "signature": chunk.get("signature")})
                elif kind == "usage":
                    repo.log_usage(db, workspace_id, provider=provider, model=model, task_type="agent_turn",
                                   prompt_tokens=chunk.get("prompt_tokens", 0), completion_tokens=chunk.get("completion_tokens", 0),
                                   total_tokens=chunk.get("total_tokens", 0))
                    db.commit()
                    yield _sse({**chunk, "turn": turn_num + 1})
                elif kind == "error":
                    yield _sse(chunk)
                    return
        except Exception:
            log.exception("Provider stream failed on turn %d", turn_num + 1)
            yield _sse({"type": "error", "message": "AI provider request failed. Check the provider URL, credentials and model."})
            return

        if not native:
            for match in re.finditer(r"```tool_call\s*(.*?)```", text, re.DOTALL):
                try:
                    call = json.loads(match.group(1))
                except ValueError:
                    continue
                if isinstance(call, dict) and isinstance(call.get("tool"), str) and isinstance(call.get("args", {}), dict):
                    calls.append({"tool": call["tool"], "args": call.get("args", {}), "call_id": uuid.uuid4().hex})
        calls = calls[:MAX_CALLS_PER_TURN]

        if text or thinking:
            repo.append_chat_message(db, workspace_id, role="assistant", content=text, thinking=thinking or None)
        repo.append_agent_turn(db, workspace_id, role="assistant",
                               content=json.dumps({"text": text, "calls": calls}) if native else (text or "(tool calls only)"))
        db.commit()
        history.append({"role": "assistant", "content": text, **({"calls": calls} if native else {})})
        if text.strip():
            final_text = re.sub(r"```tool_call.*?```", "", text, flags=re.DOTALL).strip() or final_text
        if not calls:
            finished = True
            break

        results: list[str] = []
        for call in calls:
            async for chunk in _run_tool(session, call, tool_names, intent, db, workspace_id, provider, model):
                if isinstance(chunk, str):
                    results.append(chunk)
                    if native:
                        history.append({"role": "tool", "content": chunk, "call_id": call["call_id"], "tool": call["tool"]})
                        repo.append_agent_turn(db, workspace_id, role="tool", content=json.dumps({"text": chunk, "call_id": call["call_id"], "tool": call["tool"]}),
                                               tool=call["tool"], tool_call_id=call["call_id"])
                        db.commit()
                else:
                    yield chunk
        if not native:
            combined = "\n\n".join(f"[{c['tool']} result]\n{r}" for c, r in zip(calls, results))
            history.append({"role": "tool_result", "content": combined, "tool": ",".join(c["tool"] for c in calls)})  # type: ignore[typeddict-item]
            repo.append_agent_turn(db, workspace_id, role="tool", content=combined, tool=",".join(c["tool"] for c in calls))
            db.commit()

    if not finished:
        note = f"\n\nI stopped after {MAX_TURNS} steps without finishing. Review what is staged and ask me to continue if needed."
        final_text += note
        yield _sse({"type": "text_delta", "text": note})

    if session.changed:
        async for chunk in _hand_over(session, final_text):
            yield chunk
    yield _sse({"type": "done", "stop_reason": "stop" if finished else "max_turns"})


async def _run_tool(session: ProjectSession, call: dict, allowed: list[str], intent: str, db: Session, workspace_id: str,
                    provider: str, model: str):
    """Yield SSE bytes for progress, then the result text (str) for the model."""
    name, args, record_id = call["tool"], call["args"], uuid.uuid4().hex
    spec = TOOL_MAP.get(name)
    label = spec["label"] if spec else str(name)
    repo.create_tool_call(db, workspace_id, tool=str(name), label=label, emoji="", args=args, tc_id=record_id)
    db.commit()
    yield _sse({"type": "tool_call_start", "id": record_id, "tool": name, "label": label, "args": _preview_args(args)})
    started = time.time()
    if not spec:
        result_text, error = f"ERROR: There is no tool named {name}. Available tools: {', '.join(allowed)}.", True
        files: list[str] = []
    elif name not in allowed:
        reason = "explain mode is read-only; describe the change instead" if spec["writes"] else "it is not available for this board or server"
        result_text, error, files = f"ERROR: {name} cannot be used here: {reason}.", True, []
    else:
        try:
            result = await session.run(name, args)
            result_text, error, files = result.text, result.error, result.files_modified
        except HTTPException as exc:
            result_text, error, files = f"ERROR: {exc.detail}", True, []
        except Exception:
            log.exception("Tool %s failed", name)
            result_text, error, files = f"ERROR: {name} failed unexpectedly. Try a different approach or tell the user.", True, []
    if len(result_text) > RESULT_LIMIT:
        result_text = result_text[:RESULT_LIMIT] + f"\n[... {len(result_text) - RESULT_LIMIT} more characters omitted]"
    elapsed = int((time.time() - started) * 1000)
    status = "error" if error else "success"
    repo.finish_tool_call(db, record_id, status=status, result=result_text[:500], elapsed_ms=elapsed, provider=provider, model=model,
                          files_modified=files or None)
    db.commit()
    yield _sse({"type": "tool_call_end", "id": record_id, "tool": name, "status": status, "result_preview": result_text[:600],
                "elapsed_ms": elapsed, "files_modified": files})
    yield result_text


def _preview_args(args: dict) -> dict:
    """Arguments for the progress display; long text (file bodies) is shortened."""
    return {k: (v[:120] + "…" if isinstance(v, str) and len(v) > 120 else v) for k, v in args.items()}


async def _hand_over(session: ProjectSession, explanation: str):
    for check in session.stale_checks():
        record = uuid.uuid4().hex
        label = "Verify proposal build" if check == "build" else "Verify proposal wiring"
        yield _sse({"type": "tool_call_start", "id": record, "tool": "VERIFY", "label": label, "args": {}})
        started = time.time()
        if check == "build":
            run = await session.check()
            preview = f"Draft build: {run['status']}"
        else:
            preview = session.wiring()["summary"].split(".")[0]
        yield _sse({"type": "tool_call_end", "id": record, "tool": "VERIFY", "status": "success", "result_preview": preview,
                    "elapsed_ms": int((time.time() - started) * 1000)})
    try:
        patch = session.stage(explanation or f"Proposed changes to {', '.join(session.changed)}")
    except HTTPException as exc:
        yield _sse({"type": "error", "message": f"The proposal could not be staged: {exc.detail}"})
        return
    yield _sse({"type": "patch_ready", "patch": patch})
