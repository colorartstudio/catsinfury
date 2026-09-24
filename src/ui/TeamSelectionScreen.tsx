import React from 'react';
import { BaseCatStats, ElementType } from '../types';
import { CAT_CHARACTERS, calculateTeamSynergy } from '../data/characters';
import { AudioManager } from '../audio/AudioManager';
import { Flame, Droplet, Wind, Mountain, Shield, Zap, Sparkles, Check, ArrowRight, Heart, Swords, Award } from 'lucide-react';

interface TeamSelectionScreenProps {
  selectedCatIds: string[];
  onToggleCat: (catId: string) => void;
  onConfirmTeam: () => void;
  onBack: () => void;
}

export const TeamSelectionScreen: React.FC<TeamSelectionScreenProps> = ({
  selectedCatIds,
  onToggleCat,
  onConfirmTeam,
  onBack,
}) => {
  const cats = Object.values(CAT_CHARACTERS);

  // Compute synergy based on selected team
  const selectedElements = selectedCatIds.map((id) => CAT_CHARACTERS[id].element);
  const synergy = calculateTeamSynergy(selectedElements);

  const getElementBadge = (el: ElementType) => {
    switch (el) {
      case 'FOGO':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/50">
            <Flame className="w-3.5 h-3.5" /> FOGO
          </span>
        );
      case 'ÁGUA':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-400 border border-sky-500/50">
            <Droplet className="w-3.5 h-3.5" /> ÁGUA
          </span>
        );
      case 'VENTO':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/50">
            <Wind className="w-3.5 h-3.5" /> VENTO
          </span>
        );
      case 'TERRA':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/50">
            <Mountain className="w-3.5 h-3.5" /> TERRA
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto bg-[#090b10] text-slate-100 p-4 sm:p-6 flex flex-col">
      {/* Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-wide">
            FORME SUA EQUIPE
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Selecione 3 gatos elementais para entrar na arena de combate. ({selectedCatIds.length}/3)
          </p>
        </div>

        <button
          onClick={() => {
            AudioManager.playClick();
            onBack();
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold transition"
        >
          Voltar
        </button>
      </div>

      {/* Real-time Team Synergy Banner */}
      <div className="max-w-6xl w-full mx-auto my-4 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/80 border border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-300 font-mono uppercase tracking-wider">
                Sinergia Elemental
              </span>
              <span className="text-sm font-heading font-bold text-white">
                {synergy.name}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {synergy.description}
            </p>
          </div>
        </div>

        {/* Selected preview slots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((idx) => {
            const catId = selectedCatIds[idx];
            const cat = catId ? CAT_CHARACTERS[catId] : null;

            return (
              <div
                key={idx}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-heading text-xs font-bold transition-all ${
                  cat
                    ? 'border-amber-400 bg-slate-800/90 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'border-dashed border-slate-700 bg-slate-900/50 text-slate-600'
                }`}
              >
                {cat ? cat.name.split(' ')[0][0] : idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-2 flex-1">
        {cats.map((cat) => {
          const isSelected = selectedCatIds.includes(cat.id);

          return (
            <div
              key={cat.id}
              onClick={() => {
                AudioManager.playSelect();
                onToggleCat(cat.id);
              }}
              className={`relative rounded-3xl p-5 cursor-pointer border-2 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 bg-slate-900/90 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.02]'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg animate-fade-in font-bold">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">Nível 1</span>
                  {getElementBadge(cat.element)}
                </div>

                <h3 className="text-xl font-heading font-bold text-white mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {cat.description}
                </p>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 mb-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <Heart className="w-3.5 h-3.5" />
                    <span>HP: {cat.baseHp}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Swords className="w-3.5 h-3.5" />
                    <span>ATK: {cat.baseAtk}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>DEF: {cat.baseDef}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>VEL: {cat.speed}</span>
                  </div>
                </div>
              </div>

              {/* Special and Passive Info */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                <div>
                  <span className="font-heading font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {cat.specialName}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {cat.specialDescription}
                  </p>
                </div>
                <div>
                  <span className="font-heading font-bold text-indigo-300">
                    Passiva: {cat.passiveName}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {cat.passiveDescription}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <div className="max-w-6xl w-full mx-auto pt-4 pb-2 flex items-center justify-between border-t border-slate-800">
        <span className="text-xs font-mono text-slate-400">
          {selectedCatIds.length === 3 ? (
            <span className="text-emerald-400 font-bold">Equipe completa e pronta para combate!</span>
          ) : (
            `Escolha mais ${3 - selectedCatIds.length} personagem(ns)`
          )}
        </span>

        <button
          disabled={selectedCatIds.length !== 3}
          onClick={() => {
            AudioManager.playClick();
            onConfirmTeam();
          }}
          className={`px-6 py-3 rounded-2xl font-heading font-bold text-sm tracking-wider uppercase transition-all flex items-center gap-2 ${
            selectedCatIds.length === 3
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer active:scale-98'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          <span>Escolher Arena</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
