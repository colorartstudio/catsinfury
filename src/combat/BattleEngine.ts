import {
  ActionType,
  ArenaDefinition,
  BaseCatStats,
  BotDifficulty,
  CatCombatant,
  CombatLogEntry,
  DamageResult,
  ElementType,
  RouletteSector,
  TeamSynergy,
} from '../types';
import { CAT_CHARACTERS, calculateTeamSynergy, getElementRelation } from '../data/characters';

export class BattleEngine {
  public static createCombatant(
    baseStats: BaseCatStats,
    teamId: 'player' | 'bot',
    slotIndex: number,
    level: number = 1,
    xp: number = 0
  ): CatCombatant {
    // Stat scaling based on level: every level (from 1000 XP) gives +2% HP, +1% ATK, +1% DEF
    const levelBonus = Math.min(30, level) - 1;
    const hpMultiplier = 1 + levelBonus * 0.02;
    const atkMultiplier = 1 + levelBonus * 0.01;
    const defMultiplier = 1 + levelBonus * 0.01;

    const maxHp = Math.round(baseStats.baseHp * hpMultiplier);
    const atk = Math.round(baseStats.baseAtk * atkMultiplier);
    const def = Math.round(baseStats.baseDef * defMultiplier);

    return {
      instanceId: `${teamId}_${baseStats.id}_${slotIndex}_${Date.now()}_${Math.random()}`,
      teamId,
      slotIndex,
      baseStats,
      level,
      currentHp: maxHp,
      maxHp,
      atk,
      def,
      dodge: baseStats.baseDodge,
      crit: baseStats.baseCrit,
      speed: baseStats.speed,
      specialCooldown: 0,
      shieldRounds: 0,
      isTaunting: false,
      burnRounds: 0,
      burnPower: 0.05,
      waterSpecialUses: 0,
      hasTriggeredWaterPassive: false,
      hasTriggeredDesperation: false,
      isAlive: true,
      xp,
      animState: 'idle',
    };
  }

