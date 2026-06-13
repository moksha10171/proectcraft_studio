# Frontend — Next.js UI

All Next.js pages, components, hooks, and client libraries.

```
frontend/
├── app/           Pages + AI API routes (agent, generate, search, …)
├── components/
├── hooks/
├── lib/           Utilities, arduino-studio, agent executor, browser persistence
└── public/
```

**Backend API** (studio save/load, projects, health) is proxied to Python via `next.config.mjs` rewrites → `http://localhost:8000`.

Run: `pnpm dev:frontend` or `pnpm dev` from repo root.
