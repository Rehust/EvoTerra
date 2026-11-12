import { describe, expect, it } from 'vitest'
import { advanceFixedSteps } from '../../src/simulation/core/scheduler.ts'

const dt = 1 / 30
const maxSteps = 8

const advance = (
  accumulatorSeconds: number,
  elapsedSeconds: number,
  speed: 1 | 2 | 5 | 10 = 1,
  maxStepsCap = maxSteps,
): ReturnType<typeof advanceFixedSteps> =>
  advanceFixedSteps({
    accumulatorSeconds,
    elapsedSeconds,
    speed,
    timestepSeconds: dt,
    maxSteps: maxStepsCap,
  })

describe('advanceFixedSteps', () => {
  it('runs no step until a full timestep has accumulated', () => {
    const result = advance(0, dt / 2)

    expect(result.steps).toBe(0)
    expect(result.accumulatorSeconds).toBeCloseTo(dt / 2, 12)
  })

  it('runs one step once two half-timesteps have accumulated', () => {
    const first = advance(0, dt / 2)
    const second = advance(first.accumulatorSeconds, dt / 2)

    expect(second.steps).toBe(1)
    expect(second.accumulatorSeconds).toBeCloseTo(0, 12)
  })

  it('runs one step per fixed timestep of elapsed time at 1x', () => {
    expect(advance(0, dt * 3).steps).toBe(3)
    expect(advance(0, 1, 1, 100).steps).toBe(30)
  })

  it('multiplies steps by the speed without changing the timestep', () => {
    expect(advance(0, dt * 2).steps).toBe(2)
    expect(advance(0, dt * 2, 5, 100).steps).toBe(10)
    expect(advance(0, 1, 10, 1000).steps).toBe(300)
  })

  it('caps catch-up after a long delay and keeps the leftover bounded', () => {
    const result = advance(0, 10)

    expect(result.steps).toBe(maxSteps)
    expect(result.accumulatorSeconds).toBeLessThanOrEqual(dt)
  })

  it('cannot spiral when capped turns repeat', () => {
    let accumulatorSeconds = 0
    for (let i = 0; i < 5; i += 1) {
      const result = advance(accumulatorSeconds, 10)
      accumulatorSeconds = result.accumulatorSeconds
      expect(result.steps).toBe(maxSteps)
    }
    expect(accumulatorSeconds).toBeLessThanOrEqual(dt)
  })

  it('ignores negative and non-finite elapsed time', () => {
    expect(advance(0.01, -1).steps).toBe(0)
    expect(advance(0.01, -1).accumulatorSeconds).toBeCloseTo(0.01, 12)
    expect(advance(0.01, Number.NaN).steps).toBe(0)
    expect(advance(0.01, Number.POSITIVE_INFINITY).steps).toBe(0)
  })

  it('accumulates nothing from a zero-length turn', () => {
    const result = advance(0, 0, 10)

    expect(result.steps).toBe(0)
    expect(result.accumulatorSeconds).toBe(0)
  })

  it('rejects an invalid timestep or step cap', () => {
    expect(() =>
      advanceFixedSteps({ accumulatorSeconds: 0, elapsedSeconds: 0.1, speed: 1, timestepSeconds: 0, maxSteps }),
    ).toThrow(/timestep/i)
    expect(() =>
      advanceFixedSteps({ accumulatorSeconds: 0, elapsedSeconds: 0.1, speed: 1, timestepSeconds: dt, maxSteps: 0 }),
    ).toThrow(/maxSteps/i)
  })

  it('rejects a speed multiplier outside the supported set', () => {
    expect(() =>
      advanceFixedSteps({ accumulatorSeconds: 0, elapsedSeconds: 0.1, speed: 3 as 1, timestepSeconds: dt, maxSteps }),
    ).toThrow(/speed/i)
  })
})
