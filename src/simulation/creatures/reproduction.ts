import type { CreatureState, SimulationState } from '../core/types.ts'
import { mutateGenome } from '../neural/genome.ts'
import { isCirclePassable } from '../terrain/terrain.ts'
import { createOffspringCreature } from './creature.ts'

/**
 * Asexual reproduction. Eligibility is explicit; placement is a fixed,
 * deterministic sequence of nearby candidates; energy moves from parent to
 * child rather than being created.
 */

const OFFSETS = [
  [1, 0],
  [0.7071, 0.7071],
  [0, 1],
  [-0.7071, 0.7071],
  [-1, 0],
  [-0.7071, -0.7071],
  [0, -1],
  [0.7071, -0.7071],
] as const

export function canReproduce(creature: CreatureState, state: SimulationState): boolean {
  const { config } = state
  return (
    creature.alive &&
    creature.wantsReproduce &&
    creature.ageSeconds >= config.reproduction.minAgeSeconds &&
    creature.reproductionCooldownSeconds <= 0 &&
    creature.energy >= config.reproduction.energyThreshold &&
    state.creatures.length < config.maxPopulation
  )
}

/** First free passable candidate around the parent, or null if all fail. */
export function findOffspringPosition(
  parent: CreatureState,
  state: SimulationState,
): { x: number; y: number } | null {
  const { terrain, bounds, config } = state
  const spacing = Math.max(parent.radius, config.creature.baseRadius) * 2 + 2
  const rings = Math.ceil(config.reproduction.placementAttempts / OFFSETS.length)

  for (let ring = 1; ring <= rings; ring += 1) {
    const distance = parent.radius * 2 + 4 * ring
    for (const [ dx, dy ] of OFFSETS) {
      const x = parent.x + dx * distance
      const y = parent.y + dy * distance
      if (
        x < parent.radius ||
        y < parent.radius ||
        x > bounds.width - parent.radius ||
        y > bounds.height - parent.radius
      ) {
        continue
      }
      if (!isCirclePassable(terrain, x, y, parent.radius)) continue

      const nearby = state.creatureGrid.queryRadius(x, y, spacing)
      const overlaps = nearby.some((other) => {
        if (other.id === parent.id) return false
        return Math.hypot(other.x - x, other.y - y) < parent.radius + other.radius + 1
      })
      if (overlaps) continue

      return { x, y }
    }
  }

  return null
}

/**
 * Attempts one reproduction. Returns the child (already appended to the live
 * population) or null when any condition fails. Failure never transfers energy
 * or allocates an id.
 */
export function tryReproduce(state: SimulationState, parent: CreatureState): CreatureState | null {
  if (!canReproduce(parent, state)) return null

  const position = findOffspringPosition(parent, state)
  if (position === null) return null

  const genome = mutateGenome(parent.genome, state.config, state.random)
  const child = createOffspringCreature(
    state.nextCreatureId,
    parent,
    genome,
    position.x,
    position.y,
    state.config,
  )

  parent.energy -= state.config.reproduction.offspringEnergyTransfer
  parent.reproductionCooldownSeconds = state.config.reproduction.cooldownSeconds

  state.nextCreatureId += 1
  state.births += 1
  state.creatures.push(child)
  state.creatureGrid.insert(child)
  return child
}
