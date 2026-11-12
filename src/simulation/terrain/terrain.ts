import type { RandomSource } from '../core/random.ts'
import type { SimulationConfig, Terrain } from '../core/types.ts'

/**
 * Deterministic starter habitat: one grassland grid with a handful of
 * impassable rock clusters. This is a bounded test habitat, not the eventual
 * procedural biome generator.
 */

/** Sample offsets used to approximate a circle against a blocked cell. */
const CIRCLE_SAMPLE_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7071, 0.7071],
  [-0.7071, 0.7071],
  [0.7071, -0.7071],
  [-0.7071, -0.7071],
] as const

const cellIndex = (terrain: Terrain, col: number, row: number): number => row * terrain.cols + col

export function isCellPassable(terrain: Terrain, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= terrain.cols || row >= terrain.rows) return false
  return terrain.passable[cellIndex(terrain, col, row)] === 1
}

export function isPassableAt(terrain: Terrain, x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false
  return isCellPassable(
    terrain,
    Math.floor(x / terrain.cellSize),
    Math.floor(y / terrain.cellSize),
  )
}

/**
 * Continuous-radius check. Samples the centre plus cardinal and diagonal points
 * at 90% of the radius, so a creature cannot significantly overlap a rock cell
 * without needing a full physics engine.
 */
export function isCirclePassable(terrain: Terrain, x: number, y: number, radius: number): boolean {
  if (!isPassableAt(terrain, x, y)) return false
  const sampleRadius = radius * 0.9
  for (const [ dx, dy ] of CIRCLE_SAMPLE_DIRECTIONS) {
    if (!isPassableAt(terrain, x + dx * sampleRadius, y + dy * sampleRadius)) return false
  }
  return true
}

/** Same seed and config always produce the same rock layout. */
export function createStarterTerrain(config: SimulationConfig, random: RandomSource): Terrain {
  const { world, terrain: terrainConfig } = config
  const cellSize = terrainConfig.cellSize
  const cols = Math.ceil(world.width / cellSize)
  const rows = Math.ceil(world.height / cellSize)
  const passable = new Uint8Array(cols * rows).fill(1)
  const terrain: Terrain = { cellSize, cols, rows, passable }

  for (let cluster = 0; cluster < terrainConfig.rockClusterCount; cluster += 1) {
    const centreCol = Math.floor(random.next() * cols)
    const centreRow = Math.floor(random.next() * rows)
    const radiusCells =
      terrainConfig.rockClusterMinRadiusCells +
      Math.floor(
        random.next() *
          (terrainConfig.rockClusterMaxRadiusCells - terrainConfig.rockClusterMinRadiusCells + 1),
      )

    for (let row = centreRow - radiusCells; row <= centreRow + radiusCells; row += 1) {
      for (let col = centreCol - radiusCells; col <= centreCol + radiusCells; col += 1) {
        if (col < 0 || row < 0 || col >= cols || row >= rows) continue
        const dx = col - centreCol
        const dy = row - centreRow
        if (dx * dx + dy * dy <= radiusCells * radiusCells) {
          passable[cellIndex(terrain, col, row)] = 0
        }
      }
    }
  }

  return terrain
}

/** Centre of the nearest passable cell, scanning outward deterministically. */
export function findNearestPassablePoint(
  terrain: Terrain,
  x: number,
  y: number,
): { x: number; y: number } | null {
  const startCol = Math.min(terrain.cols - 1, Math.max(0, Math.floor(x / terrain.cellSize)))
  const startRow = Math.min(terrain.rows - 1, Math.max(0, Math.floor(y / terrain.cellSize)))
  const maxRing = Math.max(terrain.cols, terrain.rows)

  for (let ring = 0; ring <= maxRing; ring += 1) {
    for (let row = startRow - ring; row <= startRow + ring; row += 1) {
      for (let col = startCol - ring; col <= startCol + ring; col += 1) {
        if (Math.abs(col - startCol) !== ring && Math.abs(row - startRow) !== ring) continue
        if (!isCellPassable(terrain, col, row)) continue
        return {
          x: (col + 0.5) * terrain.cellSize,
          y: (row + 0.5) * terrain.cellSize,
        }
      }
    }
  }

  return null
}
