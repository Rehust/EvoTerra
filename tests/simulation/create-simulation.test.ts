import { describe, expect, it } from 'vitest'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import type { SimulationConfig } from '../../src/simulation/core/types.ts'

const config: SimulationConfig = { ...DEFAULT_SIMULATION_CONFIG, entityCount: 12, seed: 4242 }

describe('createSimulation', () => {
  it('creates the configured number of entities with stable ids', () => {
    const state = createSimulation(config)

    expect(state.entities).toHaveLength(12)
    expect(state.entities.map((entity) => entity.id)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ])
    expect(state.tick).toBe(0)
  })

  it('reproduces identical entity data for the same seed', () => {
    expect(createSimulation(config).entities).toEqual(createSimulation(config).entities)
  })

  it('produces different entity data for a different seed', () => {
    const other = createSimulation({ ...config, seed: 999 })

    expect(other.entities).not.toEqual(createSimulation(config).entities)
  })

  it('places every entity inside the world bounds', () => {
    const state = createSimulation(config)

    for (const entity of state.entities) {
      expect(entity.x).toBeGreaterThanOrEqual(entity.radius)
      expect(entity.x).toBeLessThanOrEqual(state.bounds.width - entity.radius)
      expect(entity.y).toBeGreaterThanOrEqual(entity.radius)
      expect(entity.y).toBeLessThanOrEqual(state.bounds.height - entity.radius)
    }
  })

  it('draws the random source from the seed so a rebuilt run can be replayed', () => {
    const first = createSimulation(config)
    const second = createSimulation(config)

    expect(first.random.state).toBe(second.random.state)
    expect(first.random.next()).toBe(second.random.next())
  })

  it('rejects configuration values that would produce invalid state', () => {
    expect(() => createSimulation({ ...config, entityCount: 0 })).toThrow(/entityCount/)
    expect(() => createSimulation({ ...config, entityCount: 2.5 })).toThrow(/entityCount/)
    expect(() =>
      createSimulation({ ...config, world: { width: Number.NaN, height: 100 } }),
    ).toThrow(/width/)
    expect(() => createSimulation({ ...config, maxSpeed: -1 })).toThrow(/Speed/)
    expect(() => createSimulation({ ...config, maxRadius: 1, minRadius: 2 })).toThrow(/Radius/)
  })

  it('rejects a world too small to contain the largest entity', () => {
    expect(() =>
      createSimulation({ ...config, world: { width: 10, height: 10 }, maxRadius: 6 }),
    ).toThrow(/Radius/)
  })
})
