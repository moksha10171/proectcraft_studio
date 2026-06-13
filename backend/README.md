# ProjectCraft Python Backend

FastAPI service for **studio persistence**, **projects catalog**, **health**, and **AI agent streaming**.

AI tool execution (`/api/generate`, etc.) remains in the Next.js frontend for now.

## Layout

```
backend/
├── app/
│   ├── main.py              FastAPI entry
│   ├── config.py            Paths & CORS
│   ├── persistence/         Studio workspace filesystem store
│   └── routes/
│       ├── health.py
│       ├── studio.py        GET/PUT/DELETE /api/studio/workspace
│       ├── projects.py      /api/projects/*
│       └── agent.py         POST /api/agent (SSE streaming)
├── agent/
│   └── streaming.py         Gemini, OpenAI/Groq, Anthropic SSE
├── requirements.txt
└── README.md
```

## Data folders (repo root)

```
data/
├── projects/          Project catalog JSON
├── resources/         Resource guide JSON + images refs
└── studio/
    └── workspaces/
        └── default/
            ├── chat/
            ├── input/
            └── codebase/
```

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

From repo root: `pnpm dev:backend`

API docs: http://localhost:8000/docs

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECTCRAFT_DATA_PATH` | `../data/studio` | Studio persistence root |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated origins |
