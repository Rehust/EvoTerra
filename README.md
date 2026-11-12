# EvoTerra

A browser-based 2D artificial-life sandbox. The long-term goal is a world where neural-network-driven
creatures perceive their environment, move, consume resources, reproduce, mutate, and evolve.

## Status

**Roadmap Phase 1 (application shell and renderer) is complete. Phase 2 (simulation worker) is in progress
as a deliberately small movement prototype.**

What actually runs today:

- A React + TypeScript + Vite application shell in a dark "simulation observatory" layout.
- A PixiJS 8 WebGL world viewport with a bounded world, a coordinate grid, and camera pan/zoom.
- One dedicated simulation Web Worker that owns 100 prototype test particles, their positions,
  a seeded random generator, and a fixed 30 Hz clock.
- Start, pause, reset, and 1×/2×/5×/10× speed controls, plus a tick/entity/seed readout.
- Batched snapshots at roughly 15 Hz; stale snapshots from an older run are discarded.

The particles are **prototype test entities**, not creatures. They drift, bounce off the world edges,
and have no behaviour beyond that.

**Verification caveat:** the scaffold, simulation core, protocol, and camera math are covered by the
automated suite, and the production build and type check pass. The WebGL viewport, pan/zoom, and control
flow have **not** been exercised in a browser yet — no browser was available during this shift — so treat
those as code-complete but unverified until the manual checklist is run.

Not implemented yet: neural networks, perception, food and resources, energy and hydration, death,
reproduction, inheritance and mutation, species, procedural terrain and biomes, the creature inspector,
charts, save/load, and any backend. Nothing in the UI claims otherwise.

## Requirements

- Node.js `^22.12` or `^24` (or `>=26`) and npm, for development and building only. Vitest 5 requires
  Node 22.12+; `package.json` declares the same range in `engines`.
- A browser with WebGL2/WebGL1. The renderer is WebGL-only by design: if WebGL is unavailable, the app
  shows an error instead of falling back to Canvas.

## Commands

| Command | Purpose |
|---|---|
| `npm ci` | Reproducible install from `package-lock.json` |
| `npm run dev` | Start the Vite development server |
| `npm run test` | Run the Vitest suite once (no watch mode) |
| `npm run typecheck` | Type-check app, worker, and tests (`tsc -b`) |
| `npm run build` | Type-check and build the static site into `dist/` |
| `npm run preview` | Serve the built `dist/` locally for inspection |

`npm run preview` is a local inspection tool, not a production host. Deployment is static hosting of
`dist/`; the simulation always runs in the visitor's browser.

## Using the prototype

1. `npm run dev` and open the printed URL.
2. Press **Start**. Particles move at the selected speed.
3. **Pause** stops tick advancement; **Reset** restores the exact seeded starting state.
4. Drag inside the viewport to pan, scroll to zoom (zoom is anchored on the pointer).
5. The readout shows the current tick, entity count, worker seed, and fixed step length.

## Architecture

| Layer | Owns |
|---|---|
| React (`src/app`, `src/components`) | Controls, layout, status text, worker lifecycle, errors |
| PixiJS 8 (`src/rendering`) | Canvas, scene, entity display objects, camera, pointer interaction |
| Simulation core (`src/simulation`) | Deterministic state, seeded RNG, fixed-step update, protocol decisions; no React, PixiJS, or DOM |
| Web Worker (`src/workers`) | The single scheduler loop, elapsed-time clock, message boundary |
| Shared contract (`src/shared`) | Discriminated command/event types, snapshot ordering rule |

Entity positions exist only in the worker. The renderer copies the newest accepted snapshot every
animation frame, and React never holds per-entity state.

## Folder structure

Only directories that contain real code are listed.

```text
EvoTerra/
├── public/                     Static assets (favicon)
├── src/
│   ├── app/                    App shell, styles, worker hook
│   ├── components/             WorldViewport (React host for the Pixi canvas)
│   ├── rendering/              PixiWorld, camera math
│   ├── simulation/core/        Config, RNG, world creation, fixed-step update, scheduler, session
│   ├── shared/                 Worker message types, snapshot ordering
│   ├── workers/                simulation.worker.ts
│   └── main.tsx
├── tests/
│   ├── rendering/              Camera math
│   ├── shared/                 Snapshot ordering
│   └── simulation/             RNG, world creation, stepping, scheduler, protocol session
├── index.html
├── package.json
├── package-lock.json
├── tsconfig*.json
└── vite.config.ts
```

## Documentation

- [Project description](neural-creatures-project-description.md)
- [Technology stack](neural-creatures-tech-stack.md)
- [Agent rules](AGENTS.md)
- [Overnight shift report](evoterra-overnight-shift-report.md)
