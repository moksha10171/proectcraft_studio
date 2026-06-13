"""Tool catalog — Logen-style registry (metadata; execution stays in frontend for now)."""

from __future__ import annotations

from typing import Any, Dict, List

# Names must match frontend lib/arduino-studio/tool-registry.ts
TOOL_REGISTRY: List[Dict[str, Any]] = [
    {"name": "GENERATE_ARDUINO", "emoji": "⚡", "label": "Generate Arduino", "interactive": False},
    {"name": "GENERATE_RPI", "emoji": "🍓", "label": "Generate Raspberry Pi", "interactive": False},
    {"name": "VERIFY_ARDUINO", "emoji": "✅", "label": "Verify Arduino", "interactive": False},
    {"name": "VERIFY_PYTHON", "emoji": "✅", "label": "Verify Python", "interactive": False},
    {"name": "DERIVE_WIRING", "emoji": "🔌", "label": "Derive Wiring", "interactive": False},
    {"name": "OPTIMIZE_CODE", "emoji": "🚀", "label": "Optimize Code", "interactive": False},
    {"name": "APPLY_CHANGES", "emoji": "📝", "label": "Apply Changes", "interactive": True},
    {"name": "FETCH_PROMPTS", "emoji": "📚", "label": "Fetch Prompts", "interactive": False},
    {"name": "READ_FILE", "emoji": "📄", "label": "Read File", "interactive": False},
    {"name": "WRITE_FILE", "emoji": "💾", "label": "Write File", "interactive": False},
    {"name": "LIST_FILES", "emoji": "📁", "label": "List Files", "interactive": False},
    {"name": "WEB_SEARCH", "emoji": "🌐", "label": "Web Search", "interactive": False},
]

INTERACTIVE_TOOLS = {t["name"] for t in TOOL_REGISTRY if t.get("interactive")}


def list_tool_names() -> List[str]:
    return [t["name"] for t in TOOL_REGISTRY]
