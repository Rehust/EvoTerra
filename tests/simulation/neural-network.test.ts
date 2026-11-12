import { describe, expect, it } from 'vitest'
import {
  HIDDEN_COUNT,
  HIDDEN_OUTPUT_WEIGHT_COUNT,
  INPUT_HIDDEN_WEIGHT_COUNT,
  OUTPUT_COUNT,
  assertNetworkShape,
  forward,
  summarizeNetwork,
} from '../../src/simulation/neural/network.ts'
import { ZERO_INPUTS } from '../../src/simulation/neural/network.ts'
import type { Genome, NeuralInputs } from '../../src/simulation/core/types.ts'

const zeroGenome = (): Genome => ({
  topology: 1,
  traits: { maxSpeed: 1, bodySize: 1, visionRange: 64, metabolicEfficiency: 1 },
  network: {
    inputHiddenWeights: new Array(INPUT_HIDDEN_WEIGHT_COUNT).fill(0),
    hiddenBias: new Array(HIDDEN_COUNT).fill(0),
    hiddenOutputWeights: new Array(HIDDEN_OUTPUT_WEIGHT_COUNT).fill(0),
    outputBias: new Array(OUTPUT_COUNT).fill(0),
  },
})

const inputs = (overrides: Partial<NeuralInputs>): NeuralInputs => ({ ...ZERO_INPUTS, ...overrides })

describe('neural network forward pass', () => {
  it('always returns exactly four finite outputs in range', () => {
    const outputs = forward(zeroGenome(), inputs({ foodDirectionX: 0.5, energyRatio: 0.25 }))

    expect(Object.keys(outputs)).toHaveLength(4)
    for (const value of Object.values(outputs)) {
      expect(Number.isFinite(value)).toBe(true)
    }
    expect(outputs.moveX).toBeGreaterThanOrEqual(-1)
    expect(outputs.moveX).toBeLessThanOrEqual(1)
    expect(outputs.moveY).toBeGreaterThanOrEqual(-1)
    expect(outputs.moveY).toBeLessThanOrEqual(1)
    expect(outputs.eat).toBeGreaterThanOrEqual(0)
    expect(outputs.eat).toBeLessThanOrEqual(1)
    expect(outputs.reproduce).toBeGreaterThanOrEqual(0)
    expect(outputs.reproduce).toBeLessThanOrEqual(1)
  })

  it('maps zero weights and biases to neutral outputs: no movement, actions at 0.5', () => {
    const outputs = forward(zeroGenome(), ZERO_INPUTS)

    expect(outputs.moveX).toBe(0)
    expect(outputs.moveY).toBe(0)
    expect(outputs.eat).toBeCloseTo(0.5, 12)
    expect(outputs.reproduce).toBeCloseTo(0.5, 12)
  })

  it('produces the hand-computed value for known weights', () => {
    const genome = zeroGenome()
    genome.network.inputHiddenWeights[0 * HIDDEN_COUNT + 0] = 1
    genome.network.hiddenOutputWeights[0 * OUTPUT_COUNT + 0] = 1

    const outputs = forward(genome, inputs({ foodDirectionX: 0.5 }))

    // Two tanh layers: input 0.5 -> hidden tanh(0.5) -> output tanh(tanh(0.5)).
    expect(outputs.moveX).toBeCloseTo(Math.tanh(Math.tanh(0.5)), 12)
    expect(outputs.moveY).toBeCloseTo(Math.tanh(0), 12)
    expect(outputs.eat).toBeCloseTo(0.5, 12)
    expect(outputs.reproduce).toBeCloseTo(0.5, 12)
  })

  it('is deterministic for the same genome and inputs', () => {
    const genome = zeroGenome()
    genome.network.hiddenBias[3] = 0.3
    genome.network.hiddenOutputWeights[3 * OUTPUT_COUNT + 2] = 0.9

    const first = forward(genome, inputs({ localFoodDensity: 0.8 }))
    const second = forward(genome, inputs({ localFoodDensity: 0.8 }))

    expect(second).toEqual(first)
  })

  it('clamps extreme inputs at the boundary instead of producing NaN', () => {
    const outputs = forward(
      zeroGenome(),
      inputs({
        foodDirectionX: Number.NaN,
        foodDirectionY: 12,
        foodProximity: -3,
        localFoodDensity: 5,
        nearbyCreatureDensity: -1,
        energyRatio: Number.POSITIVE_INFINITY,
        boundaryPressureX: 2,
        boundaryPressureY: -2,
      }),
    )

    for (const value of Object.values(outputs)) expect(Number.isFinite(value)).toBe(true)
  })

  it('does not mutate genome weights or biases', () => {
    const genome = zeroGenome()
    const before = structuredClone(genome.network)

    forward(genome, inputs({ foodProximity: 1 }))

    expect(genome.network).toEqual(before)
  })

  it('rejects invalid network shapes instead of evaluating them', () => {
    const bad = zeroGenome()
    bad.network.inputHiddenWeights = new Array(INPUT_HIDDEN_WEIGHT_COUNT - 1).fill(0)
    expect(() => assertNetworkShape(bad.network)).toThrow(/inputHiddenWeights/)

    const badBias = zeroGenome()
    badBias.network.outputBias = new Array(OUTPUT_COUNT + 1).fill(0)
    expect(() => assertNetworkShape(badBias.network)).toThrow(/outputBias/)
  })

  it('summarizes the actual network parameters for the inspector', () => {
    const summary = summarizeNetwork(zeroGenome().network)

    expect(summary.topology).toBe('8-12-4')
    expect(summary.weightCount).toBe(INPUT_HIDDEN_WEIGHT_COUNT + HIDDEN_OUTPUT_WEIGHT_COUNT)
    expect(summary.biasCount).toBe(HIDDEN_COUNT + OUTPUT_COUNT)
    expect(summary.meanWeight).toBe(0)
    expect(summary.minWeight).toBe(0)
    expect(summary.maxWeight).toBe(0)
  })
})
