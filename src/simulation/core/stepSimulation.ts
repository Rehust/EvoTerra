import { rebuildCreatureGrid } from './indexes.ts'
import { perceiveCreature } from '../creatures/perception.ts'
import { forward } from '../neural/network.ts'
import { greedyFoodSeekingOutputs } from '../creatures/controller.ts'
import { resolveMovement } from '../creatures/movement.ts'
import { addFoodEnergy, applyEnergyCosts } from '../creatures/energy.ts'
import { tryReproduce } from '../creatures/reproduction.ts'
import { stepFoodRegeneration } from '../resources/createFood.ts'
import type { FoodResource, SimulationState } from './types.ts'

/**
 * One fixed simulation step. The stage order is part of the determinism
 * contract, so actions never depend on partially updated observations:
 *
 * 1. regenerate food
 * 2. rebuild creature index
 * 3. perceive + infer for every creature from the same pre-movement state
 * 4. move in ascending id order (terrain/bounds constraints applied)
 * 5. eat in ascending id order (stable resource contention)
 * 6. apply energy costs, age, cooldown
 * 7. mark and remove dead creatures (each counted once)
 * 8. reproduce in ascending id order; newborns are appended and do not act
 * 9. advance tick/time
 */
export function stepSimulation(state: SimulationState, timestepSeconds: number): SimulationState {
  if (!Number.isFinite(timestepSeconds) || timestepSeconds < 0) {
    throw new Error(
      `Simulation timestep must be a finite, non-negative number of seconds, received ${timestepSeconds}`,
    )
  }
  if (timestepSeconds === 0) return state

  const { config, terrain, bounds } = state

  stepFoodRegeneration(state.food, timestepSeconds)
  rebuildCreatureGrid(state)

  for (const creature of state.creatures) {
    const inputs = perceiveCreature(creature, state)
    const outputs =
      config.debugController === 'greedy'
        ? greedyFoodSeekingOutputs(inputs)
        : forward(creature.genome, inputs)
    creature.lastInputs = inputs
    creature.lastOutputs = outputs
    creature.desiredMoveX = outputs.moveX
    creature.desiredMoveY = outputs.moveY
    creature.wantsEat = outputs.eat >= config.creature.eatOutputThreshold
    creature.wantsReproduce = outputs.reproduce >= config.reproduction.outputThreshold
  }

  for (const creature of state.creatures) {
    const movement = resolveMovement(creature, config, terrain, bounds, timestepSeconds)
    creature.x = movement.x
    creature.y = movement.y
    creature.lastMovementDistance = movement.distance
  }
  rebuildCreatureGrid(state)

  const eatReach = config.food.consumptionRadius
  for (const creature of state.creatures) {
    if (!creature.wantsEat) continue
    const candidates = state.foodGrid.queryRadius(
      creature.x,
      creature.y,
      creature.radius + eatReach,
    )
    let target: FoodResource | null = null
    let bestSquared = Number.POSITIVE_INFINITY
    for (const food of candidates) {
      if (food.amount <= 0) continue
      const dx = food.x - creature.x
      const dy = food.y - creature.y
      const squared = dx * dx + dy * dy
      if (squared < bestSquared) {
        bestSquared = squared
        target = food
      }
    }
    if (target === null) continue

    const consumed = Math.min(target.amount, config.food.maxConsumedPerAction)
    if (consumed <= 0) continue
    target.amount -= consumed
    addFoodEnergy(creature, config, consumed)
  }

  let deathsThisStep = 0
  for (const creature of state.creatures) {
    applyEnergyCosts(creature, config, timestepSeconds)
    creature.ageSeconds += timestepSeconds
    creature.reproductionCooldownSeconds = Math.max(
      0,
      creature.reproductionCooldownSeconds - timestepSeconds,
    )
    if (creature.energy <= 0) {
      creature.alive = false
      deathsThisStep += 1
    }
  }

  if (deathsThisStep > 0) {
    state.deaths += deathsThisStep
    const survivors = state.creatures.filter((creature) => creature.alive)
    state.creatures.length = 0
    for (const survivor of survivors) state.creatures.push(survivor)
  }
  rebuildCreatureGrid(state)

  // Snapshot the parents: newborns must not perceive, move, eat, or reproduce
  // during their birth tick, even though they are appended immediately.
  const parents = state.creatures.slice()
  for (const parent of parents) tryReproduce(state, parent)

  state.tick += 1
  state.elapsedSeconds += timestepSeconds
  return state
}
