# Frontend

Next.js UI for the ProjectCraft hardware workbench. Contains Monaco editing,
wiring visualization, model configuration and browser persistence. Studio agent,
generation, compiler and workspace routes proxy to the Python backend.

From the repository root run `pnpm dev:frontend`, or `pnpm dev` for both services
after `pnpm setup:backend`. See [setup](../README.md) and
[hosting/customization](../README.md).

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_GITHUB_URL` are
build-time settings. Theme tokens live in `app/globals.css`. Keep credentials in
server environment variables or the in-app Model Manager, never public variables.

Checks: `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` from the root.
