import React, { useState, useEffect, useRef } from 'react';
import { RouletteSector } from '../types';
import { ROULETTE_SECTORS } from '../data/roulette';
import { AudioManager } from '../audio/AudioManager';
import { Sparkles, Play } from 'lucide-react';

interface RouletteWheelProps {
  onSpinComplete: (sector: RouletteSector) => void;
  isOpen: boolean;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({ onSpinComplete, isOpen }) => {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<RouletteSector | null>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const numSectors = ROULETTE_SECTORS.length;
  const sectorAngle = 360 / numSectors; // 45 degrees per sector
  const timeoutsRef = useRef<number[]>([]);

  // Clear timeouts helper
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setHasStarted(true);
    setSelectedSector(null);
    clearAllTimeouts();

    // 1. Choose a random sector
    const targetIndex = Math.floor(Math.random() * numSectors);
    const chosenSector = ROULETTE_SECTORS[targetIndex];

    // 2. Math for exact alignment to top needle:
    // Sector i extends from [i * sectorAngle] to [(i + 1) * sectorAngle].
    // Midpoint is (i + 0.5) * sectorAngle.
    // In SVG space, 0 deg is +X (3 o'clock) and 270 deg is -Y (12 o'clock, where the pointer is).
    // When the wheel rotates clockwise by angle R, midpoint becomes (midAngle + R) mod 360.
    // For (midAngle + R) mod 360 == 270 deg (top needle):
    // R mod 360 == (270 - midAngle) mod 360.
    const midAngle = targetIndex * sectorAngle + sectorAngle / 2;
    const targetRemainder = ((270 - midAngle) % 360 + 360) % 360;

    // Calculate next rotation so it always spins forward by 5 to 7 full 360° rotations
    const currentMod = rotation % 360;
    const diff = ((targetRemainder - currentMod) % 360 + 360) % 360;
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const finalAngle = rotation + fullSpins + diff;

    AudioManager.playClick();
    setRotation(finalAngle);

    // 3. Realistic decelerating tick sounds:
    // We schedule ticks that mimic the wheel's deceleration curve
    const tickDelays = [
      80, 160, 240, 320, 400, 490, 580, 680, 790, 910, 1040, 1180, 1340, 1520,
      1720, 1940, 2190, 2470, 2780, 3050, 3250
    ];

    tickDelays.forEach((delay, idx) => {
      const pitch = Math.max(0.65, 1.2 - (idx / tickDelays.length) * 0.5);
      const timer = window.setTimeout(() => {
        AudioManager.playRouletteTick(pitch);
      }, delay);
      timeoutsRef.current.push(timer);
    });

    // 4. Spin completion (3.4s)
    const endTimer = window.setTimeout(() => {
      setIsSpinning(false);
      setSelectedSector(chosenSector);
      AudioManager.playRouletteStop();

      // Auto-advance after 1.8s of showing the winner
      const autoCloseTimer = window.setTimeout(() => {
        onSpinComplete(chosenSector);
      }, 1800);
      timeoutsRef.current.push(autoCloseTimer);
    }, 3400);

    timeoutsRef.current.push(endTimer);
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedSector(null);
      setHasStarted(false);
      // Auto start spin after 600ms so the user sees the wheel ready
      const autoStart = window.setTimeout(() => {
        spinWheel();
      }, 650);
      timeoutsRef.current.push(autoStart);

      return () => {
        clearAllTimeouts();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative max-w-sm sm:max-w-md w-full bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 flex flex-col items-center shadow-[0_0_50px_rgba(245,158,11,0.35)]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
            ROLETA DA ARENA
          </h3>
        </div>

        <p className="text-xs text-slate-400 mb-3 text-center">
          Definindo o modificador elemental e o clima da rodada!
        </p>

        {/* Wheel Assembly */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center">
          {/* Top Needle (Pointer) - Authentic triangular pin */}
          <div className="absolute -top-3.5 z-40 flex flex-col items-center pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
            {/* Jewel Head */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-white border-2 border-amber-200 shadow-[0_0_12px_#f59e0b] z-10" />
            {/* Triangular Arrow pointing DOWN into the wheel */}
            <div
              className={`w-0 h-0 -mt-1 border-x-[9px] border-x-transparent border-t-[22px] border-t-amber-400 transition-transform ${
                isSpinning ? 'animate-bounce origin-top' : ''
              }`}
            />
          </div>

          {/* Golden Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] pointer-events-none z-20" />

          {/* Rotating Wheel Canvas/SVG */}
          <div
            className="w-full h-full rounded-full overflow-hidden shadow-inner"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionProperty: 'transform',
              transitionDuration: '3400ms',
              transitionTimingFunction: 'cubic-bezier(0.12, 0.95, 0.22, 1)',
            }}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {ROULETTE_SECTORS.map((sector, index) => {
                const startAngle = (index * sectorAngle * Math.PI) / 180;
                const endAngle = ((index + 1) * sectorAngle * Math.PI) / 180;
                const x1 = 150 + 150 * Math.cos(startAngle);
                const y1 = 150 + 150 * Math.sin(startAngle);
                const x2 = 150 + 150 * Math.cos(endAngle);
                const y2 = 150 + 150 * Math.sin(endAngle);

                const midAngleRad = ((index + 0.5) * sectorAngle * Math.PI) / 180;
                const textX = 150 + 96 * Math.cos(midAngleRad);
                const textY = 150 + 96 * Math.sin(midAngleRad);

                return (
                  <g key={sector.id}>
                    {/* Sector slice */}
                    <path
                      d={`M 150 150 L ${x1} ${y1} A 150 150 0 0 1 ${x2} ${y2} Z`}
                      fill={sector.color}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />
                    {/* Sector Text & Icon */}
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="12.5"
                      fontWeight="bold"
                      fontFamily="'Chakra Petch', sans-serif"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${index * sectorAngle + sectorAngle / 2 + 90}, ${textX}, ${textY})`}
                      style={{
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.85))',
                      }}
                    >
                      {sector.icon} {sector.name}
                    </text>
                  </g>
                );
              })}

              {/* Decorative Perimeter Studs */}
              {ROULETTE_SECTORS.map((_, i) => {
                const studAngle = (i * sectorAngle * Math.PI) / 180;
                const sx = 150 + 140 * Math.cos(studAngle);
                const sy = 150 + 140 * Math.sin(studAngle);
                return (
                  <circle
                    key={`stud-${i}`}
                    cx={sx}
                    cy={sy}
                    r="4"
                    fill="#fef08a"
                    stroke="#854d0e"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Center Hub */}
              <circle cx="150" cy="150" r="28" fill="#0f172a" stroke="#f59e0b" strokeWidth="3.5" />
              <circle cx="150" cy="150" r="14" fill="#f59e0b" />
              <circle cx="150" cy="150" r="6" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Selected Result Box */}
        <div className="w-full mt-3 min-h-[78px] flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-slate-950/90 border border-slate-800">
          {selectedSector ? (
            <div className="animate-fade-in flex flex-col items-center">
              <span
                className="text-base sm:text-lg font-heading font-bold flex items-center gap-1.5"
                style={{ color: selectedSector.color }}
              >
                <span className="text-2xl">{selectedSector.icon}</span> {selectedSector.name}
              </span>
              <p className="text-xs text-slate-300 mt-1 max-w-[280px]">
                {selectedSector.description}
              </p>
            </div>
          ) : isSpinning ? (
            <div className="flex items-center gap-2 text-amber-400 font-heading text-sm animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>GIRANDO ROLETA...</span>
            </div>
          ) : (
            <button
              onClick={spinWheel}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-heading font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>GIRAR ROLETA</span>
            </button>
          )}
        </div>

        {/* Quick manual continue button when sector is selected */}
        {selectedSector && (
          <button
            onClick={() => {
              clearAllTimeouts();
              onSpinComplete(selectedSector);
            }}
            className="mt-3 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-heading font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            CONTINUAR PARA A BATALHA →
          </button>
        )}
      </div>
    </div>
  );
};
