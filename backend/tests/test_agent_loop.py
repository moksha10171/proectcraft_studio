"""The assistant loop drives a draft: inspect → edit → verify → one reviewed proposal."""
import json
from unittest.mock import AsyncMock, patch

import pytest

from app.agent.loop import run_agent_loop
from app.agent.prompt import system_prompt
from app.agent.session import TOOL_MAP, ProjectSession, available_tools
from app.db import repo
from app.db.engine import SessionLocal

NATIVE = {'provider': 'custom', 'model': 'local', 'baseUrl': 'http://localhost:11434/v1', 'supportsNativeTools': True}
TEXT = {**NATIVE, 'supportsNativeTools': False}
PASSED = {'status': 'passed', 'engine': 'arduino-cli', 'valid': True, 'output': 'Sketch uses 924 bytes (2%) of program storage space.', 'diagnostics': []}
FAILED = {'status': 'failed', 'engine': 'arduino-cli', 'valid': False, 'output': 'error', 'diagnostics': [
    {'severity': 'error', 'file': 'sketch.ino', 'line': 4, 'column': 3, 'message': "'digitalWrit' was not declared in this scope"}]}


def create(client, template='blink'):
    response = client.post('/api/workbench/projects', json={'name': 'Agent test', 'template': template})
    assert response.status_code == 200, response.text
    return response.json()


def sse(value):
    return ('data: ' + json.dumps(value) + '\n\n').encode()


class Script:
    """A provider that plays scripted turns and records what it was sent."""

    def __init__(self, *turns, native=True):
        self.turns, self.native, self.requests = list(turns), native, []

    async def __call__(self, provider, key, model, messages, system, tools, *rest):
        self.requests.append({'messages': messages, 'system': system, 'tools': tools})
        turn = self.turns.pop(0) if self.turns else {'text': 'Done.'}
        async def stream():
            if turn.get('text'):
                yield sse({'type': 'text_delta', 'text': turn['text']})
            for index, (tool, args) in enumerate(turn.get('calls', [])):
                if self.native:
                    yield sse({'type': 'tool_call', 'tool': tool, 'args': args, 'call_id': f'c{len(self.requests)}-{index}'})
                else:
                    yield sse({'type': 'text_delta', 'text': '```tool_call\n' + json.dumps({'tool': tool, 'args': args}) + '\n```'})
            yield sse({'type': 'usage', 'prompt_tokens': 3, 'completion_tokens': 2, 'total_tokens': 5})
            yield sse({'type': 'done'})
        return stream()

    def results(self, request_index):
        """Tool results that were new in a request (produced by the previous turn's calls)."""
        def collect(index):
            return [m['content'] for m in self.requests[index]['messages'] if m.get('call_id')]
        return collect(request_index)[len(collect(request_index - 1)):] if request_index else collect(0)


async def run(project_id, message, script, config=NATIVE, intent='modify', compile_result=PASSED):
    compile_mock = AsyncMock(return_value=dict(compile_result))
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', script), patch('app.services.builds.compile_content', compile_mock):
        events = [json.loads(c.decode()[6:]) async for c in run_agent_loop(project_id, message, config, 'arduino', db, intent=intent)]
    return events, compile_mock


