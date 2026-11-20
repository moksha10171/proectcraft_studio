# ProjectCraft Studio

[![CI](https://github.com/moksha10171/proectcraft_studio/actions/workflows/ci.yml/badge.svg)](https://github.com/moksha10171/proectcraft_studio/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A self-hosted, open-source workbench for **Arduino, Raspberry Pi and IoT learning**.
Write embedded code, build it with the real Arduino toolchain, run Uno firmware in
the browser, measure what every pin did, and check the sketch against the circuit.
An optional AI assistant explains, debugs and drafts changes that it compiles
before you review them. Designed for students, educators and makers.

## What works

- **Project workspace:** named experiments, board profiles, a local Monaco editor,
  revision history, undo and browser draft recovery. No account required.
- **Real builds:** Arduino CLI with a pinned `arduino:avr` core compiles Uno, classic
  Nano and Mega sketches; diagnostics link to the file and line. Raspberry Pi
  Python gets a syntax check.
- **Uno execution:** [AVR8js](https://github.com/wokwi/avr8js) runs the compiled HEX
  in a browser worker: GPIO, timers (`millis`, `delay`, PWM), the ADC
  (`analogRead`) and UART output. Press a wired push button or turn a
  potentiometer while the firmware runs.
- **Raspberry Pi Python simulation:** scripts run in the browser ([Pyodide](https://pyodide.org))
  against a simulated `RPi.GPIO` and `gpiozero` (LED, PWMLED, Buzzer, Button) on a
  virtual clock, so `time.sleep(1)` costs no real time and runs are deterministic.
  Pin activity feeds the same analyzer, plotter and circuit view; hold a button in
  the circuit and callbacks fire. Errors show a Python traceback. This is not a
  Raspberry Pi: no Linux, threads, I2C/SPI or other libraries' hardware access, and
  scripts are cut off at 30 simulated seconds.
- **Signal analyzer:** multi-pin waveforms with zoom, pan and A/B cursors;
  per-pin frequency, period, duty cycle and pulse widths; analog input lanes;
  Value Change Dump export for GTKWave or PulseView.
- **Serial plotter:** numbers printed over UART (`raw=512 duty=127`, `temp:23.5`,
  or bare values, as in the Arduino Serial Plotter) become live series against
  emulated time, with a crosshair readout, table view and CSV export.
- **Live circuit:** while firmware runs, a connected LED lights by the measured
  share of time its pin is on, so a PWM dimmer visibly dims.
- **Circuit and wiring check:** parts (LED, resistor, button, potentiometer) joined
  by named nets, with a keyboard-accessible inspector. The wiring check compares
  the pins the sketch uses with the connections and flags unconnected pins, LEDs
  without resistors, floating inputs, `analogWrite` on non-PWM pins and more.
- **Optional assistant:** explains, debugs and drafts edits, compiles and
  wiring-checks its own draft, and hands over one proposal with a line diff and
  its verification results. Nothing changes until you apply it. Works with Gemini,
  Groq, OpenAI, Anthropic and OpenAI-compatible local servers.
- **Portable experiments:** export and re-import source, board, core version,
  connections, notes and recordings as one JSON bundle; compare saved runs.
- **Starter experiments:** Blink, button input and potentiometer dimmer templates,
  plus downloadable [Arduino and Raspberry Pi sources](examples/README.md).

**Current limits:** the Uno (AVR8js) and Raspberry Pi Python (GPIO simulation) are
the only executed targets, and neither models I2C/SPI peripherals or external
devices beyond the button and potentiometer inputs. Nano and Mega compile only.
ESP32/Pico execution, flashing and physical serial capture are not implemented. The circuit is a logical connection view, not
physical placement or an analog solver: a potentiometer supplies a voltage to the
ADC, and LED glow reflects pin duty cycle, but current and forward voltage are not simulated. A successful build or
emulator run is not hardware validation. AI features need a configured provider.

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

## Working with an experiment

1. Open Studio and choose Blink, Button input, Analog dimmer, Empty project, or
   import an `.ino`, `.py` or ProjectCraft JSON bundle. No AI setup is needed.
2. Edit and select the board. Changes save as revisions; a conflicting session is
   reported instead of overwriting its work. Unsaved drafts can be exported.
3. Build (or Check syntax for Python). Click a diagnostic to reach its file and line. Editing after a build
   marks that result stale and disables execution until you rebuild.
4. On Uno, Run executes the compiled HEX in a worker; on Raspberry Pi, Run
   simulates the Python script (the first run downloads the interpreter, about
   13 MB). Press buttons and move
   potentiometer sliders in the circuit view while it runs; connected LEDs glow
   with their pin's duty cycle. Serial shows the emulated UART output and
   Plotter graphs the numbers in it. Signals measures each pin; click the
   waveform to place A/B cursors, and export VCD. Stop saves a recording (at
   most 10,000 events; dropped events are reported). Compare saved runs.
5. Open Wiring check to compare the sketch's pin usage with the circuit.
6. Export preserves the experiment and run metadata. Re-importing creates a new
   project; imported recordings stay labelled as imported, not freshly executed.
7. Open the assistant when it helps. Applying a stale proposal is rejected, and
   Undo restores the previous saved revision. Hosted providers can charge for
   usage; local models need their own downloads and compute.

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

### How the assistant works

The assistant runs on your backend as a tool-using loop over the open project:

1. Each request includes a short project snapshot: board, files, the latest build
   of this revision, wiring-check findings and the latest recording's measurements.
2. It inspects with read-only tools: `LIST_FILES`, `READ_FILE` (line-numbered),
   `CHECK_WIRING`, `INSPECT_RECORDING`, `BOARD_INFO` (pin capabilities and
   electrical limits), `RUN_SIMULATION` and `WEB_SEARCH` when `SERPER_API_KEY` or
   `BRAVE_SEARCH_API_KEY` is set. `RUN_SIMULATION` runs your open project (or the
   assistant's draft) in the simulator for a few simulated seconds, optionally with
   potentiometer positions or held buttons, and returns measured frequency, duty
   cycle and printed text, so it can check behaviour and not only that code
   compiles. The simulation runs in your open Studio tab, which must stay open.
3. In debug and modify modes it edits a **draft** with `EDIT_FILE` (exact text
   replacement) or `WRITE_FILE`. `CHECK_PROJECT` compiles the draft with the
   real toolchain without saving it, so the assistant can fix its own errors.
4. When it finishes, the draft becomes one proposal. If the assistant did not
   check its final draft, the backend builds and wiring-checks it first. The
   review panel shows the diff and those results; you apply or reject it.

Explain mode only has the read-only tools. Tool errors (text not found, ambiguous
match, invalid path) go back to the model so it can correct itself. Every step is
listed in the panel and stored with the project's chat history.

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

Tests use temporary databases and scripted provider responses; they do not call a
hosted model or spend API credits. With Arduino CLI and `arduino:avr` on PATH, backend tests compile
actual Uno/Nano/Mega examples; otherwise those integration tests skip. For browser
checks, start both services against disposable workspace data, run
`pnpm exec playwright install chromium`, then `pnpm test:e2e`. The browser check
drives the assistant with a local scripted OpenAI-compatible endpoint, so it tests
the loop, real draft builds and the review UI without an AI service. Use `STUDIO_ORIGIN`
for a different URL, or `PLAYWRIGHT_CHANNEL=chrome` to use an installed Google
Chrome (also used by CI). On Windows, run backend tests with
`backend\.venv\Scripts\python.exe -m pytest backend/tests -q`.

If compilation returns 503, check the CLI is on the backend PATH. Missing board
cores or libraries appear in compiler output. After changing AI credentials,
restart the backend. Health reporting `needs_config` indicates absent server AI
keys; browser-configured models and non-AI features can still work.

```text
frontend/      Next.js UI, workbench, circuit editor, signal analyzer and AVR worker
backend/       FastAPI, project revisions, builds, wiring check, assistant loop, SQLite
examples/      Downloadable hardware source files
data/          Hardware references and project catalog (runtime data ignored)
```


## Third-party components

The Uno engine uses [AVR8js](https://github.com/wokwi/avr8js) 0.21.1, licensed MIT,
by Uri Shaked and contributors. Raspberry Pi Python runs on [Pyodide](https://pyodide.org) (MPL-2.0). Monaco and other dependencies retain their own
licenses. The bundled [Arduino CLI](https://github.com/arduino/arduino-cli/tree/v1.5.1)
and AVR toolchain/core have their own terms; the compiler image retains CLI license
text and source references under `/usr/share/licenses/arduino-cli` and upstream
core/tool files under `/root/.arduino15`. ProjectCraft's MIT license does not
replace the licenses of those tools. Browser graphics are a custom logical view.

## License

Licensed under [MIT](LICENSE). Maintained by B Mokshagna Reddy and contributors.

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)
