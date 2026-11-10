import json
import httpx
import pytest
from app.agent import streaming


@pytest.mark.asyncio
@pytest.mark.parametrize('provider', ['gemini', 'openai', 'anthropic'])
async def test_provider_stream_text_tools_and_usage(monkeypatch, provider):
    packets = {
        'gemini': [
            {'candidates': [{'content': {'parts': [{'text': 'Hello'}, {'functionCall': {'name': 'READ_FILE', 'args': {'path': 'main.py'}}}]}}],
             'usageMetadata': {'promptTokenCount': 3, 'candidatesTokenCount': 2}},
        ],
        'openai': [
            {'choices': [{'delta': {'content': 'Hello', 'tool_calls': [{'index': 0, 'id': 'a', 'function': {'name': 'READ_FILE', 'arguments': '{"path":'}}]}}]},
            {'choices': [{'delta': {'tool_calls': [{'index': 0, 'function': {'arguments': '"main.py"}'}}]}, 'finish_reason': 'tool_calls'}]},
            {'usage': {'prompt_tokens': 3, 'completion_tokens': 2, 'total_tokens': 5}, 'choices': []},
        ],
        'anthropic': [
            {'type': 'message_start', 'message': {'usage': {'input_tokens': 3}}},
            {'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': 'Hello'}},
            {'type': 'content_block_start', 'index': 1, 'content_block': {'type': 'tool_use', 'id': 'a', 'name': 'READ_FILE'}},
            {'type': 'content_block_delta', 'index': 1, 'delta': {'type': 'input_json_delta', 'partial_json': '{"path":"main.py"}'}},
            {'type': 'content_block_stop', 'index': 1},
            {'type': 'message_delta', 'delta': {'stop_reason': 'tool_use'}, 'usage': {'output_tokens': 2}},
        ],
    }
    def handle(request):
        payload = json.loads(request.content)
        assert payload
        return httpx.Response(200, text=''.join('data: ' + json.dumps(p) + '\n\n' for p in packets[provider]))
    original = httpx.AsyncClient
    monkeypatch.setattr(streaming.httpx, 'AsyncClient', lambda **kwargs: original(transport=httpx.MockTransport(handle), **kwargs))
    messages = [{'role': 'user', 'content': 'Read my file'}]
    if provider == 'gemini':
        stream = streaming._stream_gemini('test-key', 'test-model', messages, 'Be useful')
    elif provider == 'anthropic':
        stream = streaming._stream_anthropic('test-key', 'test-model', messages, 'Be useful')
    else:
        stream = streaming._stream_openai_compatible('', 'test-model', messages, 'http://localhost:11434/v1', 'custom')
    events = [json.loads(chunk.decode()[6:]) async for chunk in stream]
    assert any(e['type'] == 'text_delta' and e['text'] == 'Hello' for e in events)
    assert any(e['type'] == 'tool_call' and e['args'] == {'path': 'main.py'} for e in events)
    assert any(e['type'] == 'usage' and e['total_tokens'] == 5 for e in events)
