# ProjectCraft

**Open-source AI Studio for building Arduino & Raspberry Pi projects.**

Describe what you want to build. The AI agent generates the code, derives the wiring, verifies it,
and shows you an interactive circuit simulation — all running locally with your own API keys.

No accounts. No cloud backend. No usage bills. You bring the key; you own the session.

---

## What it does

- **AI Studio** — Chat with an agent that writes, verifies, and explains embedded code (Arduino C++ / Raspberry Pi Python). Supports multi-turn tool calls: generate → verify → derive wiring → apply changes.
- **Interactive Wiring Simulation** — Live breadboard view driven by the AI-generated wiring manifest. Components update in real time when the simulation runs.
- **Model Manager (BYOK)** — Use any AI provider: Gemini, Groq, OpenAI, Anthropic, or a local Ollama/LM Studio instance. Keys stay in your browser.
- **Resources** — Guides and references for Arduino, Raspberry Pi, ESP32, components, and more.
- **Projects** — Browse and download community project templates (local JSON, no database).

---

## Quick Start

```bash
git clone https://github.com/your-org/projectcraft
cd projectcraft
cp .env.local.example frontend/.env.local
# Add GEMINI_API_KEY and/or GROQ_API_KEY to frontend/.env.local
pnpm install
pnpm dev
```

Open http://localhost:3000 · Studio: http://localhost:3000/studio · Health: http://localhost:3000/api/health

**Requirements:** Node 20+, pnpm, Python 3.12+ (for backend).

`pnpm dev` starts both **frontend** (:3000) and **Python backend** (:8000).

### Docker

```bash
GEMINI_API_KEY=your-key docker compose up
```

Runs `frontend` + `backend` containers. Studio data persists in `./data`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes* | [Get one](https://aistudio.google.com/apikey) |
| `GROQ_API_KEY` | Yes* | [Get one](https://console.groq.com/keys) — fast, generous free tier |
| `GEMINI_MODEL` | No | Override model (default: `gemini-2.5-flash-lite`) |
| `GROQ_MODEL` | No | Override model (default: `llama-3.3-70b-versatile`) |
| `NEXT_PUBLIC_APP_URL` | No | Public URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name |
| `NEXT_PUBLIC_GITHUB_URL` | No | Repo link in footer |
| `BACKEND_URL` | No | Python API URL (default: `http://localhost:8000`) |
| `PROJECTCRAFT_DATA_PATH` | No | Studio persistence root (default: `data/studio`) |
| `AGENT_MAX_TURNS` | No | Max agent loop turns (default: `20`) |
| `SERPER_API_KEY` / `BRAVE_SEARCH_API_KEY` | No | Optional WEB_SEARCH tool |

\* At least one required — or configure BYOK in the in-app Model Manager without any env vars.

See [.env.local.example](.env.local.example) for the full template.

**Documentation:** [Setup](docs/SETUP.md) · [Deploy](docs/DEPLOY.md) · [Architecture](docs/ARCHITECTURE.md) · [Design standards](docs/DESIGN_STANDARDS.md)

---

## Supported AI Providers

Configure in **Studio → Models** tab (BYOK) or via env keys:

| Provider | Model examples | Notes |
|---|---|---|
| **Gemini** | `gemini-2.5-flash-lite`, `gemini-2.5-pro` | Default; great code quality |
| **Groq** | `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` | Very fast, free tier |
| **OpenAI** | `gpt-4o`, `gpt-4o-mini` | BYOK |
| **Anthropic** | `claude-sonnet-4-6`, `claude-haiku-4-5` | Best reasoning; supports extended thinking |
| **Ollama / local** | `qwen2.5-coder:7b`, `deepseek-coder:6.7b` | 100% offline, use custom base URL |

---

## Architecture

```
projectcraft/
├── frontend/          Next.js UI + AI routes (agent, generate, search)
├── backend/           Python FastAPI (studio persistence, projects, health)
├── data/              Shared local data
│   ├── projects/      Project catalog JSON
│   ├── resources/     Resource guides
│   └── studio/        Workspace folders (chat / input / codebase)
└── docs/              SETUP, DEPLOY, ARCHITECTURE, design standards
```

```
Browser → Next.js :3000
            ├── /api/generate, /api/search, …     (Next.js — tool execution)
            └── /api/agent, /api/agent/info, /api/studio, …  (rewrite → Python :8000)

Python :8000
  ├── POST /api/agent          SSE streaming to AI providers
  └── data/studio/workspaces/{id}/
        ├── chat/messages.json
        ├── input/draft.json
        └── codebase/meta.json + wiring.json
```

Studio state is saved in **browser localStorage** and synced to **Python filesystem** under `data/studio/`.

### Agent Tool Calls

The agent emits structured tool calls in its responses. The frontend parses and executes them:

| Tool | Action |
|---|---|
| `GENERATE_ARDUINO` | Generate Arduino C++ sketch + wiring manifest |
| `GENERATE_RPI` | Generate Raspberry Pi Python script + GPIO wiring |
| `VERIFY_ARDUINO` | Verify Arduino code quality |
| `VERIFY_PYTHON` | Verify Python/GPIO code |
| `DERIVE_WIRING` | Extract wiring from existing code |
| `OPTIMIZE_CODE` | Suggest + apply optimizations |
| `APPLY_CHANGES` | Apply pending AI-suggested edits |
| `FETCH_PROMPTS` | Lazy-load domain prompt templates |
| `READ_FILE` / `WRITE_FILE` / `LIST_FILES` | Project file operations |
| `WEB_SEARCH` | Search component docs (optional Serper/Brave key) |

---

## Adding Projects

Edit `data/projects/projects.json`. Schema: `frontend/lib/projectcraft-api-types.ts`.
Categories: `data/projects/categories.json`.

---

## Scripts

```bash
pnpm dev              # Frontend + Python backend
pnpm dev:frontend     # Next.js only (:3000)
pnpm dev:backend      # Python FastAPI only (:8000)
pnpm build            # Production frontend build
pnpm type-check       # TypeScript check
pnpm env:init         # Copy .env.local.example → frontend/.env.local
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
Security issues: [SECURITY.md](SECURITY.md).

---

## License

[MIT](LICENSE)
