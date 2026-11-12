# EvoTerra — 24-Hour Coding-Agent Implementation Plan

> **Mission:** Advance the completed application-shell and worker-movement foundation into a functioning artificial-life simulation: real creatures, inherited genomes, neural-network decisions, local food perception, movement, resource consumption, energy economics, death, and a first bounded reproduction/mutation loop.
>
> **Budget:** 24 hours of focused coding-agent work, divided into three 8-hour workdays. This is an execution budget, not elapsed wall-clock time.
>
> **Environment:** Linux/amd64, 1 vCPU, 2 GB RAM.
>
> **Starting point:** The previous 8-hour foundation shift has reportedly been completed. The repository should already contain a React + TypeScript + Vite app, PixiJS world viewport, camera interaction, a dedicated simulation worker, a deterministic movement prototype, Vitest, `README.md`, and `AGENTS.md`. The first task is to verify this state, not recreate it.
>
> **Primary end state:** A user can start a seeded world, watch neural-network-driven creatures search for and consume food, see energy rise and fall, observe deaths and reproduction, select a creature to inspect its real traits and neural activity, and reproduce the same simulation from the same seed and settings.

---

## 0. Execution contract

This plan is written for an autonomous coding agent. Do not ask the maintainer to make routine product or implementation decisions. Use the defaults and decision rules below, inspect the repository, and make reasonable local choices.

### 0.1 Source-of-truth documents

Read these files in full before editing:

1. `AGENTS.md`
2. `README.md`
3. `neural-creatures-project-description-v2.md` (or the existing canonical project-description filename)
4. `neural-creatures-tech-stack.md`
5. `evoterra-overnight-shift-plan.md`

If the repository has a different canonical project-description filename, use the file already present. Do not create duplicate specification files.

Precedence is defined by `AGENTS.md`. In summary:

1. Explicit maintainer instructions.
2. `AGENTS.md`.
3. Project description and tech-stack specification.
4. Existing code and conventions.
5. This plan's bounded implementation defaults, where the specifications leave a choice open.

The long-term concept is called **Neural Creatures** in the specification; the application/product name is **EvoTerra**.

### 0.2 Verify the previous shift before extending it

The user reports that the previous shift is complete. Treat that as the intended starting milestone, but verify the actual checkout. Inspect:

```bash
pwd
uname -m
node --version
npm --version
git status --short
find . -maxdepth 4 -type f | sort | head -300
cat package.json
```

Then verify the actual package scripts and run the existing lightweight checks before feature work:

```bash
npm run
npm run typecheck
npm run test -- --run
npm run build
```

Use the real script names from `package.json`. The commands above are examples; do not invent missing scripts. If the project uses `npx vitest run` instead of `npm run test -- --run`, use the verified command.

Record the baseline results in the work log. If the existing application does not actually contain a working worker-driven movement prototype, spend only the first-hour verification budget fixing the smallest blocker. Do not rebuild the app shell or redo finished camera work.

### 0.3 Time accounting

- Stop feature development when the 24-hour budget is exhausted.
- Record actual elapsed agent time by work block.
- Do not hide overruns by relabeling unfinished work as complete.
- Reserve the final 90 minutes for documentation, verification, diff review, and handoff; do not consume it with optional features.
- If behind schedule, cut work in the priority order in section 17. Never weaken tests or fake behavior to meet the time budget.

### 0.4 No destructive repository operations

- Preserve the supplied specification files.
- Do not overwrite `AGENTS.md` or `README.md` with generated templates.
- Do not delete user changes or reset the repository.
- Do not commit, push, or open a pull request unless explicitly instructed.
- Do not add backend services, Docker, databases, cloud accounts, or unrelated infrastructure.
- Do not add a dependency without a concrete requirement and a reason it is worth the cost.

---

# 1. Mission and product outcome

The previous milestone demonstrated that the application can render a world and receive moving test entities from a simulation worker. This plan replaces the demonstration-only behavior with the first actual ecosystem loop.

The simulation should answer a simple question:

**Can individual organisms with small inherited neural networks sense a local food environment, move, consume resources, manage energy, survive, and produce offspring with inherited variation?**

The result should be an observable simulation, not a scripted animation. Neural outputs must affect actions. Food must be finite at a moment in time. Movement and survival must have explicit costs. Births and deaths must change the population. A debug baseline controller should make it possible to distinguish simulation bugs from network behavior.

## 1.1 Required end-of-plan deliverables

By the end of 24 hours, aim to deliver all of the following:

1. **Real creature model:** Replace prototype-only test entities with creatures that have runtime state and an inherited genome.
2. **Fixed-topology neural network:** Implement the documented compact feed-forward network, with deterministic initialization and forward inference.
3. **Defined perception contract:** Every neural input has a name, numeric range, normalization rule, and test.
4. **Seeded starter habitat:** Create a simple grassland environment with passable cells and a limited number of impassable rock patches. This is a bounded test habitat, not the final procedural biome system.
5. **Food resources:** Place finite plant-like food resources in passable areas and regenerate them up to a capacity.
6. **Spatial queries:** Use the existing spatial-grid implementation if present, or implement/test one for nearby food and creatures. Do not use all-pairs neighbor scans.
7. **Neural movement and eating:** Creature actions are derived from actual neural outputs. Creatures can find food, move toward/away from it, and attempt consumption.
8. **Energy and death:** Basal and movement costs reduce energy; eating increases energy; creatures with depleted energy die and are removed from the active population.
9. **First reproduction loop:** Eligible creatures can reproduce asexually. Offspring inherit the parent genome, receive bounded mutation, get stable ancestry metadata, and consume a defined energy transfer from the parent.
10. **Worker integration:** The worker remains the sole owner of the authoritative world and simulation state. The UI receives batched render snapshots and less-frequent statistics.
11. **Creature selection and inspection:** A user can select a creature and inspect its actual traits, energy/life state, neural inputs/outputs, and genome/network summary.
12. **Useful visualization:** Food, creatures, impassable terrain, selection, and basic population/resource status are visible in PixiJS and the React shell.
13. **Deterministic and integration tests:** Core formulas, network inference, perception, food contention, energy, death, reproduction, mutation, and seeded replay are tested.
14. **Honest docs and handoff:** README and AGENTS status reflect only implemented behavior. The handoff report lists commands actually run and all known gaps.

## 1.2 Scope boundary

This is principally **Roadmap Phase 3 — First functioning creature and resource loop**, plus the smallest coherent portion of **Phase 4 — Reproduction and evolution**.

The first habitat is deliberately simple:
- One grassland-like environment.
- A bounded terrain grid.
- A deterministic set of impassable rock patches.
- Finite food patches with regeneration.
- A modest starting population.

This environment provides enough spatial structure to test perception, movement, food discovery, and survival without pulling the full terrain-generation phase into this plan.

## 1.3 Explicitly out of scope

Do not implement these during this 24-hour plan:

