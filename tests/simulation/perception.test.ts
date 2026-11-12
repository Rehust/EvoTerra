import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { rebuildCreatureGrid } from '../../src/simulation/core/indexes.ts'
import { perceiveCreature } from '../../src/simulation/creatures/perception.ts'
import type { SimulationState } from '../../src/simulation/core/types.ts'

const makeState = (): SimulationState => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    founderCount: 2,
    maxPopulation: 10,
    terrain: { ...DEFAULT_SIMULATION_CONFIG.terrain, rockClusterCount: 0 },
    food: { ...DEFAULT_SIMULATION_CONFIG.food, patchCount: 2, regenerationPerSecond: 0 },
  }
  const state = createSimulation(config)
  const [first, second] = state.creatures
  if (!first || !second) throw new Error('expected two founders')

  first.x = 100
  first.y = 100
  first.energy = config.creature.maxEnergy / 2
  first.genome.traits.visionRange = 128
  second.x = 120
  second.y = 100
  second.energy = config.creature.maxEnergy / 2

  const [foodA, foodB] = state.food
  if (!foodA || !foodB) throw new Error('expected two food patches')
  foodA.x = 140
  foodA.y = 100
  foodA.amount = 5
  foodB.x = 200
  foodB.y = 100
  foodB.amount = 5

  state.foodGrid.clear()
  for (const food of state.food) state.foodGrid.insert(food)
  rebuildCreatureGrid(state)
  return state
}

describe('creature perception', () => {
  it('points at the nearest available food with normalized inputs', () => {
    const state = makeState()
    const creature = state.creatures[0]!
    const inputs = perceiveCreature(creature, state)

    expect(inputs.foodDirectionX).toBeCloseTo(1, 10)
    expect(inputs.foodDirectionY).toBeCloseTo(0, 10)
    expect(inputs.foodProximity).toBeCloseTo(1 - 40 / 128, 10)
    // Both patches are inside vision: (5 + 5) / 40.
    expect(inputs.localFoodDensity).toBeCloseTo(0.25, 10)
    expect(inputs.energyRatio).toBeCloseTo(0.5, 10)
  })

  it('returns neutral food inputs when no food is available', () => {
    const state = makeState()
    for (const food of state.food) food.amount = 0
    const creature = state.creatures[0]!

    const inputs = perceiveCreature(creature, state)

    expect(inputs.foodDirectionX).toBe(0)
    expect(inputs.foodDirectionY).toBe(0)
    expect(inputs.foodProximity).toBe(0)
    expect(inputs.localFoodDensity).toBe(0)
  })

  it('counts nearby live creatures but excludes itself', () => {
    const state = makeState()
    const creature = state.creatures[0]!

    const inputs = perceiveCreature(creature, state)

    expect(inputs.nearbyCreatureDensity).toBeCloseTo(1 / state.config.creature.neighborSaturation, 10)
  })

  it('pushes inward near an edge and is neutral away from it', () => {
    const state = makeState()
    const creature = state.creatures[0]!

    creature.x = 10
    creature.y = 10
    rebuildCreatureGrid(state)
    const nearEdge = perceiveCreature(creature, state)
    expect(nearEdge.boundaryPressureX).toBeCloseTo(1 - 10 / 80, 10)
    expect(nearEdge.boundaryPressureY).toBeCloseTo(1 - 10 / 80, 10)

    creature.x = 500
    creature.y = 384
    rebuildCreatureGrid(state)
    const centre = perceiveCreature(creature, state)
    // The vertical push negates a zero magnitude, which yields -0; both are
    // neutral. Assert the magnitude rather than the sign of zero.
    expect(Math.abs(centre.boundaryPressureX)).toBeCloseTo(0, 12)
    expect(Math.abs(centre.boundaryPressureY)).toBeCloseTo(0, 12)
  })

  it('keeps every input within its documented range', () => {
    const state = makeState()
    const creature = state.creatures[0]!
    creature.x = 0
    creature.y = 0
    creature.energy = state.config.creature.maxEnergy * 5
    rebuildCreatureGrid(state)

    const inputs = perceiveCreature(creature, state)

    for (const value of Object.values(inputs)) {
      expect(value).toBeGreaterThanOrEqual(-1)
      expect(value).toBeLessThanOrEqual(1)
    }
    expect(inputs.foodProximity).toBeGreaterThanOrEqual(0)
    expect(inputs.foodProximity).toBeLessThanOrEqual(1)
    expect(inputs.energyRatio).toBeCloseTo(1, 10)
  })
})
