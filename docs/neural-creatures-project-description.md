# Neural Creatures --- Project Description

> **A procedural artificial-life sandbox where neural-network-driven
> organisms inhabit a changing world, compete for resources, reproduce,
> mutate, and evolve.**

## 1. Project Overview

**Neural Creatures** is a 2D artificial-life and evolution simulation.
The user creates or generates a world containing multiple biomes,
environmental resources, and populations of digital organisms. Each
organism has inherited physical traits and a small neural network that
controls its behavior.

Creatures perceive nearby elements of their environment, make decisions
through their neural networks, and act within the simulation. They must
find resources, manage energy, avoid hazards, compete with other
organisms, and reproduce when conditions allow. Offspring inherit traits
and neural-network parameters from their parent or parents, with
mutations introducing variation.

The world is not a static arena. It is procedurally generated and
contains varied terrain such as grasslands, forests, rivers, lakes,
mountains, deserts, and tundra. Terrain and climate affect movement,
resource availability, and survival. Over many simulated generations,
environmental pressures can cause populations to adapt, migrate,
diverge, or become extinct.

The project's central question is:

**Can relatively simple neural networks and evolutionary rules produce
behavior that looks intelligent, adaptive, or purposeful without
explicitly programming those behaviors?**

The application is intended to be an interactive visual sandbox rather
than a conventional game with a fixed win condition. Users observe the
ecosystem, adjust simulation parameters, inspect individual creatures
and their neural networks, and investigate how populations change over
time.

## 2. Goals and Design Principles

### 2.1 Primary goals

1.  **Emergent behavior:** Allow interesting behavior to arise from
    perception, neural-network decisions, physical constraints, and
    evolutionary pressure.
2.  **Visible evolution:** Make inheritance, mutation, adaptation,
    population changes, and extinction observable.
3.  **Meaningful environments:** Make terrain and climate affect
    organisms mechanically, not merely visually.
4.  **Inspectable simulation:** Allow users to inspect creatures,
    traits, neural-network activity, lineages, and population
    statistics.
5.  **Experimentation:** Provide controls for world generation,
    simulation speed, environmental conditions, and evolutionary
    parameters.
6.  **Local-first experience:** Run the simulation in the browser
    without requiring a backend for the core experience.
7.  **Reproducibility:** Support seeded world generation and
    deterministic or repeatable simulation runs where practical.

### 2.2 Design principles

-   Keep simulation rules separate from rendering and UI code.
-   Prefer understandable, testable simulation mechanics over premature
    complexity.
-   Use simple models first; introduce more advanced mechanics only when
    they improve observable outcomes.
-   Make randomness controllable through seeds.
-   Keep the simulation useful even when no user interaction occurs.
-   Present scientific-style statistics without implying that the
    simulation is a biologically accurate model of real evolution.

## 3. Core Experience

A typical user session should work as follows:

1.  The user creates a new world or loads a saved one.
2.  The world generator creates terrain, biomes, water systems, and
    resource distribution.
3.  Initial populations are spawned with varied genomes and
    neural-network weights.
4.  The simulation begins. Creatures perceive their surroundings and act
    according to their neural networks.
5.  Creatures consume resources, spend energy, interact, reproduce, and
    die according to the simulation rules.
6.  Offspring inherit genetic information and receive mutations.
7.  The user observes changes in populations, species, traits, and
    geographic distribution.
8.  The user can pause, inspect, adjust settings, save the world, or
    export interesting genomes and lineages.

There is no requirement that a particular species survives or that the
ecosystem reaches a stable state. Collapse, extinction, population
booms, and unexpected adaptations are valid simulation outcomes.

## 4. World and Terrain System

### 4.1 World representation

The world is a two-dimensional, top-down environment. Terrain is stored
as a grid of cells or tiles, while creatures move using continuous world
coordinates.

A terrain cell should contain, at minimum:

-   Terrain or biome type.
-   Elevation.
-   Temperature.
-   Moisture.
-   Resource or vegetation level.
-   Movement cost or passability.
-   Water-related properties where applicable.

A grid-based world makes terrain generation, biome assignment, resource
distribution, and spatial queries easier. Continuous creature
coordinates allow movement to look smooth rather than tile-based.

The initial target world size can be configurable. A moderate default
such as 256 × 256 cells is suitable for early development, but actual
performance should be measured before fixing limits.

### 4.2 Initial biomes

The first version should include six major biome types.

  -----------------------------------------------------------------------
  Biome                   Typical characteristics Example effects
  ----------------------- ----------------------- -----------------------
  Grassland               Open, temperate, grassy Low movement cost;
                                                  relatively abundant
                                                  plant food

  Forest                  Dense vegetation and    Reduced visibility or
                          obstacles               movement; fruits and
                                                  plants; cover

  River and lake          Freshwater channels and Water access; crossing
                          bodies                  restrictions; aquatic
                                                  resources

  Mountain                High elevation and      Increased movement
                          steep terrain           cost; sparse resources;
                                                  difficult routes

  Desert                  Hot and dry             Limited water and
                                                  vegetation; increased
                                                  dehydration pressure

  Tundra                  Cold and sparsely       Low food availability;
                          vegetated               cold-resistance
                                                  pressure
  -----------------------------------------------------------------------

