"""SSE streaming to AI providers — mirrors frontend /api/agent."""

from __future__ import annotations

import json
import os
import time
from typing import Any, AsyncIterator, Dict, List, Optional

import httpx

TEXT_FALLBACK_SUFFIX = """

When native tools are unavailable, emit tool calls as:
```tool_call
{"tool": "TOOL_NAME", "args": {"_summary": "Short label", "key": "value"}}
```
When done, emit: DONE"""


def _encode(event: dict) -> bytes:
    return f"data: {json.dumps(event)}\n\n".encode("utf-8")


def _env_gemini_key() -> str:
    key = (os.environ.get("GEMINI_API_KEY") or os.environ.get("NEXT_PUBLIC_GEMINI_API_KEY") or "").strip()
    if not key:
        raise ValueError("GEMINI_API_KEY not set in environment")
    return key


async def _stream_gemini(
    api_key: str,
    model: str,
    messages: List[dict],
    system_prompt: str,
    temperature: float = 0.2,
    max_tokens: int = 8192,
    base_url: Optional[str] = None,
    tools: Optional[List[dict]] = None,
) -> AsyncIterator[bytes]:
    base = (base_url or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
    url = f"{base}/models/{model}:streamGenerateContent?key={api_key}&alt=sse"

    contents = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
        for m in messages
        if m.get("role") != "system"
    ]
    body: Dict[str, Any] = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
    }
    if tools:
        body["tools"] = [
            {
                "functionDeclarations": [
                    {"name": t["name"], "description": t["description"], "parameters": t["input_schema"]}
                    for t in tools
                ]
            }
        ]

    prompt_tokens = 0
    candidate_tokens = 0

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", url, json=body) as resp:
            if resp.status_code >= 400:
                err = (await resp.aread()).decode("utf-8", errors="replace")[:300]
                yield _encode({"type": "error", "message": f"Gemini API Error {resp.status_code}: {err}"})
                return

            buffer = ""
            async for chunk in resp.aiter_text():
                buffer += chunk
                lines = buffer.split("\n")
                buffer = lines.pop() if lines else ""
                for line in lines:
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if not data or data == "[DONE]":
                        continue
                    try:
                        js = json.loads(data)
                        for part in js.get("candidates", [{}])[0].get("content", {}).get("parts", []):
                            if part.get("text"):
                                yield _encode({"type": "text_delta", "text": part["text"]})
                            if part.get("functionCall"):
                                fc = part["functionCall"]
                                yield _encode(
                                    {
                                        "type": "tool_call",
                                        "tool": fc.get("name"),
                                        "args": fc.get("args") or {},
                                        "call_id": f"{fc.get('name')}_{int(time.time() * 1000)}",
                                    }
                                )
                        usage = js.get("usageMetadata") or {}
                        prompt_tokens = usage.get("promptTokenCount", prompt_tokens)
                        candidate_tokens = usage.get("candidatesTokenCount", candidate_tokens)
                        finish = js.get("candidates", [{}])[0].get("finishReason")
                        if finish and finish != "STOP":
                            yield _encode({"type": "done", "stop_reason": finish})
                    except json.JSONDecodeError:
                        continue

    if prompt_tokens or candidate_tokens:
        yield _encode(
            {
                "type": "usage",
                "prompt_tokens": prompt_tokens,
                "completion_tokens": candidate_tokens,
                "total_tokens": prompt_tokens + candidate_tokens,
            }
        )
    yield _encode({"type": "done", "stop_reason": "stop"})


async def _stream_openai_compatible(
    api_key: str,
    model: str,
    messages: List[dict],
    base_url: str,
    provider: str,
    temperature: float = 0.2,
    max_tokens: int = 8192,
    tools: Optional[List[dict]] = None,
) -> AsyncIterator[bytes]:
    url = f"{base_url.rstrip('/')}/chat/completions"
    openai_tools = None
    if tools:
        openai_tools = [
            {"type": "function", "function": {"name": t["name"], "description": t["description"], "parameters": t["input_schema"]}}
            for t in tools
        ]
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    if openai_tools:
        payload["tools"] = openai_tools
        payload["tool_choice"] = "auto"

    tool_buffers: Dict[int, Dict[str, str]] = {}

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            url,
            json=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        ) as resp:
            if resp.status_code >= 400:
                err = (await resp.aread()).decode("utf-8", errors="replace")[:300]
                yield _encode({"type": "error", "message": f"{provider} API Error {resp.status_code}: {err}"})
                return

            buffer = ""
            async for chunk in resp.aiter_text():
                buffer += chunk
                lines = buffer.split("\n")
                buffer = lines.pop() if lines else ""
                for line in lines:
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        yield _encode({"type": "done", "stop_reason": "stop"})
                        continue
                    try:
                        js = json.loads(data)
                        choice = (js.get("choices") or [{}])[0]
                        delta = choice.get("delta") or {}
                        if delta.get("content"):
                            yield _encode({"type": "text_delta", "text": delta["content"]})
                        for tc in delta.get("tool_calls") or []:
                            idx = tc.get("index", 0)
                            if idx not in tool_buffers:
                                tool_buffers[idx] = {"id": tc.get("id") or f"call_{idx}", "name": "", "args": ""}
                            buf = tool_buffers[idx]
                            if tc.get("id"):
                                buf["id"] = tc["id"]
                            fn = tc.get("function") or {}
                            if fn.get("name"):
                                buf["name"] = fn["name"]
                            if fn.get("arguments"):
                                buf["args"] += fn["arguments"]
                        reason = choice.get("finish_reason")
                        if reason in ("tool_calls", "stop"):
                            for buf in tool_buffers.values():
                                if not buf["name"]:
                                    continue
                                try:
                                    args = json.loads(buf["args"] or "{}")
                                except json.JSONDecodeError:
                                    args = {}
                                yield _encode(
                                    {"type": "tool_call", "tool": buf["name"], "args": args, "call_id": buf["id"]}
                                )
                            tool_buffers.clear()
                            yield _encode({"type": "done", "stop_reason": reason})
                        usage = js.get("usage")
                        if usage:
                            yield _encode(
                                {
                                    "type": "usage",
                                    "prompt_tokens": usage.get("prompt_tokens", 0),
                                    "completion_tokens": usage.get("completion_tokens", 0),
                                    "total_tokens": usage.get("total_tokens", 0),
                                }
                            )
                    except json.JSONDecodeError:
                        continue


