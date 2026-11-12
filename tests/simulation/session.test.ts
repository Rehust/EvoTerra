import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG, FIXED_TIMESTEP_SECONDS } from '../../src/simulation/core/config.ts'
import { SimulationSession } from '../../src/simulation/core/session.ts'
import type { SnapshotEvent, StatusEvent, WorkerEvent } from '../../src/shared/messages.ts'

const SNAPSHOT_INTERVAL_SECONDS = 1 / 15

const snapshots = (events: readonly WorkerEvent[]): SnapshotEvent[] =>
  events.filter((event): event is SnapshotEvent => event.type === 'SNAPSHOT')

const statuses = (events: readonly WorkerEvent[]): StatusEvent[] =>
  events.filter((event): event is StatusEvent => event.type === 'STATUS')

const initSession = (seed = 1234): SimulationSession => {
  const session = new SimulationSession(DEFAULT_SIMULATION_CONFIG)
  session.handleCommand({ type: 'INIT', seed })
  return session
}

describe('SimulationSession', () => {
  it('reports READY with the initial snapshot after INIT', () => {
    const session = new SimulationSession(DEFAULT_SIMULATION_CONFIG)
    const events = session.handleCommand({ type: 'INIT', seed: 1234 })

    expect(events[0]?.type).toBe('READY')
    const snapshot = snapshots(events)[0]
    expect(snapshot?.tick).toBe(0)
    expect(snapshot?.entities).toHaveLength(DEFAULT_SIMULATION_CONFIG.entityCount)
    expect(snapshot?.runId).toBe(1)
    expect(snapshot?.sequence).toBe(1)
  })

  it('does not advance while paused', () => {
    const session = initSession()

    expect(session.advance(1)).toBeNull()
  })

  it('advances fixed steps while running and emits snapshots at the snapshot cadence', () => {
    const session = initSession()
    session.handleCommand({ type: 'START' })

    const first = session.advance(SNAPSHOT_INTERVAL_SECONDS / 2)
    expect(first?.tick).toBeGreaterThan(0)

    expect(session.advance(SNAPSHOT_INTERVAL_SECONDS / 2)).toBeNull()

    const next = session.advance(SNAPSHOT_INTERVAL_SECONDS / 2)
    expect(next?.tick).toBeGreaterThan(first!.tick)
    expect(next?.entities.length).toBe(DEFAULT_SIMULATION_CONFIG.entityCount)
  })

  it('stops advancing after PAUSE and keeps the tick', () => {
    const session = initSession()
    session.handleCommand({ type: 'START' })
    const tickBeforePause = session.advance(SNAPSHOT_INTERVAL_SECONDS)?.tick ?? 0

    const status = statuses(session.handleCommand({ type: 'PAUSE' }))[0]?.status
    expect(status?.running).toBe(false)
    expect(session.advance(5)).toBeNull()

    // Resuming must not replay the paused wall-clock time as catch-up steps.
    session.handleCommand({ type: 'START' })
    const resumed = session.advance(SNAPSHOT_INTERVAL_SECONDS)
    expect(resumed?.tick).toBeGreaterThan(tickBeforePause)
    expect(resumed?.tick).toBeLessThan(tickBeforePause + 10)
  })

  it('treats repeated START and PAUSE commands as no-ops', () => {
    const session = initSession()

    expect(session.handleCommand({ type: 'START' })).toHaveLength(1)
    expect(session.handleCommand({ type: 'START' })).toHaveLength(0)
    expect(session.handleCommand({ type: 'PAUSE' })).toHaveLength(1)
    expect(session.handleCommand({ type: 'PAUSE' })).toHaveLength(0)
  })

  it('changes how many steps a given elapsed time runs when the speed changes', () => {
    const tickAfterOneStep = (speed: 1 | 5): number => {
      const session = initSession()
      session.handleCommand({ type: 'SET_SPEED', speed })
      session.handleCommand({ type: 'START' })
      return session.advance(FIXED_TIMESTEP_SECONDS)?.tick ?? -1
    }

    expect(tickAfterOneStep(1)).toBe(1)
    expect(tickAfterOneStep(5)).toBe(5)
  })

  it('reports the selected speed in STATUS and rejects an unsupported one', () => {
    const session = initSession()
    const events = session.handleCommand({ type: 'SET_SPEED', speed: 10 })

    expect(statuses(events)[0]?.status.speed).toBe(10)
    expect(() => session.handleCommand({ type: 'SET_SPEED', speed: 3 as 1 })).toThrow(/speed/i)
  })

  it('starts a new run identity on RESET and replays the initial entities', () => {
    const session = initSession(777)
    const initial = snapshots(session.handleCommand({ type: 'INIT', seed: 777 }))[0]
    session.handleCommand({ type: 'START' })
    session.advance(1)

    const resetEvents = session.handleCommand({ type: 'RESET' })
    const reset = snapshots(resetEvents)[0]

    expect(reset?.runId).toBe(initial!.runId + 1)
    expect(reset?.sequence).toBe(1)
    expect(reset?.tick).toBe(0)
    expect(reset?.entities).toEqual(initial!.entities)
  })

  it('replays identically for the same seed and the same elapsed-time sequence', () => {
    const run = (): SnapshotEvent[] => {
      const session = initSession(2024)
      session.handleCommand({ type: 'START' })
      session.handleCommand({ type: 'SET_SPEED', speed: 2 })
      const collected: SnapshotEvent[] = []
      for (let i = 0; i < 20; i += 1) {
        const snapshot = session.advance(FIXED_TIMESTEP_SECONDS)
        if (snapshot) collected.push(snapshot)
      }
      return collected
    }

    const first = run()
    const second = run()

    expect(first.length).toBeGreaterThan(0)
    expect(second).toEqual(first)
  })

  it('emits increasing snapshot sequences within a run', () => {
    const session = initSession()
    session.handleCommand({ type: 'START' })

    const collected: number[] = []
    for (let i = 0; i < 10; i += 1) {
      const snapshot = session.advance(SNAPSHOT_INTERVAL_SECONDS)
      if (snapshot) collected.push(snapshot.sequence)
    }

    expect(collected.length).toBeGreaterThan(2)
    expect(collected).toEqual([...collected].sort((a, b) => a - b))
    expect(new Set(collected).size).toBe(collected.length)
  })

  it('keeps entities inside the world bounds during a long run', () => {
    const session = initSession()
    session.handleCommand({ type: 'START' })

    let snapshot: SnapshotEvent | null = null
    for (let i = 0; i < 200; i += 1) snapshot = session.advance(0.1) ?? snapshot

    expect(snapshot).not.toBeNull()
    for (const entity of snapshot!.entities) {
      expect(entity.x).toBeGreaterThanOrEqual(0)
      expect(entity.x).toBeLessThanOrEqual(snapshot!.bounds.width)
      expect(entity.y).toBeGreaterThanOrEqual(0)
      expect(entity.y).toBeLessThanOrEqual(snapshot!.bounds.height)
    }
  })
})
