import io
from unittest.mock import patch


def test_health_and_agent_metadata(client):
    assert client.get('/api/health').json()['checks']['database']['status'] == 'ok'
    assert client.get('/api/agent/info').json()['success']


def test_compiler_python_does_not_execute_code(client):
    result = client.post('/api/compile', json={"deviceMode": "raspberry-pi", "files": [
        {"name": "main.py", "content": "raise RuntimeError('must never execute')"}]}).json()
    assert result['valid'] and result['engine'] == 'python-ast'


def test_compiler_python_syntax_error(client):
    result = client.post('/api/compile', json={"deviceMode": "raspberry-pi", "files": [
        {"name": "main.py", "content": "def broken("}]}).json()
    assert not result['valid'] and 'main.py:1' in result['errors'][0]


def test_missing_arduino_cli_is_not_reported_as_success(client):
    with patch('app.routes.compile.shutil.which', return_value=None):
        result = client.post('/api/compile', json={"files": [{"name": "sketch.ino", "content": "void setup(){} void loop(){}"}]})
    assert result.status_code == 503
    assert 'Arduino CLI' in result.json()['detail']


def test_compiler_rejects_traversal_and_unknown_board(client):
    assert client.post('/api/compile', json={"files": [{"name": "../escape.ino", "content": ""}]}).status_code == 400
    assert client.post('/api/compile', json={"board": "--help", "files": [{"name": "sketch.ino", "content": ""}]}).status_code == 422


def test_codebase_snapshot_removes_deleted_files_and_restores_pi_mode(client):
    url = '/api/studio/workspace'
    client.put(url, json={"section": "codebase", "data": {"files": [{"name": "old.ino", "content": "old"}], "wiring": {"components": []}}})
    client.put(url, json={"section": "codebase", "data": {"files": [{"name": "main.py", "content": "pass"}], "deviceMode": "raspberry-pi", "wiring": None}})
    snapshot = client.get(url + '?section=codebase').json()['data']
    assert [f['name'] for f in snapshot['files']] == ['main.py']
    assert snapshot['deviceMode'] == 'raspberry-pi' and snapshot['wiring'] is None


def test_upload_workspace_cannot_escape_data_folder(client):
    result = client.post('/api/studio/uploads?workspaceId=../../escape', files={'file': ('file.txt', io.BytesIO(b'test'), 'text/plain')})
    assert result.status_code == 400


def test_project_pagination_rejects_negative_values(client):
    assert client.get('/api/projects/list?offset=-1').status_code == 422
    assert client.get('/api/projects/list?limit=0').status_code == 422
