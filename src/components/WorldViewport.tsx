import { useEffect, useRef, useState } from 'react'
import { PixiWorld } from '../rendering/PixiWorld.ts'
import type { SnapshotEvent } from '../shared/messages.ts'

interface WorldViewportProps {
  readonly getSnapshot: () => SnapshotEvent | null
}

/**
 * React host for the PixiJS canvas. React owns only the empty host element and
 * the loading/error overlays; the world itself is drawn by PixiWorld.
 */
export function WorldViewport({ getSnapshot }: WorldViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [rendererError, setRendererError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let world: PixiWorld | null = null
    let cancelled = false

    PixiWorld.create({ host, getSnapshot })
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
  }, [getSnapshot])

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

      <p className="viewport__hint">Drag to pan · Scroll to zoom</p>
    </div>
  )
}
