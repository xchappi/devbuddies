/** Procedural sound system using Web Audio API — zero file assets */
export class SoundSystem {
  private ctx: AudioContext | null = null;
  private _enabled = false;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(v: boolean) {
    this._enabled = v;
    if (v && !this.ctx) {
      this.ctx = new AudioContext();
    }
  }

  private getCtx(): AudioContext | null {
    if (!this._enabled) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Rising chord — session start */
  playSessionStart(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playTone(ctx, 440, now, 0.12, 'sine', 0.05);
    this.playTone(ctx, 554, now + 0.08, 0.12, 'sine', 0.05);
    this.playTone(ctx, 660, now + 0.16, 0.15, 'sine', 0.05);
  }

  /** Falling chord — session end */
  playSessionEnd(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playTone(ctx, 660, now, 0.12, 'sine', 0.04);
    this.playTone(ctx, 554, now + 0.08, 0.12, 'sine', 0.04);
    this.playTone(ctx, 440, now + 0.16, 0.15, 'sine', 0.04);
  }

  /** Short blip — typing */
  playTyping(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    this.playTone(ctx, 800, ctx.currentTime, 0.02, 'square', 0.03);
  }

  /** Two-tone notification */
  playNotification(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playTone(ctx, 660, now, 0.08, 'sine', 0.05);
    this.playTone(ctx, 880, now + 0.1, 0.12, 'sine', 0.05);
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    vol.gain.setValueAtTime(gain, startTime);
    vol.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(vol);
    vol.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }
}
