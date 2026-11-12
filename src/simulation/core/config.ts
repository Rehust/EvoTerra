import type { SimulationConfig } from './types.ts'

/**
 * Central simulation tuning. Units:
 * - position: world units (1 unit = 1 renderer pixel at zoom 1)
 * - time: seconds
 * - speed: world units per second
 * - food: abstract food units; energy: abstract energy units
 *
 * These are starting values for a bounded test habitat, not biological claims
 * or permanent balance. Change them here so runs stay reproducible.
 */

/** World in world units. The terrain below is a bounded grassland test habitat. */
export const WORLD_WIDTH = 1024
export const WORLD_HEIGHT = 768

/** Fixed simulation step: 30 steps per second, independent of render cadence. */
export const FIXED_TIMESTEP_SECONDS = 1 / 30

/** Render snapshot target: 15 per second, inside the 10-20 updates/s guidance. */
export const SNAPSHOT_INTERVAL_SECONDS = 1 / 15

/** Summary statistics target: 1.33 per second (1-2 updates/s guidance). */
export const STATS_INTERVAL_SECONDS = 0.75

/**
 * Catch-up cap. A delayed worker turn advances at most this many fixed steps,
 * so a backgrounded tab cannot spiral into unbounded work when it resumes.
 */
export const MAX_CATCH_UP_STEPS = 8

export const DEFAULT_SEED = 20261111

/** Supported speed multipliers; each multiplies fixed steps, never the timestep. */
export const SPEED_MULTIPLIERS = [1, 2, 5, 10] as const
export type SpeedMultiplier = (typeof SPEED_MULTIPLIERS)[number]
export const DEFAULT_SPEED_MULTIPLIER: SpeedMultiplier = 1

export const FOUNDER_COUNT = 100
/** Hard population ceiling; reproduction is rejected at or above it. */
export const MAX_POPULATION = 400

/** Grassland grid: 64 x 48 cells at 16 world units per cell. */
export const TERRAIN_CELL_SIZE = 16
export const ROCK_CLUSTER_COUNT = 14
export const ROCK_CLUSTER_MIN_RADIUS_CELLS = 1
export const ROCK_CLUSTER_MAX_RADIUS_CELLS = 3

/** Spatial hash cell size for food and creature broad-phase queries. */
export const SPATIAL_CELL_SIZE = 64

/** Food patches start full and regenerate slowly to keep competition real. */
export const FOOD_PATCH_COUNT = 220
export const FOOD_PATCH_CAPACITY = 12
export const FOOD_REGENERATION_PER_SECOND = 0.3
export const FOOD_ENERGY_PER_UNIT = 10
export const MAX_FOOD_PER_EAT = 2
export const FOOD_CONSUMPTION_RADIUS = 12
export const FOOD_DENSITY_SATURATION = 40

export const CREATURE_BASE_RADIUS = 2.5
export const BASE_MOVEMENT_SPEED = 60
export const MAX_ENERGY = 100
export const BASAL_MAINTENANCE_PER_SECOND = 0.35
export const MOVEMENT_ENERGY_PER_WORLD_UNIT = 0.012
export const EAT_OUTPUT_THRESHOLD = 0.55
export const BOUNDARY_PRESSURE_MARGIN = 80
export const NEIGHBOR_PERCEPTION_RADIUS = 40
export const NEIGHBOR_SATURATION = 8

export const TRAIT_RANGES = {
  maxSpeed: { min: 0.65, max: 1.8 },
  bodySize: { min: 0.7, max: 1.4 },
  visionRange: { min: 48, max: 128 },
  metabolicEfficiency: { min: 0.7, max: 1.3 },
} as const

/** Network weights and biases are clamped to +/- this absolute bound. */
export const NETWORK_WEIGHT_LIMIT = 4
export const NETWORK_INITIAL_WEIGHT_RANGE = 0.8
export const NETWORK_INITIAL_BIAS_RANGE = 0.25

/** Mutation: 2% per scalar gene, small bounded perturbations. */
export const MUTATION_PROBABILITY = 0.02
export const TRAIT_MUTATION_FRACTION = 0.1
export const WEIGHT_MUTATION_RANGE = 0.15

export const REPRODUCTION_MIN_AGE_SECONDS = 20
export const REPRODUCTION_COOLDOWN_SECONDS = 12
export const REPRODUCTION_ENERGY_THRESHOLD = 60
export const OFFSPRING_ENERGY_TRANSFER = 30
export const REPRODUCE_OUTPUT_THRESHOLD = 0.8
export const OFFSPRING_PLACEMENT_ATTEMPTS = 16

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  world: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
  seed: DEFAULT_SEED,
  founderCount: FOUNDER_COUNT,
  maxPopulation: MAX_POPULATION,
  spatialCellSize: SPATIAL_CELL_SIZE,
  debugController: 'neural',
  terrain: {
    cellSize: TERRAIN_CELL_SIZE,
    rockClusterCount: ROCK_CLUSTER_COUNT,
    rockClusterMinRadiusCells: ROCK_CLUSTER_MIN_RADIUS_CELLS,
    rockClusterMaxRadiusCells: ROCK_CLUSTER_MAX_RADIUS_CELLS,
  },
  food: {
    patchCount: FOOD_PATCH_COUNT,
    capacity: FOOD_PATCH_CAPACITY,
    regenerationPerSecond: FOOD_REGENERATION_PER_SECOND,
    energyPerUnit: FOOD_ENERGY_PER_UNIT,
    maxConsumedPerAction: MAX_FOOD_PER_EAT,
    consumptionRadius: FOOD_CONSUMPTION_RADIUS,
    densitySaturation: FOOD_DENSITY_SATURATION,
  },
  creature: {
    baseRadius: CREATURE_BASE_RADIUS,
    baseMovementSpeed: BASE_MOVEMENT_SPEED,
    maxEnergy: MAX_ENERGY,
    basalMaintenancePerSecond: BASAL_MAINTENANCE_PER_SECOND,
    movementEnergyPerWorldUnit: MOVEMENT_ENERGY_PER_WORLD_UNIT,
    eatOutputThreshold: EAT_OUTPUT_THRESHOLD,
    boundaryPressureMargin: BOUNDARY_PRESSURE_MARGIN,
    neighborPerceptionRadius: NEIGHBOR_PERCEPTION_RADIUS,
    neighborSaturation: NEIGHBOR_SATURATION,
  },
  traits: TRAIT_RANGES,
  network: {
    weightLimit: NETWORK_WEIGHT_LIMIT,
    initialWeightRange: NETWORK_INITIAL_WEIGHT_RANGE,
    initialBiasRange: NETWORK_INITIAL_BIAS_RANGE,
  },
  mutation: {
    probability: MUTATION_PROBABILITY,
    traitFraction: TRAIT_MUTATION_FRACTION,
    weightRange: WEIGHT_MUTATION_RANGE,
  },
  reproduction: {
    minAgeSeconds: REPRODUCTION_MIN_AGE_SECONDS,
    cooldownSeconds: REPRODUCTION_COOLDOWN_SECONDS,
    energyThreshold: REPRODUCTION_ENERGY_THRESHOLD,
    offspringEnergyTransfer: OFFSPRING_ENERGY_TRANSFER,
    outputThreshold: REPRODUCE_OUTPUT_THRESHOLD,
    placementAttempts: OFFSPRING_PLACEMENT_ATTEMPTS,
  },
}
