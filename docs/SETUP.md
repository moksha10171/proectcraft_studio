# Local Setup

ProjectCraft is **local-first**: no accounts, no cloud auth. You run the frontend and Python backend on your machine and bring your own API keys (or use Ollama via Model Manager).

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| pnpm | 9+ |
| Python | 3.10+ (3.12 recommended) |

## 1. Clone and install

```bash
git clone https://github.com/your-org/projectcraft
cd projectcraft
pnpm install
pnpm env:init
```

This copies `.env.local.example` → `frontend/.env.local`.

## 2. Configure API keys

Edit `frontend/.env.local`:

```bash
GEMINI_API_KEY=your-key-here
# optional
GROQ_API_KEY=your-groq-key
```

The **Python backend** reads the same file automatically (via `python-dotenv`).

**Alternative — no env file:** open Studio → **Models** tab → paste your key. Keys stay in **browser localStorage** only (BYOK).

**Fully offline:** Model Manager → Custom provider → Base URL `http://localhost:11434/v1`, model `qwen2.5-coder:7b` (Ollama).

## 3. Start dev servers

```bash
pnpm dev
```

| Service | URL | Role |
|---------|-----|------|
| Frontend (Next.js) | http://localhost:3000 | UI, tool execution (`/api/generate`) |
| Backend (Python) | http://localhost:8000 | Agent SSE, studio persistence, projects |

Verify:

```bash
curl http://localhost:3000/api/health
curl http://localhost:8000/api/health
curl http://localhost:8000/api/agent/info
```

## 4. Open Studio

http://localhost:3000/studio

- Chat uses `/api/agent` (proxied to Python)
- Tool calls (generate, verify, wiring) use `/api/generate` (Next.js)
- Workspace state saves to `data/studio/workspaces/default/` + browser localStorage

## Folder layout

```
projectcraft/
├── frontend/              Next.js app
│   ├── app/               Pages + remaining API routes
│   ├── lib/agent/         Tool executor, prompts (client-side loop)
│   └── .env.local         Your API keys (gitignored)
├── backend/               Python FastAPI
│   └── app/
│       ├── agent/         Streaming + registries (Logen-style)
│       ├── persistence/   Studio filesystem store
│       └── routes/        HTTP handlers
└── data/
    ├── projects/          Project catalog JSON
    ├── resources/         Learning resources
    └── studio/            Chat, input, codebase persistence
```

## Environment variables

See [.env.local.example](../.env.local.example). Key variables:

| Variable | Used by | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | Backend agent | Default provider when BYOK not set |
| `GROQ_API_KEY` | Backend agent | Optional fallback |
| `GEMINI_MODEL` | Backend | Default model name |
| `BACKEND_URL` | Frontend rewrites | Default `http://localhost:8000` |
| `PROJECTCRAFT_DATA_PATH` | Backend | Override studio data root |
| `SERPER_API_KEY` / `BRAVE_SEARCH_API_KEY` | Frontend | Optional WEB_SEARCH tool |
| `AGENT_MAX_TURNS` | Backend | Agent loop limit (default 20) |

## Troubleshooting

**Health shows `needs_config`** — add `GEMINI_API_KEY` or `GROQ_API_KEY` to `frontend/.env.local`, restart `pnpm dev`.

**Agent errors / connection refused** — ensure backend is running on port 8000 (`pnpm dev:backend`).

**Studio state not persisting** — check `data/studio/workspaces/default/` is writable.

**CORS errors** — set `CORS_ORIGINS=http://localhost:3000` in backend env (default).
