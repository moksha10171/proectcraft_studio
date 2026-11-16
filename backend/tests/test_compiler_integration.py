"""Real compiler tests run when Arduino CLI and arduino:avr are installed."""
import json
import shutil
import subprocess
from pathlib import Path
import pytest


def avr_available():
    cli = shutil.which('arduino-cli')
    if not cli:
        return False
    result = subprocess.run([cli, 'core', 'list', '--format', 'json'], capture_output=True, text=True)
    return result.returncode == 0 and 'arduino:avr' in result.stdout


@pytest.mark.skipif(not avr_available(), reason='Install Arduino CLI and arduino:avr core')
@pytest.mark.parametrize('board', ['arduino:avr:uno', 'arduino:avr:nano', 'arduino:avr:mega'])
def test_actual_blink_compilation(client, board):
    source = (Path(__file__).resolve().parents[2] / 'examples/arduino-led-blink/sketch.ino').read_text()
    response = client.post('/api/compile', json={'board': board, 'files': [{'name': 'blink.ino', 'content': source}]})
    assert response.status_code == 200
    result = response.json()
    assert result['engine'] == 'arduino-cli' and result['valid'], result


@pytest.mark.skipif(not avr_available(), reason='Install Arduino CLI and arduino:avr core')
def test_actual_invalid_sketch_fails(client):
    response = client.post('/api/compile', json={'files': [{'name': 'sketch.ino', 'content': 'void setup() { bad syntax } void loop() {}'}]})
    assert response.status_code == 200
    assert not response.json()['valid'] and response.json()['errors']


EXAMPLES = Path(__file__).resolve().parents[2] / 'examples'


@pytest.mark.parametrize('slug, template', [('arduino-button-input', 'button'), ('arduino-potentiometer-dimmer', 'dimmer')])
def test_example_sketches_match_studio_templates(slug, template):
    """The downloadable example and the in-app starter must not drift apart."""
    from app.routes.workbench import NewProject, template as build_template
    assert (EXAMPLES / slug / 'sketch.ino').read_text() == build_template(NewProject(name='x', template=template)).files[0].content


@pytest.mark.skipif(not avr_available(), reason='Install Arduino CLI and arduino:avr core')
@pytest.mark.parametrize('board', ['arduino:avr:uno', 'arduino:avr:nano', 'arduino:avr:mega'])
@pytest.mark.parametrize('slug', ['arduino-button-input', 'arduino-potentiometer-dimmer'])
def test_actual_example_compilation(client, board, slug):
    source = (EXAMPLES / slug / 'sketch.ino').read_text()
    result = client.post('/api/compile', json={'board': board, 'files': [{'name': 'sketch.ino', 'content': source}]}).json()
    assert result['engine'] == 'arduino-cli' and result['valid'], result


@pytest.mark.skipif(not avr_available(), reason='Install Arduino CLI and arduino:avr core')
@pytest.mark.asyncio
async def test_assistant_fixes_its_own_compile_error_before_hand_over(client):
    """Real toolchain: a broken draft edit fails to build, the agent sees the diagnostic, fixes it, and the proposal carries a passing build."""
    from unittest.mock import patch
    from app.agent.loop import run_agent_loop
    from app.db.engine import SessionLocal
    project = client.post('/api/workbench/projects', json={'name': 'Agent compile', 'template': 'blink'}).json()
    seen = []
    turns = [
        [('EDIT_FILE', {'path': 'sketch.ino', 'old_text': '  delay(1000);\n}', 'new_text': '  delayy(250);\n}'})],
        [('CHECK_PROJECT', {})],
        [('EDIT_FILE', {'path': 'sketch.ino', 'old_text': 'delayy(250);', 'new_text': 'delay(250);'})],
        [('CHECK_PROJECT', {})],
        [],
    ]

    async def provider(_p, _k, _m, messages, *rest):
        seen.append([m['content'] for m in messages if m.get('call_id')])
        calls = turns.pop(0)
        async def stream():
            for index, (tool, args) in enumerate(calls):
                yield ('data: ' + json.dumps({'type': 'tool_call', 'tool': tool, 'args': args, 'call_id': f'{len(seen)}-{index}'}) + '\n\n').encode()
            if not calls:
                yield b'data: {"type":"text_delta","text":"Shortened the off time to 250 ms."}\n\n'
            yield b'data: {"type":"done"}\n\n'
        return stream()

    config = {'provider': 'custom', 'model': 'local', 'baseUrl': 'http://localhost:11434/v1', 'supportsNativeTools': True}
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', provider):
        events = [json.loads(c.decode()[6:]) async for c in run_agent_loop(project['id'], 'Shorten the off time', config, 'arduino', db)]
    failed_check, passed_check = seen[2][-1], seen[4][-1]
    assert 'Status: failed' in failed_check and "'delayy' was not declared" in failed_check and 'sketch.ino:12' in failed_check
    assert 'Status: passed' in passed_check and 'Sketch uses' in passed_check
    patch_event = next(e['patch'] for e in events if e['type'] == 'patch_ready')
    assert patch_event['verification']['build']['status'] == 'passed'
    assert not any(e.get('label') == 'Verify proposal build' for e in events if e['type'] == 'tool_call_start')
    assert client.get(f'/api/workbench/projects/{project["id"]}').json()['revision'] == 1
