import { describe, expect, it } from 'vitest'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import { validateGenome } from '../../src/simulation/neural/genome.ts'
import { isCirclePassable } from '../../src/simulation/terrain/terrain.ts'
import { isPassableAt } from '../../src/simulation/terrain/terrain.ts'
import type { SimulationConfig } from '../../src/simulation/core/types.ts'

const config = (): SimulationConfig => ({
  ...DEFAULT_SIMULATION_CONFIG,
  founderCount: 12,
  seed: 4242,
})

describe('createSimulation', () => {
  it('creates the configured founders with stable ids and lineage roots', () => {
    const state = createSimulation(config())

    expect(state.creatures).toHaveLength(12)
    expect(state.creatures.map((creature) => creature.id)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ])
    for (const creature of state.creatures) {
      expect(creature.parentId).toBeNull()
      expect(creature.lineageRootId).toBe(creature.id)
      expect(creature.generation).toBe(0)
      expect(creature.alive).toBe(true)
      expect(() => validateGenome(creature.genome, state.config)).not.toThrow()
    }
    expect(state.tick).toBe(0)
    expect(state.births).toBe(0)
    expect(state.deaths).toBe(0)
    expect(state.nextCreatureId).toBe(12)
  })

  it('reproduces identical world, food, and founder data for the same seed', () => {
    const first = createSimulation(config())
    const second = createSimulation(config())

    expect(second.creatures).toEqual(first.creatures)
    expect(second.food).toEqual(first.food)
    expect(second.terrain.passable).toEqual(first.terrain.passable)
  })

  it('produces different data for a different seed', () => {
    const other = createSimulation({ ...config(), seed: 999 })

    expect(other.creatures).not.toEqual(createSimulation(config()).creatures)
  })

  it('places every founder on passable terrain inside the world', () => {
    const state = createSimulation(config())

    for (const creature of state.creatures) {
      expect(isCirclePassable(state.terrain, creature.x, creature.y, creature.radius)).toBe(true)
      expect(creature.x).toBeGreaterThanOrEqual(creature.radius)
      expect(creature.x).toBeLessThanOrEqual(state.bounds.width - creature.radius)
      expect(creature.y).toBeGreaterThanOrEqual(creature.radius)
      expect(creature.y).toBeLessThanOrEqual(state.bounds.height - creature.radius)
    }
  })

  it('places every food patch on passable terrain', () => {
    const state = createSimulation(config())

    for (const food of state.food) {
      expect(isPassableAt(state.terrain, food.x, food.y)).toBe(true)
      expect(food.amount).toBe(food.capacity)
    }
  })

  it('indexes every live creature and food patch for nearby queries', () => {
    const state = createSimulation(config())

    expect(state.creatureGrid.size).toBe(state.creatures.length)
    expect(state.foodGrid.size).toBe(state.food.length)
  })

  it('draws the random source from the seed so a rebuilt run can be replayed', () => {
    const first = createSimulation(config())
    const second = createSimulation(config())

    expect(first.random.state).toBe(second.random.state)
    expect(first.random.next()).toBe(second.random.next())
  })

  it('rejects configuration values that would produce invalid or unbounded state', () => {
    expect(() => createSimulation({ ...config(), founderCount: 0 })).toThrow(/founderCount/)
    expect(() => createSimulation({ ...config(), founderCount: 2.5 })).toThrow(/founderCount/)
    expect(() =>
      createSimulation({ ...config(), world: { width: Number.NaN, height: 100 } }),
    ).toThrow(/world width/)
    expect(() =>
      createSimulation({ ...config(), food: { ...config().food, capacity: 0 } }),
    ).toThrow(/food.capacity/)
    expect(() =>
      createSimulation({ ...config(), mutation: { ...config().mutation, probability: 2 } }),
    ).toThrow(/mutation.probability/)
    expect(() =>
      createSimulation({
        ...config(),
        reproduction: {
          ...config().reproduction,
          offspringEnergyTransfer: config().reproduction.energyThreshold,
        },
      }),
    ).toThrow(/energyThreshold/)
    expect(() =>
      createSimulation({ ...config(), maxPopulation: 1 }),
    ).toThrow(/maxPopulation/)
  })

  it('rejects a world too small to contain the largest creature', () => {
    expect(() =>
      createSimulation({ ...config(), world: { width: 4, height: 4 }, founderCount: 1 }),
    ).toThrow(/cannot contain/)
  })
})
