import type { Genome, NetworkParameters, NeuralInputs, NeuralOutputs } from '../core/types.ts'

/**
 * Fixed feed-forward network: 8 inputs -> 12 tanh hidden neurons -> 4 outputs.
 * Outputs 0-1 (movement) use tanh; outputs 2-3 (actions) use sigmoid.
 *
 * No ML framework, no training. Weights are inherited and mutated.
 */

export const NETWORK_TOPOLOGY_VERSION = 1
export const INPUT_COUNT = 8
export const HIDDEN_COUNT = 12
export const OUTPUT_COUNT = 4
export const INPUT_HIDDEN_WEIGHT_COUNT = INPUT_COUNT * HIDDEN_COUNT
export const HIDDEN_OUTPUT_WEIGHT_COUNT = HIDDEN_COUNT * OUTPUT_COUNT

export const ZERO_INPUTS: Readonly<NeuralInputs> = {
  foodDirectionX: 0,
  foodDirectionY: 0,
  foodProximity: 0,
  localFoodDensity: 0,
  nearbyCreatureDensity: 0,
  energyRatio: 0,
  boundaryPressureX: 0,
  boundaryPressureY: 0,
}

/** A network with zero weights and biases: movement 0, actions 0.5. */
export const NEUTRAL_OUTPUTS: Readonly<NeuralOutputs> = {
  moveX: 0,
  moveY: 0,
  eat: 0.5,
  reproduce: 0.5,
}

/**
 * Defensive input clamp to [-1, 1]. Non-finite values map to a deterministic
 * bound so a corrupted perception input can never produce NaN outputs.
 */
const clampUnit = (value: number): number => {
  if (!Number.isFinite(value)) return value === Number.POSITIVE_INFINITY ? 1 : -1
  return Math.min(1, Math.max(-1, value))
}
const sigmoid = (value: number): number => 1 / (1 + Math.exp(-value))

/** Shape-only check; cheap enough to run on every forward pass. */
export function assertNetworkShape(network: NetworkParameters): void {
  if (network.inputHiddenWeights.length !== INPUT_HIDDEN_WEIGHT_COUNT) {
    throw new Error(
      `Network inputHiddenWeights must have ${INPUT_HIDDEN_WEIGHT_COUNT} values, received ${network.inputHiddenWeights.length}`,
    )
  }
  if (network.hiddenBias.length !== HIDDEN_COUNT) {
    throw new Error(`Network hiddenBias must have ${HIDDEN_COUNT} values, received ${network.hiddenBias.length}`)
  }
  if (network.hiddenOutputWeights.length !== HIDDEN_OUTPUT_WEIGHT_COUNT) {
    throw new Error(
      `Network hiddenOutputWeights must have ${HIDDEN_OUTPUT_WEIGHT_COUNT} values, received ${network.hiddenOutputWeights.length}`,
    )
  }
  if (network.outputBias.length !== OUTPUT_COUNT) {
    throw new Error(`Network outputBias must have ${OUTPUT_COUNT} values, received ${network.outputBias.length}`)
  }
}

/** Shape and finite-value checks used at genome creation and mutation. */
export function assertGenomeFinite(genome: Genome): void {
  if (genome.topology !== NETWORK_TOPOLOGY_VERSION) {
    throw new Error(
      `Genome topology must be ${NETWORK_TOPOLOGY_VERSION}, received ${genome.topology}`,
    )
  }
  for (const [name, value] of Object.entries(genome.traits)) {
    if (!Number.isFinite(value)) throw new Error(`Genome trait ${name} must be finite, received ${value}`)
  }
  assertNetworkShape(genome.network)
  const scalars = [
    ...genome.network.inputHiddenWeights,
    ...genome.network.hiddenBias,
    ...genome.network.hiddenOutputWeights,
    ...genome.network.outputBias,
  ]
  for (const value of scalars) {
    if (!Number.isFinite(value)) {
      throw new Error(`Genome network contains a non-finite parameter: ${value}`)
    }
  }
}

/**
 * Deterministic forward pass. Inputs are clamped to [-1, 1] as a defensive
 * boundary; perception already normalizes them to their documented ranges.
 */
export function forward(genome: Genome, inputs: NeuralInputs): NeuralOutputs {
  assertNetworkShape(genome.network)
  const network = genome.network
  const clamped = [
    clampUnit(inputs.foodDirectionX),
    clampUnit(inputs.foodDirectionY),
    clampUnit(inputs.foodProximity),
    clampUnit(inputs.localFoodDensity),
    clampUnit(inputs.nearbyCreatureDensity),
    clampUnit(inputs.energyRatio),
    clampUnit(inputs.boundaryPressureX),
    clampUnit(inputs.boundaryPressureY),
  ]

  const hidden = new Array<number>(HIDDEN_COUNT)
  for (let h = 0; h < HIDDEN_COUNT; h += 1) {
    let sum = network.hiddenBias[h]
    for (let i = 0; i < INPUT_COUNT; i += 1) {
      sum += clamped[i] * network.inputHiddenWeights[i * HIDDEN_COUNT + h]
    }
    hidden[h] = Math.tanh(sum)
  }

  const raw = new Array<number>(OUTPUT_COUNT)
  for (let o = 0; o < OUTPUT_COUNT; o += 1) {
    let sum = network.outputBias[o]
    for (let h = 0; h < HIDDEN_COUNT; h += 1) {
      sum += hidden[h] * network.hiddenOutputWeights[h * OUTPUT_COUNT + o]
    }
    raw[o] = o < 2 ? Math.tanh(sum) : sigmoid(sum)
  }

  return { moveX: raw[0], moveY: raw[1], eat: raw[2], reproduce: raw[3] }
}

/** Lightweight network summary for the inspector; never sent per snapshot. */
export interface NetworkSummary {
  readonly topology: string
  readonly inputCount: number
  readonly hiddenCount: number
  readonly outputCount: number
  readonly weightCount: number
  readonly biasCount: number
  readonly meanWeight: number
  readonly minWeight: number
  readonly maxWeight: number
  readonly meanBias: number
}

export function summarizeNetwork(network: NetworkParameters): NetworkSummary {
  const weights = [...network.inputHiddenWeights, ...network.hiddenOutputWeights]
  const biases = [...network.hiddenBias, ...network.outputBias]
  const mean = (values: readonly number[]): number =>
    values.reduce((total, value) => total + value, 0) / values.length

  return {
    topology: `${INPUT_COUNT}-${HIDDEN_COUNT}-${OUTPUT_COUNT}`,
    inputCount: INPUT_COUNT,
    hiddenCount: HIDDEN_COUNT,
    outputCount: OUTPUT_COUNT,
    weightCount: weights.length,
    biasCount: biases.length,
    meanWeight: mean(weights),
    minWeight: Math.min(...weights),
    maxWeight: Math.max(...weights),
    meanBias: mean(biases),
  }
}
