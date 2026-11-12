"""CHECK_WIRING / INSPECT_RECORDING reach the assistant as read-only tools grounded in stored data."""
import json
import uuid
from unittest.mock import patch

import pytest

from app.agent.device_tools import get_tools_for_device_mode
from app.agent.loop import run_agent_loop
from app.db.engine import SessionLocal
from app.db.models import ExperimentRun


def create(client, **kwargs):
    response = client.post('/api/workbench/projects', json={'name': 'Tool test', **kwargs})
    assert response.status_code == 200, response.text
    return response.json()


CONFIG = {'provider': 'custom', 'model': 'local', 'baseUrl': 'http://localhost:11434/v1', 'supportsNativeTools': True}


async def ask_tools(project_id, tools, intent='explain'):
    """Drive the real loop with a stub provider that calls each tool once; return the tool results it received."""
    received, turn = {}, 0

    async def provider(*args):
        nonlocal turn
        turn += 1
        messages = args[3]
        async def stream():
            if turn == 1:
                for index, tool in enumerate(tools):
                    yield ('data: ' + json.dumps({'type': 'tool_call', 'tool': tool, 'args': {}, 'call_id': f'call-{index}'}) + '\n\n').encode()
            else:
                for message in messages:
                    if message.get('call_id'):
                        received[message['tool']] = message['content']
                yield b'data: {"type":"text_delta","text":"done"}\n\n'
            yield b'data: {"type":"done"}\n\n'
        return stream()

    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', provider):
        events = [json.loads(chunk.decode()[6:]) async for chunk in run_agent_loop(project_id, 'Why is my LED not lighting?', CONFIG, 'arduino', db, intent=intent)]
    return received, events


def test_wiring_endpoint_reports_findings_with_revision(client):
    project = create(client, template='button')
    clean = client.get(f'/api/workbench/projects/{project["id"]}/wiring-check').json()
    assert clean['supported'] and clean['revision'] == 1 and clean['findings'] == []
    broken = {k: project[k] for k in ('name', 'boardId', 'coreVersion', 'files', 'dependencies', 'notes')}
    broken['files'] = [{'name': 'sketch.ino', 'content': 'void setup(){ pinMode(2, INPUT); }\nvoid loop(){ digitalRead(2); }'}]
    broken['circuit'] = project['circuit']
    assert client.put(f'/api/workbench/projects/{project["id"]}', json={'baseRevision': 1, 'content': broken}).status_code == 200
    result = client.get(f'/api/workbench/projects/{project["id"]}/wiring-check').json()
    assert result['revision'] == 2
    assert [f['code'] for f in result['findings']] == ['floating-button']
    assert client.get('/api/workbench/projects/missing/wiring-check').status_code in (404, 409)


def test_tools_are_available_for_arduino_and_hidden_from_pi_mode():
    assert {'CHECK_WIRING', 'INSPECT_RECORDING'} <= set(get_tools_for_device_mode('arduino'))
    assert not {'CHECK_WIRING', 'INSPECT_RECORDING'} & set(get_tools_for_device_mode('raspberry-pi'))


@pytest.mark.asyncio
async def test_explain_intent_can_check_wiring_and_read_recordings_without_writing(client):
    project = create(client, template='button')
    base = f'/api/workbench/projects/{project["id"]}'
    received, events = await ask_tools(project['id'], ['CHECK_WIRING', 'INSPECT_RECORDING'])
    assert 'No wiring issues found' in received['CHECK_WIRING'] and 'board:D2' in received['CHECK_WIRING']
    assert 'No emulator recording exists' in received['INSPECT_RECORDING']
    assert not any(e['type'] in ('patch_ready', 'error') for e in events)
    assert client.get(base + '/patches').json() == [] and client.get(base).json()['revision'] == 1

    trace = [{'timeUs': 0, 'pin': 'D13', 'value': 0}, *[{'timeUs': t + d, 'pin': 'D13', 'value': v} for t in (0, 2_000_000, 4_000_000) for d, v in ((0, 1), (1_000_000, 0))]]
    document = {'id': uuid.uuid4().hex, 'projectId': project['id'], 'origin': 'emulator', 'engine': 'avr8js-atmega328p', 'sourceRevision': 1, 'startedAt': '2026-01-01T00:00:00Z',
                'durationMs': 5000, 'dropped': 0, 'valid': True, 'status': 'recorded', 'trace': trace}
    with SessionLocal() as db:
        db.add(ExperimentRun(id=document['id'], project_id=project['id'], document=json.dumps(document)))
        db.commit()
    received, _ = await ask_tools(project['id'], ['INSPECT_RECORDING'])
    text = received['INSPECT_RECORDING']
    assert 'emulator' in text and 'D13' in text and '0.500 Hz' in text and 'matches the current revision' in text
    assert client.get(base).json()['revision'] == 1
