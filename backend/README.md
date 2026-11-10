# Backend

FastAPI service for AI agent/tool execution, structured generation, compiler
checks, SQLite workspaces, attachments, project examples and health.

From the repository root:

```bash
pnpm setup:backend
pnpm dev:backend
pnpm test:backend
```

Or create `backend/.venv`, install `requirements-dev.txt`, and run
`python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` from `backend/`.

API docs: http://localhost:8000/docs. AI credentials load from
`frontend/.env.local`, root `.env.local` or process environment. Model Manager
can send per-request credentials instead.

Data lives in `data/projectcraft.db` and `data/uploads/` (gitignored).
`PROJECTCRAFT_DATA_PATH` overrides the studio location and parent runtime data
root. Tests use a temporary root. Legacy JSON workspaces migrate on initial DB
creation. See [architecture](../README.md), [AI](../README.md)
and [deployment](../README.md).
