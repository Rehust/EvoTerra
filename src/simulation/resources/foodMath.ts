/**
 * Food amount math. Kept separate from placement so regeneration is testable
 * without a terrain grid. Units: food amount per second.
 */
export function clampFoodAmount(amount: number, capacity: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.min(capacity, Math.max(0, amount))
}

export function regenerateFood(
  amount: number,
  regenerationPerSecond: number,
  timestepSeconds: number,
): number {
  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(regenerationPerSecond) ||
    !Number.isFinite(timestepSeconds) ||
    regenerationPerSecond <= 0 ||
    timestepSeconds <= 0
  ) {
    return Number.isFinite(amount) ? amount : 0
  }
  return amount + regenerationPerSecond * timestepSeconds
}