async def _stream_anthropic(
    api_key: str,
    model: str,
    messages: List[dict],
    system_prompt: str,
    temperature: float = 0.2,
    max_tokens: int = 8192,
    tools: Optional[List[dict]] = None,
) -> AsyncIterator[bytes]:
    non_system = [m for m in messages if m.get("role") != "system"]
    body: Dict[str, Any] = {
        "model": model,
        "system": system_prompt,
        "messages": non_system,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }
    if tools:
        body["tools"] = [{"name": t["name"], "description": t["description"], "input_schema": t["input_schema"]} for t in tools]

    tool_buffers: Dict[int, Dict[str, str]] = {}
    input_tokens = 0
    output_tokens = 0

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            "https://api.anthropic.com/v1/messages",
            json=body,
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
        ) as resp:
            if resp.status_code >= 400:
                err = (await resp.aread()).decode("utf-8", errors="replace")[:300]
                yield _encode({"type": "error", "message": f"Anthropic API Error {resp.status_code}: {err}"})
                return

            buffer = ""
            async for chunk in resp.aiter_text():
                buffer += chunk
                lines = buffer.split("\n")
                buffer = lines.pop() if lines else ""
                for line in lines:
                    if line.startswith("event:") or not line.startswith("data: "):
                        continue
                    try:
                        js = json.loads(line[6:].strip())
                        evt = js.get("type")
                        if evt == "content_block_start":
                            block = js.get("content_block") or {}
                            if block.get("type") == "tool_use":
                                tool_buffers[js["index"]] = {
                                    "id": block.get("id", ""),
                                    "name": block.get("name", ""),
                                    "json": "",
                                }
                        elif evt == "content_block_delta":
                            delta = js.get("delta") or {}
                            if delta.get("type") == "text_delta" and delta.get("text"):
                                yield _encode({"type": "text_delta", "text": delta["text"]})
                            if delta.get("type") == "thinking_delta" and delta.get("thinking"):
                                yield _encode({"type": "thinking", "text": delta["thinking"]})
                            if delta.get("type") == "input_json_delta":
                                buf = tool_buffers.get(js["index"])
                                if buf is not None:
                                    buf["json"] += delta.get("partial_json") or ""
                        elif evt == "content_block_stop":
                            buf = tool_buffers.get(js["index"])
                            if buf:
                                try:
                                    args = json.loads(buf["json"] or "{}")
                                except json.JSONDecodeError:
                                    args = {}
                                yield _encode(
                                    {"type": "tool_call", "tool": buf["name"], "args": args, "call_id": buf["id"]}
                                )
                                del tool_buffers[js["index"]]
                        elif evt == "message_delta":
                            if js.get("usage", {}).get("output_tokens"):
                                output_tokens = js["usage"]["output_tokens"]
                            if js.get("delta", {}).get("stop_reason"):
                                yield _encode({"type": "done", "stop_reason": js["delta"]["stop_reason"]})
                        elif evt == "message_start":
                            input_tokens = (js.get("message") or {}).get("usage", {}).get("input_tokens", 0)
                    except json.JSONDecodeError:
                        continue

    if input_tokens or output_tokens:
        yield _encode(
            {
                "type": "usage",
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
            }
        )


async def stream_agent(body: dict) -> AsyncIterator[bytes]:
    messages = body.get("messages") or []
    if not messages:
        yield _encode({"type": "error", "message": "messages array required"})
        return

    model_config = body.get("modelConfig") or {}
    system_prompt = body.get("systemPrompt") or ""
    tools = body.get("tools")
    use_native = body.get("useNativeTools", False)
    active_tools = tools if use_native and tools else None

    base_prompt = model_config.get("systemPromptOverride") or system_prompt
    sys_prompt = base_prompt if (use_native and tools) else base_prompt + TEXT_FALLBACK_SUFFIX
    temperature = model_config.get("temperature", 0.2)
    max_tokens = model_config.get("maxTokens", 8192)

    api_key = (model_config.get("apiKey") or "").strip()
    has_custom = len(api_key) > 10

    try:
        if has_custom:
            provider = model_config.get("provider", "gemini")
            model = model_config.get("model", "")
            base_url = model_config.get("baseUrl")
            if provider == "gemini":
                gen = _stream_gemini(api_key, model, messages, sys_prompt, temperature, max_tokens, base_url, active_tools)
            elif provider == "anthropic":
                gen = _stream_anthropic(api_key, model, messages, sys_prompt, temperature, max_tokens, active_tools)
            else:
                default_base = (
                    "https://api.groq.com/openai/v1"
                    if provider == "groq"
                    else "https://api.openai.com/v1"
                )
                gen = _stream_openai_compatible(
                    api_key, model, messages, base_url or default_base, provider, temperature, max_tokens, active_tools
                )
        else:
            gemini_key = _env_gemini_key()
            model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
            gen = _stream_gemini(gemini_key, model, messages, sys_prompt, temperature, max_tokens, None, active_tools)

        async for chunk in gen:
            yield chunk
    except Exception as exc:
        yield _encode({"type": "error", "message": str(exc)})
