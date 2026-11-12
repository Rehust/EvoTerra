import { createRandom } from './random.ts'
import { rebuildCreatureGrid } from './indexes.ts'
import { createFounderCreature } from '../creatures/creature.ts'
import { validateGenome } from '../neural/genome.ts'
import { createStarterTerrain } from '../terrain/terrain.ts'
import { createFoodResources } from '../resources/createFood.ts'
import { SpatialGrid } from '../spatial/spatialGrid.ts'
import type {
  CreatureState,
  FoodResource,
  SimulationConfig,
  SimulationState,
} from './types.ts'

const requireFinite = (value: number, field: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`Simulation config ${field} must be a finite number, received ${value}`)
  }
  return value
}

const requirePositive = (value: number, field: string): number => {
  requireFinite(value, field)
  if (value <= 0) throw new Error(`Simulation config ${field} must be positive, received ${value}`)
  return value
}

const requireNonNegative = (value: number, field: string): number => {
  requireFinite(value, field)
  if (value < 0) throw new Error(`Simulation config ${field} must not be negative, received ${value}`)
  return value
}

const requireInteger = (value: number, field: string, minimum: number): number => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(
      `Simulation config ${field} must be an integer >= ${minimum}, received ${value}`,
    )
  }
  return value
}

const requireUnitRange = (value: number, field: string): number => {
  requireFinite(value, field)
  if (value < 0 || value > 1) {
    throw new Error(`Simulation config ${field} must be within [0, 1], received ${value}`)
  }
  return value
}

const requireTraitRange = (
  range: { readonly min: number; readonly max: number },
  field: string,
): void => {
  requirePositive(range.min, `${field}.min`)
  requireFinite(range.max, `${field}.max`)
  if (range.max < range.min) {
    throw new Error(
      `Simulation config ${field} max (${range.max}) must be >= min (${range.min})`,
    )
  }
}

