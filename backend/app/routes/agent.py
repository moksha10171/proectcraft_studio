"""Agent routes — /api/agent endpoint drives the full backend loop."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.agent.registries.agents import get_workspace_agent
from app.agent.registries.prompts import PROMPT_INDEX
from app.agent.registries.tools import TOOL_REGISTRY
from app.db.engine import SessionLocal

router = APIRouter(prefix="/agent", tags=["agent"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/info")
def agent_info():
    """Agent registry metadata."""
    agent = get_workspace_agent()
    return {
        "success": True,
        "data": {
            **agent,
            "tools": TOOL_REGISTRY,
            "promptIndex": [{"name": p["name"], "description": p["description"]} for p in PROMPT_INDEX],
            "auth": "none",
            "mode": "local-first",
            "architecture": "backend-agent-loop",
        },
    }


@router.post("")
async def agent_post(request: Request, db: Session = Depends(get_db)):
    """Full backend agent loop — streams SSE events.

    New body shape (backend-owned loop):
      { workspaceId, message, modelConfig, mode }

    Legacy shape (single turn, forwarded to old stream_agent) is still
    accepted while the frontend migration completes:
      { messages, modelConfig, systemPrompt, tools, useNativeTools }
    """
    body = await request.json()

    workspace_id: str = body.get("workspaceId") or "default"
    user_message: str | None = body.get("message")
    model_config: dict = body.get("modelConfig") or {}
    mode: str = body.get("mode") or "arduino"

    if user_message:
        # New backend-owned loop path
        from app.agent.loop import run_agent_loop
        return StreamingResponse(
            run_agent_loop(workspace_id, user_message, model_config, mode, db),  # type: ignore[arg-type]
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    # Legacy fallback — single turn (used by ModelManager test button and old frontend)
    from app.agent.streaming import stream_agent
    return StreamingResponse(
        stream_agent(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
