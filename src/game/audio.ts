import { AudioSettings, MusicTrackId } from './types';

interface MusicPattern {
  bpm: number;
  bassNotes: number[];
  leadNotes: number[];
  padNotes: number[];
  bassWave: OscillatorType;
  leadWave: OscillatorType;
}

const MUSIC_PATTERNS: Record<MusicTrackId, MusicPattern> = {
  neon_overdrive: {
    bpm: 132,
    // E minor driving synthwave
    bassNotes: [82.41, 82.41, 82.41, 98.0, 110.0, 110.0, 98.0, 73.42],
    leadNotes: [329.63, 392.0, 493.88, 392.0, 440.0, 523.25, 493.88, 392.0],
    padNotes: [164.81, 196.0, 220.0, 146.83],
    bassWave: 'sawtooth',
    leadWave: 'square',
  },
  apex_velocity: {
    bpm: 142,
    // D minor high-tempo electro racer
    bassNotes: [73.42, 73.42, 87.31, 73.42, 98.0, 98.0, 110.0, 87.31],
    leadNotes: [293.66, 440.0, 349.23, 523.25, 440.0, 587.33, 523.25, 440.0],
    padNotes: [146.83, 174.61, 196.0, 220.0],
    bassWave: 'sawtooth',
    leadWave: 'sawtooth',
  },
  midnight_paddock: {
    bpm: 118,
    // C minor atmospheric garage / techno
    bassNotes: [65.41, 0, 65.41, 77.78, 87.31, 0, 77.78, 58.27],
    leadNotes: [261.63, 311.13, 392.0, 311.13, 349.23, 392.0, 466.16, 392.0],
    padNotes: [130.81, 155.56, 174.61, 116.54],
    bassWave: 'triangle',
    leadWave: 'sine',
  },
};

export const MUSIC_TRACK_META: Array<{ id: MusicTrackId; title: string; subtitle: string; bpm: number }> = [
  { id: 'neon_overdrive', title: 'Neon Overdrive', subtitle: 'Driving Synthwave', bpm: 132 },
  { id: 'apex_velocity', title: 'Apex Velocity', subtitle: 'High-Tempo Electro', bpm: 142 },
  { id: 'midnight_paddock', title: 'Midnight Paddock', subtitle: 'Atmospheric Techno', bpm: 118 },
];

