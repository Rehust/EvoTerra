# AGENTS.md — Agent Rules for EvoTerra

> **Project:** EvoTerra — a browser-based 2D artificial-life sandbox.
> The specifications call the concept **Neural Creatures**; the repository and product name are **EvoTerra**.
> **Status:** pre-implementation — specifications only, no application code or `package.json` yet.
> **Last updated:** 2026-11-12
> **Maintainer:** the human project owner.
> **Development model:** solo, vibecoded by coding agents; no external reviewer or PR-approval gate.

This file tells AI coding agents how to work in this repository. It is **operational guidance**, not a replacement for the product specifications.

---

## 1. Read this first

Before changing code:

1. Read `neural-creatures-project-description.md` and `neural-creatures-tech-stack.md`.
2. Inspect the current repository state. Do not assume files, dependencies, or scripts exist because a specification mentions them.
3. Identify the current roadmap phase in section 12. Work only on the current phase or the next one.
4. For any non-trivial change, produce a short plan before editing.

### 1.1 Precedence

When instructions conflict, use this order:

1. Explicit instructions from the human maintainer.
2. This `AGENTS.md`.
3. The two specification documents.
4. Existing code and local conventions.

If two sources genuinely conflict, **stop and surface the conflict**. Do not silently choose one. When the maintainer resolves it, record the resolution in section 16 and the changelog.

### 1.2 How to use the specifications

The two specification files are the product source of truth:

- `neural-creatures-project-description.md` — product vision, simulation rules, UX, roadmap, success criteria.
- `neural-creatures-tech-stack.md` — technology selection, architecture, setup, deployment, engineering rules.

Do not duplicate large portions of those documents here. Keep this file focused on **how an agent should behave** while implementing them.

---

## 2. What this project is

EvoTerra is a client-side, browser-based 2D artificial-life and evolution simulation.

- Users generate or load a seeded world with biomes, water, climate, and resources.
- Digital organisms perceive their surroundings through local inputs and act through a small inherited neural network.
- Creatures spend energy, consume resources, reproduce asexually, mutate, and die.
- Terrain and climate affect survival mechanically, not just visually.
- Users can pause, inspect creatures, adjust settings, view statistics, and save worlds locally.
- There is no fixed win condition. Extinction, population booms, migration, and unexpected adaptation are valid outcomes.

The project asks whether simple neural networks plus evolutionary pressure can produce behavior that looks adaptive or purposeful without scripting that behavior directly.

**Do not** describe the simulation as a scientifically accurate model of biological evolution.

### 2.1 Development model

This is a solo, vibecoded project. The human maintainer sets direction and makes product decisions; coding agents implement, test, and verify the work.

- There is **no separate code-reviewer role, PR-approval gate, or review sign-off**.
- Agents must self-review their diff, run the relevant checks, and report actual results before calling work done.
- Do not open a pull request or request reviewers unless the maintainer explicitly asks. When asked to commit and push, commit focused changes directly to the current branch and push.
- "No review" is not permission to lower quality: tests, verification, and the non-negotiables in this file still apply.
- Ask the maintainer before making ambiguous architecture or scope decisions; do not wait for a review process that does not exist.

---

## 3. Non-negotiable architecture

These decisions are part of the first release. Do not change them without explicit maintainer approval.

1. **Static frontend only.** The core experience runs entirely in the browser. No application backend, database server, accounts, or cloud sync.
2. **TypeScript everywhere.** UI, simulation, worker, neural network, and shared contracts.
3. **React for UI only.** React owns controls, panels, inspectors, and dashboards — not world rendering and not one component per creature.
4. **PixiJS 8 with WebGL/WebGL2 for the world.** PixiJS owns terrain, resources, creatures, camera, and overlays. Do not require WebGPU.
5. **One dedicated simulation Web Worker.** The worker owns and advances the authoritative simulation state. Do not split into multiple workers without measured evidence.
6. **Simulation engine is framework-independent.** `src/simulation/**` must not import React or PixiJS. It must be testable in Vitest without a browser UI.
7. **Custom TypeScript neural network.** A small fixed-topology feed-forward network, initially **8 inputs → 12 hidden → 4 outputs**. No TensorFlow.js, PyTorch, backpropagation, or reinforcement learning in the first release.
8. **Continuous creature coordinates over a terrain grid.** Use a uniform spatial grid / spatial hash for nearby-object queries. Never use all-pairs checks.
9. **Seeded, deterministic simulation.** The worker owns one seeded pseudo-random generator. Do not call `Math.random()` inside simulation logic.
10. **Versioned local persistence.** IndexedDB through `idb`, validated with Zod. No silent partial loads.
11. **Vitest for simulation and integration tests.** Establish tests early.
12. **Compact, batched worker snapshots.** Never send a message per creature per tick.

