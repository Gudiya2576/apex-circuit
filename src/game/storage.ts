import { AudioSettings, RaceConfig, TrackRecord } from './types';

const CONFIG_KEY = 'apex_circuit_config_v1';
const AUDIO_KEY = 'apex_circuit_audio_v1';
const RECORDS_KEY = 'apex_circuit_records_v1';

export const DEFAULT_RACE_CONFIG: RaceConfig = {
  trackId: 'apex_gp',
  carId: 'apex_gtr',
  customColor: null,
  laps: 3,
  opponentCount: 5,
  difficulty: 'PRO',
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.75,
  sfxVolume: 0.85,
  musicVolume: 0.55,
  muted: false,
  musicTrackId: 'neon_overdrive',
};

export function loadRaceConfig(): RaceConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_RACE_CONFIG;
    return { ...DEFAULT_RACE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RACE_CONFIG;
  }
}

export function saveRaceConfig(config: RaceConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadTrackRecords(): Record<string, TrackRecord> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, TrackRecord>;
  } catch {
    return {};
  }
}

export function saveTrackRecord(trackId: string, bestLapMs: number, carName: string): Record<string, TrackRecord> {
  const records = loadTrackRecords();
  const existing = records[trackId];
  if (!existing || bestLapMs < existing.bestLapMs) {
    records[trackId] = {
      bestLapMs,
      carName,
      achievedAt: new Date().toLocaleDateString(),
    };
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch {
      // Ignore
    }
  }
  return records;
}

export function formatLapTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return '--:--.---';
  const totalMs = Math.floor(ms);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function formatOrdinal(pos: number): string {
  const mod100 = pos % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${pos}th`;
  switch (pos % 10) {
    case 1:
      return `${pos}st`;
    case 2:
      return `${pos}nd`;
    case 3:
      return `${pos}rd`;
    default:
      return `${pos}th`;
  }
}
