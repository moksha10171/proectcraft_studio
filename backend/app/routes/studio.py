"""Studio routes — workspace, files, wiring, and uploads.

All state is persisted in SQLite via app.db.repo; the JSON file workspace store
is kept only as a migration source (handled at startup in engine.py).
"""

from __future__ import annotations

import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import UPLOADS_DIR
from app.db.engine import SessionLocal
from app.db import repo

router = APIRouter(prefix="/studio", tags=["studio"])


# ── Dependency ─────────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _now_ms() -> int:
    return int(time.time() * 1000)


def _ws_id(raw: str | None) -> str:
    return raw or "default"


# ── /workspace — backward-compatible envelope ──────────────────────────────────

class WorkspacePutBody(BaseModel):
    workspaceId: Optional[str] = "default"
    section: str
    data: Optional[dict] = None


@router.get("/workspace")
def get_workspace(
    workspaceId: Optional[str] = Query(default="default"),
    section: str = Query(default="all"),
    db: Session = Depends(get_db),
):
    ws_id = _ws_id(workspaceId)
    ws = repo.get_or_create_workspace(db, ws_id)
    db.commit()

    if section == "chat":
        return {"success": True, "data": _load_chat(db, ws_id)}
    if section == "input":
        return {"success": True, "data": {"draft": "", "updatedAt": _now_ms()}}
    if section == "codebase":
        return {"success": True, "data": _load_codebase(db, ws_id, ws)}
    # all
    out = {
        "workspaceId": ws_id,
        "chat": _load_chat(db, ws_id),
        "codebase": _load_codebase(db, ws_id, ws),
    }
    return {"success": True, "data": out}


@router.put("/workspace")
def put_workspace(body: WorkspacePutBody, db: Session = Depends(get_db)):
    ws_id = _ws_id(body.workspaceId)
    repo.get_or_create_workspace(db, ws_id)

    data = body.data or {}
    if body.section == "chat":
        # Persist chat messages
        if "messages" in data:
            repo.clear_chat_messages(db, ws_id)
            for msg in data["messages"]:
                role = msg.get("role", "user")
                repo.append_chat_message(
                    db,
                    ws_id,
                    role="assistant" if role == "model" else role,
                    content=msg.get("text", msg.get("content", "")),
                    type="text",
                )
        db.commit()
        return {"success": True}

    if body.section == "codebase":
        # Persist files
        files = data.get("files", [])
        for f in files:
            repo.upsert_file(
                db,
                ws_id,
                name=f.get("name", "sketch.ino"),
                content=f.get("content", ""),
                type=f.get("type", "code"),
            )
        # Persist wiring
        wiring = data.get("wiring")
        if wiring:
            repo.upsert_wiring(db, ws_id, wiring)
        # Persist mode
        mode = data.get("mode")
        if mode:
            repo.update_workspace(db, ws_id, mode=mode)
        db.commit()
        return {"success": True}

    if body.section == "input":
        # Input draft is ephemeral — no-op (not worth persisting)
        return {"success": True}

    return {"success": False, "error": "Invalid section"}


@router.delete("/workspace")
def delete_workspace(
    workspaceId: Optional[str] = Query(default="default"),
    section: str = Query(default="chat"),
    db: Session = Depends(get_db),
):
    ws_id = _ws_id(workspaceId)
    if section == "chat":
        repo.clear_chat_messages(db, ws_id)
        repo.clear_agent_turns(db, ws_id)
        db.commit()
        return {"success": True}
    return {"success": False, "error": "Invalid section"}


# ── /files ────────────────────────────────────────────────────────────────────

class FilePutBody(BaseModel):
    workspaceId: Optional[str] = "default"
    name: str
    content: str
    type: Optional[str] = "code"
    enabled: Optional[bool] = True


class FileDeleteBody(BaseModel):
    workspaceId: Optional[str] = "default"
    name: str


@router.get("/files")
def list_files(
    workspaceId: Optional[str] = Query(default="default"),
    db: Session = Depends(get_db),
):
    ws_id = _ws_id(workspaceId)
    repo.get_or_create_workspace(db, ws_id)
    db.commit()
    files = repo.list_files(db, ws_id)
    return {
        "success": True,
        "files": [
            {
                "name": f.name,
                "content": f.content,
                "type": f.type,
                "enabled": f.enabled,
                "updatedAt": f.updated_at.isoformat() if f.updated_at else None,
            }
            for f in files
        ],
    }


@router.put("/files")
def upsert_file(body: FilePutBody, db: Session = Depends(get_db)):
    ws_id = _ws_id(body.workspaceId)
    repo.get_or_create_workspace(db, ws_id)
    repo.upsert_file(
        db,
        ws_id,
        name=body.name,
        content=body.content,
        type=body.type or "code",
        enabled=body.enabled if body.enabled is not None else True,
    )
    db.commit()
    return {"success": True}


@router.delete("/files")
def delete_file(body: FileDeleteBody, db: Session = Depends(get_db)):
    ws_id = _ws_id(body.workspaceId)
    ok = repo.delete_file(db, ws_id, body.name, soft=True)
    if not ok:
        raise HTTPException(status_code=404, detail="File not found")
    db.commit()
    return {"success": True}


