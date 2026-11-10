# Contributing

ProjectCraft focuses on the embedded workflow: code editor, compiler checks,
wiring visualization and optional AI for Arduino, Raspberry Pi and IoT devices.
Read [scope](docs/PROJECT_SCOPE.md), [architecture](docs/ARCHITECTURE.md),
[setup](docs/SETUP.md) and the [code of conduct](CODE_OF_CONDUCT.md).

## Setup and checks

```bash
git clone https://github.com/moksha10171/proectcraft_studio.git
cd proectcraft_studio
pnpm install --frozen-lockfile
pnpm setup:backend
pnpm env:init
pnpm dev
```

Use Node.js 22, pnpm 10.13.1 and Python 3.12. Configure your own AI models only
when needed; regression tests do not require live credentials.

Before a pull request:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm test:backend
pnpm build
```

Lint reports existing warnings while blocking errors; the ESLint config documents
the incremental adoption of newer React compiler rules. Do not add broad ignores
to hide new correctness failures. ESLint 9 is retained for compatibility with the
Next.js React/import plugins; test plugin compatibility before a major upgrade.

## Changes

- Branch from `main` and use concise commit messages describing the behavior.
- Keep PRs focused. Describe the bug/feature, the result and checks actually run.
- Test provider selection and tool argument contracts when changing AI code.
- Check compiler exit status, not AI assertions, when claiming a build works.
- Describe which hardware and libraries you actually tested. Do not claim
  emulation or physical hardware validation from visual animation.
- Add real downloadable source for catalog examples. Do not invent ratings,
  popularity, benchmark results, URLs or community adoption.
- Keep `.env*`, keys, databases, uploads, virtualenvs, node_modules, build output,
  screenshots and local test reports out of commits. Source tests belong in Git.

## Adding an AI tool

Add its metadata and JSON input schema to
`backend/app/agent/registries/tools.py`, implement it in
`backend/app/agent/tools/executor.py`, include any device mapping and add a
regression test. Provider calls belong in backend adapters, not UI components.

## Reporting issues

Use [GitHub Issues](https://github.com/moksha10171/proectcraft_studio/issues).
Include reproduction steps, OS, Node/Python versions and sanitized errors.
Follow [SECURITY.md](SECURITY.md) for private vulnerability reports.
