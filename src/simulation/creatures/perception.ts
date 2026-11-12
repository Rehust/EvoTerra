import type {
  CreatureState,
  FoodResource,
  NeuralInputs,
  SimulationState,
} from '../core/types.ts'

/**
 * Local perception. A creature only sees food inside its inherited vision range
 * and nearby creatures inside a fixed perception radius. No global coordinates
 * or population totals leak into the inputs.
 *
 * Simplification: terrain does not block line of sight in this first version;
 * it does block movement. Documented limitation.
 */

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const findNearestFood = (
  creature: CreatureState,
  candidates: readonly FoodResource[],
  visionRange: number,
): { readonly food: FoodResource | null; readonly distance: number; readonly totalAmount: number } => {
  let nearest: FoodResource | null = null
  let nearestSquared = Number.POSITIVE_INFINITY
  let totalAmount = 0

  // Candidates arrive sorted by ascending id, so a strict `<` keeps the lower
  // id when two resources are exactly equidistant.
  for (const food of candidates) {
    if (food.amount <= 0) continue
    totalAmount += food.amount
    const dx = food.x - creature.x
    const dy = food.y - creature.y
    const squared = dx * dx + dy * dy
    if (squared > visionRange * visionRange) continue
    if (squared < nearestSquared) {
      nearest = food
      nearestSquared = squared
    }
  }

  return {
    food: nearest,
    distance: nearest === null ? Number.POSITIVE_INFINITY : Math.sqrt(nearestSquared),
    totalAmount,
  }
}

export function perceiveCreature(creature: CreatureState, state: SimulationState): NeuralInputs {
  const { config, bounds } = state
  const visionRange = creature.genome.traits.visionRange
  const foodInRange = state.foodGrid.queryRadius(creature.x, creature.y, visionRange)
  const nearest = findNearestFood(creature, foodInRange, visionRange)

  let foodDirectionX = 0
  let foodDirectionY = 0
  let foodProximity = 0
  if (nearest.food !== null && nearest.distance > 1e-9) {
    foodDirectionX = clamp((nearest.food.x - creature.x) / nearest.distance, -1, 1)
    foodDirectionY = clamp((nearest.food.y - creature.y) / nearest.distance, -1, 1)
    foodProximity = clamp(1 - nearest.distance / visionRange, 0, 1)
  }

  const nearbyCreatures = state.creatureGrid
    .queryRadius(creature.x, creature.y, config.creature.neighborPerceptionRadius)
    .filter((other) => other.id !== creature.id && other.alive).length

  const margin = config.creature.boundaryPressureMargin
  const edgePressureX = clamp(1 - Math.min(creature.x, bounds.width - creature.x) / margin, 0, 1)
  const edgePressureY = clamp(1 - Math.min(creature.y, bounds.height - creature.y) / margin, 0, 1)

  return {
    foodDirectionX,
    foodDirectionY,
    foodProximity,
    localFoodDensity: clamp(nearest.totalAmount / config.food.densitySaturation, 0, 1),
    nearbyCreatureDensity: clamp(
      nearbyCreatures / config.creature.neighborSaturation,
      0,
      1,
    ),
    energyRatio: clamp(creature.energy / config.creature.maxEnergy, 0, 1),
    boundaryPressureX: creature.x < bounds.width / 2 ? edgePressureX : -edgePressureX,
    boundaryPressureY: creature.y < bounds.height / 2 ? edgePressureY : -edgePressureY,
  }
}
