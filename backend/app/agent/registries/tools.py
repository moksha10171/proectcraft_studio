"""Tool catalog — Logen-style registry (metadata; execution stays in frontend for now)."""

from __future__ import annotations

from typing import Any, Dict, List

# Names must match frontend lib/arduino-studio/tool-registry.ts
TOOL_REGISTRY: List[Dict[str, Any]] = [
    {"name": "CHECK_PROJECT", "emoji": "✓", "label": "Build / check project", "interactive": False},
    {"name": "GENERATE_ARDUINO", "emoji": "⚡", "label": "Generate Arduino", "interactive": False},
    {"name": "GENERATE_RPI", "emoji": "🍓", "label": "Generate Raspberry Pi", "interactive": False},
    {"name": "VERIFY_ARDUINO", "emoji": "✅", "label": "Verify Arduino", "interactive": False},
    {"name": "VERIFY_PYTHON", "emoji": "✅", "label": "Verify Python", "interactive": False},
    {"name": "DERIVE_WIRING", "emoji": "🔌", "label": "Derive Wiring", "interactive": False},
    {"name": "CHECK_WIRING", "emoji": "🧭", "label": "Check wiring against sketch", "interactive": False},
    {"name": "INSPECT_RECORDING", "emoji": "📈", "label": "Inspect latest emulator recording", "interactive": False},
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

_TOOL_ARGUMENTS = {
    "GENERATE_ARDUINO": {"prompt": {"type": "string", "description": "Project requirements, board and components"}},
    "GENERATE_RPI": {"prompt": {"type": "string", "description": "Project requirements, Pi model and GPIO components"}},
    "FETCH_PROMPTS": {"prompt_names": {"type": "array", "items": {"type": "string"}}},
    "READ_FILE": {"path": {"type": "string"}},
    "WRITE_FILE": {"path": {"type": "string"}, "content": {"type": "string"}},
    "WEB_SEARCH": {"query": {"type": "string"}},
}
for _tool in TOOL_REGISTRY:
    _properties = _TOOL_ARGUMENTS.get(_tool["name"], {})
    _tool["input_schema"] = {"type": "object", "properties": _properties, "required": list(_properties)}