Rivers and lakes may be represented as terrain features that overlay or
modify the biome underneath. This is useful because a river can pass
through grassland, forest, or desert.

### 4.3 Terrain must have mechanical consequences

Terrain should influence the simulation through explicit properties
rather than hard-coded visual rules scattered throughout the code.

Examples:

-   Movement cost determines how much energy is spent traversing a cell.
-   Passability determines whether a creature can enter a cell.
-   Water availability affects hydration.
-   Vegetation density influences plant-resource regeneration.
-   Temperature affects energy or hydration costs for organisms without
    suitable adaptations.
-   Cover can affect how easily organisms detect one another.
-   Elevation and slope can influence movement difficulty.

Not every trait needs to affect every biome. The initial model should
use a small, documented set of rules that can be tuned.

### 4.4 Procedural world generation

World generation should use a reproducible seed and a sequence of
stages:

1.  Generate an elevation field using coherent noise.
2.  Generate temperature and moisture fields.
3.  Derive broad climate zones from temperature and moisture.
4.  Assign biome types using climate and elevation.
5.  Generate rivers and lakes using elevation and drainage rules.
6.  Apply terrain overlays such as beaches, riverbanks, and mountain
    slopes.
7.  Distribute resources based on biome suitability.
8.  Validate that the world has usable land, water, and sufficient
    habitat diversity.
9.  Spawn initial creatures in suitable locations.

The generator should expose parameters such as world dimensions, seed,
mountain frequency, moisture, temperature variation, river count, and
resource abundance.

### 4.5 Rivers and water systems

Rivers should generally follow downhill drainage paths from higher
elevations toward lower terrain. The first implementation can use a
simplified flow-direction or downhill-neighbor algorithm. More advanced
hydrology is optional.

Water features should support:

-   Water access for organisms.
-   Movement restrictions for organisms that cannot swim.
-   Swimming costs for organisms that can cross.
-   Aquatic or riverbank resources where configured.
-   Lakes and connected river networks.

Avoid making all water universally impassable. Swimming ability should
be a meaningful inherited trait, and water should create interesting
geographic barriers and opportunities.

## 5. Creatures and Genetics

### 5.1 Creature model

Each creature is an individual entity with:

-   A unique ID.
-   Position and movement state.
-   Current energy and, if enabled, hydration.
-   Age and lifespan state.
-   Health or damage state if combat or hazards are enabled.
-   A genome containing inherited traits and neural-network parameters.
-   A species or lineage reference.
-   Current neural-network inputs and outputs for inspection.
-   A lifecycle state such as alive, dead, or reproducing.

The creature model should distinguish inherited properties from
temporary state. For example, maximum speed may be inherited, while
current energy is an individual runtime value.

### 5.2 Initial inherited traits

Start with a manageable set of continuous or discrete traits:

  -----------------------------------------------------------------------
  Trait                   Meaning                 Potential trade-off
  ----------------------- ----------------------- -----------------------
  Maximum speed           Movement capability     Higher movement energy
                                                  cost

  Body size               Organism size           Higher maintenance
                                                  energy requirement

  Vision range            Perception distance     Potentially greater
                                                  processing or sensory
                                                  cost

  Swimming ability        Ability to cross water  May carry an energy or
                                                  body-design cost

  Climbing ability        Ability to traverse     May trade off against
                          steep terrain           speed or energy

  Heat tolerance          Ability to tolerate hot Can affect performance
                          conditions              in other climates

  Cold tolerance          Ability to tolerate     Can have a maintenance
                          cold conditions         cost

  Water efficiency        Rate of hydration loss  May have a trade-off
                                                  with another trait

  Camouflage              Reduced detectability   May affect visibility
                                                  or another trait
  -----------------------------------------------------------------------

Traits should have defined minimums, maximums, units, and effects. Avoid
adding traits that do not influence any simulation rule.

### 5.3 Genome and inheritance

A genome stores the inheritable information required to construct a new
creature. It should include:

-   Physical and physiological trait values.
-   Neural-network topology identifier or configuration.
-   Neural-network weights and biases.
-   Optional color or appearance genes.
-   Optional lineage metadata.

For the initial version, use a fixed neural-network topology so
offspring can inherit compatible weight arrays. Later versions may
explore topology mutation, but it should not be required for the MVP.

Reproduction can initially be asexual. An offspring receives a copy of
its parent's genome followed by mutation. Sexual reproduction and genome
crossover can be added later.

### 5.4 Mutation

Mutation should introduce small changes to inherited values.

Possible operations:

-   Add a small random perturbation to a numeric trait.
-   Perturb selected neural-network weights or biases.
-   Occasionally make a larger mutation.
-   Clamp values to valid ranges.
-   Optionally mutate a small number of appearance genes.

Expose mutation rate and mutation strength as simulation settings. Use a
seeded random-number generator so experiments can be repeated.

Mutation should not automatically make an organism better. It creates
variation; survival and reproduction determine which variations become
more common.

## 6. Neural Network and Behavior

### 6.1 Purpose

Each creature has a small neural network that maps environmental
observations to actions. The network is evaluated during simulation and
its weights are inherited and mutated.

The initial network should be a compact feed-forward multilayer
perceptron implemented directly in TypeScript. A small custom
implementation is easier to inspect, test, serialize, and evolve than a
large machine-learning framework.

Suggested initial topology:

**8 input values → 12 hidden neurons → 4 output values**

