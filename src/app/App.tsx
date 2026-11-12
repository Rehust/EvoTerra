import { useCallback, useEffect, useState } from 'react'
import { WorldViewport } from '../components/WorldViewport.tsx'
import { CreatureInspector } from '../components/inspector/CreatureInspector.tsx'
import {
  FIXED_TIMESTEP_SECONDS,
  SPEED_MULTIPLIERS,
  type SpeedMultiplier,
} from '../simulation/core/config.ts'
import { useSimulationWorker } from './useSimulationWorker.ts'

const formatNumber = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

function App() {
  const {
    status,
    error,
    stats,
    inspection,
    send,
    getSnapshot,
    getWorld,
    requestInspect,
    clearInspection,
  } = useSimulationWorker()

  const [selectedId, setSelectedId] = useState<number | null>(null)

  const running = status?.running ?? false
  const initialized = status !== null
  const workerState = error !== null ? 'error' : initialized ? 'ready' : 'starting'

  const handleSelect = useCallback(
    (creatureId: number | null): void => {
      setSelectedId(creatureId)
      if (creatureId === null) clearInspection()
      else requestInspect(creatureId)
    },
    [clearInspection, requestInspect],
  )

  // Refresh inspected values at the statistics cadence, and ignore any late
  // response for a different selection because requestInspect replaced it.
  const statsTick = stats?.tick ?? null
  useEffect(() => {
    if (selectedId === null) return
    requestInspect(selectedId)
  }, [selectedId, statsTick, requestInspect])

  // A new run (INIT or RESET) invalidates any selected creature.
  const runId = status?.runId ?? null
  useEffect(() => {
    setSelectedId(null)
    clearInspection()
  }, [runId, clearInspection])

  const population = stats?.population ?? status?.population ?? 0
  const births = stats?.births ?? status?.births ?? 0
  const deaths = stats?.deaths ?? status?.deaths ?? 0
  const tick = stats?.tick ?? status?.tick ?? 0

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <h1>EvoTerra</h1>
          <span className="brand__tag">creature simulation</span>
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
        <WorldViewport
          getSnapshot={getSnapshot}
          getWorld={getWorld}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
        <aside className="sidebar">
          <CreatureInspector inspection={inspection} />
        </aside>
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
            <dd>{tick}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatNumber((stats?.timeSeconds ?? 0), 1)} s</dd>
          </div>
          <div>
            <dt>Population</dt>
            <dd>{population}</dd>
          </div>
          <div>
            <dt>Births</dt>
            <dd>{births}</dd>
          </div>
          <div>
            <dt>Deaths</dt>
            <dd>{deaths}</dd>
          </div>
          <div>
            <dt>Avg energy</dt>
            <dd>{formatNumber(stats?.averageEnergy ?? 0, 1)}</dd>
          </div>
          <div>
            <dt>Food</dt>
            <dd>{formatNumber(stats?.totalFood ?? 0)}</dd>
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
        Neural-network-driven creatures search for finite food, manage energy, die, and reproduce
        asexually with bounded mutation. One deterministic worker; terrain is a bounded grassland
        test habitat.
      </p>
    </div>
  )
}

export default App
