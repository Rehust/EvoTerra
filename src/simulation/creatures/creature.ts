import type { CreatureState, Genome, SimulationConfig, Terrain, WorldBounds } from '../core/types.ts'
import type { RandomSource } from '../core/random.ts'
import { createFounderGenome, radiusForTraits } from '../neural/genome.ts'
import { NEUTRAL_OUTPUTS, ZERO_INPUTS } from '../neural/network.ts'
import { findNearestPassablePoint, isCirclePassable } from '../terrain/terrain.ts'

/** Founders start with 60-100% energy, so the first seconds are not a death clock. */
const FOUNDER_ENERGY_MIN_RATIO = 0.6
const FOUNDER_ENERGY_RANGE = 0.4
const HUE_RANGE_DEGREES = 360
const SPAWN_ATTEMPTS = 200

const randomSpawnPoint = (
  terrain: Terrain,
  bounds: WorldBounds,
  radius: number,
  random: RandomSource,
): { x: number; y: number } | null => {
  for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt += 1) {
    const x = radius + random.next() * (bounds.width - radius * 2)
    const y = radius + random.next() * (bounds.height - radius * 2)
    if (isCirclePassable(terrain, x, y, radius)) return { x, y }
  }
  return findNearestPassablePoint(terrain, bounds.width / 2, bounds.height / 2)
}

const initialOutputs = (): CreatureState['lastOutputs'] => ({ ...NEUTRAL_OUTPUTS })
const initialInputs = (): CreatureState['lastInputs'] => ({ ...ZERO_INPUTS })

export function createFounderCreature(
  id: number,
  config: SimulationConfig,
  terrain: Terrain,
  bounds: WorldBounds,
  random: RandomSource,
): CreatureState {
  const genome = createFounderGenome(config, random)
  const radius = radiusForTraits(genome.traits, config.creature.baseRadius)
  const point = randomSpawnPoint(terrain, bounds, radius, random)
  if (point === null) {
    throw new Error('Could not place a founder on passable terrain')
  }

  return {
    id,
    parentId: null,
    lineageRootId: id,
    generation: 0,
    x: point.x,
    y: point.y,
    radius,
    hue: Math.floor(random.next() * HUE_RANGE_DEGREES),
    energy: config.creature.maxEnergy * (FOUNDER_ENERGY_MIN_RATIO + random.next() * FOUNDER_ENERGY_RANGE),
    ageSeconds: 0,
    reproductionCooldownSeconds: 0,
    alive: true,
    genome,
    lastInputs: initialInputs(),
    lastOutputs: initialOutputs(),
    desiredMoveX: 0,
    desiredMoveY: 0,
    wantsEat: false,
    wantsReproduce: false,
    lastMovementDistance: 0,
  }
}

/** Builds a newborn from an already-mutated genome at a validated position. */
export function createOffspringCreature(
  id: number,
  parent: CreatureState,
  genome: Genome,
  x: number,
  y: number,
  config: SimulationConfig,
): CreatureState {
  return {
    id,
    parentId: parent.id,
    lineageRootId: parent.lineageRootId,
    generation: parent.generation + 1,
    x,
    y,
    radius: radiusForTraits(genome.traits, config.creature.baseRadius),
    hue: parent.hue,
    energy: config.reproduction.offspringEnergyTransfer,
    ageSeconds: 0,
    reproductionCooldownSeconds: 0,
    alive: true,
    genome,
    lastInputs: initialInputs(),
    lastOutputs: initialOutputs(),
    desiredMoveX: 0,
    desiredMoveY: 0,
    wantsEat: false,
    wantsReproduce: false,
    lastMovementDistance: 0,
  }
}
