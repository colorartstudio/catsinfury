import React, { useState, useEffect, useRef } from 'react';
import {
  ActionType,
  ArenaDefinition,
  BotDifficulty,
  CatCombatant,
  CombatLogEntry,
  ElementType,
  RouletteSector,
  TeamSynergy,
} from '../types';
import { CatRenderer, StrikeMotion } from '../characters/CatRenderer';
import { ParticleCanvas } from '../effects/ParticleCanvas';
import { ParticleManager } from '../effects/ParticleManager';
import { AudioManager } from '../audio/AudioManager';
import { BattleEngine } from '../combat/BattleEngine';
import { RouletteWheel } from './RouletteWheel';
import { InitiativeModal } from './InitiativeModal';
import { CombatLog } from './CombatLog';
import { VictoryModal } from './VictoryModal';
import { getElementRelation } from '../data/characters';
import {
  Swords,
  Sparkles,
  Heart,
  Shield,
  Target,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Zap,
  SkipForward,
} from 'lucide-react';

interface BattleScreenProps {
  arena: ArenaDefinition;
  playerTeam: CatCombatant[];
  botTeam: CatCombatant[];
  playerSynergy: TeamSynergy;
  botSynergy: TeamSynergy;
  botDifficulty: BotDifficulty;
  onExitBattle: (isVictory: boolean, xpEarned: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const MAX_HEALS_PER_MATCH = 3;
const MAX_SHIELDS_PER_MATCH = 1;

export const BattleScreen: React.FC<BattleScreenProps> = ({
  arena,
  playerTeam: initialPlayerTeam,
  botTeam: initialBotTeam,
  playerSynergy,
  botSynergy,
  botDifficulty,
  onExitBattle,
  isMuted,
  onToggleMute,
}) => {
  // Combatants
  const [playerCats, setPlayerCats] = useState<CatCombatant[]>(initialPlayerTeam);
  const [botCats, setBotCats] = useState<CatCombatant[]>(initialBotTeam);

  // Round & phase management
  const [round, setRound] = useState<number>(1);
  const [phase, setPhase] = useState<'ROULETTE' | 'INITIATIVE' | 'PLAYER_TURN' | 'BOT_TURN' | 'ROUND_RESOLVE' | 'GAME_OVER'>('ROULETTE');

  // Tracking which cats have taken their action in the CURRENT round
  const [playerCatsActed, setPlayerCatsActed] = useState<string[]>([]);
  const [botCatsActed, setBotCatsActed] = useState<string[]>([]);

  // Item usage limits (Cura: max 3 per battle, Escudo: max 1 per battle)
  const [playerHealsLeft, setPlayerHealsLeft] = useState<number>(MAX_HEALS_PER_MATCH);
  const [playerShieldsLeft, setPlayerShieldsLeft] = useState<number>(MAX_SHIELDS_PER_MATCH);
  const [botHealsLeft, setBotHealsLeft] = useState<number>(MAX_HEALS_PER_MATCH);
  const [botShieldsLeft, setBotShieldsLeft] = useState<number>(MAX_SHIELDS_PER_MATCH);

  // Per-round heal restriction (max 1 heal per round per team)
  const [playerUsedHealThisRound, setPlayerUsedHealThisRound] = useState<boolean>(false);
  const [botUsedHealThisRound, setBotUsedHealThisRound] = useState<boolean>(false);

  const [activeSector, setActiveSector] = useState<RouletteSector | null>(null);
  const [showRoulette, setShowRoulette] = useState<boolean>(true);
  const [showInitiative, setShowInitiative] = useState<boolean>(false);

  // Selection state
  const [selectedAttackerId, setSelectedAttackerId] = useState<string>(initialPlayerTeam[0]?.instanceId || '');
  const [selectedBotTargetId, setSelectedBotTargetId] = useState<string>(initialBotTeam[0]?.instanceId || '');
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Combat Log & drawer
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [showMobileLogDrawer, setShowMobileLogDrawer] = useState<boolean>(false);

  // Match outcome
  const [matchResult, setMatchResult] = useState<'victory' | 'defeat' | null>(null);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  const arenaContainerRef = useRef<HTMLDivElement>(null);
  const catAnchors = useRef<Record<string, HTMLDivElement | null>>({});
  const strikeToken = useRef(0);
  const [strike, setStrike] = useState<(StrikeMotion & { attackerId: string; token: number }) | null>(null);

  // Auto-manage selected attacker: Must be ALIVE and preferably HAS NOT ACTED YET this round
  useEffect(() => {
    const currentAttacker = playerCats.find((c) => c.instanceId === selectedAttackerId);
    if (!currentAttacker || !currentAttacker.isAlive || playerCatsActed.includes(selectedAttackerId)) {
      // Find first living cat that hasn't acted yet
      const nextPending = playerCats.find((c) => c.isAlive && !playerCatsActed.includes(c.instanceId));
      if (nextPending) {
        setSelectedAttackerId(nextPending.instanceId);
      } else {
        // Fallback to any living cat
        const anyLiving = playerCats.find((c) => c.isAlive);
        if (anyLiving) {
          setSelectedAttackerId(anyLiving.instanceId);
        }
      }
    }
  }, [playerCats, playerCatsActed, selectedAttackerId]);

  // Auto-manage selected enemy target: MUST BE ALIVE
  useEffect(() => {
    const currentTarget = botCats.find((c) => c.instanceId === selectedBotTargetId);
    if (!currentTarget || !currentTarget.isAlive) {
      const firstLivingBot = botCats.find((c) => c.isAlive);
      if (firstLivingBot) {
        setSelectedBotTargetId(firstLivingBot.instanceId);
      }
    }
  }, [botCats, selectedBotTargetId]);

  // Add a combat log entry
  const addLog = (message: string, type: CombatLogEntry['type'] = 'system', element?: ElementType) => {
    const newEntry: CombatLogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      round,
      timestamp: Date.now(),
      message,
      type,
      element,
    };
    setLogs((prev) => [...prev, newEntry]);
  };

  // MATCH END HANDLER - Triggers victory/defeat animated modal & sound
  const handleMatchEnd = (isVictory: boolean) => {
    setPhase('GAME_OVER');
    setIsExecutingAction(false);
    const xp = BattleEngine.calculateMatchXp(round, isVictory, playerSynergy);
    setEarnedXp(xp);
    setMatchResult(isVictory ? 'victory' : 'defeat');
    addLog(
      isVictory
        ? '🏆 VITÓRIA GLORIOSA! Todos os oponentes foram derrotados na arena!'
        : '💀 DERROTA! Toda a sua equipe de gatos caiu em combate.',
      isVictory ? 'crit' : 'system'
    );
  };

  // CHECK MATCH END HELPER (Can be called with latest array snapshots)
  const checkMatchEnd = (players: CatCombatant[] = playerCats, bots: CatCombatant[] = botCats): boolean => {
    if (players.length === 0 || bots.length === 0) return false;

    const anyPlayerAlive = players.some((c) => c.isAlive && c.currentHp > 0);
    const anyBotAlive = bots.some((c) => c.isAlive && c.currentHp > 0);

    if (!anyBotAlive) {
      handleMatchEnd(true);
      return true;
    }
    if (!anyPlayerAlive) {
      handleMatchEnd(false);
      return true;
    }
    return false;
  };

  // Guaranteed reactive listener: As soon as botCats or playerCats has 0 survivors, trigger match end!
  useEffect(() => {
    if (phase === 'GAME_OVER' || matchResult) return;
    const livingBots = botCats.filter((c) => c.isAlive && c.currentHp > 0);
    const livingPlayers = playerCats.filter((c) => c.isAlive && c.currentHp > 0);

    if (botCats.length > 0 && livingBots.length === 0) {
      handleMatchEnd(true);
    } else if (playerCats.length > 0 && livingPlayers.length === 0) {
      handleMatchEnd(false);
    }
  }, [botCats, playerCats, phase, matchResult, round, playerSynergy]);

  // 1. ROULETTE COMPLETION
  const handleRouletteComplete = (sector: RouletteSector) => {
    setActiveSector(sector);
    setShowRoulette(false);
    addLog(`🎡 Roleta da Arena: [${sector.name}] - ${sector.description}`, 'system');

    if (sector.effectType === 'BLESSING') {
      AudioManager.playHeal();
      setPlayerCats((prev) =>
        prev.map((c) => {
          if (!c.isAlive) return c;
          const heal = Math.round(c.maxHp * 0.15);
          return { ...c, currentHp: Math.min(c.maxHp, c.currentHp + heal) };
        })
      );
      setBotCats((prev) =>
        prev.map((c) => {
          if (!c.isAlive) return c;
          const heal = Math.round(c.maxHp * 0.15);
          return { ...c, currentHp: Math.min(c.maxHp, c.currentHp + heal) };
        })
      );
      addLog('✨ Bênção Celestial curou 15% de HP de todos os sobreviventes!', 'heal');
    }

    setShowInitiative(true);
    setPhase('INITIATIVE');
  };

  // 2. INITIATIVE RESOLUTION
  const handleInitiativeSubmitted = (playerBid: number, botBid: number) => {
    setShowInitiative(false);

    const livingPlayers = playerCats.filter((c) => c.isAlive);
    const livingBots = botCats.filter((c) => c.isAlive);
    const playerAvgSpeed = livingPlayers.length
      ? livingPlayers.reduce((acc, c) => acc + c.speed, 0) / livingPlayers.length
      : 0;
    const botAvgSpeed = livingBots.length
      ? livingBots.reduce((acc, c) => acc + c.speed, 0) / livingBots.length
      : 0;

    let playerTotal = playerBid * 10 + playerAvgSpeed;
    let botTotal = botBid * 10 + botAvgSpeed;

    const isChaos = activeSector?.effectType === 'CHAOS';
    let playerGoesFirst = isChaos ? playerTotal <= botTotal : playerTotal >= botTotal;

    // Reset acted cats for the new round
    setPlayerCatsActed([]);
    setBotCatsActed([]);
    setPlayerUsedHealThisRound(false);
    setBotUsedHealThisRound(false);

    if (playerGoesFirst) {
      setPhase('PLAYER_TURN');
      setIsExecutingAction(false);
      addLog('⚔️ Sua equipe ataca primeiro! Escolha o gato que vai atacar e o alvo.', 'system');
    } else {
      setPhase('BOT_TURN');
      setIsExecutingAction(true);
      addLog('🛡️ O adversário foi mais veloz e abre os ataques da rodada!', 'system');
      executeBotTurnAction([], []);
    }
  };

  // Coordinates helper for particles
  const getCatCoords = (teamId: 'player' | 'bot', slotIndex: number) => {
    if (!arenaContainerRef.current) return { x: 200, y: 200 };
    const rect = arenaContainerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const baseX = teamId === 'player' ? width * 0.25 : width * 0.75;
    const stepY = height / 4;
    return { x: baseX, y: stepY * (slotIndex + 1) };
  };

  // Distance from the attacker sprite to the marked target, in every viewport.
  const measureStrikeOffset = (attackerId: string, defenderId: string) => {
    const from = catAnchors.current[attackerId];
    const to = catAnchors.current[defenderId];
    if (!from || !to) return { dx: 0, dy: 0 };
    const attackerBox = from.getBoundingClientRect();
    const targetBox = to.getBoundingClientRect();
    const dx = targetBox.left + targetBox.width / 2 - (attackerBox.left + attackerBox.width / 2);
    const dy = targetBox.top + targetBox.height / 2 - (attackerBox.top + attackerBox.height / 2);
    // Stop just short of the target center so the paw lands on the cat.
    return { dx: dx * 0.78, dy: dy * 0.78 };
  };

  const launchStrike = (attackerId: string, defenderId: string) => {
    const offset = measureStrikeOffset(attackerId, defenderId);
    const token = strikeToken.current + 1;
    strikeToken.current = token;
    setStrike({
      attackerId,
      token,
      dx: offset.dx,
      dy: offset.dy,
      phase: 'go',
      showPaw: false,
    });
    return token;
  };

  const flashPaw = (token: number) => {
    setStrike((current) =>
      current && current.token === token ? { ...current, showPaw: true } : current
    );
  };

  const returnStrike = (token: number) => {
    setStrike((current) =>
      current && current.token === token ? { ...current, phase: 'back', showPaw: false } : current
    );
    window.setTimeout(() => {
      setStrike((current) => (current && current.token === token ? null : current));
    }, 360);
  };

  // 3. EXECUTE ACTION (PLAYER)
  const handlePlayerAction = (action: ActionType) => {
    if (isExecutingAction || phase !== 'PLAYER_TURN') return;

    // Ensure we have a valid alive attacker that hasn't acted yet
    let attacker = playerCats.find((c) => c.instanceId === selectedAttackerId && c.isAlive);
    if (!attacker) {
      attacker = playerCats.find((c) => c.isAlive && !playerCatsActed.includes(c.instanceId)) || playerCats.find((c) => c.isAlive);
      if (attacker) setSelectedAttackerId(attacker.instanceId);
    }
    if (!attacker) return;

    if (playerCatsActed.includes(attacker.instanceId)) {
      addLog(`⚠️ ${attacker.baseStats.name} já agiu nesta rodada! Selecione outro sobrevivente.`, 'system');
      return;
    }

    if (attacker.shieldRounds > 0 && (action === 'ATTACK' || action === 'SPECIAL')) {
      AudioManager.playShieldAbsorb();
      addLog(`⚠️ ${attacker.baseStats.name} está sob escudo protetor e não pode atacar!`, 'system');
      return;
    }

    if (action === 'SPECIAL' && attacker.specialCooldown > 0) {
      AudioManager.playSelect();
      addLog(`⏳ Especial em recarga (${attacker.specialCooldown}R restantes)!`, 'system');
      return;
    }

    // Limit check for HEAL: max 3 per match
    if (action === 'HEAL') {
      if (playerHealsLeft <= 0) {
        AudioManager.playSelect();
        addLog('⚠️ Limite de 3 Curas por batalha atingido (0/3 restantes)!', 'system');
        return;
      }
      if (playerUsedHealThisRound) {
        AudioManager.playSelect();
        addLog('⚠️ Cura já foi utilizada nesta rodada (máximo 1 uso por rodada)!', 'system');
        return;
      }
    }

    // Limit check for SHIELD: max 1 per match
    if (action === 'SHIELD') {
      if (playerShieldsLeft <= 0) {
        AudioManager.playSelect();
        addLog('⚠️ Limite de 1 Escudo por batalha atingido (0/1 restante)!', 'system');
        return;
      }
      if (attacker.shieldRounds > 0) {
        AudioManager.playSelect();
        addLog(`⚠️ ${attacker.baseStats.name} já está protegido por escudo!`, 'system');
        return;
      }
    }

    setIsExecutingAction(true);

    if (action === 'SHIELD') {
      executePlayerShield(attacker);
      return;
    }

    if (action === 'HEAL') {
      executePlayerHeal(attacker);
      return;
    }

    // Offensive Attack / Special
    executePlayerOffensive(attacker, action);
  };

  // Player Offensive Action
  const executePlayerOffensive = (attacker: CatCombatant, action: ActionType) => {
    // Check Taunt on living enemies
    let targetId = selectedBotTargetId;
    const tauntingEnemy = botCats.find((b) => b.isTaunting && b.isAlive);
    if (tauntingEnemy && attacker.baseStats.id !== 'wind') {
      targetId = tauntingEnemy.instanceId;
      addLog(`🪨 Provocação de ${tauntingEnemy.baseStats.name} atraiu o golpe!`, 'taunt');
    }

    let defender = botCats.find((b) => b.instanceId === targetId && b.isAlive);
    if (!defender) {
      defender = botCats.find((b) => b.isAlive);
      if (defender) setSelectedBotTargetId(defender.instanceId);
    }

    if (!defender || !defender.isAlive) {
      setIsExecutingAction(false);
      return;
    }

    // Leave the slot and run to the marked target (basic attack and special, any screen size)
    const strikeTokenId = launchStrike(attacker.instanceId, defender.instanceId);
    setPlayerCats((prev) =>
      prev.map((c) => (c.instanceId === attacker.instanceId ? { ...c, animState: 'attacking' } : c))
    );

    if (action === 'SPECIAL') {
      AudioManager.playSpecial(attacker.baseStats.element);
    } else {
      AudioManager.playAttack(attacker.baseStats.element);
    }

    const defenderCoords = getCatCoords('bot', defender.slotIndex);

    const result = BattleEngine.calculateDamage(
      attacker,
      defender,
      action,
      arena,
      playerSynergy,
      botSynergy,
      activeSector,
      [...playerCats, ...botCats]
    );

    setTimeout(() => {
      flashPaw(strikeTokenId);
      // Particles & Devastating Effects
      if (result.isDesperation) {
        AudioManager.playDesperation();
        ParticleManager.createDesperationEffect(
          attacker.baseStats.id,
          attacker.baseStats.element,
          defenderCoords.x,
          defenderCoords.y
        );
        ParticleManager.addFloatingText(
          defenderCoords.x,
          defenderCoords.y - 15,
          `⚡ ${attacker.baseStats.desperationName.toUpperCase()}! 2X DANO (-${result.finalDamage})`,
          'desperation'
        );
      } else {
        switch (attacker.baseStats.element) {
          case 'FOGO':
            ParticleManager.createFireEffect(defenderCoords.x, defenderCoords.y, action === 'SPECIAL');
            break;
          case 'ÁGUA':
            ParticleManager.createWaterEffect(defenderCoords.x, defenderCoords.y, action === 'SPECIAL');
            break;
          case 'VENTO':
            ParticleManager.createWindEffect(defenderCoords.x, defenderCoords.y, action === 'SPECIAL');
            break;
          case 'TERRA':
            ParticleManager.createEarthEffect(defenderCoords.x, defenderCoords.y, action === 'SPECIAL');
            break;
        }

        if (result.isDodged) {
          AudioManager.playDodge();
          ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, 'ESQUIVOU!', 'dodge');
        } else if (result.isShieldBlocked) {
          AudioManager.playShieldAbsorb();
          ParticleManager.createShieldEffect(defenderCoords.x, defenderCoords.y);
          ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, `-${result.finalDamage}`, 'shield');
        } else if (result.isCrit) {
          AudioManager.playCritical();
          ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, `CRÍTICO! -${result.finalDamage}`, 'crit');
        } else {
          AudioManager.playHit();
          ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, `-${result.finalDamage}`, 'damage');
        }
      }

