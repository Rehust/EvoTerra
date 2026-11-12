/**
 * Compact uniform spatial grid (spatial hash) for nearby-object queries.
 *
 * Every item occupies exactly one cell. Queries return items sorted by ascending
 * id so tie-breaking never depends on Map insertion order. Coordinates outside
 * the world are clamped to the nearest cell, which keeps them indexed safely;
 * the distance filter still excludes them from radius queries.
 */

export interface SpatialItem {
  readonly id: number
  x: number
  y: number
}

export class SpatialGrid<T extends SpatialItem> {
  private readonly cellSize: number
  private readonly cols: number
  private readonly rows: number
  private readonly cells = new Map<number, T[]>()
  private readonly cellById = new Map<number, number>()

  constructor(cellSize: number, width: number, height: number) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) {
      throw new Error(`Spatial grid cellSize must be a positive finite number, received ${cellSize}`)
    }
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error(`Spatial grid dimensions must be positive finite numbers, received ${width}x${height}`)
    }
    this.cellSize = cellSize
    this.cols = Math.max(1, Math.ceil(width / cellSize))
    this.rows = Math.max(1, Math.ceil(height / cellSize))
  }

  /** Number of indexed items; used by tests and cleanup checks. */
  get size(): number {
    return this.cellById.size
  }

  clear(): void {
    this.cells.clear()
    this.cellById.clear()
  }

  insert(item: T): void {
    this.remove(item.id)
    const key = this.cellKey(this.colOf(item.x), this.rowOf(item.y))
    const bucket = this.cells.get(key)
    if (bucket === undefined) this.cells.set(key, [item])
    else bucket.push(item)
    this.cellById.set(item.id, key)
  }

  /** Re-indexes an item after its position changed. */
  update(item: T): void {
    this.insert(item)
  }

  remove(id: number): void {
    const key = this.cellById.get(id)
    if (key === undefined) return
    this.cellById.delete(id)
    const bucket = this.cells.get(key)
    if (bucket === undefined) return
    const index = bucket.findIndex((item) => item.id === id)
    if (index >= 0) bucket.splice(index, 1)
    if (bucket.length === 0) this.cells.delete(key)
  }

  /** Items whose centres are within `radius` of (x, y), ascending by id. */
  queryRadius(x: number, y: number, radius: number): T[] {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius < 0) {
      return []
    }

    const minCol = this.colOf(x - radius)
    const maxCol = this.colOf(x + radius)
    const minRow = this.rowOf(y - radius)
    const maxRow = this.rowOf(y + radius)
    const radiusSquared = radius * radius
    const matches: T[] = []

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const bucket = this.cells.get(this.cellKey(col, row))
        if (bucket === undefined) continue
        for (const item of bucket) {
          const dx = item.x - x
          const dy = item.y - y
          if (dx * dx + dy * dy <= radiusSquared) matches.push(item)
        }
      }
    }

    matches.sort((a, b) => a.id - b.id)
    return matches
  }

  private colOf(x: number): number {
    if (!Number.isFinite(x)) return 0
    return Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cellSize)))
  }

  private rowOf(y: number): number {
    if (!Number.isFinite(y)) return 0
    return Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)))
  }

  private cellKey(col: number, row: number): number {
    return row * this.cols + col
  }
}
