/**
 * Refresh throttle for the tick/entity readout.
 *
 * Snapshots arrive at ~15 Hz but the status panel should update ~2 times per
 * second, so the panel throttles them. Extracted as a pure predicate because the
 * first snapshot must not be throttled: on a fast machine it arrives before the
 * interval has elapsed, and dropping it would leave "Tick: —" on screen until
 * the user pressed Start.
 */
export interface SummaryRefreshState {
  /** Tick of the snapshot the panel is currently showing; -1 before any. */
  readonly lastTick: number
  /** Time the panel last refreshed, or null before the first refresh. */
  readonly lastAcceptedMs: number | null
}

export const createSummaryRefreshState = (): SummaryRefreshState => ({
  lastTick: -1,
  lastAcceptedMs: null,
})

export function shouldRefreshSummary(
  state: SummaryRefreshState,
  tick: number,
  nowMs: number,
  intervalMs: number,
): boolean {
  if (state.lastAcceptedMs === null) return true
  // A reset lowers the tick; show that immediately instead of waiting.
  if (tick < state.lastTick) return true
  return nowMs - state.lastAcceptedMs >= intervalMs
}

export const nextSummaryRefreshState = (
  tick: number,
  nowMs: number,
): SummaryRefreshState => ({ lastTick: tick, lastAcceptedMs: nowMs })
