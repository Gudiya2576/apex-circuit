import { useState } from 'react';
import { Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';
import { CAR_PAINT_PALETTE, CARS, getCarById } from '../game/cars';
import { MUSIC_TRACK_META } from '../game/audio';
import { formatLapTime } from '../game/storage';
import { getTrackById, TRACK_DEFINITIONS } from '../game/tracks';
import { AudioSettings, Difficulty, MenuTab, MusicTrackId, RaceConfig, TrackRecord } from '../game/types';
import { CarPreviewCanvas } from './CarPreviewCanvas';
import { TrackPreviewCanvas } from './TrackPreviewCanvas';

interface MainMenuProps {
  activeTab: MenuTab;
  onSelectTab: (tab: MenuTab) => void;
  config: RaceConfig;
  onUpdateConfig: (next: RaceConfig) => void;
  audio: AudioSettings;
  onUpdateAudio: (next: AudioSettings) => void;
  records: Record<string, TrackRecord>;
  onStartRace: () => void;
  onPlayClick: () => void;
}

const HERO_IMAGE_URL = '/src/assets/images/racing_paddock_hero_1795535131539.jpg';

const LAP_OPTIONS = [1, 3, 5, 7];
const OPPONENT_OPTIONS = [3, 5, 7];
const DIFFICULTY_OPTIONS: Array<{ id: Difficulty; label: string }> = [
  { id: 'ROOKIE', label: 'Rookie' },
  { id: 'PRO', label: 'Pro' },
  { id: 'ACE', label: 'Ace' },
];

export function MainMenu({
  activeTab,
  onSelectTab,
  config,
  onUpdateConfig,
  audio,
  onUpdateAudio,
  records,
  onStartRace,
  onPlayClick,
}: MainMenuProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const selectedCar = getCarById(config.carId);
  const selectedTrack = getTrackById(config.trackId);
  const activeColor = config.customColor || selectedCar.defaultColor;
  const trackRecord = records[selectedTrack.id];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {activeTab === 'RACE' && (
        <div className="space-y-8">
          {/* Hero Split Banner */}
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#131722]">
            {!heroImgFailed && (
              <img
                src={HERO_IMAGE_URL}
                alt="GT race car in twilight motorsport pit lane"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(11,13,18,0.95) 0%, rgba(11,13,18,0.82) 52%, rgba(11,13,18,0.45) 100%)',
              }}
            />

            <div className="relative z-10 grid grid-cols-1 gap-8 p-8 lg:grid-cols-12 lg:items-center lg:p-10">
              <div className="lg:col-span-7 space-y-5">
                <p className="text-xs font-medium tracking-wider text-slate-400">
                  5 Walled Circuits · 6 Race Cars · Full Grid AI
                </p>
                <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl text-balance">
                  Wheel-to-Wheel Arcade Circuit Racing
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-slate-300">
                  Pick your machine, dial in your paint, and battle rival drivers across tight street barriers, desert canyons, and floodlit grand prix corners.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onStartRace}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 active:bg-red-700 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Race Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPlayClick();
                      onSelectTab('GARAGE');
                    }}
                    className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
                  >
                    Choose Car
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPlayClick();
                      onSelectTab('TRACKS');
                    }}
                    className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
                  >
                    Choose Track
                  </button>
                </div>
              </div>

              {/* Active Loadout Summary */}
              <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#0B0D12]/85 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <div className="text-xs text-slate-400">Active Entry</div>
                    <div className="font-display text-lg font-bold text-white">
                      {selectedCar.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onPlayClick();
                      onSelectTab('GARAGE');
                    }}
                    className="text-xs font-medium text-red-400 hover:text-red-300 whitespace-nowrap cursor-pointer"
                  >
                    Change Car
                  </button>
                </div>

                <div className="py-3">
                  <CarPreviewCanvas car={selectedCar} colorOverride={activeColor} active width={240} height={104} />
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    <div className="text-xs text-slate-400">Circuit</div>
                    <div className="font-display text-base font-bold text-white">
                      {selectedTrack.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {selectedTrack.location} · {config.laps} {config.laps === 1 ? 'Lap' : 'Laps'} · {config.opponentCount + 1} Cars
                    </div>
                  </div>
                  <TrackPreviewCanvas track={selectedTrack} width={96} height={60} />
                </div>
              </div>
            </div>
          </section>

          {/* Race Weekend Rules Grid */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Laps */}
            <div className="rounded-xl border border-white/10 bg-[#131722] p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Race Distance</h2>
                <p className="text-sm text-slate-400">Set total laps to the checkered flag.</p>
              </div>
              <div className="grid grid-cols-4 gap-2 rounded-lg bg-[#0B0D12] p-1">
                {LAP_OPTIONS.map((laps) => {
                  const active = config.laps === laps;
                  return (
                    <button
                      key={laps}
                      type="button"
                      onClick={() => {
                        onPlayClick();
                        onUpdateConfig({ ...config, laps });
                      }}
                      className={`rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {laps} {laps === 1 ? 'Lap' : 'Laps'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opponents */}
            <div className="rounded-xl border border-white/10 bg-[#131722] p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Starting Grid</h2>
                <p className="text-sm text-slate-400">Choose how many rival cars to race against.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#0B0D12] p-1">
                {OPPONENT_OPTIONS.map((opp) => {
                  const active = config.opponentCount === opp;
                  return (
                    <button
                      key={opp}
                      type="button"
                      onClick={() => {
                        onPlayClick();
                        onUpdateConfig({ ...config, opponentCount: opp });
                      }}
                      className={`rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {opp} Rivals
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="rounded-xl border border-white/10 bg-[#131722] p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white">AI Pace</h2>
                <p className="text-sm text-slate-400">Adjust opponent cornering speed and aggression.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#0B0D12] p-1">
                {DIFFICULTY_OPTIONS.map((diff) => {
                  const active = config.difficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => {
                        onPlayClick();
                        onUpdateConfig({ ...config, difficulty: diff.id });
                      }}
                      className={`rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {diff.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Track Record & Controls Quick Strip */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#131722] p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Track Lap Record · {selectedTrack.name}</div>
                <div className="font-mono-tabular text-2xl font-bold text-white">
                  {trackRecord ? formatLapTime(trackRecord.bestLapMs) : 'No Record Set'}
                </div>
                <div className="text-xs text-slate-400">
                  {trackRecord ? `${trackRecord.carName} · ${trackRecord.achievedAt}` : 'Complete a clean lap to set the benchmark'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  onSelectTab('TRACKS');
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                All 5 Tracks
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#131722] p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Controls & Sound</div>
                <div className="text-sm text-slate-200">
                  WASD or Arrows to Drive · Space to Drift · Shift for Nitro
                </div>
                <div className="text-xs text-slate-400">
                  Music: {MUSIC_TRACK_META.find((m) => m.id === audio.musicTrackId)?.title} · {audio.muted ? 'Muted' : 'Audio On'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  onUpdateAudio({ ...audio, muted: !audio.muted });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                {audio.muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                {audio.muted ? 'Unmute' : 'Mute Audio'}
              </button>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'GARAGE' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">Paddock Garage</h1>
              <p className="mt-1 text-sm text-slate-400">
                Select from 6 race-spec chassis and customize your paint livery.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartRace}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 whitespace-nowrap cursor-pointer"
            >
              Race with {selectedCar.name}
            </button>
          </div>

          {/* Paint Selector */}
          <section className="rounded-xl border border-white/10 bg-[#131722] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Livery Paint</h2>
                <p className="text-xs text-slate-400">
                  Applied to {selectedCar.name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {CAR_PAINT_PALETTE.map((swatch) => {
                  const isSelected =
                    (swatch.hex === '' && !config.customColor) ||
                    config.customColor === swatch.hex;
                  const displayHex = swatch.hex || selectedCar.defaultColor;
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      title={swatch.name}
                      onClick={() => {
                        onPlayClick();
                        onUpdateConfig({
                          ...config,
                          customColor: swatch.hex === '' ? null : swatch.hex,
                        });
                      }}
                      className={`h-8 w-8 rounded-full border-2 transition-transform cursor-pointer ${
                        isSelected
                          ? 'scale-110 border-white ring-2 ring-red-500 ring-offset-2 ring-offset-[#131722]'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: displayHex }}
                      aria-label={`Paint ${swatch.name}`}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* 6-Car Grid */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CARS.map((car) => {
              const isSelected = car.id === config.carId;
              const previewColor = isSelected ? activeColor : car.defaultColor;
              return (
                <div
                  key={car.id}
                  onClick={() => {
                    onPlayClick();
                    onUpdateConfig({ ...config, carId: car.id });
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPlayClick();
                      onUpdateConfig({ ...config, carId: car.id });
                    }
                  }}
                  className={`rounded-xl border p-6 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-red-500 ${
                    isSelected
                      ? 'border-red-500 bg-[#171C2B]'
                      : 'border-white/10 bg-[#131722] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-400">{car.category}</div>
                      <h3 className="font-display text-xl font-bold text-white">{car.name}</h3>
                    </div>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${
                        isSelected ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>

                  <div className="my-4 rounded-lg bg-[#0B0D12]/80 py-2">
                    <CarPreviewCanvas
                      car={car}
                      colorOverride={previewColor}
                      active={isSelected}
                      width={220}
                      height={102}
                    />
                  </div>

                  <p className="mb-4 text-xs leading-relaxed text-slate-400">
                    {car.description}
                  </p>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Top Speed', value: car.stats.topSpeed },
                      { label: 'Acceleration', value: car.stats.acceleration },
                      { label: 'Handling', value: car.stats.handling },
                      { label: 'Nitro Boost', value: car.stats.nitro },
                    ].map((stat) => (
                      <div key={stat.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{stat.label}</span>
                          <span className="font-mono-tabular font-semibold text-slate-200">
                            {stat.value}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${
                              isSelected ? 'bg-red-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${stat.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}

      {activeTab === 'TRACKS' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">Race Circuits</h1>
              <p className="mt-1 text-sm text-slate-400">
                5 distinct walled circuits with apex kerbs, checkpoints, and checkered finish lines.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartRace}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 whitespace-nowrap cursor-pointer"
            >
              Race on {selectedTrack.name}
            </button>
          </div>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TRACK_DEFINITIONS.map((track) => {
              const isSelected = track.id === config.trackId;
              const rec = records[track.id];
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    onPlayClick();
                    onUpdateConfig({ ...config, trackId: track.id });
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPlayClick();
                      onUpdateConfig({ ...config, trackId: track.id });
                    }
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-6 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-red-500 ${
                    isSelected
                      ? 'border-red-500 bg-[#171C2B]'
                      : 'border-white/10 bg-[#131722] hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">
                          {track.location} · {track.difficulty}
                        </div>
                        <h3 className="font-display text-xl font-bold text-white">
                          {track.name}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap ${
                          isSelected ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>

                    <div className="my-4 flex items-center justify-center rounded-lg bg-[#0B0D12]/90 py-3">
                      <TrackPreviewCanvas track={track} width={240} height={140} />
                    </div>

                    <p className="text-xs leading-relaxed text-slate-400">
                      {track.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                    <span className="text-slate-400">
                      Width: {track.halfWidth * 2}px {track.theme.nightMode ? '· Night Lights' : '· Daylight'}
                    </span>
                    <span className="font-mono-tabular font-semibold text-amber-400">
                      {rec ? `Best ${formatLapTime(rec.bestLapMs)}` : 'No Record'}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}

      {activeTab === 'AUDIO' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Audio & Music Settings */}
          <section className="lg:col-span-7 rounded-xl border border-white/10 bg-[#131722] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Sound & Music</h1>
                <p className="text-sm text-slate-400">
                  Real-time synthesized engine audio, tire screech, and soundtrack mixer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPlayClick();
                  onUpdateAudio({ ...audio, muted: !audio.muted });
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  audio.muted
                    ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                    : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {audio.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {audio.muted ? 'Muted' : 'Sound Active'}
              </button>
            </div>

            <div className="space-y-5">
              {[
                {
                  key: 'masterVolume' as const,
                  label: 'Master Volume',
                  value: audio.masterVolume,
                },
                {
                  key: 'sfxVolume' as const,
                  label: 'Engine, Tire & Collision SFX',
                  value: audio.sfxVolume,
                },
                {
                  key: 'musicVolume' as const,
                  label: 'Racing Music Volume',
                  value: audio.musicVolume,
                },
              ].map((slider) => (
                <div key={slider.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor={slider.key} className="font-medium text-slate-200">
                      {slider.label}
                    </label>
                    <span className="font-mono-tabular text-xs text-slate-400">
                      {Math.round(slider.value * 100)}%
                    </span>
                  </div>
                  <input
                    id={slider.key}
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={slider.value}
                    onChange={(e) =>
                      onUpdateAudio({
                        ...audio,
                        [slider.key]: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-5">
              <h2 className="text-sm font-semibold text-white">Soundtrack Selection</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {MUSIC_TRACK_META.map((track) => {
                  const active = audio.musicTrackId === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        onPlayClick();
                        onUpdateAudio({
                          ...audio,
                          muted: false,
                          musicTrackId: track.id as MusicTrackId,
                        });
                      }}
                      className={`rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/10 bg-[#0B0D12] hover:border-white/25'
                      }`}
                    >
                      <div className="font-display text-sm font-bold text-white">
                        {track.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {track.subtitle} · {track.bpm} BPM
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Controls Guide */}
          <section className="lg:col-span-5 rounded-xl border border-white/10 bg-[#131722] p-6 space-y-5">
            <div className="border-b border-white/10 pb-4">
              <h2 className="font-display text-2xl font-bold text-white">Driving Controls</h2>
              <p className="text-sm text-slate-400">
                Keyboard and touch driving layout.
              </p>
            </div>

            <div className="divide-y divide-white/10 text-sm">
              {[
                { action: 'Accelerate', keys: 'W or Up Arrow' },
                { action: 'Brake / Reverse', keys: 'S or Down Arrow' },
                { action: 'Steer Left / Right', keys: 'A / D or Left / Right' },
                { action: 'Handbrake Drift', keys: 'Spacebar' },
                { action: 'Nitro Boost', keys: 'Shift or N' },
                { action: 'Quick Restart', keys: 'R' },
                { action: 'Pause / Resume', keys: 'P or Escape' },
                { action: 'Mute / Unmute', keys: 'M' },
              ].map((row) => (
                <div key={row.action} className="flex items-center justify-between py-2.5">
                  <span className="text-slate-300">{row.action}</span>
                  <span className="font-mono-tabular text-xs font-semibold text-white">
                    {row.keys}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0B0D12] p-4 text-xs leading-relaxed text-slate-400">
              Tip: Drifting around corners recharges your Nitro Boost faster. Watch the apex kerbs and avoid scraping the outer walls to keep your exit speed high.
            </div>

            <button
              type="button"
              onClick={() => {
                onPlayClick();
                onUpdateAudio({
                  masterVolume: 0.75,
                  sfxVolume: 0.85,
                  musicVolume: 0.55,
                  muted: false,
                  musicTrackId: 'neon_overdrive',
                });
              }}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Audio Defaults
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
