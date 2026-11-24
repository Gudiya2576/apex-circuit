import { useCallback, useEffect, useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { RaceView } from './components/RaceView';
import { TopBar } from './components/TopBar';
import { raceAudio } from './game/audio';
import {
  loadAudioSettings,
  loadRaceConfig,
  loadTrackRecords,
  saveAudioSettings,
  saveRaceConfig,
  saveTrackRecord,
} from './game/storage';
import { AudioSettings, MenuTab, RaceConfig, TrackRecord } from './game/types';

export default function App() {
  const [screen, setScreen] = useState<'MENU' | 'RACE'>('MENU');
  const [activeTab, setActiveTab] = useState<MenuTab>('RACE');
  const [config, setConfig] = useState<RaceConfig>(() => loadRaceConfig());
  const [audio, setAudio] = useState<AudioSettings>(() => loadAudioSettings());
  const [records, setRecords] = useState<Record<string, TrackRecord>>(() => loadTrackRecords());

  useEffect(() => {
    raceAudio.updateSettings(audio);
  }, [audio]);

  const handleUpdateConfig = useCallback((next: RaceConfig) => {
    setConfig(next);
    saveRaceConfig(next);
  }, []);

  const handleUpdateAudio = useCallback((next: AudioSettings) => {
    setAudio(next);
    saveAudioSettings(next);
    raceAudio.unlock();
    raceAudio.updateSettings(next);
    if (!next.muted) {
      raceAudio.startMusic(screen === 'RACE' ? 'race' : 'menu');
    }
  }, [screen]);

  const handleSaveRecord = useCallback((trackId: string, bestLapMs: number, carName: string) => {
    const updated = saveTrackRecord(trackId, bestLapMs, carName);
    setRecords(updated);
  }, []);

  const handleStartRace = useCallback(() => {
    raceAudio.unlock();
    raceAudio.playUiClick();
    raceAudio.startMusic('race');
    setScreen('RACE');
  }, []);

  const handleExitToMenu = useCallback((openTab: 'RACE' | 'GARAGE' | 'TRACKS' = 'RACE') => {
    raceAudio.playUiClick();
    raceAudio.stopEngine();
    raceAudio.setMusicIntensity('menu');
    setActiveTab(openTab);
    setScreen('MENU');
  }, []);

  const handleSelectTab = useCallback((tab: MenuTab) => {
    raceAudio.unlock();
    raceAudio.playUiClick();
    if (!audio.muted) {
      raceAudio.startMusic('menu');
    }
    setActiveTab(tab);
  }, [audio.muted]);

  if (screen === 'RACE') {
    return (
      <RaceView
        config={config}
        existingRecordMs={records[config.trackId]?.bestLapMs ?? null}
        audio={audio}
        onUpdateAudio={handleUpdateAudio}
        onSaveRecord={handleSaveRecord}
        onExitToMenu={handleExitToMenu}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onStartRace={handleStartRace}
      />
      <MainMenu
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        audio={audio}
        onUpdateAudio={handleUpdateAudio}
        records={records}
        onStartRace={handleStartRace}
        onPlayClick={() => {
          raceAudio.unlock();
          raceAudio.playUiClick();
        }}
      />
    </div>
  );
}
