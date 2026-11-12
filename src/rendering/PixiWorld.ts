import { Application, Container, Graphics } from 'pixi.js'
import type {
  CreatureSnapshot,
  FoodSnapshot,
  SnapshotEvent,
  WorldEvent,
} from '../shared/messages.ts'
import type { WorldBounds } from '../simulation/core/types.ts'
import {
  cameraTransform,
  clampCameraToWorld,
  panCamera,
  screenToWorld,
  zoomCamera,
  MIN_ZOOM,
  type Camera,
} from './camera.ts'

/**
 * PixiJS world viewport.
 *
 * Ownership: this module owns the canvas, display objects, and camera. It never
 * owns authoritative state: each frame it copies the newest world/snapshot from
 * the worker. Sprites are pooled by stable id and reused; nothing is recreated
 * per frame. React never renders a component per creature or resource.
 */

export interface PixiWorldOptions {
  /** Host element the canvas is appended to; also the resize source. */
  readonly host: HTMLElement
  readonly getSnapshot: () => SnapshotEvent | null
  readonly getWorld: () => WorldEvent | null
  readonly getSelectedId: () => number | null
  /** Called with a creature id, or null when empty terrain is clicked. */
  readonly onSelect: (creatureId: number | null) => void
}

/** World-unit spacing of the background guide lines. */
const GRID_SPACING = 128
/** Palette is indexed by the creature's stable hue. */
const CREATURE_PALETTE = [0x8fe3a1, 0x4fb3a9, 0x6fb3e0, 0xd8c46a, 0xd98f6a, 0xb58fe0] as const
const HUE_SEGMENTS = 360 / CREATURE_PALETTE.length
const WHEEL_ZOOM_SENSITIVITY = 0.0015
const FOOD_RADIUS = 3.5
const PICK_RADIUS_PADDING = 4
const CLICK_DRAG_TOLERANCE_PX = 4

const creatureColor = (hue: number): number => {
  const index = Math.floor(hue / HUE_SEGMENTS) % CREATURE_PALETTE.length
  return CREATURE_PALETTE[index] ?? CREATURE_PALETTE[0]
}

export class PixiWorld {
  private readonly getSnapshot: () => SnapshotEvent | null
  private readonly getWorld: () => WorldEvent | null
  private readonly getSelectedId: () => number | null
  private readonly onSelect: (creatureId: number | null) => void
  private readonly host: HTMLElement
  private readonly app: Application
  private readonly worldLayer = new Container()
  private readonly terrainLayer = new Graphics()
  private readonly grid = new Graphics()
  private readonly worldBorder = new Graphics()
  private readonly foodLayer = new Container()
  private readonly creatureLayer = new Container()
  private readonly selectionLayer = new Graphics()
  private readonly foodSprites = new Map<number, Graphics>()
  private readonly creatureSprites = new Map<number, Graphics>()
  private readonly resizeObserver: ResizeObserver
  private camera: Camera | null = null
  private bounds: WorldBounds | null = null
  private worldRunId: number | null = null
  private dragPointerId: number | null = null
  private dragMoved = false
  private dragStart = { x: 0, y: 0 }
  private lastPointer = { x: 0, y: 0 }
  private disposed = false

  private constructor(options: PixiWorldOptions, app: Application) {
    this.host = options.host
    this.getSnapshot = options.getSnapshot
    this.getWorld = options.getWorld
    this.getSelectedId = options.getSelectedId
    this.onSelect = options.onSelect
    this.app = app
    this.resizeObserver = new ResizeObserver(() => this.resize())
  }

  /**
   * Creates and mounts the renderer. Throws if WebGL is unavailable - there is
   * no Canvas fallback, by design, so the caller can show a clear error.
   */
  static async create(options: PixiWorldOptions): Promise<PixiWorld> {
    const app = new Application()
    await app.init({
      background: '#070b10',
      antialias: true,
      preference: ['webgl'],
      autoDensity: true,
      resolution: globalThis.devicePixelRatio ?? 1,
      width: Math.max(options.host.clientWidth, 1),
      height: Math.max(options.host.clientHeight, 1),
    })

    if (app.renderer.name !== 'webgl') {
      app.destroy({ removeView: true }, { children: true })
      throw new Error(`EvoTerra requires a WebGL renderer, but PixiJS initialized "${app.renderer.name}".`)
    }

    const world = new PixiWorld(options, app)
    try {
      world.mount()
    } catch (error) {
      world.destroy()
      throw error
    }
    return world
  }

