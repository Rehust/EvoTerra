import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG, FIXED_TIMESTEP_SECONDS } from '../../src/simulation/core/config.ts'
import { SimulationSession } from '../../src/simulation/core/session.ts'
import type {
  CreatureDetailsEvent,
  ReadyEvent,
  SnapshotEvent,
  StatsEvent,
  StatusEvent,
  WorldEvent,
  WorkerEvent,
} from '../../src/shared/messages.ts'

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
  it('reports READY, WORLD, SNAPSHOT, and STATS after INIT', () => {
    const session = new SimulationSession(DEFAULT_SIMULATION_CONFIG)
    const events = session.handleCommand({ type: 'INIT', seed: 1234 })

    expect(events[0]?.type).toBe('READY')
    const ready = events[0] as ReadyEvent
    expect(ready.status.population).toBe(DEFAULT_SIMULATION_CONFIG.founderCount)
    expect(ready.status.runId).toBe(1)

    const world = events.find((event): event is WorldEvent => event.type === 'WORLD')
    expect(world?.runId).toBe(1)
    expect(world?.terrain.cols).toBeGreaterThan(0)
    expect(world?.terrain.passable.length).toBe(world!.terrain.cols * world!.terrain.rows)

    const snapshot = snapshots(events)[0]
    expect(snapshot?.tick).toBe(0)
    expect(snapshot?.creatures).toHaveLength(DEFAULT_SIMULATION_CONFIG.founderCount)
    expect(snapshot?.food).toHaveLength(DEFAULT_SIMULATION_CONFIG.food.patchCount)
    expect(snapshot?.runId).toBe(1)
    expect(snapshot?.sequence).toBe(1)

    const stats = events.find((event): event is StatsEvent => event.type === 'STATS')
    expect(stats?.stats.population).toBe(DEFAULT_SIMULATION_CONFIG.founderCount)
    expect(stats?.stats.totalFood).toBeGreaterThan(0)
  })

  it('keeps snapshots compact: no genomes or neural arrays', () => {
    const session = new SimulationSession(DEFAULT_SIMULATION_CONFIG)
    const snapshot = snapshots(session.handleCommand({ type: 'INIT', seed: 1234 }))[0]!
    const creature = snapshot.creatures[0]!

    expect(Object.keys(creature).sort()).toEqual(
      ['energyRatio', 'hue', 'id', 'radius', 'x', 'y'].sort(),
    )
    expect(JSON.stringify(snapshot)).not.toContain('inputHiddenWeights')
  })

  it('does not advance while paused', () => {
    const session = initSession()

    expect(session.advance(1)).toEqual([])
  })

  it('advances fixed steps while running and emits snapshots and stats at their cadences', () => {
    const session = initSession()
    session.handleCommand({ type: 'START' })

    const first = snapshots(session.advance(SNAPSHOT_INTERVAL_SECONDS / 2))
    expect(first[0]?.tick).toBeGreaterThan(0)

    expect(snapshots(session.advance(SNAPSHOT_INTERVAL_SECONDS / 2))).toHaveLength(0)

    const events = session.advance(1)
    expect(snapshots(events)[0]?.tick).toBeGreaterThan(first[0]!.tick)
    expect(events.some((event) => event.type === 'STATS')).toBe(true)
  })

  it('stops advancing after PAUSE and keeps the tick', () => {
    const session = initSession()
    session.handleCommand({ type: 'START' })
    const tickBeforePause = snapshots(session.advance(SNAPSHOT_INTERVAL_SECONDS))[0]?.tick ?? 0

    const status = statuses(session.handleCommand({ type: 'PAUSE' }))[0]?.status
    expect(status?.running).toBe(false)
    expect(session.advance(5)).toEqual([])

    session.handleCommand({ type: 'START' })
    const resumed = snapshots(session.advance(SNAPSHOT_INTERVAL_SECONDS))[0]
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
      return snapshots(session.advance(FIXED_TIMESTEP_SECONDS))[0]?.tick ?? -1
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

  it('starts a new run identity on RESET and replays the initial world', () => {
    const session = initSession(777)
    const initial = snapshots(session.handleCommand({ type: 'INIT', seed: 777 }))[0]!
    session.handleCommand({ type: 'START' })
    session.advance(1)

    const resetEvents = session.handleCommand({ type: 'RESET' })
    const reset = snapshots(resetEvents)[0]!
    const world = resetEvents.find((event): event is WorldEvent => event.type === 'WORLD')

    expect(reset.runId).toBe(initial.runId + 1)
    expect(world?.runId).toBe(reset.runId)
    expect(reset.sequence).toBe(1)
    expect(reset.tick).toBe(0)
    expect(reset.creatures).toEqual(initial.creatures)
    expect(reset.food).toEqual(initial.food)
  })

  it('returns real inspected creature data on demand, including inputs and outputs', () => {
    const session = initSession()
    const events = session.handleCommand({ type: 'INSPECT_CREATURE', creatureId: 0, requestId: 42 })
    const response = events[0] as CreatureDetailsEvent

    expect(response.type).toBe('CREATURE_DETAILS')
    expect(response.requestId).toBe(42)
    expect(response.details).not.toBeNull()
    expect(response.details!.creatureId).toBe(0)
    expect(response.details!.parentId).toBeNull()
    expect(response.details!.generation).toBe(0)
    expect(Object.keys(response.details!.inputs)).toHaveLength(8)
    expect(Object.keys(response.details!.outputs)).toHaveLength(4)
    expect(response.details!.network.topology).toBe('8-12-4')
    for (const value of Object.values(response.details!.inputs)) expect(Number.isFinite(value)).toBe(true)
    for (const value of Object.values(response.details!.outputs)) expect(Number.isFinite(value)).toBe(true)
  })

  it('returns null details for a dead or unknown creature id', () => {
    const session = initSession()
    const response = session.handleCommand({
      type: 'INSPECT_CREATURE',
      creatureId: 9999,
      requestId: 7,
    })[0] as CreatureDetailsEvent

    expect(response.requestId).toBe(7)
    expect(response.details).toBeNull()
  })

  it('replays identically for the same seed and elapsed-time sequence', () => {
    const run = (): SnapshotEvent[] => {
      const session = initSession(2024)
      session.handleCommand({ type: 'START' })
      session.handleCommand({ type: 'SET_SPEED', speed: 2 })
      const collected: SnapshotEvent[] = []
      for (let i = 0; i < 20; i += 1) {
        for (const event of session.advance(FIXED_TIMESTEP_SECONDS)) {
          if (event.type === 'SNAPSHOT') collected.push(event)
        }
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
      for (const event of session.advance(SNAPSHOT_INTERVAL_SECONDS)) {
        if (event.type === 'SNAPSHOT') collected.push(event.sequence)
      }
    }

    expect(collected.length).toBeGreaterThan(2)
    expect(collected).toEqual([...collected].sort((a, b) => a - b))
    expect(new Set(collected).size).toBe(collected.length)
  })

  it('keeps creatures inside the world bounds and on finite coordinates during a long run', () => {
    const session = initSession()
    session.handleCommand({ type: 'START' })

    let snapshot: SnapshotEvent | null = null
    for (let i = 0; i < 200; i += 1) {
      const events = session.advance(0.1)
      snapshot = snapshots(events)[0] ?? snapshot
    }

    expect(snapshot).not.toBeNull()
    for (const creature of snapshot!.creatures) {
      expect(Number.isFinite(creature.x)).toBe(true)
      expect(Number.isFinite(creature.y)).toBe(true)
      expect(creature.x).toBeGreaterThanOrEqual(0)
      expect(creature.x).toBeLessThanOrEqual(snapshot!.bounds.width)
      expect(creature.y).toBeGreaterThanOrEqual(0)
      expect(creature.y).toBeLessThanOrEqual(snapshot!.bounds.height)
    }
  })
})
