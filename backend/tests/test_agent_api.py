def test_agent_rejects_invalid_body_and_workspace(client):
    assert client.post('/api/agent', json=[]).status_code == 422
    assert client.post('/api/agent', json={'workspaceId': '../escape', 'message': 'hello'}).status_code == 400


def test_fresh_codebase_has_zero_revision_and_downloads_are_real(client):
    result = client.get('/api/studio/workspace?section=codebase').json()['data']
    assert result['files'] == [] and result['updatedAt'] == 0
    response = client.get('/api/projects/download?slug=arduino-led-blink')
    assert response.status_code == 200 and 'digitalWrite' in response.text
