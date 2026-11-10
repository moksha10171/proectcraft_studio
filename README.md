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
produce actionable errors. See [setup](docs/SETUP.md) for board selection, libraries
and troubleshooting.

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
fallback; model support varies. See [AI setup](docs/AI_SETUP.md).

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
persists under `./data`. The base backend image does not include Arduino CLI;
[deployment instructions](docs/DEPLOY.md) explain how to add it.

Configure the app name, public URL and repository link with build-time
`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GITHUB_URL`. Theme tokens
live in `frontend/app/globals.css`. See [deployment](docs/DEPLOY.md) for Docker,
separate-process hosting, backups and remote model servers.

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
API credits. See [validation](docs/VALIDATION.md) for live compiler and browser checks.

```text
frontend/      Next.js UI, browser persistence, metadata and search
backend/       FastAPI, AI providers and tools, compiler API, SQLite persistence
examples/      Downloadable hardware source files
data/          Hardware references and project catalog (runtime data ignored)
docs/          Setup, AI, hosting, architecture and validation
```

[Architecture](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md) ·
[Security](SECURITY.md) · [Related tools and scope](docs/PROJECT_SCOPE.md)

Licensed under [MIT](LICENSE). Maintained by B Mokshagna Reddy and contributors.
