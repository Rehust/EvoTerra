import {
  countTerrainCells,
  type CellDescription,
  type OverlayOptions,
} from '../../rendering/terrainOverlay.ts'
import type { WorldEvent } from '../../shared/messages.ts'

/**
 * Terrain panel: what the ground is made of, what a clicked cell contains, and
 * which derived overlays are on. All values are derived on the main thread from
 * the WORLD event and the latest snapshot; the worker is not involved.
 */

interface TerrainPanelProps {
  readonly world: WorldEvent | null
  readonly totalFood: number
  readonly picked: CellDescription | null
  readonly overlays: OverlayOptions
  readonly onToggle: (key: keyof OverlayOptions) => void
}

const TOGGLES: ReadonlyArray<readonly [keyof OverlayOptions, string]> = [
  ['grid', 'Grid'],
  ['senseRadii', 'Sense radii'],
  ['foodHeat', 'Food heat'],
]

const format = (value: number, digits = 0): string => value.toFixed(digits)

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="inspector__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function TerrainPanel({ world, totalFood, picked, overlays, onToggle }: TerrainPanelProps) {
  const counts = world === null ? null : countTerrainCells(world.terrain)

  return (
    <section className="inspector terrain" aria-label="Terrain">
      <h2>Terrain</h2>

      {counts === null ? (
        <p className="inspector__placeholder">Loading terrain…</p>
      ) : (
        <>
          <div className="terrain__legend">
            <span className="terrain__chip">
              <span className="terrain__swatch terrain__swatch--grass" aria-hidden="true" />
              Grass {format(counts.passable)} cells
            </span>
            <span className="terrain__chip">
              <span className="terrain__swatch terrain__swatch--rock" aria-hidden="true" />
              Rock {format(counts.rock)} cells
            </span>
            <span className="terrain__chip">Food {format(totalFood)} units</span>
          </div>

          <h3>Cell</h3>
          {picked === null ? (
            <p className="inspector__placeholder">Click the ground to inspect a cell.</p>
          ) : (
            <dl className="inspector__grid">
              <Row label="Cell" value={`${picked.col}, ${picked.row}`} />
              <Row
                label="Surface"
                value={picked.passable ? 'Grass (passable)' : 'Rock (impassable)'}
              />
              <Row label="Position" value={`${format(picked.x)}, ${format(picked.y)}`} />
              <Row
                label="Food nearby"
                value={`${format(picked.foodUnits, 1)} units · ${picked.foodPatches} patches`}
              />
            </dl>
          )}
        </>
      )}

      <h3>Overlays</h3>
      <div className="terrain__toggles" role="group" aria-label="Terrain overlays">
        {TOGGLES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="button button--toggle"
            aria-pressed={overlays[key]}
            onClick={() => onToggle(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}