@pytest.mark.asyncio
async def test_edit_check_and_hand_over_one_verified_proposal(client):
    project = create(client)
    script = Script(
        {'calls': [('READ_FILE', {'path': 'sketch.ino'})]},
        {'calls': [('EDIT_FILE', {'path': 'sketch.ino', 'old_text': 'delay(1000);', 'new_text': 'delay(250);', 'replace_all': True})]},
        {'calls': [('CHECK_PROJECT', {}), ('CHECK_WIRING', {})]},
        {'text': 'Changed both delays to 250 ms (sketch.ino:9). The draft build passed.'},
    )
    events, compile_mock = await run(project['id'], 'Blink four times faster', script)
    assert [e['type'] for e in events].count('patch_ready') == 1 and events[-1]['type'] == 'done'
    patch_event = next(e['patch'] for e in events if e['type'] == 'patch_ready')
    sketch = next(f for f in patch_event['after']['files'] if f['name'] == 'sketch.ino')['content']
    assert sketch.count('delay(250);') == 2 and 'delay(1000)' not in sketch
    assert patch_event['explanation'].startswith('Changed both delays')
    assert patch_event['verification']['build']['status'] == 'passed'
    assert 'Sketch uses 924 bytes' in patch_event['verification']['build']['summary']
    assert 'wiring' in patch_event['verification']
    assert compile_mock.await_count == 1, 'the model checked its final draft, so hand-over does not compile again'
    # The draft was compiled, not the saved project, which is unchanged until the user applies.
    assert 'delay(250);' in compile_mock.await_args.args[0].files[0].content
    saved = client.get(f'/api/workbench/projects/{project["id"]}').json()
    assert saved['revision'] == 1 and saved['files'] == project['files']
    read_result = script.results(1)[0]
    assert ' 1| ' in read_result or '1| ' in read_result.split('\n')[1]
    assert 'Draft build (not saved' in script.results(3)[0]


@pytest.mark.asyncio
async def test_hand_over_verifies_a_draft_the_model_did_not_check(client):
    project = create(client)
    script = Script({'calls': [('EDIT_FILE', {'path': 'sketch.ino', 'old_text': 'LED_BUILTIN, OUTPUT', 'new_text': 'LED_BUILTIN, OUTPUT); // led'})]},
                    {'text': 'Done.'})
    events, compile_mock = await run(project['id'], 'Comment the pin', script, compile_result=FAILED)
    assert compile_mock.await_count == 1
    assert any(e['type'] == 'tool_call_start' and e['label'] == 'Verify proposal build' for e in events)
    verification = next(e['patch'] for e in events if e['type'] == 'patch_ready')['verification']
    assert verification['build']['status'] == 'failed'
    assert "sketch.ino:4:3: 'digitalWrit' was not declared" in verification['build']['summary']


@pytest.mark.asyncio
async def test_edit_errors_are_specific_enough_to_self_correct(client):
    project = create(client)
    script = Script(
        {'calls': [('EDIT_FILE', {'path': 'sketch.ino', 'old_text': 'delay(1000);', 'new_text': 'delay(5);'}),
                   ('EDIT_FILE', {'path': 'sketch.ino', 'old_text': 'digitalWrite(LED_BUILTIN, HIGHH);', 'new_text': 'x'}),
                   ('EDIT_FILE', {'path': 'main.cpp', 'old_text': 'a', 'new_text': 'b'}),
                   ('WRITE_FILE', {'path': '../escape.h', 'content': ''}),
                   ('READ_FILE', {}),
                   ('MAKE_COFFEE', {})]},
        {'text': 'Nothing changed.'},
    )
    events, _ = await run(project['id'], 'Try things', script)
    results = script.results(1)
    assert 'occurs 2 times' in results[0] and 'replace_all' in results[0]
    assert 'not found' in results[1] and 'closest line' in results[1]
    assert 'main.cpp does not exist' in results[2] and 'sketch.ino' in results[2]
    assert 'was not written' in results[3]
    assert 'requires path' in results[4]
    assert 'no tool named MAKE_COFFEE' in results[5]
    assert not any(e['type'] in ('patch_ready', 'error') for e in events), 'failed tools never abort the run or stage changes'
    assert [e['status'] for e in events if e['type'] == 'tool_call_end'] == ['error'] * 6


@pytest.mark.asyncio
async def test_explain_intent_cannot_edit_and_continues_with_an_explanation(client):
    project = create(client)
    script = Script({'calls': [('EDIT_FILE', {'path': 'sketch.ino', 'old_text': 'HIGH', 'new_text': 'LOW', 'replace_all': True})]},
                    {'text': 'Swap HIGH and LOW in sketch.ino to invert it.'})
    events, _ = await run(project['id'], 'How would I invert it?', script, intent='explain')
    assert 'explain mode is read-only' in script.results(1)[0]
    assert {t['name'] for t in script.requests[0]['tools']} == {'LIST_FILES', 'READ_FILE', 'CHECK_PROJECT', 'CHECK_WIRING', 'INSPECT_RECORDING', 'RUN_SIMULATION', 'BOARD_INFO'}
    assert not any(e['type'] == 'patch_ready' for e in events)
    assert client.get(f'/api/workbench/projects/{project["id"]}/patches').json() == []


