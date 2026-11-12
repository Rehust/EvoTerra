# EvoTerra — Overnight Coding-Agent Shift Plan

> **Mission:** Establish a clean, runnable EvoTerra application and deliver a small, deterministic, worker-driven 2D movement prototype.
>
> **Execution window:** One focused overnight shift, planned for approximately 8 hours of elapsed agent work.
>
> **Starting point:** Repository contains project specifications and agent guidance only. No application scaffold or package scripts are assumed to exist.
>
> **Target environment:** Linux/amd64, 1 vCPU, 2 GB RAM.
>
> **Primary output:** A buildable React + TypeScript + Vite application with a PixiJS 8 WebGL world viewport, camera pan/zoom, one dedicated simulation Web Worker, deterministic moving test entities, start/pause/reset/speed controls, and automated tests.

---

## 1. Mission and expected result

EvoTerra is a browser-based artificial-life sandbox. The long-term product is a world in which neural-network-driven organisms perceive their environment, move, consume resources, reproduce, mutate, and evolve. The current repository is explicitly pre-implementation.

The first overnight shift must establish the technical foundation without trying to implement the entire product at once. The agent should leave the repository in a state where the next shift can start implementing real creatures and resources on top of a tested simulation/worker boundary.

### 1.1 End-of-shift deliverables

The following are the required outcomes, in priority order:

1. **Safe project scaffold:** React, TypeScript, Vite, and npm scripts are configured without overwriting the supplied `README.md`, `AGENTS.md`, or specification files.
2. **Runnable application shell:** The browser opens an EvoTerra interface with a responsive world viewport and usable controls.
3. **PixiJS world renderer:** PixiJS 8 initializes using the WebGL/WebGL2 path, resizes with its host, and displays a clear world preview.
4. **Camera interaction:** Pan and zoom work in the world viewport. Zoom should remain anchored around the pointer where practical.
5. **Worker-owned prototype simulation:** One dedicated Web Worker owns a minimal deterministic simulation of moving test entities. The main thread does not own or mutate authoritative entity state.
6. **Working controls:** Start, pause, reset, and speed selection communicate with the worker and update the visible state correctly.
7. **Batched snapshots:** The worker sends periodic snapshots containing a tick/sequence number. The UI rejects stale snapshots and updates PixiJS objects without using React state for every entity.
8. **Automated checks:** Vitest tests cover the seeded random generator, deterministic initialization/movement, and basic simulation invariants. Type checking and the production build pass.
9. **Accurate project documentation:** `README.md` describes the actual scaffold and real commands. `AGENTS.md` is updated only where its stated status or roadmap progress has genuinely changed.
10. **Useful handoff:** The agent reports changed files, commands actually run, results, limitations, and the most sensible next task.

The moving entities are **prototype test particles**, not finished biological creatures. The UI and documentation must not imply that neural decisions, food seeking, energy, reproduction, mutation, species, or evolution already exist.

### 1.2 Scope boundary

This shift targets **Roadmap Phase 1 — Application shell and renderer**, and a tightly bounded implementation of **Roadmap Phase 2 — Simulation worker and movement prototype**.

Phase 2 work is included because a basic worker simulation makes the renderer and controls demonstrably useful. It must remain deliberately small and must not pull future ecosystem systems into this shift.

### 1.3 Explicitly not part of this shift

Do not implement any of the following tonight:

- Neural-network inference or creature perception.
- Creature genomes, inherited traits, mutation, or lineage.
- Food, resource regeneration, energy, hydration, temperature stress, or death.
- Reproduction, population ecology, predation, or species classification.
- Procedural noise, terrain generation, rivers, lakes, or the six biome system.
- IndexedDB, save/load, import/export, or migrations.
- Recharts, historical dashboards, Zustand, or complex application-wide state management.
- Multiple workers, Comlink, `SharedArrayBuffer`, WebGPU, WebAssembly, or a Canvas fallback.
- Backend APIs, databases, accounts, cloud sync, multiplayer, Docker, or server-side simulation.
- Playwright or other heavyweight browser tooling unless it is already installed and trivial to use.
- Extensive visual polish that delays the architecture and correctness milestones.

A future feature must not be introduced just because it appears in the product vision or target directory tree. Add a dependency or abstraction only when this shift has a concrete use for it.

---

## 2. Source-of-truth rules

Read all four project documents before editing:

- `neural-creatures-project-description.md`
- `neural-creatures-tech-stack.md`
- `AGENTS.md`
- `README.md`

Use the precedence already defined in `AGENTS.md`:

1. Explicit maintainer instructions.
2. `AGENTS.md`.
3. Project description and technology-stack specification.
4. Existing code and local conventions.

The repository/product name is **EvoTerra**. “Neural Creatures” remains the concept/specification name. Do not rename project documents as part of this shift.

The two specification files define the product and technical architecture. `AGENTS.md` defines how coding agents must behave. `README.md` should describe the current repository truthfully, not repeat the entire specification.

