import { describe, expect, it } from 'vitest'
import {
  createSummaryRefreshState,
  shouldRefreshSummary,
} from '../../src/app/summaryThrottle.ts'

const intervalMs = 500

describe('shouldRefreshSummary', () => {
  it('accepts the very first snapshot even when the page just loaded', () => {
    const state = createSummaryRefreshState()

    expect(shouldRefreshSummary(state, 0, 5, intervalMs)).toBe(true)
  })

  it('rejects a snapshot inside the refresh interval', () => {
    const state = { lastTick: 10, lastAcceptedMs: 1000 }

    expect(shouldRefreshSummary(state, 11, 1200, intervalMs)).toBe(false)
  })

  it('accepts a snapshot once the refresh interval has passed', () => {
    const state = { lastTick: 10, lastAcceptedMs: 1000 }

    expect(shouldRefreshSummary(state, 40, 1500, intervalMs)).toBe(true)
  })

  it('accepts immediately when the tick moves backwards, as it does after a reset', () => {
    const state = { lastTick: 400, lastAcceptedMs: 1000 }

    expect(shouldRefreshSummary(state, 0, 1010, intervalMs)).toBe(true)
  })
})
