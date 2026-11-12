# EvoTerra — Overnight Shift Report

> **Shift window:** overnight, 2026-11-11 → 2026-11-12
> **Plan executed:** `evoterra-overnight-shift-plan.md` (Phase 1 + bounded Phase 2)
> **Execution mode:** inline, TDD, one fresh-context review at the end; no commits (plan §2.2 forbids committing without explicit maintainer instruction, so the whole shift sits uncommitted on the `main` working tree)
> **Test suite at end of shift:** 8 files, **63/63 passing** · `tsc -b` clean · `npm run build` clean

---

## 1. Summary

- **Phase 1 (app shell and renderer): complete.** Vite + React 19 + TypeScript (strict) scaffold, EvoTerra application shell, PixiJS 8 WebGL-only world viewport, camera pan/zoom, one passing test suite, production build.
- **Phase 2 (simulation worker prototype): complete in substance.** One dedicated worker owns a deterministic seeded movement simulation (100 prototype test particles), with start/pause/reset/speed controls, fixed 30 Hz timestep, batched ~15 Hz snapshots, and stale-snapshot protection across resets.
- **Runnable behavior in one paragraph:** the app opens a dark "simulation observatory" shell with a large WebGL world viewport showing a bounded 1024×768 world and a coordinate grid. A dedicated Web Worker owns 100 seeded test particles that drift and bounce off the world edges. The user can start (1×/2×/5×/10×), pause, reset (exact seeded replay), and read tick / entity / seed / step values at ~2 Hz. Drag pans; wheel zooms anchored on the pointer. The particles are explicitly prototype test entities — the UI and README state that neural decisions, food, energy, reproduction, and evolution do not exist yet.
- **The one unfinished piece is human verification:** no browser is installed on the host, so WebGL rendering, pan/zoom feel, and the control flow were **not** observed in a browser. Everything testable without one was tested (63 tests), and the build/dev-server/worker bundling was verified by command.

## 2. Deliverables