### 2.1 Non-negotiable architecture

- Use TypeScript across UI, simulation, worker, and shared contracts.
- React manages controls, panels, and UI state only.
- PixiJS 8 owns the world visuals, camera, and visual display objects.
- One dedicated Web Worker owns authoritative simulation state.
- `src/simulation/**` remains independent of React, PixiJS, and DOM globals.
- Use seeded randomness in simulation code. Never call `Math.random()` from simulation logic.
- Use fixed simulation steps and separate simulation time from render cadence.
- Use typed, discriminated worker messages.
- Batch worker snapshots. Never send one message per entity per simulation tick.
- Start with structured-clone messages. Do not optimize transfer formats before measurement.
- Do not create a React component or React state entry for each entity.
- The first release is a static frontend. No backend is required.

### 2.2 Agent workflow

- Inspect the repository before creating or replacing files.
- Write a concise implementation plan before substantial changes.
- Use relevant available coding skills if the agent harness provides them; do not assume a skill is installed.
- Add tests with the behavior they protect. Do not delete or weaken tests to get a green run.
- Self-review the final diff. This project has no external code-review or PR-approval gate.
- Do not open a pull request or request a reviewer.
- Do not commit or push unless the maintainer explicitly asks.
- Do not claim a command passed unless it was actually run and its exit status checked.
- If the supplied documents genuinely conflict, stop and report the exact conflict instead of silently changing architecture. The documented defaults in `AGENTS.md` already resolve the known conflicts.

---

## 3. Remote machine operating rules

The machine has **1 vCPU and 2 GB RAM**. Keep the workflow serial and small.

### 3.1 Before running commands

Record:

```bash
pwd
uname -m
node --version
npm --version
git status --short
find . -maxdepth 2 -type f | sort | head -200
```

Confirm the current directory is the intended repository root and architecture is `x86_64`/`amd64`. Check whether Node.js and npm are already installed. Use a currently supported Node.js LTS release if a change is genuinely required; do not install or upgrade system-wide tooling automatically without a clear need and permission.

### 3.2 Resource limits

- Run one package installation, type-check, test run, or production build at a time.
- Do not run multiple coding agents or parallel builds in the same workspace.
- Do not run Docker, databases, local AI models, or unrelated heavy services.
- Do not run watch-mode test processes during the final verification sequence.
- Avoid large browser automation downloads.
- Keep dependencies and generated assets lean.
- If memory pressure appears, stop duplicate processes and repeat the check serially; do not start adding infrastructure to work around a process-management mistake.
- Prefer static analysis, unit tests, and the production build over expensive end-to-end tooling.

### 3.3 Static-hosting distinction

The remote host should install dependencies and build the application. The final `dist/` directory is suitable for static hosting. Each visitor's browser will run React, PixiJS, and the simulation worker. Do not turn the remote host into a simulation server.

`npm run preview` is only for local inspection of a production build; it is not the production hosting solution.

---

## 4. Implementation decisions for this shift

These are bounded defaults to avoid unnecessary maintainer questions. Treat numeric values as prototype defaults, document them in code, and keep them easy to tune. They are not permanent biological or game-balance decisions.

### 4.1 Minimal runtime stack

Use only what the current work needs:

| Purpose | Choice | Include tonight? |
|---|---|---:|
| Language | TypeScript | Yes |
| UI | React + React DOM | Yes |
| Development/build | Vite | Yes |
| World renderer | PixiJS 8 | Yes |
| Unit tests | Vitest | Yes |
| Shared UI state | React state/hooks | Yes, for the small shell |
| Procedural noise | `simplex-noise` | No |
| Global state | Zustand | No |
| Save storage | IndexedDB / `idb` | No |
| Data validation | Zod | No; no external save/import boundary exists yet |
| Charts | Recharts | No |
| UI testing library | Testing Library | Not required for this first shift |

Use the React + TypeScript Vite template as the starting point. Keep the generated strict TypeScript configuration unless an actual issue requires a targeted change.

Do not install the entire planned stack in one command. The initial runtime packages should be limited to the packages required by the React app and PixiJS. Add Vitest and its required test dependencies as development dependencies. Keep the generated npm lockfile.

### 4.2 Scaffold without overwriting supplied documents

The repository already contains `README.md` and `AGENTS.md`. Do not blindly scaffold over the repository root.

Recommended safe approach:

1. Create the Vite React-TypeScript template in a temporary directory outside the repository.
2. Inspect the generated files and package scripts.
3. Copy only the required scaffold files into the repository.
4. Preserve the existing `README.md`, `AGENTS.md`, and specification files; update them intentionally later.
5. Remove the temporary scaffold once the repository scaffold is confirmed.

If the Vite CLI's current options differ from this approach, inspect its help and choose the safest equivalent. Do not overwrite non-template documents merely to avoid a small amount of manual merging.

