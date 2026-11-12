import type { SimulationState } from '../core/types.ts'

/** Compact summary sent at the statistics cadence, never per tick. */
export interface SimulationStats {
  readonly tick: number
  readonly timeSeconds: number
  readonly population: number
  readonly births: number
  readonly deaths: number
  readonly averageEnergy: number
  readonly totalFood: number
}

export function computeStats(state: SimulationState): SimulationStats {
  let energyTotal = 0
  for (const creature of state.creatures) energyTotal += creature.energy
  let foodTotal = 0
  for (const food of state.food) foodTotal += food.amount

  return {
    tick: state.tick,
    timeSeconds: state.elapsedSeconds,
    population: state.creatures.length,
    births: state.births,
    deaths: state.deaths,
    averageEnergy:
      state.creatures.length === 0 ? 0 : energyTotal / state.creatures.length,
    totalFood: foodTotal,
  }
}
