# EvoTerra Phase 2 Handoff Report

> **Plan executed:** [`evoterra-24-hour-creature-simulation-plan-phase2.md`](evoterra-24-hour-creature-simulation-plan-phase2.md)
> **Date:** 2026-11-12
> **Repository state:** working tree on `main`; no commits or pushes (plan §0.4).
> **Final verification:** 129/129 tests, type check and production build clean.

---

## 1. Summary

- **What the simulation can now do:** 100 founder creatures with inherited genomes (4 traits + a fixed
  8-12-4 neural network) live on a seeded grassland habitat with impassable rock and 220 finite,
  regenerating food patches. Every fixed 1/30 s step, each creature perceives 8 normalised local
  inputs, infers movement/eat/reproduce outputs from its own network, moves within terrain/bounds/speed
  limits, eats finite food in stable-ID contention order, pays documented basal + movement energy costs,
  dies at zero energy, and — when old, cooled-down, energetic, and willing — reproduces asexually:
  exact energy transfer, deep-copy inheritance, bounded seeded mutation, deterministic nearby
  placement, lineage metadata. Births/deaths/population/food/energy appear in the UI; clicking a
  creature shows its real inputs, outputs, traits, and network summary. Reset replays the same seed
  exactly.
- **Roadmap state:** Phase 1, Phase 2, and Phase 3 **complete**; Phase 4 **partial** (bounded
  asexual-reproduction slice — no species analysis or evolution dashboard, per plan scope). Phases 5–7
  untouched.
- **Does the network actually drive behaviour?** Yes — and only the network: movement vectors come from
  `moveX`/`moveY` outputs (zero output = no movement, tested), eating requires the `eat` output ≥ 0.55
  threshold, reproduction requires the `reproduce` output ≥ 0.80 threshold. The only non-neural inputs
  are physical constraints (terrain, bounds, speed cap, food reach). A `debugController: 'greedy'`
  baseline exists for diagnostics but is not the default.

## 2. Implemented systems

| System | State |
|---|---|
| Creature/runtime model | **complete** — `CreatureState` with energy, age, cooldown, lineage, last inputs/outputs |
| Genome and traits | **complete** — create/clone/validate/mutate, all ranges clamped and tested |
| Neural topology + I/O semantics | **complete** — 8→12 tanh→4; outputs 0–1 tanh (movement), 2–3 sigmoid (actions); every input documented with range and normalisation |
| Starter habitat + food | **complete** — seeded rock clusters, food never on rock, bounded regeneration |
| Spatial indexing/perception | **complete** — uniform grid (sorted-by-id queries), vision-scoped food, fixed neighbour radius |
| Movement + terrain constraints | **complete** — unit-capped vector × speed trait × dt, axis-sliding on rock, world clamp, cost on actual displacement |
| Energy and death | **complete** — documented formulas, starvation death exactly once, index cleanup |
| Reproduction and mutation | **complete** for the bounded slice — eligibility gates, exact transfer, 8-direction placement search, non-directional bounded mutation |
| Worker/UI/inspector integration | **complete** — 6 commands, 7 event types, 15 Hz snapshots, 1.33 Hz stats, on-demand inspection with stale-response matching, pooled Pixi sprites |

## 3. Verification table

| Command/test | Actual result | Notes |
|---|---|---|
| `npm run test` (final, serial) | **17 files, 129 tests passed, 0 failed** | Vitest 5.1.0, node environment |
| `npm run typecheck` | **exit 0** | `tsc -b` across app/test configs, strict |
| `npm run build` | **exit 0**, built in ~0.7 s | worker chunk 24.5 kB, main 493.8 kB |
| `git diff --check` | **clean** | no whitespace errors |
| Deterministic replay | **pass** — same seed + elapsed sequence → identical snapshots; different seed → different run | `session.test.ts`, `integration.test.ts` (serialized full-state comparison over 300 steps) |
| Long-run invariants | **pass** — 3600 steps: finite positions/energy, genomes within bounds, grid size == population, pop ≤ cap, no duplicate ids | `integration.test.ts` |
| Ecology regression | **pass** — 120 s: population alive, births > 0, deaths > 0 | `ecology.test.ts` |
| Worker bundle smoke (Node, shimmed `self`) | **pass** — INIT→READY/WORLD/SNAPSHOT/STATS; START+10× advanced to tick 69 in 300 ms; 100 creatures + 220 food in snapshot; INSPECT returned real 8-12-4 data; no DOM references in bundle | temp script, deleted after use |
| Benchmarks (300 fixed steps each) | **100→1544 steps/s · 250→957 · 500→508 · 1000→248**; snapshot at 100 creatures = 28,144 bytes | `benchmark.test.ts` (measurement, not a gate) |
| `npm ci` | not run (node_modules already installed; plan §14 says install only when needed) | — |
| Browser/manual flow | **NOT PERFORMED — no browser available in the environment** | WebGL viewport, pan/zoom, select/inspect clicks, resize are code-complete but visually unverified |

