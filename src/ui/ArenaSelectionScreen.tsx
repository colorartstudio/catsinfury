import React from 'react';
import { ArenaDefinition, BotDifficulty } from '../types';
import { ARENAS } from '../data/arenas';
import { AudioManager } from '../audio/AudioManager';
import { ArrowLeft, Play, ShieldAlert, Zap } from 'lucide-react';

interface ArenaSelectionScreenProps {
  selectedArena: ArenaDefinition;
  onSelectArena: (arena: ArenaDefinition) => void;
  botDifficulty: BotDifficulty;
  onSelectDifficulty: (diff: BotDifficulty) => void;
  onStartBattle: () => void;
  onBack: () => void;
}

export const ArenaSelectionScreen: React.FC<ArenaSelectionScreenProps> = ({
  selectedArena,
  onSelectArena,
  botDifficulty,
  onSelectDifficulty,
  onStartBattle,
  onBack,
}) => {
  return (
    <div className="w-full h-full min-h-screen overflow-y-auto bg-[#090b10] text-slate-100 p-4 sm:p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              AudioManager.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-wide">
              ESCOLHA A ARENA
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Cada ambiente altera os poderes elementais e as propriedades de combate.
            </p>
          </div>
        </div>

        {/* Bot difficulty selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 pl-2 hidden sm:inline">
            Dificuldade do Bot:
          </span>
          {(['EASY', 'NORMAL', 'HARD'] as BotDifficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => {
                AudioManager.playSelect();
                onSelectDifficulty(diff);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-heading font-bold transition-all ${
                botDifficulty === diff
                  ? diff === 'HARD'
                    ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                    : diff === 'NORMAL'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Arenas Grid */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        {ARENAS.map((arena) => {
          const isSelected = selectedArena.id === arena.id;

          return (
            <div
              key={arena.id}
              onClick={() => {
                AudioManager.playSelect();
                onSelectArena(arena);
              }}
              className={`group relative rounded-3xl p-6 cursor-pointer border-2 transition-all flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'border-amber-400 bg-slate-900/90 shadow-[0_0_30px_rgba(245,158,11,0.3)] scale-[1.02]'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Background ambient gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${arena.bgGradient} opacity-30 group-hover:opacity-45 transition pointer-events-none`}
              />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center text-3xl mb-4 shadow-inner">
                  {arena.icon}
                </div>

                <h3 className="text-xl font-heading font-bold text-white mb-2">
                  {arena.name}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {arena.description}
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Partículas: {arena.ambientParticles}
                </span>

                {isSelected ? (
                  <span className="text-xs font-heading font-bold text-amber-400 flex items-center gap-1">
                    SELECIONADA
                  </span>
                ) : (
                  <span className="text-xs font-heading text-slate-500 group-hover:text-slate-300">
                    Escolher
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Battle Bar */}
      <div className="max-w-5xl w-full mx-auto pt-4 pb-2 flex items-center justify-between border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="text-xl">{selectedArena.icon}</span>
          <span>Arena: <strong className="text-white">{selectedArena.name}</strong></span>
          <span className="text-slate-500">•</span>
          <span>Bot: <strong className="text-amber-400">{botDifficulty}</strong></span>
        </div>

        <button
          onClick={() => {
            AudioManager.playAttack('FOGO');
            onStartBattle();
          }}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-heading font-bold text-base tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-98 flex items-center gap-2 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Iniciar Combate</span>
        </button>
      </div>
    </div>
  );
};
