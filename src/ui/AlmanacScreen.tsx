import React, { useState } from 'react';
import { CAT_CHARACTERS } from '../data/characters';
import { AudioManager } from '../audio/AudioManager';
import { CatRenderer } from '../characters/CatRenderer';
import { BattleEngine } from '../combat/BattleEngine';
import { ArrowLeft, Sparkles, Shield, Flame, Swords, Heart, Zap, BookOpen } from 'lucide-react';

interface AlmanacScreenProps {
  onBack: () => void;
}

export const AlmanacScreen: React.FC<AlmanacScreenProps> = ({ onBack }) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('fire');
  const cat = CAT_CHARACTERS[selectedCatId];

  // Dummy combatant for preview
  const previewCombatant = BattleEngine.createCombatant(cat, 'player', 0);

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
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-wide flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              CHARACTER BIBLE & ALMANAQUE
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Guia canônico dos 4 gatos elementais, atributos, balanceamento e animações.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1">
        {/* Cat Selector Tabs */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {Object.values(CAT_CHARACTERS).map((c) => {
            const isSelected = c.id === selectedCatId;

            return (
              <button
                key={c.id}
                onClick={() => {
                  AudioManager.playSelect();
                  setSelectedCatId(c.id);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase">
                    Elemento {c.element}
                  </div>
                  <div className="text-lg font-heading font-bold text-white">
                    {c.name}
                  </div>
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950"
                  style={{ backgroundColor: c.avatarColor }}
                >
                  {c.element[0]}
                </div>
              </button>
            );
          })}

          {/* Elemental Cycle Chart */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 mt-2">
            <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2">
              Ciclo Elemental
            </h4>
            <div className="text-xs font-mono text-slate-300 space-y-1 leading-relaxed">
              <div className="text-sky-400">💧 Água → Vence Fogo (+25% / -15%)</div>
              <div className="text-orange-400">🔥 Fogo → Vence Vento (+25% / -15%)</div>
              <div className="text-emerald-400">🌪️ Vento → Vence Terra (+25% / -15%)</div>
              <div className="text-yellow-400">🪨 Terra → Vence Água (+25% / -15%)</div>
            </div>
          </div>
        </div>

        {/* Cat Profile Card */}
        <div className="lg:col-span-8 bg-slate-950/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            {/* Visual Live Preview */}
            <div className="w-full h-48 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
              <div className="scale-125">
                <CatRenderer cat={previewCombatant} flipX />
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-heading font-bold text-white">
                {cat.name}
              </h3>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full text-slate-950"
                style={{ backgroundColor: cat.avatarColor }}
              >
                {cat.element}
              </span>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {cat.description}
            </p>

            {/* Base Stats Matrix */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">HP</div>
                <div className="text-base font-heading font-bold text-rose-400">{cat.baseHp}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">ATK</div>
                <div className="text-base font-heading font-bold text-amber-400">{cat.baseAtk}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">DEF</div>
                <div className="text-base font-heading font-bold text-cyan-400">{cat.baseDef}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">VEL</div>
                <div className="text-base font-heading font-bold text-emerald-400">{cat.speed}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">ESQUIVA</div>
                <div className="text-base font-heading font-bold text-teal-400">{cat.baseDodge}%</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono">CRÍTICO</div>
                <div className="text-base font-heading font-bold text-yellow-400">{cat.baseCrit}%</div>
              </div>
            </div>

            {/* Skills & Mechanics */}
            <div className="space-y-3">
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-xs font-heading font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> ESPECIAL: {cat.specialName} (CD: {cat.specialCooldownMax} Rodadas)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cat.specialDescription}
                </p>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-xs font-heading font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> PASSIVA: {cat.passiveName}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cat.passiveDescription}
                </p>
              </div>

              {/* ⚡ PODER DE DESESPERO (≤ 10% HP) */}
              <div className="bg-gradient-to-r from-rose-950/70 via-red-950/50 to-slate-900/90 p-3.5 rounded-2xl border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                <div className="text-xs font-heading font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-300 fill-current animate-pulse" />
                  <span>PODER DESTRUTIVO (≤ 10% HP): {cat.desperationName} (2x Dano)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {cat.desperationDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Arquitetura aberta: Novos sprites ou arquivos em /audio/ podem ser conectados diretamente sem alterar a lógica de combate.
          </div>
        </div>
      </div>
    </div>
  );
};