  private mount(): void {
    this.worldLayer.addChild(
      this.terrainLayer,
      this.grid,
      this.worldBorder,
      this.foodLayer,
      this.creatureLayer,
      this.selectionLayer,
    )
    this.app.stage.addChild(this.worldLayer)
    this.host.appendChild(this.app.canvas)

    const canvas = this.app.canvas
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'grab'

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.resizeObserver.observe(this.host)

    this.app.ticker.add(this.render)
    this.resize()
  }

  /** Tears down listeners, observers, display objects, and the renderer. */
  destroy(): void {
    if (this.disposed) return
    this.disposed = true

    this.app.ticker.remove(this.render)
    this.resizeObserver.disconnect()

    const canvas = this.app.canvas
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('pointerup', this.onPointerUp)
    canvas.removeEventListener('pointercancel', this.onPointerUp)
    canvas.removeEventListener('wheel', this.onWheel)

    this.foodSprites.clear()
    this.creatureSprites.clear()
    this.app.destroy({ removeView: true }, { children: true })
  }

  /** Viewport size in CSS pixels; mirrors the host element. */
  private viewport = { width: 1, height: 1 }

  private resize = (): void => {
    if (this.disposed) return
    const width = Math.max(this.host.clientWidth, 1)
    const height = Math.max(this.host.clientHeight, 1)
    this.viewport = { width, height }
    this.app.renderer.resize(width, height)
    this.applyCamera()
  }

