"""ProjectCraft Python backend — studio persistence, projects, health, agent."""

from pathlib import Path
import os

from dotenv import load_dotenv

# Repo root: backend/app -> backend -> repo
REPO_ROOT = Path(__file__).resolve().parents[2]

# Load env from frontend/.env.local then repo root .env.local
for env_file in (REPO_ROOT / "frontend" / ".env.local", REPO_ROOT / ".env.local"):
    if env_file.is_file():
        load_dotenv(env_file)

DATA_ROOT = REPO_ROOT / "data"
PROJECTS_DIR = DATA_ROOT / "projects"
STUDIO_DIR = DATA_ROOT / "studio"

_env_data = os.environ.get("PROJECTCRAFT_DATA_PATH", "").strip()
if _env_data:
    p = Path(_env_data)
    STUDIO_DIR = p if p.name == "studio" else p / "studio"
    DATA_ROOT = STUDIO_DIR.parent

DB_PATH = DATA_ROOT / "projectcraft.db"
UPLOADS_DIR = DATA_ROOT / "uploads"

API_PREFIX = "/api"
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
