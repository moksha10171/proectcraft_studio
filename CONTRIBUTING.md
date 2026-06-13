# Contributing to ProjectCraft

Thanks for contributing! This guide gets you set up and explains how the project works.

## Dev Setup

```bash
git clone https://github.com/your-org/projectcraft
cd projectcraft
cp .env.local.example .env.local
# Add at least one AI key to .env.local (GEMINI_API_KEY or GROQ_API_KEY)
pnpm install
pnpm dev
```

Requires Node 20+ and pnpm. Check `.nvmrc` if you use nvm.

Health check: http://localhost:3000/api/health

## Project Structure

```
app/            Next.js App Router pages + API routes
  api/
    agent/      Streaming multi-turn agent endpoint (the core)
    generate/   Single-shot generate/verify/wiring endpoint
    chat/       Simple project chat endpoint
components/
  arduino-studio/   Studio IDE sub-components (editor, terminal, simulation)
  studio/           Agent panel, Model Manager, Model Card
lib/
  agent/            Agent loop support (executor, prompts registry, tool-pairs, workspace-agent)
  arduino-studio/   Types, tool registry, prompt templates, stream parser, gemini-service
  ai-providers.ts   Gemini + Groq helpers (env-key path)
data/
  projects/     JSON project definitions (edit to add your own)
  resources/    Resource metadata (hardware/software guides)
public/         Static assets
```

## How the Agent Works

The agent loop is a TypeScript port of [Logen](https://github.com/your-org/logen)'s workspace agent pattern:

1. User types a message in the Studio Terminal.
2. `useAgentEngine` streams from `/api/agent` (SSE) — proxied to the **Python backend**.
3. Python `/api/agent` calls Gemini, Groq, OpenAI, or Anthropic with native **tool_use** when enabled, with text ` ```tool_call` fallback for local models.
4. Tool definitions live in `lib/arduino-studio/tool-registry.ts`; execution in `lib/agent/tools/executor.ts`.
5. Domain prompts are lazy-loaded via `FETCH_PROMPTS` from `lib/agent/prompts/registry.ts`.
6. Agent config and instructions: `lib/agent/workspace-agent.ts`.
7. Message history is sanitized via `lib/agent/tool-pairs.ts` before each LLM call.
8. Tool results auto-apply code and wiring to the Studio editor/visualizer.

## Adding a Tool

1. Add it to `lib/arduino-studio/tool-registry.ts` (name, purpose, input schema, tags).
2. Add a case in `lib/agent/tools/executor.ts`.
3. If it needs a new prompt template, add to `lib/agent/prompts/registry.ts` and `lib/arduino-studio/prompt-templates.ts`.
4. For generate-style tools, add an `action` in `app/api/generate/route.ts` using prompt-templates.

## Adding a Project

Edit `data/projects/projects.json`. Schema is in `lib/projectcraft-api-types.ts`.

## Code Style

- TypeScript strict mode is on. `pnpm type-check` must pass.
- No auth, no billing, no external user-data calls — keep it local-first.
- Prefer editing existing files to adding new ones.
- Comments only when the WHY is non-obvious.

## Pull Requests

1. Fork → branch from `main` → PR against `main`.
2. Keep PRs focused — one feature or fix per PR.
3. `pnpm build` must succeed (no type errors, no lint errors).
4. Describe *why* in the PR description, not just what changed.

## Reporting Issues

Use [GitHub Issues](https://github.com/your-org/projectcraft/issues).
For security issues, see [SECURITY.md](SECURITY.md).
