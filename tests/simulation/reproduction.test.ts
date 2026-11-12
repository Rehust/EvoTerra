import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { tryReproduce } from '../../src/simulation/creatures/reproduction.ts'
import { stepSimulation } from '../../src/simulation/core/stepSimulation.ts'
import type { SimulationConfig, SimulationState } from '../../src/simulation/core/types.ts'

const makeConfig = (): SimulationConfig => ({
  ...DEFAULT_SIMULATION_CONFIG,
  founderCount: 2,
  maxPopulation: 10,
  terrain: { ...DEFAULT_SIMULATION_CONFIG.terrain, rockClusterCount: 0 },
  food: {
    ...DEFAULT_SIMULATION_CONFIG.food,
    patchCount: 1,
    regenerationPerSecond: 0,
  },
})

/** Places creature 0 at the world centre, fertile, and returns it. */
const makeFertileParent = (state: SimulationState) => {
  const parent = state.creatures[0]!
  parent.x = state.bounds.width / 2
  parent.y = state.bounds.height / 2
  parent.energy = 80
  parent.ageSeconds = 25
  parent.reproductionCooldownSeconds = 0
  parent.wantsReproduce = true
  return parent
}

describe('reproduction', () => {
  it('creates one offspring with an exact energy transfer', () => {
    const state = createSimulation(makeConfig())
    const parent = makeFertileParent(state)

    const child = tryReproduce(state, parent)

    expect(child).not.toBeNull()
    expect(child!.parentId).toBe(parent.id)
    expect(child!.lineageRootId).toBe(parent.lineageRootId)
    expect(child!.generation).toBe(1)
    expect(child!.energy).toBe(state.config.reproduction.offspringEnergyTransfer)
    expect(parent.energy).toBe(80 - state.config.reproduction.offspringEnergyTransfer)
    expect(state.births).toBe(1)
    expect(state.creatures).toHaveLength(3)
    expect(state.nextCreatureId).toBe(state.config.founderCount + 1)
  })

  it('gives the child distinct genome arrays without touching the parent', () => {
    const state = createSimulation(makeConfig())
    const parent = makeFertileParent(state)
    const parentSnapshot = structuredClone(parent.genome)

    const child = tryReproduce(state, parent)!
    expect(child).not.toBeNull()

    expect(child!.genome).not.toBe(parent.genome)
    expect(child!.genome.network.inputHiddenWeights).not.toBe(
      parent.genome.network.inputHiddenWeights,
    )
    expect(parent.genome).toEqual(parentSnapshot)
  })

  it('is deterministic: the same seed yields the same child genome', () => {
    const childGenome = (): { child: unknown; parent: unknown } => {
      const state = createSimulation(makeConfig())
      const parent = makeFertileParent(state)
      const child = tryReproduce(state, parent)!
      expect(child).not.toBeNull()
      return { child: structuredClone(child!.genome), parent: structuredClone(parent.genome) }
    }

    const first = childGenome()
    const second = childGenome()

    expect(second.child).toEqual(first.child)
    expect(second.parent).toEqual(first.parent)
  })

  it('rejects dead, under-age, low-energy, cooling-down, or unwilling parents', () => {
    const state = createSimulation(makeConfig())
    const parent = makeFertileParent(state)

    const unwilling = { ...state, creatures: state.creatures }
    parent.wantsReproduce = false
    expect(tryReproduce(unwilling, parent)).toBeNull()
    parent.wantsReproduce = true

    parent.ageSeconds = state.config.reproduction.minAgeSeconds - 0.01
    expect(tryReproduce(state, parent)).toBeNull()
    parent.ageSeconds = 25

    parent.energy = state.config.reproduction.energyThreshold - 0.01
    expect(tryReproduce(state, parent)).toBeNull()
    parent.energy = 80

    parent.reproductionCooldownSeconds = 1
    expect(tryReproduce(state, parent)).toBeNull()
    parent.reproductionCooldownSeconds = 0

    const capped = { ...makeConfig(), maxPopulation: 2 }
    const smallState = createSimulation(capped)
    const smallParent = makeFertileParent(smallState)
    expect(tryReproduce(smallState, smallParent)).toBeNull()
    expect(smallState.births).toBe(0)
  })

  it('fails cleanly when no valid offspring position exists', () => {
    const state = createSimulation(makeConfig())
    const parent = makeFertileParent(state)
    state.terrain.passable.fill(0)

    const child = tryReproduce(state, parent)

    expect(child).toBeNull()
    expect(parent.energy).toBe(80)
    expect(state.births).toBe(0)
    expect(state.nextCreatureId).toBe(state.config.founderCount)
  })

  it('applies the reproduction cooldown so the parent cannot spam offspring', () => {
    const state = createSimulation(makeConfig())
    const parent = makeFertileParent(state)

    expect(tryReproduce(state, parent)).not.toBeNull()
    expect(parent.reproductionCooldownSeconds).toBe(state.config.reproduction.cooldownSeconds)
    expect(tryReproduce(state, parent)).toBeNull()
  })

  it('never lets a newborn act in its birth tick', () => {
    const state = createSimulation(makeConfig())
    const parent = makeFertileParent(state)
    // Zero hidden weights + a high reproduce bias: no movement, no eating.
    // Biases stay inside the validated +/-4 limit.
    parent.genome.network.outputBias = [0, 0, -4, 4]
    parent.genome.network.hiddenOutputWeights.fill(0)

    stepSimulation(state, 1 / 30)

    const child = state.creatures.find((creature) => creature.parentId === parent.id)
    expect(child).toBeDefined()
    expect(child!.ageSeconds).toBe(0)
    expect(child!.lastInputs.foodProximity).toBe(0)
    expect(child!.lastInputs.foodDirectionX).toBe(0)
    expect(child!.lastMovementDistance).toBe(0)
  })
})
