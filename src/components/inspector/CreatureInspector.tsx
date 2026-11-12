import type { CreatureDetails } from '../../shared/messages.ts'
import type { InspectionState } from '../../app/useSimulationWorker.ts'

/**
 * Selected-creature inspector. Everything shown comes from the worker's
 * CREATURE_DETAILS payload: real traits, real latest inputs/outputs, and a
 * summary of the actual network parameters. No decorative values.
 */

const TRAIT_LABELS: Readonly<Record<keyof CreatureDetails['traits'], string>> = {
  maxSpeed: 'Max speed ×',
  bodySize: 'Body size ×',
  visionRange: 'Vision (units)',
  metabolicEfficiency: 'Metabolic eff. ×',
}

const INPUT_FIELDS = [
  ['foodDirectionX', 'Food dir X'],
  ['foodDirectionY', 'Food dir Y'],
  ['foodProximity', 'Food proximity'],
  ['localFoodDensity', 'Local food'],
  ['nearbyCreatureDensity', 'Neighbors'],
  ['energyRatio', 'Energy'],
  ['boundaryPressureX', 'Edge push X'],
  ['boundaryPressureY', 'Edge push Y'],
] as const satisfies ReadonlyArray<readonly [keyof CreatureDetails['inputs'], string]>

const OUTPUT_FIELDS = [
  ['moveX', 'Move X'],
  ['moveY', 'Move Y'],
  ['eat', 'Eat'],
  ['reproduce', 'Reproduce'],
] as const satisfies ReadonlyArray<readonly [keyof CreatureDetails['outputs'], string]>

const format = (value: number): string => (Math.round(value * 1000) / 1000).toString()

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="inspector__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function CreatureInspector({ inspection }: { inspection: InspectionState }) {
  if (inspection.status === 'idle') {
    return (
      <section className="inspector" aria-label="Creature inspector">
        <h2>Inspector</h2>
        <p className="inspector__placeholder">Click a creature in the world to inspect it.</p>
      </section>
    )
  }

  if (inspection.status === 'loading') {
    return (
      <section className="inspector" aria-label="Creature inspector">
        <h2>Inspector</h2>
        <p className="inspector__placeholder">Loading creature #{inspection.creatureId}…</p>
      </section>
    )
  }

  if (inspection.status === 'gone') {
    return (
      <section className="inspector" aria-label="Creature inspector">
        <h2>Inspector</h2>
        <p className="inspector__placeholder inspector__placeholder--warning">
          Creature #{inspection.creatureId} is no longer alive.
        </p>
      </section>
    )
  }

  const details: CreatureDetails = inspection.details
  return (
    <section className="inspector" aria-label="Creature inspector">
      <h2>
        Creature #{details.creatureId}
        {!details.alive ? <span className="inspector__dead"> · not alive</span> : null}
      </h2>

      <dl className="inspector__grid">
        <Row label="Generation" value={details.generation.toString()} />
        <Row label="Parent" value={details.parentId === null ? 'founder' : `#${details.parentId}`} />
        <Row label="Lineage root" value={`#${details.lineageRootId}`} />
        <Row
          label="Energy"
          value={`${format(details.energy)} / ${format(details.maxEnergy)} (${Math.round(
            details.energyRatio * 100,
          )}%)`}
        />
        <Row label="Age" value={`${format(details.ageSeconds)} s`} />
        <Row
          label="Repro. cooldown"
          value={details.reproductionCooldownSeconds <= 0 ? 'ready' : `${format(details.reproductionCooldownSeconds)} s`}
        />
        <Row label="Position" value={`${Math.round(details.x)}, ${Math.round(details.y)}`} />
      </dl>

      <h3>Traits</h3>
      <dl className="inspector__grid">
        {(Object.keys(details.traits) as Array<keyof CreatureDetails['traits']>).map((trait) => (
          <Row key={trait} label={TRAIT_LABELS[trait]} value={format(details.traits[trait])} />
        ))}
      </dl>

      <h3>Neural inputs</h3>
      <dl className="inspector__grid inspector__grid--narrow">
        {INPUT_FIELDS.map(([field, label]) => (
          <Row key={field} label={label} value={format(details.inputs[field])} />
        ))}
      </dl>

      <h3>Neural outputs</h3>
      <dl className="inspector__grid inspector__grid--narrow">
        {OUTPUT_FIELDS.map(([field, label]) => (
          <Row key={field} label={label} value={format(details.outputs[field])} />
        ))}
      </dl>

      <h3>Network</h3>
      <dl className="inspector__grid">
        <Row label="Topology" value={details.network.topology} />
        <Row
          label="Weights"
          value={`${details.network.weightCount} · mean ${format(details.network.meanWeight)} · [${format(
            details.network.minWeight,
          )}, ${format(details.network.maxWeight)}]`}
        />
        <Row label="Mean bias" value={format(details.network.meanBias)} />
      </dl>
    </section>
  )
}
