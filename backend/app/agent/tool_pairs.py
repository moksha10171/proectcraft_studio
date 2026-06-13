"""Tool-pairs sanitization — port of frontend/lib/agent/tool-pairs.ts.

Drops orphaned tool_use / tool_result messages and enforces role alternation
so the history sent to the LLM is always well-formed.
"""

from __future__ import annotations

from app.agent.context_compressor import AgentMessage


def _merge_consecutive_roles(messages: list[AgentMessage]) -> list[AgentMessage]:
    merged: list[AgentMessage] = []
    for msg in messages:
        if (merged
                and merged[-1]["role"] == msg["role"]
                and isinstance(merged[-1].get("content"), str)
                and isinstance(msg.get("content"), str)):
            merged[-1] = {**merged[-1], "content": merged[-1]["content"] + "\n\n" + (msg.get("content") or "")}  # type: ignore[assignment]
        else:
            merged.append(dict(msg))  # type: ignore[arg-type]
    return merged


def sanitize_tool_pairs(messages: list[AgentMessage]) -> list[AgentMessage]:
    """Drop orphaned tool blocks and merge consecutive same-role messages."""
    if not messages:
        return messages

    non_empty = [m for m in messages if (m.get("content") or "").strip()]

    # Never start with tool_result
    while non_empty and non_empty[0].get("role") == "tool_result":
        non_empty.pop(0)

    return _merge_consecutive_roles(non_empty)


def flatten_tool_results_for_api(messages: list[AgentMessage]) -> list[dict]:
    """Convert tool_result and tool_use messages to user/assistant roles
    for providers that don't support structured tool formats in history.
    """
    result = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content") or ""
        if role == "tool_result":
            result.append({"role": "user", "content": f"[Tool {m.get('tool', 'result')}]: {content}"})
        elif role == "tool_use":
            result.append({"role": "assistant", "content": content})
        elif role == "system":
            pass  # system prompt handled separately
        else:
            result.append({"role": role, "content": content})
    return result
