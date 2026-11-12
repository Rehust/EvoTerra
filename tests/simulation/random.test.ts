import { describe, expect, it } from 'vitest'
import { createRandom } from '../../src/simulation/core/random.ts'

const draw = (seed: number, count: number): number[] => {
  const random = createRandom(seed)
  return Array.from({ length: count }, () => random.next())
}

describe('createRandom', () => {
  it('produces the same sequence for the same seed', () => {
    expect(draw(12345, 8)).toEqual(draw(12345, 8))
  })

  it('produces a different sequence for a different seed', () => {
    expect(draw(12345, 8)).not.toEqual(draw(54321, 8))
  })

  it('returns values in the half-open interval [0, 1)', () => {
    const random = createRandom(7)
    for (let i = 0; i < 1000; i += 1) {
      const value = random.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('advances its state on every draw', () => {
    const random = createRandom(99)
    const before = random.state
    random.next()
    expect(random.state).not.toBe(before)
  })

  it('resumes an identical sequence from a copied state', () => {
    const random = createRandom(2024)
    random.next()
    random.next()

    const copy = createRandom(0)
    copy.state = random.state

    expect(Array.from({ length: 4 }, () => copy.next())).toEqual(
      Array.from({ length: 4 }, () => random.next()),
    )
  })

  it('rejects a seed that is not a finite number', () => {
    expect(() => createRandom(Number.NaN)).toThrow(/seed/i)
    expect(() => createRandom(Number.POSITIVE_INFINITY)).toThrow(/seed/i)
  })

  it('treats the seed as a 32-bit integer, so a seed and its uint32 alias match', () => {
    expect(draw(42, 4)).toEqual(draw(42 + 2 ** 32, 4))
  })
})
