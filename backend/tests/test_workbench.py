from unittest.mock import AsyncMock, patch
import pytest


def create(client, **kwargs):
    response = client.post('/api/workbench/projects', json={'name': 'Test experiment', **kwargs})
    assert response.status_code == 200, response.text
    return response.json()


def content(project):
    return {k: project[k] for k in ('name', 'boardId', 'coreVersion', 'files', 'circuit', 'dependencies', 'notes')}


def test_named_projects_targets_and_conflicts(client):
    one, two = create(client, boardId='nano'), create(client, boardId='pi4')
    assert one['id'] != two['id'] and one['boardId'] == 'nano' and two['boardId'] == 'pi4'
    url = '/api/workbench/projects/' + one['id']
    changed = content(one)
    changed['name'] = 'Renamed'
    assert client.put(url, json={'baseRevision': 1, 'content': changed}).json()['revision'] == 2
    assert client.get(url).json()['boardId'] == 'nano'
    assert client.put(url, json={'baseRevision': 1, 'content': changed}).status_code == 409


def test_reject_apply_stale_patch_and_undo(client):
    project = create(client)
    base = '/api/workbench/projects/' + project['id']
    proposal = {'baseRevision': 1, 'files': [{'name': 'sketch.ino', 'content': 'void setup(){} void loop(){}'}], 'explanation': 'Small change'}
    patch1 = client.post(base + '/patches', json=proposal).json()
    assert client.get(base).json()['revision'] == 1
    assert client.post(base + f"/patches/{patch1['id']}/reject").status_code == 200
    assert client.get(base).json()['files'] == project['files']
    patch2 = client.post(base + '/patches', json=proposal).json()
    applied = client.post(base + f"/patches/{patch2['id']}/apply").json()
    assert applied['revision'] == 2 and 'void setup(){}' in applied['files'][0]['content']
    assert client.post(base + f"/patches/{patch2['id']}/apply").status_code == 409
    undone = client.post(base + '/undo', json={'baseRevision': 2}).json()
    assert undone['revision'] == 3 and undone['files'] == project['files']
    patch3 = client.post(base + '/patches', json={**proposal, 'baseRevision': 3}).json()
    client.put(base, json={'baseRevision': 3, 'content': {**content(undone), 'name': 'Changed'}})
    assert client.post(base + f"/patches/{patch3['id']}/apply").status_code == 409


def test_circuit_connections_and_portable_bundle(client):
    project = create(client, template='button')
    base = '/api/workbench/projects/' + project['id']
    exported = client.get(base + '/export').json()
    imported = client.post('/api/workbench/import', json=exported).json()
    assert imported['id'] != project['id']
    assert imported['sourceHash'] == project['sourceHash']
    assert imported['circuit'] == project['circuit']
    bad = content(project)
    bad['circuit']['nets'][0]['terminals'][0] = 'board:D99'
    assert client.put(base, json={'baseRevision': 1, 'content': bad}).status_code == 422


def test_invalid_patch_never_writes(client):
    project = create(client)
    base = '/api/workbench/projects/' + project['id']
    assert client.post(base + '/patches', json={'baseRevision': 1, 'files': [{'name': '../escape.cpp', 'content': 'bad'}]}).status_code == 422
    assert client.get(base).json()['revision'] == 1


def test_build_record_and_recording_provenance(client):
    project = create(client)
    base = '/api/workbench/projects/' + project['id']
    output = {'valid': True, 'engine': 'arduino-cli', 'errors': [], 'output': 'Built', 'diagnostics': [], 'artifact': {'content': ':00000001FF', 'format': 'intel-hex', 'sha256': 'test'}}
    with patch('app.services.builds.compile_code', AsyncMock(return_value=output)), patch('app.services.builds.toolchain_info', AsyncMock(return_value={'arduinoCli': 'test', 'cores': [{'id': 'arduino:avr', 'version': '1.8.8'}], 'libraries': []})):
        run = client.post(base + '/build', json={'revision': 1}).json()
    assert run['sourceHash'] == project['sourceHash'] and run['sourceRevision'] == 1
    recording = client.post(base + '/recordings', json={'buildId': run['id'], 'events': [{'timeUs': 12, 'pin': 'D13', 'value': 1}], 'durationUs': 20}).json()
    assert recording['origin'] == 'emulator'
    bundle = client.get(base + '/export').json()
    assert all('artifact' not in r for r in bundle['runs'])
    assert next(r for r in bundle['runs'] if r['origin'] == 'emulator')['artifactHash'] == 'test'
    imported = client.post('/api/workbench/import', json=bundle).json()
    assert all(r['origin'] == 'imported' for r in client.get('/api/workbench/projects/' + imported['id'] + '/runs').json())
    assert client.post(base + '/build', json={'revision': 2}).status_code == 409