# ── /wiring ───────────────────────────────────────────────────────────────────

class WiringPutBody(BaseModel):
    workspaceId: Optional[str] = "default"
    manifest: dict


@router.get("/wiring")
def get_wiring(
    workspaceId: Optional[str] = Query(default="default"),
    db: Session = Depends(get_db),
):
    ws_id = _ws_id(workspaceId)
    manifest = repo.get_wiring(db, ws_id)
    return {"success": True, "manifest": manifest}


@router.put("/wiring")
def put_wiring(body: WiringPutBody, db: Session = Depends(get_db)):
    ws_id = _ws_id(body.workspaceId)
    repo.get_or_create_workspace(db, ws_id)
    repo.upsert_wiring(db, ws_id, body.manifest)
    db.commit()
    return {"success": True}


# ── /uploads ──────────────────────────────────────────────────────────────────

@router.post("/uploads")
async def upload_file(
    workspaceId: str = Query(default="default"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ws_id = _ws_id(workspaceId)
    repo.get_or_create_workspace(db, ws_id)
    db.commit()

    # Save file to disk
    uid = str(uuid.uuid4())
    safe_name = Path(file.filename or "upload").name
    dest_dir = UPLOADS_DIR / ws_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / f"{uid}_{safe_name}"
    content = await file.read()
    dest_path.write_bytes(content)

    # Relative path from DATA_ROOT
    relative_path = str(dest_path.relative_to(UPLOADS_DIR.parent))

    record = repo.create_upload(
        db,
        ws_id,
        filename=safe_name,
        path=relative_path,
        mime_type=file.content_type,
        size=len(content),
    )
    db.commit()

    return {
        "success": True,
        "id": record.id,
        "filename": safe_name,
        "url": f"/api/studio/uploads/{record.id}",
        "size": len(content),
        "mimeType": file.content_type,
    }


@router.get("/uploads")
def list_uploads(
    workspaceId: Optional[str] = Query(default="default"),
    db: Session = Depends(get_db),
):
    ws_id = _ws_id(workspaceId)
    uploads = repo.list_uploads(db, ws_id)
    return {
        "success": True,
        "uploads": [
            {
                "id": u.id,
                "filename": u.filename,
                "mimeType": u.mime_type,
                "size": u.size,
                "url": f"/api/studio/uploads/{u.id}",
                "createdAt": u.created_at.isoformat() if u.created_at else None,
            }
            for u in uploads
        ],
    }


@router.get("/uploads/{upload_id}")
def serve_upload(upload_id: str, db: Session = Depends(get_db)):
    from app.config import DATA_ROOT
    from app.db.models import Upload as UploadModel

    record = db.get(UploadModel, upload_id)
    if not record or not record.enabled:
        raise HTTPException(status_code=404, detail="Upload not found")

    full_path = DATA_ROOT / record.path
    if not full_path.is_file():
        raise HTTPException(status_code=404, detail="File missing from disk")

    return FileResponse(
        path=str(full_path),
        media_type=record.mime_type or "application/octet-stream",
        filename=record.filename,
    )


@router.delete("/uploads/{upload_id}")
def delete_upload(upload_id: str, db: Session = Depends(get_db)):
    ok = repo.disable_upload(db, upload_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Upload not found")
    db.commit()
    return {"success": True}


# ── Private serialisation helpers ─────────────────────────────────────────────

def _load_chat(db: Session, ws_id: str) -> dict:
    msgs = repo.list_chat_messages(db, ws_id)
    turns = repo.list_agent_turns(db, ws_id)
    tool_calls = repo.list_tool_calls(db, ws_id)
    import json
    return {
        "messages": [
            {
                "role": "model" if m.role == "assistant" else m.role,
                "text": m.content,
                "isError": m.type == "error",
            }
            for m in msgs
        ],
        "agentHistory": [
            {
                "role": t.role,
                "parts": json.loads(t.content) if t.content.startswith("[") else [{"text": t.content}],
            }
            for t in turns
        ],
        "toolCalls": [
            {
                "id": tc.id,
                "action": tc.tool,
                "label": tc.label,
                "emoji": tc.emoji,
                "status": tc.status,
                "durationMs": tc.elapsed_ms,
                "outputPreview": tc.result,
                "provider": tc.provider,
                "model": tc.model,
                "tokenUsage": {
                    "prompt": tc.prompt_tokens or 0,
                    "completion": tc.completion_tokens or 0,
                    "total": tc.total_tokens or 0,
                } if tc.total_tokens else None,
                "filesModified": json.loads(tc.files_modified_json) if tc.files_modified_json else [],
            }
            for tc in tool_calls
        ],
        "updatedAt": _now_ms(),
    }


def _load_codebase(db: Session, ws_id: str, ws) -> dict:
    files = repo.list_files(db, ws_id)
    wiring = repo.get_wiring(db, ws_id)
    return {
        "files": [
            {"name": f.name, "content": f.content, "type": f.type}
            for f in files
        ],
        "wiring": wiring,
        "mode": ws.mode,
        "name": ws.name,
        "updatedAt": _now_ms(),
    }
