# Security Policy

## Supported Versions

ProjectCraft is open-source and self-hosted. Security fixes are applied to the `main` branch.
There are no versioned releases with independent support windows — always run the latest commit.

## Architecture & Security Model

ProjectCraft is a **local-first, self-hosted tool with no backend accounts**:

- **No authentication** — the app is intended for local/private-network use.
- **No stored credentials** — API keys are either in your `.env.local` (never committed) or entered
  in the in-browser Model Manager and stored in `localStorage` on your device only.
- **No external data collection** — your prompts, code, and API keys never leave your machine except
  for the direct calls you make to your chosen AI provider (Gemini, Groq, OpenAI, Anthropic, or a
  local Ollama instance).
- **No database** — project data lives in `data/` JSON files you own.

## Responsible Use

Because ProjectCraft runs locally and calls AI APIs with your own keys:
- Protect your `.env.local` — never commit it.
- If you deploy to a public URL (Vercel, Railway, etc.), treat the deployment as a private tool or
  add your own access controls (e.g. Vercel password protection, network ACLs).

## Reporting a Vulnerability

If you discover a security issue in this codebase (e.g. XSS, injection, data leakage), please
report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email: **security@projectcraft.dev** (or open a [GitHub private vulnerability report](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
   if that is configured for this repo).
3. Include: a description of the issue, steps to reproduce, and any relevant code references.
4. We will respond within 72 hours and coordinate a fix before public disclosure.

## What is Out of Scope

- Issues that require physical access to the machine running the app.
- Rate-limiting bypass on a local (non-public) install — by design, rate limiting only applies when
  you expose the app publicly.
- Issues in AI provider APIs themselves (report those to the respective provider).
