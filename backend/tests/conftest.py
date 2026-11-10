import os
import sys
import tempfile
from pathlib import Path

# Set before importing app.config: validation never touches developer workspaces.
_test_data = tempfile.TemporaryDirectory(prefix="projectcraft-tests-")
os.environ["PROJECTCRAFT_DATA_PATH"] = str(Path(_test_data.name) / "studio")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.engine import engine
from app.db.models import Base


@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as test_client:
        yield test_client
