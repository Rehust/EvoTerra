import { DEFAULT_SIMULATION_CONFIG } from '../simulation/core/config.ts'
import { SimulationSession } from '../simulation/core/session.ts'
import type { ClientCommand, WorkerEvent } from '../shared/messages.ts'

/**
 * Simulation worker entry point. It is a thin adapter: the worker owns the
 * clock and the message boundary, while SimulationSession owns the state and
 * the protocol decisions (see src/simulation/core/session.ts). No React, no
 * PixiJS, no DOM.
 */

/** Scheduler turn interval; four times finer than one fixed simulation step. */
const SCHEDULER_TURN_MS = 20

/**
 * The worker scope narrowed to what this file uses. Declared locally because the
 * app tsconfig targets the main thread (DOM lib), not the WebWorker lib.
 */
interface SimulationWorkerScope {
  postMessage(message: WorkerEvent): void
  setInterval(handler: () => void, timeout: number): number
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<ClientCommand>) => void,
  ): void
  onmessageerror: ((event: MessageEvent) => void) | null
}

const scope = self as unknown as SimulationWorkerScope

const session = new SimulationSession(DEFAULT_SIMULATION_CONFIG)

const post = (event: WorkerEvent): void => scope.postMessage(event)

const reportError = (error: unknown): void => {
  post({
    type: 'ERROR',
    message: error instanceof Error ? error.message : String(error),
  })
}

let lastTurnMs: number | null = null

scope.addEventListener('message', (event) => {
  try {
    for (const workerEvent of session.handleCommand(event.data)) post(workerEvent)
  } catch (error) {
    reportError(error)
  }
})

scope.onmessageerror = () => {
  post({ type: 'ERROR', message: 'Simulation worker received an unreadable message.' })
}

// Single scheduling loop. One interval owns advancement, so start/pause can
// never leave a second timer running behind it.
scope.setInterval(() => {
  const now = performance.now()
  const elapsedSeconds = lastTurnMs === null ? 0 : (now - lastTurnMs) / 1000
  lastTurnMs = now

  try {
    const snapshot = session.advance(elapsedSeconds)
    if (snapshot) post(snapshot)
  } catch (error) {
    reportError(error)
  }
}, SCHEDULER_TURN_MS)