### 4.3 Prototype world coordinate model

Use a simple bounded rectangular world for the first movement demonstration. A provisional world size such as **1,024 × 768 world units** is acceptable. Keep it in named configuration constants. This is a viewport/prototype coordinate space, not the final 256 × 256 terrain grid and not a permanent world-size decision.

- Entity positions and velocities use continuous floating-point world coordinates.
- The world origin and bounds must be explicit.
- The renderer maps world coordinates to the viewport through a camera/container transform.
- The first prototype can render a subtle grid or coordinate guide, but it must not label the preview as generated terrain or biomes.
- Use a simple boundary behavior, preferably reflection/bounce at world bounds.
- Do not implement all-pairs entity collision. Entity-to-entity collision is not needed for the movement prototype.

### 4.4 Prototype entities

Initialize a modest, fixed number of test entities (for example, **100**) from the worker's seeded random generator.

Each entity needs only the data required by movement and rendering, such as:

- Stable numeric or string ID.
- `x` and `y` position.
- `vx` and `vy` velocity.
- A small visual radius or size.
- A stable visual category/color value if needed.

Do not add fake genome, species, food, energy, health, or neural-network fields. Use neutral names such as `Entity`, `Particle`, or `TestEntity`, not `Creature`, until the actual creature model is implemented.

A reset with the same configured seed must recreate the same initial entity state. Keep visual identity stable across snapshots.

### 4.5 Fixed-step simulation and scheduling

Use a fixed simulation timestep. A sensible prototype starting point is **30 simulation steps per second** (`dt = 1 / 30` seconds). Keep the timestep in a named constant.

- Simulation speed is a multiplier over the number of fixed steps processed, not a variable-size timestep.
- Implement the first speed options as **1×, 2×, 5×, and 10×**.
- Keep worker scheduling separate from the PixiJS ticker/render loop.
- Use an accumulator or an equivalent fixed-step scheduler.
- Cap catch-up work after a delayed worker event-loop turn so a background tab or overloaded host does not cause an unbounded catch-up spiral.
- Document the chosen catch-up policy and test the step logic independently of wall-clock timers.
- Never make tests depend on timing-sensitive sleeps when a direct `step()` function can be tested.

The exact scheduling implementation can vary, but there must be one clear source of truth for simulation tick advancement. Avoid multiple independent timers that can advance the same simulation twice.

### 4.6 Snapshot cadence and ownership

Start with a target of approximately **15 render snapshots per second**, within the 10–20 updates/second guidance in the specifications.

- The worker owns the current entities, world bounds, RNG state, tick, and running/speed state.
- The UI owns only interface state and the latest received render snapshot reference/sequence.
- PixiJS owns display objects and camera transforms only.
- Send a whole compact snapshot in one message.
- Include tick or monotonically increasing sequence metadata.
- Discard snapshots older than the most recently accepted sequence.
- Do not transfer buffers or introduce `SharedArrayBuffer` in this shift.
- Render at browser animation-frame cadence using the newest accepted snapshot. Interpolation is optional and should be deferred if it complicates correctness.

### 4.7 Visual direction

The supplied documents define the world viewport as the primary interface, but they do not prescribe a final visual identity. Use a restrained, polished “simulation observatory” treatment as an implementation choice:

- Dark neutral application chrome with strong text contrast.
- A large central world viewport that remains the dominant surface.
- Compact top-level brand/status area.
- A small control area for play/pause, reset, and speed.
- A compact information panel for current tick, worker status, seed, and entity count.
- Clear empty/error/loading states.
- Subtle borders and restrained accents; avoid excessive gradients, neon effects, or decorative charts.

Do not invent functionality to fill a sidebar. Label prototype information honestly. The first shift is not expected to deliver the finished dashboard, inspector, map-generation panel, or theme system.

---

## 5. Target architecture and module boundaries

Keep the first code structure minimal. Create directories only when they contain real code.

```text
.
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── styles.css
│   ├── components/
│   │   └── controls/              # only if controls justify a separate module
│   ├── rendering/
│   │   ├── PixiWorld.ts           # Pixi lifecycle and visual scene
│   │   └── camera.ts              # camera transforms and interaction
│   ├── simulation/
│   │   └── core/
│   │       ├── config.ts
│   │       ├── random.ts
│   │       ├── types.ts
│   │       ├── createSimulation.ts
│   │       └── stepSimulation.ts
│   ├── workers/
│   │   └── simulation.worker.ts
│   ├── shared/
│   │   └── messages.ts
│   └── main.tsx
├── tests/
│   └── simulation/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig*.json
├── vite.config.ts
├── AGENTS.md
├── README.md
├── neural-creatures-project-description.md
├── neural-creatures-tech-stack.md
└── evoterra-overnight-shift-plan.md
```

This tree is a guide, not a checklist to create empty files. Use the exact Vite template structure where it is simpler. Do not move or rename existing specification documents.

### 5.1 Ownership table

