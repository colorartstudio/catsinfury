import React, { useState } from 'react';
import { AudioManager } from '../audio/AudioManager';
import { Zap } from 'lucide-react';

interface InitiativeModalProps {
  round: number;
  isChaosActive: boolean;
  playerAvgSpeed: number;
  botAvgSpeed: number;
  onBidSubmitted: (playerBid: number, botBid: number) => void;
}

export const InitiativeModal: React.FC<InitiativeModalProps> = ({
  round,
  isChaosActive,
  playerAvgSpeed,
  botAvgSpeed,
  onBidSubmitted,
}) => {
  const [selectedBid, setSelectedBid] = useState<number>(1);

  const handleSubmit = (bid: number) => {
    AudioManager.playClick();
    // Bot chooses bid (0 to 3) based on its speed comparison
    let botBid = Math.floor(Math.random() * 4);
    if (botAvgSpeed < playerAvgSpeed && Math.random() > 0.4) {
      botBid = Math.min(3, botBid + 1); // Bot bids higher to catch up
    }
    onBidSubmitted(bid, botBid);
  };

  return (
    <div className="fixed inset-0 z-45 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-slate-900/95 border-2 border-amber-500/60 rounded-3xl p-6 flex flex-col items-center shadow-[0_0_40px_rgba(245,158,11,0.3)]">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-amber-400" />
        </div>

        <h3 className="text-xl font-heading font-bold text-white mb-1">
          APOSTA DE INICIATIVA
        </h3>

        <p className="text-xs text-slate-300 text-center mb-4">
          {isChaosActive ? (
            <span className="text-purple-400 font-bold">
              🌀 Efeito CAOS ativo: Menor pontuação ataca primeiro!
            </span>
          ) : (
            <span>
              Escolha sua aposta de 0 a 3. Quem tiver o maior valor (ou desempate por velocidade) ataca primeiro!
            </span>
          )}
        </p>

        <div className="w-full bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex justify-between mb-5">
          <div>Velocidade Média Aliada: <span className="font-bold text-emerald-400">{playerAvgSpeed}</span></div>
          <div>Inimigo: <span className="font-bold text-rose-400">{botAvgSpeed}</span></div>
        </div>

        {/* 0 to 3 bid buttons */}
        <div className="grid grid-cols-4 gap-2.5 w-full mb-5">
          {[0, 1, 2, 3].map((bid) => (
            <button
              key={bid}
              onClick={() => {
                setSelectedBid(bid);
                AudioManager.playSelect();
              }}
              className={`py-3 rounded-xl font-heading font-bold text-lg transition-all border ${
                selectedBid === bid
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-105'
                  : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700/80'
              }`}
            >
              +{bid}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleSubmit(selectedBid)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-heading font-bold text-sm tracking-wider uppercase transition-all shadow-lg active:scale-98"
        >
          Confirmar Aposta ({selectedBid})
        </button>
      </div>
    </div>
  );
};
