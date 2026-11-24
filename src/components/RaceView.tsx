import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX, Home, Flame } from 'lucide-react';
import { raceAudio, MUSIC_TRACK_META } from '../game/audio';
import { getCarById } from '../game/cars';
import { buildHudSnapshot, createRaceWorld, RaceWorld, stepRaceWorld } from '../game/engine';
import { renderRaceCanvas, renderTrackOutline } from '../game/renderer';
import { formatLapTime, formatOrdinal } from '../game/storage';
import { getTrackById } from '../game/tracks';
import { AudioSettings, MusicTrackId, RaceConfig, RaceHudSnapshot, RaceInputState } from '../game/types';

interface RaceViewProps {
  config: RaceConfig;
  existingRecordMs: number | null;
  audio: AudioSettings;
  onUpdateAudio: (next: AudioSettings) => void;
  onSaveRecord: (trackId: string, bestLapMs: number, carName: string) => void;
  onExitToMenu: (openTab?: 'RACE' | 'GARAGE' | 'TRACKS') => void;
}

export function RaceView({
  config,
  existingRecordMs,
  audio,
  onUpdateAudio,
  onSaveRecord,
  onExitToMenu,
}: RaceViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<RaceWorld | null>(null);

  const keysRef = useRef<Set<string>>(new Set());
  const touchInputRef = useRef<RaceInputState>({
    throttle: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  });

  const [hud, setHud] = useState<RaceHudSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(false);
  const [lapBanner, setLapBanner] = useState<{ text: string; accent: boolean } | null>(null);

  const pausedRef = useRef(false);
  const lapBannerTimeoutRef = useRef<number | null>(null);
  const existingRecordRef = useRef<number | null>(existingRecordMs);

  useEffect(() => {
    existingRecordRef.current = existingRecordMs;
  }, [existingRecordMs]);

  const trackDef = getTrackById(config.trackId);
  const playerCar = getCarById(config.carId);

  const showTemporaryBanner = useCallback((text: string, accent = false) => {
    setLapBanner({ text, accent });
    if (lapBannerTimeoutRef.current) {
      window.clearTimeout(lapBannerTimeoutRef.current);
    }
    lapBannerTimeoutRef.current = window.setTimeout(() => {
      setLapBanner(null);
    }, 2400);
  }, []);

  const initRace = useCallback(() => {
    const world = createRaceWorld(config, existingRecordRef.current);
    worldRef.current = world;
    pausedRef.current = false;
    setPaused(false);
    setLapBanner(null);
    setHud(buildHudSnapshot(world));
    raceAudio.unlock();
    raceAudio.startEngine();
    raceAudio.startMusic('race');
  }, [config]);

  useEffect(() => {
    // Detect coarse pointer (touch devices) automatically
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      setShowTouchPad(true);
    }
    initRace();

    return () => {
      raceAudio.stopEngine();
      raceAudio.setMusicIntensity('menu');
      if (lapBannerTimeoutRef.current) {
        window.clearTimeout(lapBannerTimeoutRef.current);
      }
    };
  }, [initRace]);

  const togglePause = useCallback(() => {
    const world = worldRef.current;
    if (!world || world.phase === 'FINISHED') return;
    const nextPaused = !pausedRef.current;
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
    if (nextPaused) {
      raceAudio.updateEngine(0.1, 0, false, 0);
      raceAudio.setMusicIntensity('menu');
    } else {
      raceAudio.setMusicIntensity('race');
    }
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      raceAudio.unlock();
      const code = e.code;

      if (code === 'Escape' || code === 'KeyP') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (code === 'KeyR') {
        e.preventDefault();
        initRace();
        return;
      }
      if (code === 'KeyM') {
        e.preventDefault();
        onUpdateAudio({ ...audio, muted: !audio.muted });
        return;
      }

      if (
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'Space'
      ) {
        e.preventDefault();
      }
      keysRef.current.add(code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const handleBlur = () => {
      keysRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [audio, initRace, onUpdateAudio, togglePause]);

  // Main 60fps simulation + render loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudAccum = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const world = worldRef.current;
      const canvas = canvasRef.current;

      if (world && canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssW = canvas.clientWidth || window.innerWidth;
        const cssH = canvas.clientHeight || window.innerHeight;
        if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
          canvas.width = Math.round(cssW * dpr);
          canvas.height = Math.round(cssH * dpr);
        }

        if (!pausedRef.current) {
          const k = keysRef.current;
          const t = touchInputRef.current;
          const playerInput: RaceInputState = {
            throttle: k.has('KeyW') || k.has('ArrowUp') || t.throttle,
            brake: k.has('KeyS') || k.has('ArrowDown') || t.brake,
            left: k.has('KeyA') || k.has('ArrowLeft') || t.left,
            right: k.has('KeyD') || k.has('ArrowRight') || t.right,
            drift: k.has('Space') || t.drift,
            nitro: k.has('ShiftLeft') || k.has('ShiftRight') || k.has('KeyN') || t.nitro,
          };

          stepRaceWorld(world, playerInput, dt, {
            onCountdownTick: (val) => {
              raceAudio.playCountdownBeep(val === 0);
            },
            onWallHit: (intensity) => {
              raceAudio.playWallHit(intensity);
            },
            onCarBump: (intensity) => {
              raceAudio.playCarBump(intensity);
            },
            onLapComplete: (lap, lapMs, isBest) => {
              raceAudio.playLapComplete(isBest);
              showTemporaryBanner(
                isBest
                  ? `Lap ${lap} · ${formatLapTime(lapMs)} · Best Lap`
                  : `Lap ${lap} · ${formatLapTime(lapMs)}`,
                isBest
              );
              if (isBest) {
                onSaveRecord(config.trackId, lapMs, playerCar.name);
              }
            },
            onPlayerFinish: (pos, bestLapMs) => {
              raceAudio.playFinishFanfare(pos === 1);
              raceAudio.updateEngine(0.15, 0.1, false, 0);
              if (bestLapMs !== null) {
                onSaveRecord(config.trackId, bestLapMs, playerCar.name);
              }
            },
          });

          const player = world.cars.find((c) => c.isPlayer);
          if (player && world.phase === 'RACING') {
            const speedRatio = Math.min(1, player.speed / player.spec.physics.maxSpeed);
            const driftIntensity =
              player.isDrifting && player.speed > 130
                ? Math.min(1, Math.abs(player.lateralSpeed) / 220 + 0.2)
                : 0;
            raceAudio.updateEngine(player.rpm, speedRatio, player.isBoosting, driftIntensity);
          } else if (world.phase === 'COUNTDOWN') {
            const rev = keysRef.current.has('KeyW') || keysRef.current.has('ArrowUp') ? 0.55 : 0.16;
            raceAudio.updateEngine(rev, 0.05, false, 0);
          }
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          renderRaceCanvas(ctx, cssW, cssH, world);
          ctx.restore();
        }

        // Update React HUD & Minimap at ~20Hz so UI stays buttery smooth without React overhead
        hudAccum += dt;
        if (hudAccum >= 0.045) {
          hudAccum = 0;
          const snap = buildHudSnapshot(world);
          setHud(snap);

          const mini = minimapRef.current;
          if (mini) {
            const mDpr = Math.min(window.devicePixelRatio || 1, 2);
            const mw = 164;
            const mh = 112;
            if (mini.width !== mw * mDpr || mini.height !== mh * mDpr) {
              mini.width = mw * mDpr;
              mini.height = mh * mDpr;
            }
            const mCtx = mini.getContext('2d');
            if (mCtx) {
              mCtx.save();
              mCtx.scale(mDpr, mDpr);
              renderTrackOutline(mCtx, mw, mh, world.track, {
                carPositions: snap.carPositions,
                showWalls: false,
              });
              mCtx.restore();
            }
          }
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [config.trackId, onSaveRecord, playerCar.name, showTemporaryBanner]);

  const bindTouch = (field: keyof RaceInputState) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      raceAudio.unlock();
      touchInputRef.current[field] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      touchInputRef.current[field] = false;
    },
    onPointerLeave: () => {
      touchInputRef.current[field] = false;
    },
    onPointerCancel: () => {
      touchInputRef.current[field] = false;
    },
  });

  const isFinished = hud?.phase === 'FINISHED';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0B0D12] select-none">
      {/* Fullscreen Race Canvas */}
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Top-Left Telemetry HUD */}
      {hud && (
        <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="rounded-xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md">
            <div className="flex items-baseline gap-5">
              <div>
                <div className="text-[11px] font-medium text-slate-400">Position</div>
                <div className="font-display text-3xl font-bold leading-none text-white tabular-nums">
                  {formatOrdinal(hud.position)}
                  <span className="ml-1 text-sm font-normal text-slate-400">
                    / {hud.totalCars}
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-[11px] font-medium text-slate-400">Lap</div>
                <div className="font-display text-3xl font-bold leading-none text-white tabular-nums">
                  {hud.lap}
                  <span className="ml-1 text-sm font-normal text-slate-400">
                    / {hud.totalLaps}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1 border-t border-white/10 pt-2.5 text-xs">
              <div>
                <span className="text-slate-400">Lap Time </span>
                <span className="font-mono-tabular font-semibold text-white">
                  {formatLapTime(hud.currentLapMs)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Best </span>
                <span className="font-mono-tabular font-semibold text-amber-400">
                  {formatLapTime(hud.bestLapMs)}
                </span>
              </div>
            </div>
          </div>

          {hud.wrongWay && (
            <div className="rounded-lg border border-red-500/60 bg-red-600/85 px-4 py-2 text-center font-display text-sm font-bold tracking-wider text-white">
              WRONG WAY — TURN AROUND
            </div>
          )}

          {lapBanner && (
            <div
              className={`rounded-lg border px-4 py-2 font-mono-tabular text-xs font-bold ${
                lapBanner.accent
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                  : 'border-white/15 bg-black/65 text-white'
              }`}
            >
              {lapBanner.text}
            </div>
          )}
        </div>
      )}

      {/* Top-Right Minimap & Action Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTouchPad((v) => !v)}
            className="rounded-lg border border-white/10 bg-black/55 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-md hover:bg-black/75 cursor-pointer"
          >
            {showTouchPad ? 'Hide Touch Pad' : 'Touch Pad'}
          </button>
          <button
            type="button"
            onClick={() => onUpdateAudio({ ...audio, muted: !audio.muted })}
            aria-label={audio.muted ? 'Unmute audio' : 'Mute audio'}
            className="rounded-lg border border-white/10 bg-black/55 p-2 text-slate-200 backdrop-blur-md hover:bg-black/75 cursor-pointer"
          >
            {audio.muted ? (
              <VolumeX className="h-4 w-4 text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-emerald-400" />
            )}
          </button>
          <button
            type="button"
            onClick={initRace}
            aria-label="Restart race"
            title="Restart (R)"
            className="rounded-lg border border-white/10 bg-black/55 p-2 text-slate-200 backdrop-blur-md hover:bg-black/75 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={togglePause}
            aria-label="Pause race"
            title="Pause (P)"
            className="rounded-lg border border-white/10 bg-black/55 p-2 text-slate-200 backdrop-blur-md hover:bg-black/75 cursor-pointer"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/55 p-2 backdrop-blur-md">
          <div className="mb-1 flex items-center justify-between px-1 text-[10px] font-medium text-slate-400">
            <span>{trackDef.name}</span>
            <span>{config.laps}L</span>
          </div>
          <canvas ref={minimapRef} style={{ width: 164, height: 112 }} className="block" />
        </div>
      </div>

      {/* Bottom-Right Speedometer & Nitro HUD */}
      {hud && !isFinished && (
        <div className="pointer-events-none absolute right-4 bottom-4 z-10 w-56 rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-md">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono-tabular text-4xl font-bold leading-none text-white">
                {hud.speedKmh}
              </div>
              <div className="mt-1 text-[11px] font-medium text-slate-400">KM/H</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Gear</div>
              <div className="font-display text-2xl font-bold leading-none text-amber-400">
                {hud.gear}
              </div>
            </div>
          </div>

          {/* RPM Bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${Math.round(hud.rpm * 100)}%`,
                backgroundColor: hud.rpm > 0.86 ? '#EF4444' : '#F59E0B',
              }}
            />
          </div>

          {/* Nitro Gauge */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-cyan-300">
                <Flame className="h-3 w-3" />
                Nitro
              </span>
              <span className="font-mono-tabular text-slate-300">
                {Math.round(hud.nitro)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-cyan-400 transition-all duration-75"
                style={{ width: `${Math.round(hud.nitro)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom-Left Controls Hint (Desktop) */}
      {!showTouchPad && !isFinished && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden sm:block rounded-lg border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-slate-300 backdrop-blur-md">
          WASD / Arrows: Drive · Space: Drift · Shift: Nitro · R: Restart · P: Pause
        </div>
      )}

      {/* Touch Controls Overlay */}
      {showTouchPad && !isFinished && !paused && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex items-end justify-between">
          <div className="pointer-events-auto flex gap-2.5">
            <button
              type="button"
              {...bindTouch('left')}
              className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/20 bg-black/65 font-display text-lg font-bold text-white active:bg-white/20"
            >
              ◀
            </button>
            <button
              type="button"
              {...bindTouch('right')}
              className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/20 bg-black/65 font-display text-lg font-bold text-white active:bg-white/20"
            >
              ▶
            </button>
          </div>

          <div className="pointer-events-auto flex gap-2.5">
            <button
              type="button"
              {...bindTouch('drift')}
              className="flex h-14 px-4 items-center justify-center rounded-xl border border-amber-400/30 bg-black/65 text-xs font-bold text-amber-300 active:bg-amber-500/30"
            >
              DRIFT
            </button>
            <button
              type="button"
              {...bindTouch('nitro')}
              className="flex h-14 px-4 items-center justify-center rounded-xl border border-cyan-400/30 bg-black/65 text-xs font-bold text-cyan-300 active:bg-cyan-500/30"
            >
              NITRO
            </button>
            <button
              type="button"
              {...bindTouch('brake')}
              className="flex h-16 px-4 items-center justify-center rounded-xl border border-red-400/30 bg-black/65 text-xs font-bold text-red-300 active:bg-red-500/30"
            >
              BRAKE
            </button>
            <button
              type="button"
              {...bindTouch('throttle')}
              className="flex h-16 px-6 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-600/80 text-xs font-bold text-white active:bg-emerald-500"
            >
              GAS
            </button>
          </div>
        </div>
      )}

      {/* Starting Lights Countdown Overlay */}
      {hud?.phase === 'COUNTDOWN' && !paused && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
          <div className="rounded-2xl border border-white/15 bg-black/75 px-8 py-6 text-center backdrop-blur-md">
            <div className="mb-3 flex items-center justify-center gap-3">
              {[3, 2, 1].map((light) => {
                const lit = hud.countdownValue <= light && hud.countdownValue > 0;
                return (
                  <span
                    key={light}
                    className={`h-5 w-5 rounded-full border transition-colors ${
                      lit
                        ? 'border-red-400 bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.85)]'
                        : 'border-white/20 bg-white/10'
                    }`}
                  />
                );
              })}
            </div>
            <div className="font-display text-6xl font-bold text-white tabular-nums">
              {hud.countdownValue > 0 ? hud.countdownValue : 'GO!'}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {trackDef.name} · {playerCar.name}
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {paused && !isFinished && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#131722] p-6 space-y-5">
            <div className="border-b border-white/10 pb-3">
              <h2 className="font-display text-2xl font-bold text-white">Race Paused</h2>
              <p className="text-xs text-slate-400">
                {trackDef.name} · Lap {hud?.lap ?? 1} of {config.laps}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Music Track</span>
                <select
                  value={audio.musicTrackId}
                  onChange={(e) =>
                    onUpdateAudio({ ...audio, musicTrackId: e.target.value as MusicTrackId })
                  }
                  className="rounded-md border border-white/15 bg-[#0B0D12] px-2.5 py-1.5 text-xs text-white"
                >
                  {MUSIC_TRACK_META.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Audio Output</span>
                <button
                  type="button"
                  onClick={() => onUpdateAudio({ ...audio, muted: !audio.muted })}
                  className="rounded-md border border-white/15 bg-[#0B0D12] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                >
                  {audio.muted ? 'Unmute Audio' : 'Mute Audio'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={togglePause}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                Resume Race
              </button>
              <button
                type="button"
                onClick={initRace}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white hover:bg-white/10 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Restart Race
              </button>
              <button
                type="button"
                onClick={() => onExitToMenu('RACE')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                <Home className="h-4 w-4" />
                Quit to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkered Flag / Finish Results Modal */}
      {isFinished && hud && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#131722] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-400">
                  Checkered Flag · {trackDef.name}
                </div>
                <h2 className="font-display text-3xl font-bold text-white">
                  {hud.position === 1
                    ? '1st Place Victory'
                    : `Finished ${formatOrdinal(hud.position)}`}
                </h2>
                {hud.newRecord && (
                  <p className="mt-1 text-xs font-semibold text-amber-400">
                    New Track Lap Record: {formatLapTime(hud.bestLapMs)}
                  </p>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Your Best Lap</div>
                <div className="font-mono-tabular text-xl font-bold text-amber-400">
                  {formatLapTime(hud.bestLapMs)}
                </div>
              </div>
            </div>

            {/* Standings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400">
                    <th className="py-2 pr-3 font-medium">Pos</th>
                    <th className="py-2 pr-3 font-medium">Driver</th>
                    <th className="py-2 pr-3 font-medium">Car</th>
                    <th className="py-2 pr-3 font-medium text-right">Best Lap</th>
                    <th className="py-2 font-medium text-right">Race Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {hud.standings.map((row) => (
                    <tr
                      key={row.id}
                      className={row.isPlayer ? 'bg-red-500/10 font-semibold text-white' : 'text-slate-300'}
                    >
                      <td className="py-2.5 pr-3 font-display font-bold tabular-nums">
                        {formatOrdinal(row.position)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: row.primaryColor }}
                          />
                          {row.isPlayer ? 'You' : row.name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-400">{row.carName}</td>
                      <td className="py-2.5 pr-3 text-right font-mono-tabular text-xs">
                        {formatLapTime(row.bestLapMs)}
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular text-xs">
                        {row.finishTimeMs
                          ? row.position === 1
                            ? formatLapTime(row.finishTimeMs)
                            : row.gapMs !== null
                            ? `+${(row.gapMs / 1000).toFixed(2)}s`
                            : formatLapTime(row.finishTimeMs)
                          : 'Running'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => onExitToMenu('TRACKS')}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                Change Track
              </button>
              <button
                type="button"
                onClick={() => onExitToMenu('GARAGE')}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                Change Car
              </button>
              <button
                type="button"
                onClick={() => onExitToMenu('RACE')}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 whitespace-nowrap cursor-pointer"
              >
                Main Menu
              </button>
              <button
                type="button"
                onClick={initRace}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