The topology is a starting point, not a fixed scientific requirement. It
can be adjusted after the first working simulation.

### 6.2 Inputs

Initial input signals may include:

1.  Food direction or food-gradient signal.
2.  Food distance or food availability.
3.  Obstacle or terrain difficulty in the intended direction.
4.  Nearby creature signal.
5.  Current energy level.
6.  Current hydration level, if hydration is enabled.
7.  Temperature stress.
8.  Water or safe-habitat direction.

Inputs should be normalized to predictable numeric ranges. The exact
sensing model should be documented and consistent.

A creature should not receive global information that it could not
plausibly sense unless the simulation explicitly defines it as an
environmental signal.

### 6.3 Outputs

Initial outputs may include:

-   Desired horizontal movement.
-   Desired vertical movement.
-   Eat or interact tendency.
-   Reproduction tendency.

The simulation engine interprets these outputs and applies constraints.
For example, a movement output does not allow a creature to pass through
an impassable mountain or cross deep water without sufficient swimming
ability.

### 6.4 Neural-network visualization

The creature inspector should display:

-   Input nodes and their current values.
-   Hidden and output nodes.
-   Connection weights, with visual distinction for positive and
    negative weights.
-   Current activation intensity.
-   Current network outputs.

The visualization is an explanatory tool. It should show the actual
network used by the selected creature rather than a decorative or
unrelated diagram.

### 6.5 No gradient-based training in the initial version

The initial project should use evolutionary optimization rather than
backpropagation or reinforcement-learning training. Creatures are not
explicitly taught a task. Their neural-network parameters are inherited
and mutated, and reproductive success changes the population
distribution over generations.

## 7. Ecosystem Mechanics

### 7.1 Resources and food

The world should contain regenerating resources. Initially, focus on
plant-like food resources.

Resource rules should define:

-   Which biomes support each resource.
-   Maximum resource capacity per cell.
-   Regeneration rate.
-   Consumption amount.
-   Energy gained by consuming the resource.
-   Seasonal or climate modifiers, if enabled.

Resources should be spatially distributed and finite at a given moment.
This creates competition and makes movement and resource discovery
meaningful.

### 7.2 Energy and survival

Energy is the primary survival resource.

Creatures gain energy by consuming food and lose energy through:

-   Basal maintenance.
-   Movement.
-   Swimming or climbing.
-   Temperature stress.
-   Other explicitly implemented actions.

When energy reaches the configured death threshold, the creature dies.
The model should avoid hidden or arbitrary survival bonuses.

### 7.3 Hydration and temperature

Hydration and temperature stress can be introduced after the basic
energy loop works.

Hydration may decrease over time and increase when a creature accesses
water. Water-efficiency traits influence hydration loss.

Temperature stress depends on local climate and creature tolerance. It
may increase energy or hydration costs, or reduce performance beyond
tolerance limits.

Keep the first implementation simple and ensure that every environmental
pressure has a clear, testable formula.

### 7.4 Reproduction

For the MVP, use asexual reproduction.

A creature may reproduce when:

-   It has reached a minimum age, if age gating is enabled.
-   It has enough energy to pay the reproduction cost.
-   There is enough local space for an offspring.
-   Population limits have not been exceeded.

Reproduction transfers some energy to the offspring or applies a defined
energy cost. Offspring inherit the parent's genome with mutation.

### 7.5 Predation and defense

Predator-prey interactions are an advanced ecosystem feature, not a
prerequisite for the first working version.

When introduced, predation should include:

-   A defined attack or hunting action.
-   Detection and pursuit constraints.
-   Energy costs and success conditions.
-   A prey vulnerability or defense model.
-   Reproduction and population consequences.

Avoid introducing arbitrary combat behavior. Predation should be driven
by creature traits, perception, neural outputs, and clear simulation
rules.

### 7.6 Migration

Creatures should be able to move between biomes when their neural
networks and environmental conditions lead them to do so.

Migration can emerge from local perception and resource gradients.
Later, the UI can identify migration patterns by tracking population
density and lineage distribution across the map.

## 8. Evolution, Species, and Lineages

### 8.1 Evolutionary loop

The core evolutionary cycle is:

1.  Creatures perceive local conditions.
2.  Their neural networks produce actions.
3.  The simulation applies movement, interactions, and resource
    consumption.
4.  Energy, hydration, age, and environmental conditions are updated.
5.  Creatures that meet reproduction conditions produce offspring.
6.  Offspring inherit and mutate genomes.
7.  Death and reproduction change population composition.
8.  The cycle repeats.

The simulation should not assign a hidden fitness score that directly
tells creatures what to do. Reproductive success should emerge from the
survival and reproduction rules.

### 8.2 Generations

Because organisms may reproduce at different times, the simulation
should not require all creatures to reproduce in synchronized
generations. Track individual age and ancestry. A generation number can
be represented as lineage depth or another clearly documented measure.

### 8.3 Species identification

Species classification is a visualization and analysis feature. It
should be based on explicit genetic similarity rules, not merely on
appearance color.

A first version may group creatures by genome distance using selected
inherited traits and neural-network parameters. The threshold and
distance calculation should be configurable or documented.

Species tracking should support:

-   Species population.
-   Average and range of important traits.
-   Geographic distribution.
-   First observed and last observed simulation time.
-   Parent or ancestor lineage where available.
-   Extinction status.

