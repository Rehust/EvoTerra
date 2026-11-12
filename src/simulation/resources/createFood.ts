import type { RandomSource } from '../core/random.ts'
import type { FoodResource, SimulationConfig, Terrain } from '../core/types.ts'
import { isPassableAt } from '../terrain/terrain.ts'
import { clampFoodAmount, regenerateFood } from './foodMath.ts'

/**
 * Deterministic food placement and bounded regeneration.
 *
 * Placement: the first `patchCount` passable candidates win; candidates are
 * drawn from the seeded RNG, so the same seed produces the same layout. Food
 * never spawns on rock and never starts depleted.
 */
export function createFoodResources(
  config: SimulationConfig,
  terrain: Terrain,
  random: RandomSource,
): FoodResource[] {
  const { world, food } = config
  const resources: FoodResource[] = []
  let id = 0
  let attempts = 0
  const maxAttempts = food.patchCount * 8

  while (resources.length < food.patchCount && attempts < maxAttempts) {
    attempts += 1
    const x = food.capacity + random.next() * (world.width - food.capacity * 2)
    const y = food.capacity + random.next() * (world.height - food.capacity * 2)
    if (!isPassableAt(terrain, x, y)) continue

    resources.push({
      id,
      x,
      y,
      amount: food.capacity,
      capacity: food.capacity,
      regenerationPerSecond: food.regenerationPerSecond,
    })
    id += 1
  }

  return resources
}

/** Advances food regeneration for one fixed step, clamped to capacity. */
export function stepFoodRegeneration(resources: FoodResource[], timestepSeconds: number): void {
  for (const resource of resources) {
    resource.amount = clampFoodAmount(
      regenerateFood(resource.amount, resource.regenerationPerSecond, timestepSeconds),
      resource.capacity,
    )
  }
}
