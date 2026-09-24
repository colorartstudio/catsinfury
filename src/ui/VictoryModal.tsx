import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { AudioManager } from '../audio/AudioManager';
import { CatCombatant, TeamSynergy } from '../types';
import { Trophy, Skull, RotateCcw, Home, Award, Sparkles, Star, Flame, ShieldAlert } from 'lucide-react';

interface VictoryModalProps {
  isVictory: boolean;
  roundsSurvived: number;
  earnedXp: number;
  playerTeam: CatCombatant[];
  synergy: TeamSynergy;
  onRematch: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isVictory,
  roundsSurvived,
  earnedXp,
  playerTeam,
  synergy,
  onRematch,
  onHome,
}) => {
  const [animatedXp, setAnimatedXp] = useState<number>(0);
  const livingCats = playerTeam.filter((c) => c.isAlive);

  useEffect(() => {
    // 1. Play sound immediately
    if (isVictory) {
      AudioManager.playVictory();

      // Confetti Cannon 1 (Center burst)
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#ef4444', '#38bdf8', '#10b981'],
        zIndex: 9999,
      });

      // Confetti Cannon 2 (Left side)
      const t1 = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.7 },
          colors: ['#f59e0b', '#10b981', '#ffffff'],
          zIndex: 9999,
        });
      }, 350);

      // Confetti Cannon 3 (Right side)
      const t2 = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.7 },
          colors: ['#38bdf8', '#fbbf24', '#f43f5e'],
          zIndex: 9999,
        });
      }, 700);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      AudioManager.playDefeat();
    }
  }, [isVictory]);

  // XP Count-up effect
  useEffect(() => {
    if (earnedXp <= 0) return;
    const duration = 1200; // ms
    const startTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedXp(Math.round(ease * earnedXp));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [earnedXp]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Dynamic Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isVictory
            ? 'bg-slate-950/85 backdrop-blur-md'
            : 'bg-black/90 backdrop-blur-md'
        }`}
      />

      {/* Atmospheric Background FX */}
      {isVictory ? (
        // Rotating Sunburst Glory Rays for Victory
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-30">
          <div
            className="w-[800px] h-[800px] sm:w-[1100px] sm:h-[1100px] rounded-full animate-sunburst"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.4) 15deg, transparent 30deg, rgba(234,179,8,0.4) 45deg, transparent 60deg, rgba(245,158,11,0.4) 75deg, transparent 90deg, rgba(234,179,8,0.4) 105deg, transparent 120deg, rgba(245,158,11,0.4) 135deg, transparent 150deg, rgba(234,179,8,0.4) 165deg, transparent 180deg, rgba(245,158,11,0.4) 195deg, transparent 210deg, rgba(234,179,8,0.4) 225deg, transparent 240deg, rgba(245,158,11,0.4) 255deg, transparent 270deg, rgba(234,179,8,0.4) 285deg, transparent 300deg, rgba(245,158,11,0.4) 315deg, transparent 330deg, rgba(234,179,8,0.4) 345deg, transparent 360deg)',
            }}
          />
        </div>
      ) : (
        // Crimson Vignette Pulse for Defeat
        <div className="absolute inset-0 pointer-events-none animate-pulse-crimson" />
      )}

      {/* Main Animated Modal Card */}
      <div
        className={`relative max-w-md w-full rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center border-2 z-10 ${
          isVictory
            ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/95 to-amber-950/40 border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.45)] animate-modal-pop'
            : 'bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-rose-950/60 border-rose-600/80 shadow-[0_0_60px_rgba(225,29,72,0.45)] animate-defeat-slam'
        }`}
      >
        {/* Floating Decorative Elements */}
        {isVictory && (
          <>
            <Sparkles className="absolute -top-3 -left-2 w-8 h-8 text-yellow-300 animate-bounce" />
            <Star className="absolute -top-3 -right-2 w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          </>
        )}

        {/* Central Trophy / Skull Emblem */}
        <div className="relative mb-3 mt-1">
          {isVictory ? (
            <div className="relative flex items-center justify-center">
              {/* Golden Ring Glow */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 opacity-40 blur-lg animate-pulse" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.8)] animate-crown-glow">
                <Trophy className="w-11 h-11 sm:w-13 sm:h-13 text-slate-950 drop-shadow-md animate-bounce" />
              </div>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Crimson Ring Glow */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-rose-600 to-red-900 opacity-50 blur-lg animate-pulse" />
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-rose-900 via-rose-700 to-red-500 border-2 border-rose-400/80 flex items-center justify-center shadow-[0_0_35px_rgba(225,29,72,0.7)]">
                <Skull className="w-11 h-11 sm:w-13 sm:h-13 text-white drop-shadow-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-3xl sm:text-4xl font-display font-bold tracking-wider mb-1 uppercase ${
            isVictory
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-500 to-rose-600 drop-shadow-[0_2px_12px_rgba(225,29,72,0.6)]'
          }`}
        >
          {isVictory ? 'VITÓRIA GLORIOSA!' : 'DERROTA NA ARENA'}
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-300 mb-4 max-w-[320px]">
          {isVictory
            ? 'Sua maestria elemental superou o adversário na arena!'
            : 'Sua equipe caiu em combate. Reagrupe sua estratégia e tente de novo!'}
        </p>

        {/* XP and Rewards Breakdown Box */}
        <div className="w-full bg-slate-950/90 rounded-2xl border border-slate-800/90 p-3 sm:p-4 mb-4 text-left shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
            <span className="text-xs font-heading font-bold text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Recompensas da Batalha
            </span>
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg font-heading font-bold text-amber-400">
                +{animatedXp}
              </span>
              <span className="text-xs font-mono text-amber-300/80 font-semibold">XP</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Sobrevivência Básica:</span>
              <span className="text-white">+50 XP</span>
            </div>
            <div className="flex justify-between">
              <span>Rodadas Disputadas ({roundsSurvived}x):</span>
              <span className="text-white">+{roundsSurvived * 10} XP</span>
            </div>
            {isVictory && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Bônus de Triunfo:</span>
                <span>+100 XP</span>
              </div>
            )}
            {synergy.xpBonus > 0 && (
              <div className="flex justify-between text-indigo-400 font-bold">
                <span>Sinergia Elemental:</span>
                <span>+{Math.round(synergy.xpBonus * 100)}%</span>
              </div>
            )}
          </div>

          {/* Survivor Cats Badge Row */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-heading">
              Gatos da Equipe ({livingCats.length}/3 vivos):
            </span>
            <div className="flex gap-1.5">
              {playerTeam.map((c) => (
                <span
                  key={c.instanceId}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition ${
                    c.isAlive
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900/80 text-slate-600 border-slate-800 line-through opacity-60'
                  }`}
                >
                  {c.baseStats.name.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {/* Rematch Button */}
          <button
            onClick={() => {
              AudioManager.playClick();
              onRematch();
            }}
            className={`py-3 px-3 rounded-2xl font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 hover:scale-[1.02] ${
              isVictory
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300'
                : 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)] border border-rose-400'
            }`}
          >
            <RotateCcw className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Revanche</span>
          </button>

          {/* Menu Button */}
          <button
            onClick={() => {
              AudioManager.playClick();
              onHome();
            }}
            className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95 hover:scale-[1.02]"
          >
            <Home className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
