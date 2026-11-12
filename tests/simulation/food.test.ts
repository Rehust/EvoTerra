import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import { createRandom } from '../../src/simulation/core/random.ts'
import { createStarterTerrain, isPassableAt } from '../../src/simulation/terrain/terrain.ts'
import {
  createFoodResources,
  stepFoodRegeneration,
} from '../../src/simulation/resources/createFood.ts'
import { clampFoodAmount, regenerateFood } from '../../src/simulation/resources/foodMath.ts'
import type { FoodResource } from '../../src/simulation/core/types.ts'

const config = DEFAULT_SIMULATION_CONFIG

const makeTerrain = () => createStarterTerrain(config, createRandom(11))

describe('food resources', () => {
  it('places the configured number of full patches on passable terrain', () => {
    const terrain = makeTerrain()
    const food = createFoodResources(config, terrain, createRandom(22))

    expect(food).toHaveLength(config.food.patchCount)
    for (const resource of food) {
      expect(resource.amount).toBe(resource.capacity)
      expect(resource.capacity).toBe(config.food.capacity)
      expect(isPassableAt(terrain, resource.x, resource.y)).toBe(true)
    }
  })

  it('is reproducible from the same seed', () => {
    const terrain = makeTerrain()
    const first = createFoodResources(config, terrain, createRandom(22))
    const second = createFoodResources(config, terrain, createRandom(22))

    expect(first).toEqual(second)
  })

  it('produces a different layout for a different seed', () => {
    const terrain = makeTerrain()
    const first = createFoodResources(config, terrain, createRandom(22))
    const second = createFoodResources(config, terrain, createRandom(23))

    expect(first).not.toEqual(second)
  })

  it('regenerates a depleted patch and never exceeds capacity', () => {
    const resource: FoodResource = {
      id: 0,
      x: 10,
      y: 10,
      amount: 0,
      capacity: 12,
      regenerationPerSecond: 0.5,
    }
    stepFoodRegeneration([resource], 1)
    expect(resource.amount).toBeCloseTo(0.5, 10)

    resource.amount = 11.9
    stepFoodRegeneration([resource], 1)
    expect(resource.amount).toBe(12)
  })

  it('leaves amount unchanged when regeneration is zero', () => {
    expect(regenerateFood(3, 0, 1)).toBe(3)
  })

  it('rejects/clamps invalid amounts at the food-math boundary', () => {
    expect(clampFoodAmount(Number.NaN, 12)).toBe(0)
    expect(clampFoodAmount(-2, 12)).toBe(0)
    expect(clampFoodAmount(50, 12)).toBe(12)
    expect(regenerateFood(Number.NaN, 1, 1)).toBe(0)
  })
})
