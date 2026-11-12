import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import { createRandom } from '../../src/simulation/core/random.ts'
import {
  cloneGenome,
  createFounderGenome,
  mutateGenome,
  radiusForTraits,
  validateGenome,
} from '../../src/simulation/neural/genome.ts'
import {
  HIDDEN_COUNT,
  HIDDEN_OUTPUT_WEIGHT_COUNT,
  INPUT_HIDDEN_WEIGHT_COUNT,
} from '../../src/simulation/neural/network.ts'

const config = DEFAULT_SIMULATION_CONFIG

describe('genome creation and cloning', () => {
  it('creates a valid founder genome with the fixed topology', () => {
    const genome = createFounderGenome(config, createRandom(5))

    expect(() => validateGenome(genome, config)).not.toThrow()
    expect(genome.topology).toBe(1)
    expect(genome.network.inputHiddenWeights).toHaveLength(INPUT_HIDDEN_WEIGHT_COUNT)
    expect(genome.network.hiddenBias).toHaveLength(HIDDEN_COUNT)
    expect(genome.network.hiddenOutputWeights).toHaveLength(HIDDEN_OUTPUT_WEIGHT_COUNT)
    expect(genome.network.outputBias).toHaveLength(4)
  })

  it('is deterministic for the same seed and different for another seed', () => {
    const first = createFounderGenome(config, createRandom(9))
    const second = createFounderGenome(config, createRandom(9))
    const third = createFounderGenome(config, createRandom(10))

    expect(second).toEqual(first)
    expect(third).not.toEqual(first)
  })

  it('clones deeply so a child never aliases a parent array', () => {
    const parent = createFounderGenome(config, createRandom(3))
    const child = cloneGenome(parent)

    expect(child).toEqual(parent)
    expect(child.network.inputHiddenWeights).not.toBe(parent.network.inputHiddenWeights)
    expect(child.network.hiddenBias).not.toBe(parent.network.hiddenBias)
    expect(child.network.hiddenOutputWeights).not.toBe(parent.network.hiddenOutputWeights)
    expect(child.network.outputBias).not.toBe(parent.network.outputBias)
    expect(child.traits).not.toBe(parent.traits)

    child.network.inputHiddenWeights[0] = 99
    child.traits.bodySize = 99
    expect(parent.network.inputHiddenWeights[0]).not.toBe(99)
    expect(parent.traits.bodySize).not.toBe(99)
  })
})

describe('genome validation', () => {
  it('rejects non-finite values', () => {
    const genome = createFounderGenome(config, createRandom(1))
    genome.network.inputHiddenWeights[7] = Number.NaN
    expect(() => validateGenome(genome, config)).toThrow(/finite/)
  })

  it('rejects out-of-range traits and weights', () => {
    const slow = createFounderGenome(config, createRandom(2))
    slow.traits.maxSpeed = config.traits.maxSpeed.max + 0.01
    expect(() => validateGenome(slow, config)).toThrow(/maxSpeed/)

    const heavy = createFounderGenome(config, createRandom(3))
    heavy.network.hiddenOutputWeights[0] = config.network.weightLimit + 0.1
    expect(() => validateGenome(heavy, config)).toThrow(/network parameter/)
  })

  it('rejects wrong array lengths', () => {
    const genome = createFounderGenome(config, createRandom(4))
    genome.network.hiddenBias = new Array(HIDDEN_COUNT - 1).fill(0)
    expect(() => validateGenome(genome, config)).toThrow(/hiddenBias/)
  })
})

describe('mutation', () => {
  it('is deterministic for the same parent, seed, and config', () => {
    const parent = createFounderGenome(config, createRandom(31))
    const first = mutateGenome(parent, config, createRandom(77))
    const second = mutateGenome(parent, config, createRandom(77))

    expect(second).toEqual(first)
  })

  it('never modifies the parent genome', () => {
    const parent = createFounderGenome(config, createRandom(31))
    const snapshot = structuredClone(parent)

    mutateGenome(parent, config, createRandom(5))

    expect(parent).toEqual(snapshot)
  })

  it('keeps the fixed topology and bounds after many mutations', () => {
    const parent = createFounderGenome(config, createRandom(31))

    for (let i = 0; i < 1000; i += 1) {
      const child = mutateGenome(parent, config, createRandom(i + 1))
      expect(child.topology).toBe(1)
      expect(child.network.inputHiddenWeights).toHaveLength(INPUT_HIDDEN_WEIGHT_COUNT)
      expect(child.traits.maxSpeed).toBeGreaterThanOrEqual(config.traits.maxSpeed.min)
      expect(child.traits.maxSpeed).toBeLessThanOrEqual(config.traits.maxSpeed.max)
      expect(child.traits.bodySize).toBeGreaterThanOrEqual(config.traits.bodySize.min)
      expect(child.traits.bodySize).toBeLessThanOrEqual(config.traits.bodySize.max)
      expect(child.traits.visionRange).toBeGreaterThanOrEqual(config.traits.visionRange.min)
      expect(child.traits.visionRange).toBeLessThanOrEqual(config.traits.visionRange.max)
      expect(
        child.traits.metabolicEfficiency,
      ).toBeGreaterThanOrEqual(config.traits.metabolicEfficiency.min)
      expect(
        child.traits.metabolicEfficiency,
      ).toBeLessThanOrEqual(config.traits.metabolicEfficiency.max)
      for (const weight of child.network.inputHiddenWeights) {
        expect(Math.abs(weight)).toBeLessThanOrEqual(config.network.weightLimit)
      }
    }
  })

  it('produces a different child under a different seed', () => {
    const parent = createFounderGenome(config, createRandom(31))
    const first = mutateGenome(parent, config, createRandom(1))
    const second = mutateGenome(parent, config, createRandom(2))

    expect(second).not.toEqual(first)
  })

  it('derives the visual radius from body size', () => {
    expect(radiusForTraits({ maxSpeed: 1, bodySize: 1, visionRange: 64, metabolicEfficiency: 1 }, 2.5)).toBe(2.5)
    expect(radiusForTraits({ maxSpeed: 1, bodySize: 1.4, visionRange: 64, metabolicEfficiency: 1 }, 2.5)).toBeCloseTo(3.5, 10)
  })
})