Do not imply that a simple genetic-distance threshold perfectly models
biological speciation.

### 8.4 Evolutionary analytics

Track useful metrics over simulation time:

-   Total population.
-   Population by species.
-   Birth and death counts.
-   Extinction events.
-   Average lifespan.
-   Average energy.
-   Average trait values and distributions.
-   Genetic diversity.
-   Resource availability.
-   Biome occupancy.
-   Population density by region.

The dashboard should make it possible to compare different world seeds
and simulation settings.

## 9. Environmental Dynamics

### 9.1 Seasons

A seasonal system can periodically change temperature, resource
regeneration, and environmental conditions.

Possible seasons:

-   Spring: increased plant growth.
-   Summer: warmer conditions and potential water stress.
-   Autumn: changing temperatures and resource decline.
-   Winter: colder conditions and reduced vegetation.

Seasonal changes should be configurable and should not make every biome
behave identically.

### 9.2 Environmental events

Later versions may include:

-   Droughts.
-   Floods.
-   Wildfires.
-   Unusual cold or heat periods.
-   Temporary resource shortages.

Events should affect defined world regions and have measurable
consequences. They should be optional and configurable so users can run
controlled experiments.

## 10. User Interface and Visualization

The UI should emphasize the living world while keeping useful controls
and analytical information accessible.

### 10.1 Main simulation screen

The main screen should contain:

-   Large interactive world viewport.
-   Play and pause controls.
-   Simulation speed controls.
-   Current simulation time and tick.
-   Population summary.
-   World-generation and simulation settings.
-   Map zoom and pan controls.

### 10.2 World map

The world map should support:

-   Biome rendering.
-   Creature rendering.
-   Food and resource overlays.
-   Water and elevation overlays.
-   Optional temperature and moisture overlays.
-   Zooming and panning.
-   Selecting an individual creature.
-   Inspecting local terrain and resource information.

The user should be able to switch between visual layers without changing
the underlying simulation.

### 10.3 Creature inspector

Selecting a creature should open an inspector containing:

-   Creature ID and species or lineage.
-   Age, energy, hydration, and status.
-   Current biome and coordinates.
-   Physical traits.
-   Parent and offspring references where available.
-   Neural-network architecture and live activations.
-   Recent behavior or event history, if implemented.

### 10.4 Evolution dashboard

The dashboard should display population and trait trends over time. It
should support filtering by species, biome, and selected time range
where practical.

### 10.5 World-generation controls

Users should be able to configure:

-   World seed.
-   Map dimensions.
-   Biome diversity.
-   Mountain and water distribution.
-   Climate variation.
-   Resource abundance.
-   Initial population.
-   Initial trait variation.

### 10.6 Simulation controls

Users should be able to:

-   Start and pause the simulation.
-   Advance by one tick or a short interval.
-   Change simulation speed.
-   Reset or regenerate a world.
-   Save and load a world.
-   Export selected creature genomes or simulation statistics.

## 11. Recommended Technology Stack

The first release should be a **client-side TypeScript single-page application** deployed as static files. The browser performs rendering and simulation. No application backend is required for the core experience.

### 11.1 Final stack

| Area | Technology | First-release decision |
|---|---|---|
| Language | TypeScript | Required for UI, simulation, workers, and shared contracts |
| UI | React | Use for controls, panels, inspectors, and dashboards |
| Build and development | Vite | Build static assets into `dist/` |
| 2D rendering | PixiJS 8 | Use for terrain, resources, creatures, and camera |
| Rendering backend | WebGL/WebGL2 | Preferred production renderer; do not require WebGPU |
| Simulation execution | Native Web Worker | Worker owns and advances the authoritative simulation state |
| Simulation engine | Custom TypeScript | Implement world rules, movement, perception, energy, reproduction, and evolution |
| Neural network | Custom TypeScript feed-forward network | Fixed small topology initially; no ML framework |
| Spatial queries | Custom uniform spatial grid / spatial hash | Efficiently find nearby creatures, resources, and obstacles |
| Procedural terrain | `simplex-noise` | Add when terrain generation is implemented |
| UI state | React state initially; Zustand when shared UI state justifies it | Do not store every creature in React or Zustand |
| Local storage | IndexedDB, using `idb` when persistence is implemented | Store versioned world saves and settings |
| Validation | Zod at data boundaries | Validate imported and persisted data |
| Charts | Recharts, added when historical analytics exist | Render aggregated statistics, not per-tick data |
| Unit/integration tests | Vitest | Establish early for simulation logic |
| UI tests | Testing Library, when useful | Test meaningful user-facing components |

Keep dependencies deliberately small. Do not install every planned dependency on day one. React, TypeScript, Vite, PixiJS, and Vitest are enough to establish the first runnable vertical slice. Add the other packages when their corresponding feature is implemented.

### 11.2 Rendering backend

Use PixiJS 8 with WebGL/WebGL2 as the production baseline. WebGPU can be investigated later as an optional enhancement after the WebGL path is stable and profiling demonstrates a reason to change.

Do not make a PixiJS Canvas renderer fallback a requirement. Renderer availability and feature support vary by PixiJS version; verify the current PixiJS 8 documentation before promising a fallback. If WebGL is unavailable, show a clear unsupported-browser message rather than silently promising equivalent rendering.