---

## 4. Technology stack and dependency policy

### 4.1 Stack

| Area | Technology | When to introduce |
|---|---|---|
| Language | TypeScript | Phase 1 |
| UI | React | Phase 1 |
| Build/dev server | Vite | Phase 1 |
| 2D rendering | PixiJS 8 (WebGL) | Phase 1 |
| Testing | Vitest | Phase 1 |
| Procedural noise | `simplex-noise` | Phase 5 |
| UI state | Zustand | Only when shared UI state justifies it |
| Local persistence | IndexedDB via `idb` | Phase 6 |
| Validation | Zod | Phase 6, and at any external-data boundary |
| Charts | Recharts | Phase 6 |
| Component tests | Testing Library | When meaningful UI tests exist |

### 4.2 Dependency rules

- **Install only what the current phase needs.** The full stack list is a menu, not a day-one install script.
- Keep the dependency set deliberately small. Every new package needs a concrete reason tied to a current requirement.
- Prefer the platform and existing packages over adding a library.
- Do not add two libraries that solve the same problem.
- Remove packages that are no longer used.
- Commit the lockfile. Use `npm ci` for reproducible clean installs.
- The development machine may be constrained (1 vCPU, 2 GB RAM). Run one install or build at a time; do not run databases, local models, or unrelated heavy services alongside the build.

### 4.3 Deferred or prohibited in the first release

Do not introduce these without explicit approval and a measured need:

- Backend APIs, Express/Fastify, PostgreSQL, Redis
- Next.js or server-side rendering
- User accounts, cloud sync, multiplayer
- TensorFlow.js, PyTorch, reinforcement learning
- A large physics engine
- WebGPU or a promised Canvas fallback
- Multiple simulation workers or `SharedArrayBuffer`
- Docker, microservices, or other deployment infrastructure
- 3D rendering
- Neural-topology evolution
- Scientifically accurate biology or hydrology claims

---

## 5. Repository layout

The target organization is described in both specification files. Add directories only when they contain real code. Do not create empty abstractions just to match the tree.

Key boundaries:

```text
src/
├── app/            React application shell and UI state
├── components/     UI controls, inspector, dashboard, layout
├── rendering/      PixiJS world, camera, layers, sprites
├── simulation/     Framework-independent simulation engine
├── workers/        Native Web Worker entry point and protocol wiring
├── persistence/    IndexedDB access, save format, migrations
├── shared/         Typed worker messages, shared types, constants
└── main.tsx
```

Rules:

- `src/simulation/**` must remain importable and testable without React, PixiJS, or DOM globals.
- Worker message types and save-format types belong in `src/shared/**` or next to the persistence code, not duplicated across modules.
- The worker entry point may import simulation code and shared types. It must not import React or PixiJS.
- Avoid circular imports. If a shared type creates a cycle, move it to `src/shared/**`.
- Keep modules focused. Prefer several small, testable simulation modules over one large `Simulation` class.

---

## 6. Coding standards

### 6.1 TypeScript

- Enable and respect strict TypeScript settings; do not weaken them to silence errors.
- Prefer explicit types on exported functions and public APIs.
- Avoid `any`. Use `unknown` plus validation (Zod) at external-data boundaries.
- Use discriminated unions for worker messages, commands, save-format variants, and other tagged data.
- Use exhaustive `switch` checks for discriminated unions so new variants cause compile errors.
- Keep shared contracts in one place; do not re-declare message or save shapes in multiple files.
- Prefer `readonly` and immutable data where it clarifies ownership.

