# ProjectCraft Studio

[![CI](https://github.com/moksha10171/proectcraft_studio/actions/workflows/ci.yml/badge.svg)](https://github.com/moksha10171/proectcraft_studio/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A self-hosted, open-source workbench for **Arduino, Raspberry Pi and IoT learning**.
Edit embedded code, check it with local tools, visualize wiring, and ask an AI
assistant to generate or explain a project. Designed for students, educators and
makers who want source code, local workspaces and a choice of AI providers.

## What works

- **Code editor:** Monaco editor, multiple project files and Arduino/Python modes.
- **Compiler checks:** Arduino CLI compilation for Uno, classic Nano and Mega;
  Python syntax checking without executing submitted scripts.
- **AI assistance:** generate sketches/Python, explain code, review it and derive
  wiring using Gemini, Groq, OpenAI, Anthropic or an OpenAI-compatible local server.
- **Wiring visualization:** interactive component diagrams and illustrative animations.
- **Local storage:** SQLite workspaces plus a browser fallback; no account required.
- **Hardware examples:** downloadable [Arduino and Raspberry Pi sources](examples/README.md).

**Current limits:** the visualizer is not a CPU emulator or an electrical circuit
solver. Animations do not prove code behavior. AI review is separate from compiler
checks. The compiler endpoint currently targets AVR boards; ESP32 references are
available, but ESP32 builds require an external toolchain. Linux Raspberry Pi
Python and Pico/MicroPython are different targets. Flashing, electrical validation
and real hardware testing remain external steps.

## Quick start

Use Node.js 22 LTS, pnpm 10.13.1 and Python 3.12. Native development works on Linux,
macOS and Windows with these installed. Docker is an alternative.

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

Open [Studio](http://localhost:3000/studio). Configure **Studio → Models** or set
`GEMINI_API_KEY` / `GROQ_API_KEY` in `frontend/.env.local` and restart the backend.
Editing, examples and Python syntax checks work without AI credentials. Cloud
providers may charge for usage. Local models need their model files downloaded first.

For real Arduino compilation, install [Arduino CLI](https://docs.arduino.cc/arduino-cli/installation/),
put `arduino-cli` on the backend process's `PATH`, then run:

```bash
arduino-cli core update-index
arduino-cli core install arduino:avr
```

The Studio Compile/Check button uses `/api/compile`. Missing tools or board cores
produce actionable errors. Select Uno, classic Nano or Mega 2560 in the Studio
header. Install any required libraries explicitly, for example
`arduino-cli lib install Servo`. Compilation does not flash hardware.

## AI configuration

| Provider | Configuration |
| --- | --- |
| Gemini | Studio → Models; or server `GEMINI_API_KEY`, optional `GEMINI_MODEL` |
| Groq | Studio → Models; or server `GROQ_API_KEY`, optional `GROQ_MODEL` |
| OpenAI | Studio → Models; enter your API key and an available model ID |
| Anthropic | Studio → Models; enter your API key and an available model ID |
| Ollama / LM Studio / compatible servers | Custom provider; base URL including `/v1`, downloaded model ID; key optional for local servers |

Choose a model your account/server actually provides. Hosted providers require
credentials. Custom servers can use native tools or the documented text tool-call
fallback; model support varies. For native Ollama use
`http://localhost:11434/v1` and the exact model ID from `ollama list`. Inside a
container, use a reachable host/service address instead of container localhost.
Docker Desktop commonly provides `host.docker.internal`; Linux can configure
`extra_hosts: ["host.docker.internal:host-gateway"]` for the backend. Keep local
model servers restricted to trusted clients.

Browser-entered keys are stored in localStorage and sent to **your backend**, which
makes provider requests. They are not confined to the browser during use. Server
keys stay on the server; never put them in `NEXT_PUBLIC_*` variables or commit them.
Workspace code and prompts go to the chosen provider when AI features are used.

## Self-hosting and customization

```bash
docker compose up --build
```

The UI listens at `http://localhost:3000`; Python runs on the private Compose
network. The optional `frontend/.env.local` supplies backend credentials. Data
persists under `./data`. Use Compose v2.24 or newer. The base backend image does
not include Arduino CLI. For container compilation, extend `backend/Dockerfile`
with the official CLI binary for the container architecture, verify its checksum,
and install `arduino:avr` plus required libraries during the image build.

Configure the app name, public URL and repository link with build-time
`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GITHUB_URL`. Theme tokens
live in `frontend/app/globals.css`. Supply public settings through Compose build
arguments or `frontend/.env.local` before a native build, then rebuild. For native
production, run `pnpm build`, start FastAPI from `backend/` with
`.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`, then run
`pnpm start` from the repository root. Windows uses `.venv\Scripts\python.exe`.
The full app requires Node, Python and writable persistent storage.

Workspaces use `data/projectcraft.db` and attachments use `data/uploads/`.
Stop the backend before backing up these files, or use SQLite's online backup API.
`PROJECTCRAFT_DATA_PATH` selects a studio directory; its parent holds runtime data.
The versioned project catalog remains in `data/projects/`.

This is a trusted single-user/local-network application without built-in login.
Use authentication at your reverse proxy or a VPN for remote access.

## Development

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm test:backend
pnpm build
```

Tests use temporary databases and controlled provider responses; they do not spend
API credits. With Arduino CLI and `arduino:avr` on PATH, backend tests compile
actual Uno/Nano/Mega examples; otherwise those integration tests skip. For browser
checks, start both services against disposable workspace data, run
`pnpm exec playwright install chromium`, then `pnpm test:e2e`. Use `STUDIO_ORIGIN`
for a different URL. On Windows, run backend tests with
`backend\.venv\Scripts\python.exe -m pytest backend/tests -q`.

If compilation returns 503, check the CLI is on the backend PATH. Missing board
cores or libraries appear in compiler output. After changing AI credentials,
restart the backend. Health reporting `needs_config` indicates absent server AI
keys; browser-configured models and non-AI features can still work.

```text
frontend/      Next.js UI, browser persistence, metadata and search
backend/       FastAPI, AI providers and tools, compiler API, SQLite persistence
examples/      Downloadable hardware source files
data/          Hardware references and project catalog (runtime data ignored)
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

Licensed under [MIT](LICENSE). Maintained by B Mokshagna Reddy and contributors.
