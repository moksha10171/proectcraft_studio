"""Context compressor — port of frontend/lib/arduino-studio/context-compressor.ts.

Keeps the last N conversation turns fully intact and stubs older tool_result
content to prevent runaway context growth. Matches Logen's OptimizationSettings.
"""

from __future__ import annotations

from typing import TypedDict

KEEP_TURNS = 15
MAX_TOOL_RESULT_CHARS = 10_000
COMPRESSED_PLACEHOLDER = "[Content compressed — earlier in conversation]"


class AgentMessage(TypedDict, total=False):
    role: str          # user | assistant | tool_result | tool_use | system
    content: str
    tool: str | None
    tool_call_id: str | None
    compressed: bool
    token_estimate: int


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _truncate_tool_result(msg: AgentMessage) -> AgentMessage:
    if msg.get("role") != "tool_result":
        return msg
    content = msg.get("content") or ""
    if len(content) <= MAX_TOOL_RESULT_CHARS:
        return msg
    truncated = content[:MAX_TOOL_RESULT_CHARS]
    return {**msg, "content": f"{truncated}\n\n[... truncated {len(content) - MAX_TOOL_RESULT_CHARS} chars ...]"}  # type: ignore[return-value]


def compress_context(messages: list[AgentMessage], keep_turns: int = KEEP_TURNS) -> list[AgentMessage]:
    """Compress old tool_result messages; keep last keep_turns turns intact."""
    if not messages:
        return messages

    # Find turn boundaries (each user message starts a new turn)
    boundaries = [i for i, m in enumerate(messages) if m.get("role") == "user"]

    if len(boundaries) <= keep_turns:
        # Nothing to compress — just truncate oversized results
        return [_truncate_tool_result(m) for m in messages]

    compress_before = boundaries[-keep_turns]

    result = []
    for i, msg in enumerate(messages):
        if i < compress_before and msg.get("role") == "tool_result" and not msg.get("compressed"):
            result.append({**msg, "content": COMPRESSED_PLACEHOLDER, "compressed": True, "token_estimate": estimate_tokens(COMPRESSED_PLACEHOLDER)})  # type: ignore[arg-type]
        elif msg.get("role") == "tool_result":
            result.append(_truncate_tool_result(msg))
        else:
            result.append(msg)
    return result


def sanitize_and_compress(messages: list[AgentMessage]) -> list[AgentMessage]:
    """Compress context. Tool-pair sanitization is handled by tool_pairs.py."""
    return compress_context(messages)


def calculate_context_usage(messages: list[AgentMessage], max_tokens: int = 128_000) -> dict:
    used = sum(estimate_tokens(m.get("content") or "") for m in messages)
    percent = min(100, round((used / max_tokens) * 100))
    return {"usedTokens": used, "maxTokens": max_tokens, "percent": percent}
