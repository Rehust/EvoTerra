import { describe, expect, it } from 'vitest'
import { isStaleSnapshot } from '../../src/shared/snapshotOrder.ts'

describe('isStaleSnapshot', () => {
  it('accepts the first snapshot of a run', () => {
    expect(isStaleSnapshot({ runId: 1, sequence: 1 }, null)).toBe(false)
  })

  it('rejects a repeat of the snapshot already rendered', () => {
    expect(isStaleSnapshot({ runId: 1, sequence: 7 }, { runId: 1, sequence: 7 })).toBe(true)
  })

  it('rejects an out-of-order snapshot within the same run', () => {
    expect(isStaleSnapshot({ runId: 1, sequence: 6 }, { runId: 1, sequence: 7 })).toBe(true)
  })

  it('accepts a newer snapshot within the same run', () => {
    expect(isStaleSnapshot({ runId: 1, sequence: 8 }, { runId: 1, sequence: 7 })).toBe(false)
  })

  it('accepts a snapshot from a newer run even when its sequence restarts', () => {
    expect(isStaleSnapshot({ runId: 2, sequence: 1 }, { runId: 1, sequence: 500 })).toBe(false)
  })

  it('rejects leftover snapshots from a run that has already been replaced', () => {
    expect(isStaleSnapshot({ runId: 1, sequence: 501 }, { runId: 2, sequence: 1 })).toBe(true)
  })
})
