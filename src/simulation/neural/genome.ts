import type { Genome, SimulationConfig, Traits } from '../core/types.ts'
import type { RandomSource } from '../core/random.ts'
import {
  HIDDEN_COUNT,
  HIDDEN_OUTPUT_WEIGHT_COUNT,
  INPUT_HIDDEN_WEIGHT_COUNT,
  NETWORK_TOPOLOGY_VERSION,
  assertGenomeFinite,
} from './network.ts'

/**
 * Founder genome creation, deep cloning, validation, and bounded mutation.
 * The same parent + RNG state + config always yields the same child genome.
 */

/**
 * Initial output-bias priors. Eating starts mildly positive so the first
 * seconds are not a death clock; reproduction stays neutral (sigmoid ~0.43-0.57)
 * because the 0.80 output threshold plus energy gating is the real gate, and a
 * negative prior would make reproduction unreachable for nearly every founder,
 * leaving selection nothing to act on.
 */
const EAT_BIAS_PRIOR = { min: 0.1, max: 0.7 } as const
const REPRODUCE_BIAS_PRIOR = { min: -0.3, max: 0.3 } as const

const uniform = (random: RandomSource, min: number, max: number): number =>
  min + random.next() * (max - min)

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const randomArray = (random: RandomSource, length: number, min: number, max: number): number[] =>
  Array.from({ length }, () => uniform(random, min, max))

const randomTrait = (
  random: RandomSource,
  range: { readonly min: number; readonly max: number },
): number => uniform(random, range.min, range.max)

export function createFounderGenome(config: SimulationConfig, random: RandomSource): Genome {
  const biasRange = config.network.initialBiasRange
  return {
    topology: NETWORK_TOPOLOGY_VERSION,
    traits: {
      maxSpeed: randomTrait(random, config.traits.maxSpeed),
      bodySize: randomTrait(random, config.traits.bodySize),
      visionRange: randomTrait(random, config.traits.visionRange),
      metabolicEfficiency: randomTrait(random, config.traits.metabolicEfficiency),
    },
    network: {
      inputHiddenWeights: randomArray(
        random,
        INPUT_HIDDEN_WEIGHT_COUNT,
        -config.network.initialWeightRange,
        config.network.initialWeightRange,
      ),
      hiddenBias: randomArray(random, HIDDEN_COUNT, -biasRange, biasRange),
      hiddenOutputWeights: randomArray(
        random,
        HIDDEN_OUTPUT_WEIGHT_COUNT,
        -config.network.initialWeightRange,
        config.network.initialWeightRange,
      ),
      outputBias: [
        uniform(random, -biasRange, biasRange),
        uniform(random, -biasRange, biasRange),
        uniform(random, EAT_BIAS_PRIOR.min, EAT_BIAS_PRIOR.max),
        uniform(random, REPRODUCE_BIAS_PRIOR.min, REPRODUCE_BIAS_PRIOR.max),
      ],
    },
  }
}

/** Deep copy so a child can never alias a parent's mutable arrays. */
export function cloneGenome(genome: Genome): Genome {
  return {
    topology: genome.topology,
    traits: { ...genome.traits },
    network: {
      inputHiddenWeights: [...genome.network.inputHiddenWeights],
      hiddenBias: [...genome.network.hiddenBias],
      hiddenOutputWeights: [...genome.network.hiddenOutputWeights],
      outputBias: [...genome.network.outputBias],
    },
  }
}

const assertInRange = (value: number, min: number, max: number, field: string): void => {
  if (value < min || value > max) {
    throw new Error(`Genome ${field} must be within [${min}, ${max}], received ${value}`)
  }
}

/** Full validation used at the simulation boundary and after mutation. */
export function validateGenome(genome: Genome, config: SimulationConfig): void {
  assertGenomeFinite(genome)
  assertInRange(genome.traits.maxSpeed, config.traits.maxSpeed.min, config.traits.maxSpeed.max, 'maxSpeed')
  assertInRange(genome.traits.bodySize, config.traits.bodySize.min, config.traits.bodySize.max, 'bodySize')
  assertInRange(
    genome.traits.visionRange,
    config.traits.visionRange.min,
    config.traits.visionRange.max,
    'visionRange',
  )
  assertInRange(
    genome.traits.metabolicEfficiency,
    config.traits.metabolicEfficiency.min,
    config.traits.metabolicEfficiency.max,
    'metabolicEfficiency',
  )
  const limit = config.network.weightLimit
  for (const value of [
    ...genome.network.inputHiddenWeights,
    ...genome.network.hiddenBias,
    ...genome.network.hiddenOutputWeights,
    ...genome.network.outputBias,
  ]) {
    assertInRange(value, -limit, limit, 'network parameter')
  }
}

/**
 * Asexual mutation: clone, then perturb each scalar independently with the
 * configured probability. Mutations are neutral in direction, bounded, and
 * never touch the parent. Topology does not change.
 */
export function mutateGenome(
  parent: Genome,
  config: SimulationConfig,
  random: RandomSource,
): Genome {
  const child = cloneGenome(parent)
  const { mutation } = config

  const mutate = (value: number, min: number, max: number, perturbation: number): number => {
    if (random.next() >= mutation.probability) return value
    const delta = (random.next() * 2 - 1) * perturbation
    return clamp(value + delta, min, max)
  }

  const mutateTrait = (
    value: number,
    range: { readonly min: number; readonly max: number },
  ): number => mutate(value, range.min, range.max, (range.max - range.min) * mutation.traitFraction)

  child.traits.maxSpeed = mutateTrait(child.traits.maxSpeed, config.traits.maxSpeed)
  child.traits.bodySize = mutateTrait(child.traits.bodySize, config.traits.bodySize)
  child.traits.visionRange = mutateTrait(child.traits.visionRange, config.traits.visionRange)
  child.traits.metabolicEfficiency = mutateTrait(
    child.traits.metabolicEfficiency,
    config.traits.metabolicEfficiency,
  )

  const weightLimit = config.network.weightLimit
  const mutateWeight = (value: number): number =>
    mutate(value, -weightLimit, weightLimit, mutation.weightRange)

  const mutated: Genome = {
    topology: child.topology,
    traits: child.traits,
    network: {
      inputHiddenWeights: child.network.inputHiddenWeights.map(mutateWeight),
      hiddenBias: child.network.hiddenBias.map(mutateWeight),
      hiddenOutputWeights: child.network.hiddenOutputWeights.map(mutateWeight),
      outputBias: child.network.outputBias.map(mutateWeight),
    },
  }

  validateGenome(mutated, config)
  return mutated
}

/** Visual/collision radius is inherited through bodySize. */
export function radiusForTraits(traits: Traits, baseRadius: number): number {
  return baseRadius * traits.bodySize
}
