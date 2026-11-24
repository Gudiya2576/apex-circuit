import { CompiledTrack, TrackDecor, TrackDefinition, TrackSample } from './types';

export const TRACK_DEFINITIONS: TrackDefinition[] = [
  {
    id: 'sunset_speedway',
    name: 'Sunset Speedway',
    location: 'Nevada Tri-Oval',
    description: 'Wide high-speed banked oval with a fast front dogleg and flat-out drafting battles.',
    difficulty: 'Easy',
    defaultLaps: 3,
    halfWidth: 118,
    controlPoints: [
      { x: 0, y: -480 },
      { x: 560, y: -480 },
      { x: 1020, y: -350 },
      { x: 1160, y: 0 },
      { x: 1020, y: 360 },
      { x: 560, y: 490 },
      { x: 0, y: 430 },
      { x: -560, y: 490 },
      { x: -1020, y: 360 },
      { x: -1160, y: 0 },
      { x: -1020, y: -350 },
      { x: -560, y: -480 },
    ],
    theme: {
      groundColor: '#2B231D',
      groundPatternColor: '#352B24',
      asphaltColor: '#242730',
      asphaltEdgeColor: '#363B47',
      centerLineColor: 'rgba(255, 255, 255, 0.22)',
      wallOuterColor: '#E2E8F0',
      wallInnerColor: '#E2E8F0',
      wallStripeA: '#EF4444',
      wallStripeB: '#F8FAFC',
      kerbA: '#F59E0B',
      kerbB: '#1E293B',
      accentColor: '#F59E0B',
      nightMode: false,
      decorType: 'speedway',
    },
  },
  {
    id: 'apex_gp',
    name: 'Apex Grand Prix',
    location: 'Silvercrest Circuit',
    description: 'Classic Formula circuit featuring a heavy Turn 1 braking hairpin, flowing esses, and long pit straight.',
    difficulty: 'Medium',
    defaultLaps: 3,
    halfWidth: 102,
    controlPoints: [
      { x: -300, y: -620 },
      { x: 520, y: -620 },
      { x: 1120, y: -560 },
      { x: 1280, y: -220 },
      { x: 960, y: 20 },
      { x: 640, y: -80 },
      { x: 420, y: 180 },
      { x: 760, y: 500 },
      { x: 480, y: 740 },
      { x: -180, y: 660 },
      { x: -520, y: 360 },
      { x: -940, y: 520 },
      { x: -1260, y: 240 },
      { x: -1160, y: -280 },
      { x: -820, y: -580 },
    ],
    theme: {
      groundColor: '#19291E',
      groundPatternColor: '#203526',
      asphaltColor: '#22262E',
      asphaltEdgeColor: '#343A46',
      centerLineColor: 'rgba(255, 255, 255, 0.18)',
      wallOuterColor: '#CBD5E1',
      wallInnerColor: '#CBD5E1',
      wallStripeA: '#DC2626',
      wallStripeB: '#F8FAFC',
      kerbA: '#EF4444',
      kerbB: '#F8FAFC',
      accentColor: '#EF4444',
      nightMode: false,
      decorType: 'gp',
    },
  },
  {
    id: 'neon_harbor',
    name: 'Neon Harbor Street',
    location: 'Yokohama Waterfront',
    description: 'Midnight street circuit bounded by tight concrete barriers, dockside hairpins, and floodlit corners.',
    difficulty: 'Technical',
    defaultLaps: 3,
    halfWidth: 92,
    controlPoints: [
      { x: -350, y: -680 },
      { x: 480, y: -680 },
      { x: 1080, y: -640 },
      { x: 1220, y: -260 },
      { x: 1180, y: 220 },
      { x: 840, y: 360 },
      { x: 740, y: 720 },
      { x: 240, y: 760 },
      { x: -80, y: 460 },
      { x: -460, y: 460 },
      { x: -640, y: 740 },
      { x: -1120, y: 680 },
      { x: -1240, y: 180 },
      { x: -920, y: -60 },
      { x: -1080, y: -460 },
      { x: -780, y: -680 },
    ],
    theme: {
      groundColor: '#0A1322',
      groundPatternColor: '#0E1B2F',
      asphaltColor: '#181C26',
      asphaltEdgeColor: '#283040',
      centerLineColor: 'rgba(56, 189, 248, 0.25)',
      wallOuterColor: '#475569',
      wallInnerColor: '#475569',
      wallStripeA: '#06B6D4',
      wallStripeB: '#1E293B',
      kerbA: '#06B6D4',
      kerbB: '#0F172A',
      accentColor: '#06B6D4',
      nightMode: true,
      decorType: 'harbor',
    },
  },
  {
    id: 'redrock_canyon',
    name: 'Redrock Canyon',
    location: 'Utah Mesa',
    description: 'Dust-lined desert canyon run combining rapid switchback bends with a blistering plateau straight.',
    difficulty: 'Technical',
    defaultLaps: 3,
    halfWidth: 96,
    controlPoints: [
      { x: -200, y: -740 },
      { x: 640, y: -740 },
      { x: 1280, y: -560 },
      { x: 1360, y: -120 },
      { x: 940, y: 120 },
      { x: 460, y: 20 },
      { x: 240, y: 320 },
      { x: 740, y: 540 },
      { x: 960, y: 860 },
      { x: 340, y: 940 },
      { x: -220, y: 620 },
      { x: -680, y: 860 },
      { x: -1220, y: 640 },
      { x: -1280, y: 140 },
      { x: -840, y: -160 },
      { x: -1080, y: -540 },
      { x: -720, y: -740 },
    ],
    theme: {
      groundColor: '#3A2118',
      groundPatternColor: '#47281D',
      asphaltColor: '#282528',
      asphaltEdgeColor: '#423836',
      centerLineColor: 'rgba(251, 191, 36, 0.24)',
      wallOuterColor: '#B45309',
      wallInnerColor: '#B45309',
      wallStripeA: '#F59E0B',
      wallStripeB: '#78350F',
      kerbA: '#F59E0B',
      kerbB: '#FEF3C7',
      accentColor: '#F59E0B',
      nightMode: false,
      decorType: 'canyon',
    },
  },
  {
    id: 'emerald_alpine',
    name: 'Emerald Alpine Pass',
    location: 'Dolomite Ridge',
    description: 'Challenging mountain pass with sweeping double-apex corners, tight forest walls, and rhythm chicanes.',
    difficulty: 'Challenging',
    defaultLaps: 3,
    halfWidth: 90,
    controlPoints: [
      { x: -260, y: -760 },
      { x: 540, y: -760 },
      { x: 1180, y: -640 },
      { x: 1380, y: -220 },
      { x: 1100, y: 180 },
      { x: 640, y: 80 },
      { x: 340, y: 360 },
      { x: 680, y: 740 },
      { x: 220, y: 960 },
      { x: -320, y: 760 },
      { x: -180, y: 320 },
      { x: -620, y: 240 },
      { x: -960, y: 640 },
      { x: -1380, y: 420 },
      { x: -1360, y: -160 },
      { x: -940, y: -380 },
      { x: -1020, y: -680 },
      { x: -680, y: -780 },
    ],
    theme: {
      groundColor: '#11221B',
      groundPatternColor: '#162C23',
      asphaltColor: '#1F242C',
      asphaltEdgeColor: '#313946',
      centerLineColor: 'rgba(255, 255, 255, 0.2)',
      wallOuterColor: '#94A3B8',
      wallInnerColor: '#94A3B8',
      wallStripeA: '#10B981',
      wallStripeB: '#F8FAFC',
      kerbA: '#EF4444',
      kerbB: '#F8FAFC',
      accentColor: '#10B981',
      nightMode: false,
      decorType: 'alpine',
    },
  },
];

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