  // Calculate damage accurately following the formula:
  // Dano = (ATK * Modificador Elemental * Modificador Arena * Modificador Sinergia) - (DEF * 0.4)
  public static calculateDamage(
    attacker: CatCombatant,
    defender: CatCombatant,
    action: ActionType,
    arena: ArenaDefinition,
    attackerSynergy: TeamSynergy,
    defenderSynergy: TeamSynergy,
    activeSector: RouletteSector | null,
    allCombatants: CatCombatant[]
  ): DamageResult {
    const notes: string[] = [];
    const attackerEl = attacker.baseStats.element;
    const defenderEl = defender.baseStats.element;

    // 1. Elemental Relation
    const { multiplier: baseElemMult, relation } = getElementRelation(attackerEl, defenderEl);
    let elementMult = baseElemMult;

    // Sinergia resist to counter element (2 iguais + 1 diferente gives +15% resist to counter)
    if (defenderSynergy.counterResist > 0 && relation === 'advantage') {
      elementMult = Math.max(1.0, elementMult - defenderSynergy.counterResist);
      notes.push('🛡️ Resistência de Sinergia (-15% Vantagem)');
    }

    // 2. Arena Modifiers
    let arenaMod = 1.0;
    if (arena.elementFocus === 'FOGO' && attackerEl === 'FOGO') {
      arenaMod += arena.fireMod; // +15%
      notes.push('🌋 Vulcão (+15% Dano de Fogo)');
    } else if (arena.id === 'ocean' && attackerEl === 'FOGO') {
      arenaMod += arena.fireMod; // -10%
      notes.push('🌊 Oceano (-10% Dano de Fogo)');
    }

    // 3. Synergy Modifiers
    let synergyMod = 1.0 + (attackerSynergy.dmgBonus || 0);

    // 4. Roulette Sector Modifiers
    let sectorMod = 1.0;
    if (activeSector) {
      if (activeSector.effectType === 'FIRE_BOOST' && attackerEl === 'FOGO') {
        sectorMod += 0.20;
        notes.push('🔥 Roleta Chama (+20% Fogo)');
      } else if (activeSector.effectType === 'ECLIPSE') {
        sectorMod -= 0.10;
        notes.push('🌑 Roleta Eclipse (-10% Dano)');
      }
    }

    // 5. Special Multiplier
    let skillMod = 1.0;
    if (action === 'SPECIAL') {
      if (attacker.baseStats.id === 'fire') {
        skillMod = 1.40; // +40% dano
        notes.push('🔥 Especial Inferno (+40% Dano)');
      } else if (attacker.baseStats.id === 'wind') {
        // Handled as multi-hit 60% in execute
        skillMod = 0.60;
      }
    }

    // Effective ATK
    let effectiveAtk = attacker.atk * (1 + (attackerSynergy.atkBonus || 0));
    if (arena.id === 'plateau' && attackerEl === 'TERRA') {
      effectiveAtk *= (1 + arena.earthMod); // -10%
      notes.push('🍃 Planalto (-10% ATK Terra)');
    }

    // Effective DEF
    let effectiveDef = defender.def;
    if (arena.elementFocus === 'TERRA' && defenderEl === 'TERRA') {
      effectiveDef *= (1 + arena.earthMod); // +20%
      notes.push('🏔️ Montanha (+20% DEF Terra)');
    }
    if (activeSector && activeSector.effectType === 'EARTH_BOOST' && defenderEl === 'TERRA') {
      effectiveDef *= 1.20;
      notes.push('🪨 Roleta Rocha (+20% DEF Terra)');
    }

    // Base damage formula
    const rawAtkTotal = effectiveAtk * elementMult * arenaMod * synergyMod * sectorMod * skillMod;
    let baseDmg = rawAtkTotal - (effectiveDef * 0.4);
    baseDmg = Math.max(25, baseDmg); // Minimum scratch damage

    // Check Dodge
    let effectiveDodge = defender.dodge;
    if (arena.id === 'mountain' && defenderEl === 'VENTO') {
      effectiveDodge = Math.max(0, effectiveDodge + arena.windMod * 100); // -15%
    } else if (arena.id === 'plateau' && defenderEl === 'VENTO') {
      effectiveDodge += arena.windMod * 100; // +15%
    }
    if (activeSector && activeSector.effectType === 'WIND_BOOST' && defenderEl === 'VENTO') {
      effectiveDodge += 20;
    }

    const dodgeRoll = Math.random() * 100;
    const isDodged = dodgeRoll < effectiveDodge;

    if (isDodged) {
      if (defender.baseStats.id === 'wind') {
        // Wind cat takes 50% damage when dodging
        baseDmg *= 0.5;
        notes.push('🌪️ Wind Cat Esquivou! Recebe apenas 50% do dano');
      } else {
        return {
          rawDamage: Math.round(baseDmg),
          finalDamage: 0,
          isCrit: false,
          isDodged: true,
          isShieldBlocked: false,
          isTauntRedirected: false,
          elementAdvantage: relation,
          elementMultiplier: elementMult,
          notes: ['Esquivou completamente do ataque!'],
        };
      }
    }

    // Check Critical
    let effectiveCrit = attacker.crit;
    if (activeSector && activeSector.effectType === 'FURY') {
      // +15% crit for combatant with lowest HP ratio
      const lowestHpCombatant = allCombatants
        .filter((c) => c.isAlive)
        .sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
      if (lowestHpCombatant && lowestHpCombatant.instanceId === attacker.instanceId) {
        effectiveCrit += 15;
        notes.push('⚡ Fúria da Roleta (+15% Crítico)!');
      }
    }

    const critRoll = Math.random() * 100;
    const isCrit = critRoll < effectiveCrit;
    if (isCrit) {
      baseDmg *= 1.5;
      notes.push('💥 GOLPE CRÍTICO!');
    }

    // ⚡ DESPERATION POWER: 2x damage when HP <= 10% and not triggered yet (1 time per match)
    // Even if healed afterwards, hasTriggeredDesperation prevents reuse!
    const hpRatio = attacker.currentHp / attacker.maxHp;
    const isDesperation = hpRatio <= 0.10 && !attacker.hasTriggeredDesperation && (action === 'ATTACK' || action === 'SPECIAL');
    if (isDesperation) {
      baseDmg *= 2.0;
      notes.push(`⚡ PODER DESTRUTIVO: [${attacker.baseStats.desperationName}] - DOBRO DE DANO (2x)!`);
    }

    // Earth Cat Taunt protection check:
    // Earth Cat takes only 10% damage during taunt; Wind Cat ignores and deals double (2x)!
    if (defender.isTaunting) {
      if (attacker.baseStats.id === 'wind') {
        baseDmg *= 2.0;
        notes.push('🌪️ Wind Cat ignora a provocação e causa 2x de dano!');
      } else {
        baseDmg *= 0.10;
        notes.push('🪨 Provocação de Terra ativada: recebe apenas 10% de dano!');
      }
    }

    // Shield check
    let isShieldBlocked = false;
    if (defender.shieldRounds > 0) {
      // Shield absorbs 75% damage
      baseDmg *= 0.25;
      isShieldBlocked = true;
      notes.push('🛡️ Barreira de Escudo absorveu 75% do dano!');
    }

    const finalDamage = Math.max(10, Math.round(baseDmg));

    return {
      rawDamage: Math.round(rawAtkTotal),
      finalDamage,
      isCrit,
      isDodged,
      isShieldBlocked,
      isTauntRedirected: false,
      isDesperation,
      elementAdvantage: relation,
      elementMultiplier: elementMult,
      notes,
    };
  }

