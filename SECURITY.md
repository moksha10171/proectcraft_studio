# Security policy

Security fixes target `main`; there are no independently supported release lines.

## Trust model

ProjectCraft is a self-hosted, single-user workbench without built-in login.
Keep the backend private and protect remote UI access with an authenticated TLS
reverse proxy or VPN. Anyone who can reach the API can access workspaces and use
server-configured AI credits. The compiler is a local build tool, not a sandbox
for hostile multi-tenant submissions.

API keys live in server environment variables or browser localStorage. Browser
keys are sent to the instance backend and then the selected provider. Prompts and
source code are sent to that provider during AI use. Do not configure provider
URLs you do not trust. Never use `NEXT_PUBLIC_*` variables for credentials.

Workspace records use SQLite; attachments live on disk. These runtime files,
credentials and local validation reports are ignored by Git and Docker build
contexts. There is no built-in authentication, quota enforcement or automatic
public-deployment isolation. No analytics integration is enabled by default.

## Reporting a vulnerability

Contact the maintainer at **moksha10171@gmail.com** with reproduction steps,
affected commit and sanitized logs. Do not include keys or private workspace
contents. Avoid public issues containing exploit details or secrets. GitHub's
private reporting feature may also be used if enabled for this repository.
There is no guaranteed response-time SLA.

## Credentials and backups

Rotate exposed provider keys, remove them from browser storage and environment
files, and restart the backend. Keep database/attachment backups private. See
[deployment](docs/DEPLOY.md) for SQLite backup guidance.