- Full simplex-noise world generation.
- Six production biomes, rivers, lakes, hydrology, seasons, weather, drought, floods, or fire.
- Hydration, temperature stress, or complex climate.
- Predators, combat, attacks, prey defense, or hunting.
- Sexual reproduction or crossover.
- Dynamic neural-network topology or gradient training.
- Species clustering or advanced lineage analytics.
- Complex migration analysis.
- Full historical charts or a polished evolution dashboard.
- Save/load, IndexedDB migrations, import/export, or cloud sync.
- Backend APIs, accounts, multiplayer, server-side simulation, or databases.
- WebGPU, WebAssembly, multiple workers, `SharedArrayBuffer`, or a large physics engine.
- A complete visual neural-network editor.
- Advanced animation or large asset pipelines.

Do not build future systems just because they appear in the product vision.

---

# 2. Architecture and ownership rules

Keep the established architecture. Extend it; do not replace it.

| Area | Authoritative responsibility | Must not become |
|---|---|---|
| Simulation core | Pure or isolated deterministic world rules, creature state, genomes, resources, actions, energy, reproduction | React/PixiJS-dependent code |
| Simulation worker | Owns the one active simulation, RNG state, scheduling, commands, snapshots, inspection replies | A second copy of the simulation in the UI |
| React | Controls, inspector layout, summaries, selected creature ID, status/error state | A per-creature state store |
| PixiJS | Terrain/resource/creature display objects, picking, camera, selection visuals | A source of simulation truth |
| Shared contracts | Worker message discriminated unions and shared DTOs | Duplicated message definitions |
| Tests | Deterministic pure and integration verification | Timing-sensitive tests that rely on arbitrary sleeps |

### 2.1 Non-negotiable rules

- Keep `src/simulation/**` independent of React, PixiJS, and DOM globals.
- Use one dedicated worker for authoritative simulation state.
- Use one seeded RNG owned by the simulation instance. No `Math.random()` in simulation logic.
- Use fixed simulation steps and capped catch-up.
- Keep simulation order deterministic.
- Use the existing fixed-step and snapshot scheduling from the previous milestone unless a verified bug requires a targeted change.
- Keep render snapshots batched, with tick/sequence metadata.
- Render at browser animation-frame cadence, independently from simulation cadence.
- Do not send the complete neural-network genome for every creature in each render snapshot.
- Fetch selected-creature inspection details on demand.
- Use the existing spatial grid or add a small tested one. No all-pairs creature/food scan.
- Reuse PixiJS objects; do not recreate every creature sprite each snapshot.
- Preserve strict TypeScript settings and avoid `any`.
- Do not add Zustand unless current shared UI state demonstrably requires it.
- Run installs, tests, type checks, and builds serially on the 1-vCPU / 2-GB machine.

---

# 3. Domain model to implement

Do not blindly copy these names if the repository already has equivalent well-designed types. Map the concepts onto the existing project model and avoid duplicate representations.

## 3.1 Creature runtime state

A live creature should have a clear separation between inherited genome data and temporary simulation state.

Suggested runtime fields:

```ts
interface Creature {
  readonly id: number;
  readonly parentId: number | null;
  readonly lineageRootId: number;
  readonly generation: number;

  x: number;
  y: number;
  vx: number;
  vy: number;

  energy: number;
  ageSeconds: number;
  reproductionCooldownSeconds: number;

  alive: boolean;
  genome: Genome;

  // Most recent decision data, retained for the selected-creature inspector.
  lastInputs: NeuralInputs;
  lastOutputs: NeuralOutputs;
}
```

Requirements:
- IDs are unique and monotonically allocated within a run; do not reuse IDs after death.
- `parentId` is null for founder creatures.
- `lineageRootId` is stable across descendants.
- `generation` is zero for founders and parent generation plus one for offspring.
- Dead creatures must not continue to move, eat, reproduce, or appear in the live render list.
- If a death counter/history is needed, update it before removing the creature from the active collection.
- Do not retain unbounded corpse records.

## 3.2 Genome and active inherited traits

Use a fixed, serializable genome containing a small set of traits and the neural-network parameters.

Implement only traits with immediate mechanical effects:

| Trait | Suggested initial range | Mechanical effect |
|---|---:|---|
| `maxSpeed` | 0.65–1.8 multiplier | Scales maximum movement speed |
| `bodySize` | 0.7–1.4 multiplier | Changes visual radius and maintenance/movement cost |
| `visionRange` | 48–128 world units | Controls local perception radius |
| `metabolicEfficiency` | 0.7–1.3 multiplier | Scales basal energy cost inversely |

These are implementation defaults, not permanent balance values. If the existing world coordinate scale makes the ranges unsuitable, inspect the current viewport/world constants and tune them once. Record the final values and units in a central configuration module.

Do not add swimming, climbing, heat tolerance, cold tolerance, water efficiency, or camouflage yet. Those traits would be inert without the corresponding environment mechanics.

### 3.2.1 Genome requirements

- One fixed topology identifier/version.
- Trait values.
- Neural-network weights and biases.
- Explicit cloning so a child cannot share mutable arrays with its parent.
- Validation of array lengths and finite numeric values.
- Bounded trait values after mutation.
- Bounded network weights and biases after mutation.
- No topology mutation in this plan.

---

# 4. Neural-network contract

Implement a compact feed-forward MLP in plain TypeScript. Do not add an ML framework.

## 4.1 Fixed topology

Start with:

```text
8 inputs → 12 hidden neurons → 4 outputs
```

Use a documented, fixed weight/bias layout. Choose row-major arrays or nested arrays and use that representation consistently in creation, inference, cloning, mutation, tests, and inspection.

Recommended activation policy:
- Hidden layer: `tanh`.
- Movement outputs 0 and 1: `tanh`, range `[-1, 1]`.
- Action outputs 2 and 3: sigmoid, range `[0, 1]`.

Avoid allocating intermediate arrays inside every creature evaluation if simple reusable buffers or direct loops are sufficient. Do not prematurely optimize before correctness is established.

## 4.2 Exact input semantics

The initial eight inputs must have documented semantics and stable numeric ranges. Use the following mapping unless repository work already established an equally coherent documented mapping:

| Index | Name | Range | Meaning |
|---:|---|---:|---|
| 0 | `foodDirectionX` | -1 to 1 | X component of normalized direction toward the nearest detected food |
| 1 | `foodDirectionY` | -1 to 1 | Y component of normalized direction toward the nearest detected food |
| 2 | `foodProximity` | 0 to 1 | `1 - distance / visionRange`; zero when no food is detected |
| 3 | `localFoodDensity` | 0 to 1 | Nearby available food amount divided by a named normalization capacity |
| 4 | `nearbyCreatureDensity` | 0 to 1 | Nearby live-creature count divided by a named saturation count |
| 5 | `energyRatio` | 0 to 1 | Current energy divided by maximum energy |
| 6 | `boundaryPressureX` | -1 to 1 | Directional pressure away from the nearest horizontal world edge |
| 7 | `boundaryPressureY` | -1 to 1 | Directional pressure away from the nearest vertical world edge |

Rules:
- Normalize every input and clamp it to its stated range.
- When no food is in range, food direction and proximity are zero.
- Do not leak global food coordinates or population totals to individual creatures.
- `nearbyCreatureDensity` counts only nearby live creatures and excludes the creature itself.
- Boundary pressure is zero when the creature is sufficiently far from the corresponding edge and points inward near an edge.
- Do not add fake hydration or temperature inputs. Those mechanics are deferred.
- The inspector must display the exact values that were passed to the selected creature's most recent forward pass.

