import React from 'react';
import { AudioManager } from '../audio/AudioManager';
import { Play, Users, BookOpen, MapPin, User, Settings, Volume2, VolumeX, Shield, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onPlay: () => void;
  onSelectTeam: () => void;
  onOpenAlmanac: () => void;
  onOpenArenas: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onPlay,
  onSelectTeam,
  onOpenAlmanac,
  onOpenArenas,
  onOpenProfile,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#090b10] flex flex-col justify-between p-6 select-none">
      {/* Dynamic Background aura */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950/80 to-[#090b10]" />
      </div>

      {/* Top Bar with Audio & Settings */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>BATTLE ARENA MVP • v1.0.0</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onToggleMute();
            }}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shadow-lg"
            title={isMuted ? 'Desmutar Áudio' : 'Mutar Áudio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              AudioManager.playClick();
              onOpenSettings();
            }}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shadow-lg"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Branding & Title */}
      <div className="relative z-10 max-w-4xl w-full mx-auto flex flex-col items-center text-center my-auto py-8">
        {/* Emblem */}
        <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 rounded-3xl rotate-12 blur-lg opacity-60 animate-pulse" />
          <div className="relative w-20 h-20 bg-slate-900/90 rounded-2xl border-2 border-amber-400 flex items-center justify-center shadow-2xl">
            <span className="text-4xl">🐱</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 drop-shadow-[0_5px_15px_rgba(245,158,11,0.4)]">
          CATS IN FURY
        </h1>

        <h2 className="text-base sm:text-xl font-heading font-bold text-cyan-300 tracking-[0.25em] uppercase mt-1 mb-8 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
          BATTLE ARENA
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
        </h2>

        {/* Primary Play Button */}
        <button
          onClick={() => {
            AudioManager.playAttack('FOGO');
            onPlay();
          }}
          className="group relative px-12 py-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-heading font-extrabold text-xl tracking-wider uppercase transition-all duration-300 shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:shadow-[0_0_50px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>JOGAR AGORA</span>
        </button>

        {/* Navigation Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 w-full max-w-2xl">
          <button
            onClick={() => {
              AudioManager.playClick();
              onSelectTeam();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-slate-200 text-xs sm:text-sm font-heading font-semibold transition hover:border-indigo-500/50 shadow-md"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>TIME</span>
          </button>

          <button
            onClick={() => {
              AudioManager.playClick();
              onOpenAlmanac();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-slate-200 text-xs sm:text-sm font-heading font-semibold transition hover:border-indigo-500/50 shadow-md"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>GATOS</span>
          </button>

          <button
            onClick={() => {
              AudioManager.playClick();
              onOpenArenas();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-slate-200 text-xs sm:text-sm font-heading font-semibold transition hover:border-indigo-500/50 shadow-md"
          >
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>ARENAS</span>
          </button>

          <button
            onClick={() => {
              AudioManager.playClick();
              onOpenProfile();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-slate-200 text-xs sm:text-sm font-heading font-semibold transition hover:border-indigo-500/50 shadow-md"
          >
            <User className="w-4 h-4 text-sky-400" />
            <span>PERFIL</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-900/80 pt-4">
        <div>
          PvP RPG 1v1 • Sistema por Turnos, Roleta Elemental &amp; Física Procedural
        </div>
        <div className="flex items-center gap-3">
          <span>🔥 FOGO</span>
          <span>💧 ÁGUA</span>
          <span>🌪️ VENTO</span>
          <span>🪨 TERRA</span>
        </div>
      </div>
    </div>
  );
};
