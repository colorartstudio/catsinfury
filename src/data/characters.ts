import { BaseCatStats, ElementType, TeamSynergy } from '../types';

export const CAT_CHARACTERS: Record<string, BaseCatStats> = {
  fire: {
    id: 'fire',
    name: 'Fire Cat',
    element: 'FOGO',
    baseHp: 1800,
    baseAtk: 240,
    baseDef: 100,
    baseDodge: 8,
    baseCrit: 18,
    speed: 14,
    specialCooldownMax: 2,
    avatarColor: '#f97316',
    accentColor: '#ef4444',
    description: 'Agressivo, energético e confiante. Pelagem laranja avermelhada com cauda flamejante e marcas de fogo.',
    specialName: 'Inferno Feroz',
    specialDescription: 'Golpe flamejante com +40% de dano. Aplica Burn dobrado (10% do HP do alvo por 2 rodadas).',
    passiveName: 'Combustão Contínua',
    passiveDescription: 'Ataques básicos aplicam Queimadura (Burn) por 2 rodadas (5% do HP max do alvo).',
    desperationName: 'Cataclismo Solar',
    desperationDescription: 'Ao ficar com ≤ 10% de HP, liberta uma erupção solar devastadora causando 2x de dano (uso único).',
  },
  water: {
    id: 'water',
    name: 'Water Cat',
    element: 'ÁGUA',
    baseHp: 2000,
    baseAtk: 180,
    baseDef: 130,
    baseDodge: 10,
    baseCrit: 12,
    speed: 12,
    specialCooldownMax: 2,
    avatarColor: '#0ea5e9',
    accentColor: '#38bdf8',
    description: 'Tranquilo, inteligente e mágico. Pelagem azul e branca com cauda em onda líquida e patas douradas.',
    specialName: 'Maré Restauradora',
    specialDescription: 'Cura 20% do HP próprio na 1ª vez. Reduz em 20% a eficiência a cada uso subsequente.',
    passiveName: 'Fonte da Vida',
    passiveDescription: 'Ao cair para 50% ou menos de HP, recupera instantaneamente 10% de HP.',
    desperationName: 'Tsunami Abissal',
    desperationDescription: 'Ao ficar com ≤ 10% de HP, conjura um vórtice hidrocinético que esmaga o oponente com 2x de dano (uso único).',
  },
  wind: {
    id: 'wind',
    name: 'Wind Cat',
    element: 'VENTO',
    baseHp: 1700,
    baseAtk: 210,
    baseDef: 90,
    baseDodge: 22,
    baseCrit: 20,
    speed: 18,
    specialCooldownMax: 2,
    avatarColor: '#10b981',
    accentColor: '#34d399',
    description: 'Ágil, brincalhão e veloz. Pelagem branca prateada com cauda em redemoinho e orelhas aladas.',
    specialName: 'Lâminas Ciclônicas',
    specialDescription: 'Desfere 3 golpes tempestuosos velozes, cada um causando 60% do ATK.',
    passiveName: 'Esquiva Eólica & Reflexo',
    passiveDescription: '22% de esquiva base. Ao esquivar, recebe apenas 50% do dano. Sob escudo, ataque básico ganha +1 hit.',
    desperationName: 'Vórtice dos Mil Cortes',
    desperationDescription: 'Ao ficar com ≤ 10% de HP, quebra a barreira do som dilacerando com 2x de dano (uso único).',
  },
  earth: {
    id: 'earth',
    name: 'Earth Cat',
    element: 'TERRA',
    baseHp: 2400,
    baseAtk: 160,
    baseDef: 180,
    baseDodge: 5,
    baseCrit: 10,
    speed: 10,
    specialCooldownMax: 3,
    avatarColor: '#84cc16',
    accentColor: '#ca8a04',
    description: 'Forte, protetor e imponente. Pelagem terrosa com cauda de rochas e runas douradas nas patas.',
    specialName: 'Baluarte & Provocação',
    specialDescription: 'Provoca todos os ataques inimigos por 1 rodada e reduz o dano sofrido a 10% (Wind Cat ignora e causa 2x dano).',
    passiveName: 'Pele de Pedra',
    passiveDescription: 'Maior Defesa e Vida da arena. Alta absorção de dano físico.',
    desperationName: 'Fissura Sísmica Titânica',
    desperationDescription: 'Ao ficar com ≤ 10% de HP, parte a terra num choque sísmico que inflige 2x de dano (uso único).',
  },
};

