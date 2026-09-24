import React from 'react';
import { AudioManager } from '../audio/AudioManager';
import { BotDifficulty } from '../types';
import { Settings, X, Volume2, VolumeX, Cpu, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  botDifficulty: BotDifficulty;
  onSelectDifficulty: (diff: BotDifficulty) => void;
  lowPerfMode: boolean;
  onToggleLowPerfMode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  botDifficulty,
  onSelectDifficulty,
  lowPerfMode,
  onToggleLowPerfMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-heading font-bold text-white">
              CONFIGURAÇÕES
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

        <div className="space-y-5 my-5">
          {/* Audio Settings */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div>
              <div className="text-sm font-heading font-bold text-white">
                Áudio e Efeitos Sonoros
              </div>
              <div className="text-xs text-slate-400">
                Sintetizador procedural + biblioteca elemental
              </div>
            </div>
            <button
              onClick={() => {
                onToggleMute();
              }}
              className={`p-2.5 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/50'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
              }`}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Bot Difficulty Settings */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="text-sm font-heading font-bold text-white mb-1">
              Dificuldade do Bot Oponente
            </div>
            <div className="text-xs text-slate-400 mb-3">
              Controla inteligência tática, alvos e escolha de escudos
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['EASY', 'NORMAL', 'HARD'] as BotDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    AudioManager.playSelect();
                    onSelectDifficulty(diff);
                  }}
                  className={`py-2 rounded-xl text-xs font-heading font-bold transition-all border ${
                    botDifficulty === diff
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Optimization Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div>
              <div className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Modo Otimizado (Mobile)</span>
              </div>
              <div className="text-xs text-slate-400">
                Reduz densidade de partículas para máxima fluidez a 60 FPS
              </div>
            </div>

            <button
              onClick={() => {
                AudioManager.playClick();
                onToggleLowPerfMode();
              }}
              className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${
                lowPerfMode ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            AudioManager.playClick();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-heading font-bold text-sm tracking-wider uppercase transition"
        >
          Concluir
        </button>
      </div>
    </div>
  );
};