def test_fresh_install_keeps_legacy_sources(client):
    client.put('/api/studio/files', json={'workspaceId': 'legacy', 'name': 'main.py', 'content': 'print(1)'})
    projects = client.get('/api/workbench/projects').json()
    assert next(p for p in projects if p['id'] == 'legacy')['files'][0]['content'] == 'print(1)'


def test_core_mismatch_does_not_claim_a_reproducible_build(client):
    project = create(client)
    with patch('app.services.builds.toolchain_info', AsyncMock(return_value={'arduinoCli': 'test', 'cores': [{'id': 'arduino:avr', 'version': '0.0.1'}]})):
        run = client.post('/api/workbench/projects/' + project['id'] + '/build', json={'revision': 1}).json()
    assert run['status'] == 'unavailable'
    assert '1.8.8' in run['output']


@pytest.mark.asyncio
async def test_workbench_agent_stages_changes_and_explain_intent_is_read_only(client):
    import json
    from app.agent.loop import run_agent_loop
    from app.db.engine import SessionLocal
    project = create(client)
    turns = 0
    async def provider(*args):
        nonlocal turns
        turns += 1
        first = turns % 2 == 1
        async def stream():
            if first:
                yield ('data: ' + json.dumps({'type': 'tool_call', 'tool': 'WRITE_FILE', 'args': {'path': 'sketch.ino', 'content': 'void setup(){} void loop(){}'}, 'call_id': 'proposal-call'}) + '\n\n').encode()
            else:
                yield b'data: {"type":"text_delta","text":"Done."}\n\n'
            yield b'data: {"type":"done"}\n\n'
        return stream()
    config = {'provider': 'custom', 'model': 'local', 'baseUrl': 'http://localhost:11434/v1', 'supportsNativeTools': True}
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', provider):
        events = [json.loads(c.decode()[6:]) async for c in run_agent_loop(project['id'], 'Change my sketch', config, 'arduino', db)]
    assert any(e['type'] == 'patch_ready' for e in events)
    assert client.get('/api/workbench/projects/' + project['id']).json()['files'] == project['files']
    another = create(client)
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', provider):
        events = [json.loads(c.decode()[6:]) async for c in run_agent_loop(another['id'], 'Explain', config, 'arduino', db, intent='explain')]
    assert not any(e['type'] == 'patch_ready' for e in events)
    assert client.get('/api/workbench/projects/' + another['id'] + '/patches').json() == []


@pytest.mark.asyncio
async def test_native_tool_context_survives_empty_assistant_text_and_reload(client):
    import json
    from app.agent.loop import run_agent_loop
    from app.db.engine import SessionLocal
    project = create(client)
    turns = 0
    async def provider(*args):
        nonlocal turns
        turns += 1
        messages = args[3]
        async def stream():
            if turns == 1:
                yield ('data: ' + json.dumps({'type': 'tool_call', 'tool': 'READ_FILE', 'args': {'path': 'sketch.ino'}, 'call_id': 'native-read'}) + '\n\n').encode()
            else:
                assistant = next(m for m in messages if m.get('calls'))
                result = next(m for m in messages if m.get('call_id'))
                assert assistant['calls'][0]['call_id'] == result['call_id'] == 'native-read'
                yield b'data: {"type":"text_delta","text":"Read your current sketch."}\n\n'
            yield b'data: {"type":"done"}\n\n'
        return stream()
    config = {'provider': 'custom', 'model': 'local', 'baseUrl': 'http://localhost:11434/v1', 'supportsNativeTools': True}
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', provider):
        events = [json.loads(c.decode()[6:]) async for c in run_agent_loop(project['id'], 'Read', config, 'arduino', db, intent='explain')]
        assert not any(e['type'] == 'error' for e in events)
    with SessionLocal() as db, patch('app.agent.loop._call_provider_turn', provider):
        events = [json.loads(c.decode()[6:]) async for c in run_agent_loop(project['id'], 'Explain further', config, 'arduino', db, intent='explain')]
        assert not any(e['type'] == 'error' for e in events)


def test_import_validates_all_recordings_before_creating_project(client):
    project = create(client)
    bundle = client.get('/api/workbench/projects/' + project['id'] + '/export').json()
    before = len(client.get('/api/workbench/projects').json())
    bundle['runs'] = [{'durationMs': 1, 'trace': [{'timeUs': 2000, 'pin': 'D13', 'value': 1}]}]
    assert client.post('/api/workbench/import', json=bundle).status_code == 422
    assert len(client.get('/api/workbench/projects').json()) == before
    bundle['runs'][0]['durationMs'] = 3
    bundle['runs'][0]['engineVersion'] = '0.21.1'
    bundle['runs'][0]['dropped'] = 4
    imported = client.post('/api/workbench/import', json=bundle).json()
    recording = client.get('/api/workbench/projects/' + imported['id'] + '/runs').json()[0]
    assert recording['durationMs'] == 3 and recording['dropped'] == 4
    assert recording['engineVersion'] == '0.21.1'
    assert recording['origin'] == 'imported' and recording['valid'] is False