const compiledCache = new Map<string, CompiledTrack>();

export function compileTrack(def: TrackDefinition): CompiledTrack {
  const cached = compiledCache.get(def.id);
  if (cached) return cached;

  const pts = def.controlPoints;
  const n = pts.length;
  const rawSteps = n * 48;
  const raw: Array<{ x: number; y: number }> = [];

  const scaleFactor = 1.45;
  for (let i = 0; i < rawSteps; i++) {
    const u = (i / rawSteps) * n;
    const idx = Math.floor(u);
    const t = u - idx;
    const p0 = pts[(idx - 1 + n) % n];
    const p1 = pts[idx % n];
    const p2 = pts[(idx + 1) % n];
    const p3 = pts[(idx + 2) % n];
    raw.push({
      x: catmullRom(p0.x, p1.x, p2.x, p3.x, t) * scaleFactor,
      y: catmullRom(p0.y, p1.y, p2.y, p3.y, t) * scaleFactor,
    });
  }

  // Arc-length table to resample at uniform spacing (~520 samples)
  const cumDist: number[] = [0];
  let totalLen = 0;
  for (let i = 1; i <= raw.length; i++) {
    const a = raw[i - 1];
    const b = raw[i % raw.length];
    totalLen += Math.hypot(b.x - a.x, b.y - a.y);
    cumDist.push(totalLen);
  }

  const sampleCount = 520;
  const resampled: Array<{ x: number; y: number; dist: number }> = [];
  let rawIdx = 0;
  for (let k = 0; k < sampleCount; k++) {
    const targetDist = (k / sampleCount) * totalLen;
    while (rawIdx < cumDist.length - 2 && cumDist[rawIdx + 1] < targetDist) {
      rawIdx++;
    }
    const d0 = cumDist[rawIdx];
    const d1 = cumDist[rawIdx + 1];
    const alpha = d1 > d0 ? (targetDist - d0) / (d1 - d0) : 0;
    const a = raw[rawIdx];
    const b = raw[(rawIdx + 1) % raw.length];
    resampled.push({
      x: a.x + (b.x - a.x) * alpha,
      y: a.y + (b.y - a.y) * alpha,
      dist: targetDist,
    });
  }

  const samples: TrackSample[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < sampleCount; i++) {
    const prev = resampled[(i - 1 + sampleCount) % sampleCount];
    const curr = resampled[i];
    const next = resampled[(i + 1) % sampleCount];

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty;
    const ny = tx;

    // True signed geometric curvature (1 / radius in px^-1)
    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const cross = v1x * v2y - v1y * v2x;
    const segLen = (Math.hypot(v1x, v1y) + Math.hypot(v2x, v2y)) * 0.5 || 1;
    const curvature = cross / (segLen * segLen * segLen);

    const pad = def.halfWidth + 80;
    if (curr.x - pad < minX) minX = curr.x - pad;
    if (curr.x + pad > maxX) maxX = curr.x + pad;
    if (curr.y - pad < minY) minY = curr.y - pad;
    if (curr.y + pad > maxY) maxY = curr.y + pad;

    samples.push({
      x: curr.x,
      y: curr.y,
      tx,
      ty,
      nx,
      ny,
      curvature,
      s: i / sampleCount,
      dist: curr.dist,
    });
  }

  const decors = generateTrackDecors(def, samples);

  const compiled: CompiledTrack = {
    def,
    samples,
    totalLength: totalLen,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
    decors,
  };

  compiledCache.set(def.id, compiled);
  return compiled;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function isClearOfTrack(x: number, y: number, samples: TrackSample[], minClearance: number): boolean {
  const minSq = minClearance * minClearance;
  for (let i = 0; i < samples.length; i += 2) {
    const dx = x - samples[i].x;
    const dy = y - samples[i].y;
    if (dx * dx + dy * dy < minSq) return false;
  }
  return true;
}

function generateTrackDecors(def: TrackDefinition, samples: TrackSample[]): TrackDecor[] {
  const decors: TrackDecor[] = [];
  const rand = seededRandom(
    def.id.split('').reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 7), 1337)
  );

  // Place grandstands along the start/finish straight outside the wall
  const startSample = samples[10];
  const standDist = def.halfWidth + 105;
  for (const side of [-1, 1]) {
    const sx = startSample.x + startSample.nx * standDist * side;
    const sy = startSample.y + startSample.ny * standDist * side;
    if (isClearOfTrack(sx, sy, samples, def.halfWidth + 72)) {
      decors.push({
        x: sx,
        y: sy,
        kind: 'stand',
        angle: Math.atan2(startSample.ty, startSample.tx) + (side > 0 ? 0 : Math.PI),
        scale: 1,
      });
    }
  }

  // Place floodlights / lamps at regular intervals around circuit
  if (def.theme.nightMode || def.theme.decorType === 'speedway' || def.theme.decorType === 'gp') {
    for (let i = 0; i < samples.length; i += 24) {
      const s = samples[i];
      const side = (i / 24) % 2 === 0 ? 1 : -1;
      const dist = def.halfWidth + 36;
      const lx = s.x + s.nx * dist * side;
      const ly = s.y + s.ny * dist * side;
      if (isClearOfTrack(lx, ly, samples, def.halfWidth + 24)) {
        decors.push({
          x: lx,
          y: ly,
          kind: 'lamp',
          angle: Math.atan2(-s.ny * side, -s.nx * side),
          scale: 1,
        });
      }
    }
  }

  // Place environmental props safely outside walls
  const propKind: TrackDecor['kind'] =
    def.theme.decorType === 'canyon'
      ? 'rock'
      : def.theme.decorType === 'harbor'
      ? 'buoy'
      : def.theme.decorType === 'speedway'
      ? 'palm'
      : 'tree';

  for (let i = 0; i < samples.length; i += 6) {
    const s = samples[i];
    for (const side of [-1, 1]) {
      if (rand() > 0.65) continue;
      const offset = def.halfWidth + 68 + rand() * 190;
      const px = s.x + s.nx * offset * side + (rand() - 0.5) * 40;
      const py = s.y + s.ny * offset * side + (rand() - 0.5) * 40;
      if (isClearOfTrack(px, py, samples, def.halfWidth + 50)) {
        decors.push({
          x: px,
          y: py,
          kind: propKind,
          angle: rand() * Math.PI * 2,
          scale: 0.75 + rand() * 0.65,
        });
      }
    }
  }

  return decors;
}

export function getTrackById(id: string): TrackDefinition {
  return TRACK_DEFINITIONS.find((t) => t.id === id) ?? TRACK_DEFINITIONS[0];
}

export function getAllCompiledTracks(): CompiledTrack[] {
  return TRACK_DEFINITIONS.map(compileTrack);
}
