"""Server-side tool executor — port of frontend/lib/agent/tools/executor.ts.

All tools now operate on DB-backed workspace files (ProjectFile rows) rather
than client state. Returns ToolResult which the agent loop persists.
"""

from __future__ import annotations

import dataclasses
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.agent.device_tools import DeviceMode, resolve_tool_for_device
from app.agent.registries.prompts import build_file_context, fetch_prompts
from app.agent.tools.generate import run_generate
from app.agent.tools.research import web_search
from app.db import repo

log = logging.getLogger(__name__)

TOOL_RESULT_MAX_CHARS = 10_000

INTERACTIVE_TOOLS: set[str] = {"SEND_MESSAGE"}
AUTO_APPLY_TOOLS: set[str] = {"GENERATE_ARDUINO", "GENERATE_RPI", "DERIVE_WIRING", "OPTIMIZE_CODE", "APPLY_CHANGES"}


@dataclasses.dataclass
class ToolResult:
    text: str
    files: list[dict] | None = None
    wiring: dict | None = None
    auto_apply: bool = False
    files_modified: list[str] = dataclasses.field(default_factory=list)


def _truncate(text: str, max_chars: int = TOOL_RESULT_MAX_CHARS) -> str:
    if len(text) <= max_chars:
        return text
    return f"{text[:max_chars]}\n\n[... truncated {len(text) - max_chars} chars ...]"


def _format_wiring_summary(wiring: dict) -> str:
    components = wiring.get("components") or []
    lines = [f"• {c.get('label', c.get('type', '?'))} → Pin {c.get('pin', '?')}" for c in components]
    return f"Wiring for {wiring.get('board', 'board')}:\n" + "\n".join(lines)


def _normalize_files(raw: list[dict] | None) -> list[dict]:
    if not raw:
        return []
    return [
        {
            "name": f.get("name") or "sketch.ino",
            "content": f.get("content") or "",
            "type": f.get("type") if f.get("type") in ("code", "config", "doc") else "code",
        }
        for f in raw
    ]