  // Calculate Heal Amount
  public static calculateHeal(
    healer: CatCombatant,
    target: CatCombatant,
    arena: ArenaDefinition,
    activeSector: RouletteSector | null,
    isSpecial: boolean = false
  ): number {
    let healRatio = 0.25; // Universal Heal is 25%

    if (isSpecial && healer.baseStats.id === 'water') {
      // Special: 20% on first use, reduces by 20% each time (20% -> 16% -> 12.8% -> ...)
      const decay = Math.pow(0.8, healer.waterSpecialUses);
      healRatio = 0.20 * decay;
    }

    let healAmount = target.maxHp * healRatio;

    // Arena Modifier
    if (arena.elementFocus === 'ÁGUA') {
      healAmount *= (1 + arena.waterMod); // +15%
    } else if (arena.id === 'volcano') {
      healAmount *= (1 + arena.waterMod); // -10%
    }

    // Roulette Sector
    if (activeSector && activeSector.effectType === 'WATER_BOOST') {
      healAmount *= 1.30; // +30%
    }

    return Math.max(50, Math.round(healAmount));
  }

  // Calculate XP gained after match:
  // 50 + 10 * rounds survived + 100 if victory
  // Sinergia do ciclo adds +20% XP!
  public static calculateMatchXp(
    roundsSurvived: number,
    isVictory: boolean,
    synergy: TeamSynergy
  ): number {
    let xp = 50 + 10 * roundsSurvived;
    if (isVictory) {
      xp += 100;
    }
    if (synergy.xpBonus > 0) {
      xp = Math.round(xp * (1 + synergy.xpBonus));
    }
    return xp;
  }

  // Bot AI decision maker
  public static chooseBotAction(
    botCat: CatCombatant,
    botTeam: CatCombatant[],
    playerTeam: CatCombatant[],
    difficulty: BotDifficulty,
    usedHealThisRound: boolean
  ): { action: ActionType; targetId: string } {
    const livingPlayers = playerTeam.filter((p) => p.isAlive && p.currentHp > 0);
    const livingBots = botTeam.filter((b) => b.isAlive && b.currentHp > 0);

    if (livingPlayers.length === 0) {
      return { action: 'ATTACK', targetId: playerTeam[0].instanceId };
    }

    // Taunt target redirection priority
    const tauntingPlayer = livingPlayers.find((p) => p.isTaunting);
    if (tauntingPlayer && botCat.baseStats.id !== 'wind') {
      // Forced to target taunting Earth Cat unless Wind Cat
      return {
        action: botCat.specialCooldown === 0 ? 'SPECIAL' : 'ATTACK',
        targetId: tauntingPlayer.instanceId,
      };
    }

    // Easy AI: attacks random living player
    if (difficulty === 'EASY') {
      const target = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
      const action: ActionType =
        botCat.specialCooldown === 0 && Math.random() > 0.4 ? 'SPECIAL' : 'ATTACK';
      return { action, targetId: target.instanceId };
    }

    // Normal & Hard AI: Tactical evaluation
    // 1. Check if an ally has critically low HP (< 30%) and heal is available
    if (!usedHealThisRound) {
      const criticalAlly = livingBots.find((b) => b.currentHp / b.maxHp < 0.35);
      if (criticalAlly && (difficulty === 'HARD' || Math.random() > 0.3)) {
        return { action: 'HEAL', targetId: criticalAlly.instanceId };
      }
    }

    // 2. Check if Earth Cat can activate Taunt / Shield when team is under threat
    if (botCat.baseStats.id === 'earth' && botCat.specialCooldown === 0) {
      const teamNeedsProtection = livingBots.some((b) => b.currentHp / b.maxHp < 0.5);
      if (teamNeedsProtection) {
        return { action: 'SPECIAL', targetId: livingPlayers[0].instanceId };
      }
    }

    // 3. Water Cat self-heal special
    if (botCat.baseStats.id === 'water' && botCat.specialCooldown === 0 && botCat.currentHp / botCat.maxHp < 0.6) {
      return { action: 'SPECIAL', targetId: botCat.instanceId };
    }

    // 4. Find most vulnerable target (consider elemental advantage and lowest HP)
    let bestTarget = livingPlayers[0];
    let bestScore = -999;

    for (const player of livingPlayers) {
      const { relation } = getElementRelation(botCat.baseStats.element, player.baseStats.element);
      let score = 0;
      if (relation === 'advantage') score += 50;
      if (relation === 'disadvantage') score -= 30;

      // Prioritize low HP targets to score a knockout
      const hpRatio = player.currentHp / player.maxHp;
      score += (1 - hpRatio) * 40;

      // Penalize attacking shielded target
      if (player.shieldRounds > 0) score -= 35;

      if (score > bestScore) {
        bestScore = score;
        bestTarget = player;
      }
    }

    // 5. Hard AI uses Shield if bot cat is under 35% HP and has no shield
    if (difficulty === 'HARD' && botCat.currentHp / botCat.maxHp < 0.35 && botCat.shieldRounds === 0 && Math.random() > 0.4) {
      return { action: 'SHIELD', targetId: botCat.instanceId };
    }

    // 6. Use Special if available
    const action: ActionType = botCat.specialCooldown === 0 ? 'SPECIAL' : 'ATTACK';
    return { action, targetId: bestTarget.instanceId };
  }
}
