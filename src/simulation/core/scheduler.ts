export interface SchedulerInput {
  /** Leftover fractional timestep carried from the previous turn, in seconds. */
  accumulatorSeconds: number
  /** Wall-clock seconds elapsed since the previous turn (may be negative or bad). */
  elapsedSeconds: number
  /** Speed multiplier; supported values are enforced here. */
  speed: 1 | 2 | 5 | 10
  /** Fixed timestep in seconds (1/30 by default). Never scaled by speed. */
  timestepSeconds: number
  /** Maximum fixed steps per turn, bounding catch-up after a stalled event loop. */
  maxSteps: number
}

export interface SchedulerResult {
  /** Fixed steps to advance the simulation this turn. */
  steps: number
  /** Leftover fractional timestep to carry into the next turn, in seconds. */
  accumulatorSeconds: number
}

const SUPPORTED_SPEEDS = new Set([1, 2, 5, 10])

/**
 * Fixed-step accumulator: converts elapsed wall-clock seconds into a bounded
 * number of fixed simulation steps. This is the single source of truth for how
 * many steps a scheduler turn runs; callers advance the simulation exactly
 * `steps` times and carry `accumulatorSeconds` into the next call.
 *
 * Catch-up policy: elapsed time beyond the step cap is *discarded* (not carried),
 * so a stalled tab resumes near real time instead of accumulating an unbounded
 * backlog. Negative or non-finite elapsed time contributes nothing.
 */
export function advanceFixedSteps(input: SchedulerInput): SchedulerResult {
  const { accumulatorSeconds, elapsedSeconds, speed, timestepSeconds, maxSteps } = input

  if (!(timestepSeconds > 0) || !Number.isFinite(timestepSeconds)) {
    throw new Error(`Scheduler timestep must be a positive finite number of seconds, received ${timestepSeconds}`)
  }
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new Error(`Scheduler maxSteps must be a positive integer, received ${maxSteps}`)
  }
  if (!SUPPORTED_SPEEDS.has(speed)) {
    throw new Error(`Scheduler speed multiplier ${speed} is not supported`)
  }

  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(elapsedSeconds, 0) : 0
  const pending = Math.min(
    accumulatorSeconds + elapsed * speed,
    // Cap carried work in seconds; converting the step cap keeps the leftover <= one step.
    maxSteps * timestepSeconds,
  )

  const steps = Math.min(Math.floor(pending / timestepSeconds), maxSteps)

  return {
    steps,
    accumulatorSeconds: pending - steps * timestepSeconds,
  }
}