### Scaffold / configuration
| File | Why |
|---|---|
| `package.json`, `package-lock.json` | Scripts `dev/test/typecheck/build/preview`; deps: `react`, `react-dom`, `pixi.js`; dev deps: `vite`, `typescript`, `vitest`; `engines` = Node `^22.12`/`^24`/`>=26` (Vitest 5 requirement) |
| `vite.config.ts` | React plugin + Vitest (`node` environment, `tests/**/*.test.ts`) |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json` | Strict TypeScript explicitly enabled; third project so `tsc -b` also type-checks `tests/` |
| `index.html`, `.gitignore`, `public/favicon.svg` | EvoTerra title/metadata; ignores `node_modules`/`dist`; small planet favicon |

### App / UI
| File | Why |
|---|---|
| `src/app/App.tsx` | Shell: brand/status header, transport + speed controls, throttled tick/entity/seed readout, error banner, honest footnote |
| `src/app/styles.css` | Restrained dark observatory styling, responsive to narrow viewports |
| `src/app/summaryThrottle.ts` | Pure ~2 Hz status-refresh predicate; first snapshot is never throttled (review finding) |
| `src/app/useSimulationWorker.ts` | Worker lifecycle (create once, terminate on unmount), ref-held snapshots, no per-entity React state |
| `src/components/WorldViewport.tsx` | React host for the canvas; loading and WebGL-error overlays |
| `src/main.tsx` | Entry point, StrictMode |

### Rendering / camera
| File | Why |
|---|---|
| `src/rendering/PixiWorld.ts` | PixiJS 8 lifecycle: WebGL-only init (`preference: ['webgl']` array + `renderer.name` assertion so no silent Canvas fallback), pooled `Graphics` per entity, grid/border scene, ResizeObserver resize, pointer-drag pan, pointer-anchored wheel zoom, full teardown |
| `src/rendering/camera.ts` | Pure, DOM-free camera math (transform, pan, anchored zoom, world-bounds clamp) — unit-tested without a browser |

### Simulation core (`src/simulation/**` — no React, PixiJS, DOM, or wall-clock)
| File | Why |
|---|---|
| `config.ts` | Named, documented constants: 1024×768 world, 100 entities, 1/30 s step, 15 Hz snapshot target, catch-up cap 8, speeds 1/2/5/10 |
| `types.ts` | World/entity/state shapes; no genome/energy/neural fields |
| `random.ts` | Seeded mulberry32 RNG with inspectable/serializable 32-bit state |
| `createSimulation.ts` | Deterministic world creation; validates every config value at the boundary |
| `stepSimulation.ts` | Fixed-step movement with deterministic edge reflection; rejects non-finite input; zero step = no-op |
| `scheduler.ts` | Fixed-step accumulator; caps catch-up (discards backlog after a stall); rejects bad speed/timestep |
| `session.ts` | Clock-free owner of commands, status, tick, runId+sequence, and snapshot production — the whole protocol is testable without a Worker |

### Worker / protocol
| File | Why |
|---|---|
| `src/shared/messages.ts` | Discriminated `ClientCommand` / `WorkerEvent` unions, single definition |
| `src/shared/snapshotOrder.ts` | Stale-snapshot rule: tick **+ runId**, so reset races cannot resurrect old runs |
| `src/workers/simulation.worker.ts` | Thin adapter: one `setInterval` loop, real elapsed time, message boundary, error reporting |

### Tests (63 total)
`tests/simulation/{random,create-simulation,step-simulation,scheduler,session}.test.ts`, `tests/rendering/camera.test.ts`, `tests/shared/snapshot-order.test.ts`, `tests/app/summary-throttle.test.ts` — seeded repeatability, bounds containment over 500 steps, reflection, catch-up non-spiral, resume-after-pause, reset replay, snapshot ordering across run boundaries, camera NaN/clamp edges, throttle first-snapshot rule.

### Documentation
| File | Change |
|---|---|
| `README.md` | Rewritten to reality: real status, real commands, verification caveat, architecture/ownership table, actual folder structure |
| `AGENTS.md` | Status line, current-phase note, §12.3 verified commands, two §15 deviation rows (session ownership, Node floor), §16.5 changelog |
| *(untouched)* | `neural-creatures-project-description.md`, `neural-creatures-tech-stack.md`, `evoterra-overnight-shift-plan.md` — verified byte-identical via `git diff` |

## 3. Verification table

| Check | Command / action | Result | Notes |
|---|---|---|---|
| Clean install | `rm -rf node_modules && npm ci` | **Pass** | 61 packages, 0 vulnerabilities; lockfile in sync; repeated after adding `engines` |
| Unit tests | `npm run test` | **Pass** | 8 files, 63/63, ~4 s |
| Type check | `npm run typecheck` | **Pass** | `tsc -b` across app, worker, and tests |
| Production build | `npm run build` | **Pass** | Worker emitted as `dist/assets/simulation.worker-*.js`; main chunk ≈ 147 kB gzip |
| Dev server | `npm run dev -- --port …` | **Pass** | Started in ~200 ms; `/`, `/src/main.tsx`, and the module-worker entry all served HTTP 200; server stopped afterwards |
| Browser smoke test | Manual browser actions | **Not run** | No browser on the host (no chromium/firefox/Playwright cache) — not claimed |
| Worker flow | Start/pause/reset/speed | **Partial** | Verified by session/protocol tests (idempotent commands, reset replay, stale rejection, speed scaling); not observed in a browser |
| Camera | Pan/zoom/resize | **Partial** | Math unit-tested (anchoring, clamps, NaN, resize); not observed in a browser |
| Hygiene greps | `Math.random`, React/Pixi/DOM imports in `src/simulation`, `any`, TODO | **Pass** | All empty; PixiJS imported only in `src/rendering/**` |

## 4. Known limitations

- **Not runtime-verified:** WebGL viewport, pan/zoom feel, control flow, resize, and the WebGL-error path. Code-complete and API-checked against installed PixiJS 8.23.0 source, but no frame was ever rendered during this shift.
- **Absent by design for this shift** (and not claimed anywhere): neural networks, perception, food/resources/regeneration, energy/hydration, death, reproduction, mutation/inheritance, species, procedural terrain/biomes/noise, creature inspector, charts, persistence (IndexedDB/Zod), dashboards, backend.
- No interpolation between 15 Hz snapshots (plan marks it optional/deferrable).
- No touch/pinch gestures or keyboard pan/zoom; pointer-drag + wheel only.
- Population benchmarks (100/250/500/1,000) are Phase 7 work and were not run.
- StrictMode causes a brief double worker/WebGL init in development; teardown is correct, so this is dev-only churn.

## 5. Environment observations

- Node **v22.22.1**, npm **9.2.0**, Linux/amd64 (x86_64) — inside the declared engine range.
- 2 GB RAM host: no memory pressure events; nothing heavy ran concurrently; no OOM or killed processes.
- No browser available (local or headless); the host served purely as a build/verification box.
- No runaway or leftover processes at handoff (checked and cleaned).

## 6. Rulings made during the shift (deviations and judgment calls)

1. **No commits, no PR** — plan §2.2/§6 Block 8.7; the entire deliverable is the uncommitted working tree on `main`. *Cost: the maintainer reviews and commits personally.*
2. **Core-first order** (simulation core and worker protocol before the app shell) so nothing was written against stubs. *Cost: none to outcomes; the UI was written against a working protocol.*
3. **WebGL-only enforced with `preference: ['webgl']` (array form) plus a `renderer.name === 'webgl'` assertion** — the string form silently appends PixiJS's Canvas fallback, which the specs forbid. *Cost if wrong: none; failure is a visible error.*
4. **Command handling lives in `src/simulation/core/session.ts` (framework-free); the worker is a clock/message adapter** — deviates from plan §5.1's ownership table, recorded in AGENTS.md §15. *Cost: one extra hop for readers; payoff: the protocol is testable without a browser.*
5. **Node engine floor set to Vitest 5's range (`^22.12 || ^24 || >=26`) in `package.json` and README** — the documented test command must work for anyone following the README. *Cost: Node 20 users are excluded (they would fail at `npm run test` anyway).*
6. **Zero timestep = no-op; catch-up cap discards the backlog after a stall (never replays it)** — pause cannot accumulate a step spiral. *Cost: after a large stall, sim time trails wall-clock slightly.*
7. **Stale-snapshot rejection uses tick + runId**, not tick alone, because reset restarts the tick at 0.
8. **Camera clamped to world bounds; renderer failure is a first-class overlay; no Canvas fallback claimed.**
9. **Kept `.superpowers/sdd/evoterra-overnight-shift-plan/progress.md`** instead of deleting the plan workspace — the "git history is the record" premise doesn't hold with zero commits; deleting would be irreversible. *Cost: one scratch directory to remove when the work is committed.*

## 7. Final review outcome

A fresh-context reviewer (separate subagent) reviewed the whole change against the plan, specs, and installed PixiJS source. Verdict: **"Ready to merge — with fixes"**, no Critical findings.

- **Fixed (Important):** tick/entity readout could stay "—" on fast loads (throttle dropped the first snapshot) — fixed with a new tested predicate module (`summaryThrottle.ts`), test watched fail → pass.
- **Fixed (Important, re-graded from Minor):** README Node requirement was false for the test suite; `engines` added and docs corrected, verified through `npm install` + `npm ci`.
- **Fixed (re-graded from Minor):** missing AGENTS.md §15 rows for the session/worker ownership deviation and the missing verified/unverified separation in README — both required by AGENTS.md §16.1 and plan §7.5.
- **Fixed (Minor, opportunistically):** hardcoded `1/30 s` readout now derives from `FIXED_TIMESTEP_SECONDS`.
- **Deferred minors:** entity radius/hue applied only on first Graphics creation (future seed changes would reuse old glyphs); worker error banner latches for the app lifetime; the worker adapter's interval/clock/dispatch has no direct test; `canvas.style.width/height='100%'` is immediately overwritten by `renderer.resize`; drag ends only on pointerup/pointercancel (no `lostpointercapture`); camera clamp can shift the pointer anchor at a world edge; pan/zoom hint floats above the renderer-error overlay.

## 8. Next recommended task

1. **Run the manual browser checklist** (load → start → pause → reset → all four speeds → pan → zoom → resize/narrow viewport → WebGL-disabled error path) and record the results — it is the only acceptance area still unverified.
2. Then begin **Phase 3 — First functioning creature and resource loop**: documented creature traits, resource model, normalized neural inputs/outputs, spatial-grid tests, and a baseline/debug controller.
3. Do **not** start procedural biome generation or persistence before the creature/resource loop has a tested foundation.
