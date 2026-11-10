import json
from unittest.mock import patch
import pytest
from app.agent.loop import run_agent_loop
from app.db.engine import SessionLocal
from app.db import repo


def event(value):
    return ('data: ' + json.dumps(value) + '\n\n').encode()


@pytest.mark.asyncio
@pytest.mark.parametrize('native', [True, False])
async def test_agent_writes_file_then_consumes_tool_result_and_usage(client, native):
    count = 0
    async def provider(*args):
        nonlocal count
        count += 1
        async def stream():
            if count == 1:
                call = {'tool': 'WRITE_FILE', 'args': {'path': 'sketch.ino', 'content': 'void setup(){} void loop(){}'}}
                if native:
                    yield event({'type': 'tool_call', **call, 'call_id': 'call-1'})
                else:
                    yield event({'type': 'text_delta', 'text': '```tool_call\n' + json.dumps(call) + '\n```'})
            else:
                assert any('Wrote sketch.ino' in m['content'] for m in args[3])
                assert all(m['role'] in ('user', 'assistant') for m in args[3])
                yield event({'type': 'text_delta', 'text': 'Saved your sketch.'})
            yield event({'type': 'done', 'stop_reason': 'stop'})
            yield event({'type': 'usage', 'prompt_tokens': 3, 'completion_tokens': 2, 'total_tokens': 5})
        return stream()
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', provider):
        chunks = [json.loads(c.decode()[6:]) async for c in run_agent_loop('test', 'Write a sketch', {
            'provider': 'custom', 'model': 'test-local', 'baseUrl': 'http://localhost:11434/v1',
            'supportsNativeTools': native,
        }, 'arduino', db)]
        assert count == 2
        assert repo.get_file(db, 'test', 'sketch.ino') is not None
        assert len([c for c in chunks if c['type'] == 'usage']) == 2
        assert any(c['type'] == 'tool_call_end' and c['status'] == 'success' for c in chunks)
        assert any(c['type'] == 'file_update' and c['name'] == 'sketch.ino' for c in chunks)
        assert chunks[-1]['type'] == 'done'
