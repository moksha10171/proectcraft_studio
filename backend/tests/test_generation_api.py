from unittest.mock import AsyncMock, patch


def test_structured_generation_contract_matches_studio(client):
    result = {"data": {"files": [], "wiring": {"components": []}}, "provider": "custom", "model": "local",
              "prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3}
    with patch('app.routes.generate.run_generate', AsyncMock(return_value=result)):
        response = client.post('/api/generate', json={'action': 'GENERATE_RPI', 'prompt': 'Blink', 'modelConfig': {
            'provider': 'custom', 'model': 'local', 'baseUrl': 'http://localhost:11434/v1'}})
    assert response.status_code == 200
    assert response.json()['data'] == result['data']
    assert response.json()['tokenUsage']['total_tokens'] == 3


def test_agent_rejects_invalid_body_and_workspace(client):
    assert client.post('/api/agent', json=[]).status_code == 422
    assert client.post('/api/agent', json={'workspaceId': '../escape', 'message': 'hello'}).status_code == 400


def test_fresh_codebase_has_zero_revision_and_downloads_are_real(client):
    result = client.get('/api/studio/workspace?section=codebase').json()['data']
    assert result['files'] == [] and result['updatedAt'] == 0
    response = client.get('/api/projects/download?slug=arduino-led-blink')
    assert response.status_code == 200 and 'digitalWrite' in response.text
