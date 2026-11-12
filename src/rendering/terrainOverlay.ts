import type { FoodSnapshot, TerrainSnapshot } from '../shared/messages.ts'
import type { WorldBounds } from '../simulation/core/types.ts'
import { FOOD_PATCH_CAPACITY } from '../simulation/core/config.ts'

/**
 * Pure derivations for the terrain UI: cell lookup, food aggregation, and the
 * overlay flags. The PixiJS layer only draws these results, so everything here
 * is testable without a browser.
 */

/** Food is summed within this world-unit radius of a clicked cell. */
export const CELL_DETAIL_RADIUS = 64
/** Heat overlay resolution in world units; coarser than a terrain cell. */
export const HEAT_CELL_SIZE = 64
/** Two full patches per heat cell read as fully saturated. */
const HEAT_SATURATION_UNITS = FOOD_PATCH_CAPACITY * 2

export interface TerrainCell {
  readonly col: number
  readonly row: number
}

export interface TerrainCounts {
  readonly passable: number
  readonly rock: number
}

export interface CellDescription {
  readonly col: number
  readonly row: number
  readonly x: number
  readonly y: number
  readonly passable: boolean
  /** Food units within CELL_DETAIL_RADIUS of the click, estimated from ratios. */
  readonly foodUnits: number
  readonly foodPatches: number
}

export interface FoodHeatGrid {
  readonly cols: number
  readonly rows: number
  /** Food units per HEAT_CELL_SIZE square, row-major. */
  readonly units: Float32Array
}

/** Overlay switches owned by React, read by the renderer once per frame. */
export interface OverlayOptions {
  readonly grid: boolean
  readonly senseRadii: boolean
  readonly foodHeat: boolean
}

export const DEFAULT_OVERLAYS: OverlayOptions = {
  grid: true,
  senseRadii: false,
  foodHeat: false,
}

/** Cell containing a world point, or null outside the world bounds. */
export function terrainCellAt(
  bounds: WorldBounds,
  terrain: TerrainSnapshot,
  x: number,
  y: number,
): TerrainCell | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  if (x < 0 || y < 0 || x >= bounds.width || y >= bounds.height) return null
  return {
    col: Math.min(terrain.cols - 1, Math.floor(x / terrain.cellSize)),
    row: Math.min(terrain.rows - 1, Math.floor(y / terrain.cellSize)),
  }
}

export function countTerrainCells(terrain: TerrainSnapshot): TerrainCounts {
  let passable = 0
  for (const value of terrain.passable) if (value === 1) passable += 1
  return { passable, rock: terrain.passable.length - passable }
}

/** Units in one food snapshot. Patches share the documented capacity. */
const unitsOf = (food: FoodSnapshot): number => food.amountRatio * FOOD_PATCH_CAPACITY

/** Everything the terrain panel shows for one clicked point. */
export function describeTerrainCell(
  bounds: WorldBounds,
  terrain: TerrainSnapshot,
  food: readonly FoodSnapshot[],
  x: number,
  y: number,
): CellDescription | null {
  const cell = terrainCellAt(bounds, terrain, x, y)
  if (cell === null) return null

  const squaredLimit = CELL_DETAIL_RADIUS * CELL_DETAIL_RADIUS
  let foodUnits = 0
  let foodPatches = 0
  for (const item of food) {
    const dx = item.x - x
    const dy = item.y - y
    if (dx * dx + dy * dy > squaredLimit) continue
    foodUnits += unitsOf(item)
    foodPatches += 1
  }

  return {
    col: cell.col,
    row: cell.row,
    x,
    y,
    passable: terrain.passable[cell.row * terrain.cols + cell.col] === 1,
    foodUnits,
    foodPatches,
  }
}

/** Food totals per HEAT_CELL_SIZE square for the heat overlay. */
export function foodHeatGrid(
  bounds: WorldBounds,
  food: readonly FoodSnapshot[],
): FoodHeatGrid {
  const cols = Math.max(1, Math.ceil(bounds.width / HEAT_CELL_SIZE))
  const rows = Math.max(1, Math.ceil(bounds.height / HEAT_CELL_SIZE))
  const units = new Float32Array(cols * rows)

  for (const item of food) {
    if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) continue
    if (item.x < 0 || item.y < 0 || item.x >= bounds.width || item.y >= bounds.height) continue
    const col = Math.min(cols - 1, Math.floor(item.x / HEAT_CELL_SIZE))
    const row = Math.min(rows - 1, Math.floor(item.y / HEAT_CELL_SIZE))
    units[row * cols + col] += unitsOf(item)
  }

  return { cols, rows, units }
}

/** 0..1 heat intensity, used as the overlay alpha per cell. */
export function heatIntensity(unitsInCell: number): number {
  if (!Number.isFinite(unitsInCell) || unitsInCell <= 0) return 0
  return Math.min(1, unitsInCell / HEAT_SATURATION_UNITS)
}