def test_dimmer_template_potentiometer_and_analog_stimulus_round_trip(client):
    project = create(client, template='dimmer')
    assert [p['kind'] for p in project['circuit']['parts']] == ['potentiometer', 'resistor', 'led']
    assert 'analogRead(POT_PIN)' in project['files'][0]['content'] and 'potentiometer' in project['notes']
    base = '/api/workbench/projects/' + project['id']
    # A potentiometer terminal that does not exist is rejected like any other.
    bad = content(project)
    bad['circuit'] = {'parts': project['circuit']['parts'], 'nets': [{'id': 'x', 'label': '', 'terminals': ['board:A0', 'pot1:X']}]}
    assert client.put(base, json={'baseRevision': 1, 'content': bad}).status_code == 422
    # Analog stimulus events are accepted in a bundle, validated, and survive export/import.
    exported = client.get(base + '/export').json()
    run = {'id': 'ref1', 'origin': 'emulator', 'engine': 'avr8js-atmega328p', 'sourceRevision': 1, 'sourceHash': 'abc', 'boardId': 'uno', 'status': 'recorded', 'durationMs': 1000,
           'trace': [{'timeUs': 0, 'pin': 'A0', 'volts': 2.5}, {'timeUs': 10, 'pin': 'D9', 'value': 1}]}
    imported = client.post('/api/workbench/import', json={**exported, 'runs': [run]})
    assert imported.status_code == 200, imported.text
    kept = client.get(f"/api/workbench/projects/{imported.json()['id']}/runs").json()[0]
    assert kept['origin'] == 'imported' and {'timeUs': 0, 'pin': 'A0', 'volts': 2.5} in kept['trace']


@pytest.mark.parametrize('event', [
    {'timeUs': 0, 'pin': 'A0', 'volts': 5.1},
    {'timeUs': 0, 'pin': 'D9', 'volts': 2.0},
    {'timeUs': 0, 'pin': 'A0', 'volts': 2.0, 'value': 1},
    {'timeUs': 0, 'pin': 'A0', 'volts': 2.0, 'serial': 'x'},
    {'timeUs': 0, 'volts': 2.0},
])
def test_invalid_analog_events_are_rejected(client, event):
    project = create(client)
    run = {'id': 'bad', 'sourceRevision': 1, 'boardId': 'uno', 'durationMs': 10, 'trace': [event]}
    response = client.post('/api/workbench/import', json={**client.get(f"/api/workbench/projects/{project['id']}/export").json(), 'runs': [run]})
    assert response.status_code == 422


def test_raspberry_pi_templates_have_circuits_and_record_simulated_runs(client):
    blink = create(client, boardId='pi4', template='blink')
    assert blink['boardId'] == 'pi4' and 'LED(17)' in blink['files'][0]['content']
    assert [p['kind'] for p in blink['circuit']['parts']] == ['resistor', 'led']
    button = create(client, boardId='pi4', template='button')
    assert 'Button(2)' in button['files'][0]['content'] and [p['kind'] for p in button['circuit']['parts']] == ['button', 'resistor', 'led']
    assert create(client, boardId='pi4', template='empty')['files'][0]['content'] == ''
    build = client.post(f'/api/workbench/projects/{button["id"]}/build', json={'revision': 1}).json()
    assert build['status'] == 'passed' and build['engine'] == 'python-ast'
    events = [{'timeUs': 0, 'pin': 'GPIO2', 'value': 1}, {'timeUs': 5, 'pin': 'GPIO17', 'value': 0}, {'timeUs': 9, 'pin': 'GPIO2', 'value': 0}, {'timeUs': 9, 'serial': 'hi\n'}]
    recording = client.post(f'/api/workbench/projects/{button["id"]}/recordings', json={'buildId': build['id'], 'events': events, 'durationUs': 20})
    assert recording.status_code == 200, recording.text
    run = recording.json()
    assert run['engine'] == 'pyodide-rpi-gpio-sim' and run['boardId'] == 'pi4' and 'Not Linux' in run['output']
    bad = client.post(f'/api/workbench/projects/{button["id"]}/recordings', json={'buildId': build['id'], 'events': [{'timeUs': 1, 'pin': 'GPIO28', 'value': 1}], 'durationUs': 5})
    assert bad.status_code == 422
    nano = create(client, boardId='nano')
    nano_build = {'id': 'x'}
    assert client.post(f'/api/workbench/projects/{nano["id"]}/recordings', json={'buildId': nano_build['id'], 'events': [], 'durationUs': 1}).status_code == 404
