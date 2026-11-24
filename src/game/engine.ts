import { AI_DRIVERS, getCarById } from './cars';
import { compileTrack, getTrackById } from './tracks';
import {
  CarRuntimeState,
  CompiledTrack,
  Difficulty,
  GamePhase,
  Particle,
  RaceConfig,
  RaceHudSnapshot,
  RaceInputState,
  SkidMark,
} from './types';

export interface RaceCallbacks {
  onCountdownTick?: (value: number) => void;
  onWallHit?: (intensity: number) => void;
  onCarBump?: (intensity: number) => void;
  onLapComplete?: (lap: number, lapMs: number, isBest: boolean) => void;
  onPlayerFinish?: (position: number, bestLapMs: number | null, totalMs: number) => void;
}

export interface RaceWorld {
  track: CompiledTrack;
  config: RaceConfig;
  phase: GamePhase;
  countdownTimer: number;
  lastCountdownWhole: number;
  raceTimeMs: number;
  cars: Array<CarRuntimeState & { hasCrossedStart: boolean }>;
  skidMarks: SkidMark[];
  particles: Particle[];
  finishCounter: number;
  newRecordAchieved: boolean;
  existingRecordMs: number | null;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function projectOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { t: number; cx: number; cy: number; distSq: number } {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 1e-6) {
    const dx = px - ax;
    const dy = py - ay;
    return { t: 0, cx: ax, cy: ay, distSq: dx * dx + dy * dy };
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return { t, cx, cy, distSq: dx * dx + dy * dy };
}

function findClosestTrackPoint(
  x: number,
  y: number,
  track: CompiledTrack,
  hintSeg: number
): {
  segIdx: number;
  t: number;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  signedOffset: number;
  s: number;
} {
  const samples = track.samples;
  const n = samples.length;
  let bestSeg = hintSeg;
  let bestT = 0;
  let bestCx = samples[hintSeg].x;
  let bestCy = samples[hintSeg].y;
  let bestDistSq = Infinity;

  const searchRange = (start: number, count: number) => {
    for (let k = 0; k < count; k++) {
      const i = (start + k + n) % n;
      const a = samples[i];
      const b = samples[(i + 1) % n];
      const proj = projectOnSegment(x, y, a.x, a.y, b.x, b.y);
      if (proj.distSq < bestDistSq) {
        bestDistSq = proj.distSq;
        bestSeg = i;
        bestT = proj.t;
        bestCx = proj.cx;
        bestCy = proj.cy;
      }
    }
  };

  searchRange(hintSeg - 20, 41);

  const fallbackThresh = (track.def.halfWidth + 45) * (track.def.halfWidth + 45);
  if (bestDistSq > fallbackThresh) {
    searchRange(0, n);
  }

  const a = samples[bestSeg];
  const b = samples[(bestSeg + 1) % n];
  const tx = a.tx + (b.tx - a.tx) * bestT;
  const ty = a.ty + (b.ty - a.ty) * bestT;
  const tLen = Math.hypot(tx, ty) || 1;
  const ntx = tx / tLen;
  const nty = ty / tLen;
  const nnx = -nty;
  const nny = ntx;

  const signedOffset = (x - bestCx) * nnx + (y - bestCy) * nny;
  const s = (bestSeg + bestT) / n;

  return {
    segIdx: bestSeg,
    t: bestT,
    cx: bestCx,
    cy: bestCy,
    tx: ntx,
    ty: nty,
    nx: nnx,
    ny: nny,
    signedOffset,
    s,
  };
}

function getDifficultyRange(diff: Difficulty): [number, number] {
  switch (diff) {
    case 'ROOKIE':
      return [0.74, 0.86];
    case 'PRO':
      return [0.85, 0.96];
    case 'ACE':
      return [0.94, 1.04];
  }
}

export function createRaceWorld(config: RaceConfig, existingRecordMs: number | null): RaceWorld {
  const trackDef = getTrackById(config.trackId);
  const track = compileTrack(trackDef);
  const samples = track.samples;
  const n = samples.length;

  const totalCars = 1 + Math.max(1, Math.min(7, config.opponentCount));
  const [minSkill, maxSkill] = getDifficultyRange(config.difficulty);
  const cars: Array<CarRuntimeState & { hasCrossedStart: boolean }> = [];

  // Place AI cars ahead in starting grid, player at the back for exciting overtakes
  for (let gridSlot = 0; gridSlot < totalCars; gridSlot++) {
    const isPlayer = gridSlot === totalCars - 1;
    const row = Math.floor(gridSlot / 2);
    const col = gridSlot % 2 === 0 ? -1 : 1;

    // Grid sits behind start line (s = 0)
    const segIdx = (n - 5 - row * 4 + n) % n;
    const sample = samples[segIdx];
    const lateral = col * Math.min(34, trackDef.halfWidth * 0.34);

    const x = sample.x + sample.nx * lateral;
    const y = sample.y + sample.ny * lateral;
    const angle = Math.atan2(sample.ty, sample.tx);

    if (isPlayer) {
      const spec = getCarById(config.carId);
      cars.push({
        id: 'player',
        name: 'You',
        number: '01',
        isPlayer: true,
        spec,
        primaryColor: config.customColor || spec.defaultColor,
        secondaryColor: spec.secondaryColor,
        x,
        y,
        vx: 0,
        vy: 0,
        angle,
        speed: 0,
        signedForwardSpeed: 0,
        lateralSpeed: 0,
        gear: 1,
        rpm: 0.15,
        nitro: 100,
        isBoosting: false,
        isDrifting: false,
        isBraking: false,
        steerVisual: 0,
        closestSeg: segIdx,
        s: sample.s,
        lap: 1,
        nextSector: 1,
        hasCrossedStart: false,
        totalProgress: sample.s - 1,
        lapStartMs: 0,
        currentLapMs: 0,
        bestLapMs: null,
        lastLapMs: null,
        finished: false,
        finishTimeMs: null,
        finishOrder: null,
        wrongWayTimer: 0,
        hitFlash: 0,
        aiTargetOffset: 0,
        aiBaseSkill: 1,
        aiLaneTimer: 0,
      });
    } else {
      const driver = AI_DRIVERS[gridSlot % AI_DRIVERS.length];
      const spec = getCarById(driver.carId);
      const t = totalCars > 2 ? gridSlot / (totalCars - 2) : 0.5;
      const skill = maxSkill - t * (maxSkill - minSkill);
      cars.push({
        id: `ai_${gridSlot}`,
        name: driver.name,
        number: driver.number,
        isPlayer: false,
        spec,
        primaryColor: driver.color,
        secondaryColor: spec.secondaryColor,
        x,
        y,
        vx: 0,
        vy: 0,
        angle,
        speed: 0,
        signedForwardSpeed: 0,
        lateralSpeed: 0,
        gear: 1,
        rpm: 0.15,
        nitro: 100,
        isBoosting: false,
        isDrifting: false,
        isBraking: false,
        steerVisual: 0,
        closestSeg: segIdx,
        s: sample.s,
        lap: 1,
        nextSector: 1,
        hasCrossedStart: false,
        totalProgress: sample.s - 1,
        lapStartMs: 0,
        currentLapMs: 0,
        bestLapMs: null,
        lastLapMs: null,
        finished: false,
        finishTimeMs: null,
        finishOrder: null,
        wrongWayTimer: 0,
        hitFlash: 0,
        aiTargetOffset: lateral * 0.7,
        aiBaseSkill: skill,
        aiLaneTimer: 1 + Math.random() * 2,
      });
    }
  }

  const player = cars.find((c) => c.isPlayer) ?? cars[0];

  return {
    track,
    config,
    phase: 'COUNTDOWN',
    countdownTimer: 3.3,
    lastCountdownWhole: 4,
    raceTimeMs: 0,
    cars,
    skidMarks: [],
    particles: [],
    finishCounter: 0,
    newRecordAchieved: false,
    existingRecordMs,
    camera: {
      x: player.x,
      y: player.y,
      zoom: 1.0,
    },
  };
}

function spawnParticle(
  world: RaceWorld,
  x: number,
  y: number,
  vx: number,
  vy: number,
  size: number,
  life: number,
  color: string,
  kind: Particle['kind']
): void {
  if (world.particles.length > 320) return;
  world.particles.push({ x, y, vx, vy, size, life, maxLife: life, color, kind });
}

function computeAiControls(
  car: CarRuntimeState & { hasCrossedStart: boolean },
  world: RaceWorld,
  dt: number
): RaceInputState {
  const samples = world.track.samples;
  const n = samples.length;
  const halfW = world.track.def.halfWidth;

  car.aiLaneTimer -= dt;
  if (car.aiLaneTimer <= 0) {
    car.aiLaneTimer = 1.4 + Math.random() * 2.2;
    car.aiTargetOffset = (Math.random() - 0.5) * (halfW * 0.85);
  }

  // Overtake avoidance: check if any car is directly ahead within 120px
  let avoidOffset = 0;
  for (const other of world.cars) {
    if (other.id === car.id) continue;
    const dx = other.x - car.x;
    const dy = other.y - car.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5 && dist < 125) {
      const fx = Math.cos(car.angle);
      const fy = Math.sin(car.angle);
      const forwardDot = (dx * fx + dy * fy) / dist;
      if (forwardDot > 0.65) {
        const rightDot = dx * -fy + dy * fx;
        avoidOffset = rightDot >= 0 ? -halfW * 0.45 : halfW * 0.45;
        break;
      }
    }
  }

