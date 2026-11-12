/**
 * Camera math for the world viewport. Pure and DOM-free: the PixiJS layer only
 * applies the resulting transform, so pan/zoom can be tested without a browser.
 *
 * The camera is the world point shown at the centre of the viewport plus a zoom
 * factor. Screen coordinates are viewport pixels with the origin at the
 * top-left corner.
 */

export interface Camera {
  /** World x at the viewport centre. */
  cx: number
  /** World y at the viewport centre. */
  cy: number
  /** Viewport pixels per world unit. */
  zoom: number
}

export interface ViewportSize {
  readonly width: number
  readonly height: number
}

export interface Point {
  readonly x: number
  readonly y: number
}

export interface CameraTransform {
  /** Container scale: viewport pixels per world unit. */
  readonly scale: number
  /** Container position x, in viewport pixels. */
  readonly x: number
  /** Container position y, in viewport pixels. */
  readonly y: number
}

export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 8

const clampZoom = (zoom: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

/** Container transform that places the camera centre at the viewport centre. */
export function cameraTransform(camera: Camera, viewport: ViewportSize): CameraTransform {
  return {
    scale: camera.zoom,
    x: viewport.width / 2 - camera.cx * camera.zoom,
    y: viewport.height / 2 - camera.cy * camera.zoom,
  }
}

/**
 * Keeps panning bounded: the camera centre stays inside the world, so the user
 * cannot drag the world out of sight. A non-finite centre is left untouched
 * (the callers treat that as "no movement yet").
 */
export function clampCameraToWorld(camera: Camera, world: ViewportSize): Camera {
  if (!Number.isFinite(camera.cx) || !Number.isFinite(camera.cy)) return camera

  return {
    cx: Math.min(Math.max(camera.cx, 0), world.width),
    cy: Math.min(Math.max(camera.cy, 0), world.height),
    zoom: camera.zoom,
  }
}

export function screenToWorld(camera: Camera, viewport: ViewportSize, screen: Point): Point {
  return {
    x: (screen.x - viewport.width / 2) / camera.zoom + camera.cx,
    y: (screen.y - viewport.height / 2) / camera.zoom + camera.cy,
  }
}

/**
 * Drag panning: the world follows the pointer, so a screen-space drag of
 * (dx, dy) moves the camera centre by the same distance divided by zoom.
 */export function panCamera(camera: Camera, dxScreen: number, dyScreen: number): Camera {
  if (!Number.isFinite(dxScreen) || !Number.isFinite(dyScreen)) return camera

  return {
    cx: camera.cx - dxScreen / camera.zoom,
    cy: camera.cy - dyScreen / camera.zoom,
    zoom: camera.zoom,
  }
}

/**
 * Wheel zoom anchored on the pointer: the world point under the pointer stays
 * under the pointer. Invalid factors are ignored rather than producing NaN.
 */
export function zoomCamera(
  camera: Camera,
  factor: number,
  pointer: Point,
  viewport: ViewportSize,
): Camera {
  if (!Number.isFinite(factor) || factor <= 0) return camera

  const zoom = clampZoom(camera.zoom * factor)
  const anchor = screenToWorld(camera, viewport, pointer)

  return {
    cx: anchor.x - (pointer.x - viewport.width / 2) / zoom,
    cy: anchor.y - (pointer.y - viewport.height / 2) / zoom,
    zoom,
  }
}
