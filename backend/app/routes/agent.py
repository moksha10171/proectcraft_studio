"""Agent routes — /api/agent endpoint drives the full backend loop."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Literal
from app.routes.studio import _ws_id
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


class AgentRequest(BaseModel):
    workspaceId: str = "default"
    message: str | None = Field(default=None, max_length=50_000)
    modelConfig: dict = Field(default_factory=dict)
    intent: Literal['explain', 'debug', 'modify'] = 'modify'
    mode: Literal["arduino", "raspberry-pi"] = "arduino"
    messages: list[dict] = Field(default_factory=list, max_length=500)
    systemPrompt: str = ""
    tools: list[dict] | None = None
    useNativeTools: bool = False


@router.post("")
async def agent_post(request: AgentRequest, db: Session = Depends(get_db)):
    """Full backend agent loop — streams SSE events.

    New body shape (backend-owned loop):
      { workspaceId, message, modelConfig, mode }

    Legacy shape (single turn, forwarded to old stream_agent) is still
    accepted while the frontend migration completes:
      { messages, modelConfig, systemPrompt, tools, useNativeTools }
    """
    body = request.model_dump()
    _ws_id(request.workspaceId)

    workspace_id: str = body.get("workspaceId") or "default"
    user_message: str | None = body.get("message")
    model_config: dict = body.get("modelConfig") or {}
    mode: str = body.get("mode") or "arduino"
    from app.db.models import ExperimentProject
    if db.get(ExperimentProject, workspace_id):
        from app.services.experiments import get_project
        from app.domain.project import BOARDS
        mode = BOARDS[get_project(db, workspace_id).boardId]['mode']

    if user_message:
        # New backend-owned loop path
        from app.agent.loop import run_agent_loop
        return StreamingResponse(
            run_agent_loop(workspace_id, user_message, model_config, mode, db, intent=request.intent),  # type: ignore[arg-type]
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
