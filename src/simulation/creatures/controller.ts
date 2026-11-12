import type { NeuralInputs, NeuralOutputs } from '../core/types.ts'

/**
 * Debug baseline controller. It is NOT the default and never overrides neural
 * outputs unless `config.debugController === 'greedy'`. It exists so a
 * simulation bug can be told apart from unhelpful evolved networks.
 */
export function greedyFoodSeekingOutputs(inputs: NeuralInputs): NeuralOutputs {
  const hasFood = inputs.foodProximity > 0
  return {
    moveX: hasFood ? inputs.foodDirectionX : 0,
    moveY: hasFood ? inputs.foodDirectionY : 0,
    eat: hasFood ? 1 : 0,
    reproduce: 0,
  }
}
