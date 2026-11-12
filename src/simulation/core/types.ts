import type { RandomSource } from './random.ts'
import type { SpatialGrid } from '../spatial/spatialGrid.ts'

/**
 * World coordinates are continuous world units. One world unit equals one
 * renderer pixel at zoom 1. Time is seconds; energy is abstract energy units.
 */
export interface WorldBounds {
  readonly width: number
  readonly height: number
}

export interface TraitRange {
  readonly min: number
  readonly max: number
}

export interface TraitRanges {
  readonly maxSpeed: TraitRange
  readonly bodySize: TraitRange
  readonly visionRange: TraitRange
  readonly metabolicEfficiency: TraitRange
}

/** Inherited continuous traits. Every trait has a mechanical effect. */
export interface Traits {
  /** Multiplier on `creature.baseMovementSpeed`. */
  maxSpeed: number
  /** Multiplier on visual radius, basal cost, and movement cost. */
  bodySize: number
  /** Food/neighbour perception radius in world units. */
  visionRange: number
  /** Divides basal maintenance: higher is cheaper. */
  metabolicEfficiency: number
}

/**
 * Fixed 8 -> 12 -> 4 feed-forward parameters. Layout is row-major:
 * `inputHiddenWeights[input * HIDDEN + hidden]`,
 * `hiddenOutputWeights[hidden * OUTPUT + output]`.
 */
export interface NetworkParameters {
  inputHiddenWeights: number[]
  hiddenBias: number[]
  hiddenOutputWeights: number[]
  outputBias: number[]
}

/** Inherited genome: traits plus the fixed-topology network. */
export interface Genome {
  readonly topology: number
  readonly traits: Traits
  readonly network: NetworkParameters
}

/** Exact values passed to the network for one creature on its latest tick. */
export interface NeuralInputs {
  /** -1..1 normalized x direction toward the nearest visible food (0 when none). */
  readonly foodDirectionX: number
  /** -1..1 normalized y direction toward the nearest visible food (0 when none). */
  readonly foodDirectionY: number
  /** 0..1, `1 - distance / visionRange` (0 when none visible). */
  readonly foodProximity: number
  /** 0..1 available food amount in vision divided by the density saturation. */
  readonly localFoodDensity: number
  /** 0..1 nearby live creatures (excluding self) divided by neighbour saturation. */
  readonly nearbyCreatureDensity: number
  /** 0..1 current energy divided by maximum energy. */
  readonly energyRatio: number
  /** -1..1 push away from the nearest horizontal world edge. */
  readonly boundaryPressureX: number
  /** -1..1 push away from the nearest vertical world edge. */
  readonly boundaryPressureY: number
}

/** Network outputs are tendencies; the simulation applies limits and rules. */
export interface NeuralOutputs {
  /** -1..1 desired horizontal movement. */
  readonly moveX: number
  /** -1..1 desired vertical movement. */
  readonly moveY: number
  /** 0..1 tendency to attempt eating. */
  readonly eat: number
  /** 0..1 tendency to attempt reproduction. */
  readonly reproduce: number
}

/** Runtime state of one living creature. Dead creatures are removed. */
export interface CreatureState {
  readonly id: number
  readonly parentId: number | null
  readonly lineageRootId: number
  readonly generation: number

  x: number
  y: number
  /** Visual and collision radius in world units; derived from bodySize. */
  readonly radius: number
  /** Stable display hue in degrees. Inherited visually, not a simulation trait. */
  readonly hue: number

  energy: number
  ageSeconds: number
  reproductionCooldownSeconds: number
  alive: boolean

  readonly genome: Genome
  lastInputs: NeuralInputs
  lastOutputs: NeuralOutputs

  /** Per-step intent computed before movement; reset by the next perception pass. */
  desiredMoveX: number
  desiredMoveY: number
  wantsEat: boolean
  wantsReproduce: boolean
  /** Actual displacement accepted during this step, used to charge movement cost. */
  lastMovementDistance: number
}

/** One finite plant-like food patch. Placed once per run; it never moves. */
export interface FoodResource {
  readonly id: number
  x: number
  y: number
  amount: number
  readonly capacity: number
  readonly regenerationPerSecond: number
}

/** Uniform terrain grid: 1 = passable grassland, 0 = impassable rock. */
export interface Terrain {
  readonly cellSize: number
  readonly cols: number
  readonly rows: number
  readonly passable: Uint8Array
}

export type DebugController = 'neural' | 'greedy'

/**
 * Central, validated tuning structure. Every field has a documented unit in
 * `config.ts`; runtime code only reads from here so experiments stay repeatable.
 */
export interface SimulationConfig {
  readonly world: WorldBounds
  readonly seed: number
  readonly founderCount: number
  readonly maxPopulation: number
  readonly spatialCellSize: number
  readonly debugController: DebugController
  readonly terrain: {
    readonly cellSize: number
    readonly rockClusterCount: number
    readonly rockClusterMinRadiusCells: number
    readonly rockClusterMaxRadiusCells: number
  }
  readonly food: {
    readonly patchCount: number
    readonly capacity: number
    /** Food amount regenerated per second, per patch. */
    readonly regenerationPerSecond: number
    /** Energy gained per unit of food consumed. */
    readonly energyPerUnit: number
    /** Maximum food units consumed by one eat action. */
    readonly maxConsumedPerAction: number
    /** Extra reach beyond the creature radius for eating. */
    readonly consumptionRadius: number
    /** Total food amount in vision that normalizes local density to 1. */
    readonly densitySaturation: number
  }
  readonly creature: {
    readonly baseRadius: number
    /** World units per second before the inherited maxSpeed multiplier. */
    readonly baseMovementSpeed: number
    readonly maxEnergy: number
    /** Energy per second before bodySize and metabolic efficiency. */
    readonly basalMaintenancePerSecond: number
    /** Energy per world unit moved before bodySize. */
    readonly movementEnergyPerWorldUnit: number
    readonly eatOutputThreshold: number
    /** Distance from an edge at which boundary pressure starts. */
    readonly boundaryPressureMargin: number
    /** Radius used for the nearby-creature density input. */
    readonly neighborPerceptionRadius: number
    /** Nearby creature count that normalizes density to 1. */
    readonly neighborSaturation: number
  }
  readonly traits: TraitRanges
  readonly network: {
    /** Absolute clamp for every weight and bias. */
    readonly weightLimit: number
    readonly initialWeightRange: number
    readonly initialBiasRange: number
  }
  readonly mutation: {
    /** Independent mutation probability per scalar gene. */
    readonly probability: number
    /** Trait perturbation as a fraction of that trait's range. */
    readonly traitFraction: number
    /** Absolute weight/bias perturbation range. */
    readonly weightRange: number
  }
  readonly reproduction: {
    readonly minAgeSeconds: number
    readonly cooldownSeconds: number
    readonly energyThreshold: number
    readonly offspringEnergyTransfer: number
    readonly outputThreshold: number
    /** Candidate positions tried, in a fixed order, before giving up. */
    readonly placementAttempts: number
  }
}

/** Authoritative simulation state, owned by the worker. */
export interface SimulationState {
  readonly config: SimulationConfig
  readonly bounds: WorldBounds
  readonly terrain: Terrain
  readonly food: FoodResource[]
  readonly foodGrid: SpatialGrid<FoodResource>
  readonly creatureGrid: SpatialGrid<CreatureState>
  /** Live creatures only, kept sorted by ascending id. */
  readonly creatures: CreatureState[]
  readonly random: RandomSource
  tick: number
  elapsedSeconds: number
  births: number
  deaths: number
  nextCreatureId: number
}