  const targetOffset = Math.max(-halfW * 0.65, Math.min(halfW * 0.65, car.aiTargetOffset + avoidOffset));
  const lookAheadSteps = Math.max(6, Math.min(18, Math.round(car.speed / 44)));
  const targetSample = samples[(car.closestSeg + lookAheadSteps) % n];

  const tx = targetSample.x + targetSample.nx * targetOffset;
  const ty = targetSample.y + targetSample.ny * targetOffset;

  const desiredAngle = Math.atan2(ty - car.y, tx - car.x);
  const angleDiff = normalizeAngle(desiredAngle - car.angle);

  // Check upcoming geometric curvature (1/R) for corner braking
  let maxCurv = 0;
  for (let k = 3; k <= 26; k += 2) {
    const c = Math.abs(samples[(car.closestSeg + k) % n].curvature);
    if (c > maxCurv) maxCurv = c;
  }

  const cornerTargetSpeed =
    (car.spec.physics.maxSpeed * car.aiBaseSkill) / (1 + maxCurv * 68);
  const wantsBrake = car.speed > cornerTargetSpeed * 1.18 && Math.abs(angleDiff) > 0.24;
  const wantsThrottle = !wantsBrake && car.speed < cornerTargetSpeed * 1.05;
  const wantsNitro =
    car.nitro > 45 &&
    maxCurv < 0.0014 &&
    Math.abs(angleDiff) < 0.14 &&
    car.speed > car.spec.physics.maxSpeed * 0.6;