### 6.2 Simulation code

- Write pure functions where practical. Inject the random generator and clock instead of reading globals.
- Do not keep mutable simulation state in module scope. The worker creates and owns the simulation instance.
- Define named constants with documented units. No unexplained magic numbers in rules or formulas.
- Document every formula that affects survival: movement cost, energy gain/loss, hydration, temperature stress, reproduction cost, mutation bounds.
- Resolve resource contention and update-order ties deterministically.
- Avoid object allocation in hot loops. Reuse arrays and objects where profiling shows it matters.
- Clamp inherited values to their documented ranges after mutation.

### 6.3 React and UI

- Use function components and hooks.
- React manages the interface only. Do not create a component per creature or per world tile.
- Do not mirror the full creature population in React state or Zustand.
- Store UI state such as selected creature ID, active overlay, simulation speed, and panel visibility.
- Fetch expensive inspection data on demand from the worker.
- Use selectors and memoization where re-renders are measured to be a problem, not pre-emptively everywhere.
- Keep world interaction (pan, zoom, selection) in PixiJS and translate it into worker commands.

### 6.4 General style

- Match the surrounding code's naming, formatting, and structure.
- `camelCase` for variables and functions, `PascalCase` for types and components, `SCREAMING_SNAKE_CASE` for message type literals and constants where appropriate.
- Comments should explain **why**, constraints, or non-obvious formulas — not restate the code.
- Do not reformat unrelated files or mix refactors with feature changes.
- No dead code, commented-out blocks, or placeholder abstractions without a current use.
- Fail loudly during development. User-facing errors must be clear and actionable; never silently swallow simulation or persistence errors.

---

## 7. Simulation rules and determinism

- Use a **fixed simulation timestep**. Separate simulation speed from rendering frame rate.
- Cap catch-up work after delays; do not let an overloaded tab spiral.
- The worker owns exactly one seeded random generator and its state.
- Use a deterministic iteration order for creatures, resources, and grid queries.
- Apply deterministic tie-breaking for collisions, resource consumption, and reproduction placement.
- A seed alone is not enough for reproducibility: document and test update order, collision order, and any parallelism assumptions.
- Do not assert evolutionary outcomes as guaranteed trends unless the scenario is explicitly deterministic.
- Provide a baseline or debug controller so simulation bugs can be distinguished from evolved-network behavior.
- Species grouping is a configurable visualization heuristic based on genome distance, not a claim of biological speciation.
- There is no hidden fitness score. Reproductive success must emerge from survival and reproduction rules.

### 7.1 Neural network

- Keep the initial topology fixed so offspring inherit compatible weight and bias arrays.
- Document the exact meaning, normalization, and numeric range of every input and output before tuning.
- Use simple activation functions and compact numeric storage.
- Test the forward pass and mutation behavior.
- Do not add gradient-based training or external ML frameworks.
- The inspector must show the selected creature's actual network values, not a decorative diagram.

---

## 8. Worker protocol and rendering contract

### 8.1 State ownership

| Owner | State |
|---|---|
| Simulation worker | World, terrain used by simulation, creatures, genomes, resources, RNG state, clock, counters |
| React / Zustand | UI preferences, selected creature ID, active overlay, controls, panel state |
| PixiJS | Visual objects, sprites, camera, selection visuals — never authoritative simulation state |
| IndexedDB | Durable saves and settings |

### 8.2 Messages

- Use native typed `postMessage` contracts first. Do not add Comlink unless the native protocol becomes genuinely cumbersome.
- Define discriminated message types with typed payloads.
- Include a request ID for request/response pairs.
- Include a tick or sequence number in snapshots so stale messages can be discarded.
- Start with structured-clone messages and compact snapshots.
- Batch updates. Do not send one message per creature or per simulation tick.
- Use packed typed arrays or transferable buffers **only after profiling** shows serialization/copying is a bottleneck.
- Do not use `SharedArrayBuffer` in the first release.

