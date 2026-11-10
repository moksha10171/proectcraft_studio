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