  return {
    throttle: wantsThrottle,
    brake: wantsBrake,
    left: angleDiff < -0.05,
    right: angleDiff > 0.05,
    drift: Math.abs(angleDiff) > 0.56 && car.speed > 280,
    nitro: wantsNitro,
  };
}

export function stepRaceWorld(
  world: RaceWorld,
  playerInput: RaceInputState,
  rawDt: number,
  callbacks?: RaceCallbacks
): void {
  const dt = Math.min(0.05, Math.max(0.001, rawDt));

  if (world.phase === 'PAUSED') {
    return;
  }

  // Update particles & fade skidmarks
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= dt;
    if (p.life <= 0) {
      world.particles.splice(i, 1);
    }
  }
  if (world.skidMarks.length > 750) {
    world.skidMarks.splice(0, world.skidMarks.length - 750);
  }

  // Countdown state
  if (world.phase === 'COUNTDOWN') {
    world.countdownTimer -= dt;
    const whole = Math.ceil(world.countdownTimer);
    if (whole !== world.lastCountdownWhole && whole >= 1 && whole <= 3) {
      world.lastCountdownWhole = whole;
      callbacks?.onCountdownTick?.(whole);
    }
    if (world.countdownTimer <= 0) {
      world.phase = 'RACING';
      world.lastCountdownWhole = 0;
      callbacks?.onCountdownTick?.(0);
    }
    // Keep camera smoothly framed on player
    const player = world.cars.find((c) => c.isPlayer) ?? world.cars[0];
    world.camera.x += (player.x - world.camera.x) * Math.min(1, dt * 8);
    world.camera.y += (player.y - world.camera.y) * Math.min(1, dt * 8);
    return;
  }

  world.raceTimeMs += dt * 1000;

  // Step each car physics
  for (const car of world.cars) {
    const input =
      car.finished || world.phase === 'FINISHED'
        ? computeAiControls(car, world, dt) // Autopilot cool-down lap after finish!
        : car.isPlayer
        ? playerInput
        : computeAiControls(car, world, dt);

    const p = car.spec.physics;
    const fx = Math.cos(car.angle);
    const fy = Math.sin(car.angle);
    const rx = -fy;
    const ry = fx;

    const prevX = car.x;
    const prevY = car.y;

    let forwardVel = car.vx * fx + car.vy * fy;
    let lateralVel = car.vx * rx + car.vy * ry;

    // Nitro handling
    const canBoost = input.nitro && car.nitro > 2 && input.throttle;
    car.isBoosting = canBoost;
    if (canBoost) {
      car.nitro = Math.max(0, car.nitro - p.nitroDrainRate * dt);
    } else {
      const driftBonus = car.isDrifting ? 1.85 : 1.0;
      car.nitro = Math.min(100, car.nitro + p.nitroRegenRate * driftBonus * dt);
    }

    const aiScale = car.isPlayer ? 1.0 : car.aiBaseSkill;
    const topSpeed = (p.maxSpeed + (canBoost ? p.nitroBoost : 0)) * aiScale;
    const accelForce = (p.accel + (canBoost ? p.nitroBoost * 1.45 : 0)) * aiScale;

    car.isBraking = false;
    if (input.throttle) {
      forwardVel += accelForce * dt;
    } else if (input.brake) {
      if (forwardVel > 25) {
        forwardVel -= accelForce * 1.55 * dt;
        car.isBraking = true;
      } else {
        forwardVel -= accelForce * 0.72 * dt;
        car.isBraking = true;
      }
    } else {
      // Natural engine braking / rolling drag
      forwardVel *= Math.exp(-1.15 * dt);
    }

    // Clamp forward / reverse speed
    if (forwardVel > topSpeed) {
      forwardVel = topSpeed + (forwardVel - topSpeed) * Math.exp(-4.5 * dt);
    }
    if (forwardVel < -p.reverseSpeed) {
      forwardVel = -p.reverseSpeed;
    }

    // Steering
    const steerInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    car.steerVisual += (steerInput - car.steerVisual) * Math.min(1, dt * 14);

    const speedMag = Math.abs(forwardVel);
    const steerFactor = Math.min(1, speedMag / 145);
    const reverseSign = forwardVel >= -10 ? 1 : -1;
    const driftTurnBoost = input.drift && speedMag > 160 ? 1.24 : 1.0;

    car.angle = normalizeAngle(
      car.angle + steerInput * p.turnRate * steerFactor * driftTurnBoost * reverseSign * dt
    );

    // Recompute basis after turn and apply lateral tire grip
    const nfx = Math.cos(car.angle);
    const nfy = Math.sin(car.angle);
    const nrx = -nfy;
    const nry = nfx;

    const isDrifting =
      (input.drift && speedMag > 180) || Math.abs(lateralVel) > 125;
    car.isDrifting = isDrifting;

    const activeGrip = input.drift ? p.driftGrip : p.grip;
    lateralVel *= Math.exp(-activeGrip * dt);

    // Aerodynamic drag
    forwardVel *= Math.exp(-0.22 * dt);

    car.vx = nfx * forwardVel + nrx * lateralVel;
    car.vy = nfy * forwardVel + nry * lateralVel;

    car.x += car.vx * dt;
    car.y += car.vy * dt;

    car.signedForwardSpeed = forwardVel;
    car.lateralSpeed = lateralVel;
    car.speed = Math.hypot(car.vx, car.vy);

    // Simulated 6-speed gearbox & RPM
    const speedNorm = Math.min(1.05, car.speed / p.maxSpeed);
    const gear = Math.max(1, Math.min(6, 1 + Math.floor(speedNorm * 5.6)));
    car.gear = gear;
    const gearLow = (gear - 1) / 6;
    const gearHigh = gear / 6;
    const inGear = Math.max(0.15, Math.min(1.0, (speedNorm - gearLow) / (gearHigh - gearLow)));
    car.rpm = car.isBoosting ? Math.min(1.0, inGear + 0.15) : inGear;

    if (car.hitFlash > 0) {
      car.hitFlash = Math.max(0, car.hitFlash - dt * 4);
    }

    // Drift skidmarks & tire smoke
    if (isDrifting && car.speed > 130) {
      const rearX = car.x - nfx * (p.length * 0.34);
      const rearY = car.y - nfy * (p.length * 0.34);
      const prevRearX = prevX - nfx * (p.length * 0.34);
      const prevRearY = prevY - nfy * (p.length * 0.34);
      const halfAxle = p.width * 0.36;

      world.skidMarks.push(
        {
          x1: prevRearX + nrx * halfAxle,
          y1: prevRearY + nry * halfAxle,
          x2: rearX + nrx * halfAxle,
          y2: rearY + nry * halfAxle,
          alpha: Math.min(0.48, Math.abs(lateralVel) / 280 + 0.16),
        },
        {
          x1: prevRearX - nrx * halfAxle,
          y1: prevRearY - nry * halfAxle,
          x2: rearX - nrx * halfAxle,
          y2: rearY - nry * halfAxle,
          alpha: Math.min(0.48, Math.abs(lateralVel) / 280 + 0.16),
        }
      );

      if (Math.random() < 0.55) {
        spawnParticle(
          world,
          rearX + (Math.random() - 0.5) * 10,
          rearY + (Math.random() - 0.5) * 10,
          -car.vx * 0.12 + (Math.random() - 0.5) * 35,
          -car.vy * 0.12 + (Math.random() - 0.5) * 35,
          5 + Math.random() * 6,
          0.35 + Math.random() * 0.25,
          'rgba(226, 232, 240, 0.55)',
          'smoke'
        );
      }
    }

    // Nitro exhaust flames
    if (car.isBoosting && Math.random() < 0.85) {
      const exhaustX = car.x - nfx * (p.length * 0.52);
      const exhaustY = car.y - nfy * (p.length * 0.52);
      spawnParticle(
        world,
        exhaustX + (Math.random() - 0.5) * 5,
        exhaustY + (Math.random() - 0.5) * 5,
        -nfx * 140 + (Math.random() - 0.5) * 30,
        -nfy * 140 + (Math.random() - 0.5) * 30,
        4 + Math.random() * 4,
        0.16 + Math.random() * 0.08,
        Math.random() > 0.4 ? '#38BDF8' : '#F59E0B',
        'flame'
      );
    }

    // Wall collision & Track progress / Laps
    const prevS = car.s;
    const trackPt = findClosestTrackPoint(car.x, car.y, world.track, car.closestSeg);
    car.closestSeg = trackPt.segIdx;
    car.s = trackPt.s;

    const maxAllowedOffset = world.track.def.halfWidth - p.radius;
    if (Math.abs(trackPt.signedOffset) > maxAllowedOffset) {
      const sign = trackPt.signedOffset > 0 ? 1 : -1;
      // Clamp cleanly inside wall boundary
      car.x = trackPt.cx + trackPt.nx * (maxAllowedOffset * sign);
      car.y = trackPt.cy + trackPt.ny * (maxAllowedOffset * sign);

      // Inward wall normal
      const inNx = -trackPt.nx * sign;
      const inNy = -trackPt.ny * sign;
      const vn = car.vx * inNx + car.vy * inNy;

      if (vn < 0) {
        const impact = Math.abs(vn);
        // Reflect outward velocity component gently & apply wall scrape friction
        const restitution = 0.28;
        car.vx -= (1 + restitution) * vn * inNx;
        car.vy -= (1 + restitution) * vn * inNy;
        car.vx *= 0.86;
        car.vy *= 0.86;

        // Nudge car angle slightly toward track tangent so cars glide along walls cleanly
        const tangAngle = Math.atan2(trackPt.ty, trackPt.tx);
        const angleToTang = normalizeAngle(tangAngle - car.angle);
        if (Math.abs(angleToTang) < Math.PI * 0.45) {
          car.angle = normalizeAngle(car.angle + angleToTang * 0.12);
        }

        if (impact > 55) {
          car.hitFlash = 1;
          for (let sp = 0; sp < 5; sp++) {
            spawnParticle(
              world,
              car.x - inNx * p.radius,
              car.y - inNy * p.radius,
              inNx * (60 + Math.random() * 110) + (Math.random() - 0.5) * 90,
              inNy * (60 + Math.random() * 110) + (Math.random() - 0.5) * 90,
              2.5 + Math.random() * 2,
              0.22 + Math.random() * 0.14,
              '#FBBF24',
              'spark'
            );
          }
          if (car.isPlayer) {
            callbacks?.onWallHit?.(Math.min(1, impact / 320));
          }
        }
      }
    }

    // Wrong way detection (player only)
    if (car.isPlayer && car.speed > 75) {
      const forwardAlign = nfx * trackPt.tx + nfy * trackPt.ty;
      if (forwardAlign < -0.35) {
        car.wrongWayTimer += dt;
      } else {
        car.wrongWayTimer = Math.max(0, car.wrongWayTimer - dt * 3);
      }
    } else {
      car.wrongWayTimer = 0;
    }

    // Lap & checkpoint state machine
    if (!car.finished) {
      // Crossed finish line forward? (s wrapped from >0.75 to <0.25)
      if (prevS > 0.75 && car.s < 0.25) {
        if (!car.hasCrossedStart) {
          car.hasCrossedStart = true;
          car.lapStartMs = world.raceTimeMs;
        } else if (car.nextSector === 4) {
          const lapMs = world.raceTimeMs - car.lapStartMs;
          car.lastLapMs = lapMs;
          const isBest = car.bestLapMs === null || lapMs < car.bestLapMs;
          if (isBest) {
            car.bestLapMs = lapMs;
          }

          if (car.isPlayer) {
            if (world.existingRecordMs === null || lapMs < world.existingRecordMs) {
              world.existingRecordMs = lapMs;
              world.newRecordAchieved = true;
            }
          }

          if (car.lap >= world.config.laps) {
            car.finished = true;
            car.finishTimeMs = world.raceTimeMs;
            world.finishCounter += 1;
            car.finishOrder = world.finishCounter;

            if (car.isPlayer) {
              world.phase = 'FINISHED';
              callbacks?.onPlayerFinish?.(
                car.finishOrder,
                car.bestLapMs,
                car.finishTimeMs
              );
            }
          } else {
            if (car.isPlayer) {
              callbacks?.onLapComplete?.(car.lap, lapMs, isBest);
            }
            car.lap += 1;
            car.nextSector = 1;
            car.lapStartMs = world.raceTimeMs;
          }
        }
      }

      // Advance sequential sector gates (1 -> 2 -> 3 -> 4)
      if (car.hasCrossedStart) {
        if (car.nextSector === 1 && car.s >= 0.22 && car.s < 0.5) {
          car.nextSector = 2;
        } else if (car.nextSector === 2 && car.s >= 0.48 && car.s < 0.75) {
          car.nextSector = 3;
        } else if (car.nextSector === 3 && car.s >= 0.74) {
          car.nextSector = 4;
        }
      }

      car.currentLapMs = car.hasCrossedStart ? Math.max(0, world.raceTimeMs - car.lapStartMs) : 0;
    }

    const effectiveS = !car.hasCrossedStart && car.s > 0.5 ? car.s - 1 : car.s;
    car.totalProgress = car.finished
      ? world.config.laps + 10 - (car.finishOrder ?? 99) * 0.01
      : car.lap + effectiveS;
  }

  // Car-to-car collisions
  for (let i = 0; i < world.cars.length; i++) {
    for (let j = i + 1; j < world.cars.length; j++) {
      const a = world.cars[i];
      const b = world.cars[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.spec.physics.radius + b.spec.physics.radius;
      if (dist > 0.001 && dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const totalMass = a.spec.physics.mass + b.spec.physics.mass;
        const ratioA = b.spec.physics.mass / totalMass;
        const ratioB = a.spec.physics.mass / totalMass;

        a.x -= nx * overlap * ratioA;
        a.y -= ny * overlap * ratioA;
        b.x += nx * overlap * ratioB;
        b.y += ny * overlap * ratioB;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal < 0) {
          const restitution = 0.42;
          const jImpulse = (-(1 + restitution) * velAlongNormal) / (1 / a.spec.physics.mass + 1 / b.spec.physics.mass);
          const impX = jImpulse * nx;
          const impY = jImpulse * ny;
          a.vx -= impX / a.spec.physics.mass;
          a.vy -= impY / a.spec.physics.mass;
          b.vx += impX / b.spec.physics.mass;
          b.vy += impY / b.spec.physics.mass;

          const bumpStrength = Math.abs(velAlongNormal);
          if (bumpStrength > 70) {
            spawnParticle(
              world,
              (a.x + b.x) * 0.5,
              (a.y + b.y) * 0.5,
              (Math.random() - 0.5) * 120,
              (Math.random() - 0.5) * 120,
              2.5,
              0.2,
              '#FDE047',
              'spark'
            );
            if (a.isPlayer || b.isPlayer) {
              callbacks?.onCarBump?.(Math.min(1, bumpStrength / 280));
            }
          }
        }
      }
    }
  }

  // Smooth camera tracking with velocity lookahead & speed zoom
  const player = world.cars.find((c) => c.isPlayer) ?? world.cars[0];
  const lookAheadX = player.x + player.vx * 0.24;
  const lookAheadY = player.y + player.vy * 0.24;
  world.camera.x += (lookAheadX - world.camera.x) * Math.min(1, dt * 6.5);
  world.camera.y += (lookAheadY - world.camera.y) * Math.min(1, dt * 6.5);

  const speedRatio = Math.min(1, player.speed / player.spec.physics.maxSpeed);
  const targetZoom = 1.06 - speedRatio * 0.18 - (player.isBoosting ? 0.05 : 0);
  world.camera.zoom += (targetZoom - world.camera.zoom) * Math.min(1, dt * 4.5);
}

