import { RaceWorld } from './engine';
import { CarBodyStyle, CompiledTrack, TrackDecor } from './types';

export function drawCarShape(
  ctx: CanvasRenderingContext2D,
  style: CarBodyStyle,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  length: number,
  width: number,
  options?: {
    isBraking?: boolean;
    isBoosting?: boolean;
    steerVisual?: number;
    nightMode?: boolean;
    hitFlash?: number;
  }
): void {
  const halfL = length * 0.5;
  const halfW = width * 0.5;
  const steer = options?.steerVisual ?? 0;

  // Drop shadow
  ctx.save();
  ctx.translate(3, 4);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-halfL, -halfW, length, width, 5);
  ctx.fill();
  ctx.restore();

  // Headlight beams in night mode
  if (options?.nightMode) {
    ctx.save();
    const beamGrad = ctx.createLinearGradient(halfL * 0.8, 0, halfL + 150, 0);
    beamGrad.addColorStop(0, 'rgba(224, 242, 254, 0.34)');
    beamGrad.addColorStop(1, 'rgba(224, 242, 254, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(halfL * 0.85, -halfW * 0.72);
    ctx.lineTo(halfL + 155, -halfW * 2.5);
    ctx.lineTo(halfL + 155, halfW * 2.5);
    ctx.lineTo(halfL * 0.85, halfW * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Wheels (4 wheels; front pair pivots with steer)
  const wheelPositions = [
    { x: halfL * 0.56, y: -halfW - (style === 'formula' ? 2.5 : 0.5), front: true },
    { x: halfL * 0.56, y: halfW + (style === 'formula' ? 2.5 : 0.5), front: true },
    { x: -halfL * 0.58, y: -halfW - (style === 'formula' ? 2.5 : 0.5), front: false },
    { x: -halfL * 0.58, y: halfW + (style === 'formula' ? 2.5 : 0.5), front: false },
  ];
  for (const w of wheelPositions) {
    ctx.save();
    ctx.translate(w.x, w.y);
    if (w.front) ctx.rotate(steer * 0.35);
    ctx.fillStyle = '#0B0F17';
    ctx.beginPath();
    ctx.roundRect(-4.5, -2.6, 9, 5.2, 1.5);
    ctx.fill();
    ctx.restore();
  }

  // Body silhouette
  ctx.fillStyle = options?.hitFlash && options.hitFlash > 0.35 ? '#FDE047' : primaryColor;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.lineWidth = 1.2;

  if (style === 'formula') {
    // Tapered open-wheel fuselage + front/rear wings
    ctx.beginPath();
    ctx.moveTo(halfL + 2, 0);
    ctx.lineTo(halfL * 0.25, -halfW * 0.55);
    ctx.lineTo(-halfL * 0.75, -halfW * 0.72);
    ctx.lineTo(-halfL * 0.92, -halfW * 0.42);
    ctx.lineTo(-halfL * 0.92, halfW * 0.42);
    ctx.lineTo(-halfL * 0.75, halfW * 0.72);
    ctx.lineTo(halfL * 0.25, halfW * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front wing
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(halfL - 3, -halfW * 0.96, 5, width * 0.96);
    // Rear wing
    ctx.fillRect(-halfL - 1, -halfW * 0.96, 5.5, width * 0.96);

    // Open cockpit helmet
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 5.5, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(-1, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Closed-body sports / muscle / prototype / rally / tuner
    const r = style === 'prototype' ? 7 : style === 'muscle' ? 3 : 5;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, length, width, r);
    ctx.fill();
    ctx.stroke();

    // Hood / racing stripe styling
    if (style === 'muscle') {
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-halfL + 2, -3.5, length - 4, 2.2);
      ctx.fillRect(-halfL + 2, 1.3, length - 4, 2.2);
    } else if (style === 'tuner') {
      // Carbon hood
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.roundRect(halfL * 0.15, -halfW * 0.78, halfL * 0.72, width * 0.78, 3);
      ctx.fill();
    } else if (style === 'prototype') {
      // Aero dorsal fin & sidepod accents
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-halfL * 0.75, -1.5, halfL * 0.7, 3);
      ctx.fillStyle = accentColor;
      ctx.fillRect(-halfL * 0.2, -halfW + 1, halfL * 0.6, 2);
      ctx.fillRect(-halfL * 0.2, halfW - 3, halfL * 0.6, 2);
    }

    // Windshield & Cabin glass
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.36, -halfW * 0.68, length * 0.44, width * 0.68, 3);
    ctx.fill();

    // Windshield specular glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.moveTo(halfL * 0.12, -halfW * 0.56);
    ctx.lineTo(halfL * 0.34, -halfW * 0.42);
    ctx.lineTo(halfL * 0.34, halfW * 0.42);
    ctx.lineTo(halfL * 0.12, halfW * 0.56);
    ctx.closePath();
    ctx.fill();

    // Rear GT Wing for gt, tuner, prototype
    if (style === 'gt' || style === 'tuner' || style === 'prototype') {
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(-halfL + 0.5, -halfW * 0.92, 4, width * 0.92);
    }

    // Rally roof scoop
    if (style === 'rally') {
      ctx.fillStyle = accentColor;
      ctx.fillRect(-2, -3, 6, 6);
    }
  }

  // Headlights
  ctx.fillStyle = '#FEF9C3';
  ctx.fillRect(halfL - 2.5, -halfW * 0.68, 2.5, 3.2);
  ctx.fillRect(halfL - 2.5, halfW * 0.68 - 3.2, 2.5, 3.2);

  // Brake lights
  ctx.fillStyle = options?.isBraking ? '#FF2E2E' : '#7F1D1D';
  ctx.fillRect(-halfL, -halfW * 0.68, 2.4, 3.4);
  ctx.fillRect(-halfL, halfW * 0.68 - 3.4, 2.4, 3.4);

  if (options?.isBraking) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.beginPath();
    ctx.arc(-halfL - 1, -halfW * 0.5, 6, 0, Math.PI * 2);
    ctx.arc(-halfL - 1, halfW * 0.5, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nitro flame cone
  if (options?.isBoosting) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-halfL, -3);
    ctx.lineTo(-halfL - 14 - Math.random() * 7, 0);
    ctx.lineTo(-halfL, 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDecor(ctx: CanvasRenderingContext2D, d: TrackDecor, nightMode: boolean): void {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.angle);
  ctx.scale(d.scale, d.scale);

  if (d.kind === 'tree') {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.arc(4, 5, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14532D';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(-3, -3, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22C55E';
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(-5, -5, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.kind === 'palm') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(5, 6, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#365314';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.ellipse(10, 0, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#65A30D';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.kind === 'rock') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(4, 5, 24, 17, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.lineTo(-8, -18);
    ctx.lineTo(16, -14);
    ctx.lineTo(24, 4);
    ctx.lineTo(6, 18);
    ctx.lineTo(-18, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(4, -10);
    ctx.lineTo(12, 2);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
  } else if (d.kind === 'stand') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(-135, -30, 278, 66);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-138, -32, 276, 64);
    // Tiered seating rows
    const rowColors = ['#334155', '#475569', '#64748B'];
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = rowColors[r];
      ctx.fillRect(-130, -24 + r * 18, 260, 13);
    }
    // Roof overhang accent
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-138, -32, 276, 5);
  } else if (d.kind === 'lamp') {
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    if (nightMode) {
      const grad = ctx.createRadialGradient(30, 0, 2, 30, 0, 110);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(30, 0, 110, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = nightMode ? '#E0F2FE' : '#CBD5E1';
    ctx.beginPath();
    ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.kind === 'buoy') {
    ctx.fillStyle = '#0EA5E9';
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-16, -10, 32, 20);
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(-12, -6, 24, 12);
  }

  ctx.restore();
}

function drawTrackSurface(ctx: CanvasRenderingContext2D, track: CompiledTrack): void {
  const { samples, def } = track;
  const { theme, halfWidth } = def;
  const n = samples.length;

  // Build closed path helper
  const traceCenterline = () => {
    ctx.beginPath();
    ctx.moveTo(samples[0].x, samples[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(samples[i].x, samples[i].y);
    }
    ctx.closePath();
  };

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Outer barrier wall shadow + gravel shoulder
  traceCenterline();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = (halfWidth + 24) * 2;
  ctx.stroke();

  // 2. Outer wall barrier base
  traceCenterline();
  ctx.strokeStyle = theme.wallOuterColor;
  ctx.lineWidth = (halfWidth + 14) * 2;
  ctx.stroke();

  // 3. Alternating barrier blocks along left and right walls
  for (let i = 0; i < n; i += 3) {
    const a = samples[i];
    const b = samples[(i + 3) % n];
    const color = Math.floor(i / 3) % 2 === 0 ? theme.wallStripeA : theme.wallStripeB;
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    for (const side of [-1, 1]) {
      const dist = halfWidth + 9;
      ctx.beginPath();
      ctx.moveTo(a.x + a.nx * dist * side, a.y + a.ny * dist * side);
      ctx.lineTo(b.x + b.nx * dist * side, b.y + b.ny * dist * side);
      ctx.stroke();
    }
  }

  // 4. Asphalt edge shoulder
  traceCenterline();
  ctx.strokeStyle = theme.asphaltEdgeColor;
  ctx.lineWidth = (halfWidth + 4) * 2;
  ctx.stroke();

  // 5. Main racing asphalt
  traceCenterline();
  ctx.strokeStyle = theme.asphaltColor;
  ctx.lineWidth = halfWidth * 2;
  ctx.stroke();

  // 6. Apex kerbs on corners
  for (let i = 0; i < n; i++) {
    const a = samples[i];
    const b = samples[(i + 1) % n];
    if (Math.abs(a.curvature) > 0.0014) {
      const side = a.curvature > 0 ? 1 : -1;
      const dist = halfWidth - 4;
      ctx.strokeStyle = i % 2 === 0 ? theme.kerbA : theme.kerbB;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(a.x + a.nx * dist * side, a.y + a.ny * dist * side);
      ctx.lineTo(b.x + b.nx * dist * side, b.y + b.ny * dist * side);
      ctx.stroke();
    }
  }

  // 7. Track edge white lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2.5;
  for (const side of [-1, 1]) {
    const dist = halfWidth - 10;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const s = samples[i];
      const px = s.x + s.nx * dist * side;
      const py = s.y + s.ny * dist * side;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 8. Center dashed racing guide line
  ctx.save();
  ctx.setLineDash([22, 28]);
  traceCenterline();
  ctx.strokeStyle = theme.centerLineColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 9. Starting grid boxes behind start/finish line
  for (let slot = 0; slot < 8; slot++) {
    const row = Math.floor(slot / 2);
    const col = slot % 2 === 0 ? -1 : 1;
    const segIdx = (n - 5 - row * 4 + n) % n;
    const sample = samples[segIdx];
    const lateral = col * Math.min(34, halfWidth * 0.34);
    const gx = sample.x + sample.nx * lateral;
    const gy = sample.y + sample.ny * lateral;
    const ang = Math.atan2(sample.ty, sample.tx);

    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, -13);
    ctx.lineTo(24, -13);
    ctx.lineTo(24, 13);
    ctx.lineTo(18, 13);
    ctx.stroke();
    ctx.restore();
  }

  // 10. Checkered Start / Finish Line at sample[0]
  const start = samples[0];
  const startAngle = Math.atan2(start.ty, start.tx);
  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(startAngle);

  const squares = 14;
  const sqSize = (halfWidth * 2 - 16) / squares;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < squares; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#F8FAFC' : '#0F172A';
      ctx.fillRect(-sqSize + row * sqSize, -(halfWidth - 8) + col * sqSize, sqSize + 0.5, sqSize + 0.5);
    }
  }

  // Finish gantry pillars on outer walls
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-10, -halfWidth - 18, 20, 14);
  ctx.fillRect(-10, halfWidth + 4, 20, 14);
  ctx.fillStyle = theme.accentColor;
  ctx.fillRect(-3, -halfWidth - 14, 6, (halfWidth + 14) * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(-6, -54, 12, 108);
  ctx.restore();
}

