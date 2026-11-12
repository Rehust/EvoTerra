import type { CreatureState, SimulationConfig, Terrain, WorldBounds } from '../core/types.ts'
import { isCirclePassable } from '../terrain/terrain.ts'

/**
 * Converts a movement intent into an accepted displacement.
 *
 * The output vector is capped to unit length, scaled by the inherited speed and
 * the fixed timestep, then clipped to the world and checked against terrain.
 * A blocked diagonal slides along whichever axis is passable; if both are
 * blocked the creature stays put. Movement cost is charged on the returned
 * distance, never on the requested distance.
 */
export function resolveMovement(
  creature: CreatureState,
  config: SimulationConfig,
  terrain: Terrain,
  bounds: WorldBounds,
  timestepSeconds: number,
): { x: number; y: number; distance: number } {
  const requestedX = creature.desiredMoveX
  const requestedY = creature.desiredMoveY
  const magnitude = Math.hypot(requestedX, requestedY)
  if (!Number.isFinite(magnitude) || magnitude <= 1e-9) {
    return { x: creature.x, y: creature.y, distance: 0 }
  }

  const scale = magnitude > 1 ? 1 / magnitude : 1
  const speed = config.creature.baseMovementSpeed * creature.genome.traits.maxSpeed
  const dx = requestedX * scale * speed * timestepSeconds
  const dy = requestedY * scale * speed * timestepSeconds
  const radius = creature.radius

  const clampX = (x: number): number => Math.min(bounds.width - radius, Math.max(radius, x))
  const clampY = (y: number): number => Math.min(bounds.height - radius, Math.max(radius, y))

  const targetX = clampX(creature.x + dx)
  const targetY = clampY(creature.y + dy)

  let x = creature.x
  let y = creature.y

  if (isCirclePassable(terrain, targetX, targetY, radius)) {
    x = targetX
    y = targetY
  } else if (isCirclePassable(terrain, targetX, creature.y, radius)) {
    x = targetX
  } else if (isCirclePassable(terrain, creature.x, targetY, radius)) {
    y = targetY
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Movement produced a non-finite position for creature ${creature.id}`)
  }

  return { x, y, distance: Math.hypot(x - creature.x, y - creature.y) }
}