| Layer | Owns | Must not own |
|---|---|---|
| React app | Buttons, panel layout, loading/error status, selected speed, latest stats summary | Per-entity simulation state, world rules, Pixi display objects |
| PixiJS renderer | Canvas, visual scene, entity display objects, camera, pointer interaction | Authoritative entity positions or simulation rules |
| Simulation core | Pure deterministic state creation and fixed-step updates | React, PixiJS, DOM, worker globals, `Math.random()` |
| Web Worker | Simulation instance, RNG state, clock/tick, command handling, snapshot schedule | React UI, PixiJS rendering |
| Shared protocol | Typed command and event contracts | Duplicate message definitions in UI and worker |

### 5.2 Suggested worker protocol

Use discriminated unions. Keep the first protocol small:

**Main thread → worker**

- `INIT` — create or initialize a world using a supplied seed and prototype config.
- `START` — resume fixed-step advancement.
- `PAUSE` — stop advancing while keeping current state.
- `RESET` — recreate the same initial state from the configured seed.
- `SET_SPEED` — select one of the supported speed multipliers.

**Worker → main thread**

- `READY` — initialization completed; includes current seed, tick, and entity count.
- `SNAPSHOT` — one batched render snapshot plus tick/sequence metadata.
- `STATUS` — running/paused state and selected speed, if useful to the UI.
- `ERROR` — structured, user-displayable failure information.

Add request IDs only where a response needs to be matched to a particular request. Do not create a generic RPC framework. The protocol can grow later for inspection, settings, and save snapshots.

### 5.3 Worker lifecycle

- Instantiate the worker as a module worker using Vite's supported URL pattern.
- Handle worker startup errors and `messageerror` where practical.
- Initialize it once per app lifecycle.
- Terminate it during app teardown/unmount.
- Do not create a new worker for every button click or React render.
- Ensure reset does not accidentally leave an old timer running.
- Ensure repeated start/pause commands are idempotent.
- Avoid registering duplicate listeners when the app remounts in development Strict Mode.

### 5.4 PixiJS lifecycle

- Initialize PixiJS asynchronously using the installed PixiJS 8 API.
- Prefer the WebGL/WebGL2 renderer path required by the project specification.
- Append the canvas into a dedicated React-owned host element.
- Handle initialization failures with a clear unsupported-renderer/error message.
- Do not promise a Canvas fallback.
- Resize to the viewport/container using a supported PixiJS 8 mechanism.
- Destroy renderer resources and event listeners during cleanup.
- Reuse visual display objects; update them from incoming snapshots rather than rebuilding the entire scene for every update.

The exact API shape must be confirmed against the installed PixiJS 8 version and its current documentation. Do not copy outdated v7 examples.

---

## 6. Eight-hour execution schedule

The schedule is an ordering and budget, not permission to rush or to claim unfinished acceptance criteria. If a task runs long, reduce optional polish and preserve correctness.

### Block 0 — Repository reconnaissance and preflight

**Budget:** 00:00–00:30

**Objective:** Understand the working tree and prevent destructive scaffolding mistakes.

Tasks:

1. Confirm repository root, architecture, Node and npm versions.
2. Inspect `git status --short`; distinguish existing user changes from agent-created changes.
3. List current root files and inspect existing package/config files if any. Do not assume the absence of `package.json` solely from the README; verify.
4. Re-read the four source documents and identify the current roadmap phase.
5. Check the available disk space and memory if command output suggests resource pressure.
6. Record the planned file changes before editing.
7. Confirm no conflicting process is already running a package install or build.

**Exit checks:**

- The agent knows which files are pre-existing and must be preserved.
- Node/npm are available or a concrete blocker is recorded.
- The working tree is understood.
- No user-owned changes are about to be overwritten.

**Stop condition:** If the repository root is ambiguous or the working tree contains unexplained user changes that would be overwritten, do not reset or clean the repository. Work around them safely or report the exact blocker.

### Block 1 — Scaffold React + TypeScript + Vite

**Budget:** 00:30–01:15

**Objective:** Produce the smallest safe project foundation.

Tasks:

1. Generate a React + TypeScript Vite template in a temporary directory.
2. Inspect generated `package.json`, Vite config, TypeScript config, HTML entry, and source layout.
3. Copy the required generated files into the repository without replacing `README.md`, `AGENTS.md`, or either specification.
4. Install only the initial runtime dependencies needed for React and PixiJS 8.
5. Add Vitest and its minimum configuration as a development dependency.
6. Create npm scripts for development, test, type check, production build, and preview. Preserve useful template scripts, but make the final commands explicit and consistent.
7. Create one small baseline test and verify that the test runner works.
8. Keep and inspect the generated `package-lock.json`.
9. Remove the temporary scaffold after successful merge.

Suggested script intent:

