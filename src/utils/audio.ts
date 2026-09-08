// Web Audio API procedural sound synthesizer for executive boardroom effects and ambient lo-fi music
type MusicStateListener = (isPlaying: boolean) => void;

class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicPlaying: boolean = false;
  private musicVolume: number = 0.35;
  private masterMusicGain: GainNode | null = null;
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private currentChordIndex: number = 0;
  private listeners: MusicStateListener[] = [];
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-unlock audio context on first user interaction
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      };
      window.addEventListener('click', unlockHandler, { once: true, passive: true });
      window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
      window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
    }
  }

  public subscribeMusicState(listener: MusicStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyMusicState(isPlaying: boolean) {
    this.musicPlaying = isPlaying;
    this.listeners.forEach(fn => {
      try {
        fn(isPlaying);
      } catch (e) {
        console.warn('Listener error:', e);
      }
    });
  }

  public async unlockAudio(): Promise<AudioContext | null> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
        this.isUnlocked = true;
      } catch {
        // user gesture might still be required
      }
    } else if (ctx && ctx.state === 'running') {
      this.isUnlocked = true;
    }
    return ctx;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterMusicGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.musicVolume;
      try {
        this.masterMusicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterMusicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Background Lo-Fi Executive Music (Non-tiring Ambient Chords) ---
  public async toggleBackgroundMusic(): Promise<boolean> {
    if (this.musicPlaying) {
      this.stopBackgroundMusic();
      return false;
    } else {
      await this.startBackgroundMusic();
      return true;
    }
  }

  public isBackgroundMusicPlaying(): boolean {
    return this.musicPlaying;
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.masterMusicGain && this.ctx && !this.isMuted) {
      try {
        this.masterMusicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public async startBackgroundMusic(): Promise<void> {
    const ctx = await this.unlockAudio();
    if (!ctx) return;

    if (this.musicPlaying) return;
    this.notifyMusicState(true);

    // Master music gain node with soft lowpass filter for warm executive lo-fi tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200; // Warm, cuts harsh high frequencies
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    const initialVol = this.isMuted ? 0 : this.musicVolume;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, initialVol), ctx.currentTime + 1.2);

    filter.connect(gain);
    gain.connect(ctx.destination);
    this.masterMusicGain = gain;

    // Corporate Lounge Chords (Dmaj9, Bm9, Gmaj7, A6/9, Em9)
    const chordProgressions = [
      [146.83, 220.00, 277.18, 329.63, 369.99], // Dmaj9 (D3, A3, C#4, E4, F#4)
      [123.47, 185.00, 220.00, 277.18, 293.66], // Bm9 (B2, F#3, A3, C#4, D4)
      [98.00, 146.83, 185.00, 246.94, 293.66],  // Gmaj7 (G2, D3, F#3, B3, D4)
      [110.00, 164.81, 185.00, 246.94, 277.18], // A6/9 (A2, E3, F#3, B3, C#4)
      [82.41, 123.47, 164.81, 196.00, 246.94],  // Em9 (E2, B2, E3, G3, B3)
    ];

    const playChordStep = () => {
      if (!this.musicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentChord = chordProgressions[this.currentChordIndex];
      this.currentChordIndex = (this.currentChordIndex + 1) % chordProgressions.length;

      // Play soft Rhodes-style polyphonic tones
      currentChord.forEach((freq, idx) => {
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          // Soft slow attack and generous decay (creates breathing pad effect)
          const noteVolume = 0.045 - (idx * 0.005);
          noteGain.gain.setValueAtTime(0.0001, now + idx * 0.04);
          noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, noteVolume), now + idx * 0.04 + 0.9);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

          osc.connect(noteGain);
          noteGain.connect(filter);

          osc.start(now + idx * 0.04);
          osc.stop(now + 4.0);
        } catch {
          // ignore
        }
      });

      // Subtle warm sub-bass note
      try {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(currentChord[0], now);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.06, now + 0.3);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
        bassOsc.connect(bassGain);
        bassGain.connect(filter);
        bassOsc.start(now);
        bassOsc.stop(now + 3.6);
      } catch {
        // ignore
      }
    };

    // Trigger first chord immediately, then every 3.8 seconds
    playChordStep();
    this.musicInterval = setInterval(playChordStep, 3800);
  }

  public stopBackgroundMusic(): void {
    this.notifyMusicState(false);
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.masterMusicGain && this.ctx) {
      try {
        this.masterMusicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterMusicGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
      } catch {
        // ignore
      }
    }
  }

  // Click feedback
  public playClick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }

  // Cash register / money chime
  public playCashChime(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [987.77, 1318.51, 1975.53]; // B5, E6, B6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch {
      // ignore
    }
  }

  // Signing a corporate contract
  public playPenSign(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.15);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // ignore
    }
  }

  // Gavel / Decision taken
  public playGavelStrike(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {
      // ignore
    }
  }

  // Stock market bell
  public playMarketBell(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const freqs = [1046.5, 1318.5, 1567.98]; // C6, E6, G6
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.85);
      });
    } catch {
      // ignore
    }
  }

  // Warning or bankruptcy alert
  public playWarningBeep(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(260, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // ignore
    }
  }

  // Victory / IPO fanfare
  public playSuccessChime(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundController();

