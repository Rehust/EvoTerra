import type { SimulationState } from './types.ts'

interface AxisUpdate {
  position: number
  velocity: number
}

/**
 * One mirror-bounce at a world edge, then clamp. Mirroring keeps the reflected
 * distance travelled consistent; the clamp bounds the result if a very large
 * step would put the entity past the opposite wall in a single update.
 */
const bounce = (position: number, velocity: number, min: number, max: number): AxisUpdate => {
  if (position < min) {
    return { position: Math.min(min + (min - position), max), velocity: Math.abs(velocity) }
  }
  if (position > max) {
    return { position: Math.max(max - (position - max), min), velocity: -Math.abs(velocity) }
  }
  return { position, velocity }
}

/**
 * Advances the state by one fixed timestep and returns the same (mutated) state.
 *
 * Ownership model: the caller owns the state object; this function updates it in
 * place so the worker never copies the population per step. A zero timestep is a
 * no-op so paused or degraded scheduling cannot fabricate ticks.
 */
export function stepSimulation(state: SimulationState, timestepSeconds: number): SimulationState {
  if (!Number.isFinite(timestepSeconds) || timestepSeconds < 0) {
    throw new Error(
      `Simulation timestep must be a finite, non-negative number of seconds, received ${timestepSeconds}`,
    )
  }
  if (timestepSeconds === 0) return state

  const { width, height } = state.bounds

  for (const entity of state.entities) {
    const radius = entity.radius
    const nextX = bounce(
      entity.x + entity.vx * timestepSeconds,
      entity.vx,
      radius,
      width - radius,
    )
    const nextY = bounce(
      entity.y + entity.vy * timestepSeconds,
      entity.vy,
      radius,
      height - radius,
    )

    if (!Number.isFinite(nextX.position) || !Number.isFinite(nextY.position)) {
      throw new Error(`Simulation produced a non-finite position for entity ${entity.id}`)
    }

    entity.x = nextX.position
    entity.y = nextY.position
    entity.vx = nextX.velocity
    entity.vy = nextY.velocity
  }

  state.tick += 1
  return state
}
