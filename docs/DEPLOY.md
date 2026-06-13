# Deploy (Docker)

Self-host ProjectCraft with Docker Compose. No external auth — protect the deployment at the network layer if exposed publicly.

## Quick deploy

```bash
cp .env.local.example frontend/.env.local
# Edit frontend/.env.local — set GEMINI_API_KEY at minimum

export GEMINI_API_KEY=your-key   # or use a .env file for compose variable substitution
docker compose up --build
```

| Service | Port | Image |
|---------|------|-------|
| frontend | 3000 | Root `Dockerfile` |
| backend | 8000 | `backend/Dockerfile` |

Open http://localhost:3000

## Volumes

`./data` is mounted into the backend container at `/app/data`:

- `data/projects/` — project catalog
- `data/studio/workspaces/` — studio chat + codebase persistence

Studio user data in `data/studio/workspaces/*` is gitignored.

## Environment (docker-compose.yml)

**Backend container:**

- `GEMINI_API_KEY`, `GROQ_API_KEY`, `GEMINI_MODEL`
- `PROJECTCRAFT_DATA_PATH=/app/data/studio`
- `CORS_ORIGINS=http://localhost:3000`

**Frontend container:**

- `BACKEND_URL=http://backend:8000` (internal Docker network)
- Same AI keys (for `/api/generate` in Next.js)
- `NEXT_PUBLIC_APP_URL` — public URL for metadata

## Production notes

1. **Do not expose port 8000 publicly** — frontend proxies `/api/*` to backend internally.
2. Use a reverse proxy (nginx, Caddy) with TLS in front of port 3000.
3. Add password protection or VPN if the instance is on the public internet.
4. API keys live in env vars or `.env` file — never commit them.
5. For standalone frontend build: `NEXT_OUTPUT=standalone` is set in compose.

## Health checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:8000/docs   # FastAPI OpenAPI
```

## Build individually

```bash
# Backend only
docker build -t projectcraft-backend ./backend

# Frontend only
docker build -t projectcraft-frontend -f Dockerfile .
```
