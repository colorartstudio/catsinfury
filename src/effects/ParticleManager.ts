import { ElementType } from '../types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  color: string;
  glowColor?: string;
  alpha: number;
  maxLife: number;
  life: number;
  rotation: number;
  vRot: number;
  type: 'fire' | 'water' | 'wind' | 'earth' | 'spark' | 'bubble' | 'leaf' | 'rock' | 'shockwave' | 'shieldHex';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  alpha: number;
  scale: number;
  vy: number;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface ShieldEffect {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'energy' | 'stone';
}

class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public activeShields: ShieldEffect[] = [];
  public screenShakeAmount: number = 0;
  private idCounter: number = 0;

  public triggerScreenShake(intensity: number = 6) {
    this.screenShakeAmount = Math.max(this.screenShakeAmount, intensity);
  }

  // --- FLOATING COMBAT TEXT ---
  public addFloatingText(x: number, y: number, text: string, type: 'damage' | 'crit' | 'heal' | 'shield' | 'dodge' | 'burn' | 'desperation') {
    let color = '#f87171';
    let fontSize = 24;
    let isCrit = false;

    if (type === 'desperation') {
      color = '#f43f5e';
      fontSize = 34;
      isCrit = true;
      this.triggerScreenShake(18);
    } else if (type === 'crit') {
      color = '#fbbf24';
      fontSize = 32;
      isCrit = true;
      this.triggerScreenShake(10);
    } else if (type === 'heal') {
      color = '#34d399';
      fontSize = 26;
    } else if (type === 'shield') {
      color = '#67e8f9';
      fontSize = 22;
    } else if (type === 'dodge') {
      color = '#a7f3d0';
      fontSize = 24;
    } else if (type === 'burn') {
      color = '#f97316';
      fontSize = 20;
    }

    this.floatingTexts.push({
      id: `ft_${++this.idCounter}`,
      x: x + (Math.random() * 20 - 10),
      y: y + (Math.random() * 10 - 5),
      text,
      color,
      fontSize,
      alpha: 1,
      scale: type === 'desperation' ? 1.8 : isCrit ? 1.5 : 1.1,
      vy: type === 'desperation' ? -2.8 : -2.2,
      life: 0,
      maxLife: type === 'desperation' ? 75 : 55,
      isCrit,
    });
  }

  // --- CHARACTER-SPECIFIC DEVASTATING DESPERATION POWERS (≤ 10% HP) ---
  public createDesperationEffect(catId: string, element: ElementType, x: number, y: number) {
    // Massive Screen Shake
    this.triggerScreenShake(20);

    // Multi-layered Shockwaves
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 20,
      maxSize: 180,
      color: '#ffffff',
      glowColor: '#fb7185',
      alpha: 1,
      maxLife: 30,
      life: 0,
      rotation: 0,
      vRot: 0,
      type: 'shockwave',
    });

    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 15,
      maxSize: 140,
      color: element === 'FOGO' ? '#ea580c' : element === 'ÁGUA' ? '#0284c7' : element === 'VENTO' ? '#059669' : '#ca8a04',
      glowColor: '#ffffff',
      alpha: 0.9,
      maxLife: 36,
      life: 0,
      rotation: 0,
      vRot: 0,
      type: 'shockwave',
    });

    if (catId === 'fire') {
      // Cataclismo Solar: Colossal solar flare explosion & fire nova
      for (let i = 0; i < 65; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 9;
        this.particles.push({
          x: x + (Math.random() * 30 - 15),
          y: y + (Math.random() * 30 - 15),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 7 + Math.random() * 12,
          maxSize: 22,
          color: Math.random() > 0.4 ? '#ffedd5' : Math.random() > 0.5 ? '#f97316' : '#ef4444',
          glowColor: '#fde047',
          alpha: 1,
          maxLife: 35 + Math.random() * 30,
          life: 0,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.4,
          type: 'fire',
        });
      }
    } else if (catId === 'water') {
      // Tsunami Abissal: Giant watery hydro-explosion & dense foaming surge
      for (let i = 0; i < 65; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8.5;
        this.particles.push({
          x: x + (Math.random() * 30 - 15),
          y: y + (Math.random() * 30 - 15),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 6 + Math.random() * 10,
          maxSize: 18,
          color: Math.random() > 0.35 ? '#e0f2fe' : Math.random() > 0.5 ? '#38bdf8' : '#0284c7',
          glowColor: '#67e8f9',
          alpha: 0.95,
          maxLife: 35 + Math.random() * 28,
          life: 0,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.3,
          type: 'bubble',
        });
      }
    } else if (catId === 'wind') {
      // Vórtice dos Mil Cortes: Cyclone blades spinning with extreme velocity
      for (let i = 0; i < 70; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 50;
        const speed = 6 + Math.random() * 8;
        this.particles.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: -Math.sin(angle) * speed,
          vy: Math.cos(angle) * speed,
          size: 6 + Math.random() * 7,
          maxSize: 16,
          color: Math.random() > 0.4 ? '#ecfdf5' : '#34d399',
          glowColor: '#10b981',
          alpha: 1,
          maxLife: 32 + Math.random() * 25,
          life: 0,
          rotation: Math.random() * Math.PI * 2,
          vRot: 0.45,
          type: Math.random() > 0.5 ? 'leaf' : 'wind',
        });
      }
    } else if (catId === 'earth') {
      // Fissura Sísmica Titânica: Ground split with boulder storm
      for (let i = 0; i < 65; i++) {
        const angle = (Math.PI * Math.random()) - Math.PI; // Upward volcanic eruption of rocks
        const speed = 4 + Math.random() * 9;
        this.particles.push({
          x: x + (Math.random() * 40 - 20),
          y: y + 15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          size: 7 + Math.random() * 11,
          maxSize: 20,
          color: Math.random() > 0.5 ? '#78350f' : '#ca8a04',
          glowColor: '#fef08a',
          alpha: 1,
          maxLife: 40 + Math.random() * 30,
          life: 0,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.35,
          type: 'rock',
        });
      }
    }
  }

  // --- ELEMENTAL POWERS ---

  // FOGO: 15–30 partículas, direção para cima, escala variável, rotação aleatória, fade-out, pequenas brasas, glow, explosão no impacto
  public createFireEffect(x: number, y: number, isSpecial: boolean = false) {
    const count = isSpecial ? 45 : 25;
    this.triggerScreenShake(isSpecial ? 8 : 4);

    // Impact blast ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 15,
      maxSize: isSpecial ? 90 : 55,
      color: '#f97316',
      glowColor: '#ef4444',
      alpha: 0.9,
      maxLife: 24,
      life: 0,
      rotation: 0,
      vRot: 0,
      type: 'shockwave',
    });

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * Math.random()) - Math.PI / 2;
      const speed = 1.5 + Math.random() * (isSpecial ? 6.5 : 4.5);
      const isEmber = Math.random() > 0.5;

      this.particles.push({
        x: x + (Math.random() * 24 - 12),
        y: y + (Math.random() * 24 - 12),
        vx: Math.cos(angle) * speed * 0.7,
        vy: -Math.abs(Math.sin(angle) * speed) - (1.2 + Math.random() * 2.5), // Upward draft
        size: isEmber ? 2 + Math.random() * 3 : 5 + Math.random() * 9,
        maxSize: 14,
        color: isEmber ? '#fed7aa' : (Math.random() > 0.4 ? '#ea580c' : '#facc15'),
        glowColor: '#ef4444',
        alpha: 1,
        maxLife: 30 + Math.random() * 30,
        life: 0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.18,
        type: 'fire',
      });
    }
  }

  // ÁGUA: gotas + círculo de energia + ondas + brilho + bolhas
  public createWaterEffect(x: number, y: number, isSpecial: boolean = false) {
    const count = isSpecial ? 40 : 25;
    this.triggerScreenShake(isSpecial ? 6 : 3);

    // Expanding energy ripples
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 10,
      maxSize: isSpecial ? 85 : 55,
      color: '#38bdf8',
      glowColor: '#0284c7',
      alpha: 0.85,
      maxLife: 28,
      life: 0,
      rotation: 0,
      vRot: 0,
      type: 'shockwave',
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * (isSpecial ? 5.5 : 3.8);
      const isBubble = Math.random() > 0.4;

      this.particles.push({
        x: x + Math.cos(angle) * 8,
        y: y + Math.sin(angle) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isBubble ? 1.0 : 0),
        size: isBubble ? 3 + Math.random() * 4 : 5 + Math.random() * 6,
        maxSize: 12,
        color: isBubble ? 'rgba(224, 242, 254, 0.9)' : (Math.random() > 0.5 ? '#0284c7' : '#38bdf8'),
        glowColor: '#0ea5e9',
        alpha: 0.95,
        maxLife: 28 + Math.random() * 25,
        life: 0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        type: isBubble ? 'bubble' : 'water',
      });
    }
  }

  // VENTO: linhas de velocidade + partículas circulares + folhas + afterimage + turbilhão
  public createWindEffect(x: number, y: number, isSpecial: boolean = false) {
    const count = isSpecial ? 45 : 26;
    this.triggerScreenShake(isSpecial ? 7 : 3);

    // Swirl crescent shockwave
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 10,
      maxSize: isSpecial ? 95 : 60,
      color: '#6ee7b7',
      glowColor: '#10b981',
      alpha: 0.8,
      maxLife: 22,
      life: 0,
      rotation: Math.random() * Math.PI,
      vRot: 0.25,
      type: 'shockwave',
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 40;
      const isLeaf = Math.random() > 0.6;

      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: -Math.sin(angle) * (3 + Math.random() * 5), // Vortex tangential velocity
        vy: Math.cos(angle) * (3 + Math.random() * 5),
        size: isLeaf ? 5 + Math.random() * 4 : 2 + Math.random() * 5,
        maxSize: 10,
        color: isLeaf ? '#34d399' : (Math.random() > 0.5 ? '#a7f3d0' : '#ffffff'),
        glowColor: '#059669',
        alpha: 0.9,
        maxLife: 22 + Math.random() * 20,
        life: 0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.35,
        type: isLeaf ? 'leaf' : 'wind',
      });
    }
  }

  // TERRA: fragmentos de pedra + poeira + impacto no chão + fragmentos ascendentes + escudo de pedras
  public createEarthEffect(x: number, y: number, isSpecial: boolean = false) {
    const count = isSpecial ? 45 : 28;
    this.triggerScreenShake(isSpecial ? 12 : 6);

    // Heavy ground rupture ring
    this.particles.push({
      x,
      y: y + 20,
      vx: 0,
      vy: 0,
      size: 15,
      maxSize: isSpecial ? 100 : 65,
      color: '#ca8a04',
      glowColor: '#78350f',
      alpha: 0.9,
      maxLife: 26,
      life: 0,
      rotation: 0,
      vRot: 0,
      type: 'shockwave',
    });

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * Math.random()) - Math.PI; // Upward spray
      const speed = 2 + Math.random() * (isSpecial ? 7 : 5);
      const isRock = Math.random() > 0.4;

      this.particles.push({
        x: x + (Math.random() * 30 - 15),
        y: y + 10 + (Math.random() * 10 - 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (2 + Math.random() * 3), // Ascending stone fragments
        size: isRock ? 5 + Math.random() * 8 : 3 + Math.random() * 4,
        maxSize: 14,
        color: isRock ? (Math.random() > 0.5 ? '#78350f' : '#a16207') : '#fef08a',
        glowColor: '#b45309',
        alpha: 1,
        maxLife: 32 + Math.random() * 25,
        life: 0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        type: isRock ? 'rock' : 'earth',
      });
    }
  }

  // SHIELD BARRIER ACTIVATION / ABSORB
  public createShieldEffect(x: number, y: number, isStone: boolean = false) {
    this.triggerScreenShake(3);

    // Active shield barrier
    this.activeShields.push({
      x,
      y,
      radius: 46,
      alpha: 1,
      color: isStone ? '#ca8a04' : '#38bdf8',
      life: 0,
      maxLife: 32,
      type: isStone ? 'stone' : 'energy',
    });

    // Hex shield perimeter sparks
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 / 18) * i;
      this.particles.push({
        x: x + Math.cos(angle) * 44,
        y: y + Math.sin(angle) * 44,
        vx: Math.cos(angle) * 1.5,
        vy: Math.sin(angle) * 1.5,
        size: 3 + Math.random() * 3,
        maxSize: 6,
        color: isStone ? '#fde047' : '#67e8f9',
        alpha: 0.9,
        maxLife: 24,
        life: 0,
        rotation: angle,
        vRot: 0,
        type: 'shieldHex',
      });
    }
  }

  // HEAL BURST
  public createHealEffect(x: number, y: number) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: x + (Math.random() * 40 - 20),
        y: y + 20 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -2 - Math.random() * 2.5, // Float upwards
        size: 4 + Math.random() * 5,
        maxSize: 8,
        color: Math.random() > 0.4 ? '#34d399' : '#67e8f9',
        glowColor: '#10b981',
        alpha: 1,
        maxLife: 35 + Math.random() * 20,
        life: 0,
        rotation: 0,
        vRot: 0,
        type: 'spark',
      });
    }
  }

  // UPDATE ENGINE LOOP
  public update() {
    // Screen shake decay
    if (this.screenShakeAmount > 0) {
      this.screenShakeAmount *= 0.88;
      if (this.screenShakeAmount < 0.2) this.screenShakeAmount = 0;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.alpha = 1 - Math.pow(progress, 1.4);

      if (p.type === 'shockwave') {
        p.size = p.maxSize * Math.sin((progress * Math.PI) / 2);
      } else if (p.type === 'rock') {
        p.vy += 0.25; // gravity for earth rock fragments
      } else if (p.type === 'fire') {
        p.vx *= 0.96;
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life++;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ft.y += ft.vy;
      ft.vy *= 0.94;
      const prog = ft.life / ft.maxLife;
      ft.alpha = prog > 0.6 ? 1 - (prog - 0.6) / 0.4 : 1;
      if (ft.scale > 1) {
        ft.scale -= 0.015;
      }
    }

    // Update Shields
    for (let i = this.activeShields.length - 1; i >= 0; i--) {
      const s = this.activeShields[i];
      s.life++;
      if (s.life >= s.maxLife) {
        this.activeShields.splice(i, 1);
        continue;
      }
      s.alpha = 1 - (s.life / s.maxLife);
      s.radius += 0.3;
    }
  }
}

export const ParticleManager = new ParticleSystem();
