import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG, FIXED_TIMESTEP_SECONDS } from '../../src/simulation/core/config.ts'
import { createSimulation } from '../../src/simulation/core/createSimulation.ts'
import { stepSimulation } from '../../src/simulation/core/stepSimulation.ts'
import { SimulationSession } from '../../src/simulation/core/session.ts'
import type { SnapshotEvent, WorkerEvent } from '../../src/shared/messages.ts'
import type { SimulationConfig } from '../../src/simulation/core/types.ts'

/**
 * Pure-simulation benchmark for the population sizes named in the plan.
 *
 * This is a measurement, not a performance gate: it asserts only correctness
 * invariants so it cannot fail on a slower machine. The printed numbers are
 * from the 1-vCPU development machine, not a promise for user devices.
 */

/** Fixed steps per benchmark run (10 simulated seconds at 30 Hz). */
const STEPS = 300
const SEED = 2026

const benchmarkConfig = (founders: number): SimulationConfig => ({
  ...DEFAULT_SIMULATION_CONFIG,
  founderCount: founders,
  // Allow the hereditary loop to run during the measurement.
  maxPopulation: founders * 2,
  seed: SEED,
})

interface BenchmarkResult {
  readonly founders: number
  readonly stepsPerSecond: number
  readonly finalPopulation: number
  readonly births: number
  readonly deaths: number
}

const runBenchmark = (founders: number): BenchmarkResult => {
  const state = createSimulation(benchmarkConfig(founders))
  const started = performance.now()
  for (let step = 0; step < STEPS; step += 1) {
    stepSimulation(state, FIXED_TIMESTEP_SECONDS)
  }
  const elapsedMs = performance.now() - started

  for (const creature of state.creatures) {
    expect(Number.isFinite(creature.x)).toBe(true)
    expect(Number.isFinite(creature.y)).toBe(true)
    expect(Number.isFinite(creature.energy)).toBe(true)
  }
  expect(state.creatures.length).toBeLessThanOrEqual(state.config.maxPopulation)
  expect(state.creatureGrid.size).toBe(state.creatures.length)

  return {
    founders,
    stepsPerSecond: Math.round((STEPS / elapsedMs) * 1000),
    finalPopulation: state.creatures.length,
    births: state.births,
    deaths: state.deaths,
  }
}

describe('simulation benchmark', () => {
  it('measures 100, 250, 500, and 1000 creature populations', () => {
    const results = [100, 250, 500, 1000].map(runBenchmark)

    for (const result of results) {
      console.log(
        `benchmark: founders=${result.founders} steps/s=${result.stepsPerSecond} ` +
          `population=${result.finalPopulation} births=${result.births} deaths=${result.deaths}`,
      )
    }
    expect(results).toHaveLength(4)
  })

  it('keeps the render snapshot compact at 100 creatures', () => {
    const session = new SimulationSession(benchmarkConfig(100))
    const events = session.handleCommand({ type: 'INIT', seed: SEED })
    const snapshot = events.find((event): event is SnapshotEvent => event.type === 'SNAPSHOT')
    expect(snapshot).toBeDefined()

    const bytes = JSON.stringify(snapshot).length
    console.log(`benchmark: snapshot at 100 creatures = ${bytes} bytes`)
    expect(bytes).toBeLessThan(200_000)
    expect(events.some((event: WorkerEvent) => event.type === 'STATS')).toBe(true)
  })

  it('does not accumulate dead creatures, grid entries, or display data', () => {
    const state = createSimulation(benchmarkConfig(100))
    // Stage a near-empty, food-free world so starvation is fast and total.
    state.food.length = 0
    state.foodGrid.clear()
    for (const creature of state.creatures) creature.energy = 0.5

    for (let step = 0; step < 600; step += 1) stepSimulation(state, FIXED_TIMESTEP_SECONDS)

    expect(state.creatures).toHaveLength(0)
    expect(state.creatureGrid.size).toBe(0)
    expect(state.deaths).toBe(100)
    expect(state.food).toHaveLength(0)
  })
})
