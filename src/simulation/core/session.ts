import {
  DEFAULT_SPEED_MULTIPLIER,
  FIXED_TIMESTEP_SECONDS,
  MAX_CATCH_UP_STEPS,
  SNAPSHOT_INTERVAL_SECONDS,
  SPEED_MULTIPLIERS,
  type SpeedMultiplier,
} from './config.ts'
import { createSimulation } from './createSimulation.ts'
import { advanceFixedSteps } from './scheduler.ts'
import { stepSimulation } from './stepSimulation.ts'
import type { SimulationConfig, SimulationState } from './types.ts'
import type {
  ClientCommand,
  EntitySnapshot,
  SimulationStatus,
  SnapshotEvent,
  WorkerEvent,
} from '../../shared/messages.ts'

/**
 * One simulation run: authoritative state, RNG, running flag, speed, tick, and
 * snapshot sequence.
 *
 * Deliberately framework-free and clock-free. The worker supplies elapsed
 * wall-clock seconds per turn; everything here is a deterministic function of
 * the commands and the elapsed values it receives, so the whole protocol can be
 * tested without a browser, timers, or a worker.
 */
export class SimulationSession {
  private readonly config: SimulationConfig
  private state: SimulationState
  private running = false
  private speed: SpeedMultiplier = DEFAULT_SPEED_MULTIPLIER
  private accumulatorSeconds = 0
  private secondsSinceSnapshot = 0
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
        return [{ type: 'STATUS', status: this.status() }]
      case 'PAUSE':
        if (!this.running) return []
        this.running = false
        return [{ type: 'STATUS', status: this.status() }]
      case 'RESET':
        this.loadState(this.state.config.seed)
        return [{ type: 'STATUS', status: this.status() }, this.nextSnapshot()]
      case 'SET_SPEED':
        this.speed = this.assertSupportedSpeed(command.speed)
        return [{ type: 'STATUS', status: this.status() }]
      default: {
        const exhaustive: never = command
        throw new Error(`Unhandled worker command ${JSON.stringify(exhaustive)}`)
      }
    }
  }

  /**
   * Advances the run by `elapsedSeconds` of wall-clock time. Returns a snapshot
   * when one is due, otherwise null. Paused runs do nothing and build no backlog.
   */
  advance(elapsedSeconds: number): SnapshotEvent | null {
    if (!this.running) return null

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
    if (this.secondsSinceSnapshot < SNAPSHOT_INTERVAL_SECONDS) return null

    this.secondsSinceSnapshot = 0
    return this.nextSnapshot()
  }

  private init(seed: number): WorkerEvent[] {
    this.running = false
    this.speed = DEFAULT_SPEED_MULTIPLIER
    this.loadState(seed)
    return [{ type: 'READY', status: this.status() }, this.nextSnapshot()]
  }

  private loadState(seed: number): void {
    this.state = createSimulation({ ...this.config, seed })
    this.runId += 1
    this.sequence = 0
    this.accumulatorSeconds = 0
    this.secondsSinceSnapshot = 0
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
      entityCount: this.state.entities.length,
      runId: this.runId,
    }
  }

  private nextSnapshot(): SnapshotEvent {
    this.sequence += 1
    const entities: EntitySnapshot[] = new Array(this.state.entities.length)
    for (let i = 0; i < this.state.entities.length; i += 1) {
      const entity = this.state.entities[i]
      entities[i] = {
        id: entity.id,
        x: entity.x,
        y: entity.y,
        radius: entity.radius,
        hue: entity.hue,
      }
    }

    return {
      type: 'SNAPSHOT',
      runId: this.runId,
      sequence: this.sequence,
      tick: this.state.tick,
      bounds: this.state.bounds,
      entities,
    }
  }
}
