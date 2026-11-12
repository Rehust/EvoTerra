import {
  DEFAULT_SPEED_MULTIPLIER,
  FIXED_TIMESTEP_SECONDS,
  MAX_CATCH_UP_STEPS,
  SNAPSHOT_INTERVAL_SECONDS,
  SPEED_MULTIPLIERS,
  STATS_INTERVAL_SECONDS,
  type SpeedMultiplier,
} from './config.ts'
import { createSimulation } from './createSimulation.ts'
import { advanceFixedSteps } from './scheduler.ts'
import { computeStats } from './stats.ts'
import { stepSimulation } from './stepSimulation.ts'
import { summarizeNetwork } from '../neural/network.ts'
import type { SimulationConfig, SimulationState } from './types.ts'
import type {
  ClientCommand,
  CreatureDetails,
  CreatureDetailsEvent,
  CreatureSnapshot,
  FoodSnapshot,
  SimulationStatus,
  SnapshotEvent,
  StatsEvent,
  WorldEvent,
  WorkerEvent,
} from '../../shared/messages.ts'

/**
 * One simulation run: authoritative state, RNG, running flag, speed, tick, and
 * cadences. Framework-free and clock-free; the worker supplies elapsed seconds
 * per turn, so the whole protocol is testable without a browser or timers.
 */
export class SimulationSession {
  private readonly config: SimulationConfig
  private state: SimulationState
  private running = false
  private speed: SpeedMultiplier = DEFAULT_SPEED_MULTIPLIER
  private accumulatorSeconds = 0
  private secondsSinceSnapshot = 0
  private secondsSinceStats = 0
  /** Incremented by INIT/RESET so the UI can discard snapshots from old runs. */
  private runId = 0
  private sequence = 0

  constructor(config: SimulationConfig) {
    this.config = config
    this.state = createSimulation(config)
  }

  /** Applies a command and returns the events the worker should post, in order. */
  handleCommand(command: ClientCommand): WorkerEvent[] {
    switch (command.type) {
      case 'INIT':
        return this.init(command.seed)
      case 'START':
        if (this.running) return []
        this.running = true
        this.accumulatorSeconds = 0
        this.secondsSinceSnapshot = SNAPSHOT_INTERVAL_SECONDS
        this.secondsSinceStats = 0
        return [{ type: 'STATUS', status: this.status() }]
      case 'PAUSE':
        if (!this.running) return []
        this.running = false
        return [{ type: 'STATUS', status: this.status() }]
      case 'RESET': {
        this.loadState(this.state.config.seed)
        return [
          { type: 'STATUS', status: this.status() },
          this.worldEvent(),
          this.nextSnapshot(),
          this.statsEvent(),
        ]
      }
      case 'SET_SPEED':
        this.speed = this.assertSupportedSpeed(command.speed)
        return [{ type: 'STATUS', status: this.status() }]
      case 'INSPECT_CREATURE':
        return [this.creatureDetails(command.creatureId, command.requestId)]
      default: {
        const exhaustive: never = command
        throw new Error(`Unhandled worker command ${JSON.stringify(exhaustive)}`)
      }
    }
  }

  /**
   * Advances the run by `elapsedSeconds` of wall-clock time. Returns any due
   * snapshot/statistics events. Paused runs do nothing and build no backlog.
   */
  advance(elapsedSeconds: number): WorkerEvent[] {
    if (!this.running) return []

    const advance = advanceFixedSteps({
      accumulatorSeconds: this.accumulatorSeconds,
      elapsedSeconds,
      speed: this.speed,
      timestepSeconds: FIXED_TIMESTEP_SECONDS,
      maxSteps: MAX_CATCH_UP_STEPS,
    })
    this.accumulatorSeconds = advance.accumulatorSeconds
    for (let step = 0; step < advance.steps; step += 1) {
      stepSimulation(this.state, FIXED_TIMESTEP_SECONDS)
    }

    const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(elapsedSeconds, 0) : 0
    this.secondsSinceSnapshot += elapsed
    this.secondsSinceStats += elapsed
    const events: WorkerEvent[] = []

    if (this.secondsSinceSnapshot >= SNAPSHOT_INTERVAL_SECONDS) {
      this.secondsSinceSnapshot = 0
      events.push(this.nextSnapshot())
    }
    if (this.secondsSinceStats >= STATS_INTERVAL_SECONDS) {
      this.secondsSinceStats = 0
      events.push(this.statsEvent())
    }

    return events
  }