### 8.3 Cadence targets

- Render snapshots: approximately **10–20 updates per second**.
- Dashboard statistics: approximately **1–2 updates per second** by default. The tech-stack document allows up to 5; see section 17 for the conflict and the default.
- PixiJS drawing: browser animation-frame cadence, interpolating between snapshots where useful.

These are starting values to profile, not guarantees.

### 8.4 Rendering

- Reuse PixiJS sprites and graphics objects; do not recreate the scene every frame.
- Update only objects whose visual state changed where practical.
- Use culling, chunking, or simplified visuals when measurements justify them.
- If WebGL is unavailable, show a clear unsupported-browser message. Do not promise an equivalent Canvas fallback.

---

## 9. Persistence and data validation

When persistence is implemented (Phase 6):

- Use IndexedDB through `idb`.
- Store a **versioned** save format.
- Validate all imported and persisted data with Zod at the boundary.
- Include at minimum:
  - Save-format version and simulation version
  - World seed and generation configuration
  - Simulation clock and random-generator state
  - Terrain/environment state, or enough data to reconstruct it exactly
  - Creature state, genomes, neural weights, ancestry identifiers
  - Resource state
  - Simulation settings and relevant historical summaries
- Implement explicit migrations for supported older versions.
- Reject incompatible or corrupted saves with a clear explanation.
- Never silently load partially understood data.
- Test save → load → resume behavior, including random-state preservation.

---

## 10. Performance rules

### 10.1 Initial targets

| Metric | Initial target |
|---|---:|
| Terrain grid | 256 × 256 cells |
| Initial population | 100 creatures |
| Benchmark populations | 100, 250, 500, 1,000 |
| Speed controls | 1×, 2×, 5×, 10× |
| Rendering | 60 FPS where the device/browser permits |
| Statistics | Approximately 1–2 updates per second |

Treat these as benchmark scenarios, not device-independent limits.

### 10.2 Rules

- Use a fixed timestep and cap catch-up work.
- Use the spatial grid for nearby-object queries; never compare every creature with every other creature.
- Keep authoritative simulation state in the worker.
- Batch and compact render snapshots.
- Update charts less frequently than the renderer.
- Bound historical statistics and clean up dead entities.
- Avoid unnecessary allocations in hot loops.
- Profile before adding WebAssembly, GPU compute, `SharedArrayBuffer`, or extra workers.
- Record FPS, simulation steps per second, and memory behavior at each benchmark population.
- Do not claim a maximum supported population without measurements on representative hardware.

### 10.3 Constrained development environment

The remote build environment may have **1 vCPU, 2 GB RAM, Linux/amd64**.

- Run one install or build process at a time.
- Do not run concurrent coding-agent builds in the same workspace.
- Do not run databases, local AI models, or unrelated heavy services for this project.
- Keep dependencies lean.
- Use `npm ci` for reproducible installs when a lockfile exists.
- Use `npm run build` as the production build check.
- Use `npm run preview` only to inspect the production build locally — not as a production server.
- Hosting serves static files from `dist/`; the simulation still runs in each visitor's browser.

---

## 11. Scope guardrails

### 11.1 MVP must-haves

- Browser 2D world viewport with React + TypeScript + Vite + PixiJS
- Dedicated simulation Web Worker
- Continuous creature positions and a terrain grid
- Spatial grid for nearby queries
- At least one environment with passable and impassable areas
- Food resources with bounded regeneration
- Creatures with inherited traits and small feed-forward networks
- Local perception, movement, food seeking, consumption
- Energy gain and costs
- Asexual reproduction, inheritance, mutation, death
- Population counters and basic creature inspection
- Start, pause, reset, and basic speed controls
- Seeded determinism and core simulation tests

### 11.2 Explicitly out of scope for the first release

- Multiplayer, accounts, cloud sync
- Backend APIs or server-side simulation
- Scientifically accurate biological modeling
- TensorFlow.js, PyTorch, reinforcement learning
- Complex fluid or hydrology simulation
- Neural topology evolution
- Multiple simulation workers or shared memory
- 3D rendering

