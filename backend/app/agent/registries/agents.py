"""Workspace agent definition — Logen logen__workspace_agent equivalent."""

from __future__ import annotations

from typing import Any, Dict

from app.agent.registries.prompts import build_prompt_index_text
from app.agent.registries.tools import TOOL_REGISTRY, list_tool_names
from app.agent.settings import (
    AGENT_CONTEXT_WINDOW,
    AGENT_MAX_TURNS,
    AGENT_TOOL_RESULT_MAX_CHARS,
    WORKSPACE_AGENT_NAME,
)

PURPOSE = (
    "Build and modify Arduino and Raspberry Pi embedded projects with code, wiring, and verification."
)

INSTRUCTIONS = f"""You are the ProjectCraft Workspace Agent — an operator that helps developers
build, modify, and verify Arduino and Raspberry Pi projects in the Studio IDE.

## How you work

1. **Refresh project state when needed.** Use LIST_FILES and READ_FILE before generating.
2. **Use domain prompts.** Call FETCH_PROMPTS before complex operations.
3. **Build loop:** GENERATE → VERIFY → DERIVE_WIRING → OPTIMIZE as needed.
4. **Every tool call MUST include _summary** — present tense, ≤8 words.
5. **Be concise.** Summarize results when done.

## Available prompts (fetch via FETCH_PROMPTS)

{build_prompt_index_text()}
"""

WORKSPACE_AGENT: Dict[str, Any] = {
    "name": WORKSPACE_AGENT_NAME,
    "purpose": PURPOSE,
    "instructions": INSTRUCTIONS,
    "tools": list_tool_names(),
    "toolCount": len(TOOL_REGISTRY),
    "modelRole": "coding",
    "maxTurns": AGENT_MAX_TURNS,
    "toolResultMaxChars": AGENT_TOOL_RESULT_MAX_CHARS,
    "maxContextTokens": AGENT_CONTEXT_WINDOW,
}


def get_workspace_agent() -> Dict[str, Any]:
    return WORKSPACE_AGENT