| Script | Expected behavior |
|---|---|
| `dev` | Start Vite development server |
| `test` | Run Vitest once and exit (no watch mode) |
| `typecheck` | Run TypeScript checking without emitting production files |
| `build` | Run the production build and type/build checks configured by the project |
| `preview` | Preview the generated `dist/` output locally |

Do not duplicate type checking in several scripts unless the generated TypeScript project-reference setup requires it. Inspect the actual template before deciding the command.

**Exit checks:**

- Dependencies install successfully without parallel install processes.
- The React starter app runs.
- The baseline test passes.
- Type checking and production build are available.
- Supplied Markdown documents remain intact.

### Block 2 — App shell and honest prototype UI

**Budget:** 01:15–02:00

**Objective:** Replace the starter screen with the first EvoTerra application shell.

Tasks:

1. Set document title and basic metadata to EvoTerra.
2. Create a responsive application frame with a prominent world viewport host.
3. Add a compact header showing product name and truthful runtime status.
4. Add transport controls for start, pause, reset, and speed selection.
5. Add a compact status area for worker state, seed, tick, and current entity count.
6. Add loading, initialization failure, and runtime error states.
7. Use semantic buttons, visible focus states, and accessible labels.
8. Keep UI state minimal and local to the app. Do not add Zustand.
9. Ensure the layout remains usable at a narrow viewport; the world should shrink rather than overflow the entire page.

**Visual acceptance:**

- The world viewport is the main focal point.
- Controls are immediately discoverable.
- The page does not look like the unmodified Vite starter template.
- There are no fake charts or claims about species/population evolution.
- Status values are sourced from real app/worker state or clearly marked as unavailable.

### Block 3 — PixiJS renderer and camera

**Budget:** 02:00–03:15

**Objective:** Initialize a real PixiJS 8 world viewport and implement robust camera interaction.

Tasks:

1. Create a small renderer module that owns PixiJS initialization and teardown.
2. Initialize with the WebGL/WebGL2 path and await asynchronous setup.
3. Mount the PixiJS canvas into the React viewport host.
4. Draw a bounded rectangular world preview and a restrained background/grid guide.
5. Add a reusable graphics/display object for each prototype entity slot, but do not create React components per entity.
6. Implement resize handling.
7. Implement pointer-drag panning.
8. Implement wheel zoom with sensible min/max zoom bounds.
9. Keep the world transform separate from the viewport transform so camera movement does not alter simulation coordinates.
10. Clean up pointer handlers, resize observers/listeners, ticker callbacks, display objects, and PixiJS resources on teardown.
11. Surface initialization errors visibly. Do not silently degrade to an unsupported rendering mode.

**Camera acceptance:**

- Dragging inside the viewport pans the world.
- Wheel input zooms in/out around the pointer where feasible.
- Zoom is clamped and cannot produce invalid/NaN transforms.
- Resizing the app does not destroy the scene or reset the simulation.
- Camera controls do not mutate worker-owned entity positions.

**Checkpoint:** At this point the app should build and display a static PixiJS world even if worker integration is not yet complete.

### Block 4 — Framework-independent simulation core

**Budget:** 03:15–04:15

**Objective:** Implement a small deterministic movement model that can be tested without a browser.

Tasks:

1. Define explicit world/entity/configuration types.
2. Define world bounds and entity count/velocity/radius limits as named constants.
3. Implement a seeded pseudo-random number generator with explicit state.
4. Implement deterministic initial entity creation from seed.
5. Implement a pure or clearly isolated fixed-step update function.
6. Move entities using continuous coordinates and velocity.
7. Resolve world-boundary behavior deterministically (reflection/bounce).
8. Keep iteration order stable.
9. Ensure reset/reinitialization with the same seed reproduces the same initial state.
10. Avoid module-global mutable simulation state.
11. Do not import React, PixiJS, or browser globals from `src/simulation/**`.

**Suggested model API:**

- `createSimulation(config, seed)` returns an initialized simulation state.
- `stepSimulation(state, dt)` advances one fixed step and returns/updates the next authoritative state according to one consistent ownership model.
- `createRandom(seed)` returns a deterministic random source whose state can be inspected or copied for testing.

The exact API can differ if it is smaller or more idiomatic. The key requirements are deterministic behavior, explicit state ownership, and easy unit testing.

**Required core tests:**

- Same seed produces identical initial entity data.
- Different seeds produce different initial entity data for the chosen scenario.
- Same seed and same number of fixed steps produce identical resulting states.
- Fixed-step movement updates positions as expected.
- Boundary reflection keeps entities within world bounds.
- Invalid configuration values are rejected or safely normalized at the simulation boundary; do not silently allow NaN or infinite positions.

### Block 5 — Worker protocol and integration

**Budget:** 04:15–05:30

**Objective:** Move authoritative simulation ownership into a single worker and connect it to PixiJS.

Tasks:

