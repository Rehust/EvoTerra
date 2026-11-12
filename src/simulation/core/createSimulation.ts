import { createRandom } from './random.ts'
import type { EntityState, SimulationConfig, SimulationState } from './types.ts'

const FULL_TURN_RADIANS = Math.PI * 2
const HUE_RANGE_DEGREES = 360

const requireFinite = (value: number, field: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`Simulation config ${field} must be a finite number, received ${value}`)
  }
  return value
}

const assertValidConfig = (config: SimulationConfig): void => {
  const { world, entityCount } = config

  requireFinite(world?.width, 'world width')
  requireFinite(world?.height, 'world height')
  if (!Number.isInteger(entityCount) || entityCount < 1) {
    throw new Error(`Simulation config entityCount must be a positive integer, received ${entityCount}`)
  }
  if (!Number.isFinite(config.seed)) {
    throw new Error(`Simulation config seed must be a finite number, received ${config.seed}`)
  }
  if (requireFinite(config.minSpeed, 'minSpeed') < 0) {
    throw new Error(`Simulation config minSpeed must not be negative, received ${config.minSpeed}`)
  }
  if (requireFinite(config.maxSpeed, 'maxSpeed') < config.minSpeed) {
    throw new Error(
      `Simulation config maxSpeed (${config.maxSpeed}) must be >= minSpeed (${config.minSpeed})`,
    )
  }
  if (requireFinite(config.minRadius, 'minRadius') <= 0) {
    throw new Error(`Simulation config minRadius must be positive, received ${config.minRadius}`)
  }
  if (requireFinite(config.maxRadius, 'maxRadius') < config.minRadius) {
    throw new Error(
      `Simulation config maxRadius (${config.maxRadius}) must be >= minRadius (${config.minRadius})`,
    )
  }
  if (world.width <= 0 || world.height <= 0) {
    throw new Error(
      `Simulation config world must have positive dimensions, received ${world.width}x${world.height}`,
    )
  }
  if (world.width < config.maxRadius * 2 || world.height < config.maxRadius * 2) {
    throw new Error(
      `Simulation config world ${world.width}x${world.height} cannot contain maxRadius ${config.maxRadius}`,
    )
  }
}

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t

/**
 * Builds the initial authoritative state. Pure: the same config (including the
 * seed) always produces the same entity array and the same RNG state, so a
 * reset replays exactly.
 */
export function createSimulation(config: SimulationConfig): SimulationState {
  assertValidConfig(config)

  const random = createRandom(config.seed)
  const { world } = config
  const entities: EntityState[] = []

  for (let id = 0; id < config.entityCount; id += 1) {
    const radius = lerp(config.minRadius, config.maxRadius, random.next())
    const heading = random.next() * FULL_TURN_RADIANS
    const speed = lerp(config.minSpeed, config.maxSpeed, random.next())

    entities.push({
      id,
      // Inset by the radius so no entity starts overlapping a wall.
      x: radius + random.next() * (world.width - radius * 2),
      y: radius + random.next() * (world.height - radius * 2),
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      radius,
      hue: Math.floor(random.next() * HUE_RANGE_DEGREES),
    })
  }

  return {
    config,
    bounds: world,
    entities,
    random,
    tick: 0,
  }
}