      // Apply damage to defender (compute snapshot first — never rely on setState updater side-effects)
      const updatedBotCats: CatCombatant[] = botCats.map((c) => {
        if (c.instanceId !== defender!.instanceId) return c;
        const newHp = Math.max(0, c.currentHp - result.finalDamage);
        const isFainted = newHp <= 0;
        return {
          ...c,
          currentHp: newHp,
          isAlive: !isFainted,
          animState: isFainted ? 'fainted' : result.isDodged ? 'dodging' : 'hurt',
        };
      });

      // Burn on fire attacks (applied onto the same snapshot)
      let botsAfterEffects = updatedBotCats;
      if (attacker.baseStats.id === 'fire') {
        const burnPower = action === 'SPECIAL' ? 0.10 : 0.05;
        botsAfterEffects = updatedBotCats.map((c) => {
          if (c.instanceId !== defender!.instanceId || !c.isAlive) return c;
          return { ...c, burnRounds: 2, burnPower };
        });
        addLog(`🔥 ${defender.baseStats.name} está em chamas (Burn 2R)!`, 'burn');
      }
      setBotCats(botsAfterEffects);

      const actionName = action === 'SPECIAL' ? attacker.baseStats.specialName : 'Ataque';
      if (result.isDesperation) {
        addLog(
          `⚡ [PODER DESTRUTIVO 2X] ${attacker.baseStats.name} desferiu [${attacker.baseStats.desperationName}] com o DOBRO DE DANO em ${defender.baseStats.name}: ${result.finalDamage} de dano fulminante!`,
          'desperation',
          attacker.baseStats.element
        );
      } else {
        addLog(
          `💥 ${attacker.baseStats.name} usou [${actionName}] em ${defender.baseStats.name}: ${result.finalDamage} de dano!`,
          result.isCrit ? 'crit' : 'damage',
          attacker.baseStats.element
        );
      }

