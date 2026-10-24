// src/audio.js - Web Audio API Procedural Synthesizer (Zero External Files / Zero 404s)

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
    this.isAdMuted = false;
    this.isInitialized = false;

    // Load saved mute setting
    try {
      const savedMute = localStorage.getItem('quantum_grid_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch (e) {
      // ignore
    }

    // Auto pause/resume audio on tab switch or window blur
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.suspend();
        } else {
          this.resume();
        }
      });
      window.addEventListener('blur', () => this.suspend());
      window.addEventListener('focus', () => this.resume());
    }
  }

  init() {
    if (this.isInitialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateGains();
      this.isInitialized = true;
    } catch (err) {
      console.warn('[Audio] Failed to initialize AudioContext:', err);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended' && !this.isAdMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  updateGains() {
    if (!this.masterGain) return;
    const target = (this.isMuted || this.isAdMuted) ? 0 : 0.85;
    this.masterGain.gain.setValueAtTime(target, this.ctx ? this.ctx.currentTime : 0);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('quantum_grid_muted', String(this.isMuted));
    } catch (e) {}
    this.updateGains();
    return this.isMuted;
  }

  setAdMuted(muted) {
    this.isAdMuted = !!muted;
    if (this.isAdMuted) {
      this.suspend();
    } else {
      this.resume();
    }
    this.updateGains();
  }

  // --- Procedural Sound Effects ---

  // Intro Splash FluidCleb Interactive (0.0s to 2.8s)
  playFluidClebIntro() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t0 = this.ctx.currentTime;

    // Harmonic cosmic drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, t0);
    osc1.frequency.exponentialRampToValueAtTime(220, t0 + 1.2);
    osc1.frequency.exponentialRampToValueAtTime(440, t0 + 2.0);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, t0);
    osc2.frequency.exponentialRampToValueAtTime(880, t0 + 2.0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t0);
    filter.frequency.exponentialRampToValueAtTime(3500, t0 + 1.8);
    filter.frequency.exponentialRampToValueAtTime(1200, t0 + 2.6);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.25, t0 + 0.6);
    gain.gain.setValueAtTime(0.25, t0 + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.7);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + 2.8);
    osc2.stop(t0 + 2.8);

    // Crystalline water drop at 1.8s
    setTimeout(() => {
      if (!this.ctx || this.isMuted || this.isAdMuted) return;
      const tDrop = this.ctx.currentTime;
      const dropOsc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(880, tDrop);
      dropOsc.frequency.exponentialRampToValueAtTime(1760, tDrop + 0.08);
      dropOsc.frequency.exponentialRampToValueAtTime(1320, tDrop + 0.25);

      dropGain.gain.setValueAtTime(0.3, tDrop);
      dropGain.gain.exponentialRampToValueAtTime(0.001, tDrop + 0.6);

      dropOsc.connect(dropGain);
      dropGain.connect(this.sfxGain);

      dropOsc.start(tDrop);
      dropOsc.stop(tDrop + 0.65);
    }, 1800);
  }

  // Piece Drag Pickup
  playPiecePickup() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Piece Dropped / Placed on Grid
  playPieceDrop() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = 200 + Math.random() * 30;
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Invalid Placement (Buzz)
  playInvalid() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.setValueAtTime(110, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Explosive Line Collapse + Combo Arpeggio
  playLineClear(lineCount = 1, combo = 1) {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t0 = this.ctx.currentTime;

    // Base frequencies based on combo
    const baseFreqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const comboOffset = Math.min(combo - 1, 4);

    // Arpeggio notes
    for (let i = 0; i < Math.min(lineCount * 2 + 1, 6); i++) {
      const noteTime = t0 + i * 0.045;
      const noteOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      noteOsc.type = 'sine';
      const freqIndex = (i + comboOffset) % baseFreqs.length;
      const freq = baseFreqs[freqIndex] * (combo > 2 ? 1.5 : 1);
      noteOsc.frequency.setValueAtTime(freq, noteTime);
      noteOsc.frequency.exponentialRampToValueAtTime(freq * 1.05, noteTime + 0.12);

      noteGain.gain.setValueAtTime(0.22, noteTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      noteOsc.connect(noteGain);
      noteGain.connect(this.sfxGain);

      noteOsc.start(noteTime);
      noteOsc.stop(noteTime + 0.24);
    }

    // Noise impact burst for explosion
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1400 + lineCount * 400, t0);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, t0 + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t0);
  }

  // Star Milestone Unlocked (1★, 2★, 3★)
  playStarUnlocked() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t0 = this.ctx.currentTime;
    const notes = [587.33, 880.00, 1174.66]; // D5, A5, D6

    notes.forEach((freq, idx) => {
      const noteTime = t0 + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.38);
    });
  }

  // Victory Fanfare
  playVictory() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t0 = this.ctx.currentTime;
    const chords = [
      { t: 0.0, f: 523.25 }, // C5
      { t: 0.12, f: 659.25 }, // E5
      { t: 0.24, f: 783.99 }, // G5
      { t: 0.38, f: 1046.50 }, // C6
      { t: 0.55, f: 1318.51 }  // E6
    ];

    chords.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(c.f, t0 + c.t);

      gain.gain.setValueAtTime(0.24, t0 + c.t);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + c.t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t0 + c.t);
      osc.stop(t0 + c.t + 0.5);
    });
  }

  // Game Over Deep Collapse
  playGameOver() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t0 = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.7);

    gain.gain.setValueAtTime(0.3, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t0);
    osc.stop(t0 + 0.8);
  }

  // Lucky Spin Tick
  playSpin() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(950 + Math.random() * 100, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Power-up activation (EMP, Swap, Laser)
  playPowerUp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t0 = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.28);

    gain.gain.setValueAtTime(0.28, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t0);
    osc.stop(t0 + 0.38);
  }

  // General UI Click
  playButtonClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const sound = new SoundManager();
