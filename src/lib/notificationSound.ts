/**
 * Audio Chime & Interactive Click Sound Service for Somoyer Batighor (সময়ের বাতিঘর)
 * Synthesizes crisp crystal chimes ("টুং") and plays low-latency aesthetic mouse click sounds.
 */

class NotificationSoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private clickAudioBuffer: AudioBuffer | null = null;
  private isBufferLoading: boolean = false;
  private lastClickTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('batighor_admin_sound_enabled');
        this.soundEnabled = stored !== 'false';
      } catch {
        this.soundEnabled = true;
      }
      // Preload the mouse click sound buffer for instant latency-free clicks
      if (this.soundEnabled) {
        this.loadClickBuffer().catch(() => {});
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public async loadClickBuffer(): Promise<AudioBuffer | null> {
    if (this.clickAudioBuffer) return this.clickAudioBuffer;
    if (this.isBufferLoading) return null;
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      this.isBufferLoading = true;
      const res = await fetch('/sounds/mouse-click.mp3');
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      this.clickAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
      return this.clickAudioBuffer;
    } catch {
      return null;
    } finally {
      this.isBufferLoading = false;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('batighor_admin_sound_enabled', enabled ? 'true' : 'false');
    } catch {}
    if (enabled && !this.clickAudioBuffer) {
      this.loadClickBuffer().catch(() => {});
    }
  }

  /**
   * Plays low-latency aesthetic mouse click sound
   * Debounced by 35ms to avoid accidental micro double-triggers
   */
  public playClick(volume: number = 0.45): void {
    if (!this.soundEnabled) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastClickTime < 35) return;
    this.lastClickTime = now;

    try {
      const ctx = this.getAudioContext();
      if (ctx && this.clickAudioBuffer) {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);
        source.buffer = this.clickAudioBuffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return;
      }

      // If buffer is still loading or not decoded yet, start loading and fallback to HTML5 Audio
      this.loadClickBuffer().catch(() => {});
      const audio = new Audio('/sounds/mouse-click.mp3');
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.play().catch(() => {});
    } catch (err) {
      // Graceful fallback
    }
  }

  /**
   * Plays a distinct, warm, two-tone crystal chime ("টুং")
   * Tone 1: 880 Hz (A5), Tone 2: 1318.5 Hz (E6)
   */
  public playChime(): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Primary Chime Tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.7);

      // Harmonious Sparkle Tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now + 0.05);

      gain2.gain.setValueAtTime(0.001, now + 0.05);
      gain2.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.05);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.warn('Failed to synthesize notification chime:', err);
    }
  }
}

export const notificationSound = new NotificationSoundService();
export const playNotificationChime = () => notificationSound.playChime();
export const playClickSound = (vol?: number) => notificationSound.playClick(vol);
