"""SQLAlchemy engine, session factory, and database initialisation."""

from __future__ import annotations

import json
import logging
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import DATA_ROOT, STUDIO_DIR
from app.db.models import Base

log = logging.getLogger(__name__)

DB_PATH = DATA_ROOT / "projectcraft.db"

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ── JSON migration helpers ────────────────────────────────────────────────────

def _read_json(path: Path):
    if path.is_file():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None
    return None


def _migrate_existing_workspaces(session: Session) -> None:
    """One-time import of existing JSON workspaces into the DB."""
    from app.db.models import (
        AgentTurn, ChatMessage, ProjectFile, ToolCallRecord, Wiring, Workspace,
    )

    ws_root = STUDIO_DIR / "workspaces"
    if not ws_root.is_dir():
        return

    for ws_dir in ws_root.iterdir():
        if not ws_dir.is_dir():
            continue
        ws_id = ws_dir.name

        # Skip if already imported
        existing = session.get(Workspace, ws_id)
        if existing:
            continue

        # Messages (UI transcript)
        messages_raw = _read_json(ws_dir / "chat" / "messages.json") or []
        # Agent history turns
        history_raw = _read_json(ws_dir / "chat" / "agent-history.json") or []
        # Tool calls
        tool_calls_raw = _read_json(ws_dir / "chat" / "tool-calls.json") or []
        # Codebase meta (files list)
        meta_raw = _read_json(ws_dir / "codebase" / "meta.json") or {}
        # Wiring manifest
        wiring_raw = _read_json(ws_dir / "codebase" / "wiring.json")

        # Detect mode from meta
        mode = meta_raw.get("mode", "arduino")
        name = meta_raw.get("name", ws_id)

        ws = Workspace(id=ws_id, name=name, mode=mode)
        session.add(ws)

        # Import chat messages
        for i, msg in enumerate(messages_raw):
            role = msg.get("role", "user")
            session.add(ChatMessage(
                id=str(uuid.uuid4()),
                workspace_id=ws_id,
                role="assistant" if role == "model" else role,
                type="text",
                content=msg.get("text", ""),
                token_count=None,
            ))

        # Import agent turns
        for i, turn in enumerate(history_raw):
            role = turn.get("role", "user")
            parts = turn.get("parts", [])
            content = json.dumps(parts) if parts else json.dumps(turn.get("content", ""))
            session.add(AgentTurn(
                id=str(uuid.uuid4()),
                workspace_id=ws_id,
                seq=i,
                role=role,
                content=content,
                compressed=False,
            ))

        # Import tool call records
        for tc in tool_calls_raw:
            session.add(ToolCallRecord(
                id=tc.get("id", str(uuid.uuid4())),
                workspace_id=ws_id,
                tool=tc.get("action", tc.get("tool", "UNKNOWN")),
                label=tc.get("label", ""),
                emoji=tc.get("emoji", "🔧"),
                args_json=json.dumps(tc.get("args", {})),
                status=tc.get("status", "success"),
                result=tc.get("outputPreview", ""),
                elapsed_ms=tc.get("durationMs"),
                provider=tc.get("provider"),
                model=tc.get("model"),
            ))

        # Import project files
        files_list = meta_raw.get("files", [])
        for f in files_list:
            session.add(ProjectFile(
                id=str(uuid.uuid4()),
                workspace_id=ws_id,
                name=f.get("name", "sketch.ino"),
                content=f.get("content", ""),
                type=f.get("type", "code"),
                enabled=not f.get("readOnly", False),
            ))

        # Import wiring
        if wiring_raw:
            session.add(Wiring(
                workspace_id=ws_id,
                manifest_json=json.dumps(wiring_raw),
            ))

        log.info("Migrated workspace %s from JSON", ws_id)


def init_db() -> None:
    """Create tables and run one-time JSON migration if DB is fresh."""
    DATA_ROOT.mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=engine)

    # Enable WAL mode for better concurrent read performance
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.execute(text("PRAGMA foreign_keys=ON"))
        conn.commit()

    # One-time migration from JSON files
    with SessionLocal() as session:
        from app.db.models import Workspace
        count = session.query(Workspace).count()
        if count == 0:
            try:
                _migrate_existing_workspaces(session)
                session.commit()
            except Exception as exc:
                log.warning("JSON migration failed (non-fatal): %s", exc)
                session.rollback()

    log.info("Database ready at %s", DB_PATH)
