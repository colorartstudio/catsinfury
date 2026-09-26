import React from 'react';
import { CatCombatant, ElementType } from '../types';
import { Shield, Flame, Eye, Target, Zap } from 'lucide-react';

export interface StrikeMotion {
  dx: number;
  dy: number;
  phase: 'go' | 'back';
  showPaw: boolean;
}

interface CatRendererProps {
  cat: CatCombatant;
  isTargeted?: boolean;
  isSelectedForAction?: boolean;
  canBeTargeted?: boolean;
  onSelectTarget?: () => void;
  onSelectAttacker?: () => void;
  flipX?: boolean; // True for player facing right, false for bot facing left
  hasActedThisRound?: boolean;
  strike?: StrikeMotion | null;
  anchorRef?: (node: HTMLDivElement | null) => void;
  advantageTag?: {
    text: string;
    type: 'advantage' | 'disadvantage' | 'neutral';
  };
}

export const CatRenderer: React.FC<CatRendererProps> = ({
  cat,
  isTargeted = false,
  isSelectedForAction = false,
  canBeTargeted = false,
  onSelectTarget,
  onSelectAttacker,
  flipX = false,
  hasActedThisRound = false,
  strike = null,
  anchorRef,
  advantageTag,
}) => {
  const { element, id } = cat.baseStats;

  // Compute CSS animation based on animState
  let motionClasses = 'transition-transform duration-300 ease-out';
  if (!cat.isAlive) {
    motionClasses = 'opacity-35 grayscale filter translate-y-3 pointer-events-none transition-all duration-500';
  } else if (cat.animState === 'attacking') {
    motionClasses = flipX ? 'animate-cat-dash-right' : 'animate-cat-dash-left';
  } else if (cat.animState === 'hurt') {
    motionClasses = 'animate-cat-hurt';
  } else if (cat.animState === 'dodging') {
    motionClasses = 'animate-cat-dodge';
  } else if (cat.animState === 'casting') {
    motionClasses = 'animate-cat-cast';
  } else {
    motionClasses = 'animate-float';
  }

  const handleCardClick = () => {
    if (!cat.isAlive) return; // Dead cats can NEVER be chosen!
    if (canBeTargeted && onSelectTarget) {
      onSelectTarget();
    } else if (onSelectAttacker) {
      onSelectAttacker();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative group flex flex-col items-center select-none transition-all ${
        !cat.isAlive
          ? 'cursor-not-allowed opacity-40 pointer-events-none'
          : canBeTargeted
          ? 'cursor-crosshair'
          : onSelectAttacker
          ? 'cursor-pointer hover:scale-102'
          : ''
      }`}
    >
      {/* Targeting Reticle & Crosshair Overlay */}
      {isTargeted && cat.isAlive && (
        <div className="absolute -top-6 inset-x-0 flex flex-col items-center z-40 animate-bounce pointer-events-none">
          <div className="bg-red-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-1 border border-red-400">
            <Target className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>ALVO</span>
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-600" />
        </div>
      )}

      {/* Advantage tag preview */}
      {advantageTag && cat.isAlive && isTargeted && (
        <div className="absolute -top-12 z-40 pointer-events-none whitespace-nowrap">
          <span
            className={`text-xs font-heading font-bold px-2 py-0.5 rounded border shadow-md ${
              advantageTag.type === 'advantage'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500'
                : advantageTag.type === 'disadvantage'
                ? 'bg-red-950/90 text-red-300 border-red-500'
                : 'bg-slate-900/90 text-slate-300 border-slate-600'
            }`}
          >
            {advantageTag.text}
          </span>
        </div>
      )}

      {/* Attacker Selection Indicator */}
      {isSelectedForAction && cat.isAlive && !canBeTargeted && (
        <div className="absolute -top-5 z-40 pointer-events-none animate-pulse">
          <span className="bg-amber-500 text-slate-950 text-[10px] font-heading font-bold px-1.5 py-0.2 rounded-full border border-amber-300 shadow">
            ⚔️ ATACANTE
          </span>
        </div>
      )}

      {/* Active Selection Ring / Floor Shadow */}
      <div className="relative w-24 sm:w-28 md:w-36 h-16 sm:h-20 md:h-26 flex items-center justify-center">
        {/* Floor Shadow */}
        <div
          className={`absolute bottom-0 w-20 sm:w-24 md:w-30 h-4 sm:h-5 rounded-full blur-xs transition-all duration-300 ${
            cat.isAlive
              ? isTargeted
                ? 'bg-red-500/40 scale-125'
                : isSelectedForAction
                ? 'bg-amber-400/40 scale-120'
                : 'bg-black/60'
              : 'bg-black/20'
          }`}
        />

        {/* Hover / Select Reticle Ring */}
        {cat.isAlive && (isTargeted || (canBeTargeted && !isTargeted)) && (
          <div
            className={`absolute inset-0 rounded-2xl border-2 pointer-events-none transition-all duration-200 ${
              isTargeted
                ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] bg-red-500/15'
                : 'border-white/20 hover:border-white/50'
            }`}
          />
        )}

        {/* Active Shield Visual Sphere Bubble */}
        {cat.shieldRounds > 0 && cat.isAlive && (
          <div className="absolute inset-0 z-20 rounded-full border-2 border-cyan-400 bg-cyan-500/15 shadow-[0_0_25px_rgba(34,211,238,0.5)] animate-pulse pointer-events-none flex items-center justify-center">
            <div className="absolute -top-3 bg-cyan-950 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500 flex items-center gap-1 shadow-md">
              <Shield className="w-3 h-3" />
              <span>{cat.shieldRounds}R</span>
            </div>
          </div>
        )}

        {/* Taunt Visual Rings (Earth Cat) */}
        {cat.isTaunting && cat.isAlive && (
          <div className="absolute inset-0 z-20 rounded-full border-2 border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-ping pointer-events-none" />
        )}

        {/* Burn Flame Aura (Fire Cat Burn) */}
        {cat.burnRounds > 0 && cat.isAlive && (
          <div className="absolute -top-3 right-0 z-25 bg-orange-950 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-orange-500 flex items-center gap-1 shadow">
            <Flame className="w-2.5 h-2.5 animate-pulse text-orange-500" />
            <span>BURN {cat.burnRounds}R</span>
          </div>
        )}

        {/* Taunt Badge */}
        {cat.isTaunting && cat.isAlive && (
          <div className="absolute -top-3 left-0 z-25 bg-amber-950 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500 flex items-center gap-1 shadow">
            <Eye className="w-2.5 h-2.5 text-amber-400" />
            <span>TAUNT</span>
          </div>
        )}

        {/* ⚡ PODER DESTRUTIVO (≤ 10% HP) - AURA DEVASTADORA */}
        {cat.isAlive && (cat.currentHp / cat.maxHp <= 0.10) && !cat.hasTriggeredDesperation && (
          <>
            <div className="absolute inset-0 z-20 rounded-2xl border-2 border-rose-500 animate-desperation-flame pointer-events-none" />
            <div className="absolute -top-4 inset-x-0 flex justify-center z-30 pointer-events-none">
              <span className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white font-heading font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.9)] flex items-center gap-1 animate-desperation-text tracking-wider uppercase">
                <Zap className="w-3 h-3 text-yellow-300 animate-bounce" />
                <span>2X DANO!</span>
              </span>
            </div>
          </>
        )}

        {/* The Animated Elemental Cat SVG — lunges out of its slot to strike the target */}
        <div
          ref={anchorRef}
          className="relative w-full h-full"
          style={
            strike
              ? {
                  transform:
                    strike.phase === 'go'
                      ? `translate(${strike.dx}px, ${strike.dy}px) scale(1.14) rotate(${flipX ? -7 : 7}deg)`
                      : 'translate(0px, 0px) scale(1) rotate(0deg)',
                  transition: 'transform 0.32s cubic-bezier(0.16, 0.82, 0.24, 1)',
                  zIndex: 40,
                  filter: 'drop-shadow(0 14px 6px rgba(0,0,0,0.45))',
                }
              : undefined
          }
        >
          <div
            className={`relative w-full h-full flex items-center justify-center ${
              flipX ? '' : 'scale-x-[-1]'
            } ${strike ? '' : motionClasses}`}
          >
            <CatArtRenderer catId={id} element={element} />
            {strike?.showPaw && <PawSlap />}
          </div>
        </div>
      </div>

      {/* Mini Info Bar (HP + Name) below Cat */}
      <div className="w-24 sm:w-28 md:w-34 mt-0.5 flex flex-col items-center gap-0.5">
        <div className="w-full flex justify-between items-center text-[10px] sm:text-[11px] font-heading font-semibold px-0.5">
          <span className={`truncate max-w-[65px] sm:max-w-[75px] ${!cat.isAlive ? 'line-through text-slate-500' : 'text-slate-300'}`}>
            {cat.baseStats.name}
          </span>
          <span className={`text-[9px] sm:text-[10px] ${!cat.isAlive ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            {cat.isAlive ? `${Math.max(0, Math.round(cat.currentHp))}/${cat.maxHp}` : '0 HP'}
          </span>
        </div>

        {/* HP Bar */}
        <div className="w-full h-1.5 sm:h-2 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              !cat.isAlive
                ? 'bg-transparent'
                : cat.currentHp / cat.maxHp > 0.5
                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                : cat.currentHp / cat.maxHp > 0.25
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (cat.currentHp / cat.maxHp) * 100))}%` }}
          />
        </div>

        {/* Status / Cooldown Pip Bar */}
        <div className="w-full flex justify-between items-center mt-0.5 px-0.5">
          {!cat.isAlive ? (
            <span className="text-[8px] sm:text-[9px] font-mono text-red-400 font-bold tracking-wider">
              ☠️ DERROTADO
            </span>
          ) : hasActedThisRound ? (
            <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              ✓ AGIU
            </span>
          ) : (
            <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVRE
            </span>
          )}

          {cat.isAlive && (
            cat.specialCooldown > 0 ? (
              <span className="text-[8px] font-mono text-amber-400">
                ESP: {cat.specialCooldown}R
              </span>
            ) : (
              <span className="text-[8px] font-mono text-cyan-300 font-bold">
                ESP OK
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const PawSlap = () => (
  <svg
    viewBox="0 0 64 64"
    className="absolute -right-[18%] top-[6%] w-[48%] h-[48%] animate-paw-slap pointer-events-none z-50 drop-shadow-lg"
    aria-hidden
  >
    <ellipse cx="24" cy="40" rx="16" ry="13" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
    <ellipse cx="14" cy="22" rx="6" ry="8" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.2" transform="rotate(-18 14 22)" />
    <ellipse cx="26" cy="16" rx="5.5" ry="8" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.2" />
    <ellipse cx="37" cy="20" rx="5.5" ry="7.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.2" transform="rotate(16 37 20)" />
    <ellipse cx="18" cy="42" rx="4" ry="3" fill="#fdba74" opacity="0.85" />
  </svg>
);

// Vector SVG renderer that matches the user's reference image for each cat
const CatArtRenderer: React.FC<{ catId: string; element: ElementType }> = ({ catId, element }) => {
  switch (catId) {
    case 'fire':
      return <FireCatArt />;
    case 'water':
      return <WaterCatArt />;
    case 'wind':
      return <WindCatArt />;
    case 'earth':
      return <EarthCatArt />;
    default:
      return <FireCatArt />;
  }
};

// FIRE CAT (Gato de Fogo): Orange/red muscular coat, blazing tail, flame paws, glowing amber eyes
const FireCatArt = () => (
  <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id="fireBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="50%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
      <linearGradient id="fireTailGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ea580c" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fef08a" />
      </linearGradient>
      <filter id="fireGlow">
        <feGaussianBlur stdDeviation="3" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Blazing Bushy Tail arching upward */}
    <path
      d="M 65 95 C 40 85 20 60 25 35 C 30 15 55 10 70 25 C 80 35 75 55 60 65 C 50 72 45 80 55 88 Z"
      fill="url(#fireTailGrad)"
      filter="url(#fireGlow)"
    />
    <path
      d="M 50 45 C 38 30 52 15 65 20 C 72 25 65 40 50 45 Z"
      fill="#fef08a"
    />
    {/* Dancing flame tongues on tail */}
    <path d="M 22 45 Q 12 35 26 28 Q 18 20 30 18" fill="none" stroke="#f59e0b" strokeWidth="3" />
    <path d="M 38 18 Q 45 8 55 12" fill="none" stroke="#fef08a" strokeWidth="2.5" />

    {/* Hind Leg Left */}
    <path d="M 70 95 Q 65 130 68 150 L 80 150 Q 82 135 88 115 Z" fill="#991b1b" />
    {/* Hind Leg Right */}
    <path d="M 90 95 Q 85 125 90 148 L 102 148 Q 106 125 110 100 Z" fill="#ea580c" />

    {/* Muscular Main Body */}
    <path
      d="M 75 95 C 85 85 120 80 145 85 C 165 90 175 105 170 120 C 145 130 100 128 75 95 Z"
      fill="url(#fireBodyGrad)"
    />

    {/* Flame Markings on Flank */}
    <path d="M 105 92 Q 115 102 108 115 Q 122 105 130 112" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 130 90 Q 140 98 135 110" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />

    {/* Foreleg Left */}
    <path d="M 140 105 Q 142 130 140 150 L 152 150 Q 155 130 155 110 Z" fill="#991b1b" />
    {/* Foreleg Right */}
    <path d="M 160 105 Q 165 128 168 150 L 180 150 Q 178 128 172 105 Z" fill="#ea580c" />

    {/* Flame Paws with golden flames */}
    <path d="M 64 148 Q 72 142 80 148" stroke="#facc15" strokeWidth="3" fill="none" />
    <path d="M 88 146 Q 96 140 104 146" stroke="#facc15" strokeWidth="3" fill="none" />
    <path d="M 138 148 Q 146 142 154 148" stroke="#facc15" strokeWidth="3" fill="none" />
    <path d="M 166 148 Q 174 142 182 148" stroke="#facc15" strokeWidth="3" fill="none" />

    {/* Head */}
    <path
      d="M 160 85 C 160 65 185 60 200 75 C 208 85 208 100 195 108 C 175 112 162 102 160 85 Z"
      fill="url(#fireBodyGrad)"
    />

    {/* Pointed Ears */}
    <polygon points="168,68 175,45 186,65" fill="#991b1b" />
    <polygon points="172,64 176,50 182,63" fill="#f59e0b" />
    <polygon points="188,68 200,48 205,70" fill="#991b1b" />
    <polygon points="191,65 198,53 201,67" fill="#f59e0b" />

    {/* Glowing Fierce Amber Eyes */}
    <polygon points="182,78 190,75 185,82" fill="#fef08a" filter="url(#fireGlow)" />
    <polygon points="196,80 204,78 199,84" fill="#fef08a" filter="url(#fireGlow)" />
    <line x1="186" y1="76" x2="186" y2="81" stroke="#451a03" strokeWidth="1.5" />
    <line x1="200" y1="78" x2="200" y2="83" stroke="#451a03" strokeWidth="1.5" />

    {/* Whiskers & Flame Brows */}
    <line x1="202" y1="92" x2="220" y2="90" stroke="#f59e0b" strokeWidth="1.5" />
    <line x1="202" y1="96" x2="218" y2="98" stroke="#f59e0b" strokeWidth="1.5" />
    <line x1="200" y1="100" x2="215" y2="106" stroke="#f59e0b" strokeWidth="1.5" />
  </svg>
);

// WATER CAT (Gato de Água): Azure blue and white coat, wave spiral tail, golden paws, luminous blue eyes
const WaterCatArt = () => (
  <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id="waterBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="60%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="waveTailGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="60%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>
      <filter id="waterGlow">
        <feGaussianBlur stdDeviation="2.5" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Cresting Tidal Wave Tail */}
    <path
      d="M 65 95 C 45 80 20 50 35 25 C 48 5 80 15 85 40 C 88 55 75 70 58 70 C 45 70 48 50 62 48 C 68 47 70 55 65 58 Z"
      fill="url(#waveTailGrad)"
      filter="url(#waterGlow)"
    />
    {/* Foam swirl accents */}
    <path d="M 40 28 Q 60 18 78 35" fill="none" stroke="#ffffff" strokeWidth="3" />
    <circle cx="82" cy="42" r="3.5" fill="#e0f2fe" />
    <circle cx="70" cy="22" r="2.5" fill="#e0f2fe" />
    <circle cx="32" cy="38" r="2" fill="#e0f2fe" />

    {/* Hind Leg Left */}
    <path d="M 72 95 Q 68 128 72 150 L 84 150 Q 86 130 92 110 Z" fill="#0284c7" />
    {/* Hind Leg Right */}
    <path d="M 94 95 Q 90 125 94 148 L 106 148 Q 110 125 114 100 Z" fill="#38bdf8" />

    {/* Main Slender Body */}
    <path
      d="M 75 95 C 90 85 125 80 148 85 C 168 90 175 105 170 120 C 145 130 100 128 75 95 Z"
      fill="url(#waterBodyGrad)"
    />

    {/* Deep blue ocean streak on the back */}
    <path
      d="M 85 88 Q 120 82 152 87 Q 140 98 115 96 Q 95 98 85 88 Z"
      fill="#0369a1"
    />

    {/* White Chest & Belly */}
    <path
      d="M 125 110 C 140 105 160 105 168 115 C 160 125 140 128 125 110 Z"
      fill="#f0f9ff"
    />

    {/* Foreleg Left */}
    <path d="M 142 105 Q 144 130 142 150 L 154 150 Q 157 130 157 110 Z" fill="#0284c7" />
    {/* Foreleg Right */}
    <path d="M 162 105 Q 166 128 168 150 L 180 150 Q 178 128 174 105 Z" fill="#38bdf8" />

    {/* Golden Yellow Paws */}
    <rect x="68" y="146" width="16" height="6" rx="3" fill="#facc15" />
    <rect x="90" y="144" width="16" height="6" rx="3" fill="#facc15" />
    <rect x="140" y="146" width="16" height="6" rx="3" fill="#facc15" />
    <rect x="166" y="146" width="16" height="6" rx="3" fill="#facc15" />

    {/* Head */}
    <path
      d="M 160 85 C 160 65 185 62 200 75 C 208 85 206 102 195 108 C 175 112 162 102 160 85 Z"
      fill="url(#waterBodyGrad)"
    />

    {/* Ears */}
    <polygon points="168,68 174,48 184,65" fill="#0284c7" />
    <polygon points="171,64 175,52 180,63" fill="#bae6fd" />
    <polygon points="188,68 198,50 204,70" fill="#0284c7" />
    <polygon points="191,65 197,54 200,67" fill="#bae6fd" />

    {/* Luminous Aqua-Blue Eyes */}
    <ellipse cx="184" cy="78" rx="4.5" ry="5.5" fill="#e0f2fe" filter="url(#waterGlow)" />
    <ellipse cx="198" cy="80" rx="4" ry="5" fill="#e0f2fe" filter="url(#waterGlow)" />
    <ellipse cx="184" cy="78" rx="2" ry="4" fill="#0369a1" />
    <ellipse cx="198" cy="80" rx="1.8" ry="3.5" fill="#0369a1" />

    {/* Whiskers */}
    <line x1="202" y1="92" x2="222" y2="88" stroke="#e0f2fe" strokeWidth="1.5" />
    <line x1="202" y1="95" x2="220" y2="96" stroke="#e0f2fe" strokeWidth="1.5" />
    <line x1="200" y1="98" x2="218" y2="104" stroke="#e0f2fe" strokeWidth="1.5" />
  </svg>
);

// WIND CAT (Gato de Vento): Silver/white fur, cloud cyclone tail, wing-like ear tufts, cyan eyes
const WindCatArt = () => (
  <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id="windBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="cloudTailGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
      <filter id="windGlow">
        <feGaussianBlur stdDeviation="2.5" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Billowing Cloud Cyclone Tail */}
    <path
      d="M 65 95 C 45 85 20 65 25 40 C 30 18 55 15 72 32 C 85 45 78 68 60 70 C 45 72 38 52 52 45 C 60 40 68 50 62 55 Z"
      fill="url(#cloudTailGrad)"
      filter="url(#windGlow)"
    />
    {/* Wind swirl curves on tail */}
    <path d="M 32 45 Q 40 25 60 28 Q 72 30 70 45" fill="none" stroke="#6ee7b7" strokeWidth="2.5" />
    <path d="M 45 58 Q 55 45 62 50" fill="none" stroke="#6ee7b7" strokeWidth="2" />

    {/* Hind Leg Left */}
    <path d="M 72 95 Q 68 128 72 150 L 84 150 Q 86 130 92 110 Z" fill="#94a3b8" />
    {/* Hind Leg Right */}
    <path d="M 94 95 Q 90 125 94 148 L 106 148 Q 110 125 114 100 Z" fill="#e2e8f0" />

    {/* Main Swift Body */}
    <path
      d="M 75 95 C 90 85 125 80 148 85 C 168 90 175 105 170 120 C 145 130 100 128 75 95 Z"
      fill="url(#windBodyGrad)"
    />

    {/* Wind Spirals on Flank */}
    <path d="M 108 95 Q 118 88 126 95 Q 120 105 110 102" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 125 102 Q 135 98 140 105" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />

    {/* Foreleg Left */}
    <path d="M 142 105 Q 144 130 142 150 L 154 150 Q 157 130 157 110 Z" fill="#94a3b8" />
    {/* Foreleg Right */}
    <path d="M 162 105 Q 166 128 168 150 L 180 150 Q 178 128 174 105 Z" fill="#e2e8f0" />

    {/* Golden/Sand Paws */}
    <rect x="68" y="146" width="16" height="6" rx="3" fill="#facc15" />
    <rect x="90" y="144" width="16" height="6" rx="3" fill="#facc15" />
    <rect x="140" y="146" width="16" height="6" rx="3" fill="#facc15" />
    <rect x="166" y="146" width="16" height="6" rx="3" fill="#facc15" />

    {/* Head */}
    <path
      d="M 160 85 C 160 65 185 62 200 75 C 208 85 206 102 195 108 C 175 112 162 102 160 85 Z"
      fill="url(#windBodyGrad)"
    />

    {/* Winged Ear Tufts */}
    <path d="M 168 65 L 160 42 Q 172 45 178 60 Z" fill="#e2e8f0" />
    <path d="M 172 58 L 165 46 Q 174 48 178 55 Z" fill="#6ee7b7" />
    <path d="M 188 65 L 202 44 Q 206 56 198 68 Z" fill="#cbd5e1" />
    <path d="M 190 62 L 199 48 Q 202 56 196 64 Z" fill="#6ee7b7" />

    {/* Feathered Cheek tufts flaring backward */}
    <path d="M 160 92 Q 150 90 148 82 Q 155 86 162 88" fill="#e2e8f0" />
    <path d="M 158 98 Q 146 98 144 92 Q 152 94 160 95" fill="#e2e8f0" />

    {/* Luminous Emerald Eyes */}
    <ellipse cx="184" cy="78" rx="4.5" ry="5.5" fill="#34d399" filter="url(#windGlow)" />
    <ellipse cx="198" cy="80" rx="4" ry="5" fill="#34d399" filter="url(#windGlow)" />
    <ellipse cx="184" cy="78" rx="2" ry="4" fill="#065f46" />
    <ellipse cx="198" cy="80" rx="1.8" ry="3.5" fill="#065f46" />

    {/* Whiskers */}
    <line x1="202" y1="92" x2="222" y2="88" stroke="#94a3b8" strokeWidth="1.5" />
    <line x1="202" y1="95" x2="220" y2="96" stroke="#94a3b8" strokeWidth="1.5" />
    <line x1="200" y1="98" x2="218" y2="104" stroke="#94a3b8" strokeWidth="1.5" />
  </svg>
);

// EARTH CAT (Gato de Terra): Mossy green-brown coat, craggy rock tail, root runes on legs, resolute gaze
const EarthCatArt = () => (
  <svg viewBox="0 0 240 180" className="w-full h-full drop-shadow-md">
    <defs>
      <linearGradient id="earthBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#84cc16" />
        <stop offset="50%" stopColor="#65a30d" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="rockTailGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="50%" stopColor="#a16207" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
    </defs>

    {/* Craggy Layered Rock Tail */}
    <polygon points="65,95 45,82 30,60 48,50 62,75" fill="#78350f" />
    <polygon points="48,50 25,40 15,22 35,15 50,35" fill="url(#rockTailGrad)" />
    <polygon points="35,15 22,5 40,2 52,18" fill="#ca8a04" />
    {/* Rock facets and fissures */}
    <line x1="30" y1="60" x2="48" y2="50" stroke="#451a03" strokeWidth="2" />
    <line x1="25" y1="40" x2="35" y2="15" stroke="#451a03" strokeWidth="2" />

    {/* Hind Leg Left */}
    <path d="M 72 95 Q 68 128 72 150 L 86 150 Q 88 130 94 110 Z" fill="#451a03" />
    {/* Hind Leg Right */}
    <path d="M 94 95 Q 90 125 94 148 L 108 148 Q 112 125 116 100 Z" fill="#78350f" />

    {/* Sturdy Broad Body */}
    <path
      d="M 75 95 C 90 82 125 78 150 82 C 172 88 180 105 174 122 C 148 132 100 130 75 95 Z"
      fill="url(#earthBodyGrad)"
    />

    {/* Foreleg Left */}
    <path d="M 144 105 Q 146 130 144 150 L 158 150 Q 161 130 161 110 Z" fill="#451a03" />
    {/* Foreleg Right */}
    <path d="M 164 105 Q 168 128 170 150 L 184 150 Q 182 128 176 105 Z" fill="#78350f" />

    {/* Golden Root / Magma Veins on Legs */}
    <path d="M 72 135 Q 76 142 74 148" stroke="#eab308" strokeWidth="2" fill="none" />
    <path d="M 94 130 Q 98 138 96 146" stroke="#eab308" strokeWidth="2.5" fill="none" />
    <path d="M 146 130 Q 152 140 148 148" stroke="#eab308" strokeWidth="2.5" fill="none" />
    <path d="M 170 128 Q 174 138 172 148" stroke="#eab308" strokeWidth="2.5" fill="none" />

    {/* Golden Paws */}
    <rect x="68" y="146" width="18" height="6" rx="3" fill="#ca8a04" />
    <rect x="90" y="144" width="18" height="6" rx="3" fill="#ca8a04" />
    <rect x="140" y="146" width="18" height="6" rx="3" fill="#ca8a04" />
    <rect x="166" y="146" width="18" height="6" rx="3" fill="#ca8a04" />

    {/* Resolute Head */}
    <path
      d="M 162 85 C 162 64 186 60 202 72 C 212 82 210 102 198 110 C 176 114 164 104 162 85 Z"
      fill="#78350f"
    />

    {/* Sturdy Ears */}
    <polygon points="170,68 178,48 186,65" fill="#451a03" />
    <polygon points="173,64 178,53 183,63" fill="#ca8a04" />
    <polygon points="190,68 200,50 206,70" fill="#451a03" />
    <polygon points="193,65 199,55 202,67" fill="#ca8a04" />

    {/* Stern Brow & Glowing Amber Eyes */}
    <line x1="178" y1="74" x2="190" y2="76" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="194" y1="76" x2="204" y2="74" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />

    <polygon points="182,78 189,76 186,83" fill="#facc15" />
    <polygon points="196,78 203,76 200,83" fill="#facc15" />
    <line x1="185" y1="77" x2="185" y2="82" stroke="#451a03" strokeWidth="1.5" />
    <line x1="199" y1="77" x2="199" y2="82" stroke="#451a03" strokeWidth="1.5" />

    {/* Whiskers */}
    <line x1="202" y1="92" x2="220" y2="90" stroke="#ca8a04" strokeWidth="1.5" />
    <line x1="202" y1="96" x2="218" y2="98" stroke="#ca8a04" strokeWidth="1.5" />
    <line x1="200" y1="100" x2="215" y2="106" stroke="#ca8a04" strokeWidth="1.5" />
  </svg>
);