export function buildHudSnapshot(world: RaceWorld): RaceHudSnapshot {
  const sorted = [...world.cars].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishOrder ?? 99) - (b.finishOrder ?? 99);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.totalProgress - a.totalProgress;
  });

  const leaderTime = sorted[0]?.finishTimeMs ?? null;
  const playerIdx = sorted.findIndex((c) => c.isPlayer);
  const player = world.cars.find((c) => c.isPlayer) ?? world.cars[0];

  return {
    phase: world.phase,
    countdownValue: Math.max(0, Math.ceil(world.countdownTimer)),
    position: playerIdx >= 0 ? playerIdx + 1 : 1,
    totalCars: world.cars.length,
    lap: player.lap,
    totalLaps: world.config.laps,
    currentLapMs: player.currentLapMs,
    bestLapMs: player.bestLapMs,
    lastLapMs: player.lastLapMs,
    totalTimeMs: world.raceTimeMs,
    speedKmh: Math.round(player.speed * 0.42),
    gear: player.gear,
    rpm: player.rpm,
    nitro: player.nitro,
    isBoosting: player.isBoosting,
    isDrifting: player.isDrifting,
    wrongWay: player.wrongWayTimer > 0.45,
    newRecord: world.newRecordAchieved,
    standings: sorted.map((c, idx) => ({
      id: c.id,
      name: c.name,
      number: c.number,
      carName: c.spec.name,
      primaryColor: c.primaryColor,
      isPlayer: c.isPlayer,
      position: idx + 1,
      lap: c.lap,
      finished: c.finished,
      finishTimeMs: c.finishTimeMs,
      bestLapMs: c.bestLapMs,
      gapMs:
        c.finishTimeMs !== null && leaderTime !== null && idx > 0
          ? c.finishTimeMs - leaderTime
          : null,
    })),
    carPositions: world.cars.map((c) => ({
      id: c.id,
      x: c.x,
      y: c.y,
      angle: c.angle,
      isPlayer: c.isPlayer,
      color: c.primaryColor,
    })),
  };
}
