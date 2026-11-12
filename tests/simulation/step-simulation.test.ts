import { describe, expect, it } from 'vitest'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { stepSimulation } from '../../src/simulation/core/stepSimulation.ts'
import { DEFAULT_SIMULATION_CONFIG, FIXED_TIMESTEP_SECONDS } from '../../src/simulation/core/config.ts'
import type { SimulationState } from '../../src/simulation/core/types.ts'

const config = { ...DEFAULT_SIMULATION_CONFIG, entityCount: 8, seed: 777 }
const dt = FIXED_TIMESTEP_SECONDS

const singleEntityState = (x: number, y: number, vx: number, vy: number): SimulationState => {
  const state = createSimulation({ ...config, entityCount: 1 })
  const entity = state.entities[0]
  if (!entity) throw new Error('expected one entity')
  state.entities[0] = { ...entity, x, y, vx, vy, radius: 2 }
  return state
}

describe('stepSimulation', () => {
  it('moves entities by velocity times the fixed timestep', () => {
    const state = singleEntityState(100, 100, 30, -15)

    stepSimulation(state, dt)

    const entity = state.entities[0]
    expect(entity?.x).toBeCloseTo(100 + 30 * dt, 10)
    expect(entity?.y).toBeCloseTo(100 - 15 * dt, 10)
    expect(state.tick).toBe(1)
  })

  it('reproduces the same state after the same number of fixed steps', () => {
    const advance = (): SimulationState => {
      const state = createSimulation(config)
      for (let i = 0; i < 50; i += 1) stepSimulation(state, dt)
      return state
    }

    expect(advance().entities).toEqual(advance().entities)
    expect(advance().random.state).toBe(advance().random.state)
  })

  it('leaves tick and entities unchanged for a zero-length step', () => {
    const state = createSimulation(config)
    const before = structuredClone(state.entities)

    stepSimulation(state, 0)

    expect(state.entities).toEqual(before)
    expect(state.tick).toBe(0)
  })

  it('keeps every entity inside the bounds over many steps', () => {
    const state = createSimulation({ ...config, entityCount: 100 })

    for (let i = 0; i < 500; i += 1) {
      stepSimulation(state, dt)
      for (const entity of state.entities) {
        expect(entity.x).toBeGreaterThanOrEqual(entity.radius - 1e-9)
        expect(entity.x).toBeLessThanOrEqual(state.bounds.width - entity.radius + 1e-9)
        expect(entity.y).toBeGreaterThanOrEqual(entity.radius - 1e-9)
        expect(entity.y).toBeLessThanOrEqual(state.bounds.height - entity.radius + 1e-9)
      }
    }
  })

  it('reflects velocity when an entity hits a world edge', () => {
    const state = singleEntityState(5, 100, -60, 0)

    stepSimulation(state, 0.5)

    const entity = state.entities[0]
    expect(entity?.vx).toBeGreaterThan(0)
    expect(entity?.x).toBeGreaterThanOrEqual(2 - 1e-9)
  })

  it('rejects a timestep that is not a finite, non-negative number', () => {
    const state = createSimulation(config)

    expect(() => stepSimulation(state, -dt)).toThrow(/timestep/i)
    expect(() => stepSimulation(state, Number.NaN)).toThrow(/timestep/i)
    expect(() => stepSimulation(state, Number.POSITIVE_INFINITY)).toThrow(/timestep/i)
  })

  it('rejects a non-finite timestep before mutating positions', () => {
    const state = singleEntityState(10, 10, 1, 1)
    const before = structuredClone(state.entities)

    expect(() => stepSimulation(state, Number.NaN)).toThrow()
    expect(state.entities).toEqual(before)
  })
})