/** Fails loudly on a config that could produce invalid or unbounded state. */
export function assertValidSimulationConfig(config: SimulationConfig): void {
  const { world } = config
  requirePositive(world?.width, 'world width')
  requirePositive(world?.height, 'world height')
  requireFinite(config.seed, 'seed')
  requireInteger(config.founderCount, 'founderCount', 1)
  requireInteger(config.maxPopulation, 'maxPopulation', 1)
  if (config.maxPopulation < config.founderCount) {
    throw new Error(
      `Simulation config maxPopulation (${config.maxPopulation}) must be >= founderCount (${config.founderCount})`,
    )
  }
  requirePositive(config.spatialCellSize, 'spatialCellSize')
  if (config.debugController !== 'neural' && config.debugController !== 'greedy') {
    throw new Error(`Simulation config debugController must be "neural" or "greedy"`)
  }

  requirePositive(config.terrain.cellSize, 'terrain.cellSize')
  requireInteger(config.terrain.rockClusterCount, 'terrain.rockClusterCount', 0)
  requireInteger(
    config.terrain.rockClusterMinRadiusCells,
    'terrain.rockClusterMinRadiusCells',
    1,
  )
  requireInteger(
    config.terrain.rockClusterMaxRadiusCells,
    'terrain.rockClusterMaxRadiusCells',
    1,
  )
  if (config.terrain.rockClusterMaxRadiusCells < config.terrain.rockClusterMinRadiusCells) {
    throw new Error(
      `Simulation config terrain.rockClusterMaxRadiusCells (${config.terrain.rockClusterMaxRadiusCells}) must be >= min (${config.terrain.rockClusterMinRadiusCells})`,
    )
  }

  requireInteger(config.food.patchCount, 'food.patchCount', 1)
  requirePositive(config.food.capacity, 'food.capacity')
  requireNonNegative(config.food.regenerationPerSecond, 'food.regenerationPerSecond')
  requirePositive(config.food.energyPerUnit, 'food.energyPerUnit')
  requirePositive(config.food.maxConsumedPerAction, 'food.maxConsumedPerAction')
  requireNonNegative(config.food.consumptionRadius, 'food.consumptionRadius')
  requirePositive(config.food.densitySaturation, 'food.densitySaturation')

  requirePositive(config.creature.baseRadius, 'creature.baseRadius')
  requirePositive(config.creature.baseMovementSpeed, 'creature.baseMovementSpeed')
  requirePositive(config.creature.maxEnergy, 'creature.maxEnergy')
  requireNonNegative(config.creature.basalMaintenancePerSecond, 'creature.basalMaintenancePerSecond')
  requireNonNegative(
    config.creature.movementEnergyPerWorldUnit,
    'creature.movementEnergyPerWorldUnit',
  )
  requireUnitRange(config.creature.eatOutputThreshold, 'creature.eatOutputThreshold')
  requirePositive(config.creature.boundaryPressureMargin, 'creature.boundaryPressureMargin')
  requirePositive(config.creature.neighborPerceptionRadius, 'creature.neighborPerceptionRadius')
  requirePositive(config.creature.neighborSaturation, 'creature.neighborSaturation')

  requireTraitRange(config.traits.maxSpeed, 'traits.maxSpeed')
  requireTraitRange(config.traits.bodySize, 'traits.bodySize')
  requireTraitRange(config.traits.visionRange, 'traits.visionRange')
  requireTraitRange(config.traits.metabolicEfficiency, 'traits.metabolicEfficiency')

  requirePositive(config.network.weightLimit, 'network.weightLimit')
  requirePositive(config.network.initialWeightRange, 'network.initialWeightRange')
  requirePositive(config.network.initialBiasRange, 'network.initialBiasRange')
  if (config.network.initialWeightRange > config.network.weightLimit) {
    throw new Error('Simulation config network.initialWeightRange must be <= network.weightLimit')
  }

  requireUnitRange(config.mutation.probability, 'mutation.probability')
  requirePositive(config.mutation.traitFraction, 'mutation.traitFraction')
  requirePositive(config.mutation.weightRange, 'mutation.weightRange')

  requireNonNegative(config.reproduction.minAgeSeconds, 'reproduction.minAgeSeconds')
  requireNonNegative(config.reproduction.cooldownSeconds, 'reproduction.cooldownSeconds')
  requirePositive(config.reproduction.energyThreshold, 'reproduction.energyThreshold')
  requirePositive(config.reproduction.offspringEnergyTransfer, 'reproduction.offspringEnergyTransfer')
  if (config.reproduction.energyThreshold <= config.reproduction.offspringEnergyTransfer) {
    throw new Error(
      'Simulation config reproduction.energyThreshold must exceed offspringEnergyTransfer so the parent survives',
    )
  }
  if (config.reproduction.energyThreshold > config.creature.maxEnergy) {
    throw new Error(
      'Simulation config reproduction.energyThreshold must not exceed creature.maxEnergy',
    )
  }
  requireUnitRange(config.reproduction.outputThreshold, 'reproduction.outputThreshold')
  requireInteger(config.reproduction.placementAttempts, 'reproduction.placementAttempts', 1)

  const maxRadius = config.creature.baseRadius * config.traits.bodySize.max
  if (world.width < maxRadius * 2 || world.height < maxRadius * 2) {
    throw new Error(
      `Simulation config world ${world.width}x${world.height} cannot contain max creature radius ${maxRadius}`,
    )
  }
}

/**
 * Builds the initial authoritative state. Pure: the same config (including the
 * seed) always produces the same terrain, food, founders, genomes, and RNG
 * state, so a reset replays exactly.
 */
export function createSimulation(config: SimulationConfig): SimulationState {
  assertValidSimulationConfig(config)

  const random = createRandom(config.seed)
  const terrain = createStarterTerrain(config, random)
  const food = createFoodResources(config, terrain, random)

  const foodGrid = new SpatialGrid<FoodResource>(
    config.spatialCellSize,
    config.world.width,
    config.world.height,
  )
  for (const resource of food) foodGrid.insert(resource)

  const creatures = Array.from({ length: config.founderCount }, (_, id) =>
    createFounderCreature(id, config, terrain, config.world, random),
  )
  for (const creature of creatures) validateGenome(creature.genome, config)

  const creatureGrid = new SpatialGrid<CreatureState>(
    config.spatialCellSize,
    config.world.width,
    config.world.height,
  )

  const state: SimulationState = {
    config,
    bounds: config.world,
    terrain,
    food,
    foodGrid,
    creatureGrid,
    creatures,
    random,
    tick: 0,
    elapsedSeconds: 0,
    births: 0,
    deaths: 0,
    nextCreatureId: config.founderCount,
  }
  rebuildCreatureGrid(state)
  return state
}