## 4.3 Exact output semantics

| Index | Name | Range | Meaning |
|---:|---|---:|---|
| 0 | `moveX` | -1 to 1 | Desired horizontal movement direction/strength |
| 1 | `moveY` | -1 to 1 | Desired vertical movement direction/strength |
| 2 | `eat` | 0 to 1 | Tendency to attempt food consumption |
| 3 | `reproduce` | 0 to 1 | Tendency to attempt asexual reproduction |

Network outputs represent tendencies, not guaranteed outcomes. The simulation applies movement limits, terrain checks, resource availability, cooldowns, energy thresholds, and population limits.

## 4.4 Neural-network tests

Required tests:
- Output shape is always exactly four finite values.
- Output ranges match the contract.
- Same genome and same input produce identical outputs.
- Known hand-authored weights produce a predictable forward pass.
- Zero weights/biases produce the expected neutral outputs.
- Input normalization clamps invalid/extreme values at the perception boundary.
- Invalid genome shapes are rejected instead of producing `NaN`.
- Network evaluation does not mutate genome weights or biases.
- Selected-creature inspection shows its actual genome and actual latest activations.

---

# 5. Seeded starter habitat and resources

## 5.1 Habitat scope

Create one starter habitat that is visually and mechanically recognizable as a simple grassland.

- Reuse the current prototype world dimensions if suitable.
- Keep world coordinates continuous for creatures and resources.
- Use a terrain grid with a named cell size and dimensions.
- Grassland cells are traversable.
- Add a small number of deterministic impassable rock clusters or patches.
- Keep the map reproducible from the world seed.
- Do not introduce simplex noise or multiple biome types.
- Make all terrain queries framework-independent and unit-testable.

A starter map can be intentionally simple. Its purpose is to validate movement/perception and enforce the MVP passable/impassable distinction, not to simulate geological processes.

## 5.2 Terrain invariants

- Terrain dimensions and cell size are validated.
- Creature spawn positions and food positions are on valid passable cells.
- Creatures cannot move into impassable cells.
- A creature already adjacent to a blocked cell remains in a valid position after attempted movement.
- Movement resolution is deterministic.
- No coordinate can become `NaN` or infinite.
- World-edge behavior remains consistent with the previous prototype; replace bouncing with another behavior only if there is a clear, tested benefit.

For continuous creatures with a nonzero radius, avoid checking only the center point if that allows a creature to overlap a rock significantly. Use a small, understandable collision approximation such as checking the destination cell and nearby occupied cells around the creature radius. Do not add a general physics engine.

## 5.3 Food-resource model

Use plant-like food patches. Keep resources separate from creatures.

Suggested fields:

```ts
interface FoodResource {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  amount: number;
  readonly capacity: number;
  readonly regenerationPerSecond: number;
}
```

Requirements:
- Food amount stays in `[0, capacity]`.
- Food positions are on passable terrain.
- Food regenerates at a bounded rate.
- Eating reduces the resource amount immediately.
- A depleted resource remains depleted until it regenerates; it must not be replenished instantly by an accidental initialization path.
- Resource placement is deterministic for a given seed.
- Use a separate resource spatial index or a suitable reusable generic spatial-grid query.
- Render resource amount in a visually meaningful way, such as size or opacity, without creating one React component per resource.

Initial starter defaults may use approximately 150–300 food patches and 100 founder creatures, but inspect the existing world scale and profile before fixing them. Store all tuning values in a single typed configuration structure.

## 5.4 Resource regeneration formula

Use a clear formula, for example:

```text
nextAmount = min(capacity, currentAmount + regenerationPerSecond * dt)
```

Document the units. Test:
- Regeneration increases a depleted resource.
- Regeneration never exceeds capacity.
- Zero regeneration leaves amount unchanged.
- Negative, NaN, infinite, or invalid capacity values are rejected or normalized at configuration creation.

---

# 6. Perception, spatial indexing, and deterministic update order

## 6.1 Spatial queries

Inspect the existing prototype's spatial-grid implementation first. Reuse and extend it if it is correct. Otherwise implement a compact uniform spatial grid in the simulation core.

It must support the query patterns needed now:
- Nearby food within a creature's vision radius.
- Nearby live-creature count within a perception radius.
- Nearby candidate positions for offspring placement.

Required invariants:
- An entity is indexed in exactly one expected cell for its current position.
- Moving an entity updates its index correctly.
- Removed/dead entities are not returned.
- Queries do not return duplicate IDs.
- Query results have stable deterministic ordering, or the caller sorts by a documented stable key.
- Boundary cells and negative/out-of-world coordinates are handled safely.
- Do not use all-pairs scans for routine nearby queries.

For small food sets, a full scan may be temporarily accepted only if measurements show it is genuinely simpler and fast enough. Document the limitation and do not silently describe it as spatially indexed.

## 6.2 Food selection and perception

A creature detects only food resources inside its own `visionRange`.

Nearest-food selection:
1. Ignore depleted resources.
2. Ignore resources outside vision.
3. Choose the smallest squared distance.
4. Break equal-distance ties by stable resource ID.
5. Compute direction from creature to resource and normalize it.
6. Compute proximity using the exact formula in section 4.2.
7. Compute local food density from the total available resource amount in range using a named saturation constant.

Do not reward creatures for sensing a resource through impassable terrain unless the sensing rule explicitly allows it. For this first version, a straightforward line-of-sight check may be deferred; terrain should at least block movement. Document that limitation.

## 6.3 Deterministic simulation update order

Use a staged update so actions do not depend on incidental object-array iteration or partially updated observations.

Recommended fixed-step order:

1. **Regenerate food:** Update food amounts and clamp to capacity.
2. **Build/query indexes:** Ensure food and creature indexes represent the state used for the current perception step.
3. **Perceive and infer:** In stable creature-ID order, calculate inputs and all network outputs from the same pre-movement world state.
4. **Move:** Apply movement intents in stable ID order; clamp speed by the inherited `maxSpeed`; resolve terrain and world-boundary constraints.
5. **Eat:** Process eat intents in stable creature-ID order. Resolve competition deterministically and reduce food amount immediately as each successful consumption occurs.
6. **Energy and age:** Apply basal and movement costs, apply food energy gains, increase age, and update cooldowns according to one documented convention.
7. **Death:** Mark creatures with energy at/below zero as dead; update death counts; remove them from live indexes and active render data.
8. **Reproduction:** Process surviving eligible creatures in stable ID order; apply energy transfer, place offspring, clone/mutate genomes, allocate IDs, and update birth counts.
9. **Finalize:** Rebuild/update indexes as needed, advance tick/time, and make summary values available for the next snapshot.

The exact point at which food regeneration occurs can vary if the implementation is already structured differently, but it must be consistent, deterministic, tested, and documented.

Important:
- Do not let newborn creatures act in the same simulation tick in which they are created.
- Do not allow dead creatures to reproduce.
- Do not allow the same finite food to be consumed beyond its remaining amount.
- Do not let reproduction exceed the configured population cap.
- Use stable numeric IDs for deterministic tie-breaking.
- Tests must call fixed-step functions directly, not sleep on worker timers.

---

