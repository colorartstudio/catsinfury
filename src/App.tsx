import React, { useState, useEffect } from 'react';
import { TitleScreen } from './ui/TitleScreen';
import { TeamSelectionScreen } from './ui/TeamSelectionScreen';
import { ArenaSelectionScreen } from './ui/ArenaSelectionScreen';
import { AlmanacScreen } from './ui/AlmanacScreen';
import { BattleScreen } from './ui/BattleScreen';
import { ProfileModal } from './ui/ProfileModal';
import { SettingsModal } from './ui/SettingsModal';
import { CAT_CHARACTERS, calculateTeamSynergy } from './data/characters';
import { ARENAS } from './data/arenas';
import { ArenaDefinition, BotDifficulty, CatCombatant, ElementType } from './types';
import { BattleEngine } from './combat/BattleEngine';
import { AudioManager } from './audio/AudioManager';

type AppScreen = 'TITLE' | 'TEAM_SELECTION' | 'ARENA_SELECTION' | 'ALMANAC' | 'BATTLE';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('TITLE');

  // Selected player team (3 cats IDs)
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(['fire', 'water', 'wind']);

  // Selected Arena
  const [selectedArena, setSelectedArena] = useState<ArenaDefinition>(ARENAS[0]);

  // Bot difficulty
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('NORMAL');

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Performance mode (reduces particle density on low spec devices)
  const [lowPerfMode, setLowPerfMode] = useState<boolean>(false);

  // Modals
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Account Stats and Progression (Stored in LocalStorage for persistence)
  const [accountStats, setAccountStats] = useState({
    matchesPlayed: 0,
    victories: 0,
    defeats: 0,
    totalXp: 0,
    catLevels: { fire: 1, water: 1, wind: 1, earth: 1 } as Record<string, number>,
    catXp: { fire: 0, water: 0, wind: 0, earth: 0 } as Record<string, number>,
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cats_in_fury_stats');
      if (saved) {
        setAccountStats(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveStats = (newStats: typeof accountStats) => {
    setAccountStats(newStats);
    try {
      localStorage.setItem('cats_in_fury_stats', JSON.stringify(newStats));
    } catch {
      // Ignore storage errors
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    AudioManager.setMuted(nextMute);
  };

  // Toggle cat in team selection
  const handleToggleCat = (catId: string) => {
    if (selectedCatIds.includes(catId)) {
      if (selectedCatIds.length > 1) {
        setSelectedCatIds(selectedCatIds.filter((id) => id !== catId));
      }
    } else {
      if (selectedCatIds.length < 3) {
        setSelectedCatIds([...selectedCatIds, catId]);
      } else {
        // Replace last chosen cat
        setSelectedCatIds([selectedCatIds[0], selectedCatIds[1], catId]);
      }
    }
  };

  // Combatant Teams generator for Battle
  const [battleCombatants, setBattleCombatants] = useState<{
    playerTeam: CatCombatant[];
    botTeam: CatCombatant[];
  } | null>(null);

  const startBattle = () => {
    // Generate Player Team with their respective levels & stats
    const playerCombatants: CatCombatant[] = selectedCatIds.map((id, index) => {
      const baseCat = CAT_CHARACTERS[id];
      const level = accountStats.catLevels[id] || 1;
      const xp = accountStats.catXp[id] || 0;
      return BattleEngine.createCombatant(baseCat, 'player', index, level, xp);
    });

    // Generate Bot Team (picks 3 distinct cats with balanced counters)
    const allCatKeys = Object.keys(CAT_CHARACTERS);
    const shuffled = [...allCatKeys].sort(() => 0.5 - Math.random());
    const botCatIds = shuffled.slice(0, 3);

    const botLevel = botDifficulty === 'HARD' ? 3 : botDifficulty === 'NORMAL' ? 2 : 1;

    const botCombatants: CatCombatant[] = botCatIds.map((id, index) => {
      const baseCat = CAT_CHARACTERS[id];
      return BattleEngine.createCombatant(baseCat, 'bot', index, botLevel, 0);
    });

    setBattleCombatants({
      playerTeam: playerCombatants,
      botTeam: botCombatants,
    });

    setCurrentScreen('BATTLE');
  };

  // Handle Battle completion / exit
  const handleExitBattle = (isVictory: boolean, xpEarned: number) => {
    if (xpEarned > 0) {
      const updatedLevels = { ...accountStats.catLevels };
      const updatedXp = { ...accountStats.catXp };

      // Distribute XP to participating cats
      selectedCatIds.forEach((id) => {
        const currentXp = (updatedXp[id] || 0) + xpEarned;
        updatedXp[id] = currentXp;
        // Level up for every 1000 XP (max level 30)
        const newLevel = Math.min(30, 1 + Math.floor(currentXp / 1000));
        updatedLevels[id] = newLevel;
      });

      const updated = {
        matchesPlayed: accountStats.matchesPlayed + 1,
        victories: isVictory ? accountStats.victories + 1 : accountStats.victories,
        defeats: !isVictory ? accountStats.defeats + 1 : accountStats.defeats,
        totalXp: accountStats.totalXp + xpEarned,
        catLevels: updatedLevels,
        catXp: updatedXp,
      };

      saveStats(updated);
    }

    setCurrentScreen('TITLE');
    setBattleCombatants(null);
  };

  const playerElements = selectedCatIds.map((id) => CAT_CHARACTERS[id].element);
  const playerSynergy = calculateTeamSynergy(playerElements);

  const defaultBotElements: ElementType[] = ['FOGO', 'ÁGUA', 'TERRA'];
  const botElements: ElementType[] = battleCombatants
    ? battleCombatants.botTeam.map((c) => c.baseStats.element)
    : defaultBotElements;
  const botSynergy = calculateTeamSynergy(botElements);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090b10] text-slate-100 font-sans">
      {/* 1. Title Screen */}
      {currentScreen === 'TITLE' && (
        <TitleScreen
          onPlay={() => setCurrentScreen('TEAM_SELECTION')}
          onSelectTeam={() => setCurrentScreen('TEAM_SELECTION')}
          onOpenAlmanac={() => setCurrentScreen('ALMANAC')}
          onOpenArenas={() => setCurrentScreen('ARENA_SELECTION')}
          onOpenProfile={() => setShowProfile(true)}
          onOpenSettings={() => setShowSettings(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Team Selection Screen */}
      {currentScreen === 'TEAM_SELECTION' && (
        <TeamSelectionScreen
          selectedCatIds={selectedCatIds}
          onToggleCat={handleToggleCat}
          onConfirmTeam={() => setCurrentScreen('ARENA_SELECTION')}
          onBack={() => setCurrentScreen('TITLE')}
        />
      )}

      {/* 3. Arena Selection Screen */}
      {currentScreen === 'ARENA_SELECTION' && (
        <ArenaSelectionScreen
          selectedArena={selectedArena}
          onSelectArena={setSelectedArena}
          botDifficulty={botDifficulty}
          onSelectDifficulty={setBotDifficulty}
          onStartBattle={startBattle}
          onBack={() => setCurrentScreen('TEAM_SELECTION')}
        />
      )}

      {/* 4. Almanac / Character Bible Screen */}
      {currentScreen === 'ALMANAC' && (
        <AlmanacScreen onBack={() => setCurrentScreen('TITLE')} />
      )}

      {/* 5. Live Battle Arena */}
      {currentScreen === 'BATTLE' && battleCombatants && (
        <BattleScreen
          arena={selectedArena}
          playerTeam={battleCombatants.playerTeam}
          botTeam={battleCombatants.botTeam}
          playerSynergy={playerSynergy}
          botSynergy={botSynergy}
          botDifficulty={botDifficulty}
          onExitBattle={handleExitBattle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        stats={accountStats}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        botDifficulty={botDifficulty}
        onSelectDifficulty={setBotDifficulty}
        lowPerfMode={lowPerfMode}
        onToggleLowPerfMode={() => setLowPerfMode(!lowPerfMode)}
      />
    </div>
  );
}