React should not render each creature as a component. React manages the surrounding application interface; PixiJS manages the large visual scene.

### 11.3 Simulation model and coordinate system

Use a **continuous 2D world for creature positions**, with a **uniform spatial grid for broad-phase nearby-object queries**. Terrain remains represented by cells or chunks.

This combination gives creatures smooth movement while avoiding naive all-pairs proximity checks. A simple grid is easier to understand and debug than a complex spatial index and should be sufficient initially.

Define and document:
- World coordinate units and terrain-cell size.
- Simulation timestep and movement units.
- Collision and passability rules.
- How resource contention is resolved.
- How movement and terrain costs are calculated.
- Reproduction eligibility, cost, and offspring placement.

Use deterministic tie-breaking where possible so update order does not accidentally decide important outcomes.

### 11.4 Neural-network implementation

Implement a small feed-forward multilayer perceptron directly in TypeScript. Start with the proposed **8 input → 12 hidden → 4 output** topology as an experiment, not a permanent constraint.

Before tuning the network, document the exact meaning and numeric range of each input and output. Normalize inputs to predictable ranges. Define activation functions and how outputs map to movement and actions.

Use a fixed topology for the first release so offspring inherit compatible weight and bias arrays. Defer topology mutation, backpropagation, reinforcement learning, TensorFlow.js, and PyTorch.

### 11.5 Worker execution and message protocol

The simulation worker owns the authoritative state: world, terrain data used by simulation, creatures, genomes, resources, random generator state, simulation clock, and evolutionary counters.

The main thread owns:
- React UI and user interaction.
- PixiJS scene, sprites, camera, and visual effects.
- UI preferences and selected-entity state.
- IndexedDB access and user-facing save/load flows.

Use native typed `postMessage` contracts first. Define discriminated TypeScript message types for commands, snapshots, statistics, inspection requests, save requests, and errors. Do not add Comlink unless the native protocol becomes genuinely cumbersome.

Start with structured-clone messages and compact snapshots. Suggested initial update targets:
- Render snapshots: approximately 10–20 updates per second.
- PixiJS drawing: browser animation-frame cadence.
- Dashboard statistics: approximately 1–2 updates per second.

These are starting values to profile, not guaranteed requirements. PixiJS may interpolate between the latest snapshots for smoother visual movement. Avoid sending a separate message for every creature or every simulation tick.

If profiling shows message serialization/copying is a bottleneck, move snapshots to packed typed arrays and consider transferring `ArrayBuffer` ownership. Use buffer pooling or double buffering only when measurements justify the added complexity. Avoid `SharedArrayBuffer` in the first release; it introduces cross-origin isolation and synchronization considerations.

### 11.6 State ownership

Use explicit ownership boundaries:

- **Simulation worker:** authoritative world and creature state.
- **PixiJS:** visual representation only; never authoritative simulation rules.
- **React / Zustand:** UI state, settings, selected creature ID, active overlays, and controls.
- **IndexedDB:** durable local save data.

Do not mirror the full creature population in React state or Zustand. The UI should request inspection data for the selected creature and consume compact render/statistics snapshots.

### 11.7 Persistence

Use IndexedDB for local saves. Store a versioned save format that includes:
- Format version and simulation version.
- World seed and generation configuration.
- Simulation clock and deterministic random-generator state.
- Terrain/environment state or sufficient data to reconstruct it exactly.
- Creature state, genomes, neural weights, and ancestry identifiers.
- Resource state.
- Simulation settings and relevant historical summaries.

Validate data at import/load boundaries. Implement explicit migrations for supported older versions; otherwise reject incompatible saves with a clear explanation. Do not silently load partially understood data.

### 11.8 Backend and deployment

No backend is required for the first release. Do not add user accounts, cloud synchronization, multiplayer, server-side simulation, PostgreSQL, Redis, or an API service until a concrete product requirement needs them.

Build with `npm run build`; Vite writes static output to `dist/` by default. Deploy that directory to a static hosting provider or a conventional static web server. `vite preview` is for local production-build previewing, not the production server.

---

## 12. High-Level Architecture

The first release should use a **single simulation worker** and a **single main-thread renderer**. Do not split simulation into multiple workers until profiling proves that one worker is insufficient.

```text
Browser
│
├── Main thread
│   ├── React UI
│   │   ├── Simulation controls
│   │   ├── Creature inspector
│   │   ├── Settings
│   │   └── Statistics dashboard
│   │
│   ├── PixiJS 8 renderer
│   │   ├── Terrain and biome layers
│   │   ├── Resources
│   │   ├── Creature sprites
│   │   └── Camera and selection visuals
│   │
│   ├── UI state (React; Zustand if needed)
│   └── IndexedDB persistence
│
└── Simulation Web Worker
    ├── Simulation clock and seeded RNG
    ├── World and terrain state
    ├── Spatial grid
    ├── Resources
    ├── Creature state and perception
    ├── Neural-network inference
    ├── Movement and interactions
    ├── Energy and survival
    ├── Reproduction and mutation
    └── Population metrics
```

### 12.1 Main-thread responsibilities

- Render the world and visual overlays through PixiJS.
- Handle camera pan, zoom, selection, and interface interaction.
- Send commands to the worker.
- Receive compact snapshots and update PixiJS display objects.
- Request selected-creature details when the user selects an entity.
- Display aggregated statistics and charts.
- Save and load through IndexedDB.

