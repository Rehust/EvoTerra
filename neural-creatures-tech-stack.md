# Neural Creatures — Technology Stack and Development Setup

## 1. Project Overview

**Neural Creatures** is a client-side, browser-based 2D artificial-life sandbox. Creatures move through a procedurally generated world, sense nearby conditions, consume resources, reproduce, mutate, and evolve over generations.

The first release should be a **static web application**. The simulation runs in each visitor's browser; there is no application server or database backend required.

### Design goals

- Keep the project lightweight and straightforward to build on a remote machine with **1 vCPU, 2 GB RAM, Linux/amd64**.
- Keep simulation work away from the UI thread so the interface remains responsive.
- Use a 2D renderer suitable for many moving sprites.
- Implement the small neural networks and simulation rules directly in TypeScript.
- Start with local persistence and avoid unnecessary infrastructure.
- Keep the architecture modular enough to add more biomes, creature behaviors, and analysis tools later.

---

## 2. Recommended Stack

| Area | Technology | Responsibility |
|---|---|---|
| Language | **TypeScript** | Application, simulation, neural networks, and shared data types |
| UI framework | **React** | Menus, panels, controls, inspector, settings, and dashboards |
| Build tool / dev server | **Vite** | Fast local development and production builds |
| 2D rendering | **PixiJS 8** | Rendering the world, terrain, food, and creatures |
| Graphics backend | **WebGL** | Primary rendering backend through PixiJS |
| Simulation concurrency | **Web Workers** | Run simulation calculations away from the browser's main UI thread |
| Simulation engine | **Custom TypeScript** | World updates, movement, perception, energy, reproduction, and evolution |
| Neural networks | **Custom TypeScript feed-forward network** | Creature decision-making; no ML framework in the first release |
| Procedural terrain | **simplex-noise** | Generate terrain and environmental variation |
| UI state | **Zustand** | Manage application-level UI state and settings |
| Local persistence | **IndexedDB** via **idb** | Save and load worlds, settings, and simulation snapshots |
| Data validation | **Zod** | Validate saved data and important configuration objects |
| Charts | **Recharts** | Population, species, and other historical statistics |
| Testing | **Vitest** | Unit and integration tests for simulation and application logic |
| Component testing | **Testing Library** | Test important React UI behavior |

### Why this stack?

- **React + Vite** is a simple, familiar foundation for a web app. Vite builds static assets and does not require a Node.js server in production.
- **PixiJS** is designed for accelerated 2D rendering and is a better fit for a large number of moving visual objects than rendering every creature as a React component.
- **Web Workers** keep CPU-heavy simulation calculations off the main UI thread.
- **Custom simulation and neural-network code** avoids the size and complexity of a general machine-learning or physics framework.
- **IndexedDB** provides browser-local storage without requiring a backend database.
- The rest of the stack is deliberately small and can be expanded only when the project needs it.

---

## 3. Runtime Architecture

The application has two main execution areas:

1. **Browser main thread** — React UI and PixiJS rendering.
2. **Simulation Web Worker** — world updates and creature decision-making.

```text
Browser
│
├── Main Thread
│   ├── React
│   │   ├── Toolbar and simulation controls
│   │   ├── Creature inspector
│   │   ├── Statistics panels
│   │   └── Settings and save/load UI
│   │
│   ├── PixiJS 8
│   │   ├── Terrain and biome layers
│   │   ├── Food and resource sprites
│   │   ├── Creature sprites
│   │   └── Camera, zoom, and selection visuals
│   │
│   ├── Zustand
│   │   └── UI state and user preferences
│   │
│   └── IndexedDB (through idb)
│       └── Saved worlds and settings
│
└── Simulation Web Worker
    ├── World state
    ├── Terrain and resource simulation
    ├── Creature perception
    ├── Neural-network inference
    ├── Movement and interactions
    ├── Energy and survival
    ├── Reproduction and mutation
    └── Evolution and statistics
```

