import type { CreatureState, SimulationConfig } from '../core/types.ts'

/**
 * Energy economy. All formulas are documented and unit-tested:
 *
 * basalCost = basalMaintenancePerSecond * bodySize / metabolicEfficiency * dt
 * movementCost = movementEnergyPerWorldUnit * bodySize * actualDistance
 *
 * Higher bodySize costs more; higher metabolicEfficiency costs less.
 */

export function computeBasalCost(
  config: SimulationConfig,
  traits: CreatureState['genome']['traits'],
  timestepSeconds: number,
): number {
  return (
    (config.creature.basalMaintenancePerSecond * traits.bodySize) /
    traits.metabolicEfficiency *
    timestepSeconds
  )
}

export function computeMovementCost(
  config: SimulationConfig,
  traits: CreatureState['genome']['traits'],
  distance: number,
): number {
  return config.creature.movementEnergyPerWorldUnit * traits.bodySize * distance
}

/** Applies both costs and clamps energy to the legal live range. */
export function applyEnergyCosts(
  creature: CreatureState,
  config: SimulationConfig,
  timestepSeconds: number,
): void {
  const basal = computeBasalCost(config, creature.genome.traits, timestepSeconds)
  const movement = computeMovementCost(config, creature.genome.traits, creature.lastMovementDistance)
  const next = creature.energy - basal - movement
  creature.energy = Math.min(config.creature.maxEnergy, Math.max(0, next))
}

/** Adds eaten energy, discarding any overflow above maximum. */
export function addFoodEnergy(
  creature: CreatureState,
  config: SimulationConfig,
  foodAmount: number,
): number {
  const gained = foodAmount * config.food.energyPerUnit
  creature.energy = Math.min(config.creature.maxEnergy, creature.energy + gained)
  return gained
}