### 11.3 Scope discipline

- Do not build future systems early. A feature belongs in the current phase only if the phase's exit criteria require it.
- Do not add hidden survival bonuses, arbitrary combat, or scripted "smart" behavior to make the simulation look better.
- If an experiment is inconclusive or evolution looks uninteresting, inspect inputs, outputs, energy rules, and selection pressure. Do not force a desired outcome.
- Prefer understandable, testable mechanics over premature complexity.

---

## 12. Development workflow

Build a complete runnable vertical slice before expanding the world or ecosystem. Every phase must leave the application runnable.

| Phase | Focus | Exit criteria (summary) |
|---|---|---|
| 1 | App shell and PixiJS renderer | `npm run dev` starts, `npm run build` succeeds, viewport renders, camera works, one test runs |
| 2 | Simulation worker and movement | Worker owns state, start/pause/reset/speed work, UI stays responsive, snapshots handled, engine testable without React/Pixi |
| 3 | Creature and resource loop | Creatures sense food, act, move, eat, gain/spend energy, die; NN and energy rules tested; baseline controller available |
| 4 | Reproduction and evolution | Eligible creatures reproduce, offspring inherit then mutate, bounded variation, counters correct, seeded run replayable |
| 5 | Procedural terrain and biomes | Same seed produces same world; biomes have mechanical effects; water/passability rules enforced; generation invariants tested |
| 6 | Sandbox and persistence | Pan/zoom, overlays, inspector, speed/step controls, statistics, versioned IndexedDB save/load, clear errors |
| 7 | Profiling and stabilization | Separate render/sim profiling, population benchmarks, no unbounded growth, documented limits, advanced features optional |

Detailed acceptance criteria live in `neural-creatures-project-description.md` §13.

### 12.1 Definition of done

A change is done only when:

1. It satisfies the current phase requirement or the maintainer's explicit request.
2. It respects the architecture and ownership boundaries in this file.
3. Relevant tests are added or updated and pass.
4. Type checking and the production build pass, if the project has them configured.
5. The app still runs and the affected manual flow works.
6. Documentation or this rule file is updated if behavior, commands, architecture, or conventions changed.
7. The diff has been self-reviewed and contains no unrelated changes.
8. The final report states what changed, what was run, the actual results, and any known gaps.

Do not claim code is complete, fixed, or passing without running the verification commands and reporting their output. This project has no external reviewer or PR-approval gate; self-review plus tests and verification are the quality gate.

### 12.2 Workflow skills

When the harness provides the Superpowers skills, use them:

| Situation | Skill |
|---|---|
| New feature, behavior change, or design decision | `brainstorming` first, then `writing-plans` |
| Executing an approved plan | `executing-plans` or `subagent-driven-development` |
| Implementing a feature or bugfix | `test-driven-development` |
| Bug, failing test, or unexpected behavior | `systematic-debugging` before proposing a fix |
| Claiming completion | `verification-before-completion` |
| Finishing/merging a development branch | `finishing-a-development-branch` (no PR approval gate) |

If a skill does not apply, say why and proceed. Do not skip a skill that genuinely applies. Self-review every diff before reporting completion; no external review is required.

### 12.3 Verification commands

Once the project is scaffolded, the expected checks are:

```bash
npm run dev        # local development
npx vitest run     # non-watch test run
npm run build      # production build check
npm run preview    # inspect the production build locally
```

A command is only confirmed available when `package.json` defines it and it has been run successfully. Until then, do not claim these scripts exist.

---

## 13. Testing strategy

Use Vitest for pure simulation logic and integration behavior.

### 13.1 Required unit-test areas

- Seeded random generator repeatability
- Terrain field generation and biome classification
- Spatial-grid insertion, update, removal, and query correctness
- Neural-network forward pass and input normalization
- Trait mutation and clamping
- Genome inheritance
- Movement and collision invariants
- Energy and resource calculations
- Reproduction eligibility and offspring placement
- Resource regeneration limits
- Save serialization and validation

### 13.2 Required integration tests

