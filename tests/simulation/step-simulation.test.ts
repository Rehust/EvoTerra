import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG, FIXED_TIMESTEP_SECONDS } from '../../src/simulation/core/config.ts'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { stepSimulation } from '../../src/simulation/core/stepSimulation.ts'
import { computeBasalCost, computeMovementCost } from '../../src/simulation/creatures/energy.ts'
import type { SimulationConfig, SimulationState } from '../../src/simulation/core/types.ts'

const dt = FIXED_TIMESTEP_SECONDS

const makeConfig = (): SimulationConfig => ({
  ...DEFAULT_SIMULATION_CONFIG,
  founderCount: 1,
  maxPopulation: 10,
  terrain: { ...DEFAULT_SIMULATION_CONFIG.terrain, rockClusterCount: 0 },
  food: { ...DEFAULT_SIMULATION_CONFIG.food, patchCount: 1, regenerationPerSecond: 0 },
})

/** Zero hidden weights: outputs are exactly the output biases. */
const setOutputs = (state: SimulationState, id: number, outputs: readonly [number, number, number, number]) => {
  const creature = state.creatures.find((candidate) => candidate.id === id)!
  creature.genome.network.hiddenOutputWeights.fill(0)
  creature.genome.network.outputBias = [...outputs]
  creature.genome.traits.maxSpeed = 1
  creature.genome.traits.bodySize = 1
  creature.genome.traits.metabolicEfficiency = 1
  creature.genome.traits.visionRange = 64
  return creature
}

const placeFoodAt = (state: SimulationState, x: number, y: number, amount: number) => {
  const food = state.food[0]!
  food.x = x
  food.y = y
  food.amount = amount
  state.foodGrid.clear()
  state.foodGrid.insert(food)
  return food
}

describe('movement', () => {
  it('moves by the network movement output, speed trait, and fixed timestep', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [1, 0, 0, 0])
    creature.x = 500
    creature.y = 400
    const startX = creature.x

    stepSimulation(state, dt)

    expect(creature.x).toBeCloseTo(startX + Math.tanh(1) * 60 * dt, 10)
    expect(creature.y).toBe(400)
    expect(creature.lastMovementDistance).toBeCloseTo(Math.tanh(1) * 60 * dt, 10)
  })

  it('normalizes a movement vector whose magnitude exceeds one', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [1, 1, 0, 0])
    creature.x = 500
    creature.y = 400

    stepSimulation(state, dt)

    expect(creature.lastMovementDistance).toBeCloseTo(60 * dt, 10)
  })

  it('keeps a zero-output creature still', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [0, 0, 0, 0])
    creature.x = 500
    creature.y = 400

    stepSimulation(state, dt)

    expect(creature.x).toBe(500)
    expect(creature.y).toBe(400)
    expect(creature.lastMovementDistance).toBe(0)
  })

  it('does not enter an impassable rock column', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [1, 0, 0, 0])
    creature.x = 95
    creature.y = 100
    // Block the whole column covering x = 96..112 world units.
    const col = Math.floor(96 / state.terrain.cellSize)
    for (let row = 0; row < state.terrain.rows; row += 1) {
      state.terrain.passable[row * state.terrain.cols + col] = 0
    }

    stepSimulation(state, dt)

    expect(creature.x).toBe(95)
    expect(creature.lastMovementDistance).toBe(0)
  })

  it('rejects a non-finite or negative timestep', () => {
    const state = createSimulation(makeConfig())
    expect(() => stepSimulation(state, -dt)).toThrow(/timestep/i)
    expect(() => stepSimulation(state, Number.NaN)).toThrow(/timestep/i)
  })
})