@pytest.mark.asyncio
async def test_snapshot_reaches_the_model_but_not_stored_history(client):
    project = create(client, 'button')
    script = Script({'text': 'It reads D2.'})
    await run(project['id'], 'What does this do?', script)
    latest = script.requests[0]['messages'][-1]['content']
    assert latest.startswith('<project-state>') and latest.endswith('What does this do?')
    assert 'Arduino Uno' in latest and 'Never built.' in latest and 'No wiring issues found' in latest and 'No simulation recording yet' in latest
    assert 'board:D2' in latest, 'the circuit is described compactly for the model'
    with SessionLocal() as db:
        stored = [t.content for t in repo.list_agent_turns(db, project['id']) if t.role == 'user']
    assert stored == ['What does this do?']
    script = Script({'text': 'Still D2.'})
    await run(project['id'], 'And now?', script)
    earlier = [m['content'] for m in script.requests[0]['messages'] if m['role'] == 'user']
    assert earlier[0] == 'What does this do?' and earlier[-1].startswith('<project-state>')


@pytest.mark.asyncio
async def test_text_fallback_lists_tools_and_parses_calls(client):
    project = create(client)
    script = Script({'calls': [('BOARD_INFO', {})]}, {'text': 'D9 supports PWM.'}, native=False)
    events, _ = await run(project['id'], 'Which pins do PWM?', script, config=TEXT)
    assert script.requests[0]['tools'] is None
    assert '- EDIT_FILE(path, old_text, new_text, replace_all)' in script.requests[0]['system']
    assert 'PWM (analogWrite) pins: D3, D5, D6, D9, D10, D11' in script.requests[1]['messages'][-1]['content']
    assert any(e['type'] == 'tool_call_end' and e['status'] == 'success' for e in events)


@pytest.mark.asyncio
async def test_non_project_workspaces_are_refused(client):
    with SessionLocal() as db:
        events = [json.loads(c.decode()[6:]) async for c in run_agent_loop('scratch', 'Write a sketch', NATIVE, 'arduino', db)]
        assert repo.get_file(db, 'scratch', 'sketch.ino') is None
    assert events == [{'type': 'error', 'message': 'The assistant works on Studio projects. Open or create a project first.'}]


def test_tool_catalog_is_described_and_scoped_by_board(client, monkeypatch):
    monkeypatch.delenv('SERPER_API_KEY', raising=False)
    monkeypatch.delenv('BRAVE_SEARCH_API_KEY', raising=False)
    assert all(len(t['description']) > 60 for t in TOOL_MAP.values())
    assert TOOL_MAP['EDIT_FILE']['input_schema']['required'] == ['path', 'old_text', 'new_text']
    assert 'WEB_SEARCH' not in available_tools('modify', 'uno')
    monkeypatch.setenv('SERPER_API_KEY', 'configured')
    assert 'WEB_SEARCH' in available_tools('modify', 'uno')
    assert 'CHECK_WIRING' not in available_tools('modify', 'pi4') and 'INSPECT_RECORDING' in available_tools('modify', 'pi4')
    assert 'Python 3' in system_prompt('debug', 'raspberry-pi', [], True) and 'Intent: debug' in system_prompt('debug', 'raspberry-pi', [], True)