  private init(seed: number): WorkerEvent[] {
    this.running = false
    this.speed = DEFAULT_SPEED_MULTIPLIER
    this.loadState(seed)
    return [
      { type: 'READY', status: this.status() },
      this.worldEvent(),
      this.nextSnapshot(),
      this.statsEvent(),
    ]
  }

  private loadState(seed: number): void {
    this.state = createSimulation({ ...this.config, seed })
    this.runId += 1
    this.sequence = 0
    this.accumulatorSeconds = 0
    this.secondsSinceSnapshot = 0
    this.secondsSinceStats = 0
  }

  private assertSupportedSpeed(candidate: number): SpeedMultiplier {
    const match = SPEED_MULTIPLIERS.find((supported) => supported === candidate)
    if (match === undefined) {
      throw new Error(`Unsupported simulation speed ${candidate}`)
    }
    return match
  }

  private status(): SimulationStatus {
    return {
      running: this.running,
      speed: this.speed,
      seed: this.state.config.seed,
      tick: this.state.tick,
      runId: this.runId,
      population: this.state.creatures.length,
      births: this.state.births,
      deaths: this.state.deaths,
    }
  }

  private worldEvent(): WorldEvent {
    return {
      type: 'WORLD',
      runId: this.runId,
      bounds: this.state.bounds,
      terrain: {
        cellSize: this.state.terrain.cellSize,
        cols: this.state.terrain.cols,
        rows: this.state.terrain.rows,
        passable: this.state.terrain.passable,
      },
    }
  }

  private statsEvent(): StatsEvent {
    return { type: 'STATS', stats: computeStats(this.state) }
  }

  private nextSnapshot(): SnapshotEvent {
    this.sequence += 1
    const creatures: CreatureSnapshot[] = this.state.creatures.map((creature) => ({
      id: creature.id,
      x: creature.x,
      y: creature.y,
      radius: creature.radius,
      hue: creature.hue,
      energyRatio: creature.energy / this.state.config.creature.maxEnergy,
    }))
    const food: FoodSnapshot[] = this.state.food.map((resource) => ({
      id: resource.id,
      x: resource.x,
      y: resource.y,
      amountRatio: resource.capacity <= 0 ? 0 : resource.amount / resource.capacity,
    }))

    return {
      type: 'SNAPSHOT',
      runId: this.runId,
      sequence: this.sequence,
      tick: this.state.tick,
      bounds: this.state.bounds,
      creatures,
      food,
    }
  }

  private creatureDetails(creatureId: number, requestId: number): CreatureDetailsEvent {
    const creature = this.state.creatures.find((candidate) => candidate.id === creatureId)
    const details: CreatureDetails | null =
      creature === undefined
        ? null
        : {
            creatureId: creature.id,
            alive: creature.alive,
            parentId: creature.parentId,
            lineageRootId: creature.lineageRootId,
            generation: creature.generation,
            x: creature.x,
            y: creature.y,
            energy: creature.energy,
            maxEnergy: this.state.config.creature.maxEnergy,
            energyRatio: creature.energy / this.state.config.creature.maxEnergy,
            ageSeconds: creature.ageSeconds,
            reproductionCooldownSeconds: creature.reproductionCooldownSeconds,
            traits: { ...creature.genome.traits },
            inputs: { ...creature.lastInputs },
            outputs: { ...creature.lastOutputs },
            network: summarizeNetwork(creature.genome.network),
          }

    return { type: 'CREATURE_DETAILS', requestId, details }
  }
}