async def execute_tool(
    tool_name: str,
    args: dict[str, Any],
    *,
    workspace_id: str,
    device_mode: DeviceMode,
    model_config: dict | None,
    db: Session,
    pending_files: list[dict] | None = None,
    pending_wiring: dict | None = None,
) -> ToolResult:
    """Dispatch a tool call and return a ToolResult.

    Side-effects: may write ProjectFile / Wiring rows directly.
    """
    resolved = resolve_tool_for_device(tool_name, device_mode)

    # Load current DB files for context
    db_files = repo.list_files(db, workspace_id)
    files_as_dicts = [{"name": f.name, "content": f.content, "type": f.type} for f in db_files]

    try:
        if resolved in ("GENERATE_ARDUINO", "GENERATE_RPI"):
            prompt = str(args.get("prompt") or "Generate a project")
            action = "GENERATE_RPI" if resolved == "GENERATE_RPI" else "GENERATE_ARDUINO"
            result = await run_generate(action, files_as_dicts, prompt, device_mode, model_config)
            data = result["data"]
            new_files = _normalize_files(data.get("files"))
            wiring = data.get("wiring")
            explanation = str(data.get("explanation") or "Code generated.")

            # Persist to DB
            for f in new_files:
                repo.upsert_file(db, workspace_id, name=f["name"], content=f["content"], type=f["type"])
            if wiring:
                repo.upsert_wiring(db, workspace_id, wiring)
            db.commit()

            modified = [f["name"] for f in new_files]
            text = f"Generation complete.\n\n{explanation}"
            if wiring:
                text += f"\n\n{_format_wiring_summary(wiring)}"
            return ToolResult(
                text=_truncate(text),
                files=new_files or None,
                wiring=wiring,
                auto_apply=True,
                files_modified=modified,
            )

        elif resolved == "VERIFY_ARDUINO":
            result = await run_generate("VERIFY_ARDUINO", files_as_dicts, "", device_mode, model_config)
            data = result["data"]
            valid = bool(data.get("valid"))
            errors = list(data.get("errors") or [])
            if valid:
                return ToolResult(text="✅ Code verification passed — no errors found.")
            return ToolResult(text=f"❌ Verification failed:\n" + "\n".join(f"• {e}" for e in errors))

        elif resolved == "VERIFY_PYTHON":
            result = await run_generate("VERIFY_PYTHON", files_as_dicts, "", device_mode, model_config)
            data = result["data"]
            valid = bool(data.get("valid"))
            errors = list(data.get("errors") or [])
            if valid:
                return ToolResult(text="✅ Code verification passed — no errors found.")
            return ToolResult(text=f"❌ Verification failed:\n" + "\n".join(f"• {e}" for e in errors))

        elif resolved == "DERIVE_WIRING":
            result = await run_generate("DERIVE_WIRING", files_as_dicts, "", device_mode, model_config)
            wiring = result["data"]
            repo.upsert_wiring(db, workspace_id, wiring)
            db.commit()
            return ToolResult(
                text=_truncate(_format_wiring_summary(wiring)),
                wiring=wiring,
                auto_apply=True,
            )

        elif resolved == "OPTIMIZE_CODE":
            result = await run_generate("OPTIMIZE_CODE", files_as_dicts, "", device_mode, model_config)
            data = result["data"]
            suggestions = list(data.get("suggestions") or [])
            explanation = str(data.get("explanation") or "")
            new_files = _normalize_files(data.get("files"))

            modified = []
            if new_files:
                for f in new_files:
                    repo.upsert_file(db, workspace_id, name=f["name"], content=f["content"], type=f["type"])
                db.commit()
                modified = [f["name"] for f in new_files]

            text_parts = []
            if suggestions:
                text_parts.append("Optimization suggestions:\n" + "\n".join(f"• {s}" for s in suggestions))
            if explanation:
                text_parts.append(explanation)
            return ToolResult(
                text=_truncate("\n\n".join(text_parts) or "Optimization complete."),
                files=new_files or None,
                auto_apply=bool(new_files),
                files_modified=modified,
            )

        elif resolved == "WEB_SEARCH":
            query = str(args.get("query") or "")
            context = str(args.get("context") or "")
            if not query:
                return ToolResult(text="WEB_SEARCH requires a query argument.")
            search_result = await web_search(query, context)
            summary = search_result.get("summary", "")
            scraped = search_result.get("scraped_text", "")
            sources = search_result.get("sources") or []
            sources_text = "\n".join(f"• {s['title']}: {s['url']}" for s in sources[:5])
            parts = [summary]
            if scraped:
                parts.append(f"\n\n--- Scraped Content ---\n{scraped}")
            if sources_text:
                parts.append(f"\n\nSources:\n{sources_text}")
            return ToolResult(text=_truncate("".join(parts)))

        elif resolved == "SEND_MESSAGE":
            return ToolResult(text=str(args.get("content") or ""))

        elif resolved == "APPLY_CHANGES":
            pf = pending_files or []
            pw = pending_wiring
            if not pf and not pw:
                return ToolResult(text="No pending changes to apply.")
            if pf:
                for f in pf:
                    repo.upsert_file(db, workspace_id, name=f["name"], content=f["content"], type=f.get("type", "code"))
            if pw:
                repo.upsert_wiring(db, workspace_id, pw)
            db.commit()
            modified = [f["name"] for f in pf]
            return ToolResult(
                text=f"Applied {len(pf)} file(s){' and updated wiring' if pw else ''}.",
                files=pf or None,
                wiring=pw,
                auto_apply=True,
                files_modified=modified,
            )

        elif resolved == "FETCH_PROMPTS":
            names = list(args.get("prompt_names") or args.get("names") or [])
            file_ctx = build_file_context(files_as_dicts)
            rendered = fetch_prompts(names, file_ctx)
            return ToolResult(text=_truncate(rendered))

        elif resolved == "READ_FILE":
            name = str(args.get("path") or args.get("name") or "")
            pf = repo.get_file(db, workspace_id, name)
            if not pf:
                return ToolResult(text=f"ERROR: File not found: {name}")
            return ToolResult(text=_truncate(f"--- {name} ---\n{pf.content}"))

        elif resolved == "LIST_FILES":
            names = [f.name for f in repo.list_files(db, workspace_id)]
            return ToolResult(text="\n".join(f"• {n}" for n in names) or "No files in project.")

        elif resolved == "WRITE_FILE":
            name = str(args.get("path") or args.get("name") or "")
            content = str(args.get("content") or "")
            if not name:
                return ToolResult(text="ERROR: WRITE_FILE requires a path argument.")
            repo.upsert_file(db, workspace_id, name=name, content=content)
            db.commit()
            return ToolResult(
                text=f"Wrote {name} ({len(content)} chars).",
                files_modified=[name],
            )

        else:
            return ToolResult(text=f"Unknown tool: {tool_name}")

    except Exception as exc:
        log.exception("Tool execution failed: %s %s", tool_name, exc)
        return ToolResult(text=f"ERROR: {exc}")
