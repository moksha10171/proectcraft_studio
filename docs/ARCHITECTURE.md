# Architecture

Logen-inspired agent registries, adapted for **local-first embedded development** (Arduino / Raspberry Pi).

## Comparison to Logen

| Logen | ProjectCraft |
|-------|--------------|
| Elixir/Phoenix + Postgres | Python FastAPI + JSON files |
| Google OAuth required | **No auth** |
| Admin-configured models | **BYOK** in browser or `.env.local` |
| Docker sidecar for files | Browser tool executor + local filesystem |
| Billing / credits | None |

## Repository layout

```
projectcraft/
├── frontend/                    # Next.js 16
│   ├── app/
│   │   ├── studio/              # AI IDE
│   │   └── api/
│   │       ├── generate/        # Tool execution (generate, verify, wiring)
│   │       ├── search/          # WEB_SEARCH
│   │       └── chat/
│   ├── components/studio/       # AgentPanel, ModelManager, Terminal
│   ├── hooks/
│   │   ├── useAgentEngine.ts    # Multi-turn agent loop (client)
│   │   └── useStudioPersistence.ts
│   └── lib/
│       ├── agent/               # Tool executor, prompts, workspace-agent
│       └── arduino-studio/      # Tool registry, types, templates
├── backend/                     # Python FastAPI
│   └── app/
│       ├── agent/
│       │   ├── streaming.py     # SSE → Gemini / OpenAI / Anthropic
│       │   ├── settings.py
│       │   └── registries/      # agents, tools, prompts (Logen-style)
│       ├── persistence/         # data/studio filesystem
│       └── routes/
│           ├── agent.py         # POST /api/agent, GET /api/agent/info
│           ├── studio.py        # Workspace CRUD
│           ├── projects.py      # Project catalog
│           └── health.py
└── data/
    ├── projects/
    ├── resources/
    └── studio/workspaces/{id}/
        ├── chat/
        ├── input/
        └── codebase/
```

## Request flow

```
Browser (Studio)
    │
    ├─► POST /api/agent ──rewrite──► Python :8000/api/agent (SSE stream)
    │       useAgentEngine parses tool_call events
    │
    ├─► executeTool() ──► POST /api/generate (Next.js, same origin)
    │       returns files, wiring, verification
    │
    └─► PUT /api/studio/workspace ──rewrite──► Python persistence
            + localStorage cache in browser
```

## API routes (accurate)

### Proxied to Python (`frontend/next.config.mjs` rewrites)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/health` | `routes/health.py` |
| GET | `/api/agent/info` | Agent registry metadata |
| POST | `/api/agent` | SSE streaming |
| GET/PUT/DELETE | `/api/studio/workspace` | Studio persistence |
| GET | `/api/projects/list` | Project list |
| GET | `/api/projects/get?slug=` | Single project |
| GET | `/api/projects/categories` | Categories |
| GET | `/api/projects/download?slug=` | File download |

### Next.js (frontend only)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/generate` | GENERATE_*, VERIFY_*, DERIVE_WIRING, OPTIMIZE |
| POST | `/api/search` | WEB_SEARCH (Serper/Brave) |
| POST | `/api/chat` | Project chat |

## Agent loop (client-side)

Mirrors Logen `Logen.Logens.Registry.Logen`:

1. User message → `useAgentEngine.sendMessage`
2. `buildApiMessages` + context compression (`tool-pairs.ts`)
3. POST `/api/agent` with tools JSON schema
4. Stream: text_delta, tool_call, thinking, usage, done
5. `executeTool` for each tool call (parallel non-interactive, max 8)
6. Tool results appended → next LLM turn until no tools or max turns

Workspace agent name: `projectcraft__workspace_agent`

## Persistence

| Data | Browser | Server |
|------|---------|--------|
| Chat messages | localStorage | `data/studio/.../chat/` |
| Input draft | localStorage | `data/studio/.../input/` |
| Codebase | localStorage | `data/studio/.../codebase/` |
| Model API keys (BYOK) | localStorage only | Never stored |
| Server env keys | — | `frontend/.env.local` |

## Future (optional)

- Move `/api/generate` to Python backend
- Full agent loop server-side (Logen Session GenServer equivalent)
- Native Ollama adapter in Python
