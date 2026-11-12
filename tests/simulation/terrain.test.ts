import { describe, expect, it } from 'vitest'
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/config.ts'
import { createRandom } from '../../src/simulation/core/random.ts'
import {
  createStarterTerrain,
  findNearestPassablePoint,
  isCellPassable,
  isCirclePassable,
  isPassableAt,
} from '../../src/simulation/terrain/terrain.ts'

const config = DEFAULT_SIMULATION_CONFIG

describe('starter terrain', () => {
  it('has the expected grid dimensions for the world', () => {
    const terrain = createStarterTerrain(config, createRandom(1))

    expect(terrain.cellSize).toBe(config.terrain.cellSize)
    expect(terrain.cols).toBe(Math.ceil(config.world.width / config.terrain.cellSize))
    expect(terrain.rows).toBe(Math.ceil(config.world.height / config.terrain.cellSize))
    expect(terrain.passable).toHaveLength(terrain.cols * terrain.rows)
  })

  it('is reproducible from the same seed', () => {
    const first = createStarterTerrain(config, createRandom(4242))
    const second = createStarterTerrain(config, createRandom(4242))

    expect(first.passable).toEqual(second.passable)
  })

  it('creates both passable grassland and impassable rock', () => {
    const terrain = createStarterTerrain(config, createRandom(4242))

    expect(terrain.passable.some((value) => value === 1)).toBe(true)
    expect(terrain.passable.some((value) => value === 0)).toBe(true)
  })

  it('reports out-of-world cells and points as impassable', () => {
    const terrain = createStarterTerrain(config, createRandom(1))

    expect(isCellPassable(terrain, -1, 0)).toBe(false)
    expect(isCellPassable(terrain, 0, -1)).toBe(false)
    expect(isCellPassable(terrain, terrain.cols, 0)).toBe(false)
    expect(isPassableAt(terrain, Number.NaN, 10)).toBe(false)
  })

  it('blocks a circle that would overlap rock and allows one in open grass', () => {
    const terrain = createStarterTerrain(config, createRandom(4242))
    const blocked = terrain.passable.findIndex((value) => value === 0)
    expect(blocked).toBeGreaterThanOrEqual(0)
    const blockedCol = blocked % terrain.cols
    const blockedRow = Math.floor(blocked / terrain.cols)
    const blockedX = (blockedCol + 0.5) * terrain.cellSize
    const blockedY = (blockedRow + 0.5) * terrain.cellSize

    expect(isCirclePassable(terrain, blockedX, blockedY, config.creature.baseRadius)).toBe(false)

    const open = findNearestPassablePoint(terrain, config.world.width / 2, config.world.height / 2)
    expect(open).not.toBeNull()
    expect(isPassableAt(terrain, open!.x, open!.y)).toBe(true)
  })

  it('finds a passable point when asked about a blocked cell', () => {
    const terrain = createStarterTerrain(config, createRandom(4242))
    const blocked = terrain.passable.findIndex((value) => value === 0)
    const col = blocked % terrain.cols
    const row = Math.floor(blocked / terrain.cols)
    const found = findNearestPassablePoint(
      terrain,
      (col + 0.5) * terrain.cellSize,
      (row + 0.5) * terrain.cellSize,
    )

    expect(found).not.toBeNull()
    expect(isPassableAt(terrain, found!.x, found!.y)).toBe(true)
  })
})
