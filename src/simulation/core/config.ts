import type { SimulationConfig } from './types.ts'

/**
 * Prototype defaults for the first movement demo. These are demo values, not
 * biological or game-balance decisions.
 */

/** Prototype world in world units. Not the planned 256x256 terrain grid. */
export const WORLD_WIDTH = 1024
export const WORLD_HEIGHT = 768

/** Fixed simulation step: 30 steps per second, independent of render cadence. */
export const FIXED_TIMESTEP_SECONDS = 1 / 30

/** Render snapshot target: 15 per second, inside the spec's 10-20 updates/s guidance. */
export const SNAPSHOT_INTERVAL_SECONDS = 1 / 15

/**
 * Catch-up cap. A delayed worker turn advances at most this many fixed steps,
 * so a backgrounded tab cannot spiral into unbounded work when it resumes.
 */
export const MAX_CATCH_UP_STEPS = 8

export const ENTITY_COUNT = 100
export const MIN_ENTITY_SPEED = 20
export const MAX_ENTITY_SPEED = 60
export const MIN_ENTITY_RADIUS = 1.5
export const MAX_ENTITY_RADIUS = 3.5

export const DEFAULT_SEED = 20261111

/** Supported speed multipliers; each multiplies fixed steps, never the timestep. */
export const SPEED_MULTIPLIERS = [1, 2, 5, 10] as const
export type SpeedMultiplier = (typeof SPEED_MULTIPLIERS)[number]
export const DEFAULT_SPEED_MULTIPLIER: SpeedMultiplier = 1

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  world: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
  entityCount: ENTITY_COUNT,
  seed: DEFAULT_SEED,
  minSpeed: MIN_ENTITY_SPEED,
  maxSpeed: MAX_ENTITY_SPEED,
  minRadius: MIN_ENTITY_RADIUS,
  maxRadius: MAX_ENTITY_RADIUS,
}
