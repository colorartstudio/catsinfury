import React, { useEffect, useRef } from 'react';
import { ParticleManager } from './ParticleManager';

interface ParticleCanvasProps {
  className?: string;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ParticleManager.update();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context for screen shake
      ctx.save();
      if (ParticleManager.screenShakeAmount > 0) {
        const dx = (Math.random() - 0.5) * ParticleManager.screenShakeAmount * 2;
        const dy = (Math.random() - 0.5) * ParticleManager.screenShakeAmount * 2;
        ctx.translate(dx, dy);
      }

      // Draw Active Shields
      for (const s of ParticleManager.activeShields) {
        ctx.save();
        ctx.globalAlpha = s.alpha * 0.7;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 15;

        // Draw hexagon barrier
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = s.x + s.radius * Math.cos(angle);
          const hy = s.y + s.radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();

        // Hex interior glow
        ctx.fillStyle = s.color === '#ca8a04' ? 'rgba(202, 138, 4, 0.15)' : 'rgba(56, 189, 248, 0.18)';
        ctx.fill();
        ctx.restore();
      }

      // Draw Particles
      for (const p of ParticleManager.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

        if (p.glowColor) {
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.type === 'fire' ? 12 : 8;
        }

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'shockwave') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === 'leaf') {
          // Leaf shape
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'rock') {
          // Sharp rock polygon
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size * 0.6);
          ctx.lineTo(p.size * 0.8, -p.size * 0.8);
          ctx.lineTo(p.size, p.size * 0.7);
          ctx.lineTo(-p.size * 0.4, p.size);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'bubble') {
          // Translucent bubble with specular highlight
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Bubble glint
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-p.size * 0.35, -p.size * 0.35, p.size * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'shieldHex') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Fire, water, wind, sparks
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Draw Floating Texts
      for (const ft of ParticleManager.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
        ctx.translate(ft.x, ft.y);
        ctx.scale(ft.scale, ft.scale);

        ctx.font = `bold ${ft.fontSize}px 'Chakra Petch', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer stroke / shadow for legibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, 0, 0);

        if (ft.isCrit) {
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
        }

        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, 0, 0);

        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-30 ${className}`}
    />
  );
};