- Creature perceives food, moves, consumes it, and gains energy
- Terrain movement costs affect survival
- Eligible creatures reproduce and produce mutated offspring
- Population counters match births and deaths
- Worker commands change simulation state correctly
- Save/load preserves world, creature, resource, and RNG state

### 13.3 Determinism

- Use seeded randomness and fixed settings.
- Control entity update order, collision resolution, and floating-point-sensitive behavior.
- Test invariants and reproducible scenarios. Do not assert that a particular evolutionary trend must occur in a stochastic run.
- A seed alone does not guarantee identical outcomes if execution order changes.

### 13.4 Performance and manual tests

- Maintain a repeatable benchmark for 100, 250, 500, and 1,000 creatures.
- Record simulation steps per second, snapshot cost, rendering FPS, and approximate memory behavior.
- Manually verify PixiJS initialization/resize, camera pan/zoom, layers, selection, inspector accuracy, controls, save/load flow, and error messages.
- Do not turn a single-machine benchmark into a universal performance promise.

### 13.5 Test discipline

- Test behavior and invariants, not private implementation details.
- Never weaken or delete a failing test just to make the suite green. Fix the cause or surface the disagreement.
- Keep tests deterministic; avoid timing-dependent assertions where a fixed clock or explicit step call works.
- Coverage percentage is not a goal by itself.

---

## 14. Documentation and decision records

- The specification files are the product source. Do not rewrite them unless the maintainer asks.
- `AGENTS.md` is the operational source for agent behavior.
- Record intentional deviations from the specified stack or architecture in section 15, with the reason and the problem the deviation solves.
- When a design decision affects future work, document it where the next agent will find it: this file, a comment near the rule, or a dedicated `docs/` note when that directory exists.
- Keep documentation accurate. Do not describe planned features as implemented.
- Do not create competing rule files such as `CLAUDE.md` or `GEMINI.md`. If another harness needs one, make it a short pointer to this file.

---

## 15. Deviations and resolved conflicts

Use this table when a deliberate departure from the specifications is approved, or when two specification statements conflict and the maintainer chooses a resolution.

| Date | Topic | Decision | Reason |
|---|---|---|---|
| 2026-11-12 | Repository/product name | Use **EvoTerra** for the repo and product name; specifications may refer to "Neural Creatures" as the concept name | The repository and README use EvoTerra |
| 2026-11-12 | Zustand timing | Start with React state; add Zustand only when shared UI state justifies it | Follows the more conservative project-description guidance |
| 2026-11-12 | Statistics cadence | Default to 1–2 updates per second; allow up to 5 only after profiling | Project description says 1–2; tech stack says 2–5 |
| 2026-11-12 | Dependency installation | Install only what the current phase needs; the full stack list is not a day-one install script | Both documents warn against installing everything early |

Add a row whenever a new conflict is resolved or a deviation is approved. Do not silently change established behavior.

---

## 16. Maintaining this rule file (AGENTS.md)

This section defines how **this file itself** is updated. `AGENTS.md` is a living document. Keep it accurate, concise, and aligned with the actual project.

### 16.1 When to update this file

Update `AGENTS.md` whenever any of the following happens:

1. The technology stack, dependencies, or package scripts change.
2. The repository structure or module ownership changes.
3. The worker protocol, save format, or state-ownership boundaries change.
4. A coding convention, testing rule, or performance guardrail is added, changed, or removed.
5. The current roadmap phase advances, or phase exit criteria change.
6. The maintainer gives a new standing instruction that should apply to future work.
7. The same agent mistake happens more than once and a rule would prevent it.
8. A specification conflict is resolved, or a deliberate deviation is approved.
9. A command in this file is found to be wrong, outdated, or unavailable.
10. A major refactor or dependency upgrade invalidates existing guidance.

Do not update this file merely to describe an ordinary code change. Update it when the **rules for future work** change.

### 16.2 How to update it

