import type { RandomSource } from './random.ts'

/** Rectangular prototype world in continuous world units (1 unit = 1 renderer pixel at zoom 1). */
export interface WorldBounds {
  readonly width: number
  readonly height: number
}

/**
 * Prototype tuning values. Every field is validated at the simulation boundary
 * so a bad config fails loudly instead of producing NaN positions.
 */
export interface SimulationConfig {
  readonly world: WorldBounds
  readonly entityCount: number
  readonly seed: number
  /** Entity speed sampled per entity, in world units per second. */
  readonly minSpeed: number
  readonly maxSpeed: number
  /** Visual/collision radius in world units; also the edge inset for bouncing. */
  readonly minRadius: number
  readonly maxRadius: number
}

/** One prototype test entity. No genome, energy, or neural state exists yet. */
export interface EntityState {
  readonly id: number
  x: number
  y: number
  /** World units per second. */
  vx: number
  vy: number
  readonly radius: number
  /** Stable hue in degrees, sampled once so entity colours survive snapshots. */
  readonly hue: number
}

/** Authoritative simulation state, owned by the worker. */
export interface SimulationState {
  readonly config: SimulationConfig
  readonly bounds: WorldBounds
  /** Mutable positions/velocities; iteration order is array order (stable). */
  readonly entities: EntityState[]
  readonly random: RandomSource
  tick: number
}
