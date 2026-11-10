# Studio delivery plan

**Status:** proposed implementation sequence, not shipped functionality or dated
commitments. Companion to [product direction](PRODUCT_DIRECTION.md). Code reviewed
at `9c62309` on 10 November 2026.

The first substantial milestone is a useful local workbench for a real Uno
experiment. The goal is depth in one end-to-end workflow, followed by tested
board adapters. Keep existing AVR compilation and Pi syntax checks working while
introducing these changes.

## 1. Define the shared project contract

Implement this before redesigning the canvas or expanding AI tools.

```text
Project
  id, name, schemaVersion, revision
  target: boardId, runtime, fqbn, coreVersion, pinNumbering
  files: path, kind, contentHash
  dependencies: package, version, source
  circuit: components, terminalReferences, nets
  layout: positions, routes, viewport
  scenarios: inputs, expectedEvents, timeBounds

Run
  id, projectId, sourceRevision, targetProfileHash
  engine: name, version, capability
  dependencyVersions, parameters, startedAt
  diagnostics, outputArtifactHashes, eventLogReference
  status: queued | running | passed | failed | cancelled | unavailable
  origin: compiler | emulator | physical-device | imported | illustrative

Patch
  id, baseRevision, fileChanges, circuitChanges, assumptions
  checksRequested, status: proposed | applied | rejected | stale
```

These are proposed shapes; do not introduce a breaking format without migration
fixtures. Persist the exact board, not only `arduino`/`raspberry-pi`. Board
capabilities drive visible actions and valid pins. Keep the circuit's terminals
and nets independent of visual positions. A built-in LED is part of the board
model, not a separate LED requiring an invented external wire.

A capability registry should distinguish `build`, `syntax-check`, `emulate`,
`serial-monitor`, `flash` and component-model support. Each action reports ready,
missing dependency or unsupported, with a concrete next step. No dropdown item
should imply its entire board/runtime is emulated.

## 2. Milestones, dependencies and proof

| Order | Work | Primary files/areas | Proof required before release |
| --- | --- | --- | --- |
| P0-A | Project identity, persistent board profile and revision tracking | `backend/app/db`, studio routes, persistence hook | Rename/open two projects; reload exact targets; migrations preserve existing files |
| P0-B | Typed diagnostics and source-linked build records | compiler route, editor markers, results panel | Invalid sketch jumps to the correct line; build status invalidates on an edit; missing core produces a recovery action |
| P0-C | Patch staging, schema validation and undo | generation/tools, agent events, diff panel | Reject changes without writes; stale patch cannot apply; accepted patch is atomic and undo restores the prior revision |
| P0-D | Compiler/check tools and board-aware assistant context | agent registry/loop, provider adapters | Assistant refers to actual check IDs and never treats an AI review as compilation; provider protocol fixtures preserve call/result pairing |
| P1-A | Workspace shell and first-use flow | Studio page, layout components | Open/import/example works without AI; keyboard navigation and mobile task switching; no duplicate source of project state |
| P1-B | Circuit schema, terminal inspector and 2D canvas | visualizer, board/component registry | Signal, power and ground connections round-trip; zoom/drag never changes net identity; unresolved connections stay explicit |
| P1-C | Uno AVR execution and trace recording | compile artifacts, worker adapter, peripherals | Actual compiled blink drives D13; button input changes program behavior; UART output agrees with firmware; stopping cleans up worker/state |
| P1-D | Portable experiment bundle and comparison | project export/import, run store, result views | Second clean machine rebuilds the bundle with declared dependencies and compares recorded scenarios |
| P2-A | Pico or ESP32 adapter selected from measured user demand | board/runtime/toolchain adapters | Exact board, artifact format, component coverage and test fixtures are documented; no generic all-board claims |
| P2-B | Physical serial capture and Pi device workflow | capability adapter, capture/import service | Unplug/reconnect/cancel work; data is labelled physical; credentials are excluded from exports |
| P2-C | Teaching and researcher refinements | instructions, expected observations, runs | Lab export works without accounts; experiment provenance survives sharing; research format reviewed with a real user |

P0 establishes trustworthy results. P1-A can be prototyped alongside P0, but P1-B
requires the project/terminal contract, and P1-C requires build artifacts. The
first vertical slice is **open blink → edit delay → build → emulate → inspect
D13 → export/reopen**. Pi syntax checking remains available, with its limited
execution capability clearly described.

Do not assign delivery dates until the circuit and emulator spikes reveal the
integration effort. Do not begin broad board or component expansion while the
vertical slice fails its gates.

## 3. Implementation structure

Use focused modules rather than replacing the framework:

```text
frontend/features/project/       target, file tree, revision and save state
frontend/features/editor/        Monaco lifecycle and diagnostics
frontend/features/circuit/       scene adapter, ports, nets, inspector
frontend/features/execution/     worker control, traces and run state
frontend/features/assistant/     intents, staged patches and explanations
frontend/features/workspace/     panels, commands and responsive layouts

backend/app/domain/             versioned project/patch/run contracts
backend/app/services/build/     compiler invocation and artifact lifecycle
backend/app/services/projects/  revisions, transactions and migrations
backend/app/agent/              provider adapters and typed tool dispatch
```