      // Cooldown update, Taunt for Earth Cat, and mark Desperation as consumed
      setPlayerCats((prev) =>
        prev.map((c) => {
          if (c.instanceId !== attacker.instanceId) return c;
          let newCd = c.specialCooldown;
          let isTaunting = c.isTaunting;
          if (action === 'SPECIAL') {
            newCd = c.baseStats.specialCooldownMax;
            if (c.baseStats.id === 'earth') {
              isTaunting = true;
              addLog(`🪨 ${c.baseStats.name} ativou Provocação!`, 'taunt');
            }
          }
          const hasTriggeredDesperation = c.hasTriggeredDesperation || Boolean(result.isDesperation);
          return { ...c, specialCooldown: newCd, isTaunting, hasTriggeredDesperation };
        })
      );

      // End match only when EVERY enemy combatant is down (and team is non-empty)
      const anyBotStillAlive = botsAfterEffects.some((c) => c.isAlive && c.currentHp > 0);
      if (botsAfterEffects.length > 0 && !anyBotStillAlive) {
        returnStrike(strikeTokenId);
        setTimeout(() => {
          handleMatchEnd(true);
        }, 450);
        return;
      }

      // Run back home, then advance sequence
      setTimeout(() => {
        returnStrike(strikeTokenId);
        setPlayerCats((prev) =>
          prev.map((c) => (c.animState !== 'fainted' ? { ...c, animState: 'idle' } : c))
        );
        setBotCats((prev) =>
          prev.map((c) => (c.animState !== 'fainted' ? { ...c, animState: 'idle' } : c))
        );

        const nextPlayerActed = [...playerCatsActed, attacker.instanceId];
        setPlayerCatsActed(nextPlayerActed);

        advanceTurnSequence('player', nextPlayerActed, botCatsActed, botsAfterEffects);
      }, 460);
    }, 300);
  };

  // Player Heal Action (Consumes 1 of 3 uses)
  const executePlayerHeal = (attacker: CatCombatant) => {
    AudioManager.playHeal();
    const healAmt = BattleEngine.calculateHeal(attacker, attacker, arena, activeSector, attacker.baseStats.id === 'water');
    const coords = getCatCoords('player', attacker.slotIndex);

    ParticleManager.createHealEffect(coords.x, coords.y);
    ParticleManager.addFloatingText(coords.x, coords.y, `+${healAmt} HP`, 'heal');

    setPlayerCats((prev) =>
      prev.map((c) => {
        if (c.instanceId === attacker.instanceId) {
          return {
            ...c,
            currentHp: Math.min(c.maxHp, c.currentHp + healAmt),
            animState: 'casting',
          };
        }
        return c;
      })
    );

    const remainingHeals = Math.max(0, playerHealsLeft - 1);
    setPlayerHealsLeft(remainingHeals);
    setPlayerUsedHealThisRound(true);

    addLog(
      `💧 ${attacker.baseStats.name} curou a si mesmo em +${healAmt} HP! (${remainingHeals}/${MAX_HEALS_PER_MATCH} curas restantes)`,
      'heal'
    );

    setTimeout(() => {
      setPlayerCats((prev) =>
        prev.map((c) => (c.animState !== 'fainted' ? { ...c, animState: 'idle' } : c))
      );
      const nextPlayerActed = [...playerCatsActed, attacker.instanceId];
      setPlayerCatsActed(nextPlayerActed);
      advanceTurnSequence('player', nextPlayerActed, botCatsActed, botCats);
    }, 400);
  };

  // Player Shield Action (Consumes 1 of 1 use)
  const executePlayerShield = (attacker: CatCombatant) => {
    AudioManager.playShield();
    const coords = getCatCoords('player', attacker.slotIndex);
    ParticleManager.createShieldEffect(coords.x, coords.y, attacker.baseStats.id === 'earth');
    ParticleManager.addFloatingText(coords.x, coords.y, 'ESCUDO (3R)', 'shield');

    setPlayerCats((prev) =>
      prev.map((c) => (c.instanceId === attacker.instanceId ? { ...c, shieldRounds: 3 } : c))
    );

    const remainingShields = Math.max(0, playerShieldsLeft - 1);
    setPlayerShieldsLeft(remainingShields);

    addLog(
      `🛡️ ${attacker.baseStats.name} ativou Escudo por 3 rodadas! (${remainingShields}/${MAX_SHIELDS_PER_MATCH} escudo restante)`,
      'shield'
    );

    setTimeout(() => {
      const nextPlayerActed = [...playerCatsActed, attacker.instanceId];
      setPlayerCatsActed(nextPlayerActed);
      advanceTurnSequence('player', nextPlayerActed, botCatsActed, botCats);
    }, 400);
  };

  // Skip the turn while the last acting cat is locked behind a shield.
  const passShieldedTurn = () => {
    if (isExecutingAction || phase !== 'PLAYER_TURN') return;
    const attacker =
      playerCats.find((c) => c.instanceId === selectedAttackerId && c.isAlive && c.shieldRounds > 0) ||
      playerCats.find((c) => c.isAlive && c.shieldRounds > 0 && !playerCatsActed.includes(c.instanceId));
    if (!attacker || playerCatsActed.includes(attacker.instanceId)) return;

    setIsExecutingAction(true);
    AudioManager.playClick();
    addLog(`🛡️ ${attacker.baseStats.name} mantém o escudo e passa a vez.`, 'shield');
    setTimeout(() => {
      const nextPlayerActed = [...playerCatsActed, attacker.instanceId];
      setPlayerCatsActed(nextPlayerActed);
      advanceTurnSequence('player', nextPlayerActed, botCatsActed, botCats);
    }, 280);
  };

  // 4. BOT TURN EXECUTION (Executes 1 bot cat action, then hands turn back)
  const executeBotTurnAction = (curPlayerActed = playerCatsActed, curBotActed = botCatsActed) => {
    // Check victory/defeat
    const livingBots = botCats.filter((b) => b.isAlive && b.currentHp > 0);
    const livingPlayers = playerCats.filter((p) => p.isAlive && p.currentHp > 0);
    if (livingBots.length === 0 || livingPlayers.length === 0) {
      checkMatchEnd();
      return;
    }

    // Pick a living bot cat that hasn't acted yet
    const pendingBots = livingBots.filter((b) => !curBotActed.includes(b.instanceId));
    if (pendingBots.length === 0) {
      advanceTurnSequence('bot', curPlayerActed, curBotActed, botCats);
      return;
    }

    const botAttacker = pendingBots[Math.floor(Math.random() * pendingBots.length)];

    setTimeout(() => {
      let decision = BattleEngine.chooseBotAction(
        botAttacker,
        botCats,
        playerCats,
        botDifficulty,
        botUsedHealThisRound || botHealsLeft <= 0
      );

      // Validate bot limits
      const firstLivingPlayer = playerCats.find((p) => p.isAlive && p.currentHp > 0);
      if (decision.action === 'HEAL' && botHealsLeft <= 0) {
        decision = { action: 'ATTACK', targetId: firstLivingPlayer ? firstLivingPlayer.instanceId : selectedAttackerId };
      }
      if (decision.action === 'SHIELD' && botShieldsLeft <= 0) {
        decision = { action: 'ATTACK', targetId: firstLivingPlayer ? firstLivingPlayer.instanceId : selectedAttackerId };
      }

      if (decision.action === 'HEAL') {
        const ally = botCats.find((b) => b.instanceId === decision.targetId && b.isAlive) || botAttacker;
        AudioManager.playHeal();
        const healAmt = BattleEngine.calculateHeal(botAttacker, ally, arena, activeSector);
        const coords = getCatCoords('bot', ally.slotIndex);

        ParticleManager.createHealEffect(coords.x, coords.y);
        ParticleManager.addFloatingText(coords.x, coords.y, `+${healAmt} HP`, 'heal');

        setBotCats((prev) =>
          prev.map((b) =>
            b.instanceId === ally.instanceId
              ? { ...b, currentHp: Math.min(b.maxHp, b.currentHp + healAmt) }
              : b
          )
        );
        setBotHealsLeft((prev) => Math.max(0, prev - 1));
        setBotUsedHealThisRound(true);
        addLog(`💧 [Inimigo] ${botAttacker.baseStats.name} curou ${ally.baseStats.name} em +${healAmt} HP!`, 'heal');

        setTimeout(() => {
          const nextBotActed = [...curBotActed, botAttacker.instanceId];
          setBotCatsActed(nextBotActed);
          advanceTurnSequence('bot', curPlayerActed, nextBotActed, botCats);
        }, 450);
        return;
      }

      if (decision.action === 'SHIELD') {
        AudioManager.playShield();
        const coords = getCatCoords('bot', botAttacker.slotIndex);
        ParticleManager.createShieldEffect(coords.x, coords.y, botAttacker.baseStats.id === 'earth');
        ParticleManager.addFloatingText(coords.x, coords.y, 'ESCUDO (3R)', 'shield');

        setBotCats((prev) =>
          prev.map((b) => (b.instanceId === botAttacker.instanceId ? { ...b, shieldRounds: 3 } : b))
        );
        setBotShieldsLeft((prev) => Math.max(0, prev - 1));
        addLog(`🛡️ [Inimigo] ${botAttacker.baseStats.name} ativou Escudo!`, 'shield');

        setTimeout(() => {
          const nextBotActed = [...curBotActed, botAttacker.instanceId];
          setBotCatsActed(nextBotActed);
          advanceTurnSequence('bot', curPlayerActed, nextBotActed, botCats);
        }, 450);
        return;
      }

      // A shielded bot cannot strike; it holds the barrier and passes, same as the player.
      if (botAttacker.shieldRounds > 0 && (decision.action === 'ATTACK' || decision.action === 'SPECIAL')) {
        addLog(`🛡️ [Inimigo] ${botAttacker.baseStats.name} mantém o escudo e passa a vez.`, 'shield');
        setTimeout(() => {
          const nextBotActed = [...curBotActed, botAttacker.instanceId];
          setBotCatsActed(nextBotActed);
          advanceTurnSequence('bot', curPlayerActed, nextBotActed, botCats);
        }, 350);
        return;
      }

      // Offensive Attack / Special from Bot
      const defender =
        playerCats.find((p) => p.instanceId === decision.targetId && p.isAlive && p.currentHp > 0) ||
        playerCats.find((p) => p.isAlive && p.currentHp > 0);
      if (!defender) {
        checkMatchEnd();
        return;
      }

      const botStrikeToken = launchStrike(botAttacker.instanceId, defender.instanceId);
      setBotCats((prev) =>
        prev.map((b) => (b.instanceId === botAttacker.instanceId ? { ...b, animState: 'attacking' } : b))
      );

      if (decision.action === 'SPECIAL') {
        AudioManager.playSpecial(botAttacker.baseStats.element);
      } else {
        AudioManager.playAttack(botAttacker.baseStats.element);
      }

      const defenderCoords = getCatCoords('player', defender.slotIndex);

      const result = BattleEngine.calculateDamage(
        botAttacker,
        defender,
        decision.action,
        arena,
        botSynergy,
        playerSynergy,
        activeSector,
        [...playerCats, ...botCats]
      );

      setTimeout(() => {
        flashPaw(botStrikeToken);
        if (result.isDesperation) {
          AudioManager.playDesperation();
          ParticleManager.createDesperationEffect(
            botAttacker.baseStats.id,
            botAttacker.baseStats.element,
            defenderCoords.x,
            defenderCoords.y
          );
          ParticleManager.addFloatingText(
            defenderCoords.x,
            defenderCoords.y - 15,
            `⚡ ${botAttacker.baseStats.desperationName.toUpperCase()}! 2X DANO (-${result.finalDamage})`,
            'desperation'
          );
        } else {
          switch (botAttacker.baseStats.element) {
            case 'FOGO':
              ParticleManager.createFireEffect(defenderCoords.x, defenderCoords.y, decision.action === 'SPECIAL');
              break;
            case 'ÁGUA':
              ParticleManager.createWaterEffect(defenderCoords.x, defenderCoords.y, decision.action === 'SPECIAL');
              break;
            case 'VENTO':
              ParticleManager.createWindEffect(defenderCoords.x, defenderCoords.y, decision.action === 'SPECIAL');
              break;
            case 'TERRA':
              ParticleManager.createEarthEffect(defenderCoords.x, defenderCoords.y, decision.action === 'SPECIAL');
              break;
          }

          if (result.isDodged) {
            AudioManager.playDodge();
            ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, 'ESQUIVOU!', 'dodge');
          } else if (result.isShieldBlocked) {
            AudioManager.playShieldAbsorb();
            ParticleManager.createShieldEffect(defenderCoords.x, defenderCoords.y);
            ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, `-${result.finalDamage}`, 'shield');
          } else if (result.isCrit) {
            AudioManager.playCritical();
            ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, `CRÍTICO! -${result.finalDamage}`, 'crit');
          } else {
            AudioManager.playHit();
            ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y, `-${result.finalDamage}`, 'damage');
          }
        }

        // Apply damage to player defender (compute snapshot first — never rely on setState updater side-effects)
        const updatedPlayerCats: CatCombatant[] = playerCats.map((c) => {
          if (c.instanceId !== defender.instanceId) return c;
          const newHp = Math.max(0, c.currentHp - result.finalDamage);
          const isFainted = newHp <= 0;

          let autoHealed = false;
          let finalHp = newHp;
          if (!c.hasTriggeredWaterPassive && c.baseStats.id === 'water' && !isFainted && newHp / c.maxHp <= 0.5) {
            const passiveHeal = Math.round(c.maxHp * 0.10);
            finalHp = Math.min(c.maxHp, newHp + passiveHeal);
            autoHealed = true;
            ParticleManager.addFloatingText(defenderCoords.x, defenderCoords.y - 25, `+${passiveHeal} PASSIVA!`, 'heal');
            addLog(`💧 ${c.baseStats.name} ativou Fonte da Vida (+10% HP)!`, 'heal');
          }

          return {
            ...c,
            currentHp: finalHp,
            isAlive: !isFainted,
            hasTriggeredWaterPassive: c.hasTriggeredWaterPassive || autoHealed,
            animState: isFainted ? 'fainted' : result.isDodged ? 'dodging' : 'hurt',
          };
        });
        setPlayerCats(updatedPlayerCats);

        if (result.isDesperation) {
          addLog(
            `⚡ [PODER DESTRUTIVO 2X] [Inimigo] ${botAttacker.baseStats.name} desencadeou [${botAttacker.baseStats.desperationName}] com o DOBRO DE DANO em ${defender.baseStats.name}: ${result.finalDamage} de dano!`,
            'desperation',
            botAttacker.baseStats.element
          );
        } else {
          addLog(
            `⚔️ [Inimigo] ${botAttacker.baseStats.name} causou ${result.finalDamage} de dano a ${defender.baseStats.name}!`,
            result.isCrit ? 'crit' : 'damage',
            botAttacker.baseStats.element
          );
        }

        // Mark bot's desperation as used if it triggered
        if (result.isDesperation) {
          setBotCats((prev) =>
            prev.map((b) =>
              b.instanceId === botAttacker.instanceId ? { ...b, hasTriggeredDesperation: true } : b
            )
          );
        }

        // End match only when EVERY player combatant is down (and team is non-empty)
        const anyPlayerStillAlive = updatedPlayerCats.some((c) => c.isAlive && c.currentHp > 0);
        if (updatedPlayerCats.length > 0 && !anyPlayerStillAlive) {
          returnStrike(botStrikeToken);
          setTimeout(() => {
            handleMatchEnd(false);
          }, 450);
          return;
        }

        setTimeout(() => {
          returnStrike(botStrikeToken);
          setBotCats((prev) =>
            prev.map((b) => (b.animState !== 'fainted' ? { ...b, animState: 'idle' } : b))
          );
          setPlayerCats((prev) =>
            prev.map((c) => (c.animState !== 'fainted' ? { ...c, animState: 'idle' } : c))
          );

          const nextBotActed = [...curBotActed, botAttacker.instanceId];
          setBotCatsActed(nextBotActed);
          advanceTurnSequence('bot', curPlayerActed, nextBotActed, botCats, updatedPlayerCats);
        }, 460);
      }, 300);
    }, 400);
  };

  // 5. TURN SEQUENCER: 1 ESCOLHE E ATACA, DEPOIS É O ADVERSÁRIO (UNTIL ALL SURVIVORS ACT)
  const advanceTurnSequence = (
    lastActor: 'player' | 'bot',
    curPlayerActed: string[],
    curBotActed: string[],
    currentBots: CatCombatant[] = botCats,
    currentPlayers: CatCombatant[] = playerCats
  ) => {
    if (checkMatchEnd(currentPlayers, currentBots)) return;

    const livingPlayers = currentPlayers.filter((p) => p.isAlive && p.currentHp > 0);
    const livingBots = currentBots.filter((b) => b.isAlive && b.currentHp > 0);

    const pendingPlayerCats = livingPlayers.filter((p) => !curPlayerActed.includes(p.instanceId));
    const pendingBotCats = livingBots.filter((b) => !curBotActed.includes(b.instanceId));

    // If both teams have used all their surviving cats -> End of round!
    if (pendingPlayerCats.length === 0 && pendingBotCats.length === 0) {
      setIsExecutingAction(false);
      resolveEndOfRound();
      return;
    }

    if (lastActor === 'player') {
      // Player just acted. Can bot act now?
      if (pendingBotCats.length > 0) {
        setPhase('BOT_TURN');
        setIsExecutingAction(true);
        executeBotTurnAction(curPlayerActed, curBotActed);
      } else {
        // Bot has no remaining cats, but player still has survivors to act!
        setPhase('PLAYER_TURN');
        setIsExecutingAction(false);
        const nextAttacker = pendingPlayerCats[0];
        if (nextAttacker) setSelectedAttackerId(nextAttacker.instanceId);
        addLog(`⚔️ Sua vez novamente! Escolha o próximo gato (${pendingPlayerCats.length} restante) e o alvo.`, 'system');
      }
    } else {
      // Bot just acted. Can player act now?
      if (pendingPlayerCats.length > 0) {
        setPhase('PLAYER_TURN');
        setIsExecutingAction(false);
        const nextAttacker = pendingPlayerCats[0];
        if (nextAttacker) setSelectedAttackerId(nextAttacker.instanceId);
        addLog(`👉 Sua vez! Selecione qual gato vai atacar (${pendingPlayerCats.length} disponível) e o alvo!`, 'system');
      } else {
        // Player has no more cats to act, but bot still has survivors to act!
        setPhase('BOT_TURN');
        setIsExecutingAction(true);
        executeBotTurnAction(curPlayerActed, curBotActed);
      }
    }
  };

  // 6. END OF ROUND RESOLUTION
  const resolveEndOfRound = () => {
    setPhase('ROUND_RESOLVE');
    addLog(`--- Fim da Rodada ${round} ---`, 'system');

    // 1. Process Burns on survivors
    setPlayerCats((prev) =>
      prev.map((c) => {
        if (!c.isAlive || c.burnRounds <= 0) return c;
        const burnDmg = Math.round(c.maxHp * c.burnPower);
        const newHp = Math.max(0, c.currentHp - burnDmg);
        const coords = getCatCoords('player', c.slotIndex);
        ParticleManager.createFireEffect(coords.x, coords.y);
        ParticleManager.addFloatingText(coords.x, coords.y, `BURN -${burnDmg}`, 'burn');
        addLog(`🔥 ${c.baseStats.name} sofreu ${burnDmg} por Queimadura!`, 'burn');

        return {
          ...c,
          currentHp: newHp,
          isAlive: newHp > 0,
          burnRounds: c.burnRounds - 1,
        };
      })
    );

    setBotCats((prev) =>
      prev.map((c) => {
        if (!c.isAlive || c.burnRounds <= 0) return c;
        const burnDmg = Math.round(c.maxHp * c.burnPower);
        const newHp = Math.max(0, c.currentHp - burnDmg);
        const coords = getCatCoords('bot', c.slotIndex);
        ParticleManager.createFireEffect(coords.x, coords.y);
        ParticleManager.addFloatingText(coords.x, coords.y, `BURN -${burnDmg}`, 'burn');
        addLog(`🔥 [Inimigo] ${c.baseStats.name} sofreu ${burnDmg} por Queimadura!`, 'burn');

        return {
          ...c,
          currentHp: newHp,
          isAlive: newHp > 0,
          burnRounds: c.burnRounds - 1,
        };
      })
    );

    // 2. Decrement Shields, Taunts & Cooldowns
    setPlayerCats((prev) =>
      prev.map((c) => ({
        ...c,
        specialCooldown: Math.max(0, c.specialCooldown - 1),
        shieldRounds: Math.max(0, c.shieldRounds - 1),
        isTaunting: false,
      }))
    );

    setBotCats((prev) =>
      prev.map((c) => ({
        ...c,
        specialCooldown: Math.max(0, c.specialCooldown - 1),
        shieldRounds: Math.max(0, c.shieldRounds - 1),
        isTaunting: false,
      }))
    );

    // Reset acted sets and per-round heal limits
    setPlayerCatsActed([]);
    setBotCatsActed([]);
    setPlayerUsedHealThisRound(false);
    setBotUsedHealThisRound(false);

    setTimeout(() => {
      // Check latest survivor states
      setPlayerCats((latestPlayers) => {
        setBotCats((latestBots) => {
          const anyPlayer = latestPlayers.some((c) => c.isAlive && c.currentHp > 0);
          const anyBot = latestBots.some((c) => c.isAlive && c.currentHp > 0);
          if (!anyBot) {
            handleMatchEnd(true);
          } else if (!anyPlayer) {
            handleMatchEnd(false);
          } else {
            const nextRound = round + 1;
            setRound(nextRound);
            setPhase('ROULETTE');
            setShowRoulette(true);
          }
          return latestBots;
        });
        return latestPlayers;
      });
    }, 1100);
  };

  // Active living combatants
  const attackerCat = playerCats.find((c) => c.instanceId === selectedAttackerId && c.isAlive) || playerCats.find((c) => c.isAlive);
  const targetEnemy = botCats.find((b) => b.instanceId === selectedBotTargetId && b.isAlive) || botCats.find((b) => b.isAlive);

  let previewAdvantage: { text: string; type: 'advantage' | 'disadvantage' | 'neutral' } | undefined = undefined;
  if (attackerCat && targetEnemy) {
    const { relation } = getElementRelation(attackerCat.baseStats.element, targetEnemy.baseStats.element);
    if (relation === 'advantage') {
      previewAdvantage = { text: '+25% VANTAGEM', type: 'advantage' };
    } else if (relation === 'disadvantage') {
      previewAdvantage = { text: '-15% DESVANTAGEM', type: 'disadvantage' };
    } else {
      previewAdvantage = { text: 'NEUTRO', type: 'neutral' };
    }
  }

  const isAttackerAvailable = attackerCat && attackerCat.isAlive && !playerCatsActed.includes(attackerCat.instanceId);
  const isPlayerTurnNow = phase === 'PLAYER_TURN' && !isExecutingAction && !!isAttackerAvailable;
  const pendingPlayerCats = playerCats.filter((c) => c.isAlive && !playerCatsActed.includes(c.instanceId));
  const canPassTurn =
    isPlayerTurnNow && pendingPlayerCats.length > 0 && pendingPlayerCats.every((c) => c.shieldRounds > 0);
  const isAttackBlockedByShield = attackerCat ? attackerCat.shieldRounds > 0 : false;
  const isSpecialOnCooldown = attackerCat ? attackerCat.specialCooldown > 0 : true;
  const isDesperationReady = attackerCat
    ? attackerCat.isAlive &&
      (attackerCat.currentHp / attackerCat.maxHp <= 0.10) &&
      !attackerCat.hasTriggeredDesperation
    : false;

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <div
      ref={arenaContainerRef}
      className={`relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none bg-gradient-to-b ${arena.bgGradient} flex flex-col justify-between p-2 sm:p-3`}
    >
      {/* 60 FPS Particle Canvas */}
      <ParticleCanvas />

      {/* TOP COMPACT HUD */}
      <header className="relative z-20 max-w-5xl w-full mx-auto flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800/80 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/20 border border-amber-400/60 px-2 py-0.5 rounded-lg text-xs font-heading font-bold text-amber-400">
            RODADA {round}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
            <span>{arena.icon}</span>
            <span className="font-semibold truncate max-w-[100px] sm:max-w-none">{arena.name}</span>
          </div>
        </div>

        {activeSector && (
          <div
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-heading font-bold animate-pulse shadow-sm"
            style={{
              backgroundColor: `${activeSector.color}25`,
              borderColor: activeSector.color,
              color: activeSector.color,
            }}
          >
            <span>{activeSector.icon}</span>
            <span>{activeSector.name}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleMute()}
            className="p-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition"
            title="Áudio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              AudioManager.playClick();
              onExitBattle(false, 0);
            }}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-[11px] font-heading font-semibold border border-slate-800 transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* BATTLEFIELD ARENA: Responsive 2-column layout (Mobile, Tablet, and Desktop identical layout) */}
      <main className="relative z-10 max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center my-0.5">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-8 items-center justify-items-center w-full">
          {/* PLAYER TEAM (LEFT COLUMN) - Only living survivors can be chosen to attack! */}
          <section
            className="flex flex-col gap-1 sm:gap-2 items-center w-full"
            style={
              strike && playerCats.some((c) => c.instanceId === strike.attackerId)
                ? { position: 'relative', zIndex: 40 }
                : undefined
            }
          >
            <div className="text-[10px] sm:text-xs font-heading font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Sua Equipe ({playerCats.filter((c) => c.isAlive).length}/3)</span>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 items-center justify-center w-full">
              {playerCats.map((cat) => {
                const isSelected = selectedAttackerId === cat.instanceId && cat.isAlive;
                const hasActed = playerCatsActed.includes(cat.instanceId);

                return (
                  <div
                    key={cat.instanceId}
                    className={`transition-all ${
                      isSelected
                        ? 'scale-105 filter drop-shadow-[0_0_14px_rgba(245,158,11,0.7)]'
                        : !cat.isAlive
                        ? 'opacity-40'
                        : hasActed
                        ? 'opacity-70'
                        : 'opacity-95 hover:opacity-100'
                    }`}
                    style={strike?.attackerId === cat.instanceId ? { position: 'relative', zIndex: 40 } : undefined}
                  >
                    <CatRenderer
                      cat={cat}
                      isSelectedForAction={isSelected}
                      hasActedThisRound={hasActed}
                      flipX={true}
                      strike={strike?.attackerId === cat.instanceId ? strike : null}
                      anchorRef={(node) => {
                        catAnchors.current[cat.instanceId] = node;
                      }}
                      onSelectAttacker={() => {
                        if (cat.isAlive && !hasActed && phase === 'PLAYER_TURN') {
                          AudioManager.playSelect();
                          setSelectedAttackerId(cat.instanceId);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* BOT TEAM (RIGHT COLUMN) - Only living survivors can be targeted! */}
          <section
            className="flex flex-col gap-1 sm:gap-2 items-center w-full"
            style={
              strike && botCats.some((c) => c.instanceId === strike.attackerId)
                ? { position: 'relative', zIndex: 40 }
                : undefined
            }
          >
            <div className="text-[10px] sm:text-xs font-heading font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Equipe Inimiga ({botCats.filter((c) => c.isAlive).length}/3)</span>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 items-center justify-center w-full">
              {botCats.map((cat) => {
                const isTargeted = selectedBotTargetId === cat.instanceId && cat.isAlive;
                const hasActed = botCatsActed.includes(cat.instanceId);

                return (
                  <div
                    key={cat.instanceId}
                    className="transition-all"
                    style={strike?.attackerId === cat.instanceId ? { position: 'relative', zIndex: 40 } : undefined}
                  >
                    <CatRenderer
                      cat={cat}
                      isTargeted={isTargeted}
                      canBeTargeted={cat.isAlive}
                      hasActedThisRound={hasActed}
                      strike={strike?.attackerId === cat.instanceId ? strike : null}
                      anchorRef={(node) => {
                        catAnchors.current[cat.instanceId] = node;
                      }}
                      onSelectTarget={() => {
                        if (cat.isAlive) {
                          AudioManager.playSelect();
                          setSelectedBotTargetId(cat.instanceId);
                        }
                      }}
                      flipX={false}
                      advantageTag={isTargeted ? previewAdvantage : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* DOCKED ACTION TRAY (MÓDULOS DE ATAQUE) - ALWAYS VISIBLE AT BOTTOM */}
      <footer className="relative z-20 max-w-5xl w-full mx-auto flex flex-col gap-1.5 shrink-0">
        {/* Turn Status Banner & Target Selector Info */}
        <div
          className={`flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all text-xs ${
            isPlayerTurnNow
              ? 'bg-gradient-to-r from-amber-950/80 via-slate-950/90 to-red-950/80 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
              : 'bg-slate-950/90 border-slate-800 text-slate-400'
          }`}
        >
          {/* Active Turn and Attacker Info */}
          <div className="flex items-center gap-2">
            {isPlayerTurnNow ? (
              <span className="font-heading font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>SUA VEZ:</span>
                <strong className="text-white underline">{attackerCat?.baseStats.name}</strong>
                {isDesperationReady && (
                  <span className="bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0.2 rounded border border-rose-300 flex items-center gap-0.5 animate-bounce shadow">
                    <Zap className="w-2.5 h-2.5 text-yellow-300" />
                    2X DANO ATIVO!
                  </span>
                )}
              </span>
            ) : phase === 'BOT_TURN' ? (
              <span className="font-heading text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Aguarde: Adversário Escolhendo e Atacando...
              </span>
            ) : (
              <span className="font-heading text-slate-400">Preparando Rodada...</span>
            )}
          </div>

          {/* Target Enemy with advantage badge */}
          {targetEnemy && targetEnemy.isAlive && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Target className="w-3.5 h-3.5 text-rose-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-slate-300">Alvo: <strong className="text-rose-400">{targetEnemy.baseStats.name}</strong></span>
              {previewAdvantage && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    previewAdvantage.type === 'advantage'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : previewAdvantage.type === 'disadvantage'
                      ? 'bg-red-950 text-red-300 border-red-500'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  {previewAdvantage.text}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 4 ACTION BUTTONS (ATAQUE, ESPECIAL, CURA, ESCUDO) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* 1. ATAQUE */}
          <button
            disabled={!isPlayerTurnNow || (isAttackBlockedByShield && !canPassTurn)}
            onClick={() => (canPassTurn ? passShieldedTurn() : handlePlayerAction('ATTACK'))}
            className={`py-2 sm:py-2.5 px-1 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-0.5 border relative ${
              canPassTurn
                ? 'bg-gradient-to-b from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.55)] cursor-pointer active:scale-95'
                : isPlayerTurnNow && !isAttackBlockedByShield
                ? isDesperationReady
                  ? 'bg-gradient-to-b from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.9)] cursor-pointer active:scale-95 animate-pulse'
                  : 'bg-gradient-to-b from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.6)] cursor-pointer active:scale-95 animate-pulse'
                : 'bg-slate-900/80 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
            }`}
          >
            {isDesperationReady && (
              <span className="absolute -top-2 inset-x-0 mx-auto w-fit bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full border border-amber-200 shadow flex items-center gap-0.5">
                <Zap className="w-2 h-2 text-slate-950 fill-current" />
                2X DANO
              </span>
            )}
            {canPassTurn ? <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" /> : <Swords className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span>{canPassTurn ? 'PASSAR' : 'ATAQUE'}</span>
            <span className="text-[8px] sm:text-[9px] font-mono opacity-80">
              {canPassTurn ? 'A vez' : isAttackBlockedByShield ? 'Bloqueado' : isDesperationReady ? '2x Fulminante' : 'Básico'}
            </span>
          </button>

          {/* 2. ESPECIAL */}
          <button
            disabled={!isPlayerTurnNow || isSpecialOnCooldown || isAttackBlockedByShield}
            onClick={() => handlePlayerAction('SPECIAL')}
            className={`py-2 sm:py-2.5 px-1 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-0.5 border relative ${
              isPlayerTurnNow && !isSpecialOnCooldown && !isAttackBlockedByShield
                ? isDesperationReady
                  ? 'bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600 hover:from-amber-300 hover:to-rose-500 text-slate-950 border-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.9)] cursor-pointer active:scale-95 animate-pulse'
                  : 'bg-gradient-to-b from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.7)] cursor-pointer active:scale-95 animate-pulse'
                : 'bg-slate-900/80 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
            }`}
          >
            {isDesperationReady && !isSpecialOnCooldown && !isAttackBlockedByShield && (
              <span className="absolute -top-2 inset-x-0 mx-auto w-fit bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full border border-rose-300 shadow flex items-center gap-0.5">
                <Zap className="w-2 h-2 text-yellow-300 fill-current" />
                2X DANO
              </span>
            )}
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>ESPECIAL</span>
            <span className="text-[8px] sm:text-[9px] font-mono">
              {isSpecialOnCooldown
                ? `CD: ${attackerCat?.specialCooldown}R`
                : isDesperationReady
                ? `${attackerCat?.baseStats.desperationName.split(' ')[0]} 2x!`
                : 'PRONTO!'}
            </span>
          </button>

          {/* 3. CURA (MAX 3 USOS POR BATALHA) */}
          <button
            disabled={!isPlayerTurnNow || playerHealsLeft <= 0 || playerUsedHealThisRound}
            onClick={() => handlePlayerAction('HEAL')}
            className={`py-2 sm:py-2.5 px-1 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-0.5 border relative ${
              isPlayerTurnNow && playerHealsLeft > 0 && !playerUsedHealThisRound
                ? 'bg-gradient-to-b from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95'
                : 'bg-slate-900/80 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
            }`}
          >
            {/* Limit Counter Badge */}
            <span
              className={`absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold border shadow ${
                playerHealsLeft > 0
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                  : 'bg-rose-950 text-rose-400 border-rose-700'
              }`}
            >
              {playerHealsLeft}/{MAX_HEALS_PER_MATCH}
            </span>

            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>CURA</span>
            <span className="text-[8px] sm:text-[9px] font-mono">
              {playerHealsLeft <= 0
                ? 'ESGOTADO'
                : playerUsedHealThisRound
                ? 'Na Rodada'
                : `+25% HP`}
            </span>
          </button>

          {/* 4. ESCUDO (MAX 1 USO POR BATALHA) */}
          <button
            disabled={!isPlayerTurnNow || playerShieldsLeft <= 0 || isAttackBlockedByShield}
            onClick={() => handlePlayerAction('SHIELD')}
            className={`py-2 sm:py-2.5 px-1 rounded-xl font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex flex-col items-center justify-center gap-0.5 border relative ${
              isPlayerTurnNow && playerShieldsLeft > 0 && !isAttackBlockedByShield
                ? 'bg-gradient-to-b from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer active:scale-95'
                : 'bg-slate-900/80 text-slate-600 border-slate-800 cursor-not-allowed opacity-40'
            }`}
          >
            {/* Limit Counter Badge */}
            <span
              className={`absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold border shadow ${
                playerShieldsLeft > 0
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                  : 'bg-rose-950 text-rose-400 border-rose-700'
              }`}
            >
              {playerShieldsLeft}/{MAX_SHIELDS_PER_MATCH}
            </span>

            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>ESCUDO</span>
            <span className="text-[8px] sm:text-[9px] font-mono">
              {playerShieldsLeft <= 0
                ? 'ESGOTADO'
                : isAttackBlockedByShield
                ? `${attackerCat?.shieldRounds}R Ativo`
                : '3 Rodadas'}
            </span>
          </button>
        </div>

        {/* COMPACT BATTLE TICKER / DRAWER TOGGLE */}
        <div className="flex items-center justify-between px-2.5 py-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
          <div className="truncate flex-1">
            {latestLog ? (
              <span className="text-slate-300 font-semibold">{latestLog.message}</span>
            ) : (
              <span>Clique no seu gato para atacar e escolha o alvo adversário!</span>
            )}
          </div>
          <button
            onClick={() => setShowMobileLogDrawer(!showMobileLogDrawer)}
            className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 pl-2 shrink-0 font-heading"
          >
            <span>{showMobileLogDrawer ? 'Ocultar' : 'Log'}</span>
            {showMobileLogDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* EXPANDABLE LOG DRAWER */}
        {showMobileLogDrawer && (
          <div className="animate-fade-in">
            <CombatLog logs={logs} />
          </div>
        )}
      </footer>

      {/* ROULETTE MODAL */}
      <RouletteWheel
        isOpen={showRoulette}
        onSpinComplete={handleRouletteComplete}
      />

      {/* INITIATIVE MODAL */}
      {showInitiative && (
        <InitiativeModal
          round={round}
          isChaosActive={activeSector?.effectType === 'CHAOS'}
          playerAvgSpeed={Math.round(
            playerCats.filter((c) => c.isAlive).reduce((acc, c) => acc + c.speed, 0) /
              Math.max(1, playerCats.filter((c) => c.isAlive).length)
          )}
          botAvgSpeed={Math.round(
            botCats.filter((c) => c.isAlive).reduce((acc, c) => acc + c.speed, 0) /
              Math.max(1, botCats.filter((c) => c.isAlive).length)
          )}
          onBidSubmitted={handleInitiativeSubmitted}
        />
      )}

      {/* VICTORY / DEFEAT MODAL */}
      {matchResult && (
        <VictoryModal
          isVictory={matchResult === 'victory'}
          roundsSurvived={round}
          earnedXp={earnedXp}
          playerTeam={playerCats}
          synergy={playerSynergy}
          onRematch={() => {
            setPlayerCats(initialPlayerTeam.map((c) => BattleEngine.createCombatant(c.baseStats, 'player', c.slotIndex, c.level, c.xp)));
            setBotCats(initialBotTeam.map((c) => BattleEngine.createCombatant(c.baseStats, 'bot', c.slotIndex, c.level, c.xp)));
            setRound(1);
            setPhase('ROULETTE');
            setShowRoulette(true);
            setMatchResult(null);
            setLogs([]);
            setPlayerCatsActed([]);
            setBotCatsActed([]);
            setIsExecutingAction(false);
            setPlayerHealsLeft(MAX_HEALS_PER_MATCH);
            setPlayerShieldsLeft(MAX_SHIELDS_PER_MATCH);
            setBotHealsLeft(MAX_HEALS_PER_MATCH);
            setBotShieldsLeft(MAX_SHIELDS_PER_MATCH);
          }}
          onHome={() => {
            onExitBattle(matchResult === 'victory', earnedXp);
          }}
        />
      )}
    </div>
  );
};