### Main-thread responsibilities

The main thread should handle:

- React components and user interactions.
- PixiJS application setup and drawing.
- Camera movement, zoom, selection, and visual overlays.
- Translating user actions into commands for the simulation worker.
- Receiving compact simulation snapshots and updating rendered objects.
- Displaying charts and less frequently updated statistics.
- Saving and loading data through IndexedDB.

Do **not** create a React component for every creature. React should manage the interface, while PixiJS manages the large collection of visual entities.

### Worker responsibilities

The worker should own the authoritative simulation state:

- World dimensions and terrain data.
- Creature positions, traits, energy, and neural-network weights.
- Food and other resources.
- Perception and decision-making.
- Movement, collisions, and interactions.
- Reproduction, mutation, death, and population changes.
- Simulation time and historical statistics.

Keeping the authoritative state in one worker avoids continuously copying the entire world between the UI and simulation.

### Communication between the UI and worker

Use the browser's native `postMessage` API initially. A wrapper library such as Comlink is optional and should be added only if message handling becomes difficult to maintain.

Use two message categories:

**Commands from the UI to the worker**
- Start, pause, and reset.
- Change simulation speed.
- Create or load a world.
- Select or inspect a creature.
- Update simulation settings.
- Request a save snapshot.

**Updates from the worker to the UI**
- Periodic render snapshots containing the data needed to draw creatures and resources.
- Population and other summary statistics.
- Responses to inspection requests.
- Save data or save-ready snapshots.
- Errors and simulation status.

Avoid sending a message for every individual creature property on every simulation step. Batch updates into compact snapshots and send them at a controlled rate. The worker can simulate many internal steps between visual updates when the user increases simulation speed.

---

## 4. Rendering Strategy

### PixiJS

Use PixiJS 8 for the world renderer.

Recommended responsibilities:

- Draw terrain as chunks or tile-like regions.
- Draw food and resources as sprites or lightweight graphics.
- Draw creatures as sprites or simple shapes.
- Support camera pan and zoom.
- Highlight selected creatures.
- Render optional overlays such as temperature, moisture, and resource density.

Use **WebGL as the primary rendering backend**. Keep the rendering code structured so a fallback can be considered if a target browser cannot use the preferred backend. Do not make WebGPU a first-release requirement.

### Rendering performance rules

- Keep simulation data out of React component state.
- Reuse sprites and graphics objects instead of recreating them every frame.
- Update only objects whose visual state has changed where practical.
- Render at the display's animation-frame cadence, independently of the simulation's snapshot cadence.
- Avoid expensive text labels for every creature when zoomed out.
- Use simplified visuals at low zoom levels.
- Consider terrain chunking and culling when the world becomes larger.

---

## 5. Simulation and Neural Network

### Simulation implementation

Implement the simulation as ordinary TypeScript modules. Keep it independent from React and PixiJS so it can be tested without a browser UI.

The simulation should initially include:

1. World and terrain representation.
2. Resource placement and regeneration.
3. Creature state and inherited traits.
4. Perception of nearby resources, obstacles, and environmental conditions.
5. Neural-network inference.
6. Movement and interactions.
7. Energy and survival rules.
8. Reproduction and mutation.
9. Population and generation statistics.

Use a fixed simulation timestep where practical. Keep the simulation deterministic when supplied with a known random seed; this makes bugs easier to reproduce and tests more reliable.

### Neural network

Start with a small feed-forward neural network implemented directly in TypeScript.

A reasonable initial experiment is:

```text
8 input values
      ↓
12 hidden neurons
      ↓
4 output values
```

Treat these dimensions as tunable starting values, not permanent requirements. Define and document the meaning and numeric range of each input and output.

Possible inputs:
- Direction and distance to nearby food.
- Nearby obstacle or terrain information.
- Nearby creature or threat information.
- Current energy.
- Current hydration.
- Environmental suitability or stress.

