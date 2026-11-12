import { useEffect, useRef, useState } from 'react'
import { PixiWorld } from '../rendering/PixiWorld.ts'
import type { OverlayOptions } from '../rendering/terrainOverlay.ts'
import type { SnapshotEvent, WorldEvent } from '../shared/messages.ts'

interface WorldViewportProps {
  readonly getSnapshot: () => SnapshotEvent | null
  readonly getWorld: () => WorldEvent | null
  readonly selectedId: number | null
  readonly overlays: OverlayOptions
  /** Vision radius of the selected creature, when its details are known. */
  readonly visionRange: number | null
  readonly onPick: (creatureId: number | null, point: { x: number; y: number } | null) => void
}

/**
 * React host for the PixiJS canvas. React owns only the empty host element and
 * the loading/error overlays; the world itself is drawn by PixiWorld.
 */
export function WorldViewport({
  getSnapshot,
  getWorld,
  selectedId,
  overlays,
  visionRange,
  onPick,
}: WorldViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef<number | null>(selectedId)
  selectedIdRef.current = selectedId
  const overlaysRef = useRef<OverlayOptions>(overlays)
  overlaysRef.current = overlays
  const visionRangeRef = useRef<number | null>(visionRange)
  visionRangeRef.current = visionRange

  const [rendererError, setRendererError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let world: PixiWorld | null = null
    let cancelled = false

    PixiWorld.create({
      host,
      getSnapshot,
      getWorld,
      getSelectedId: () => selectedIdRef.current,
      getOverlays: () => overlaysRef.current,
      getVisionRange: () => visionRangeRef.current,
      onPick,
    })
      .then((created) => {
        if (cancelled) {
          created.destroy()
          return
        }
        world = created
        setReady(true)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setRendererError(
          `The WebGL world viewport could not start: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      })

    return () => {
      cancelled = true
      world?.destroy()
      world = null
    }
  }, [getSnapshot, getWorld, onPick])

  return (
    <div className="viewport">
      <div className="viewport__host" ref={hostRef} />

      {rendererError !== null ? (
        <div className="viewport__overlay viewport__overlay--error" role="alert">
          <h2>Renderer unavailable</h2>
          <p>{rendererError}</p>
          <p className="muted">
            EvoTerra renders with WebGL2/WebGL through PixiJS. There is no Canvas fallback:
            use a browser with WebGL enabled.
          </p>
        </div>
      ) : null}

      {rendererError === null && !ready ? (
        <div className="viewport__overlay">
          <p>Starting WebGL renderer…</p>
        </div>
      ) : null}

      <p className="viewport__hint">
        Drag to pan · Scroll to zoom · Click a creature to inspect it, or the ground for cell info
      </p>
    </div>
  )
}