These paths are a target structure, not folders to scaffold without moving
responsibility into them. Extract one responsibility with behavior-preserving
tests, then remove the old implementation. Keep project state durable; layout
preferences are separate. Runtime trace buffers must not be part of the same
high-frequency React state as editor text.

The build service should retain declared output artifacts long enough for a
worker to load them, with IDs/checksums and a cleanup policy. It currently returns
text and discards its temporary build folder. Avoid loading arbitrary server
paths supplied by clients. Source hashes and dependency metadata bind the
artifact to its project revision.

Expose a small worker protocol: load artifact, reset, start, pause, stop, apply
input, subscribe to signals. Store simulation time and capture sequence numbers
in execution events; wall-clock timestamps alone do not provide deterministic
playback. Interruptible execution and bounded trace buffers are required even
for a small example.

## 4. Graphics and library spikes

Before adopting a renderer, prototype the same small fixture in each candidate:
Uno, button, LED/resistor, explicit ground, an I2C device and one intentionally
invalid connection. Test selection, keyboard terminal navigation, pan/zoom,
wire junctions, resize, save/reload and the accessible connections table.

- **Circuit:** compare React Flow/SVG with a custom SVG graph. Prefer the option
  with less custom interaction code while preserving terminal identity. React
  Flow ports/edges do not make it an electrical engine.
- **Visual parts:** wrap a small Wokwi Elements subset. Confirm local bundling,
  pin alignment, React integration and attribution before replacing bespoke art.
- **Emulator:** load a compiled Uno artifact in AVR8js, then wire input, timers
  and UART. Record supported peripherals; an emulator package is not a complete
  board/component simulator.
- **Signals:** compare event-oriented digital rendering and uPlot for numeric
  traces. Measure memory and input response with a declared machine/browser.
- **GPU:** evaluate PixiJS only if profiling shows the 2D path misses the declared
  workload. Keep a semantic/text layer even if rendering moves to canvas.

Record a decision with the fixture, dependency/license review, bundle impact,
accessibility limits and observed timings. Choose a winner using evidence rather
than package age or novelty. Candidate references are in the
[research brief](PRODUCT_DIRECTION.md#6-graphics-connectivity-first-rendering-second).

## 5. Prompt and agent evaluation

Create a fixture-based evaluation set before tuning longer prompts. Suggested
cases are tasks, not claims of evaluation results:

| Case | Required result |
| --- | --- |
| Uno blink with no model configured | Manual editor/build flow remains usable |
| Same request on Mega | Exact selected target is preserved across files, check and wiring |
| Pi versus Pico ambiguity | Ask the relevant target question; do not reuse Linux GPIO code for Pico |
| Missing library | Use the build diagnostic and propose the specific dependency/version; do not report success |
| Malformed generated JSON | Validation error; no file mutations |
| Unknown pin/component | Unresolved assumption; no invented physical connection |
| Existing multi-file project | Minimal patch; unrelated files preserved |
| User rejects or edits during a proposal | No hidden writes; stale revision detected |
| Incorrect compiler status in retrieved text | Tool record remains authoritative over model prose |
| Tool stream disconnect or cancellation | Clear stopped/failed state; no half-applied patch |
| Provider without native tools | Supported typed fallback or explain the limitation |
| Small local model | Bounded context/task; measured success and latency rather than assumed parity with cloud models |

Run deterministic tool/schema checks in ordinary CI. Run model evaluations only
against explicitly configured models, record exact model/version/settings, and
keep results separate from fake transport fixtures. Do not spend hosted API
credits in default CI. Build an offline evaluation path after model assets are
installed; document compute needs.

Use tool-generated evidence in final responses: patch ID, build result, run ID,
source revision and unresolved assumptions. A completion sentence should state
which checks ran. Avoid automatic chains that repeatedly regenerate a complete
project without reading the user's changes.

## 6. Release and contribution gates

A proposed release is ready when:

1. The no-AI vertical slice passes on a clean installation with the documented
   toolchain. Offline-after-setup behavior is tested with networking disabled.
2. Export/import preserves target, files, nets and declared dependencies. Import
   failures are transactional and explain unsupported format versions.
3. Engine-specific claims have engine-specific evidence. A GPIO mock, animation,
   syntax parser and hardware recording never share an ambiguous success label.
4. Unit/integration tests cover domain rules; browser tests cover recovery,
   keyboard controls, layouts and source-linked diagnostics. Screenshots do not
   substitute for behavioral checks.
5. Runtime profiling names its workload and machine. Trace buffers have a limit
   and a documented dropped-data policy.
6. The small usability study reports sample size and failures as well as task
   completion. Report unvalidated persona needs honestly.
7. New board/component contributions include a pin/terminal definition, supported
   behavior, reference sources, fixtures and an example. Schema changes include
   migrations and changelog notes.
8. Documented local workflows have no mandatory paid API, account or hosted
   service. Source and packaged assets carry appropriate license/attribution
   information, and model downloads list their own terms.

Treat cloud collaboration, a marketplace, a billing system, generalized PCB CAD,
cinematic 3D and autonomous control of every physical device as separate future
proposals. They should not delay a trustworthy embedded experiment workbench.