# 7. Movement, consumption, and energy economy

## 7.1 Movement

- Interpret the two movement outputs as a desired direction vector.
- Normalize the vector if its magnitude exceeds one.
- Multiply by the creature's inherited speed limit and fixed timestep.
- Keep positions in continuous world coordinates.
- Charge movement cost based on actual displacement, not requested displacement.
- Apply terrain and world-boundary constraints before committing final position.
- A zero movement vector must result in no movement.
- A blocked move must not teleport the creature or create invalid coordinates.

Avoid arbitrary movement when the network outputs are neutral. It is acceptable for a creature with zero movement output to remain still.

## 7.2 Eating action

A creature may attempt to eat only when:
- Its `eat` output crosses the configured threshold.
- An available resource lies within the consumption radius.
- The resource has a positive remaining amount.

Suggested initial action threshold: `0.55`. Treat it as a tuning constant, not a magic number embedded in the action function.

Consumption:
- Consume at most the resource's remaining amount.
- Consume at most a configured per-action amount.
- Convert consumed quantity into energy using a named energy-per-food-unit constant.
- Clamp creature energy to its maximum.
- Any energy that would exceed the maximum is discarded; do not secretly duplicate food or energy.
- If multiple creatures target the same resource, stable ID order decides who receives the remaining quantity first.

The first version does not need an elaborate chewing/animation system.

## 7.3 Energy model

Energy is the first survival pressure. Hydration and temperature are deferred.

Use named constants and documented units. A workable structure is:

```text
maximumEnergy = BASE_MAX_ENERGY

basalCost =
  BASE_MAINTENANCE_PER_SECOND
  * bodySize
  / metabolicEfficiency
  * dt

movementCost =
  MOVEMENT_ENERGY_PER_WORLD_UNIT
  * bodySize
  * actualDisplacement

energyAfterStep =
  min(maximumEnergy, currentEnergy
      - basalCost
      - movementCost
      + foodEnergyGain)
```

Adjust coefficient magnitudes after a small deterministic experiment. The formula matters more than any initial guessed coefficient.

Rules:
- No hidden survival bonuses.
- No negative energy after death cleanup.
- Energy is clamped to the legal range for live creatures.
- A creature with no food must eventually lose energy under positive basal cost.
- A creature that consumes food must gain energy unless already at its cap.
- Body size and metabolic efficiency must have real, tested consequences.
- Avoid energy values being affected by UI frame rate or snapshot cadence.
- Document whether costs/gains are applied before or after death checks; use the same order everywhere.

## 7.4 Death

- Energy at or below zero transitions a live creature to dead exactly once.
- Death increments the counter exactly once.
- Dead creatures are removed from active spatial indexes and render snapshots.
- Dead creatures cannot eat or reproduce.
- Keep optional last-death summary data bounded; do not accumulate every dead object forever.
- Expose current population, births, and deaths in summary stats.

---

# 8. Reproduction, inheritance, and mutation

Reproduction is included as a bounded first slice of Phase 4. It is not a full evolution dashboard or a guarantee that any particular trait becomes dominant.

## 8.1 Eligibility

A creature may reproduce only when all conditions hold:

- It is alive.
- Its age exceeds a named minimum age.
- Its reproduction cooldown is zero.
- Its energy is at or above a configured threshold.
- Its neural `reproduce` output crosses a configured threshold.
- The live population is below the maximum population.
- A valid nearby offspring position can be found.

Suggested initial output threshold: `0.80`. Keep it in the config.

A temporary test helper may expose a controlled reproduction request for deterministic unit tests. Do not use test-only helpers in the normal runtime.

## 8.2 Energy transfer

Use an energy transfer, not free energy creation:

```text
parent.energy -= OFFSPRING_ENERGY_TRANSFER
child.energy = OFFSPRING_ENERGY_TRANSFER
```

The parent must have sufficient energy to pay the transfer and remain alive after the operation. If the transfer would cause death, reproduction is rejected or the threshold is raised. Do not create an offspring and then immediately kill the parent through an inconsistent cost order.

## 8.3 Offspring placement

- Search a small deterministic sequence of nearby candidate offsets.
- Candidate position must be inside world bounds.
- Candidate position must be on passable terrain.
- Avoid overlapping a rock or spawning outside the valid map.
- Prefer a nearby unoccupied position using the existing spatial grid.
- If no valid position exists, reproduction fails without energy transfer or ID allocation.
- Stable candidate order must be tested.

Do not implement complex collision physics or pathfinding.

## 8.4 Inheritance and mutation

- Offspring receives a deep copy of the parent's genome.
- Mutate inherited traits and network weights/biases using the worker-owned seeded RNG.
- Each gene/locus has a configured mutation probability.
- Mutation perturbations use a bounded, documented magnitude.
- Clamp traits and weights to allowed bounds.
- No mutation operation may modify the parent's genome.
- Keep the topology fixed.
- A mutation may be neutral, harmful, or beneficial; do not bias mutations toward improvement.

Suggested initial configuration:
- Mutation probability: 0.02 per scalar gene/weight.
- Trait perturbation: a small fraction of each trait's allowed range.
- Weight/bias perturbation: bounded additive uniform perturbation.
- All values belong in one configuration object and can be tuned later.

Use an explicit seeded mutation function. The same parent genome, seed, and mutation configuration must produce the same child genome.

## 8.5 Lineage metadata

Record only what is needed:
- `parentId`
- `lineageRootId`
- `generation`
- Unique child ID

Do not add species clustering, a full genealogy UI, or complex ancestry graph storage yet.

## 8.6 Reproduction tests

- Under valid conditions, one offspring is created.
- Parent energy decreases by exactly the transfer amount.
- Child begins with exactly the transferred energy.
- Child receives a distinct genome object and distinct arrays.
- Parent genome remains unchanged.
- Same seed produces identical mutated child genome.
- Trait/weight bounds hold after many mutations.
- Invalid placement or population cap prevents reproduction.
- Dead, under-age, low-energy, or cooldown-blocked creatures cannot reproduce.
- Birth counter increases once per successful reproduction.
- Newborn does not act during its birth tick.

---

# 9. Worker protocol and UI integration

Extend the existing worker protocol without replacing it with a generic RPC layer.

## 9.1 Worker commands

Retain existing working commands such as `INIT`, `START`, `PAUSE`, `RESET`, and `SET_SPEED`.

Add only what the new feature needs:
- `INSPECT_CREATURE` — request details for a creature ID.
- Optionally `CLEAR_SELECTION` if the UI needs it; otherwise a nullable selected ID is enough.

Use request IDs for inspection responses if needed. Use exhaustive discriminated-union handling.

## 9.2 Worker events

Retain existing events and add:
- `CREATURE_DETAILS` — selected creature detail payload with actual trait values, energy/lifecycle summary, neural inputs, outputs, and compact network/genome data required by the inspector.
- `STATS` — periodic summary of population, births, deaths, average energy, total available food, tick, and simulation time.
- `ERROR` — structured error with a safe user-facing message and useful diagnostic context for logs.

Do not send neural weights for every creature in render snapshots. Inspection is on demand.

## 9.3 Render snapshot contract

