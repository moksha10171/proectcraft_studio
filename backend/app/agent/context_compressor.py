"""Keeps the last N conversation turns intact and replaces older tool results with a stub,
so long chats do not grow without bound."""

from __future__ import annotations

from typing import TypedDict

KEEP_TURNS = 15
MAX_TOOL_RESULT_CHARS = 10_000
COMPRESSED_PLACEHOLDER = "[Content compressed — earlier in conversation]"


class AgentMessage(TypedDict, total=False):
    calls: list[dict]
    call_id: str
    role: str          # user | assistant | tool_result | tool_use | system
    content: str
    tool: str | None
    tool_call_id: str | None
    compressed: bool
    token_estimate: int


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _truncate_tool_result(msg: AgentMessage) -> AgentMessage:
    if msg.get("role") not in ("tool_result", "tool"):
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
        if i < compress_before and msg.get("role") in ("tool_result", "tool") and not msg.get("compressed"):
            result.append({**msg, "content": COMPRESSED_PLACEHOLDER, "compressed": True, "token_estimate": estimate_tokens(COMPRESSED_PLACEHOLDER)})  # type: ignore[arg-type]
        elif msg.get("role") in ("tool_result", "tool"):
            result.append(_truncate_tool_result(msg))
        else:
            result.append(msg)
    return result