### 12.2 Worker responsibilities

- Own and update all authoritative simulation data.
- Advance fixed simulation steps.
- Evaluate perception and neural networks.
- Resolve movement, collisions, and resource interactions.
- Apply energy costs, reproduction, mutation, and death.
- Maintain deterministic random state and simulation metrics.
- Respond to inspection and save-snapshot requests.

The worker should not import React or PixiJS. The simulation engine should be testable as ordinary TypeScript modules independently of the browser UI.

### 12.3 Message contract

Define a small protocol with message types such as:

**Main thread → worker**
- `INIT_WORLD`
- `START`
- `PAUSE`
- `RESET`
- `SET_SPEED`
- `UPDATE_SETTINGS`
- `REQUEST_INSPECT`
- `REQUEST_SAVE_SNAPSHOT`

**Worker → main thread**
- `READY`
- `RENDER_SNAPSHOT`
- `STATISTICS_UPDATE`
- `INSPECT_RESULT`
- `SAVE_SNAPSHOT`
- `SIMULATION_ERROR`

Every message should have a typed payload and, where useful, a request ID so responses can be matched to requests. Include a simulation tick or sequence number in snapshots so stale messages can be discarded.

### 12.4 Suggested project structure

```text
neural-creatures/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── store.ts
│   ├── components/
│   │   ├── controls/
│   │   ├── inspector/
│   │   ├── dashboard/
│   │   └── layout/
│   ├── rendering/
│   │   ├── PixiWorld.ts
│   │   ├── camera.ts
│   │   └── layers/
│   ├── simulation/
│   │   ├── core/
│   │   │   ├── Simulation.ts
│   │   │   ├── World.ts
│   │   │   ├── SpatialGrid.ts
│   │   │   └── random.ts
│   │   ├── terrain/
│   │   ├── creatures/
│   │   ├── neural-network/
│   │   ├── resources/
│   │   ├── evolution/
│   │   └── statistics/
│   ├── workers/
│   │   └── simulation.worker.ts
│   ├── persistence/
│   │   ├── database.ts
│   │   ├── save-format.ts
│   │   └── migrations/
│   ├── shared/
│   │   ├── messages.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   └── main.tsx
├── tests/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This is a target organization, not a requirement to create every file immediately. Add modules as responsibilities become real. Avoid empty abstractions created only to match the tree.

---

## 13. Development Roadmap

Build a complete vertical slice before building the full world generator or advanced ecosystem. Every phase should leave the application runnable.

### Phase 1 — Application shell and renderer

**Deliverables**
- React + TypeScript + Vite project.
- PixiJS 8 initialized with WebGL.
- Basic scene, simple background/terrain placeholder, and camera.
- Minimal layout with start, pause, and reset controls.
- Shared TypeScript conventions and initial Vitest setup.

**Acceptance criteria**
- `npm run dev` starts successfully.
- `npm run build` succeeds.
- The browser displays the PixiJS viewport.
- Camera pan/zoom works without React rendering individual world entities.
- A basic unit test runs successfully.

### Phase 2 — Simulation worker and movement prototype

**Deliverables**
- Typed worker command/update protocol.
- Simulation clock and fixed timestep.
- Seeded random-number generator.
- Basic world and entity state.
- Continuous movement and simple boundary/collision rules.
- Compact render snapshots consumed by PixiJS.

**Acceptance criteria**
- Simulation runs in a dedicated worker.
- Start, pause, reset, and speed controls work.
- Main-thread UI remains interactive during simulation.
- Snapshot sequence numbers/ticks are handled correctly.
- Worker and simulation modules can be tested without importing React or PixiJS.

### Phase 3 — First functioning creature and resource loop

**Deliverables**
- Creature model and a small set of inherited traits.
- Food resources and regeneration.
- Spatial grid for nearby-object queries.
- Perception inputs and custom feed-forward neural network.
- Movement, eating, energy gain, and energy costs.
- Basic death rules.

**Acceptance criteria**
- Creatures detect nearby food using local perception.
- Creatures move according to their network outputs.
- Movement consumes energy and food restores energy.
- Spatial queries return correct nearby candidates.
- Neural inference and energy rules have unit tests.
- A baseline/debug controller can be used to distinguish simulation bugs from evolved-network behavior.

### Phase 4 — Reproduction and evolution

**Deliverables**
- Asexual reproduction conditions and costs.
- Genome inheritance.
- Trait and neural-weight mutation.
- Parent/offspring identifiers.
- Birth, death, and population counters.

**Acceptance criteria**
- Eligible creatures reproduce only when defined conditions are met.
- Offspring inherit the parent's genome before mutation.
- Mutation produces bounded, testable variation.
- Reproduction consumes the configured energy and respects local placement/population limits.
- A seeded run can be replayed under the same execution settings.
- Population changes can be observed over multiple generations.

### Phase 5 — Procedural terrain and biome mechanics

**Deliverables**
- Seeded elevation, temperature, and moisture fields.
- Initial six biome types.
- Simplified rivers and lakes.
- Resource distribution based on biome suitability.
- Terrain passability and movement-cost rules.
- Optional swimming/climbing only where required by the first map mechanics.

**Acceptance criteria**
- Same seed and configuration produce the same initial world.
- Different seeds produce meaningfully different worlds.
- At least two biomes have different mechanical effects, not only different colors.
- Water and impassable terrain obey documented movement rules.
- Resources regenerate within defined limits.
- Terrain generation tests cover key invariants.

### Phase 6 — Usable sandbox and persistence

**Deliverables**
- Camera pan/zoom and visual overlays.
- Creature selection and inspector.
- Simulation speed controls and single-step mode.
- Aggregated population/trait statistics.
- IndexedDB save/load with a versioned format.
- Basic save validation and error handling.

**Acceptance criteria**
- User can create, run, pause, inspect, save, reload, and resume a world.
- Loaded saves preserve important simulation state and random state.
- Invalid or incompatible saves fail clearly.
- Dashboard updates less frequently than rendering and simulation.
- Save/load integration tests pass.

### Phase 7 — Profiling, stabilization, and expansion

**Deliverables**
- Separate rendering and simulation profiling.
- Population-size benchmark.
- Message-transfer optimization only if measured necessary.
- Memory-growth and long-running simulation checks.
- Additional biomes, environmental mechanics, and optional advanced systems.

**Acceptance criteria**
- Benchmark results record population, simulation steps/sec, FPS, and memory observations.
- No unbounded history or dead-entity accumulation is observed in test runs.
- Practical performance limits are documented for tested devices.
- Advanced features can be disabled for controlled experiments.

---

## 14. MVP Scope

The MVP should prove the central artificial-life loop. It does not need every planned biome, biological trait, or dashboard.

### Must have
- Browser-based 2D world viewport.
- React + TypeScript + Vite.
- PixiJS renderer.
- Dedicated simulation Web Worker.
- Continuous creature positions and terrain grid.
- Spatial grid for nearby-object queries.
- At least one simple environment with passable and impassable areas.
- Food resources with bounded regeneration.
- Creatures with a small set of inherited traits.
- Small feed-forward neural networks.
- Local perception, movement, food seeking, and consumption.
- Energy gain and costs.
- Asexual reproduction.
- Trait and neural-weight mutation.
- Death and population counters.
- Start, pause, reset, and basic speed controls.
- Basic creature selection/inspection.
- Deterministic seed and core simulation tests.

### Should have
- Six initial biomes.
- Terrain-dependent movement and resource availability.
- Temperature and moisture fields.
- Swimming or climbing if needed by the generated map.
- Population and trait history charts.
- Local save/load.

### Could have later
- Species grouping and speciation visualization.
- Neural-network activation visualization.
- Hydration and temperature stress.
- Sexual reproduction and crossover.
- Predator-prey interactions.
- Seasonal climate and environmental events.
- Migration analytics and lineage trees.
- Genome export/import.
- More advanced rendering or WebGPU experiments.

### Explicitly out of scope for the first release
- Multiplayer and online accounts.
- Cloud synchronization.
- Backend APIs and server-side simulation.
- Scientifically accurate biological modeling.
- TensorFlow.js, PyTorch, or reinforcement-learning frameworks.
- Complex fluid or hydrology simulation.
- Neural topology evolution.
- Multiple simulation workers or shared-memory architecture.
- 3D rendering.

---

## 15. Performance and Remote Development Constraints

The remote coding environment has **1 vCPU, 2 GB RAM, Linux/amd64**. Treat these as build/development/hosting constraints, not as the performance budget for every user's browser.

### 15.1 Where work runs

For a normal static deployment:
- The remote environment installs dependencies and builds the frontend.
- The static host serves the files generated in `dist/`.
- Each visitor's browser runs React, PixiJS, and the simulation worker on the visitor's device.
- World saves remain in that browser's IndexedDB.

A Web Worker does not add CPU capacity. It moves simulation work off the main UI thread, but the worker and renderer still share the CPU and memory available to that browser. If the browser itself runs on the constrained remote machine, the simulation is constrained by that machine too.

### 15.2 Remote build recommendations

- Use a supported Node.js LTS release and npm.
- Keep one install/build process active at a time.
- Avoid concurrent coding-agent builds or multiple package managers operating on the same workspace.
- Avoid running databases, local AI models, or unrelated heavy services on the same small machine.
- Prefer the smallest dependency set that supports the current milestone.
- Use `npm ci` when a lockfile is committed and reproducible clean installs are needed.
- Run `npm run build` as the production build check.
- Use `npm run preview` only to inspect the production build locally; do not treat it as the production hosting server.

### 15.3 Initial simulation targets

These are benchmark scenarios, not guaranteed device-independent limits.

| Metric | Initial experiment |
|---|---:|
| Terrain grid | 256 × 256 cells |
| Initial population | 100 creatures |
| Benchmark populations | 100, 250, 500, 1,000 |
| Initial speed controls | 1×, 2×, 5×, 10× |
| Render snapshot cadence | 10–20 updates/sec initially |
| Dashboard statistics | 1–2 updates/sec initially |
| Rendering target | 60 FPS where device/browser permits |

Record FPS, simulation steps per second, and memory behavior at each population. Do not claim a maximum supported population until measured on representative hardware.

### 15.4 Performance rules

- Use a fixed simulation timestep and cap catch-up work after delays.
- Separate simulation speed from rendering frame rate.
- Use spatial partitioning for nearby-object queries.
- Avoid all-pairs creature comparisons.
- Avoid unnecessary object allocations in hot simulation loops.
- Keep authoritative simulation state in the worker.
- Send compact, batched render snapshots.
- Update charts less frequently than the renderer.
- Bound historical statistics and clean up dead entities.
- Profile before introducing WebAssembly, GPU compute, SharedArrayBuffer, or additional workers.

---

## 16. Testing Strategy

### 16.1 Unit tests

Use Vitest for pure simulation logic:
- Seeded random generator repeatability.
- Terrain field and biome classification.
- Spatial-grid insertion, update, and query correctness.
- Neural-network forward pass and input normalization.
- Trait mutation and clamping.
- Genome inheritance.
- Movement and collision invariants.
- Energy and resource calculations.
- Reproduction eligibility and offspring placement.
- Resource regeneration limits.
- Save serialization and validation.

### 16.2 Integration tests

Test complete domain interactions:
- Creature perceives food, moves, consumes it, and gains energy.
- Movement and terrain costs affect survival.
- Eligible creatures reproduce and produce mutated offspring.
- Population counters match births and deaths.
- Worker commands change simulation state correctly.
- Save/load preserves world, creature, resource, and random-generator state.

### 16.3 Deterministic tests

Use a seeded random generator and fixed settings. For repeatability, also keep entity update order, collision resolution, and floating-point behavior controlled. Do not assume a seed alone guarantees identical outcomes if execution order or parallelism changes.

Test invariants and reproducible scenarios. Evolutionary outcomes should not be asserted as guaranteed trends unless the scenario is explicitly deterministic.

### 16.4 Performance tests

Create a repeatable benchmark scenario for 100, 250, 500, and 1,000 creatures. Record:
- Simulation steps per second.
- Snapshot transfer duration or update cost.
- Rendering FPS.
- Approximate memory behavior over a sustained run.

Do not turn a benchmark result from one machine into a universal performance promise.

### 16.5 Visual/manual tests

Verify:
- PixiJS initialization and resize behavior.
- Camera pan and zoom.
- Terrain and biome layers.
- Creature rendering and selection.
- Inspector data matches the selected creature.
- Pause/reset/speed controls.
- Save/load user flow.
- Error messages for unsupported rendering or invalid saves.

---

## 17. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope grows before the core loop works | Build the creature → food → energy → reproduction → mutation loop before advanced ecology |
| Naive nearby-object checks become expensive | Use a uniform spatial grid and benchmark query correctness/performance |
| Worker snapshots create copying overhead | Batch compact snapshots; switch to transferable typed-array buffers only after profiling |
| UI becomes sluggish | Keep creature state out of React; let PixiJS own visual objects |
| Creatures behave randomly or fail to survive | Inspect normalized inputs/outputs; add a baseline controller and tune energy/resource rules |
| Evolution appears uninteresting | Run controlled experiments and inspect mutation, selection pressure, and environmental trade-offs; do not force a desired outcome |
| Terrain is decorative only | Give each implemented biome explicit movement/resource/environment rules |
| Population or history grows without bound | Define population limits, resource constraints, bounded analytics history, and dead-entity cleanup |
| Saves break after schema changes | Version save files, validate them, and add migrations or explicit compatibility errors |
| Results are difficult to reproduce | Store seeds, settings, simulation version, and random-generator state |
| Remote build environment runs out of resources | Keep dependencies lean, avoid concurrent builds, and do not host the simulation on the remote server |
| Species labels imply false biological precision | Treat species grouping as a configurable visualization heuristic, not a definitive biological claim |

---

## 18. Success Criteria

The first usable release is successful when a user can:

1. Open the static web application without an application backend.
2. Generate or load a seeded world.
3. Start, pause, reset, and change simulation speed.
4. Observe creatures moving in a PixiJS world viewport.
5. Observe creatures sensing and consuming nearby food.
6. Observe energy costs, reproduction, inheritance, mutation, and death.
7. See terrain affect movement or resource availability.
8. Select a creature and inspect its current traits and state.
9. Save and reload a world with essential state preserved.
10. Re-run a controlled seeded scenario for debugging and comparison.

The most important qualitative criterion is that users can observe behavior and population changes that were not individually scripted, then inspect the environmental and inherited factors that may have contributed.

---

## 19. Final Product Vision

**Neural Creatures** should feel like a small interactive laboratory for artificial life.

The user does not directly control each organism. Instead, the user creates the conditions under which organisms live, compete, and evolve. The world provides constraints and opportunities; neural networks produce behavior; inheritance and mutation create variation; and ecological rules determine which organisms successfully reproduce.

A compelling simulation might show different populations occupying forests, grasslands, deserts, and mountain regions, with their traits and behaviors changing over time. Some lineages may flourish, others may migrate, and others may disappear.

The project should make these processes visible, understandable, reproducible, and fun to explore.

**Core concept:** Build a world, introduce life, let evolution happen, and discover what emerges.

---

## 20. Technical References

Use official documentation as the source of truth when implementing or upgrading dependencies. Verify API details against the installed major version.

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite — Static deployment](https://vite.dev/guide/static-deploy)
- [PixiJS — Rendering](https://pixijs.download/v8.x/docs/rendering.html)
- [MDN — Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [MDN — Worker postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage)
- [MDN — Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Recharts](https://recharts.org/)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
