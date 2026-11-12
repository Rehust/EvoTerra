import type { SpeedMultiplier } from '../simulation/core/config.ts'
import type { SimulationStats } from '../simulation/core/stats.ts'
import type {
  NeuralInputs,
  NeuralOutputs,
  Traits,
  WorldBounds,
} from '../simulation/core/types.ts'
import type { NetworkSummary } from '../simulation/neural/network.ts'
import type { SnapshotIdentity } from './snapshotOrder.ts'

/**
 * Typed contract between the main thread and the simulation worker.
 * Commands travel main -> worker; worker events travel worker -> main.
 * There is exactly one definition of each shape, shared by both sides.
 */

export type ClientCommand =
  | { readonly type: 'INIT'; readonly seed: number }
  | { readonly type: 'START' }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESET' }
  | { readonly type: 'SET_SPEED'; readonly speed: SpeedMultiplier }
  | { readonly type: 'INSPECT_CREATURE'; readonly creatureId: number; readonly requestId: number }

/** Static terrain. Sent once per run, never per snapshot. */
export interface TerrainSnapshot {
  readonly cellSize: number
  readonly cols: number
  readonly rows: number
  /** 1 = passable grassland, 0 = impassable rock, row-major. */
  readonly passable: Uint8Array
}

/** Compact per-creature render data; no genome or neural arrays. */
export interface CreatureSnapshot {
  readonly id: number
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly hue: number
  readonly energyRatio: number
}

/** Compact per-resource render data. */
export interface FoodSnapshot {
  readonly id: number
  readonly x: number
  readonly y: number
  /** Remaining amount / capacity, 0..1. */
  readonly amountRatio: number
}

/** Worker-owned transport/summary state the UI may display. */
export interface SimulationStatus {
  readonly running: boolean
  readonly speed: SpeedMultiplier
  readonly seed: number
  readonly tick: number
  readonly runId: number
  readonly population: number
  readonly births: number
  readonly deaths: number
}

export interface ReadyEvent {
  readonly type: 'READY'
  readonly status: SimulationStatus
}

export interface StatusEvent {
  readonly type: 'STATUS'
  readonly status: SimulationStatus
}

/** Static world payload: bounds + terrain, emitted on INIT and RESET. */
export interface WorldEvent {
  readonly type: 'WORLD'
  readonly runId: number
  readonly bounds: WorldBounds
  readonly terrain: TerrainSnapshot
}

export interface SnapshotEvent extends SnapshotIdentity {
  readonly type: 'SNAPSHOT'
  readonly tick: number
  readonly bounds: WorldBounds
  readonly creatures: readonly CreatureSnapshot[]
  readonly food: readonly FoodSnapshot[]
}

export interface StatsEvent {
  readonly type: 'STATS'
  readonly stats: SimulationStats
}

/** Full selected-creature details, returned only on request. */
export interface CreatureDetails {
  readonly creatureId: number
  readonly alive: boolean
  readonly parentId: number | null
  readonly lineageRootId: number
  readonly generation: number
  readonly x: number
  readonly y: number
  readonly energy: number
  readonly maxEnergy: number
  readonly energyRatio: number
  readonly ageSeconds: number
  readonly reproductionCooldownSeconds: number
  readonly traits: Traits
  readonly inputs: NeuralInputs
  readonly outputs: NeuralOutputs
  readonly network: NetworkSummary
}

/** `details` is null when the creature is dead or was never in this run. */
export interface CreatureDetailsEvent {
  readonly type: 'CREATURE_DETAILS'
  readonly requestId: number
  readonly details: CreatureDetails | null
}

export interface WorkerErrorEvent {
  readonly type: 'ERROR'
  readonly message: string
}

export type WorkerEvent =
  | ReadyEvent
  | StatusEvent
  | WorldEvent
  | SnapshotEvent
  | StatsEvent
  | CreatureDetailsEvent
  | WorkerErrorEvent