describe('eating', () => {
  it('consumes at most the per-action amount and converts it to energy', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [0, 0, 10, 0])
    creature.x = 500
    creature.y = 400
    creature.energy = 50
    const food = placeFoodAt(state, 500, 400, 12)

    stepSimulation(state, dt)

    expect(food.amount).toBe(10)
    expect(creature.energy).toBeCloseTo(
      50 + 2 * state.config.food.energyPerUnit - computeBasalCost(state.config, creature.genome.traits, dt),
      10,
    )
  })

  it('does not eat when the eat output is below the threshold', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [0, 0, 0, 0])
    creature.x = 500
    creature.y = 400
    const food = placeFoodAt(state, 500, 400, 12)

    stepSimulation(state, dt)

    expect(food.amount).toBe(12)
  })

  it('resolves contention in stable id order without over-consuming', () => {
    const config = { ...makeConfig(), founderCount: 2 }
    const state = createSimulation(config)
    const first = setOutputs(state, 0, [0, 0, 10, 0])
    const second = setOutputs(state, 1, [0, 0, 10, 0])
    first.x = 500
    first.y = 400
    first.energy = 50
    second.x = 500
    second.y = 400
    second.energy = 50
    const food = placeFoodAt(state, 500, 400, 3)

    stepSimulation(state, dt)

    expect(food.amount).toBe(0)
    expect(first.energy).toBeCloseTo(
      50 + 2 * state.config.food.energyPerUnit - computeBasalCost(state.config, first.genome.traits, dt),
      10,
    )
    expect(second.energy).toBeCloseTo(
      50 + 1 * state.config.food.energyPerUnit - computeBasalCost(state.config, second.genome.traits, dt),
      10,
    )
  })

  it('clamps energy to the maximum instead of banking overflow', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [0, 0, 10, 0])
    creature.x = 500
    creature.y = 400
    creature.energy = 95
    placeFoodAt(state, 500, 400, 12)

    stepSimulation(state, dt)

    expect(creature.energy).toBeLessThanOrEqual(state.config.creature.maxEnergy)
    expect(creature.energy).toBeCloseTo(
      state.config.creature.maxEnergy - computeBasalCost(state.config, creature.genome.traits, dt),
      10,
    )
  })
})

describe('energy and death', () => {
  it('applies basal cost and movement cost from the actual displacement', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [1, 0, 0, 0])
    creature.x = 500
    creature.y = 400
    creature.energy = 50

    stepSimulation(state, dt)

    const basal = computeBasalCost(state.config, creature.genome.traits, dt)
    const movement = computeMovementCost(state.config, creature.genome.traits, creature.lastMovementDistance)
    expect(basal).toBeGreaterThan(0)
    expect(movement).toBeGreaterThan(0)
    expect(creature.energy).toBeCloseTo(50 - basal - movement, 10)
  })

  it('kills a starving creature exactly once and removes it from live state', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [0, 0, 0, 0])
    creature.energy = 0.001
    placeFoodAt(state, 500, 400, 12)

    stepSimulation(state, dt)

    expect(creature.alive).toBe(false)
    expect(state.creatures).toHaveLength(0)
    expect(state.deaths).toBe(1)
    expect(state.creatureGrid.size).toBe(0)

    for (let i = 0; i < 10; i += 1) stepSimulation(state, dt)
    expect(state.deaths).toBe(1)
  })

  it('advances age and decreases reproduction cooldown', () => {
    const state = createSimulation(makeConfig())
    const creature = setOutputs(state, 0, [0, 0, 0, 0])
    creature.reproductionCooldownSeconds = 1

    stepSimulation(state, dt)

    expect(creature.ageSeconds).toBeCloseTo(dt, 10)
    expect(creature.reproductionCooldownSeconds).toBeCloseTo(1 - dt, 10)
  })

  it('documents the energy formulas with units', () => {
    const state = createSimulation(makeConfig())
    const traits = { maxSpeed: 1, bodySize: 2, visionRange: 64, metabolicEfficiency: 0.5 }

    expect(computeBasalCost(state.config, traits, 2)).toBeCloseTo(
      (state.config.creature.basalMaintenancePerSecond * 2) / 0.5 * 2,
      10,
    )
    expect(computeMovementCost(state.config, traits, 10)).toBeCloseTo(
      state.config.creature.movementEnergyPerWorldUnit * 2 * 10,
      10,
    )
  })
})
