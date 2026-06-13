"""Agent loop settings — mirrors Logen workspace agent limits."""

from __future__ import annotations

import os

WORKSPACE_AGENT_NAME = "projectcraft__workspace_agent"

AGENT_MAX_TURNS = int(os.environ.get("AGENT_MAX_TURNS", "20"))
AGENT_TOOL_RESULT_MAX_CHARS = int(os.environ.get("AGENT_TOOL_RESULT_MAX_CHARS", "10000"))
AGENT_CONTEXT_WINDOW = int(os.environ.get("AGENT_CONTEXT_WINDOW", "128000"))
AGENT_DEFAULT_TEMPERATURE = float(os.environ.get("AGENT_DEFAULT_TEMPERATURE", "0.2"))
AGENT_DEFAULT_MAX_TOKENS = int(os.environ.get("AGENT_DEFAULT_MAX_TOKENS", "8192"))

DEFAULT_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
DEFAULT_GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