export class RaceAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine synth nodes
  private engineActive = false;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Tire screech nodes
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechSource: AudioBufferSourceNode | null = null;

  // Music sequencer
  private musicTimer: number | null = null;
  private musicPlaying = false;
  private musicStep = 0;
  private nextNoteTime = 0;
  private musicIntensity: 'menu' | 'race' = 'menu';

  private settings: AudioSettings = {
    masterVolume: 0.75,
    sfxVolume: 0.85,
    musicVolume: 0.55,
    muted: false,
    musicTrackId: 'neon_overdrive',
  };

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyGains();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public updateSettings(next: AudioSettings): void {
    const trackChanged = next.musicTrackId !== this.settings.musicTrackId;
    this.settings = { ...next };
    this.applyGains();
    if (trackChanged && this.musicPlaying) {
      this.musicStep = 0;
    }
  }

  private applyGains(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume;
    const musicScale = this.musicIntensity === 'menu' ? 0.55 : 0.9;
    this.masterGain.gain.setTargetAtTime(master, now, 0.03);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.03);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * musicScale, now, 0.05);
  }

  public startEngine(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.engineActive) return;

    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc2 = ctx.createOscillator();
    this.engineFilter = ctx.createBiquadFilter();
    this.engineGain = ctx.createGain();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';
    this.engineOsc1.frequency.value = 62;
    this.engineOsc2.frequency.value = 124;

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 340;
    this.engineFilter.Q.value = 2.4;

    this.engineGain.gain.value = 0.0001;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();

    // Tire screech noise loop
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.screechSource = ctx.createBufferSource();
    this.screechSource.buffer = noiseBuffer;
    this.screechSource.loop = true;

    this.screechFilter = ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.value = 1450;
    this.screechFilter.Q.value = 4.5;

    this.screechGain = ctx.createGain();
    this.screechGain.gain.value = 0.0;

    this.screechSource.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.sfxGain);
    this.screechSource.start();

    this.engineActive = true;
  }

  public updateEngine(rpm: number, speedRatio: number, isBoosting: boolean, driftIntensity: number): void {
    if (!this.ctx || !this.engineActive || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain || !this.screechGain || !this.screechFilter) {
      return;
    }
    const now = this.ctx.currentTime;
    const clampedRpm = Math.max(0.08, Math.min(1.15, rpm));
    const baseFreq = 52 + clampedRpm * 138 + (isBoosting ? 24 : 0);

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.99, now, 0.04);
    this.engineFilter.frequency.setTargetAtTime(280 + clampedRpm * 980 + (isBoosting ? 420 : 0), now, 0.05);
    this.engineGain.gain.setTargetAtTime(0.065 + speedRatio * 0.06 + (isBoosting ? 0.035 : 0), now, 0.05);

    const screechVol = Math.min(0.11, Math.max(0, driftIntensity) * 0.11);
    this.screechGain.gain.setTargetAtTime(screechVol, now, 0.04);
    this.screechFilter.frequency.setTargetAtTime(1200 + speedRatio * 750, now, 0.05);
  }

  public stopEngine(): void {
    if (!this.engineActive) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.screechSource?.stop();
    } catch {
      // Ignore already stopped
    }
    this.engineOsc1?.disconnect();
    this.engineOsc2?.disconnect();
    this.engineFilter?.disconnect();
    this.engineGain?.disconnect();
    this.screechSource?.disconnect();
    this.screechFilter?.disconnect();
    this.screechGain?.disconnect();
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.screechSource = null;
    this.screechFilter = null;
    this.screechGain = null;
    this.engineActive = false;
  }

  public startMusic(intensity: 'menu' | 'race'): void {
    this.musicIntensity = intensity;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.applyGains();

    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.musicTimer = window.setInterval(() => {
      this.scheduleMusicLookahead();
    }, 35);
  }

  public setMusicIntensity(intensity: 'menu' | 'race'): void {
    this.musicIntensity = intensity;
    this.applyGains();
  }

  public stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleMusicLookahead(): void {
    if (!this.ctx || !this.musicGain || !this.musicPlaying) return;
    const pattern = MUSIC_PATTERNS[this.settings.musicTrackId];
    const sixteenthDur = 60 / pattern.bpm / 4;

    while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
      this.triggerMusicStep(this.musicStep, this.nextNoteTime, sixteenthDur, pattern);
      this.nextNoteTime += sixteenthDur;
      this.musicStep = (this.musicStep + 1) % 32;
    }
  }

  private triggerMusicStep(step: number, time: number, dur: number, pattern: MusicPattern): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    // Kick on 0, 4, 8, 12...
    if (step % 4 === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(125, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.11);
      gain.gain.setValueAtTime(0.38, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.15);
    }

    // Snare on 4, 12, 20, 28
    if (step % 8 === 4 && this.musicIntensity === 'race') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, time);
      osc.frequency.exponentialRampToValueAtTime(95, time + 0.08);
      gain.gain.setValueAtTime(0.16, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.1);
    }

    // Hi-hat on off-beats
    if (step % 2 === 1) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(6400, time);
      gain.gain.setValueAtTime(step % 4 === 2 ? 0.035 : 0.02, time);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.025);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.03);
    }

    // Bass pulse every 2 steps (eighth notes)
    if (step % 2 === 0) {
      const barIdx = Math.floor(step / 4) % pattern.bassNotes.length;
      const freq = pattern.bassNotes[barIdx];
      if (freq > 0) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = pattern.bassWave;
        osc.frequency.setValueAtTime(freq, time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(480, time);
        filter.frequency.exponentialRampToValueAtTime(160, time + dur * 1.6);
        gain.gain.setValueAtTime(0.16, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 1.75);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur * 1.8);
      }
    }

    // Lead arpeggio in race mode (or softer in menu)
    if (step % 2 === 0) {
      const leadIdx = (step / 2) % pattern.leadNotes.length;
      const freq = pattern.leadNotes[leadIdx];
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = pattern.leadWave;
      osc.frequency.setValueAtTime(freq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.musicIntensity === 'race' ? 1900 : 950, time);
      gain.gain.setValueAtTime(this.musicIntensity === 'race' ? 0.075 : 0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 1.4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + dur * 1.45);
    }
  }

  public playCountdownBeep(isGo: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isGo ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.14);
    }
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.42 : 0.22));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isGo ? 0.44 : 0.24));
  }

  public playWallHit(intensity: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const vol = Math.min(0.32, 0.08 + intensity * 0.24);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.16);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playCarBump(intensity: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const vol = Math.min(0.24, 0.06 + intensity * 0.18);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.1);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playLapComplete(isBest: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const notes = isBest ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playFinishFanfare(isWin: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const notes = isWin ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [440, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.095;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const raceAudio = new RaceAudioEngine();