export function renderRaceCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: RaceWorld
): void {
  const { track, camera, cars, skidMarks, particles } = world;
  const { theme } = track.def;

  // Ground backdrop
  ctx.fillStyle = theme.groundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // Subtle world terrain grid for speed sense
  const gridStep = 140;
  const viewW = width / camera.zoom;
  const viewH = height / camera.zoom;
  const startX = Math.floor((camera.x - viewW * 0.6) / gridStep) * gridStep;
  const endX = Math.ceil((camera.x + viewW * 0.6) / gridStep) * gridStep;
  const startY = Math.floor((camera.y - viewH * 0.6) / gridStep) * gridStep;
  const endY = Math.ceil((camera.y + viewH * 0.6) / gridStep) * gridStep;

  ctx.strokeStyle = theme.groundPatternColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let gx = startX; gx <= endX; gx += gridStep) {
    ctx.moveTo(gx, startY);
    ctx.lineTo(gx, endY);
  }
  for (let gy = startY; gy <= endY; gy += gridStep) {
    ctx.moveTo(startX, gy);
    ctx.lineTo(endX, gy);
  }
  ctx.stroke();

  // Track surface & walls
  drawTrackSurface(ctx, track);

  // Tire skidmarks
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  for (const sk of skidMarks) {
    ctx.strokeStyle = `rgba(12, 14, 18, ${sk.alpha})`;
    ctx.beginPath();
    ctx.moveTo(sk.x1, sk.y1);
    ctx.lineTo(sk.x2, sk.y2);
    ctx.stroke();
  }

  // Off-track scenic props
  for (const d of track.decors) {
    if (
      Math.abs(d.x - camera.x) > viewW * 0.72 ||
      Math.abs(d.y - camera.y) > viewH * 0.72
    ) {
      continue;
    }
    drawDecor(ctx, d, theme.nightMode);
  }

  // Particles
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.kind === 'smoke' ? 1.5 - alpha * 0.5 : 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Cars
  for (const car of cars) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    drawCarShape(
      ctx,
      car.spec.bodyStyle,
      car.primaryColor,
      car.secondaryColor,
      car.spec.accentColor,
      car.spec.physics.length,
      car.spec.physics.width,
      {
        isBraking: car.isBraking,
        isBoosting: car.isBoosting,
        steerVisual: car.steerVisual,
        nightMode: theme.nightMode,
        hitFlash: car.hitFlash,
      }
    );
    ctx.restore();

    // Crisp driver label above car (player indicator or rival number)
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const label = car.isPlayer ? 'YOU' : `#${car.number}`;
    ctx.fillStyle = 'rgba(11, 13, 18, 0.75)';
    const w = car.isPlayer ? 32 : 28;
    ctx.beginPath();
    ctx.roundRect(car.x - w * 0.5, car.y - 34, w, 15, 4);
    ctx.fill();
    ctx.fillStyle = car.isPlayer ? '#FBBF24' : '#CBD5E1';
    ctx.fillText(label, car.x, car.y - 23);
    ctx.restore();
  }

  ctx.restore();
}