Possible outputs:
- Horizontal movement preference.
- Vertical movement preference.
- Eat or interact preference.
- Reproduction or other action preference.

The network should initially use simple activation functions and compact numeric arrays for weights. Add tests for inference and mutation.

### Evolution

Use evolutionary selection rather than gradient-based training in the first release:

- Creatures inherit traits and neural-network weights.
- Reproduction copies the parent's genome.
- Mutation changes selected genes or weights by small random amounts.
- Survival and reproduction depend on the simulation's resource and energy rules.
- Track generations and lineage identifiers where useful.

Do not add TensorFlow.js, PyTorch, or a reinforcement-learning framework for the initial version. They are unnecessary for a small custom feed-forward network.

---

## 6. Procedural World and Biomes

Use `simplex-noise` to generate smooth environmental fields. Combine noise fields and explicit rules to determine terrain types and environmental values.

Initial biome set:

- Grassland
- Forest
- River and lake
- Mountain
- Desert
- Tundra

Additional biomes can be introduced after the basic simulation works:

- Wetlands
- Beaches and coastal regions
- Volcanic areas

Biomes should influence simulation mechanics, not just appearance. Examples include:

- Movement cost and traversability.
- Food and resource availability.
- Temperature and moisture.
- Visibility or cover.
- Swimming or climbing requirements.

Keep terrain generation separate from terrain simulation. A generated map should be reproducible from a seed and configuration.

---

## 7. State Management and Persistence

### Zustand

Use Zustand for application-level state such as:

- Whether the simulation is running.
- Selected tool or panel.
- Selected creature ID.
- Current visual overlay.
- User preferences.
- UI-side simulation controls.

Do not use Zustand as the authoritative store for every creature and every simulation tick. The worker owns simulation state.

### IndexedDB and idb

Use IndexedDB through the small `idb` wrapper for:

- Saved worlds.
- Simulation snapshots.
- User settings.
- Optional historical statistics.

Define a versioned save-data format. Validate loaded data with Zod and handle incompatible or corrupted saves gracefully.

The first release does not need user accounts, cloud synchronization, a remote database, or a backend API.

---

## 8. Charts and Statistics

Use Recharts for ordinary dashboard charts, for example:

- Total population over time.
- Population by species or lineage.
- Births and deaths.
- Average creature lifespan.
- Resource availability.
- Trait distribution.

Do not update charts on every simulation tick. Aggregate statistics in the worker and send them to the UI periodically. Keep the history size bounded so long-running simulations do not consume unbounded memory.

---

## 9. Suggested Project Structure

One possible structure:

