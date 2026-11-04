/**
 * Notification Chime Sound Generator for Somoyer Batighor (সময়ের বাতিঘর) Admin Panel
 * Uses Web Audio API to synthesize a pleasant, crystal-clear, instant chime ("টুং" শব্দ)
 * without needing external MP3 asset downloads.
 */

class NotificationSoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('batighor_admin_sound_enabled');
        this.soundEnabled = stored !== 'false';
      } catch {
        this.soundEnabled = true;
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

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('batighor_admin_sound_enabled', enabled ? 'true' : 'false');
    } catch {}
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

