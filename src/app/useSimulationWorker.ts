import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SEED } from '../simulation/core/config.ts'
import { isStaleSnapshot } from '../shared/snapshotOrder.ts'
import type {
  ClientCommand,
  SimulationStatus,
  SnapshotEvent,
  WorkerEvent,
} from '../shared/messages.ts'

/**
 * Owns the simulation worker's lifecycle and the newest accepted snapshot.
 *
 * React state here is limited to the small status summary and error text. Entity
 * data stays in refs so a 15 Hz snapshot stream never re-renders the app.
 */
export interface SimulationClient {
  /** null until the worker reports that initialization completed. */
  readonly status: SimulationStatus | null
  readonly error: string | null
  readonly send: (command: ClientCommand) => void
  /** Newest accepted snapshot; read by the renderer once per frame. */
  readonly getSnapshot: () => SnapshotEvent | null
  /** Notified when a newer snapshot replaces the current one. */
  readonly subscribe: (listener: () => void) => () => void
}

export function useSimulationWorker(): SimulationClient {
  const [status, setStatus] = useState<SimulationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const snapshotRef = useRef<SnapshotEvent | null>(null)
  const listenersRef = useRef(new Set<() => void>())

  const getSnapshot = useCallback((): SnapshotEvent | null => snapshotRef.current, [])

  const subscribe = useCallback((listener: () => void): (() => void) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const acceptSnapshot = useCallback((snapshot: SnapshotEvent) => {
    if (isStaleSnapshot(snapshot, snapshotRef.current)) return

    snapshotRef.current = snapshot
    for (const listener of listenersRef.current) listener()
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
        case 'SNAPSHOT':
          acceptSnapshot(message)
          return
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
    }
  }, [acceptSnapshot])

  const send = useCallback((command: ClientCommand): void => {
    workerRef.current?.postMessage(command)
  }, [])

  return { status, error, send, getSnapshot, subscribe }
}
