import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SEED } from '../simulation/core/config.ts'
import { isStaleSnapshot } from '../shared/snapshotOrder.ts'
import type {
  ClientCommand,
  CreatureDetails,
  SimulationStatus,
  SnapshotEvent,
  StatsEvent,
  WorldEvent,
  WorkerEvent,
} from '../shared/messages.ts'
import type { SimulationStats } from '../simulation/core/stats.ts'

/**
 * Owns the simulation worker's lifecycle and the newest accepted snapshot.
 *
 * React state is limited to small summaries, the selected-creature inspection
 * result, and error text. Per-creature and per-resource arrays stay in refs so
 * the 15 Hz snapshot stream never re-renders the app.
 */

export type InspectionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly creatureId: number }
  | { readonly status: 'found'; readonly details: CreatureDetails }
  | { readonly status: 'gone'; readonly creatureId: number }

export interface SimulationClient {
  /** null until the worker reports that initialization completed. */
  readonly status: SimulationStatus | null
  readonly error: string | null
  readonly stats: SimulationStats | null
  readonly inspection: InspectionState
  readonly send: (command: ClientCommand) => void
  /** Newest accepted snapshot; read by the renderer once per frame. */
  readonly getSnapshot: () => SnapshotEvent | null
  /** Newest static world (bounds + terrain); read by the renderer. */
  readonly getWorld: () => WorldEvent | null
  /** Requests full details for one creature; stale responses are ignored. */
  readonly requestInspect: (creatureId: number) => void
  readonly clearInspection: () => void
}

export function useSimulationWorker(): SimulationClient {
  const [status, setStatus] = useState<SimulationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SimulationStats | null>(null)
  const [inspection, setInspection] = useState<InspectionState>({ status: 'idle' })

  const workerRef = useRef<Worker | null>(null)
  const snapshotRef = useRef<SnapshotEvent | null>(null)
  const worldRef = useRef<WorldEvent | null>(null)
  const pendingInspectRef = useRef<{ requestId: number; creatureId: number } | null>(null)
  const requestCounterRef = useRef(0)

  const getSnapshot = useCallback((): SnapshotEvent | null => snapshotRef.current, [])
  const getWorld = useCallback((): WorldEvent | null => worldRef.current, [])

  const acceptSnapshot = useCallback((snapshot: SnapshotEvent) => {
    if (isStaleSnapshot(snapshot, snapshotRef.current)) return
    snapshotRef.current = snapshot
  }, [])

  useEffect(() => {
    let worker: Worker
    try {
      worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), {
        type: 'module',
        name: 'evoterra-simulation',
      })
    } catch (error) {
      setError(
        `The simulation worker could not start: ${error instanceof Error ? error.message : String(error)}`,
      )
      return
    }

    workerRef.current = worker

    const onMessage = (event: MessageEvent<WorkerEvent>): void => {
      const message = event.data
      switch (message.type) {
        case 'READY':
        case 'STATUS':
          setStatus(message.status)
          return
        case 'WORLD':
          if (worldRef.current === null || message.runId >= worldRef.current.runId) {
            worldRef.current = message
          }
          return
        case 'SNAPSHOT':
          acceptSnapshot(message)
          return
        case 'STATS': {
          const statsEvent: StatsEvent = message
          setStats(statsEvent.stats)
          return
        }
        case 'CREATURE_DETAILS': {
          const pending = pendingInspectRef.current
          if (pending === null || pending.requestId !== message.requestId) return
          pendingInspectRef.current = null
          setInspection(
            message.details === null
              ? { status: 'gone', creatureId: pending.creatureId }
              : { status: 'found', details: message.details },
          )
          return
        }
        case 'ERROR':
          setError(`Simulation error: ${message.message}`)
          return
        default:
          setError(`Simulation worker sent an unknown message: ${JSON.stringify(message)}`)
      }
    }

    const onError = (event: ErrorEvent): void => {
      setError(`Simulation worker failed: ${event.message || 'no details available'}`)
    }

    const onMessageError = (): void => {
      setError('Simulation worker sent a message the page could not read.')
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.addEventListener('messageerror', onMessageError)

    const initCommand: ClientCommand = { type: 'INIT', seed: DEFAULT_SEED }
    worker.postMessage(initCommand)

    return () => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      worker.removeEventListener('messageerror', onMessageError)
      worker.terminate()
      workerRef.current = null
      snapshotRef.current = null
      worldRef.current = null
      pendingInspectRef.current = null
    }
  }, [acceptSnapshot])

  const send = useCallback((command: ClientCommand): void => {
    workerRef.current?.postMessage(command)
  }, [])

  const requestInspect = useCallback(
    (creatureId: number): void => {
      requestCounterRef.current += 1
      const requestId = requestCounterRef.current
      pendingInspectRef.current = { requestId, creatureId }
      // Keep showing the last known details during a cadence refresh instead of
      // flashing the loading placeholder on every statistics tick.
      setInspection((current) =>
        current.status === 'found' && current.details.creatureId === creatureId
          ? current
          : { status: 'loading', creatureId },
      )
      workerRef.current?.postMessage({ type: 'INSPECT_CREATURE', creatureId, requestId })
    },
    [],
  )

  const clearInspection = useCallback((): void => {
    pendingInspectRef.current = null
    setInspection({ status: 'idle' })
  }, [])

  return {
    status,
    error,
    stats,
    inspection,
    send,
    getSnapshot,
    getWorld,
    requestInspect,
    clearInspection,
  }
}
