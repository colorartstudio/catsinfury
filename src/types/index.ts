export type ElementType = 'FOGO' | 'ÁGUA' | 'VENTO' | 'TERRA';

export type ActionType = 'ATTACK' | 'SPECIAL' | 'HEAL' | 'SHIELD';

export type BotDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface BaseCatStats {
  id: string;
  name: string;
  element: ElementType;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseDodge: number; // in %
  baseCrit: number;  // in %
  speed: number;
  specialCooldownMax: number;
  avatarColor: string;
  accentColor: string;
  description: string;
  specialName: string;
  specialDescription: string;
  passiveName: string;
  passiveDescription: string;
  desperationName: string;
  desperationDescription: string;
}

export interface CatCombatant {
  instanceId: string;
  teamId: 'player' | 'bot';
  slotIndex: number;
  baseStats: BaseCatStats;
  level: number;
  currentHp: number;
  maxHp: number;
  atk: number;
  def: number;
  dodge: number;
  crit: number;
  speed: number;
  specialCooldown: number;
  shieldRounds: number; // 0 = no shield
  isTaunting: boolean;  // Earth cat special
  burnRounds: number;   // Fire cat burn
  burnPower: number;    // % damage per round (e.g. 5 or 10)
  waterSpecialUses: number; // Tracks healing decay for Water Cat
  hasTriggeredWaterPassive: boolean; // 50% HP threshold triggered
  hasTriggeredDesperation: boolean; // True once triggered or once HP falls to <= 10%, never re-arms even if healed!
  isAlive: boolean;
  xp: number;
  animState: 'idle' | 'attacking' | 'hurt' | 'dodging' | 'fainted' | 'casting';
}

export interface ArenaDefinition {
  id: string;
  name: string;
  elementFocus?: ElementType;
  icon: string;
  description: string;
  bgGradient: string;
  fireMod: number;     // multiplier added to dmg or 0
  waterMod: number;    // multiplier added to heal or dmg
  windMod: number;     // dodge mod
  earthMod: number;    // def or atk mod
  ambientParticles: 'embers' | 'bubbles' | 'leaves' | 'dust' | 'stars';
}

export interface RouletteSector {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  effectType: 'FIRE_BOOST' | 'WATER_BOOST' | 'EARTH_BOOST' | 'WIND_BOOST' | 'ECLIPSE' | 'FURY' | 'CHAOS' | 'BLESSING';
}

export interface TeamSynergy {
  name: string;
  description: string;
  hpBonus: number;      // e.g. 0.10 for +10%
  dmgBonus: number;     // e.g. 0.05 for +5%
  counterResist: number;// e.g. 0.15 for +15%
  xpBonus: number;      // e.g. 0.20 for +20%
  atkBonus: number;     // e.g. 0.05 for +5%
  hpPenalty: number;    // e.g. -0.10 for -10%
}

export interface CombatLogEntry {
  id: string;
  round: number;
  timestamp: number;
  message: string;
  type: 'damage' | 'crit' | 'heal' | 'shield' | 'dodge' | 'burn' | 'system' | 'taunt' | 'desperation';
  element?: ElementType;
}

export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  isCrit: boolean;
  isDodged: boolean;
  isShieldBlocked: boolean;
  isTauntRedirected: boolean;
  isDesperation?: boolean;
  elementAdvantage: 'advantage' | 'disadvantage' | 'neutral';
  elementMultiplier: number;
  notes: string[];
}
