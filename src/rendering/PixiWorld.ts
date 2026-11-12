import { Application, Container, Graphics } from 'pixi.js'
import type { SnapshotEvent } from '../shared/messages.ts'
import type { WorldBounds } from '../simulation/core/types.ts'
import {
  cameraTransform,
  clampCameraToWorld,
  panCamera,
  zoomCamera,
  MIN_ZOOM,
  type Camera,
} from './camera.ts'

/**
 * PixiJS world viewport for the prototype movement demo.
 *
 * Ownership: this module owns the canvas, the display objects, and the camera.
 * It never owns entity positions - every frame it copies the newest snapshot
 * received from the worker. Entities are drawn as pooled Graphics objects, one
 * per entity id, never as React components.
 */

export interface PixiWorldOptions {
  /** Host element the canvas is appended to; also the resize source. */
  readonly host: HTMLElement
  /** Returns the newest accepted worker snapshot, or null before the first one. */
  readonly getSnapshot: () => SnapshotEvent | null
}

/** World-unit spacing of the background guide lines. */
const GRID_SPACING = 128
/** Palette is indexed by the entity's stable hue, so colour identity survives snapshots. */
const ENTITY_PALETTE = [0x8fe3a1, 0x4fb3a9, 0x6fb3e0, 0xd8c46a, 0xd98f6a, 0xb58fe0] as const
const HUE_SEGMENTS = 360 / ENTITY_PALETTE.length
const WHEEL_ZOOM_SENSITIVITY = 0.0015

const entityColor = (hue: number): number => {
  const index = Math.floor(hue / HUE_SEGMENTS) % ENTITY_PALETTE.length
  return ENTITY_PALETTE[index] ?? ENTITY_PALETTE[0]
}

export class PixiWorld {
  private readonly host: HTMLElement
  private readonly getSnapshot: () => SnapshotEvent | null
  private readonly app: Application
  private readonly worldLayer = new Container()
  private readonly grid = new Graphics()
  private readonly worldBorder = new Graphics()
  private readonly entityLayer = new Container()
  private readonly entities = new Map<number, Graphics>()
  private readonly resizeObserver: ResizeObserver
  private camera: Camera | null = null
  private bounds: WorldBounds | null = null
  private dragPointerId: number | null = null
  private lastPointer = { x: 0, y: 0 }
  private disposed = false

  private constructor(options: PixiWorldOptions, app: Application) {
    this.host = options.host
    this.getSnapshot = options.getSnapshot
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
      // Only WebGL is requested. PixiJS appends a canvas fallback to a plain
      // string preference, so the array form is what keeps this WebGL-only.
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
    this.worldLayer.addChild(this.grid, this.worldBorder, this.entityLayer)
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

    this.entities.clear()
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

  /** Builds the static scene once the first snapshot reveals the world size. */
  private setupWorld(bounds: WorldBounds): void {
    this.bounds = bounds
    this.grid.clear()
    for (let x = 0; x <= bounds.width; x += GRID_SPACING) {
      this.grid.moveTo(x, 0).lineTo(x, bounds.height)
    }
    for (let y = 0; y <= bounds.height; y += GRID_SPACING) {
      this.grid.moveTo(0, y).lineTo(bounds.width, y)
    }
    this.grid.stroke({ width: 1, color: 0x1c2733, alpha: 1 })

    this.worldBorder
      .clear()
      .rect(0, 0, bounds.width, bounds.height)
      .stroke({ width: 2, color: 0x2f4657, alpha: 1 })

    const viewport = this.viewport
    const fit = Math.min(viewport.width / bounds.width, viewport.height / bounds.height)
    this.camera = clampCameraToWorld(
      {
        cx: bounds.width / 2,
        cy: bounds.height / 2,
        zoom: Math.max(Math.min(fit * 0.95, 1), MIN_ZOOM),
      },
      bounds,
    )
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

    const snapshot = this.getSnapshot()
    if (!snapshot) return

    if (!this.bounds) this.setupWorld(snapshot.bounds)

    for (const entity of snapshot.entities) {
      let sprite = this.entities.get(entity.id)
      if (!sprite) {
        sprite = new Graphics()
          .circle(0, 0, entity.radius)
          .fill({ color: entityColor(entity.hue), alpha: 0.95 })
        this.entities.set(entity.id, sprite)
        this.entityLayer.addChild(sprite)
      }
      sprite.position.set(entity.x, entity.y)
    }
  }

  private localPoint(event: PointerEvent | WheelEvent): { x: number; y: number } {
    const rect = this.app.canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    this.dragPointerId = event.pointerId
    this.lastPointer = this.localPoint(event)
    this.app.canvas.setPointerCapture(event.pointerId)
    this.app.canvas.style.cursor = 'grabbing'
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId || !this.camera || !this.bounds) return

    const point = this.localPoint(event)
    const dx = point.x - this.lastPointer.x
    const dy = point.y - this.lastPointer.y
    this.lastPointer = point

    this.camera = clampCameraToWorld(panCamera(this.camera, dx, dy), this.bounds)
    this.applyCamera()
  }

  private onPointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return
    this.dragPointerId = null
    if (this.app.canvas.hasPointerCapture(event.pointerId)) {
      this.app.canvas.releasePointerCapture(event.pointerId)
    }
    this.app.canvas.style.cursor = 'grab'
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