1. Read the current file and the relevant specification section first.
2. Make the smallest edit that captures the new reality or decision.
3. Put the rule in the correct section. Remove or rewrite contradictory text rather than leaving both versions.
4. Update the `Last updated` date at the top.
5. Add a row to the changelog in section 16.5 with the date, change, and reason.
6. If the change reflects a resolved conflict or approved deviation, also add or update a row in section 15.
7. If the change affects commands, verify each command actually exists and works before documenting it.
8. Keep the file focused. Put long explanations in the specification files or a `docs/` note and link to them.

### 16.3 Rules for safe edits

- **Do not weaken a non-negotiable** in section 3 without explicit maintainer approval. That includes the static-only architecture, worker ownership, framework-independent simulation, custom neural network, seeded determinism, and no-per-creature React state.
- **Do not delete a guardrail** just because the current task finds it inconvenient. If it is obsolete, replace it with the new rule and record why in the changelog.
- **Do not encode temporary task details** (a single bug, a one-off experiment) as permanent project rules.
- **Do not contradict the specifications silently.** If the code intentionally differs, document the deviation in section 15.
- **Do not let stale commands remain.** A command that does not run is worse than no command.
- **Do not move detailed product requirements into this file.** This file tells agents how to work; the specifications define what the product is.
- If an instruction is ambiguous and affects architecture or scope, ask the maintainer before writing it as a rule.

### 16.4 Review cadence

Review this file:

- At the end of every roadmap phase.
- After a major refactor, dependency upgrade, or architecture decision.
- When onboarding a new agent or harness.
- When a repeated failure suggests the rules are incomplete.

Remove outdated content during review instead of letting it accumulate.

### 16.5 Changelog

| Date | Change | Reason |
|---|---|---|
| 2026-11-12 | Initial `AGENTS.md` created from the project description and technology stack | Establish agent rules, architecture guardrails, and self-maintenance process |
| 2026-11-12 | Recorded the solo vibecoded development model: no external reviewers or PR-approval gate | Maintainer direction; agents self-review and verify instead |

---

## 17. Known specification conflicts and defaults

The two specification documents are mostly consistent, but these points differ or leave room for interpretation. Until the maintainer decides otherwise, use the default in this table and record any change in section 15.

| Topic | Conflict or ambiguity | Default |
|---|---|---|
| UI state library | Tech stack recommends Zustand; project description says "Zustand when shared UI state justifies it" | React state first; add Zustand when justified |
| Statistics cadence | 1–2 updates/sec vs 2–5 updates/sec | 1–2 updates/sec until profiling supports more |
| Dependency installation | Tech stack lists a full install command; both docs warn against installing everything early | Install per phase; add packages only when used |
| Product name | Repo/README say EvoTerra; specs say Neural Creatures | EvoTerra for repo/product; Neural Creatures as the concept name |
| Rendering fallback | One doc mentions considering a fallback; the other warns not to promise one | WebGL baseline; clear unsupported-browser message; no promised Canvas fallback |
| World size | 256 × 256 is described as an initial target | Use it as the starting benchmark, not a hard limit |

If a conflict affects architecture, scope, or user-visible behavior, ask the maintainer rather than guessing.

---

## 18. Quick checklist for every task

Before editing:

- [ ] Read the relevant specification sections and this file.
- [ ] Inspect the current code; do not assume the target structure exists.
- [ ] Identify the current phase and confirm the work belongs there.
- [ ] Check whether a skill applies and use it.
- [ ] Write a short plan for non-trivial work.

While editing:

- [ ] Keep simulation code free of React and PixiJS.
- [ ] Keep authoritative state in the worker.
- [ ] Use seeded randomness; no `Math.random()` in simulation.
- [ ] Use the spatial grid; no all-pairs queries.
- [ ] Keep per-creature data out of React/Zustand.
- [ ] Batch snapshots; do not send per-creature messages.
- [ ] Validate external or persisted data.
- [ ] Add named, documented constants instead of magic numbers.
- [ ] Avoid scope creep and premature dependencies.

Before reporting completion:

- [ ] Run the relevant tests.
- [ ] Run the type check and production build when available.
- [ ] Manually verify the affected flow when practical.
- [ ] Update this file if rules, commands, or architecture changed.
- [ ] Report what changed, what was run, actual results, and known gaps.