1. Define command/event contracts in one shared module using discriminated unions.
2. Create the Vite-compatible module worker entry point.
3. Construct and initialize the simulation inside the worker.
4. Implement `INIT`, `START`, `PAUSE`, `RESET`, and `SET_SPEED` handling.
5. Run fixed-step simulation advancement using a single scheduling loop.
6. Emit periodic batched snapshots (target approximately 15 Hz).
7. Include tick or sequence number and current status in the messages.
8. Keep the worker independent of React and PixiJS.
9. Add error handling so an unexpected worker failure becomes visible to the user.
10. Ensure start/pause/reset are idempotent and reset clears/reinitializes the current timer state.
11. Terminate the worker during application cleanup.
12. Update PixiJS display objects from received snapshots.
13. Discard snapshots older than the latest accepted sequence.
14. Keep React state limited to status, controls, and summary metadata.

**Worker integration acceptance:**

- The worker is the only owner of live entity state.
- Start causes entity positions to advance.
- Pause stops tick advancement.
- Reset returns to the initial seeded state and tick.
- Speed changes the number of fixed steps advanced over wall-clock time without changing `dt`.
- The main thread remains able to pan/zoom and click controls while the worker runs.
- Messages are batched rather than emitted per entity.
- No React state update is issued for every entity every tick.

### Block 6 — Hardening, tests, and resource checks

**Budget:** 05:30–06:30

**Objective:** Verify correctness and avoid fragile first-run behavior.

Tasks:

1. Run all simulation unit tests.
2. Add protocol/step integration tests where they can run without a real browser.
3. Verify repeated start/pause sequences do not create duplicate loops.
4. Verify reset does not allow old snapshots/timers to corrupt the new run.
5. Verify stale snapshot sequences are ignored.
6. Verify worker initialization/runtime failures are surfaced.
7. Verify PixiJS cleanup and React remount behavior in development where practical.
8. Check for accidental `Math.random()` in simulation modules.
9. Search for forbidden imports from simulation code (`react`, `pixi.js`, DOM globals).
10. Search for unused packages, dead code, TODO placeholders that are not explicitly intentional, and unhandled promise rejections.
11. Check resource usage and ensure there is no runaway build/test process.

**Suggested repository checks:**

```bash
# Run serially; do not run these concurrently.
npm run test
npm run typecheck
npm run build
```

If the package script names differ, use the verified scripts and correct the README. Do not report an unavailable script as having passed.

### Block 7 — UI polish and README updates

**Budget:** 06:30–07:15

**Objective:** Make the prototype understandable to the next developer without expanding scope.

Tasks:

1. Verify labels describe “test entities” or “prototype movement” accurately.
2. Improve spacing, contrast, control states, and responsive behavior only where there are visible issues.
3. Check keyboard focus and button semantics.
4. Ensure the error/unsupported-WebGL message explains what failed without promising a Canvas fallback.
5. Update README status from “Pre-implementation” only after the corresponding foundation actually exists.
6. Add setup, run, test, type-check, build, and preview commands to README.
7. Update README folder structure to match actual implemented files; do not list future directories as though they already exist.
8. Keep project description and tech stack specifications unchanged.
9. Update `AGENTS.md` only if actual roadmap progress or standing rules have changed. Follow its own maintenance instructions, including date/changelog updates where required.

### Block 8 — Final verification and handoff

**Budget:** 07:15–08:00

**Objective:** Leave a reproducible, accurately documented repository state.

Tasks:

1. Inspect `git status --short` and the full diff.
2. Verify all new files are intentional and no supplied documents were accidentally replaced.
3. Run the final tests, type check, and production build serially after the last code change.
4. Start the dev server only if it is practical and safe; otherwise state that manual browser verification was not performed.
5. If a browser is available, manually verify the complete first-run flow: load, initialize, start, pause, speed, reset, pan, zoom, and resize.
6. Confirm that `dist/` is generated and not accidentally committed unless repository conventions require it.
7. Do not create a commit or push unless explicitly instructed.
8. Produce the final handoff report using the template in section 11.

---

## 7. Acceptance criteria — must pass before calling the shift successful

### 7.1 Repository and setup

- [ ] The original project description remains present and unchanged.
- [ ] The original tech-stack document remains present and unchanged.
- [ ] `AGENTS.md` remains present and its rules are respected.
- [ ] README describes the actual current implementation.
- [ ] `package.json` and `package-lock.json` are present and consistent.
- [ ] The repository installs from its lockfile using `npm ci` after initial setup, provided network access is available.
- [ ] The development server starts using the documented command.

### 7.2 Application and renderer

- [ ] App title and visible branding say EvoTerra.
- [ ] The app no longer displays the stock Vite starter page.
- [ ] PixiJS 8 initializes using the WebGL/WebGL2 path.
- [ ] A world preview is visible in the intended viewport.
- [ ] The renderer resizes with the host container.
- [ ] Pan and zoom work and remain bounded.
- [ ] Renderer initialization failures are reported clearly.
- [ ] No Canvas fallback is claimed or silently substituted.

