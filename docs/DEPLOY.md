# Self-hosting

ProjectCraft is a trusted single-user workbench with no built-in authentication.
For remote access, put it behind a VPN or an authenticated TLS reverse proxy.
Keep the backend private. API keys and workspace data belong to the instance owner.

## Docker Compose

Use Docker Engine/Desktop with Compose v2.24 or newer (`env_file.required` support).

```bash
pnpm env:init
# Optional: edit frontend/.env.local for server AI keys
# Use cp .env.local.example frontend/.env.local if Node is not installed.
docker compose up --build
```

Open http://localhost:3000. The frontend binds host loopback by default; the backend
has no published host port. The backend health check gates frontend startup.
The optional env file is read by the backend; browser BYOK works without it.

The frontend uses a multi-stage standalone Next.js build and runs as a non-root
user. Workspace packages, lockfile, static assets and catalog data are included.
Build context excludes secrets, dependencies, user data and test artifacts.

### Branding and ports

Next.js public variables are compiled into the client, so supply them at build
time. Set these in your shell or a Compose `.env` file, then rebuild:

```dotenv
NEXT_PUBLIC_APP_NAME=My Hardware Lab
NEXT_PUBLIC_APP_URL=https://studio.your-domain.tld
NEXT_PUBLIC_GITHUB_URL=https://github.com/moksha10171/proectcraft_studio
PROJECTCRAFT_PORT=3000
```

The domain above represents your deployment; the repository does not claim to
operate a public demo. For native builds, put public settings in
`frontend/.env.local` before `pnpm build`. Theme tokens are in
`frontend/app/globals.css`; AI prompts/tools are under `backend/app/agent/`.

### Data and backups

`./data` is mounted at `/app/data` in the backend. SQLite, uploads and migrated
legacy workspaces remain on the host. Catalog source stays version-controlled.
Stop the backend before copying `data/projectcraft.db` and `data/uploads/`, or use
SQLite's online backup API. Do not copy only the main database during an active
write while ignoring its WAL. Restore backups before starting the backend.
Do not commit databases, user attachments or credentials.

### Arduino compilation in containers

The base Python image supports syntax checks and AI but does **not** contain
Arduino CLI or board cores. Extend `backend/Dockerfile` to copy the official CLI
binary matching your build architecture onto `/usr/local/bin/arduino-cli`, then
run `arduino-cli core update-index` and `arduino-cli core install arduino:avr`
during the build. Pin the CLI version/checksum in your deployment image. Install
required libraries there too. The endpoint returns 503 if the CLI is unavailable.

## Native production processes

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm setup:backend
pnpm env:init
pnpm build
```

Run the backend using the venv Python and an absolute working directory:

```bash
cd backend
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second process, from the repository root, run `pnpm start`. Use your OS's
service manager to supervise both. Windows uses `.venv\Scripts\python.exe`.
`BACKEND_URL` is incorporated into rewrites during the Next.js build; rebuild
when changing the backend address. Keep source catalog files with the deployment.

A frontend-only static host cannot run the complete application. Next.js needs a
Node runtime, and FastAPI needs Python, a writable data directory and optional
compiler executables. Linux/macOS/Windows and container hosts can provide these;
serverless providers with ephemeral filesystems need external persistent storage.

## Local model servers

See [AI setup](AI_SETUP.md) for Ollama/LM Studio. Custom model URLs are reached
from Python. Container `localhost` is not the host OS. Credentials are forwarded
to the configured provider URL; only configure servers you trust.

## Health and shutdown

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/compile/info
docker compose down
```

A healthy HTTP response does not prove cloud credentials work or a board core is
installed. Test the selected model and compile a known example separately.
