# EvoTerra — Plan 3: Terrain Layer UI

> **Status:** implemented 2026-11-12. See §6 for the verification actually run.
> **Depends on:** Phase 1–3 (shell, worker, creature/food/energy loop) as described in `README.md`.
> **Out of scope:** Phase 5 procedural terrain, biomes, hydration. This plan only *shows* the
> existing bounded grassland habitat.

---

## 1. Problem

The terrain is drawn, but nothing explains it and nothing can query it.

Today `PixiWorld.setupWorld()` paints the whole world `0x0d1a14`, then stamps every impassable
cell with `0x2b333b`, plus always-on 128-unit grid lines and a border. `WORLD` already ships
`cellSize`, `cols`, `rows`, and the full `passable` `Uint8Array`. `SNAPSHOT` already ships food
positions and `amountRatio`. None of it reaches the user as information:

- Colour is unexplained — a dark grey blob could be a rock or a dead region.
- Grid lines cannot be turned off, and they compete with the food and creatures at world scale.
- Clicking empty ground only clears the creature selection; it says nothing about the ground.
- No way to see what a creature is actually sensing against the terrain it moves through.

## 2. Goal

Make the existing terrain legible and inspectable, with zero simulation changes.

**Non-goals:** new terrain types, biome colouring, generation parameters in the UI, editing
terrain, minimap, food-regeneration tuning. No worker protocol additions — everything below is
derived on the main thread from payloads the worker already sends.

## 3. What gets built

### 3.1 Sidebar: `TerrainPanel`

New component `src/components/terrain/TerrainPanel.tsx`, rendered above `CreatureInspector` in
the `App.tsx` sidebar. Always visible, whether or not a creature is selected.

1. **Legend** — three chips with counts, recomputed only when the `WORLD` event changes:
   - `Grass` (passable cells)
   - `Rock` (impassable cells)
   - `Food` (total food units, from the latest `STATS.totalFood`)
2. **Clicked cell** — after the user clicks the world:
   - cell `col,row`, world `x,y`
   - `passable` or `rock`
   - food units within a 64-unit radius of the click, summed from the latest snapshot
   - empty state: `Click the ground to inspect a cell.`
3. **Toggles** — checkbox or `aria-pressed` button, same visual language as the speed buttons:

   | Toggle | Default | Effect |
   |---|---|---|
   | Grid | on | grid lines and world border visibility |
   | Sense radii | off | debug overlay for the selected creature |
   | Food heat | off | coarse food-density overlay |

### 3.2 Rendering: `PixiWorld`

- Move rock stamping out of `terrainLayer` into its own `Graphics` so it can be hidden or
  emphasised independently. Grass stays in `terrainLayer`.
- New `heatLayer` between terrain and food: one translucent rect per 64-unit cell, alpha scaled
  by `foodUnitsInCell / FOOD_DENSITY_SATURATION`, rebuilt at the stats cadence (not every
  frame) from the latest snapshot.
- New `debugLayer` above creatures: for the selected creature only, draw
  `visionRange` (its real trait, 48–128 units), `NEIGHBOR_PERCEPTION_RADIUS` (40), and an inset
  rectangle at `BOUNDARY_PRESSURE_MARGIN` (80). Reuses the existing selection-layer pattern.
- Overlay flags arrive through a getter, mirroring `getSnapshot` / `getWorld` / `getSelectedId` —
  no React state per creature, no per-frame allocations.
- `onSelect` becomes `onPick(creatureId: number | null, worldX, worldY)`; the existing
  `CLICK_DRAG_TOLERANCE_PX` logic decides click vs. drag, unchanged.

### 3.3 Pure helpers: `src/rendering/terrainOverlay.ts`

Framework-free, unit-tested with Vitest, because the Pixi side cannot be tested in this
environment:

- `terrainCellAt(bounds, terrain, x, y)` → `{ col, row }`, or null outside the world
- `describeTerrainCell(bounds, terrain, food, x, y)` → cell + passable flag + nearby food units/patches
- `foodHeatGrid(bounds, food)` → `{ cols, rows, units: Float32Array }` of 64-unit cell sums
- `countTerrainCells(terrain)` → `{ passable, rock }`
- `heatIntensity(units)` → 0..1 alpha factor, saturating at two full patches per cell

## 4. Files

| File | Change |
|---|---|
| `src/components/terrain/TerrainPanel.tsx` | new |
| `src/rendering/terrainOverlay.ts` | new (pure helpers) |
| `tests/rendering/terrain-overlay.test.ts` | new (helpers + real worker payload) |
| `src/rendering/PixiWorld.ts` | split rock layer, add heat/debug layers, `onPick` |
| `src/components/WorldViewport.tsx` | pass overlay flags + `onPick` |
| `src/app/App.tsx` | own overlay toggle state + picked cell state |
| `src/app/styles.css` | panel, chips, toggles, legend |

Unchanged: `src/simulation/**`, `src/workers/**`, `src/shared/messages.ts`, `src/persistence/**`.
No new dependencies.

## 5. Constraints

- Architecture non-negotiables in `AGENTS.md` hold: rendering stays in PixiJS, React owns only
  controls and text, the worker still owns all authoritative state.
- Derived data only. If a value is not already in `WORLD`, `SNAPSHOT`, or `STATS`, it does not
  appear in this UI.
- Overlay rebuilds at the statistics cadence; hover/selection work at frame cadence but must not
  allocate per creature.
- Counts and cell info are labelled as this bounded test habitat, not as biome or ecology claims.

## 6. Verification

Actual results on 2026-11-12:

1. `npm run test` — 18 files, 139 tests passed, including 11 in
   `tests/rendering/terrain-overlay.test.ts`. One of those derives counts, cell info, and heat
   totals from a real `SimulationSession` `WORLD` + `SNAPSHOT` payload.
2. `npm run typecheck` — exit 0.
3. `npm run build` — exit 0; built worker 24.53 kB, main bundle 498.99 kB (150.10 kB gzip).
4. Manual toggle/click checks: **not run** — no browser in the agent environment.

## 7. Known gap

No browser is available in the agent environment, so the manual toggle/click checks are unverified
until the maintainer runs `npm run dev`. This is the same gap recorded in
`docs/evoterra-phase2-handoff-report.md`.