## 4. Performance note

- **Populations measured:** 100 / 250 / 500 / 1000 founders (pure stepping, no rendering).
- **Simulation steps/s (this 1-vCPU dev machine):** 1544 / 957 / 508 / 248 — i.e. 100 and 250 creatures
  run faster than real time at 30 Hz even at 10× speed; 500 sustains 10× (≈5 steps needed per wall
  second at 10× vs 508 available); 1000 runs ≈8× real time.
- **Browser FPS:** not measured (no browser). **Estimated** fine at 100–250 creatures given the snapshot
  budget, but this is an estimate, not a measurement.
- **Snapshot cadence:** 15 Hz snapshot (28 kB at 100 creatures), 1.33 Hz stats, terrain sent once per
  run. **Distinction:** steps/s and bytes are measured; browser-side rendering behaviour is unverified.

### Tuning experiment

The plan (§7.3) permits tuning documented coefficients after a small deterministic experiment.

- Initial run (regen 0.08, eat reach 8.5, reproduce energy 65, reproduce-bias prior −0.7..−0.1):
  100 founders → 37 survivors at 240 s, 2 births. Reproduction was effectively unreachable.
- Changes: `FOOD_CONSUMPTION_RADIUS` 6 → 12, `FOOD_REGENERATION_PER_SECOND` 0.08 → 0.3,
  `REPRODUCTION_ENERGY_THRESHOLD` 65 → 60, reproduce-bias prior neutral (−0.3..0.3).
- Final trajectory (seed 20261111, 100 founders, 600 simulated seconds): 102 at 60 s, 50 at 240 s,
  31 at 360 s, stabilising 34–38 by 600 s; 32 births, 94 deaths; average energy 47–58; food near
  capacity (~2450/2640) — behaviour, not food supply, limits intake.
- No hidden bonus, no scripted steering, no fitness score was added.

## 5. Known limitations

- **Browser visual verification not performed** (no browser in the build environment) — the manual
  checklist in plan Block 12.7 remains for the maintainer.
- Terrain does not block line of sight (perception sees through rock; movement cannot). Documented in
  `perception.ts`.
- Full procedural biomes, noise, hydration, temperature, seasons, predation, sexual reproduction,
  persistence/save-load, charts, species analysis: **out of scope, not implemented**, per plan §1.3.
- Population equilibrates low (~35–50) with an initial die-off — an emergent outcome of documented rules,
  not tuned toward a look.
- Food placement checks the patch centre against rock only; creatures use a 9-point circle check.
- The 1000-creature benchmark is a measurement on one 1-vCPU machine, not a supported-population
  promise (`AGENTS.md` §10.2).

## 6. Files changed

- **New simulation domain:** `src/simulation/{spatial,terrain,resources,creatures,neural}/*`
  (grid, terrain, food, perception, movement, energy, reproduction, controller, genome/network),
  `src/simulation/core/{indexes,stats}.ts`.
- **Rewritten core:** `types.ts`, `config.ts` (all tuning, documented units), `createSimulation.ts`
  (full config validation), `stepSimulation.ts` (9-stage documented update order), `session.ts`
  (protocol + cadences), `src/shared/messages.ts` (7 event types), `src/workers/simulation.worker.ts`
  (same thin adapter).
- **UI:** `App.tsx` (transport + stats readout + selection), `useSimulationWorker.ts`
  (world/snapshot/stats/inspection), `PixiWorld.ts` (terrain/food/creature/selection layers,
  click-vs-drag picking), new `components/inspector/CreatureInspector.tsx`, `styles.css`,
  `WorldViewport.tsx`.
- **Removed dead code:** `src/app/summaryThrottle.ts` + its test (worker `STATS` already provides the
  cadence); `tsconfig.test.json` include updated.
- **Tests:** 9 new files (grid, terrain, food, network, genome, perception, reproduction,
  integration/ecology, benchmark) + rewritten `create-simulation`/`session`/`step-simulation` suites.
  63 → 129 tests.
- **Docs:** `README.md` rewritten to actual behaviour; `AGENTS.md` status/current-phase/changelog
  updated per §16; all long-form documents moved into `docs/`.

## 7. Recommended next milestone

**Phase 5 (procedural terrain and biomes)** — the state-ownership, protocol, and inspector plumbing now
exist and are tested, so biome data slots into the existing `WORLD` event and terrain checks without
protocol churn. Practical alternative if visual polish matters more: run the deferred manual browser
checklist first (it is the one unverified area), then decide.
