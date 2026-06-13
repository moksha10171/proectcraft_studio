from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import APIRouter

from app.agent.registries.agents import WORKSPACE_AGENT_NAME
from app.agent.settings import DEFAULT_GEMINI_MODEL, DEFAULT_GROQ_MODEL
from app.config import DB_PATH, PROJECTS_DIR, STUDIO_DIR
from app.routes.projects import _get_categories, _get_projects

router = APIRouter(tags=["health"])


def _db_status() -> dict:
    try:
        from app.db.engine import SessionLocal
        from app.db.models import Workspace
        with SessionLocal() as s:
            count = s.query(Workspace).count()
        return {"status": "ok", "workspaces": count, "path": str(DB_PATH)}
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


def _has_key(name: str) -> bool:
    return bool(os.environ.get(name, "").strip())


@router.get("/health")
def health():
    has_gemini = _has_key("GEMINI_API_KEY") or _has_key("NEXT_PUBLIC_GEMINI_API_KEY")
    has_groq = _has_key("GROQ_API_KEY")
    has_ai = has_gemini or has_groq

    try:
        projects = _get_projects()
        categories = _get_categories()
        data_ok = True
        project_count = len(projects)
        category_count = len(categories)
    except Exception:
        data_ok = False
        project_count = 0
        category_count = 0

    env_status = "ok" if has_ai else "needs_config"

    return {
        "status": "healthy" if data_ok else "degraded",
        "mode": "open-source",
        "auth": "none",
        "backend": "python",
        "checks": {
            "server": {
                "status": "ok",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            "environment": {
                "status": env_status,
                "hasGeminiKey": has_gemini,
                "hasGroqKey": has_groq,
                "hasAiProvider": has_ai,
                "geminiModel": DEFAULT_GEMINI_MODEL,
                "groqModel": DEFAULT_GROQ_MODEL,
            },
            "agent": {
                "status": "ok",
                "name": WORKSPACE_AGENT_NAME,
                "endpoint": "/api/agent",
            },
            "data": {
                "status": "ok" if data_ok else "error",
                "projectCount": project_count,
                "categoryCount": category_count,
                "projectsDir": str(PROJECTS_DIR),
                "studioDir": str(STUDIO_DIR),
            },
            "database": _db_status(),
        },
        "setup": {
            "envFile": "frontend/.env.local",
            "exampleFile": ".env.local.example",
            "docs": "docs/SETUP.md",
        },
    }