Include only fields required for world drawing:
- Tick and monotonic sequence number.
- Live creatures: id, x, y, radius/size, energy ratio, optional display value.
- Food resources: id, x, y, normalized remaining amount.
- Terrain data only when needed by the renderer; static terrain should not be retransmitted on every snapshot.
- Population summary can be separate at the lower stats cadence.

Do not send full genome arrays, all neural activations, or full historical data in every render snapshot.

## 9.4 Selecting a creature

- Add PixiJS hit-testing/picking for creature display objects.
- Picking must return the stable creature ID.
- Clicking empty terrain clears the selection.
- On selection, send an inspection request to the worker.
- Ignore an inspection response for a different/newer selected ID.
- If the selected creature dies, display a clear “no longer alive”/last-known state or clear the selection consistently.
- Selection rings/highlights are visual-only and do not modify simulation state.

## 9.5 Basic inspector and status UI

Add a compact inspector panel showing:
- Creature ID, parent ID, lineage root, generation.
- Current energy and energy ratio.
- Age and reproduction cooldown.
- Maximum speed, body size, vision range, metabolic efficiency.
- The eight actual neural input values.
- The four actual neural output values.
- A concise representation of network topology and weight summary; no elaborate editor.

Add compact simulation summaries:
- Tick/time.
- Current population.
- Birth count.
- Death count.
- Average live-creature energy.
- Total available food.
- Running/paused state and speed.

Statistics should update around 1–2 times per second, not on every simulation step.

---

# 10. PixiJS rendering work

Keep the existing renderer and camera. Add only the layers and visuals required to make the new mechanics observable.

## 10.1 Visual layers

Recommended draw order:
1. Background/grassland base.
2. Terrain/rock patches.
3. Food patches.
4. Live creatures.
5. Selection indicator.
6. Optional debug/perception overlay, disabled by default.

## 10.2 Visual semantics

- Rock cells are visibly distinct from passable grassland.
- Food patch size/opacity changes with remaining amount.
- Creatures have stable IDs in simulation data; visual color can reflect energy ratio or a stable inherited appearance value.
- Selected creature is clearly highlighted.
- Avoid text labels for every creature at ordinary zoom.
- Preserve camera pan/zoom and viewport resizing.
- Avoid per-snapshot destruction/recreation of all sprites.
- Keep the renderer tolerant of entity birth/death and changing counts.
- Do not add complex sprites or external art assets. Simple Pixi graphics are sufficient.

## 10.3 Optional debug view

Only after all core behavior works, add a simple toggle for one useful overlay:
- Vision radius for selected creature, or
- Food perception vector and target.

The overlay must be derived from the selected creature's real perception data. Do not draw a decorative radius that disagrees with the simulation.

---

# 11. Suggested module organization

Adapt existing files rather than forcing an exact tree. Add modules only for implemented behavior.

```text
src/
├── app/
│   ├── App.tsx
│   ├── app state/hooks
│   └── styles.css
├── components/
│   ├── controls/
│   ├── inspector/
│   └── status/
├── rendering/
│   ├── PixiWorld.ts
│   ├── camera.ts
│   └── layers/
│       ├── terrain layer
│       ├── food layer
│       └── creature layer
├── simulation/
│   ├── core/
│   │   ├── config.ts
│   │   ├── random.ts
│   │   ├── types.ts
│   │   ├── createSimulation.ts
│   │   └── stepSimulation.ts
│   ├── terrain/
│   │   ├── terrain types
│   │   ├── createStarterHabitat.ts
│   │   └── collision queries
│   ├── resources/
│   │   ├── food types
│   │   ├── food generation
│   │   └── food updates
│   ├── creatures/
│   │   ├── creature types
│   │   ├── genome
│   │   ├── traits
│   │   ├── perception
│   │   ├── movement
│   │   ├── energy
│   │   └── reproduction
│   ├── neural-network/
│   │   ├── network types
│   │   ├── createNetwork
│   │   ├── forward
│   │   └── mutate
│   └── spatial/
│       └── spatial grid
├── workers/
│   └── simulation.worker.ts
├── shared/
│   ├── messages.ts
│   └── DTOs
└── tests/
    ├── neural-network/
    ├── simulation/
    ├── resources/
    ├── creatures/
    └── worker-contract/
```

Do not create empty files or directories to match this diagram. Use the current repository's actual conventions.

---

# 12. Exact 24-hour execution schedule

The schedule is three 8-hour workdays. The sequence is dependency-aware: the neural and perception contracts are completed before integration, and reproduction follows a working survival loop.

## Day 1 — Domain model, genetics, neural decisions (8 hours)

### Block 0 — Repository verification and baseline (1 hour)

**Objective:** Confirm the previous milestone is real and healthy.

Tasks:
1. Read all five source documents listed in section 0.1.
2. Inspect actual source tree, `package.json`, current worker protocol, simulation state, renderer, tests, and git diff.
3. Confirm the existing test-particle simulation works.
4. Run the current test suite, type check, and production build serially.
5. Locate current world dimensions, fixed timestep, speed multipliers, snapshot rate, coordinate units, and RNG representation.
6. Write a short baseline note in the plan's execution log or agent work log.
7. Identify which existing modules can be extended rather than duplicated.

**Exit criteria:**
- Current baseline status is recorded.
- Existing behavior is understood.
- No unnecessary scaffold rebuild is planned.
- Any blocking baseline regression is identified and scoped.

### Block 1 — Domain model and simulation configuration (2 hours)

**Objective:** Define the real creature/world/resource data contract and document all initial formulas.

Tasks:
1. Replace or evolve the prototype test-entity type into the actual runtime creature model.
2. Define `Genome`, active trait fields, lineage metadata, energy state, age, and cooldown fields.
3. Define the food-resource type and starter-habitat terrain representation.
4. Create a typed, centralized `SimulationConfig`.
5. Define units for world coordinates, speed, time, food amount, energy, and all rates.
6. Define bounds and defaults for traits, neural weights, food, energy, and population.
7. Add validation at the simulation-construction boundary. Prefer simple explicit validation for internal config; use an existing validation dependency only if already installed and justified.
8. Ensure the simulation core remains free of React, PixiJS, and DOM imports.

**Exit criteria:**
- Types compile under strict TypeScript.
- Every numeric simulation setting has a name, unit, and valid range.
- Runtime state and inherited genome data are separate.
- Existing tests still pass or are updated with behavior-preserving changes.

### Block 2 — Neural-network implementation and genome initialization (2 hours)

**Objective:** Make every founder creature own a valid, reproducible 8–12–4 network.

Tasks:
1. Implement fixed network type and storage layout.
2. Implement deterministic weight/bias initialization using the existing seeded RNG.
3. Implement forward inference with the defined activation functions.
4. Define the typed input and output contracts.
5. Implement trait initialization and valid genome creation.
6. Add genome cloning with deep copies of all arrays.
7. Add strict shape/finite-value validation.
8. Add the neural-network and genome tests in section 4.4.
9. Confirm same seed creates identical initial genomes.

**Exit criteria:**
- A founder can be initialized with valid traits and a working network.
- Forward inference is deterministic and finite.
- No ML framework is introduced.
- The tests cover activation, shape, determinism, and immutability.

### Block 3 — Starter habitat, food generation, and spatial perception (2 hours)

