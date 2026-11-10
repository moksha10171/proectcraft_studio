"""Structured AI generation shared by Studio buttons and agent tools."""
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.agent.tools.generate import run_generate

router = APIRouter(prefix="/generate", tags=["AI"])


class GenerateRequest(BaseModel):
    action: Literal["GENERATE_ARDUINO", "GENERATE_RPI", "VERIFY_ARDUINO", "VERIFY_PYTHON", "DERIVE_WIRING", "OPTIMIZE_CODE"]
    files: list[dict] = Field(default_factory=list, max_length=50)
    prompt: str = Field(default="", max_length=50_000)
    deviceMode: Literal["arduino", "raspberry-pi"] = "arduino"
    modelConfig: dict = Field(default_factory=dict)


@router.post("")
async def generate(body: GenerateRequest):
    try:
        result = await run_generate(body.action, body.files, body.prompt, body.deviceMode, body.modelConfig)
        return {"data": result["data"], "provider": result["provider"], "model": result["model"],
                "tokenUsage": {k: result[k] for k in ("prompt_tokens", "completion_tokens", "total_tokens")}}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(502, str(exc)) from exc