```text
neural-creatures/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── store.ts
│   │
│   ├── components/
│   │   ├── controls/
│   │   ├── inspector/
│   │   ├── dashboard/
│   │   └── layout/
│   │
│   ├── rendering/
│   │   ├── PixiWorld.ts
│   │   ├── camera.ts
│   │   ├── layers/
│   │   └── sprites/
│   │
│   ├── simulation/
│   │   ├── core/
│   │   │   ├── Simulation.ts
│   │   │   ├── World.ts
│   │   │   └── random.ts
│   │   ├── terrain/
│   │   ├── creatures/
│   │   ├── neural-network/
│   │   ├── evolution/
│   │   ├── resources/
│   │   └── statistics/
│   │
│   ├── workers/
│   │   └── simulation.worker.ts
│   │
│   ├── persistence/
│   │   ├── database.ts
│   │   └── save-format.ts
│   │
│   ├── shared/
│   │   ├── messages.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   ├── utils/
│   └── main.tsx
│
├── tests/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

This is a suggested organization, not a requirement to create every directory immediately. Add modules when the corresponding feature is implemented.

---

## 10. Initial Setup

### Prerequisites

Install a currently supported **Node.js LTS** release and npm. Check the installed versions:

```bash
node --version
npm --version
```

### Create the project

```bash
npm create vite@latest neural-creatures -- --template react-ts
cd neural-creatures
```

### Install runtime dependencies

```bash
npm install pixi.js zustand simplex-noise idb recharts zod
```

### Install development and testing dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Vite's React TypeScript template includes the basic TypeScript and React setup. Keep the generated configuration initially; change it only when a concrete project requirement appears.

### Start the development server

```bash
npm run dev
```

### Run tests and build

```bash
npx vitest
npm run build
```

The production build is written to `dist/`.

### Optional quality-of-life tools

Add these only when useful:

- ESLint for linting.
- Prettier for consistent formatting.
- Comlink if native worker messaging becomes cumbersome.
- Playwright if browser-level end-to-end testing becomes necessary.

Avoid adding a large set of tooling before the first simulation loop works.

---

## 11. Remote Sandbox and Resource Constraints

The remote development environment has:

- **CPU:** 1 vCPU
- **Memory:** 2 GB RAM
- **OS:** Linux
- **Architecture:** amd64

This is sufficient for editing the project and building a modest Vite application, provided resource usage is controlled. It is not a reason to run the simulation on the server.

### Important distinction

A Web Worker does **not** create extra CPU capacity. It moves work off the browser's main UI thread, but the worker and UI still share the CPU resources available to that browser.

For a normal static deployment:

- The remote machine installs dependencies and builds the site.
- The remote machine serves the static files in `dist/`.
- Each visitor's browser runs the React app, PixiJS renderer, and simulation worker on that visitor's device.

If the browser itself is running on the constrained remote machine, the simulation will also be limited by that machine's CPU and memory.

### Build and development recommendations

- Use one build process at a time.
- Avoid running multiple Vite builds or package installations concurrently.
- Do not run a local model, database server, or other heavy service on the same small machine for this project.
- Keep dependencies modest and remove packages that are not used.
- Use production builds to check the actual output.
- Do not assume a successful build proves the simulation will perform well; profile it in real browsers too.

### Initial performance targets

Use these as starting test targets, not guaranteed limits:

| Metric | Initial target |
|---|---:|
| World size | 256 × 256 cells |
| Initial population | 100 creatures |
| Normal population experiment | 500–1,000 creatures |
| Simulation speed controls | Start with 1×, 2×, 5×, 10× |
| UI rendering target | 60 FPS where the device allows |
| Statistics update frequency | About 2–5 times per second |

Profile before increasing population, world size, or simulation speed. The practical limit depends on the visitor's device, browser, rendering workload, and simulation complexity.

---

## 12. Deployment

Use static hosting for the first release.

```text
Git repository
     │
     ▼
Install dependencies
     │
     ▼
npm run build
     │
     ▼
dist/
     │
     ▼
Static hosting (for example, Nginx or a static hosting provider)
     │
     ▼
User's browser
  ├── React UI
  ├── PixiJS renderer
  ├── Simulation Web Worker
  └── IndexedDB saves