**Objective:** Give creatures a real local environment to sense.

Tasks:
1. Implement the deterministic starter grassland grid.
2. Place impassable rock patches using the seeded RNG or a deterministic placement recipe.
3. Place finite food patches only on passable cells.
4. Implement bounded food regeneration.
5. Inspect and reuse the existing spatial grid, or add a tested index.
6. Implement nearest-food query, stable tie-breaking, local food density, nearby creature density, and boundary pressure.
7. Normalize and clamp the eight neural inputs exactly as documented.
8. Add tests for terrain validity, food placement, regeneration, spatial queries, and perception.
9. Verify a creature with no nearby food receives neutral food-direction/proximity inputs.

**Exit criteria:**
- Same seed creates the same starter habitat and food placement.
- Food never spawns on impassable terrain.
- Spatial queries return correct, deterministic results.
- Perception values respect the documented ranges.

### Block 4 — Day 1 integration checkpoint (1 hour)

**Objective:** Prove the domain/network/perception components work together before movement/economy.

Tasks:
1. Create one deterministic test simulation with a founder and a nearby food patch.
2. Calculate and record the creature's perception inputs.
3. Run one neural forward pass.
4. Verify outputs are finite and within contract.
5. Add a small debug/test helper that can use a baseline greedy-food-seeking policy without changing the default neural controller.
6. Inspect the day's diff and remove duplicated types or placeholder files.
7. Run tests, type check, and build.

**Day 1 checkpoint:**
- The simulation can create founders, habitat, and food.
- A creature can perceive its local surroundings and evaluate its network.
- No visual feature is required yet.
- If this checkpoint fails, do not proceed to UI polish. Fix the pure simulation foundation first.

---

## Day 2 — Movement, survival, worker integration, and visualization (8 hours)

### Block 5 — Movement, terrain constraints, and action resolution (2 hours)

**Objective:** Convert neural outputs into valid physical behavior.

Tasks:
1. Map `moveX` and `moveY` to a desired direction.
2. Normalize direction magnitude and cap speed by the inherited speed trait.
3. Calculate intended displacement using the existing fixed timestep.
4. Resolve world boundaries and rock collision.
5. Charge movement energy from actual accepted displacement, not requested displacement.
6. Implement eat-action thresholding and reach checks.
7. Resolve competing eat requests in stable creature-ID order.
8. Ensure resource amount never becomes negative.
9. Test blocked movement, zero movement, normalized movement, and deterministic resource contention.
10. Keep entity-entity physical collision out of scope unless already implemented and required for correctness.

**Exit criteria:**
- Neural output changes creature motion.
- Creatures cannot traverse impassable terrain.
- Eat attempts can succeed or fail for explicit reasons.
- Resource contention is deterministic and cannot over-consume food.

### Block 6 — Energy, regeneration, lifecycle, and death (2 hours)

**Objective:** Make survival depend on measurable energy rules.

Tasks:
1. Implement basal energy drain.
2. Implement movement cost based on actual displacement.
3. Implement energy gain from consumed food.
4. Clamp energy at its legal maximum.
5. Advance creature age and cooldown state consistently.
6. Implement death at the defined energy threshold.
7. Increment death/population counters exactly once.
8. Remove dead creatures from active indexes and render data.
9. Verify dead creatures cannot move, eat, or reproduce.
10. Tune the initial coefficients with small seeded experiments so the loop is neither instantly lethal nor indefinitely immortal.
11. Record the final formula coefficients and rationale.

**Exit criteria:**
- A no-food creature eventually dies under positive maintenance cost.
- Eating increases energy when below maximum.
- Movement has an explicit measurable cost.
- Food regeneration remains bounded.
- Death occurs exactly once.

### Block 7 — Worker protocol and end-to-end simulation integration (2 hours)

**Objective:** Put the real ecosystem inside the existing worker without changing ownership.

Tasks:
1. Initialize a real simulation from the worker's existing `INIT` command.
2. Replace test-particle data in snapshots with compact creature and food render data.
3. Preserve existing start/pause/reset/speed scheduling.
4. Send summary statistics at a lower cadence than render snapshots.
5. Add on-demand `INSPECT_CREATURE` request and a typed inspection response.
6. Handle missing/dead creature IDs safely.
7. Ensure reset recreates the same world and founder genomes for the same seed.
8. Keep neural genome arrays out of periodic render snapshots.
9. Add protocol tests or worker-handler tests using the project's existing test approach.
10. Test start, pause, reset, speed, stale snapshot rejection, and cleanup after the domain model changes.

**Exit criteria:**
- Worker remains the sole authoritative owner.
- The UI receives real creature and food positions.
- Stats and inspection data come through typed messages.
- No duplicate simulation loops or per-creature message traffic is introduced.

### Block 8 — PixiJS food/creature layers and basic status UI (2 hours)

**Objective:** Make the new behavior understandable to a user.

Tasks:
1. Add the terrain rock layer.
2. Add a food layer whose visuals reflect normalized remaining amount.
3. Reuse/update creature display objects as IDs appear and disappear.
4. Make selected creatures visually distinct.
5. Add creature hit-testing and return the stable creature ID.
6. Connect selection to the worker inspection request.
7. Add compact population, birth, death, energy, food, tick, and run-state summaries.
8. Add the first compact creature inspector layout.
9. Ensure the camera and controls still work at different viewport sizes.
10. Add loading, no-selection, selected-creature-dead, and worker-error states.

**Day 2 checkpoint:**
- The browser visibly shows creatures behaving under the real simulation.
- Food is depleted/regenerated and energy changes.
- A creature can be selected and its live state retrieved.
- Start/pause/reset/speed and pan/zoom remain functional.
- If the simulation core is not stable, limit UI changes to the smallest rendering needed to prove it.

---

## Day 3 — Reproduction, inspection, integration testing, and hardening (8 hours)

### Block 9 — Reproduction, mutation, and lineage (2 hours)

**Objective:** Complete the first actual hereditary loop.

Tasks:
1. Implement reproduction eligibility using age, cooldown, energy, neural output, valid position, and population cap.
2. Implement deterministic nearby offspring placement.
3. Implement energy transfer from parent to child with no free-energy creation.
4. Implement deep-copy genome inheritance.
5. Mutate traits and neural weights/biases through the seeded RNG.
6. Clamp all mutated values.
7. Assign stable IDs, parent IDs, lineage root IDs, and generation numbers.
8. Prevent newborns from acting in the same tick.
9. Ensure parent cannot reproduce repeatedly without cooldown/energy recovery.
10. Add all reproduction/mutation tests from section 8.6.

**Exit criteria:**
- At least one deterministic test scenario produces a valid offspring.
- Offspring inherits and mutates without modifying its parent.
- Parent/child energy accounting is exact.
- Population cap and placement constraints are honored.
- Birth count and lineage metadata are correct.

### Block 10 — Inspector, statistics, and behavior transparency (1.5 hours)

**Objective:** Show what the simulation actually computed.

Tasks:
1. Finish the selected-creature inspector.
2. Display traits, energy, age, generation, parent, lineage root, and cooldown.
3. Display all eight actual latest input values and four actual outputs.
4. Display a compact view of the network's topology and weight/bias summary.
5. Show population, births, deaths, average energy, and available food.
6. Ensure inspected data is refreshed only when requested or at a modest cadence.
7. Verify selecting a different creature cannot display a late response for the previous selection.
8. Ensure inspector states are correct when the selected creature dies or the simulation resets.