  /** Builds the static scene once per run, when its WORLD event arrives. */
  private setupWorld(world: WorldEvent): void {
    const bounds = world.bounds
    this.bounds = bounds
    this.worldRunId = world.runId

    const { cellSize, cols, rows, passable } = world.terrain
    this.terrainLayer.clear()
    this.terrainLayer.rect(0, 0, bounds.width, bounds.height).fill({ color: 0x0d1a14 })
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (passable[row * cols + col] === 1) continue
        this.terrainLayer
          .rect(col * cellSize, row * cellSize, cellSize, cellSize)
          .fill({ color: 0x2b333b })
      }
    }

    this.grid.clear()
    for (let x = 0; x <= bounds.width; x += GRID_SPACING) {
      this.grid.moveTo(x, 0).lineTo(x, bounds.height)
    }
    for (let y = 0; y <= bounds.height; y += GRID_SPACING) {
      this.grid.moveTo(0, y).lineTo(bounds.width, y)
    }
    this.grid.stroke({ width: 1, color: 0x1c2733, alpha: 0.7 })

    this.worldBorder
      .clear()
      .rect(0, 0, bounds.width, bounds.height)
      .stroke({ width: 2, color: 0x2f4657, alpha: 1 })

    // A run reset reuses ids, so drop old visual objects.
    this.foodSprites.clear()
    this.foodLayer.removeChildren()
    this.creatureSprites.clear()
    this.creatureLayer.removeChildren()

    if (this.camera === null) {
      const fit = Math.min(this.viewport.width / bounds.width, this.viewport.height / bounds.height)
      this.camera = clampCameraToWorld(
        {
          cx: bounds.width / 2,
          cy: bounds.height / 2,
          zoom: Math.max(Math.min(fit * 0.95, 1), MIN_ZOOM),
        },
        bounds,
      )
    }
    this.applyCamera()
  }

  private applyCamera(): void {
    if (!this.camera) return
    const transform = cameraTransform(this.camera, this.viewport)
    this.worldLayer.scale.set(transform.scale)
    this.worldLayer.position.set(transform.x, transform.y)
  }

  private render = (): void => {
    if (this.disposed) return

    const world = this.getWorld()
    if (world && world.runId !== this.worldRunId) this.setupWorld(world)

    const snapshot = this.getSnapshot()
    if (!snapshot || this.bounds === null) return
    if (snapshot.runId !== this.worldRunId) return

    this.syncFood(snapshot.food)
    this.syncCreatures(snapshot.creatures)
    this.drawSelection(snapshot.creatures)
  }

  private syncFood(food: readonly FoodSnapshot[]): void {
    for (const item of food) {
      let sprite = this.foodSprites.get(item.id)
      if (sprite === undefined) {
        sprite = new Graphics().circle(0, 0, FOOD_RADIUS).fill({ color: 0x7fd18b })
        this.foodSprites.set(item.id, sprite)
        this.foodLayer.addChild(sprite)
      }
      sprite.position.set(item.x, item.y)
      sprite.scale.set(0.35 + 0.65 * item.amountRatio)
      sprite.alpha = 0.25 + 0.75 * item.amountRatio
    }
  }

  private syncCreatures(creatures: readonly CreatureSnapshot[]): void {
    const seen = new Set<number>()
    for (const creature of creatures) {
      seen.add(creature.id)
      let sprite = this.creatureSprites.get(creature.id)
      if (sprite === undefined) {
        sprite = new Graphics()
          .circle(0, 0, creature.radius)
          .fill({ color: creatureColor(creature.hue), alpha: 1 })
        this.creatureSprites.set(creature.id, sprite)
        this.creatureLayer.addChild(sprite)
      }
      sprite.position.set(creature.x, creature.y)
      sprite.alpha = 0.4 + 0.6 * creature.energyRatio
    }

    for (const [id, sprite] of this.creatureSprites) {
      if (seen.has(id)) continue
      this.creatureLayer.removeChild(sprite)
      sprite.destroy()
      this.creatureSprites.delete(id)
    }
  }

  private drawSelection(creatures: readonly CreatureSnapshot[]): void {
    const selectedId = this.getSelectedId()
    this.selectionLayer.clear()
    if (selectedId === null) return
    const selected = creatures.find((creature) => creature.id === selectedId)
    if (selected === undefined) return
    this.selectionLayer
      .circle(selected.x, selected.y, selected.radius + 3)
      .stroke({ width: 1.5, color: 0xf4e4a6, alpha: 1 })
  }

  private localPoint(event: PointerEvent | WheelEvent): { x: number; y: number } {
    const rect = this.app.canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  private pickCreature(point: { x: number; y: number }): number | null {
    if (!this.camera) return null
    const snapshot = this.getSnapshot()
    if (!snapshot) return null
    const worldPoint = screenToWorld(this.camera, this.viewport, point)
    let bestId: number | null = null
    let bestSquared = Number.POSITIVE_INFINITY

    for (const creature of snapshot.creatures) {
      const dx = creature.x - worldPoint.x
      const dy = creature.y - worldPoint.y
      const squared = dx * dx + dy * dy
      const reach = creature.radius + PICK_RADIUS_PADDING
      if (squared > reach * reach) continue
      if (squared < bestSquared) {
        bestSquared = squared
        bestId = creature.id
      }
    }
    return bestId
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    this.dragPointerId = event.pointerId
    this.dragMoved = false
    this.dragStart = this.localPoint(event)
    this.lastPointer = this.dragStart
    this.app.canvas.setPointerCapture(event.pointerId)
    this.app.canvas.style.cursor = 'grabbing'
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId || !this.camera || !this.bounds) return

    const point = this.localPoint(event)
    if (Math.hypot(point.x - this.dragStart.x, point.y - this.dragStart.y) > CLICK_DRAG_TOLERANCE_PX) {
      this.dragMoved = true
    }
    const dx = point.x - this.lastPointer.x
    const dy = point.y - this.lastPointer.y
    this.lastPointer = point

    this.camera = clampCameraToWorld(panCamera(this.camera, dx, dy), this.bounds)
    this.applyCamera()
  }

  private onPointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return
    const point = this.localPoint(event)
    this.dragPointerId = null
    if (this.app.canvas.hasPointerCapture(event.pointerId)) {
      this.app.canvas.releasePointerCapture(event.pointerId)
    }
    this.app.canvas.style.cursor = 'grab'

    if (!this.dragMoved) this.onSelect(this.pickCreature(point))
  }

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault()
    if (!this.camera || !this.bounds) return

    const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
    this.camera = clampCameraToWorld(
      zoomCamera(this.camera, factor, this.localPoint(event), this.viewport),
      this.bounds,
    )
    this.applyCamera()
  }
}
