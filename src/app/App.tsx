import { useEffect, useRef, useState } from 'react'
import { WorldViewport } from '../components/WorldViewport.tsx'
import { FIXED_TIMESTEP_SECONDS, SPEED_MULTIPLIERS, type SpeedMultiplier } from '../simulation/core/config.ts'
import {
  createSummaryRefreshState,
  nextSummaryRefreshState,
  shouldRefreshSummary,
  type SummaryRefreshState,
} from './summaryThrottle.ts'
import { useSimulationWorker } from './useSimulationWorker.ts'

/**
 * Dashboard-style status refresh: ~2 updates per second, as the specifications
 * require. Snapshots arrive at ~15 Hz, so the panel throttles them.
 */
const STATUS_REFRESH_MS = 500

interface Summary {
  tick: number
  entityCount: number
}

function App() {
  const { status, error, send, getSnapshot, subscribe } = useSimulationWorker()
  const [summary, setSummary] = useState<Summary | null>(null)
  const summaryStateRef = useRef<SummaryRefreshState>(createSummaryRefreshState())

  // The tick/entity counters come from worker snapshots, throttled for the UI.
  useEffect(
    () =>
      subscribe(() => {
        const snapshot = getSnapshot()
        if (!snapshot) return

        const now = performance.now()
        if (!shouldRefreshSummary(summaryStateRef.current, snapshot.tick, now, STATUS_REFRESH_MS)) {
          return
        }

        summaryStateRef.current = nextSummaryRefreshState(snapshot.tick, now)
        setSummary({ tick: snapshot.tick, entityCount: snapshot.entities.length })
      }),
    [subscribe, getSnapshot],
  )

  const running = status?.running ?? false
  const initialized = status !== null
  const workerState = error !== null ? 'error' : initialized ? 'ready' : 'starting'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <h1>EvoTerra</h1>
          <span className="brand__tag">movement prototype</span>
        </div>
        <p className={`worker-state worker-state--${workerState}`}>
          <span className="worker-state__dot" aria-hidden="true" />
          {workerState === 'error'
            ? 'Worker error'
            : initialized
              ? running
                ? 'Running'
                : 'Paused'
              : 'Starting worker'}
        </p>
      </header>

      {error !== null ? (
        <p className="banner banner--error" role="alert">
          {error}
        </p>
      ) : null}

      <main className="workspace">
        <WorldViewport getSnapshot={getSnapshot} />
      </main>

      <footer className="console">
        <div className="transport" role="group" aria-label="Simulation transport">
          <button
            type="button"
            className="button button--primary"
            onClick={() => send({ type: 'START' })}
            disabled={!initialized || running}
          >
            Start
          </button>
          <button
            type="button"
            className="button"
            onClick={() => send({ type: 'PAUSE' })}
            disabled={!initialized || !running}
          >
            Pause
          </button>
          <button
            type="button"
            className="button"
            onClick={() => send({ type: 'RESET' })}
            disabled={!initialized}
          >
            Reset
          </button>

          <div className="speeds" role="group" aria-label="Simulation speed">
            {SPEED_MULTIPLIERS.map((multiplier: SpeedMultiplier) => {
              const selected = status?.speed === multiplier
              return (
                <button
                  key={multiplier}
                  type="button"
                  className="button button--speed"
                  aria-pressed={selected}
                  onClick={() => send({ type: 'SET_SPEED', speed: multiplier })}
                  disabled={!initialized}
                >
                  {multiplier}×
                </button>
              )
            })}
          </div>
        </div>

        <dl className="readout" aria-label="Simulation status">
          <div>
            <dt>Tick</dt>
            <dd>{summary !== null ? summary.tick : '—'}</dd>
          </div>
          <div>
            <dt>Entities</dt>
            <dd>{summary !== null ? summary.entityCount : '—'}</dd>
          </div>
          <div>
            <dt>Seed</dt>
            <dd>{status !== null ? status.seed : '—'}</dd>
          </div>
          <div>
            <dt>Step</dt>
            <dd>{`1/${Math.round(1 / FIXED_TIMESTEP_SECONDS)} s`}</dd>
          </div>
        </dl>
      </footer>

      <p className="footnote">
        Prototype test particles driven by a single simulation Web Worker. Neural decisions,
        food, energy, reproduction, and evolution are not implemented yet.
      </p>
    </div>
  )
}

export default App
