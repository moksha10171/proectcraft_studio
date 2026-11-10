import json
from unittest.mock import AsyncMock

import pytest
from app.agent.providers import resolve_provider
from app.agent.tools import generate
from app.agent.streaming import stream_agent
from app.agent.loop import _build_tool_specs
from app.agent.tool_pairs import flatten_tool_results_for_api


@pytest.fixture(autouse=True)
def no_provider_keys(monkeypatch):
    for provider in ("GEMINI", "GROQ", "OPENAI", "ANTHROPIC"):
        monkeypatch.delenv(f"{provider}_API_KEY", raising=False)


def test_groq_only_environment(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    assert resolve_provider()[:2] == ("groq", "test-groq-key")


def test_keyless_local_model():
    assert resolve_provider({"provider": "custom", "model": "local-coder", "baseUrl": "http://localhost:11434/v1/"}) == (
        "custom", "", "local-coder", "http://localhost:11434/v1")


def test_explicit_provider_does_not_silently_use_gemini(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        resolve_provider({"provider": "openai", "model": "selected-model"})


@pytest.mark.parametrize("url", ["file:///tmp/model", "http://user:password@localhost/v1", ""])
def test_invalid_custom_url(url):
    with pytest.raises(ValueError):
        resolve_provider({"provider": "custom", "model": "local", "baseUrl": url})


@pytest.mark.asyncio
async def test_generation_uses_keyless_custom_model(monkeypatch):
    call = AsyncMock(return_value={"text": '{"files": [], "wiring": {"components": []}}'})
    monkeypatch.setattr(generate, "_call_openai_compatible", call)
    result = await generate.run_generate("GENERATE_ARDUINO", [], "Blink", model_config={
        "provider": "custom", "model": "local", "baseUrl": "http://localhost:11434/v1", "temperature": 0,
    })
    assert result["provider"] == "custom"
    assert result["model"] == "local"
    assert call.call_args.args[-2] == 0


@pytest.mark.asyncio
async def test_generation_groq_only(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-groq")
    call = AsyncMock(return_value={"text": '{"valid": true, "errors": []}'})
    monkeypatch.setattr(generate, "_call_openai_compatible", call)
    result = await generate.run_generate("VERIFY_PYTHON", [{"name": "main.py", "content": "pass"}])
    assert result["provider"] == "groq"
    assert result["data"]["valid"]


@pytest.mark.asyncio
async def test_no_keys_produces_actionable_stream_error():
    events = [json.loads(chunk.decode()[6:]) async for chunk in stream_agent({"messages": [{"role": "user", "content": "hello"}]})]
    assert events[0]["type"] == "error"
    assert "Models" in events[0]["message"]


def test_tool_schemas_expose_required_arguments():
    specs = {t["name"]: t for t in _build_tool_specs(["WRITE_FILE", "GENERATE_ARDUINO", "WEB_SEARCH"], "gemini")}
    assert specs["WRITE_FILE"]["input_schema"]["required"] == ["path", "content"]
    assert "prompt" in specs["GENERATE_ARDUINO"]["input_schema"]["properties"]
    assert "query" in specs["WEB_SEARCH"]["input_schema"]["properties"]


def test_saved_tool_turns_are_valid_provider_messages():
    assert flatten_tool_results_for_api([{"role": "tool", "content": "file written"}]) == [
        {"role": "user", "content": "[Tool result]: file written"}]


def test_wiring_fallback_does_not_invent_components():
    assert generate._basic_regex_wiring([{"content": "void setup() {} void loop() {}"}])["components"] == []


@pytest.mark.asyncio
async def test_openai_compatible_agent_receives_device_instructions(monkeypatch):
    from app.agent import loop
    captured = {}
    async def fake_stream(api_key, model, messages, *args):
        captured['messages'] = messages
        yield b'data: {"type":"done"}\n\n'
    monkeypatch.setattr(loop, '_stream_openai_compatible', fake_stream)
    stream = await loop._call_provider_turn('custom', '', 'local', [{'role': 'user', 'content': 'Blink'}],
                                            'Use Arduino APIs and explain wiring.', [], 0, 100, 'http://localhost/v1')
    _ = [chunk async for chunk in stream]
    assert captured['messages'][0] == {'role': 'system', 'content': 'Use Arduino APIs and explain wiring.'}