export const ELEMENT_ADVANTAGE_MAP: Record<ElementType, ElementType> = {
  'ÁGUA': 'FOGO',
  'FOGO': 'VENTO',
  'VENTO': 'TERRA',
  'TERRA': 'ÁGUA',
};

export function getElementRelation(attacker: ElementType, defender: ElementType): {
  multiplier: number;
  relation: 'advantage' | 'disadvantage' | 'neutral';
} {
  if (ELEMENT_ADVANTAGE_MAP[attacker] === defender) {
    return { multiplier: 1.25, relation: 'advantage' }; // +25%
  }
  if (ELEMENT_ADVANTAGE_MAP[defender] === attacker) {
    return { multiplier: 0.85, relation: 'disadvantage' }; // -15%
  }
  return { multiplier: 1.0, relation: 'neutral' };
}

export function calculateTeamSynergy(elements: ElementType[]): TeamSynergy {
  const counts: Partial<Record<ElementType, number>> = {};
  for (const el of elements) {
    counts[el] = (counts[el] || 0) + 1;
  }

  const distinctCount = Object.keys(counts).length;
  const values = Object.values(counts);

  // 3 elementos iguais
  if (distinctCount === 1) {
    return {
      name: 'Monólito Elemental',
      description: '+5% ATK, mas −10% HP máximo.',
      hpBonus: 0,
      dmgBonus: 0,
      counterResist: 0,
      xpBonus: 0,
      atkBonus: 0.05,
      hpPenalty: -0.10,
    };
  }

  // 3 elementos diferentes
  if (distinctCount === 3) {
    // Check if it forms a consecutive cycle trio
    const hasWater = elements.includes('ÁGUA');
    const hasFire = elements.includes('FOGO');
    const hasWind = elements.includes('VENTO');
    const hasEarth = elements.includes('TERRA');

    // Trio complete cycle (e.g. ÁGUA + FOGO + VENTO or FOGO + VENTO + TERRA etc)
    const isCycleTrio = (hasWater && hasFire && hasWind) ||
                        (hasFire && hasWind && hasEarth) ||
                        (hasWind && hasEarth && hasWater) ||
                        (hasEarth && hasWater && hasFire);

    return {
      name: isCycleTrio ? 'Harmonia Cósmica do Ciclo' : 'Tríade Diversificada',
      description: isCycleTrio
        ? '+10% HP, +5% Dano e +20% XP por formar o ciclo elemental!'
        : '+10% HP e +5% Dano para toda a equipe.',
      hpBonus: 0.10,
      dmgBonus: 0.05,
      counterResist: 0,
      xpBonus: isCycleTrio ? 0.20 : 0,
      atkBonus: 0,
      hpPenalty: 0,
    };
  }

  // 2 iguais + 1 diferente
  if (values.includes(2)) {
    return {
      name: 'Foco Ressonante',
      description: '+15% de resistência ao elemento que contra-ataca o elemento duplicado.',
      hpBonus: 0,
      dmgBonus: 0,
      counterResist: 0.15,
      xpBonus: 0,
      atkBonus: 0,
      hpPenalty: 0,
    };
  }

  return {
    name: 'Equipe Padrão',
    description: 'Sem sinergia ativa.',
    hpBonus: 0,
    dmgBonus: 0,
    counterResist: 0,
    xpBonus: 0,
    atkBonus: 0,
    hpPenalty: 0,
  };
}
