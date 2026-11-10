# Architecture

```text
Browser (Monaco editor, wiring preview, Models)
  → Next.js :3000
      → rewrites /api/agent, /api/generate, /api/compile,
                 /api/studio/*, /api/projects/*, /api/health
          → FastAPI :8000
              ├─ shared AI provider selection + streaming adapters
              ├─ agent loop → tool registry → generation/file tools
              ├─ compiler → Arduino CLI / Python AST parser
              └─ SQLite repository + upload files
```

The backend owns agent turns, tool execution and workspace records. Browser
localStorage keeps model cards, drafts and fallback snapshots. BYOK credentials
travel from the browser through the instance backend to the chosen provider;
environment keys remain server-side. Provider credentials are not workspace data.

## AI flow

`POST /api/agent` accepts a workspace ID, message, mode and optional model config.
The backend assembles domain instructions, loads saved history, streams provider
responses and executes structured tool calls. Tool arguments are defined by the
server registry. Tools sharing a SQLAlchemy session execute serially to preserve
file/pending-state order. Custom models can use native tools or fenced JSON calls.
SSE events include text deltas, tool start/end, file/wiring updates, usage and done.

`POST /api/generate` calls the same backend generation implementation for direct
Studio actions. This avoids a second provider implementation in Next.js. Existing
`/api/chat` and `/api/search` are legacy catalog helpers; the Studio agent does not
use them for its provider lifecycle.

## Compiler and visualizer

`POST /api/compile` validates source filenames and uses a temporary sketch folder
for an allowlisted AVR board. It invokes Arduino CLI without a shell and returns
real process status/output. Python uses AST parsing only. Neither path runs the
uploaded program or flashes hardware. These checks require a trusted instance;
the local compiler is not a multi-tenant execution sandbox.

The visualizer is an illustrative component renderer. It is not connected to a
CPU emulator or an electrical solver. See [scope](PROJECT_SCOPE.md).

## Persistence

- `data/projectcraft.db`: SQLAlchemy/SQLite workspaces, files, messages, tool calls,
  wiring and usage records.
- `data/uploads/`: user attachments tracked in SQLite.
- `data/studio/workspaces/`: legacy JSON migration source, not the active store.
- `data/projects/`: versioned example catalog; downloads reference actual source.

`PROJECTCRAFT_DATA_PATH` selects the studio location and its parent data root;
project catalog lookup remains tied to repository source. Tests set this path to
a temporary directory before importing the app.

The backend persists agent chat. Browser fallback saves do not replace the
backend transcript on every UI update. Codebase PUT is a complete snapshot:
removed files stay removed and null wiring clears old diagrams.