```

No Node.js application server is needed after the static build has been generated. Configure the hosting provider to serve the built files and support the app's routing strategy if client-side routes are introduced.

Use HTTPS in deployment. Browser storage and modern browser APIs have security-context requirements, and HTTPS is the normal production setup.

---

## 13. Technologies to Defer or Avoid Initially

| Technology / approach | First-release decision | Reason |
|---|---|---|
| Next.js | Defer | Server rendering and server features are not needed for a local-first simulation SPA |
| Express / Fastify | Avoid initially | No application backend is required |
| PostgreSQL / Redis | Avoid initially | IndexedDB is sufficient for local saves |
| TensorFlow.js / PyTorch | Avoid initially | A small feed-forward network can be implemented directly |
| Large physics engine | Avoid initially | Simple movement and collision rules are sufficient to start |
| WebGPU | Defer | Keep the first renderer on the established PixiJS WebGL path |
| Docker and microservices | Avoid initially | They add operational complexity without solving a current problem |
| Cloud accounts and synchronization | Defer | First validate the single-device simulation experience |

These are not permanent prohibitions. Reconsider a technology only when a measured limitation or a concrete feature requires it.

---

## 14. Recommended Implementation Order

Build a working vertical slice before implementing every planned feature.

### Phase 1 — Project foundation

- Create the Vite React TypeScript project.
- Add PixiJS and render a simple world.
- Add a basic layout with start, pause, and reset controls.
- Establish shared TypeScript types.

**Exit criteria:** The app starts locally, builds successfully, and displays a basic interactive world.

### Phase 2 — Simulation worker

- Create the simulation worker.
- Define typed command and update messages.
- Implement a world with a small number of moving entities.
- Send compact snapshots to the main thread.
- Render worker-provided positions in PixiJS.

**Exit criteria:** The simulation runs in a worker and the UI remains responsive during basic movement.

### Phase 3 — Creatures and neural decisions

- Add creature state and a small neural network.
- Add perception inputs and movement outputs.
- Add energy and food consumption.
- Add deterministic random seeds for tests.

**Exit criteria:** Creatures can sense resources, make decisions, move, and consume food.

### Phase 4 — Reproduction and evolution

- Add reproduction conditions.
- Inherit traits and neural-network weights.
- Add mutation.
- Track births, deaths, and population.

**Exit criteria:** A population can reproduce, mutate, and change over multiple generations.

### Phase 5 — Terrain and ecosystem

- Generate a seeded world using noise.
- Add initial biomes and terrain effects.
- Add resource distribution and regeneration.
- Add environmental suitability rules.

**Exit criteria:** Terrain meaningfully affects movement or survival, and the same seed can reproduce the same initial map.

### Phase 6 — Usable interface and persistence

- Add camera pan and zoom.
- Add creature selection and an inspector.
- Add population charts and simulation speed controls.
- Add IndexedDB save/load with versioned data.

**Exit criteria:** A user can run a simulation, inspect it, save it, reload it, and view basic population history.

### Phase 7 — Performance and polish

- Profile simulation and rendering separately.
- Reduce unnecessary allocations and message traffic.
- Add culling or chunking if measurements show it is needed.
- Test long-running simulations and save compatibility.
- Improve visual feedback and error handling.

**Exit criteria:** The first release is stable on the supported target browsers and has documented practical population/performance limits.

---

## 15. Engineering Rules for the Coding Agent

1. Keep the simulation independent of React and PixiJS.
2. Keep the authoritative world state inside the simulation worker.
3. Use explicit TypeScript types for worker messages and save data.
4. Do not update React state for every creature on every simulation tick.
5. Do not add a backend unless a concrete requirement needs one.
6. Prefer small, testable simulation modules over one large simulation class.
7. Use seeded randomness for reproducible tests and bug reports.
8. Validate persisted data before loading it into the simulation.
9. Profile before optimizing or increasing complexity.
10. Implement features in the order of the phases above; do not build future systems prematurely.
11. Keep dependencies and build steps compatible with the 1-vCPU, 2-GB remote environment.
12. Document any intentional deviation from this stack and the problem it solves.

---

## 16. Official Documentation

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vite.dev/)
- [PixiJS](https://pixijs.com/)
- [MDN — Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [MDN — IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Zustand documentation](https://zustand.docs.pmnd.rs/)
- [Recharts](https://recharts.org/)
- [Vitest](https://vitest.dev/)
- [Zod](https://zod.dev/)

---

## Final Recommendation

Start with **React + TypeScript + Vite + PixiJS 8**, with the simulation implemented in a **dedicated Web Worker**. Use a custom TypeScript neural network and simulation engine, `simplex-noise` for terrain, Zustand for UI state, IndexedDB for local saves, and Vitest for tests.

Keep deployment static and backend-free. The remote 1-vCPU/2-GB machine should only need to install dependencies, build the frontend, and serve the resulting static files. Let each user's browser perform the simulation.
