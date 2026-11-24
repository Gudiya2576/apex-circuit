export type GamePhase = 'MENU' | 'COUNTDOWN' | 'RACING' | 'PAUSED' | 'FINISHED';

export type MenuTab = 'RACE' | 'GARAGE' | 'TRACKS' | 'AUDIO';

export type Difficulty = 'ROOKIE' | 'PRO' | 'ACE';

export type CarBodyStyle =
  | 'gt'
  | 'formula'
  | 'muscle'
  | 'prototype'
  | 'rally'
  | 'tuner';

export interface CarSpec {
  id: string;
  name: string;
  category: string;
  description: string;
  bodyStyle: CarBodyStyle;
  defaultColor: string;
  secondaryColor: string;
  accentColor: string;
  /** Display ratings 1..100 */
  stats: {
    topSpeed: number;
    acceleration: number;
    handling: number;
    nitro: number;
  };
  /** Physics constants (world px/s and rad/s) */
  physics: {
    maxSpeed: number;
    accel: number;
    reverseSpeed: number;
    turnRate: number;
    grip: number;
    driftGrip: number;
    nitroBoost: number;
    nitroDrainRate: number;
    nitroRegenRate: number;
    radius: number;
    length: number;
    width: number;
    mass: number;
  };
}

export interface TrackTheme {
  groundColor: string;
  groundPatternColor: string;
  asphaltColor: string;
  asphaltEdgeColor: string;
  centerLineColor: string;
  wallOuterColor: string;
  wallInnerColor: string;
  wallStripeA: string;
  wallStripeB: string;
  kerbA: string;
  kerbB: string;
  accentColor: string;
  nightMode: boolean;
  decorType: 'speedway' | 'gp' | 'harbor' | 'canyon' | 'alpine';
}

export interface TrackDefinition {
  id: string;
  name: string;
  location: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Technical' | 'Challenging';
  defaultLaps: number;
  halfWidth: number;
  controlPoints: Array<{ x: number; y: number }>;
  theme: TrackTheme;
}

export interface TrackSample {
  x: number;
  y: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  curvature: number;
  s: number; // 0..1 normalized progress around loop
  dist: number; // cumulative distance in px
}

export interface TrackDecor {
  x: number;
  y: number;
  kind: 'tree' | 'palm' | 'rock' | 'stand' | 'lamp' | 'buoy';
  angle: number;
  scale: number;
  color?: string;
}

export interface CompiledTrack {
  def: TrackDefinition;
  samples: TrackSample[];
  totalLength: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  decors: TrackDecor[];
}

export interface CarRuntimeState {
  id: string;
  name: string;
  number: string;
  isPlayer: boolean;
  spec: CarSpec;
  primaryColor: string;
  secondaryColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  signedForwardSpeed: number;
  lateralSpeed: number;
  gear: number;
  rpm: number; // 0..1
  nitro: number; // 0..100
  isBoosting: boolean;
  isDrifting: boolean;
  isBraking: boolean;
  steerVisual: number; // -1..1
  closestSeg: number;
  s: number;
  lap: number; // 1-indexed current lap
  nextSector: number; // 0, 1, 2, 3 (must pass 1,2,3 before crossing 0)
  totalProgress: number;
  lapStartMs: number;
  currentLapMs: number;
  bestLapMs: number | null;
  lastLapMs: number | null;
  finished: boolean;
  finishTimeMs: number | null;
  finishOrder: number | null;
  wrongWayTimer: number;
  hitFlash: number;
  /** AI parameters */
  aiTargetOffset: number;
  aiBaseSkill: number;
  aiLaneTimer: number;
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'smoke' | 'spark' | 'flame' | 'dust';
}

export interface RaceHudSnapshot {
  phase: GamePhase;
  countdownValue: number; // 3, 2, 1, 0 (GO)
  position: number;
  totalCars: number;
  lap: number;
  totalLaps: number;
  currentLapMs: number;
  bestLapMs: number | null;
  lastLapMs: number | null;
  totalTimeMs: number;
  speedKmh: number;
  gear: number;
  rpm: number;
  nitro: number;
  isBoosting: boolean;
  isDrifting: boolean;
  wrongWay: boolean;
  newRecord: boolean;
  standings: Array<{
    id: string;
    name: string;
    number: string;
    carName: string;
    primaryColor: string;
    isPlayer: boolean;
    position: number;
    lap: number;
    finished: boolean;
    finishTimeMs: number | null;
    bestLapMs: number | null;
    gapMs: number | null;
  }>;
  carPositions: Array<{
    id: string;
    x: number;
    y: number;
    angle: number;
    isPlayer: boolean;
    color: string;
  }>;
}

export interface RaceInputState {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  nitro: boolean;
}

export type MusicTrackId = 'neon_overdrive' | 'apex_velocity' | 'midnight_paddock';

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  musicTrackId: MusicTrackId;
}

export interface RaceConfig {
  trackId: string;
  carId: string;
  customColor: string | null;
  laps: number;
  opponentCount: number;
  difficulty: Difficulty;
}

export interface TrackRecord {
  bestLapMs: number;
  carName: string;
  achievedAt: string;
}