### 7.3 Simulation and worker

- [ ] Simulation state is created and owned by one dedicated Web Worker.
- [ ] Simulation core modules do not import React, PixiJS, or browser DOM APIs.
- [ ] Simulation randomness comes from an injected/owned seeded generator; no `Math.random()` is used in simulation logic.
- [ ] A fixed timestep is used.
- [ ] Same seed and fixed-step sequence reproduce the same prototype run.
- [ ] Start, pause, reset, and speed commands work.
- [ ] A single scheduling loop controls advancement.
- [ ] Snapshots are batched and have a tick/sequence number.
- [ ] Stale snapshots are ignored.
- [ ] React does not hold per-entity state.
- [ ] Worker is terminated on app teardown.

### 7.4 Quality gates

- [ ] Vitest passes in non-watch mode.
- [ ] Type checking passes.
- [ ] Production build passes.
- [ ] No new unexplained TypeScript `any` types are introduced.
- [ ] No unhandled worker/Pixi initialization failure is silently swallowed.
- [ ] No backend, database, account, cloud-sync, or unnecessary infrastructure was added.
- [ ] The agent self-reviewed the diff.
- [ ] Final report distinguishes verified facts from unverified/manual checks.

### 7.5 Partial success rules

If the worker integration cannot be completed within the shift, do not fake it. A valid partial outcome is:

1. Complete the React/Vite scaffold and PixiJS viewport.
2. Complete camera pan/zoom and cleanup.
3. Complete deterministic simulation core and tests.
4. Leave a documented, typed worker integration boundary, clearly reporting that worker-driven movement remains incomplete.

If PixiJS WebGL initialization is blocked by the environment, report the exact browser/runtime limitation. Do not switch to Canvas or claim the renderer is verified. A successful build alone does not prove that WebGL works in the target browser.

---

## 8. Implementation quality details

### 8.1 TypeScript requirements

- Preserve strict compiler settings.
- Give exported functions and public interfaces explicit types.
- Prefer discriminated unions for worker messages.
- Avoid `any`; use `unknown` and narrow values where appropriate.
- Keep message contracts in one shared location.
- Use named constants with documented units.
- Do not weaken the compiler to silence implementation errors.

### 8.2 Simulation correctness

- Make the simulation core deterministic and independently testable.
- Keep state out of module scope.
- Keep stable iteration order.
- Clamp or reject invalid numeric configuration values deliberately.
- Prevent entity positions from escaping world bounds.
- Separate the world coordinate system from screen pixels.
- Keep the first movement model intentionally simple. No physics engine is needed.
- Do not write tests that expect stochastic evolution; evolution is not part of this shift.

### 8.3 Rendering correctness

- PixiJS scene objects are visual representations, not sources of truth.
- Allocate visual objects once where possible, then update their transforms.
- Avoid destroying and recreating every display object per snapshot.
- Do not render one React component per entity.
- Make resize and teardown behavior explicit.
- Treat WebGL initialization failure as a first-class error state.
- Prefer simple primitives over loading a large sprite/asset pack.

### 8.4 Worker correctness

- One worker instance per running app instance.
- One owner for the simulation clock.
- One scheduler loop.
- Fixed timestep independent of render cadence.
- Command handlers are safe to call repeatedly.
- Snapshot sequence/tick numbers are monotonic during a run; reset behavior is documented and stale-message protection accounts for it (for example, include a run/session identifier in addition to tick if necessary).
- No message per entity.
- No `SharedArrayBuffer` or multiple workers.

### 8.5 UI correctness

- Controls reflect actual worker state, not optimistic assumptions that never reconcile.
- Disable or guard controls until worker initialization completes.
- Surface startup and runtime failures visibly.
- Use accessible labels and semantic button elements.
- Do not show fabricated values for features that are not implemented.
- Prefer one compact status panel over a decorative analytics dashboard.

---

## 9. Risk register and fallback decisions

| Risk | Likely symptom | Response | Do not do |
|---|---|---|---|
| Vite scaffold conflicts with existing files | Existing README/AGENTS would be overwritten | Scaffold in temp directory and selectively merge | Do not reset or delete user documents |
| Node/npm incompatible | Install or build fails before code work | Record versions; verify supported Node LTS requirement; ask before system-wide upgrade | Do not install arbitrary global toolchains |
| PixiJS v8 API mismatch | Type errors or renderer init failure | Inspect installed version docs/types and adapt to v8 APIs | Do not paste v7 examples or add a second renderer |
| WebGL unavailable in test browser | Initialization error | Show clear unsupported-renderer state; continue unit tests/build | Do not claim Canvas fallback or renderer success |
| Memory pressure | OOM, killed install/build, high swap | Stop concurrent processes; reduce optional tooling; retry serially | Do not launch more agents or services |
| Worker URL/config issue | Worker fails to load in Vite | Verify module-worker URL pattern and build output | Do not move simulation back to React to hide the problem |
| Duplicate worker timers | Simulation advances too fast after toggling controls | Centralize scheduling; make start/pause idempotent; test repeated commands | Do not add more timers as a patch |
| Reset race/stale messages | Old positions appear after reset | Include run/session identity and monotonic sequence; reject stale snapshots | Do not trust tick alone across reset boundaries |
| Camera transform bugs | Pan/zoom drifts or becomes NaN | Separate viewport/world transforms; clamp zoom; test pointer math | Do not change simulation coordinates to compensate |
| Time budget exceeded | Late features remain incomplete | Preserve tested core and document remaining tasks | Do not claim unverified acceptance criteria |
| Temptation to add future feature | Scope expands toward neural networks/biomes | Log as next-phase work | Do not add it to the first-night branch |

