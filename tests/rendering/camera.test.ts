import { describe, expect, it } from 'vitest'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  cameraTransform,
  panCamera,
  screenToWorld,
  clampCameraToWorld,
  zoomCamera,
} from '../../src/rendering/camera.ts'

const viewport = { width: 800, height: 600 }
const camera = { cx: 400, cy: 300, zoom: 1 }

describe('camera math', () => {
  it('maps the camera centre to the viewport centre', () => {
    const transform = cameraTransform(camera, viewport)

    expect(transform.x + camera.cx * transform.scale).toBeCloseTo(viewport.width / 2, 6)
    expect(transform.y + camera.cy * transform.scale).toBeCloseTo(viewport.height / 2, 6)
  })

  it('round-trips a world point through screen space at any zoom', () => {
    for (const zoom of [0.4, 1, 3]) {
      const zoomed = { ...camera, zoom }
      const screen = { x: 640, y: 210 }
      const world = screenToWorld(zoomed, viewport, screen)
      const transform = cameraTransform(zoomed, viewport)

      expect(world.x * transform.scale + transform.x).toBeCloseTo(screen.x, 6)
      expect(world.y * transform.scale + transform.y).toBeCloseTo(screen.y, 6)
    }
  })

  it('pans the view by the drag distance in screen pixels', () => {
    const panned = panCamera(camera, 120, -60)

    expect(screenToWorld(panned, viewport, { x: 0, y: 0 }).x - screenToWorld(camera, viewport, { x: 0, y: 0 }).x).toBeCloseTo(-120, 6)
    expect(screenToWorld(panned, viewport, { x: 0, y: 0 }).y - screenToWorld(camera, viewport, { x: 0, y: 0 }).y).toBeCloseTo(60, 6)
  })

  it('scales the pan distance by zoom so dragging feels constant', () => {
    const zoomed = { ...camera, zoom: 2 }
    const panned = panCamera(zoomed, 100, 0)

    expect(panned.cx).toBeCloseTo(camera.cx - 50, 6)
  })

  it('keeps the world point under the pointer fixed while zooming', () => {
    const pointer = { x: 610, y: 130 }
    const before = screenToWorld(camera, viewport, pointer)
    const zoomed = zoomCamera(camera, 1.5, pointer, viewport)
    const after = screenToWorld(zoomed, viewport, pointer)

    expect(zoomed.zoom).toBeCloseTo(1.5, 6)
    expect(after.x).toBeCloseTo(before.x, 6)
    expect(after.y).toBeCloseTo(before.y, 6)
  })

  it('clamps zoom to the supported range', () => {
    expect(zoomCamera(camera, 1000, { x: 0, y: 0 }, viewport).zoom).toBe(MAX_ZOOM)
    expect(zoomCamera(camera, 0.001, { x: 0, y: 0 }, viewport).zoom).toBe(MIN_ZOOM)
  })

  it('ignores a non-finite or non-positive zoom factor instead of producing NaN', () => {
    for (const factor of [Number.NaN, 0, -2, Number.POSITIVE_INFINITY]) {
      const result = zoomCamera(camera, factor, { x: 10, y: 10 }, viewport)

      expect(result).toEqual(camera)
      expect(Number.isFinite(cameraTransform(result, viewport).x)).toBe(true)
    }
  })

  it('stays finite at the zoom limits', () => {
    const transform = cameraTransform({ cx: 1024, cy: 768, zoom: MAX_ZOOM }, viewport)

    expect(Number.isFinite(transform.x)).toBe(true)
    expect(Number.isFinite(transform.y)).toBe(true)
    expect(transform.scale).toBe(MAX_ZOOM)
  })

  it('keeps the same world centre after a viewport resize', () => {
    const resized = { width: 300, height: 1200 }
    const transform = cameraTransform(camera, resized)

    expect(transform.x + camera.cx * transform.scale).toBeCloseTo(resized.width / 2, 6)
    expect(transform.y + camera.cy * transform.scale).toBeCloseTo(resized.height / 2, 6)
  })

  it('keeps the camera centre inside the world bounds', () => {
    const world = { width: 1024, height: 768 }

    expect(clampCameraToWorld({ cx: -500, cy: 5000, zoom: 1 }, world)).toEqual({
      cx: 0,
      cy: 768,
      zoom: 1,
    })
    expect(clampCameraToWorld(camera, world)).toEqual(camera)
  })

  it('ignores a non-finite camera centre when clamping', () => {
    const invalid = { cx: Number.NaN, cy: 10, zoom: 1 }

    expect(clampCameraToWorld(invalid, { width: 100, height: 100 })).toBe(invalid)
  })
})
