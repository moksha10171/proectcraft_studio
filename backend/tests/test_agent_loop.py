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
    assert {t['name'] for t in script.requests[0]['tools']} == {'LIST_FILES', 'READ_FILE', 'CHECK_PROJECT', 'CHECK_WIRING', 'INSPECT_RECORDING', 'BOARD_INFO'}
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