---

## 10. Priority order if time runs short

Protect this ordering. Stop optional work before sacrificing correctness.

### Priority A — non-negotiable foundation

1. Safe Vite/React/TypeScript scaffold.
2. Strict TypeScript and reproducible npm lockfile.
3. PixiJS viewport that initializes and cleans up correctly.
4. Camera pan/zoom.
5. At least one passing unit test.
6. Production build passes.

### Priority B — core vertical slice

7. Framework-independent deterministic movement simulation.
8. One dedicated worker owns the simulation.
9. Start/pause/reset/speed work.
10. Batched snapshots update PixiJS.
11. Determinism and worker-related tests pass.

### Priority C — polish

12. Responsive layout and visual refinement.
13. Additional status display.
14. README and implementation-status updates.
15. Optional interpolation or minor animation polish.

Do not sacrifice type safety, determinism, cleanup, or truthful documentation to complete optional visual polish.

---

## 11. Required end-of-shift handoff report

The coding agent must finish with a concise but complete report using this structure.

### 11.1 Summary

- State whether the shift completed Phase 1.
- State whether the minimal Phase 2 worker movement prototype is complete, partial, or not started.
- State the current runnable application behavior in one paragraph.

### 11.2 Deliverables

List the meaningful files/modules created or modified and why. Group by:

- Scaffold/configuration.
- App/UI.
- PixiJS rendering/camera.
- Simulation core.
- Worker/protocol.
- Tests.
- Documentation.

### 11.3 Verification table

| Check | Command/action | Result | Notes |
|---|---|---|---|
| Install | `npm ci` or actual install command | Pass/Fail/Not run | Include reason if not run |
| Unit tests | Actual test command | Pass/Fail/Not run | Include test count if available |
| Type check | Actual type-check command | Pass/Fail/Not run | Do not infer from build unless build includes it |
| Production build | `npm run build` | Pass/Fail/Not run | Include output status |
| Dev server | Actual documented command | Pass/Fail/Not run | State whether server startup was confirmed |
| Browser smoke test | Manual browser actions | Pass/Fail/Not run | Identify browser/runtime if known |
| Worker flow | Start/pause/reset/speed | Pass/Fail/Not run | Describe what was observed |
| Camera | Pan/zoom/resize | Pass/Fail/Not run | Describe what was observed |

Never mark a check “Pass” unless the agent actually performed it.

### 11.4 Known limitations

Explicitly state which product systems are still absent, including neural networks, food/resources, energy, reproduction/evolution, procedural biomes, inspection, charts, and persistence unless any were genuinely implemented (they should not be in this shift).

### 11.5 Environment observations

Report:

- Node and npm versions.
- Whether the 1-vCPU/2-GB host showed memory pressure.
- Any install/build duration or resource issue that materially affected the result.
- Whether the browser was local, remote, headless, or unavailable.

### 11.6 Next recommended task

If this shift succeeds, the next recommended work is to continue Phase 2 only if its acceptance criteria remain incomplete. Once Phase 2 is complete, proceed to **Phase 3 — First functioning creature and resource loop**, beginning with documented creature traits, resource model, normalized neural inputs/outputs, spatial-grid tests, and a baseline/debug controller.

Do not begin procedural biome generation or persistence before the movement and creature/resource loop has a tested foundation.

---

## 12. Definition of done for this shift

The shift is complete only when all of the following are true:

1. The repository remains intact and no supplied specification or agent-guidance document was accidentally overwritten.
2. The application can be installed and started using documented commands.
3. The PixiJS world viewport and camera are working or a specific verified environmental blocker is reported.
4. The simulation core is deterministic and independently testable.
5. The worker owns the prototype simulation if Phase 2 is reported complete.
6. Start, pause, reset, and speed behavior are verified if reported complete.
7. Tests, type check, and production build results are reported accurately.
8. README and AGENTS status are accurate for the actual code state.
9. The final diff is self-reviewed and free of unrelated changes.
10. The final handoff clearly separates completed work, partial work, unverified behavior, and next steps.

**The objective is not maximum lines of code. The objective is a small, reliable foundation that makes the next implementation phase easier rather than more expensive.**
