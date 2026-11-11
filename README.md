# EvoTerra

A browser-based 2D artificial-life sandbox where neural-network-driven creatures evolve in a procedurally generated world.

## Status

Pre-implementation. The repository currently contains the project specifications only; application code and package scripts will be added as the roadmap phases are implemented.

## Tech stack

- **Language:** TypeScript
- **UI:** React
- **Build/dev:** Vite
- **Rendering:** PixiJS 8 (WebGL)
- **Simulation:** Custom TypeScript engine in a dedicated Web Worker
- **Neural networks:** Custom TypeScript feed-forward network
- **Testing:** Vitest
- **Persistence:** IndexedDB (when implemented)

No backend is required for the core experience.

## Folder structure

This is the target layout. Directories are added only when they contain real code.

```text
EvoTerra/
├── public/
├── src/
│   ├── app/              React application shell and UI state
│   ├── components/       Controls, inspector, dashboard, layout
│   ├── rendering/        PixiJS world, camera, layers, sprites
│   ├── simulation/       Framework-independent simulation engine
│   │   ├── core/         Simulation loop, world, spatial grid, RNG
│   │   ├── terrain/      Terrain generation and biome rules
│   │   ├── creatures/    Creature state, traits, and behavior
│   │   ├── neural-network/  Feed-forward network and mutation
│   │   ├── resources/    Food and resource regeneration
│   │   ├── evolution/    Reproduction, inheritance, species
│   │   └── statistics/   Population and trait metrics
│   ├── workers/          Simulation Web Worker entry point
│   ├── persistence/      IndexedDB access, saves, migrations
│   ├── shared/           Worker messages, shared types, constants
│   └── main.tsx
├── tests/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Documentation

- [Project description](neural-creatures-project-description.md)
- [Technology stack](neural-creatures-tech-stack.md)
- [Agent rules](AGENTS.md)

## Getting started

Setup and run instructions will be added once the project is scaffolded.
