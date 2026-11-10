# Validation

Run from the repository root with Node.js 22 and Python 3.12:

```bash
pnpm install --frozen-lockfile
pnpm setup:backend
pnpm type-check
pnpm lint
pnpm test
pnpm test:backend
pnpm build
pnpm audit --prod
```

Backend tests use a temporary database and controlled provider HTTP responses.
They cover provider selection, local keyless models, native and text tool calls,
streaming text/tool arguments/usage, workspace snapshots, upload path validation,
generation response shape and compiler diagnostics. They do not call paid APIs.
Live credentials, provider quotas and model-specific code quality need a separate
connection test with your own provider.

When Arduino CLI and the `arduino:avr` core are on PATH, the suite also compiles
the actual blink example for Uno, Nano and Mega and checks that invalid code
fails. Without that toolchain, those integration tests explicitly skip. Python
checks parse code without executing imports or GPIO operations.

## Browser checks

Start a disposable instance with both services, then:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Set `STUDIO_ORIGIN` to use another origin/port. The smoke script visits the home,
hardware resources, projects and Studio pages; waits for the locally served Monaco
editor; checks backend health, Python syntax and a real source download; then
reloads Studio at a mobile viewport and rejects browser runtime/hydration errors.
Run against disposable workspace storage: visiting Studio saves its starter files.
Browser binaries and local reports are not committed.

## Container checks

```bash
docker compose config --quiet
docker compose build
docker compose up -d
curl http://localhost:3000/api/health
curl http://localhost:3000/api/compile/info
pnpm test:e2e
docker compose down
```

The base image should return an actionable 503 for Arduino compilation because it
does not include Arduino CLI. Python syntax checks and provider configuration can
work without it. See [deployment](DEPLOY.md) to add the toolchain.

## Scope of evidence

Compilation is not flashing, CPU emulation or physical hardware testing. A syntax
check does not prove imports or GPIO behavior. The preview shows illustrative LED
animation and does not synthesize sensor readings. No real hardware validation or
live cloud AI quality benchmark is claimed by the repository's automated tests.
