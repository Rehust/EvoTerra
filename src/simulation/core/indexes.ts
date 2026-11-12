import type { SimulationState } from './types.ts'

/**
 * Rebuilds the creature broad-phase index from authoritative live state.
 * Food is static in this version, so its grid is built once at creation.
 */
export function rebuildCreatureGrid(state: SimulationState): void {
  state.creatureGrid.clear()
  for (const creature of state.creatures) {
    if (creature.alive) state.creatureGrid.insert(creature)
  }
}
