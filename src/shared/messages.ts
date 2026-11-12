import type { SpeedMultiplier } from '../simulation/core/config.ts'
import type { SnapshotIdentity } from './snapshotOrder.ts'
import type { WorldBounds } from '../simulation/core/types.ts'

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

/** Per-entity render data. Nothing here is authoritative on the main thread. */
export interface EntitySnapshot {
  readonly id: number
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly hue: number
}

/** Worker-owned summary state the UI may display. */
export interface SimulationStatus {
  readonly running: boolean
  readonly speed: SpeedMultiplier
  readonly seed: number
  readonly tick: number
  readonly entityCount: number
  readonly runId: number
}

export interface ReadyEvent {
  readonly type: 'READY'
  readonly status: SimulationStatus
}

export interface StatusEvent {
  readonly type: 'STATUS'
  readonly status: SimulationStatus
}

export interface SnapshotEvent extends SnapshotIdentity {
  readonly type: 'SNAPSHOT'
  readonly tick: number
  readonly bounds: WorldBounds
  readonly entities: readonly EntitySnapshot[]
}

export interface WorkerErrorEvent {
  readonly type: 'ERROR'
  readonly message: string
}

export type WorkerEvent = ReadyEvent | StatusEvent | SnapshotEvent | WorkerErrorEvent
