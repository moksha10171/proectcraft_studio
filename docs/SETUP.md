# Local setup

## Requirements

- Node.js 22 LTS (see `.nvmrc`) and pnpm 10.13.1 (see `packageManager`).
- Python 3.12 with venv support.
- Optional: Arduino CLI and `arduino:avr` core for firmware compilation.
- Optional: an AI provider account or a local compatible model server.

Linux, macOS and Windows can run the frontend and backend as separate processes.
On Debian/Ubuntu, install `python3-venv` if venv creation fails. Windows should
have `python` on PATH; POSIX systems should have `python3`.

```bash
git clone https://github.com/moksha10171/proectcraft_studio.git
cd proectcraft_studio
corepack enable
corepack prepare pnpm@10.13.1 --activate
pnpm install --frozen-lockfile
pnpm setup:backend
pnpm env:init
pnpm dev
```

`pnpm setup:backend` creates `backend/.venv` and installs runtime plus test
dependencies. `pnpm env:init` preserves an existing `frontend/.env.local`.
`pnpm dev` starts both services and stops the other if one fails.

| Service | URL |
| --- | --- |
| Studio | http://localhost:3000/studio |
| Health through frontend | http://localhost:3000/api/health |
| Backend API docs | http://localhost:8000/docs |

Run only one service with `pnpm dev:frontend` or `pnpm dev:backend`. The frontend
uses `BACKEND_URL` (default `http://localhost:8000`) for API rewrites.

## Compiler and libraries

Install [Arduino CLI](https://docs.arduino.cc/arduino-cli/installation/) for your
OS/CPU, place it on the backend process's PATH and run:

```bash
arduino-cli core update-index
arduino-cli core install arduino:avr
```

Open Studio in Arduino mode. Select Uno, classic Nano or Mega 2560 in the header.
The Compile/Check button sends project sources to the local CLI with that FQBN.
Compilation happens in a temporary directory. No sketch is flashed or run.
Install any needed libraries explicitly, for example:

```bash
arduino-cli lib install Servo
```

The compiler never auto-installs dependencies. Missing cores and libraries are
reported in compiler output. `GET /api/compile/info` reports CLI availability,
Python syntax support and the supported board IDs. CLI availability alone does
not prove cores are installed. See Arduino's
[build process](https://docs.arduino.cc/arduino-cli/sketch-build-process/).

Python mode uses Python's actual parser (`ast.parse`). It detects syntax errors
without importing libraries or running GPIO code. Install device libraries on
the physical Raspberry Pi before running an exported script. This mode is for
Linux Raspberry Pi, not a claim of Pico/MicroPython emulation.

## AI and persistence

Follow [AI setup](AI_SETUP.md). Use Studio → Models for hosted/custom providers,
or set `GEMINI_API_KEY` / `GROQ_API_KEY` in `frontend/.env.local`. Restart the
backend after env edits. No key is required for editing or compiler checks.

SQLite stores workspaces in `data/projectcraft.db`; attachments are under
`data/uploads/`. Browser localStorage is a fallback for drafts and snapshots.
Older `data/studio/workspaces/` JSON is migrated on first database initialization.
These runtime files are ignored by Git. Set `PROJECTCRAFT_DATA_PATH` to an
absolute `.../studio` directory to place the database in its parent directory;
project catalog JSON stays in the repository's `data/projects/`.

## Checks

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm test:backend
pnpm build
```

On Windows, run backend tests directly as
`backend\.venv\Scripts\python.exe -m pytest backend/tests -q`.
See [validation](VALIDATION.md) for integration checks.

## Troubleshooting

- **503 from compiler:** install Arduino CLI and restart with the right PATH.
- **Platform not installed:** install `arduino:avr` as above.
- **Backend connection refused:** run `pnpm setup:backend`, then `pnpm dev:backend`.
- **Health `needs_config`:** AI env keys are absent; browser-configured/local models
  may still work. This is not an editing/compiler failure.
- **Model errors:** check the selected model ID and URL from the backend network.
- **Port in use:** stop the previous dev process or configure a separate frontend
  port, backend port and `BACKEND_URL` consistently.
- **Local storage:** changing origin/port uses a separate browser storage namespace.
