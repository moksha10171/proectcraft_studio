"""Filesystem persistence — data/studio/workspaces/{id}/chat|input|codebase/"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

from app.config import STUDIO_DIR


def _resolve(key: str) -> Path:
    return STUDIO_DIR / key


def read_json(key: str) -> Optional[Any]:
    path = _resolve(key)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(key: str, data: Any) -> None:
    path = _resolve(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def delete_json(key: str) -> None:
    path = _resolve(key)
    if path.is_file():
        path.unlink()


def workspace_paths(workspace_id: str) -> dict[str, str]:
    root = f"workspaces/{workspace_id}"
    return {
        "chat_messages": f"{root}/chat/messages.json",
        "chat_agent_history": f"{root}/chat/agent-history.json",
        "chat_tool_calls": f"{root}/chat/tool-calls.json",
        "input_draft": f"{root}/input/draft.json",
        "codebase_meta": f"{root}/codebase/meta.json",
        "codebase_wiring": f"{root}/codebase/wiring.json",
    }


def _now_ms() -> int:
    return int(time.time() * 1000)


class WorkspaceStore:
    def __init__(self, workspace_id: str = "default") -> None:
        self.workspace_id = workspace_id
        self.paths = workspace_paths(workspace_id)

    def load_chat(self) -> dict | None:
        p = self.paths
        messages = read_json(p["chat_messages"])
        history = read_json(p["chat_agent_history"])
        tool_calls = read_json(p["chat_tool_calls"])
        if messages is None and history is None and tool_calls is None:
            return None
        return {
            "messages": messages or [],
            "agentHistory": history or [],
            "toolCalls": tool_calls or [],
            "updatedAt": _now_ms(),
        }

    def save_chat(self, data: dict) -> None:
        p = self.paths
        write_json(p["chat_messages"], data.get("messages", []))
        write_json(p["chat_agent_history"], data.get("agentHistory", []))
        write_json(p["chat_tool_calls"], data.get("toolCalls", []))

    def clear_chat(self) -> None:
        for key in ("chat_messages", "chat_agent_history", "chat_tool_calls"):
            delete_json(self.paths[key])

    def load_input(self) -> dict | None:
        return read_json(self.paths["input_draft"])

    def save_input(self, draft: str) -> None:
        write_json(self.paths["input_draft"], {"draft": draft, "updatedAt": _now_ms()})

    def load_codebase(self) -> dict | None:
        meta = read_json(self.paths["codebase_meta"])
        if meta is None:
            return None
        wiring = read_json(self.paths["codebase_wiring"])
        return {**meta, "wiring": wiring, "updatedAt": _now_ms()}

    def save_codebase(self, data: dict) -> None:
        payload = dict(data)
        wiring = payload.pop("wiring", None)
        write_json(self.paths["codebase_meta"], payload)
        write_json(self.paths["codebase_wiring"], wiring)

    def load_all(self) -> dict:
        out: dict = {"workspaceId": self.workspace_id}
        chat = self.load_chat()
        inp = self.load_input()
        codebase = self.load_codebase()
        if chat:
            out["chat"] = chat
        if inp:
            out["input"] = inp
        if codebase:
            out["codebase"] = codebase
        return out
