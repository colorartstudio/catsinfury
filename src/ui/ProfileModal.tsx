import React from 'react';
import { AudioManager } from '../audio/AudioManager';
import { CAT_CHARACTERS } from '../data/characters';
import { Trophy, Award, Zap, X, ShieldCheck } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    matchesPlayed: number;
    victories: number;
    defeats: number;
    totalXp: number;
    catLevels: Record<string, number>;
    catXp: Record<string, number>;
  };
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const winrate = stats.matchesPlayed > 0
    ? Math.round((stats.victories / stats.matchesPlayed) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-heading font-bold text-white">
              PERFIL DE COMBATENTE
            </h3>
          </div>
          <button
            onClick={() => {
              AudioManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-4 gap-2 my-5 text-center">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400">PARTIDAS</div>
            <div className="text-lg font-heading font-bold text-white">{stats.matchesPlayed}</div>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400">VITÓRIAS</div>
            <div className="text-lg font-heading font-bold text-emerald-400">{stats.victories}</div>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400">TAXA VIT.</div>
            <div className="text-lg font-heading font-bold text-amber-400">{winrate}%</div>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400">XP TOTAL</div>
            <div className="text-lg font-heading font-bold text-indigo-400">{stats.totalXp}</div>
          </div>
        </div>

        {/* Cat Levels and Progression */}
        <h4 className="text-xs font-heading font-bold text-slate-400 uppercase tracking-wider mb-3">
          Progressão dos Gatos Elementais (Máx: Nível 30)
        </h4>

        <div className="space-y-3 mb-6">
          {Object.values(CAT_CHARACTERS).map((cat) => {
            const level = stats.catLevels[cat.id] || 1;
            const xp = stats.catXp[cat.id] || 0;
            const xpForNextLevel = 1000;
            const currentLevelXp = xp % 1000;
            const progress = (currentLevelXp / xpForNextLevel) * 100;

            return (
              <div key={cat.id} className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-heading font-bold text-white">
                      {cat.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold text-slate-900" style={{ backgroundColor: cat.avatarColor }}>
                      {cat.element}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-amber-400 font-bold">
                    Nível {level}
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1">
                  <span>{currentLevelXp} / {xpForNextLevel} XP</span>
                  <span>+{level - 1}% ATK/DEF, +{(level - 1) * 2}% HP</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supabase Multiplayer Notice */}
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            Arquitetura desacoplada: Pronta para autenticação, sincronização na nuvem e matchmaking online via Supabase.
          </span>
        </div>
      </div>
    </div>
  );
};
