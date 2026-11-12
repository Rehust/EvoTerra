/**
 * Snapshot ordering across run boundaries.
 *
 * A bare tick/sequence number alone cannot protect against a reset race: a slow
 * snapshot from the previous run could carry a higher sequence than the first
 * snapshot of the new run and would win an in-order comparison. The worker
 * therefore increments a `runId` on every reset, and a snapshot is only
 * accepted when it belongs to the current run and advances that run's sequence.
 */
export interface SnapshotIdentity {
  readonly runId: number
  readonly sequence: number
}

export const isStaleSnapshot = (
  incoming: SnapshotIdentity,
  accepted: SnapshotIdentity | null,
): boolean => {
  if (accepted === null) return false
  if (incoming.runId !== accepted.runId) return incoming.runId < accepted.runId
  return incoming.sequence <= accepted.sequence
}