**Exit criteria:**
- Inspector values correspond to the selected creature and most recent forward pass.
- No decorative/fabricated neural-network values are displayed.
- UI remains responsive while the simulation runs.

### Block 11 — End-to-end deterministic scenarios (1.5 hours)

**Objective:** Test whole behavior chains, not just individual helper functions.

Create deterministic integration fixtures for:

**Scenario A — Food seeking**
- A creature has a known network or controlled test policy that outputs movement toward a nearby food target.
- It moves closer to the food under an unobstructed map.
- It reaches consumption range and can eat when the action threshold is met.

**Scenario B — Energy survival**
- A creature without food loses energy over fixed steps.
- A creature that consumes food gains energy.
- A depleted creature dies once and disappears from active state.

**Scenario C — Reproduction**
- A sufficiently old, well-fed creature with a reproduction action can create an offspring.
- The child inherits and mutates within bounds.
- Population and birth count increase correctly.
- Parent energy decreases by the transfer amount.

**Scenario D — Deterministic replay**
- Run the same seed, configuration, and exact step count twice.
- Compare a stable serialized summary of terrain, resources, live creature state, genome data, RNG state, tick, births, and deaths.
- The results must be equal.

**Scenario E — Long-run invariants**
- Run a bounded simulation for many fixed steps.
- Assert all numeric state is finite.
- Assert energy/resource/trait/weight bounds.
- Assert live IDs are unique.
- Assert no creature occupies blocked terrain.
- Assert population never exceeds its cap.

Never assert a particular average fitness, trait dominance, or evolutionary outcome in a stochastic scenario.

### Block 12 — Performance, bug fixing, and browser verification (1.5 hours)

**Objective:** Ensure the feature is usable and stable within the constrained development setup.

Tasks:
1. Run pure simulation benchmarks for 100, 250, and 500 creatures; 1,000 is a stretch measurement if it is cheap.
2. Record simulation steps/second separately from PixiJS FPS.
3. Record snapshot cadence and any obvious serialization spikes.
4. Check that dead entities, display objects, and history do not accumulate without bounds.
5. Confirm spatial queries are used for nearby food/creature perception.
6. Fix only measured bottlenecks or correctness problems.
7. Test the browser flow: load, initialize, start, pause, speed, reset, pan, zoom, select, inspect, and resize.
8. If the target browser is unavailable in the remote environment, clearly mark manual visual verification as not performed.

Do not spend this block introducing typed-array snapshots, WebAssembly, GPU compute, or extra workers without measured evidence.

### Block 13 — Documentation, final verification, and handoff (1.5 hours)

**Objective:** Leave a stable, understandable next milestone.

Tasks:
1. Update README with the real current feature set and commands.
2. Update the project status to reflect Phase 3 and the implemented Phase 4 subset only.
3. Update `AGENTS.md` roadmap/changelog only if its maintenance rules require it; do not rewrite standing rules.
4. Do not edit the product vision or tech-stack specification simply to make the project appear more complete.
5. Inspect `git diff --check`, `git status --short`, and the full diff.
6. Run tests, type checking, and production build serially after the final code change.
7. Remove dead code, abandoned placeholders, and unused packages created during this plan.
8. Provide the handoff report using section 19.

**Final 24-hour checkpoint:**
- The simulation is a functioning, deterministic creature/food/survival/reproduction prototype.
- Core simulation tests pass.
- Browser integration is verified where a browser is available.
- The repository remains buildable and accurately documented.

---

# 13. Testing matrix

Tests must be deterministic and focus on observable contracts/invariants.

| Area | Required test |
|---|---|
| RNG | Same seed/state yields same sequence |
| Genome | Initialization is valid; clone is deep; shapes and values validate |
| Neural network | Known forward pass; stable outputs; finite values; correct ranges |
| Trait mutation | Deterministic, bounded, parent genome unchanged |
| Network mutation | Deterministic, bounded, fixed topology retained |
| Terrain | Seed reproducibility; valid dimensions; passable/blocked lookup |
| Food generation | Seed reproducibility; resources only on valid cells |
| Food regeneration | Increases amount and never exceeds capacity |
| Spatial grid | Insert, update, remove, query, no duplicates, stable ordering |
| Perception | Food direction/distance/density and neighbor density normalized correctly |
| Movement | Speed cap, zero vector, timestep, obstacle collision, boundary constraints |
| Eating | Reach threshold, resource depletion, deterministic contention |
| Energy | Basal cost, movement cost, food gain, maximum clamp |
| Death | Exactly once; removes creature from active indexes and render list |
| Reproduction | Eligibility, energy transfer, child placement, cap, cooldown |
| Inheritance | Parent/child arrays do not alias; lineage metadata correct |
| Worker | Commands, stats, inspection, stale snapshots, error handling |
| Rendering | Resource/creature add-update-remove, selection, resize, cleanup |
| Replay | Same seed/config/step count produces same stable serialized state |
| Long run | No NaN/Infinity, invalid terrain occupancy, duplicate IDs, unbounded population |

Avoid flaky tests that assert wall-clock scheduling with arbitrary sleeps. Test pure stepping directly; keep worker scheduling tests small and controllable.

---

# 14. Operational constraints for 1 vCPU / 2 GB RAM

The remote machine is for coding, tests, and static builds. The browser visitor runs the simulation.

Required operating discipline:
- One agent process per working tree.
- One npm install/build/test operation at a time.
- Use `npm ci` if a lockfile exists.
- Do not run Docker or databases.
- Do not run watch-mode tests during final verification.
- Do not download browser automation runtimes unless already installed and required.
- Keep browser tests limited; prefer Vitest for the simulation core.
- Do not perform concurrent builds.
- Do not run an unbounded long-run simulation in the same process as the production build.
- Keep the package graph lean.
- Stop runaway or duplicate processes before retrying a build.

For performance results, distinguish the remote 1-vCPU build machine from a user's browser device. Do not claim that all users can run 500 or 1,000 creatures based on one remote test.

---

# 15. Definition of done

## P0 — Required core simulation

- [ ] Previous app shell and worker foundation preserved.
- [ ] Real creature runtime model and genome exist.
- [ ] Fixed 8–12–4 neural network is implemented and tested.
- [ ] All eight neural inputs have documented meanings, ranges, and normalization.
- [ ] Neural outputs drive movement/eat/reproduce tendencies.
- [ ] Seeded starter habitat has passable and impassable areas.
- [ ] Food resources are finite and regenerate to a cap.
- [ ] Spatial grid supports nearby queries without routine all-pairs scans.
- [ ] Movement obeys speed, boundary, and terrain limits.
- [ ] Food consumption is deterministic and cannot exceed availability.
- [ ] Energy gain and costs are explicit and tested.
- [ ] Starvation/death works and updates counters exactly once.
- [ ] Worker remains the sole authoritative simulation owner.
- [ ] Main-thread snapshots are batched and compact.
- [ ] Tests, type check, and build pass.

## P1 — Required hereditary loop for this plan