@pytest.mark.asyncio
async def test_session_reads_long_files_in_pages(client):
    project = create(client)
    body = '\n'.join(f'// line {i}' for i in range(1, 1001))
    with SessionLocal() as db:
        session = ProjectSession(db, project['id'])
        assert not (await session.run('WRITE_FILE', {'path': 'notes.h', 'content': body})).error
        first = (await session.run('READ_FILE', {'path': 'notes.h'})).text
        assert '400| // line 400' in first and 'offset 401' in first
        second = (await session.run('READ_FILE', {'path': 'notes.h', 'offset': 401})).text
        assert '401| // line 401' in second
        hint = (await session.run('EDIT_FILE', {'path': 'notes.h', 'old_text': '  7| // line 7', 'new_text': 'x'})).text
        assert 'line-number prefixes' in hint
        listing = (await session.run('LIST_FILES', {})).text
        assert 'notes.h (1000 lines) (draft)' in listing


WITH_ARTIFACT = {**PASSED, 'artifact': {'format': 'intel-hex', 'content': ':00000001FF', 'sha256': 'x'}}


def blink_trace(period_us, cycles):
    half = period_us // 2
    events = [{'timeUs': 0, 'pin': 'D13', 'value': 0}]
    for i in range(cycles):
        events += [{'timeUs': i * period_us + half // 1000, 'pin': 'D13', 'value': 1}, {'timeUs': i * period_us + half, 'pin': 'D13', 'value': 0}]
    return events


async def run_with_browser(project_id, script, answer, config=NATIVE, intent='modify'):
    """Drive the loop and play the browser: answer each client_request through the real bridge."""
    from app.agent import bridge
    requests = []
    compile_mock = AsyncMock(return_value=dict(WITH_ARTIFACT))
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', script), patch('app.services.builds.compile_content', compile_mock):
        events = []
        async for chunk in run_agent_loop(project_id, 'Verify the blink rate', config, 'arduino', db, intent=intent):
            event = json.loads(chunk.decode()[6:])
            events.append(event)
            if event['type'] == 'client_request':
                requests.append(event)
                if answer is not None:
                    assert bridge.resolve(event['id'], answer(event['payload']))
    return events, requests


@pytest.mark.asyncio
async def test_run_simulation_goes_to_the_browser_and_the_agent_reads_measurements(client):
    project = create(client)
    script = Script(
        {'calls': [('EDIT_FILE', {'path': 'sketch.ino', 'old_text': 'delay(1000);', 'new_text': 'delay(250);', 'replace_all': True})]},
        {'calls': [('CHECK_PROJECT', {}), ('RUN_SIMULATION', {'seconds': 4})]},
        {'text': 'Measured 2.000 Hz on D13.'},
    )
    events, requests = await run_with_browser(project['id'], script, lambda payload: {'trace': blink_trace(500_000, 8), 'durationUs': 4_000_000})
    assert len(requests) == 1
    payload = requests[0]['payload']
    assert payload['board'] == 'uno' and payload['seconds'] == 4 and payload['hex'] == ':00000001FF'
    assert [p['kind'] for p in payload['circuit']['parts']] == [] and payload['pots'] == {} and payload['hold'] == []
    result = script.results(2)[1]
    assert result.startswith('Simulation of your draft · avr8js-atmega328p') and 'D13' in result and '2.000 Hz' in result and 'duty 50.0 %' in result
    assert 'inputs: default inputs' in result
    assert [e['status'] for e in events if e['type'] == 'tool_call_end'][-1] == 'success'
    assert any(e['type'] == 'patch_ready' for e in events)


@pytest.mark.asyncio
async def test_run_simulation_validates_inputs_and_reports_failures_precisely(client):
    project = create(client, 'dimmer')
    script = Script({'calls': [('RUN_SIMULATION', {'seconds': 99}), ('RUN_SIMULATION', {'pots': {'nope': 0.5}}), ('RUN_SIMULATION', {'pots': {'pot1': 2}}),
                               ('RUN_SIMULATION', {'hold': ['pot1']}), ('RUN_SIMULATION', {'seconds': 'x'})]}, {'text': 'ok'})
    events, requests = await run_with_browser(project['id'], script, None)
    assert not requests
    results = script.results(1)
    assert 'between 0.1 and 10' in results[0]
    assert 'nope is not a potentiometer' in results[1] and 'pot1' in results[1]
    assert 'from 0 to 1' in results[2]
    assert 'pot1 is not a button' in results[3] and 'Buttons: none' in results[3]
    assert 'must be a number' in results[4]


@pytest.mark.asyncio
async def test_run_simulation_passes_inputs_and_survives_a_silent_browser(client, monkeypatch):
    project = create(client, 'dimmer')
    script = Script({'calls': [('RUN_SIMULATION', {'seconds': 1, 'pots': {'pot1': 1}})]}, {'text': 'The tab was closed.'})
    monkeypatch.setattr('app.agent.session.SIMULATION_TIMEOUT_S', 0.05)
    events, requests = await run_with_browser(project['id'], script, None)
    assert requests[0]['payload']['pots'] == {'pot1': 1} and len(requests[0]['payload']['circuit']['parts']) == 3
    assert 'did not return simulation results in time' in script.results(1)[0]
    assert events[-1]['type'] == 'done'


@pytest.mark.asyncio
async def test_run_simulation_reports_simulator_errors_and_failed_builds(client):
    project = create(client)
    failing = Script({'calls': [('RUN_SIMULATION', {})]}, {'text': 'x'})
    events, requests = await run_with_browser(project['id'], failing, lambda payload: {'error': 'Invalid Intel HEX record'})
    assert 'the simulator failed: Invalid Intel HEX record' in failing.results(1)[0]
    broken = Script({'calls': [('RUN_SIMULATION', {})]}, {'text': 'x'})
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', broken), patch('app.services.builds.compile_content', AsyncMock(return_value=dict(FAILED))):
        _ = [c async for c in run_agent_loop(project['id'], 'Run it', NATIVE, 'arduino', db)]
    assert 'does not build' in broken.results(1)[0] and "'digitalWrit' was not declared" in broken.results(1)[0]


@pytest.mark.asyncio
async def test_raspberry_pi_projects_send_their_python_files(client):
    project = create(client, 'blink')
    pi = client.post('/api/workbench/projects', json={'name': 'Pi', 'boardId': 'pi4', 'template': 'blink'}).json()
    script = Script({'calls': [('RUN_SIMULATION', {'seconds': 5})]}, {'text': 'ok'})
    compile_mock = AsyncMock(return_value={'status': 'passed', 'engine': 'python-ast', 'valid': True, 'output': '', 'diagnostics': []})
    from app.agent import bridge
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', script), patch('app.services.builds.compile_content', compile_mock):
        async for chunk in run_agent_loop(pi['id'], 'Run it', NATIVE, 'raspberry-pi', db):
            event = json.loads(chunk.decode()[6:])
            if event['type'] == 'client_request':
                assert event['payload']['board'] == 'pi4' and 'hex' not in event['payload']
                assert event['payload']['files'][0]['name'] == 'main.py' and 'LED(17)' in event['payload']['files'][0]['content']
                bridge.resolve(event['id'], {'trace': [{'timeUs': 0, 'pin': 'GPIO17', 'value': 1}], 'durationUs': 5_000_000, 'notice': 'The script finished.'})
    assert 'pyodide-rpi-gpio-sim' in script.results(1)[0] and 'Simulator note: The script finished.' in script.results(1)[0]
    assert 'RUN_SIMULATION' in available_tools('modify', 'pi4') and 'RUN_SIMULATION' in available_tools('explain', 'uno')
    assert 'RUN_SIMULATION' not in available_tools('modify', 'nano') and 'RUN_SIMULATION' not in available_tools('modify', 'mega')


def test_client_results_endpoint_validates_and_rejects_unknown_requests(client):
    assert client.post('/api/agent/client-results/unknown', json={'trace': [], 'durationUs': 1}).status_code == 404
    assert client.post('/api/agent/client-results/x', json={'trace': [{'timeUs': 5, 'pin': 'D13', 'value': 1}, {'timeUs': 1, 'pin': 'D13', 'value': 0}]}).status_code == 422
    assert client.post('/api/agent/client-results/x', json={'trace': [{'timeUs': 1, 'pin': '../etc', 'value': 1}]}).status_code == 422
    assert client.post('/api/agent/client-results/x', json={'surprise': True}).status_code == 422
