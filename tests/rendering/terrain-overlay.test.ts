import { describe, expect, it } from 'vitest'
import { FOOD_PATCH_CAPACITY, DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import { SimulationSession } from '../../src/simulation/core/session.ts'
import {
  DEFAULT_OVERLAYS,
  countTerrainCells,
  describeTerrainCell,
  foodHeatGrid,
  heatIntensity,
  terrainCellAt,
} from '../../src/rendering/terrainOverlay.ts'
import type {
  FoodSnapshot,
  SnapshotEvent,
  TerrainSnapshot,
  WorldEvent,
} from '../../src/shared/messages.ts'

const bounds = { width: 64, height: 48 }
const terrain: TerrainSnapshot = {
  cellSize: 16,
  cols: 4,
  rows: 3,
  // Row 1, column 2 is rock; everything else is grass.
  passable: new Uint8Array([1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1]),
}

const foodAt = (id: number, x: number, y: number, amountRatio: number): FoodSnapshot => ({
  id,
  x,
  y,
  amountRatio,
})

describe('terrainCellAt', () => {
  it('maps a world point to its grid cell', () => {
    expect(terrainCellAt(bounds, terrain, 0, 0)).toEqual({ col: 0, row: 0 })
    expect(terrainCellAt(bounds, terrain, 33, 20)).toEqual({ col: 2, row: 1 })
  })

  it('clamps the last partial cell into the grid', () => {
    expect(terrainCellAt(bounds, terrain, bounds.width - 0.5, bounds.height - 0.5)).toEqual({
      col: 3,
      row: 2,
    })
  })

  it('returns null outside the world or for non-finite input', () => {
    for (const [x, y] of [
      [-1, 10],
      [10, -1],
      [bounds.width, 10],
      [10, bounds.height],
      [Number.NaN, 10],
    ]) {
      expect(terrainCellAt(bounds, terrain, x, y)).toBeNull()
    }
  })
})

describe('countTerrainCells', () => {
  it('counts passable and rock cells', () => {
    expect(countTerrainCells(terrain)).toEqual({ passable: 11, rock: 1 })
  })
})

describe('describeTerrainCell', () => {
  it('reports the cell, its passability, and nearby food only', () => {
    const food = [foodAt(1, 10, 10, 0.5), foodAt(2, 200, 200, 1)]
    const description = describeTerrainCell(bounds, terrain, food, 12, 12)

    expect(description).not.toBeNull()
    expect(description?.col).toBe(0)
    expect(description?.row).toBe(0)
    expect(description?.passable).toBe(true)
    // Only the first patch is within the 64-unit detail radius.
    expect(description?.foodPatches).toBe(1)
    expect(description?.foodUnits).toBeCloseTo(0.5 * FOOD_PATCH_CAPACITY, 6)
  })

  it('flags a rock cell', () => {
    const description = describeTerrainCell(bounds, terrain, [], 33, 20)

    expect(description?.passable).toBe(false)
    expect(description?.foodUnits).toBe(0)
  })

  it('returns null for a click outside the world', () => {
    expect(describeTerrainCell(bounds, terrain, [], -4, 10)).toBeNull()
  })
})

describe('foodHeatGrid', () => {
  it('sums food units into the cell containing each patch', () => {
    const grid = foodHeatGrid({ width: 128, height: 64 }, [
      foodAt(1, 10, 10, 0.5),
      foodAt(2, 20, 40, 1),
      foodAt(3, 100, 10, 1),
      foodAt(4, 200, 10, 1),
    ])

    expect(grid.cols).toBe(2)
    expect(grid.rows).toBe(1)
    expect(grid.units[0]).toBeCloseTo(1.5 * FOOD_PATCH_CAPACITY, 6)
    expect(grid.units[1]).toBeCloseTo(FOOD_PATCH_CAPACITY, 6)
  })
})

describe('heatIntensity', () => {
  it('is 0 for empty or invalid cells and saturates at 1', () => {
    expect(heatIntensity(0)).toBe(0)
    expect(heatIntensity(Number.NaN)).toBe(0)
    expect(heatIntensity(FOOD_PATCH_CAPACITY)).toBeCloseTo(0.5, 6)
    expect(heatIntensity(FOOD_PATCH_CAPACITY * 10)).toBe(1)
  })
})

describe('DEFAULT_OVERLAYS', () => {
  it('shows only the grid by default', () => {
    expect(DEFAULT_OVERLAYS).toEqual({ grid: true, senseRadii: false, foodHeat: false })
  })
})

describe('terrain UI against real worker payloads', () => {
  it('derives counts, cell info, and heat from a real WORLD and SNAPSHOT', () => {
    const session = new SimulationSession(DEFAULT_SIMULATION_CONFIG)
    const events = session.handleCommand({ type: 'INIT', seed: 42 })
    const world = events.find((event): event is WorldEvent => event.type === 'WORLD')
    const snapshot = events.find((event): event is SnapshotEvent => event.type === 'SNAPSHOT')
    expect(world).toBeDefined()
    expect(snapshot).toBeDefined()
    if (world === undefined || snapshot === undefined) return

    const counts = countTerrainCells(world.terrain)
    expect(counts.passable + counts.rock).toBe(world.terrain.cols * world.terrain.rows)
    expect(counts.rock).toBeGreaterThan(0)

    const patch = snapshot.food[0]
    expect(patch).toBeDefined()
    if (patch === undefined) return
    const description = describeTerrainCell(world.bounds, world.terrain, snapshot.food, patch.x, patch.y)
    expect(description).not.toBeNull()
    // Food never spawns on rock, so its own cell must be passable.
    expect(description?.passable).toBe(true)
    expect(description?.foodPatches).toBeGreaterThan(0)

    const grid = foodHeatGrid(world.bounds, snapshot.food)
    let heatTotal = 0
    for (const units of grid.units) heatTotal += units
    const expectedTotal = snapshot.food.reduce(
      (sum, item) => sum + item.amountRatio * FOOD_PATCH_CAPACITY,
      0,
    )
    expect(heatTotal).toBeCloseTo(expectedTotal, 6)
  })
})
