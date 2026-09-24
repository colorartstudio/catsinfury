import React, { useRef, useEffect } from 'react';
import { CombatLogEntry } from '../types';
import { Flame, Droplet, Wind, Shield, Zap, Sparkles } from 'lucide-react';

interface CombatLogProps {
  logs: CombatLogEntry[];
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const renderIcon = (type: CombatLogEntry['type']) => {
    switch (type) {
      case 'damage':
        return <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'crit':
        return <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
      case 'heal':
        return <Droplet className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'shield':
        return <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'dodge':
        return <Wind className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
      case 'burn':
        return <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800/80 p-2.5 shadow-xl">
      <div className="flex items-center justify-between px-1 mb-1 border-b border-slate-800/60 pb-1">
        <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">
          Log de Batalha
        </span>
        <span className="text-[9px] font-mono text-slate-500">
          Últimos Eventos
        </span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-20 sm:max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 text-[11px] italic text-center py-2">
            A batalha está prestes a começar...
          </div>
        ) : (
          logs.slice(-15).map((log) => (
            <div
              key={log.id}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all ${
                log.type === 'crit'
                  ? 'bg-amber-950/50 text-amber-200 border border-amber-500/40 font-bold'
                  : log.type === 'heal'
                  ? 'bg-sky-950/40 text-sky-200'
                  : log.type === 'dodge'
                  ? 'bg-emerald-950/40 text-emerald-200'
                  : log.type === 'shield'
                  ? 'bg-cyan-950/40 text-cyan-200'
                  : 'text-slate-300'
              }`}
            >
              {renderIcon(log.type)}
              <span className="truncate">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
