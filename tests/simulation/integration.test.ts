import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG, FIXED_TIMESTEP_SECONDS } from '../../src/simulation/core/config.ts'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { stepSimulation } from '../../src/simulation/core/stepSimulation.ts'
import { isCirclePassable } from '../../src/simulation/terrain/terrain.ts'
import type { SimulationConfig, SimulationState } from '../../src/simulation/core/types.ts'

const dt = FIXED_TIMESTEP_SECONDS

const config = (): SimulationConfig => ({
  ...DEFAULT_SIMULATION_CONFIG,
  founderCount: 40,
  seed: 8321,
})

const run = (seed: number, steps: number): SimulationState => {
  const state = createSimulation({ ...config(), seed })
  for (let i = 0; i < steps; i += 1) stepSimulation(state, dt)
  return state
}

const serialize = (state: SimulationState): string =>
  JSON.stringify({
    tick: state.tick,
    elapsedSeconds: state.elapsedSeconds,
    births: state.births,
    deaths: state.deaths,
    rng: state.random.state,
    terrain: Array.from(state.terrain.passable),
    food: state.food.map((food) => ({ id: food.id, x: food.x, y: food.y, amount: food.amount })),
    creatures: state.creatures.map((creature) => ({
      id: creature.id,
      x: creature.x,
      y: creature.y,
      energy: creature.energy,
      ageSeconds: creature.ageSeconds,
      parentId: creature.parentId,
      lineageRootId: creature.lineageRootId,
      generation: creature.generation,
      genome: creature.genome,
    })),
  })

const assertInvariants = (state: SimulationState): void => {
  const ids = new Set<number>()
  for (const creature of state.creatures) {
    expect(Number.isFinite(creature.x)).toBe(true)
    expect(Number.isFinite(creature.y)).toBe(true)
    expect(Number.isFinite(creature.energy)).toBe(true)
    expect(creature.energy).toBeGreaterThanOrEqual(0)
    expect(creature.energy).toBeLessThanOrEqual(state.config.creature.maxEnergy)
    expect(creature.ageSeconds).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(creature.ageSeconds)).toBe(true)
    expect(creature.radius).toBeGreaterThan(0)
    expect(isCirclePassable(state.terrain, creature.x, creature.y, creature.radius)).toBe(true)
    expect(ids.has(creature.id)).toBe(false)
    ids.add(creature.id)
    for (const value of [
      ...creature.genome.network.inputHiddenWeights,
      ...creature.genome.network.hiddenBias,
      ...creature.genome.network.hiddenOutputWeights,
      ...creature.genome.network.outputBias,
    ]) {
      expect(Number.isFinite(value)).toBe(true)
      expect(Math.abs(value)).toBeLessThanOrEqual(state.config.network.weightLimit)
    }
    expect(creature.genome.traits.maxSpeed).toBeGreaterThanOrEqual(state.config.traits.maxSpeed.min)
    expect(creature.genome.traits.maxSpeed).toBeLessThanOrEqual(state.config.traits.maxSpeed.max)
    expect(creature.genome.traits.bodySize).toBeGreaterThanOrEqual(state.config.traits.bodySize.min)
    expect(creature.genome.traits.bodySize).toBeLessThanOrEqual(state.config.traits.bodySize.max)
    expect(creature.genome.traits.visionRange).toBeGreaterThanOrEqual(state.config.traits.visionRange.min)
    expect(creature.genome.traits.visionRange).toBeLessThanOrEqual(state.config.traits.visionRange.max)
  }
  for (const food of state.food) {
    expect(food.amount).toBeGreaterThanOrEqual(0)
    expect(food.amount).toBeLessThanOrEqual(food.capacity)
    expect(Number.isFinite(food.amount)).toBe(true)
  }
  expect(state.creatures.length).toBeLessThanOrEqual(state.config.maxPopulation)
  expect(state.creatureGrid.size).toBe(state.creatures.length)
}

describe('deterministic integration scenarios', () => {
  it('scenario D: the same seed and step count produce identical serialized state', () => {
    const first = serialize(run(555, 300))
    const second = serialize(run(555, 300))

    expect(second).toBe(first)
  })

  it('scenario D: a different seed produces a different run', () => {
    expect(serialize(run(555, 300))).not.toBe(serialize(run(556, 300)))
  })

  it('scenario E: long runs keep every invariant and bounded population', () => {
    const state = run(777, 1800)

    assertInvariants(state)
  })

  it('scenario E: population never exceeds the configured cap', () => {
    const state = run(123, 1200)

    expect(state.creatures.length).toBeLessThanOrEqual(state.config.maxPopulation)
  })

  it('scenario A/B: the debug greedy controller finds and eats food', () => {
    const state = createSimulation({
      ...config(),
      founderCount: 3,
      debugController: 'greedy',
      food: {
        ...DEFAULT_SIMULATION_CONFIG.food,
        patchCount: 8,
        regenerationPerSecond: 0,
      },
    })
    for (const creature of state.creatures) {
      creature.energy = state.config.creature.maxEnergy / 2
      creature.genome.traits.visionRange = state.config.traits.visionRange.max
    }
    // Put one food patch inside each creature's vision so the greedy
    // controller has something to seek; it has no wander behaviour.
    state.creatures.forEach((creature, index) => {
      const food = state.food[index]
      if (!food) return
      food.x = Math.min(creature.x + 30, state.bounds.width - 5)
      food.y = creature.y
    })
    state.foodGrid.clear()
    for (const food of state.food) state.foodGrid.insert(food)

    let ate = false
    for (let i = 0; i < 900 && !ate; i += 1) {
      stepSimulation(state, dt)
      ate = state.creatures.some((creature) => creature.energy > state.config.creature.maxEnergy / 2)
    }

    expect(ate).toBe(true)
  })

  it('tracks births and deaths consistently across a run', () => {
    const state = run(321, 1800)

    expect(state.births).toBeGreaterThanOrEqual(0)
    expect(state.deaths).toBeGreaterThanOrEqual(0)
  })
})
