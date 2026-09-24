import { ElementType } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Plays an external file if available, falling back cleanly to procedural Web Audio
  public playFileOrProcedural(fileName: string, proceduralFallback: () => void) {
    if (this.isMuted) return;
    this.initCtx();

    // Try loading / checking audio file
    const cached = this.audioCache.get(fileName);
    if (cached) {
      cached.currentTime = 0;
      cached.volume = this.volume;
      cached.play().catch(() => proceduralFallback());
      return;
    }

    const audio = new Audio(`/audio/${fileName}`);
    audio.volume = this.volume;
    
    // If error or not found, immediately use procedural fallback
    audio.onerror = () => {
      proceduralFallback();
    };

    audio.oncanplaythrough = () => {
      this.audioCache.set(fileName, audio);
      audio.play().catch(() => proceduralFallback());
    };

    // Trigger procedural immediately if file load doesn't start or times out
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          proceduralFallback();
        });
      }
    } catch {
      proceduralFallback();
    }
  }

  // --- PROCEDURAL SOUND GENERATORS ---

  // UI Button Click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Selection / Target reticle hover
  public playSelect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // Basic elemental attack
  public playAttack(element: ElementType) {
    switch (element) {
      case 'FOGO':
        this.playFileOrProcedural('fire/fire_attack_01.wav', () => this.synthFireAttack());
        break;
      case 'ÁGUA':
        this.playFileOrProcedural('water/water_attack_01.wav', () => this.synthWaterAttack());
        break;
      case 'VENTO':
        this.playFileOrProcedural('wind/wind_attack_01.wav', () => this.synthWindAttack());
        break;
      case 'TERRA':
        this.playFileOrProcedural('earth/earth_attack_01.wav', () => this.synthEarthAttack());
        break;
    }
  }

  // Special elemental skill
  public playSpecial(element: ElementType) {
    switch (element) {
      case 'FOGO':
        this.playFileOrProcedural('fire/fire_special_01.wav', () => this.synthFireSpecial());
        break;
      case 'ÁGUA':
        this.playFileOrProcedural('water/water_special_01.wav', () => this.synthWaterSpecial());
        break;
      case 'VENTO':
        this.playFileOrProcedural('wind/wind_special_01.wav', () => this.synthWindSpecial());
        break;
      case 'TERRA':
        this.playFileOrProcedural('earth/earth_special_01.wav', () => this.synthEarthSpecial());
        break;
    }
  }

  // FIRE: Whoosh + fire crackles + impact
  private synthFireAttack() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Pitch swept swoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);

    // Noise buffer for crackle
    const bufferSize = this.ctx.sampleRate * 0.25;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1600, t + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 * this.volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);
    noise.start(t);
    noise.stop(t + 0.26);
  }

  private synthFireSpecial() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Roaring flame burst
    this.synthFireAttack();

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.5);

    subGain.gain.setValueAtTime(0.4 * this.volume, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.5);
  }

  // WATER: Splash + bubbles + crystal magic chime
  private synthWaterAttack() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.22);

    gain.gain.setValueAtTime(0.28 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  private synthWaterSpecial() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Harmonic crystalline arpeggio (Healing wave)
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.2 * this.volume, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.36);
    });
  }

  // WIND: Ultra-fast whoosh + air blade slice
  private synthWindAttack() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.18;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.linearRampToValueAtTime(3200, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.19);
  }

  private synthWindSpecial() {
    if (!this.ctx) return;
    // Rapid triple slice
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.synthWindAttack();
      }, i * 90);
    }
  }

  // EARTH: Heavy rock impact + low rubble rumble
  private synthEarthAttack() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.28);

    gain.gain.setValueAtTime(0.45 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.31);
  }

  private synthEarthSpecial() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Deep taunt / fortress rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);

    gain.gain.setValueAtTime(0.5 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.51);
  }

  // SHIELD: Forcefield bubble activation & hit barrier absorption
  public playShield() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.35);

    gain.gain.setValueAtTime(0.3 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playShieldAbsorb() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.18);

    gain.gain.setValueAtTime(0.35 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  // HEAL
  public playHeal() {
    this.synthWaterSpecial();
  }

  // HIT / DAMAGE
  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // CRITICAL HIT
  public playCritical() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Dual piercing chime + bass explosion
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(880, t);
    osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.1);
    osc2.frequency.setValueAtTime(120, t);
    osc2.frequency.exponentialRampToValueAtTime(45, t + 0.35);

    gain.gain.setValueAtTime(0.45 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  // DEVASTATING DESPERATION HIT (Double Damage 10% HP Strike)
  public playDesperation() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. Heavy sub bass detonation
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(180, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.65);
    subGain.gain.setValueAtTime(0.65 * this.volume, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.72);

    // 2. High-energy electric blast / rupture chord
    const chord = [440, 554.37, 659.25, 880, 1108.73];
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.45);
      gain.gain.setValueAtTime((0.15 + idx * 0.03) * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.52);
    });
  }

  // DODGE
  public playDodge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.18);

    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  // ROULETTE SPIN TICK
  public playRouletteTick(pitchFactor: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600 * pitchFactor, t);

    gain.gain.setValueAtTime(0.08 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  // ROULETTE STOP / LOCK
  public playRouletteStop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [587.33, 739.99, 880]; // D5, F#5, A5
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.05);

      gain.gain.setValueAtTime(0.22 * this.volume, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.26);
    });
  }

  // VICTORY FANFARE - Triumphant multi-layered orchestral fanfare with sparkles
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. Bass Timpani Impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.5);
    subGain.gain.setValueAtTime(0.5 * this.volume, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.56);

    // 2. Brass Fanfare Triplet & Grand Resolution
    // C5, E5, G5, leap to high C6 and sustained chord with E6!
    const notes = [
      { f: 523.25, start: 0.00, dur: 0.16, type: 'sawtooth' as OscillatorType, vol: 0.35 }, // C5
      { f: 659.25, start: 0.16, dur: 0.16, type: 'sawtooth' as OscillatorType, vol: 0.35 }, // E5
      { f: 783.99, start: 0.32, dur: 0.20, type: 'sawtooth' as OscillatorType, vol: 0.38 }, // G5
      { f: 1046.50, start: 0.52, dur: 0.90, type: 'sawtooth' as OscillatorType, vol: 0.42 }, // C6 (Grand hit!)
      { f: 659.25, start: 0.52, dur: 0.90, type: 'sawtooth' as OscillatorType, vol: 0.25 }, // E5 harmony
      { f: 783.99, start: 0.52, dur: 0.90, type: 'sawtooth' as OscillatorType, vol: 0.25 }, // G5 harmony
      { f: 1318.51, start: 0.70, dur: 0.75, type: 'sawtooth' as OscillatorType, vol: 0.28 }, // E6 crown
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = n.type;
      osc.frequency.setValueAtTime(n.f, t + n.start);

      // Warm brass low-pass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t + n.start);
      filter.frequency.exponentialRampToValueAtTime(1400, t + n.start + n.dur);

      gain.gain.setValueAtTime(n.vol * this.volume, t + n.start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.start + n.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + n.start);
      osc.stop(t + n.start + n.dur + 0.05);
    });

    // 3. Shimmering Victory Chimes (Glitter cascade at the end)
    const sparkles = [1046.5, 1318.5, 1567.9, 2093.0, 2637.0];
    sparkles.forEach((freq, idx) => {
      const delay = 0.55 + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.18 * this.volume, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + delay);
      osc.stop(t + delay + 0.42);
    });
  }

  // DEFEAT - Somber, ominous minor descent with deep gong impact
  public playDefeat() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. Heavy Ominous Gong / Strike
    const gong = this.ctx.createOscillator();
    const gongGain = this.ctx.createGain();
    gong.type = 'sawtooth';
    gong.frequency.setValueAtTime(110, t);
    gong.frequency.exponentialRampToValueAtTime(35, t + 0.8);

    gongGain.gain.setValueAtTime(0.45 * this.volume, t);
    gongGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    gong.connect(gongGain);
    gongGain.connect(this.ctx.destination);
    gong.start(t);
    gong.stop(t + 0.9);

    // 2. Melancholic Descending Sequence in Minor
    const somberNotes = [
      { f: 293.66, dur: 0.38, delay: 0.05 }, // D4
      { f: 261.63, dur: 0.38, delay: 0.38 }, // C4
      { f: 233.08, dur: 0.45, delay: 0.72 }, // Bb3
      { f: 196.00, dur: 0.50, delay: 1.10 }, // G3
      { f: 146.83, dur: 0.90, delay: 1.55 }, // Low D3
    ];

    somberNotes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.delay);
      // Subtle vibrato/detune
      osc.frequency.exponentialRampToValueAtTime(n.f * 0.985, t + n.delay + n.dur);

      gain.gain.setValueAtTime(0.32 * this.volume, t + n.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.delay + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + n.delay);
      osc.stop(t + n.delay + n.dur + 0.05);
    });

    // 3. Low Sub Drone
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(73.42, t + 0.2); // Low D2
    droneGain.gain.setValueAtTime(0.22 * this.volume, t + 0.2);
    droneGain.gain.exponentialRampToValueAtTime(0.001, t + 2.3);

    drone.connect(droneGain);
    droneGain.connect(this.ctx.destination);
    drone.start(t + 0.2);
    drone.stop(t + 2.35);
  }
}

export const AudioManager = new SoundEngine();