- [ ] Asexual reproduction eligibility is implemented.
- [ ] Child placement respects world and terrain.
- [ ] Parent-to-child energy transfer is exact.
- [ ] Genome inheritance is a deep copy.
- [ ] Mutation is seeded, bounded, and non-directional.
- [ ] Parent/lineage/generation metadata is valid.
- [ ] Newborns do not act in their birth tick.
- [ ] Births and deaths appear in the summary.

## P2 — User-visible usability

- [ ] Food and rock patches are visible.
- [ ] Creatures are visibly updated/reused by stable ID.
- [ ] Creature selection works.
- [ ] Inspector shows real inputs, outputs, traits, and energy.
- [ ] Summary shows population, births, deaths, and food/energy.
- [ ] Existing controls, pan, zoom, and resize still work.
- [ ] README and handoff explain actual behavior and limitations.

A P2 visual flourish must never take priority over P0 simulation correctness or P1 inheritance correctness.

---

# 16. Risk register and mitigation

| Risk | Symptom | Mitigation |
|---|---|---|
| Existing foundation is incomplete | Worker or renderer does not pass baseline checks | Fix only the blocker within the first hour; report larger missing work rather than silently rebuilding |
| Neural network does not produce useful movement | Creatures wander or remain still | Inspect normalized input/output values; use deterministic hand-authored weights and a test-only baseline controller |
| Creatures starve too quickly | Population immediately collapses | Check units, dt, movement cost, food gain, and resource density; tune documented coefficients, not hidden bonuses |
| Creatures never die | Energy gains exceed costs indefinitely | Test no-food scenario, verify basal cost is applied each fixed step |
| Food is exhausted unfairly | First creature consumes everything | Use stable contention order; tune density/regeneration transparently |
| Terrain traps creatures | Organisms remain against rocks | Verify movement vector projection/reflection and valid spawn positions; do not add unbounded pathfinding |
| Mutation creates invalid genomes | NaN or out-of-range genes | Clamp every mutated scalar and validate genome shape at creation/offspring |
| Reproduction causes runaway population | Birth rate exceeds food/space | Enforce energy threshold, cooldown, population cap, and exact energy transfer |
| Determinism breaks | Same seed yields different state | Audit iteration order, tie-breaking, RNG ownership, and update stages |
| Worker protocol grows too complex | Duplicated message handlers or stale selection details | Keep one shared discriminated union and one authoritative handler path |
| Rendering cost increases sharply | Sprite churn or UI jank | Reuse Pixi objects and inspect performance before optimizing transport |
| 24-hour scope overflows | UI polish consumes implementation time | Follow section 17 and defer optional UI/debug features before simulation correctness |
| Low-memory build fails | OOM or swapping | Run tasks serially, avoid concurrent processes, retry after cleanup; do not install infrastructure |

---

# 17. Priority order if time runs short

Do not try to finish every bullet by lowering quality.

### Priority A — complete before anything else
1. Verify previous baseline.
2. Creature/genome contract.
3. Neural network and tests.
4. Food/terrain/perception and spatial queries.
5. Movement, consumption, energy, and death.
6. Worker integration with compact snapshots.

### Priority B — finish the evolutionary vertical slice
7. Reproduction eligibility and offspring placement.
8. Deep-copy inheritance and bounded mutation.
9. Birth/death/population counters.
10. Deterministic replay and long-run invariants.

### Priority C — user-facing inspection
11. Food and terrain visuals.
12. Creature selection and real inspector.
13. Additional debug overlays and visual polish.

### Priority D — defer
14. Extended analytics, charts, animations, multiple habitat types, save/load, seasons, hydration, predators, advanced lineage views.

If time is critically short, ship a verified food/energy/death loop and report reproduction as incomplete. Do not create fake children, hardcode apparent evolution, or claim mutation works without tests.

---

# 18. Explicit non-goals and anti-patterns

The coding agent must not:

- Turn the simulation into a scripted demonstration where creatures always walk directly to the nearest food regardless of network output.
- Add hidden steering corrections that override neural outputs without documenting them as physical constraints.
- Add a fitness score that directly rewards eating/reproduction; population changes must emerge from the specified rules.
- Give creatures global knowledge of all resources.
- Let food regenerate beyond capacity or become available through accidental reset bugs.
- Let food be consumed multiple times beyond its remaining amount.
- Apply mutation directly to the parent genome.
- Allow a newborn to act in its birth tick.
- Reuse entity IDs after death.
- Put full per-creature data in React state.
- Send all network weights in every render snapshot.
- Use `Math.random()` in simulation modules.
- Use array iteration order as an undocumented tie-breaker.
- Create abstractions for future biomes, predators, hydrology, save files, or species before they are needed.
- Add a dependency for a feature that can be implemented safely with the existing stack.
- Weaken TypeScript strictness, remove tests, or skip a failing test to achieve green checks.
- Mark a roadmap phase complete unless its exit criteria are genuinely met.

---

# 19. Required end-of-plan handoff report

The coding agent must finish with a concise, factual report containing:

## 19.1 Summary
- What the simulation can now do.
- Which roadmap phase(s) are complete or partially complete.
- Whether the neural network actually drives movement/actions.

## 19.2 Implemented systems
- Creature/runtime model.
- Genome and traits.
- Neural topology and input/output semantics.
- Starter habitat and food resources.
- Spatial indexing/perception.
- Movement and terrain constraints.
- Energy and death.
- Reproduction and mutation.
- Worker/UI/inspector integration.

Mark each as **complete**, **partial**, or **not implemented**.

## 19.3 Verification table

| Command/test | Actual result | Notes |
|---|---|---|
| `npm ci` (when applicable) | | |
| Unit tests | | |
| Type check | | |
| Production build | | |
| Browser/manual flow | | |
| Deterministic replay | | |
| Long-run invariants | | |
| Benchmarks | | |

Include the exact commands and actual exit statuses. Do not say “all tests pass” unless all relevant tests were actually run.

## 19.4 Performance note
- Population sizes tested.
- Simulation steps/second where measured.
- Browser FPS where measured.
- Snapshot cadence.
- Machine/browser details.
- Explicit distinction between measured values and estimates.

## 19.5 Known limitations
List bugs, missing mechanics, simplified rules, and unverified behavior. Explicitly mention that full procedural biomes, hydration, temperature, seasons, predation, persistence, and advanced evolution remain out of scope unless they were separately completed.

## 19.6 Files changed
List important new/modified files and explain why.

## 19.7 Recommended next milestone
Recommend the next highest-value phase based on actual implementation state. Likely candidates are procedural terrain/biome mechanics or sandbox persistence/inspection, but decide from the code and remaining gaps rather than assuming.

---

# 20. Final instruction to the agent

Build one coherent, observable artificial-life loop.

By the end of this plan, a creature should not merely be a moving dot. It should have an inherited genome, calculate real neural outputs from local inputs, move within physical constraints, consume finite food, pay energy costs, survive or die, and sometimes reproduce with bounded inherited mutation.

The application should make that behavior inspectable and repeatable. Prefer a small, correct ecosystem over a broad collection of incomplete features.

**Do not exceed 24 hours of focused agent work. Preserve a runnable repository at every checkpoint.**
