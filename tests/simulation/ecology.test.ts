import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG, FIXED_TIMESTEP_SECONDS } from '../../src/simulation/core/config.ts'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { stepSimulation } from '../../src/simulation/core/stepSimulation.ts'

/**
 * Deterministic ecology regression: 120 simulated seconds of the default
 * habitat must keep the population alive, produce both births and deaths, and
 * keep every value finite. The exact numbers depend on the tuning constants;
 * a failure here means the energy/food balance no longer sustains a population.
 */
describe('ecology', () => {
  it('sustains a population with births and deaths over 120 simulated seconds', () => {
    const state = createSimulation({
      ...DEFAULT_SIMULATION_CONFIG,
      founderCount: 100,
      maxPopulation: 400,
    })
    const founders = state.creatures.length

    for (let step = 0; step < 3600; step += 1) stepSimulation(state, FIXED_TIMESTEP_SECONDS)

    expect(state.creatures.length).toBeGreaterThan(0)
    expect(state.creatures.length).toBeLessThanOrEqual(state.config.maxPopulation)
    expect(state.births).toBeGreaterThan(0)
    expect(state.deaths).toBeGreaterThan(0)
    expect(state.births + founders).toBeGreaterThanOrEqual(state.creatures.length)
    expect(state.creatureGrid.size).toBe(state.creatures.length)

    for (const creature of state.creatures) {
      expect(Number.isFinite(creature.x)).toBe(true)
      expect(Number.isFinite(creature.y)).toBe(true)
      expect(creature.energy).toBeGreaterThanOrEqual(0)
      expect(creature.energy).toBeLessThanOrEqual(state.config.creature.maxEnergy)
      expect(creature.ageSeconds).toBeGreaterThan(0)
    }
    for (const food of state.food) {
      expect(food.amount).toBeGreaterThanOrEqual(0)
      expect(food.amount).toBeLessThanOrEqual(food.capacity)
    }
  })
})
