import { describe, expect, it } from 'vitest'
import { SpatialGrid } from '../../src/simulation/spatial/spatialGrid.ts'

interface Point {
  readonly id: number
  x: number
  y: number
}

const point = (id: number, x: number, y: number): Point => ({ id, x, y })
const ids = (items: readonly Point[]): number[] => items.map((item) => item.id)

describe('SpatialGrid', () => {
  it('returns items inside the query radius and excludes items outside it', () => {
    const grid = new SpatialGrid<Point>(10, 100, 100)
    grid.insert(point(0, 0, 0))
    grid.insert(point(1, 15, 0))
    grid.insert(point(2, 99, 99))

    expect(ids(grid.queryRadius(0, 0, 20))).toEqual([0, 1])
    expect(ids(grid.queryRadius(0, 0, 0))).toEqual([0])
  })

  it('updates the cell when an item moves', () => {
    const grid = new SpatialGrid<Point>(10, 100, 100)
    const moving = point(1, 80, 80)
    grid.insert(moving)
    grid.update(point(1, 5, 0))

    expect(ids(grid.queryRadius(0, 0, 10))).toEqual([1])
    expect(grid.queryRadius(80, 80, 1)).toHaveLength(0)
  })

  it('removes an item and reports the reduced size', () => {
    const grid = new SpatialGrid<Point>(10, 100, 100)
    grid.insert(point(1, 5, 5))
    grid.insert(point(2, 6, 6))
    expect(grid.size).toBe(2)

    grid.remove(1)

    expect(grid.size).toBe(1)
    expect(ids(grid.queryRadius(0, 0, 20))).toEqual([2])
  })

  it('never returns duplicate ids and returns a stable ascending order', () => {
    const grid = new SpatialGrid<Point>(10, 100, 100)
    for (const id of [9, 3, 7, 1, 5]) grid.insert(point(id, 20, 20))

    expect(ids(grid.queryRadius(20, 20, 1))).toEqual([1, 3, 5, 7, 9])
    expect(ids(grid.queryRadius(20, 20, 1))).toEqual(ids(grid.queryRadius(20, 20, 1)))
  })

  it('handles coordinates outside the world by clamping their cell safely', () => {
    const grid = new SpatialGrid<Point>(10, 100, 100)
    grid.insert(point(4, -500, 500))

    expect(grid.size).toBe(1)
    expect(grid.queryRadius(0, 0, 0)).toHaveLength(0)
    expect(ids(grid.queryRadius(0, 0, 10_000))).toEqual([4])
  })

  it('rejects invalid cell sizes and dimensions', () => {
    expect(() => new SpatialGrid<Point>(0, 100, 100)).toThrow(/cellSize/)
    expect(() => new SpatialGrid<Point>(10, 0, 100)).toThrow(/dimensions/)
    expect(() => new SpatialGrid<Point>(10, Number.NaN, 100)).toThrow(/dimensions/)
  })
})
