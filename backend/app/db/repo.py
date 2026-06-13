"""Thin data-access helpers — all DB interaction goes through here."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import (
    AgentTurn, ChatMessage, ProjectFile, ToolCallRecord, Upload,
    UsageLog, Wiring, Workspace,
)


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Workspace ─────────────────────────────────────────────────────────────────

def get_workspace(session: Session, workspace_id: str) -> Workspace | None:
    return session.get(Workspace, workspace_id)


def get_or_create_workspace(
    session: Session,
    workspace_id: str,
    *,
    name: str = "Untitled",
    mode: str = "arduino",
) -> Workspace:
    ws = session.get(Workspace, workspace_id)
    if not ws:
        ws = Workspace(id=workspace_id, name=name, mode=mode)
        session.add(ws)
        session.flush()
    return ws


def update_workspace(session: Session, workspace_id: str, **fields: Any) -> Workspace | None:
    ws = session.get(Workspace, workspace_id)
    if not ws:
        return None
    for k, v in fields.items():
        setattr(ws, k, v)
    ws.updated_at = _now()
    session.flush()
    return ws


def list_workspaces(session: Session) -> list[Workspace]:
    return session.query(Workspace).order_by(Workspace.updated_at.desc()).all()


# ── Chat messages (UI transcript) ─────────────────────────────────────────────

def append_chat_message(
    session: Session,
    workspace_id: str,
    *,
    role: str,
    content: str,
    type: str = "text",
    model_name: str | None = None,
    thinking: str | None = None,
    token_count: int | None = None,
    msg_id: str | None = None,
) -> ChatMessage:
    msg = ChatMessage(
        id=msg_id or _uid(),
        workspace_id=workspace_id,
        role=role,
        type=type,
        content=content,
        model_name=model_name,
        thinking=thinking,
        token_count=token_count,
    )
    session.add(msg)
    session.flush()
    return msg


def list_chat_messages(session: Session, workspace_id: str) -> list[ChatMessage]:
    return (
        session.query(ChatMessage)
        .filter_by(workspace_id=workspace_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


def clear_chat_messages(session: Session, workspace_id: str) -> None:
    session.query(ChatMessage).filter_by(workspace_id=workspace_id).delete()
    session.flush()


# ── Agent turns (LLM context history) ────────────────────────────────────────

def next_seq(session: Session, workspace_id: str) -> int:
    last = (
        session.query(AgentTurn.seq)
        .filter_by(workspace_id=workspace_id)
        .order_by(AgentTurn.seq.desc())
        .first()
    )
    return (last[0] + 1) if last else 0


def append_agent_turn(
    session: Session,
    workspace_id: str,
    *,
    role: str,
    content: Any,
    tool: str | None = None,
    tool_call_id: str | None = None,
    token_estimate: int | None = None,
) -> AgentTurn:
    content_str = content if isinstance(content, str) else json.dumps(content)
    turn = AgentTurn(
        id=_uid(),
        workspace_id=workspace_id,
        seq=next_seq(session, workspace_id),
        role=role,
        content=content_str,
        tool=tool,
        tool_call_id=tool_call_id,
        token_estimate=token_estimate,
    )
    session.add(turn)
    session.flush()
    return turn


def list_agent_turns(session: Session, workspace_id: str) -> list[AgentTurn]:
    return (
        session.query(AgentTurn)
        .filter_by(workspace_id=workspace_id)
        .order_by(AgentTurn.seq.asc())
        .all()
    )


def compress_old_turns(session: Session, workspace_id: str, keep_last: int = 10) -> None:
    """Mark tool_result content of turns older than keep_last as compressed."""
    turns = list_agent_turns(session, workspace_id)
    to_compress = turns[:-keep_last] if len(turns) > keep_last else []
    for turn in to_compress:
        if not turn.compressed and turn.role == "tool":
            turn.content = json.dumps({"_compressed": True, "tool": turn.tool})
            turn.compressed = True
    session.flush()


def clear_agent_turns(session: Session, workspace_id: str) -> None:
    session.query(AgentTurn).filter_by(workspace_id=workspace_id).delete()
    session.flush()


# ── Tool call records ─────────────────────────────────────────────────────────

def create_tool_call(
    session: Session,
    workspace_id: str,
    *,
    tool: str,
    label: str = "",
    emoji: str = "🔧",
    args: dict | None = None,
    message_id: str | None = None,
    tc_id: str | None = None,
) -> ToolCallRecord:
    tc = ToolCallRecord(
        id=tc_id or _uid(),
        workspace_id=workspace_id,
        message_id=message_id,
        tool=tool,
        label=label,
        emoji=emoji,
        args_json=json.dumps(args or {}),
        status="running",
    )
    session.add(tc)
    session.flush()
    return tc


def finish_tool_call(
    session: Session,
    tc_id: str,
    *,
    status: str = "success",
    result: str | None = None,
    elapsed_ms: int | None = None,
    provider: str | None = None,
    model: str | None = None,
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
    total_tokens: int | None = None,
    files_modified: list[str] | None = None,
) -> ToolCallRecord | None:
    tc = session.get(ToolCallRecord, tc_id)
    if not tc:
        return None
    tc.status = status
    tc.result = result
    tc.elapsed_ms = elapsed_ms
    tc.provider = provider
    tc.model = model
    tc.prompt_tokens = prompt_tokens
    tc.completion_tokens = completion_tokens
    tc.total_tokens = total_tokens
    tc.files_modified_json = json.dumps(files_modified) if files_modified else None
    session.flush()
    return tc


def list_tool_calls(session: Session, workspace_id: str, limit: int = 100) -> list[ToolCallRecord]:
    return (
        session.query(ToolCallRecord)
        .filter_by(workspace_id=workspace_id)
        .order_by(ToolCallRecord.started_at.desc())
        .limit(limit)
        .all()
    )


# ── Project files ─────────────────────────────────────────────────────────────

def upsert_file(
    session: Session,
    workspace_id: str,
    *,
    name: str,
    content: str,
    type: str = "code",
    enabled: bool = True,
) -> ProjectFile:
    pf = (
        session.query(ProjectFile)
        .filter_by(workspace_id=workspace_id, name=name)
        .first()
    )
    if pf:
        pf.content = content
        pf.type = type
        pf.enabled = enabled
        pf.updated_at = _now()
    else:
        pf = ProjectFile(
            id=_uid(),
            workspace_id=workspace_id,
            name=name,
            content=content,
            type=type,
            enabled=enabled,
        )
        session.add(pf)
    session.flush()
    return pf


def get_file(session: Session, workspace_id: str, name: str) -> ProjectFile | None:
    return (
        session.query(ProjectFile)
        .filter_by(workspace_id=workspace_id, name=name, enabled=True)
        .first()
    )


def list_files(session: Session, workspace_id: str, enabled_only: bool = True) -> list[ProjectFile]:
    q = session.query(ProjectFile).filter_by(workspace_id=workspace_id)
    if enabled_only:
        q = q.filter_by(enabled=True)
    return q.order_by(ProjectFile.updated_at.asc()).all()


def delete_file(session: Session, workspace_id: str, name: str, soft: bool = True) -> bool:
    pf = session.query(ProjectFile).filter_by(workspace_id=workspace_id, name=name).first()
    if not pf:
        return False
    if soft:
        pf.enabled = False
    else:
        session.delete(pf)
    session.flush()
    return True


# ── Wiring manifest ───────────────────────────────────────────────────────────

def get_wiring(session: Session, workspace_id: str) -> dict | None:
    row = session.get(Wiring, workspace_id)
    if not row:
        return None
    try:
        return json.loads(row.manifest_json)
    except Exception:
        return None


def upsert_wiring(session: Session, workspace_id: str, manifest: dict) -> Wiring:
    row = session.get(Wiring, workspace_id)
    if row:
        row.manifest_json = json.dumps(manifest)
        row.updated_at = _now()
    else:
        row = Wiring(workspace_id=workspace_id, manifest_json=json.dumps(manifest))
        session.add(row)
    session.flush()
    return row


# ── Uploads ───────────────────────────────────────────────────────────────────

def create_upload(
    session: Session,
    workspace_id: str,
    *,
    filename: str,
    path: str,
    mime_type: str | None = None,
    size: int | None = None,
) -> Upload:
    up = Upload(
        id=_uid(),
        workspace_id=workspace_id,
        filename=filename,
        path=path,
        mime_type=mime_type,
        size=size,
    )
    session.add(up)
    session.flush()
    return up


def list_uploads(session: Session, workspace_id: str, enabled_only: bool = True) -> list[Upload]:
    q = session.query(Upload).filter_by(workspace_id=workspace_id)
    if enabled_only:
        q = q.filter_by(enabled=True)
    return q.order_by(Upload.created_at.desc()).all()


def disable_upload(session: Session, upload_id: str) -> bool:
    up = session.get(Upload, upload_id)
    if not up:
        return False
    up.enabled = False
    session.flush()
    return True


# ── Usage log ─────────────────────────────────────────────────────────────────

def log_usage(
    session: Session,
    workspace_id: str,
    *,
    provider: str | None,
    model: str | None,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    total_tokens: int = 0,
    task_type: str | None = None,
) -> UsageLog:
    entry = UsageLog(
        id=_uid(),
        workspace_id=workspace_id,
        provider=provider,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        task_type=task_type,
    )
    session.add(entry)
    session.flush()
    return entry


def workspace_token_totals(session: Session, workspace_id: str) -> dict:
    from sqlalchemy import func
    row = (
        session.query(
            func.sum(UsageLog.prompt_tokens),
            func.sum(UsageLog.completion_tokens),
            func.sum(UsageLog.total_tokens),
        )
        .filter_by(workspace_id=workspace_id)
        .first()
    )
    return {
        "prompt_tokens": int(row[0] or 0),
        "completion_tokens": int(row[1] or 0),
        "total_tokens": int(row[2] or 0),
    }
