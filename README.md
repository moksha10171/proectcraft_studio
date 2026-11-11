# ProjectCraft Studio

[![CI](https://github.com/moksha10171/proectcraft_studio/actions/workflows/ci.yml/badge.svg)](https://github.com/moksha10171/proectcraft_studio/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A self-hosted, open-source workbench for **Arduino, Raspberry Pi and IoT learning**.
Edit embedded code, check it with local tools, visualize wiring, and ask an AI
assistant to generate or explain a project. Designed for students, educators and
makers who want source code, local workspaces and a choice of AI providers.

## What works

- **Project workspace:** named experiments, persistent board profiles, a local Monaco editor, revision history and undo.
- **Compiler checks:** Arduino CLI compilation for Uno, classic Nano and Mega;
  Python syntax checking without executing submitted scripts.
- **AI assistance:** read-only explanations, debugging with real compiler tools,
  and staged file proposals you can inspect, apply or reject. Supports Gemini,
  Groq, OpenAI, Anthropic and compatible local servers.
- **Circuit editor:** explicit named terminals/nets, editable parts, pan/zoom and
  a keyboard-accessible connection inspector.
- **Uno execution:** AVR8js runs actual compiled firmware in a browser worker.
  Inspect GPIO transitions, operate a connected push button and capture UART text.
- **Portable experiments:** export/reimport source, target/core versions, connections,
  notes and recorded run results. Compare capture timing and UART text; imported recordings remain labelled imported.
- **Local storage:** SQLite experiments with browser draft recovery; no account required.
- **Hardware examples:** downloadable [Arduino and Raspberry Pi sources](examples/README.md).

**Current limits:** the execution adapter supports Uno/ATmega328P GPIO, timers
and UART. Nano and Mega support compilation; Linux Raspberry Pi supports Python
syntax checks. ESP32/Pico execution, flashing and physical serial capture are not
implemented. Circuit coordinates are a logical terminal view, not physical header
placement. External LED/resistor graphics show connectivity; there is no analog
voltage/current solver. A successful build or emulator run is not physical
hardware validation. AI suggestions require an explicitly configured provider.

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

Open [Studio](http://localhost:3000/studio). Configure **Studio → Assistant → Configure AI providers** or set
`GEMINI_API_KEY` / `GROQ_API_KEY` in `frontend/.env.local` and restart the backend.
Editing, examples and Python syntax checks work without AI credentials. Cloud
providers may charge for usage. Local models need their model files downloaded first.

For real Arduino compilation, install [Arduino CLI](https://docs.arduino.cc/arduino-cli/installation/),
put `arduino-cli` on the backend process's `PATH`, then run:

```bash
arduino-cli core update-index
arduino-cli core install arduino:avr@1.8.8
```

The Studio Build button records the current project revision and compiler result. Missing tools or board cores
produce actionable errors. Select Uno, classic Nano or Mega 2560 in the Studio
header. New AVR projects pin core 1.8.8 and build results record the installed
toolchain. Install any declared libraries at their specified versions, for example
`arduino-cli lib install "Servo@1.3.0"`. Compilation does not flash hardware.

## AI configuration

| Provider | Configuration |
| --- | --- |
| Gemini | Assistant → Configure AI providers; or server `GEMINI_API_KEY`, optional `GEMINI_MODEL` |
| Groq | Assistant → Configure AI providers; or server `GROQ_API_KEY`, optional `GROQ_MODEL` |
| OpenAI | Assistant → Configure AI providers; enter your API key and an available model ID |
| Anthropic | Assistant → Configure AI providers; enter your API key and an available model ID |
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
persists under `./data`. Use Compose v2.24 or newer. The default backend image
bundles checksum-verified Arduino CLI 1.5.1 and AVR core 1.8.8 for Linux amd64/arm64.
The container build downloads these once. Set `PROJECTCRAFT_BACKEND_TARGET=runtime`
for a lighter image without the compiler; Build then explains the missing tool.
Additional libraries must be installed explicitly. No API key is needed for
editing, compilation, supported Uno execution or experiment export.

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
frontend/      Next.js UI, project workspace, circuit editor and AVR worker
backend/       FastAPI, project revisions, staged proposals, builds and SQLite
examples/      Downloadable hardware source files
data/          Hardware references and project catalog (runtime data ignored)
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

Licensed under [MIT](LICENSE). Maintained by B Mokshagna Reddy and contributors.

## Working with an experiment

1. Open Studio and choose Blink, Button input, Empty project or import an `.ino`,
   `.py` or ProjectCraft JSON bundle. No model setup is needed for the core flow.
2. Edit and select the board. Changes save as revisions; a conflicting session is
   reported instead of overwriting its work. Unsaved drafts can be exported.
3. Build. Click a diagnostic to reach its file/line. Editing after a build marks
   that result stale and disables execution until rebuilt.
4. On Uno, Run executes the compiled HEX in a worker. Signals show cycle-based
   timestamps; Serial displays actual emulator UART output. Stop saves a capture.
   The recording retains at most 10,000 events and reports dropped events. Compare
   saved captures using GPIO transition counts, median rising intervals and UART text.
5. Export preserves the experiment and run metadata. Reimport creates a new
   project; reference recordings are not reported as freshly executed results.
6. Open Assistant only when useful. Explain mode cannot mutate project files.
   Modify stages a proposal; applying a stale proposal is rejected. Undo restores
   the previous saved revision. Hosted providers can charge for usage; local
   models require their own downloads and sufficient compute.

## Third-party components

The Uno engine uses [AVR8js](https://github.com/wokwi/avr8js) 0.21.1, licensed MIT,
by Uri Shaked and contributors. Monaco and other dependencies retain their own
licenses. The bundled [Arduino CLI](https://github.com/arduino/arduino-cli/tree/v1.5.1)
and AVR toolchain/core have their own terms; the compiler image retains CLI license
text and source references under `/usr/share/licenses/arduino-cli` and upstream
core/tool files under `/root/.arduino15`. ProjectCraft's MIT license does not
replace the licenses of those tools. Browser graphics are a custom logical view.