export function renderTrackOutline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  track: CompiledTrack,
  options?: {
    carPositions?: Array<{ x: number; y: number; isPlayer: boolean; color: string }>;
    showWalls?: boolean;
  }
): void {
  const { bounds, samples, def } = track;
  const pad = 16;
  const scaleX = (width - pad * 2) / bounds.width;
  const scaleY = (height - pad * 2) / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - bounds.width * scale) * 0.5 - bounds.minX * scale;
  const offsetY = (height - bounds.height * scale) * 0.5 - bounds.minY * scale;

  ctx.clearRect(0, 0, width, height);

  const trace = () => {
    ctx.beginPath();
    for (let i = 0; i < samples.length; i += 2) {
      const px = samples[i].x * scale + offsetX;
      const py = samples[i].y * scale + offsetY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (options?.showWalls) {
    trace();
    ctx.strokeStyle = def.theme.accentColor;
    ctx.lineWidth = Math.max(8, def.halfWidth * 2 * scale + 3);
    ctx.stroke();
  }

  trace();
  ctx.strokeStyle = options?.showWalls ? '#1E2430' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = Math.max(5, def.halfWidth * 2 * scale);
  ctx.stroke();

  if (options?.showWalls) {
    trace();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Finish line marker at sample[0]
  const s0 = samples[0];
  const fx = s0.x * scale + offsetX;
  const fy = s0.y * scale + offsetY;
  const hw = Math.max(5, def.halfWidth * scale * 1.15);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fx - s0.nx * hw, fy - s0.ny * hw);
  ctx.lineTo(fx + s0.nx * hw, fy + s0.ny * hw);
  ctx.stroke();

  // Car dots
  if (options?.carPositions) {
    for (const c of options.carPositions) {
      if (c.isPlayer) continue;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x * scale + offsetX, c.y * scale + offsetY, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const player = options.carPositions.find((c) => c.isPlayer);
    if (player) {
      const px = player.x * scale + offsetX;
      const py = player.y * scale + offsetY;
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#0B0D12';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
