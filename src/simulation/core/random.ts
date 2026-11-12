/**
 * Seeded pseudo-random source owned by the simulation worker.
 *
 * mulberry32: 32-bit state, one multiply-xorshift round per draw. Chosen because
 * the state is a single integer, which makes it trivial to copy for tests and,
 * later, to serialize into a save file.
 */
export interface RandomSource {
  /** Current 32-bit generator state. Assignable so a run can be resumed exactly. */
  state: number
  /** Uniform value in [0, 1). */
  next(): number
}

const UINT32_RANGE = 4294967296

export function createRandom(seed: number): RandomSource {
  if (!Number.isFinite(seed)) {
    throw new Error(`Random seed must be a finite number, received ${seed}`)
  }

  const source: RandomSource = {
    // Any numeric seed maps onto the generator's 32-bit domain.
    state: seed >>> 0,
    next(): number {
      source.state = (source.state + 0x6d2b79f5) >>> 0
      let t = source.state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE
    },
  }

  return source
}
