# EvoTerra

A browser-based 2D artificial-life sandbox. The long-term goal is a world where neural-network-driven
creatures perceive their environment, move, consume resources, reproduce, mutate, and evolve.

## Status

**Roadmap Phase 2 (simulation worker) and Phase 3 (creature/resource loop) are complete. Phase 4
(reproduction and evolution) is partially complete as a bounded asexual-reproduction slice.**

What actually runs today:

- A React + TypeScript + Vite application shell in a dark "simulation observatory" layout.
- A PixiJS 8 WebGL world viewport: grassland terrain with impassable rock, food patches that shrink
  and fade as they are eaten, and creatures whose brightness reflects their energy.
- One dedicated simulation Web Worker owning 100 founder creatures, their genomes, a seeded random
  generator, a fixed 30 Hz clock, terrain, food, and all rules.
- Real creature behaviour: each creature perceives nearby food and neighbours through eight normalised
  inputs and decides movement, eating, and reproduction through a fixed **8-12-4 neural network**
  whose weights are inherited.
- Survival and inheritance: basal and movement energy costs, starvation death, bounded food
  regeneration, asexual reproduction with an energy transfer, deep-copy inheritance, and bounded
  seeded mutation.
- Start, pause, reset, and 1×/2×/5×/10× speed controls, plus tick, time, population, births, deaths,
  average energy, food, and seed readouts.
- Click a creature to inspect its real traits, latest neural inputs, latest outputs, and a summary of
  its actual network parameters. The inspector refreshes at the statistics cadence.
- Batched snapshots at roughly 15 Hz and statistics at roughly 1.3 Hz; stale snapshots from an older
  run are discarded.

**Verification caveat:** the simulation core, worker protocol, and camera math are covered by the
automated suite, and the production build and type check pass. The built worker bundle was exercised
end-to-end in Node (commands, stepping, snapshots, inspection). The **WebGL viewport, pan/zoom, and
control flow have not been exercised in a browser** — no browser was available in the development
environment — so treat those as code-complete but unverified until the manual checklist is run.

Not implemented yet: procedural biomes and terrain noise, hydration, temperature, predators, sexual
reproduction, species/lineage analysis, charts, save/load, and any backend. Nothing in the UI claims
otherwise.

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

## Using the simulation

1. `npm run dev` and open the printed URL. The worker initializes with the default seed.
2. Press **Start**. Creatures move, eat, and — when they have enough energy and age — reproduce.
3. **Pause** stops tick advancement; **Reset** restores the exact seeded starting state.
4. Speed buttons run 1×/2×/5×/10× more fixed steps per wall-clock second (the step itself never changes).
5. Drag inside the viewport to pan, scroll to zoom (zoom is anchored on the pointer).
6. Click a creature to inspect it; click empty terrain to clear the selection.
7. The readout shows tick, time, population, births, deaths, average energy, food, seed, and step length.

The population is expected to fluctuate. An initial die-off of poorly connected networks followed by a
smaller stable population is a normal outcome, not a bug; food is finite and regenerates slowly.

## Architecture

| Layer | Owns |
|---|---|
| React (`src/app`, `src/components`) | Controls, layout, status text, worker lifecycle, selection, errors |
| PixiJS 8 (`src/rendering`) | Canvas, terrain/food/creature/selection layers, camera, pointer interaction |
| Simulation core (`src/simulation`) | Deterministic state, seeded RNG, fixed-step update, protocol decisions; no React, PixiJS, or DOM |
| Web Worker (`src/workers`) | The single scheduler loop, elapsed-time clock, message boundary |
| Shared contract (`src/shared`) | Discriminated command/event types, snapshot ordering rule |

Entity positions, genomes, and rules exist only in the worker. The renderer copies the newest accepted
snapshot every animation frame, and React never holds per-entity state. Terrain and world bounds are
sent once per run (`WORLD`), never per snapshot.

### Simulation rules in one place

All tuning values live in `src/simulation/core/config.ts` with documented units. The fixed-step update
order is documented in `src/simulation/core/stepSimulation.ts` and is part of the determinism contract:
regenerate food → rebuild indexes → perceive/infer → move → eat → energy/age → death → reproduce.

### Optional debug controller

`config.debugController` defaults to `'neural'`. Setting it to `'greedy'` replaces the network with a
simple food-seeking baseline so simulation bugs can be told apart from unhelpful evolved networks. It
is a diagnostic tool, not the default behaviour.

## Folder structure

Only directories that contain real code are listed.

```text
EvoTerra/
├── docs/                       Specifications, plans, reports, handoff
├── public/                     Static assets (favicon)
├── src/
│   ├── app/                    App shell, styles, worker hook
│   ├── components/             WorldViewport, CreatureInspector
│   ├── rendering/              PixiWorld, camera math
│   ├── simulation/
│   │   ├── core/               Config, RNG, world creation, indexes, update order, scheduler, session, stats
│   │   ├── creatures/          Perception, movement, energy, reproduction, controller, creature factory
│   │   ├── neural/             Network forward pass, genome creation/clone/validate/mutate
│   │   ├── resources/          Food placement and regeneration math
│   │   ├── spatial/            Uniform spatial grid (spatial hash)
│   │   └── terrain/            Starter grassland/rock terrain, passability checks
│   ├── shared/                 Worker message types, snapshot ordering
│   ├── workers/                simulation.worker.ts
│   └── main.tsx
├── tests/
│   ├── rendering/              Camera math
│   ├── shared/                 Snapshot ordering
│   └── simulation/             RNG, grid, terrain, food, network, genome, perception, movement,
│                               energy, death, reproduction, world creation, session protocol,
│                               deterministic integration, ecology, benchmarks
├── index.html
├── package.json
├── package-lock.json
├── tsconfig*.json
└── vite.config.ts
```

## Documentation

- [Project description](docs/neural-creatures-project-description.md)
- [Technology stack](docs/neural-creatures-tech-stack.md)
- [Phase 2 plan](docs/evoterra-24-hour-creature-simulation-plan-phase2.md)
- [Phase 2 handoff report](docs/evoterra-phase2-handoff-report.md)
- [Agent rules](AGENTS.md)
- [Overnight shift plan](docs/evoterra-overnight-shift-plan.md)
- [Overnight shift report](docs/evoterra-overnight-shift-report.md)
