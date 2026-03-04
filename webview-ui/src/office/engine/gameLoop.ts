import { Renderer } from './renderer';
import { OfficeState } from './officeState';

const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;
const MAX_DELTA_MS = 100;

export class GameLoop {
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;

  constructor(
    private state: OfficeState,
    private renderer: Renderer,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    let delta = now - this.lastTime;
    this.lastTime = now;

    // Clamp to prevent spiral-of-death
    if (delta > MAX_DELTA_MS) delta = MAX_DELTA_MS;

    this.accumulator += delta;

    // Fixed timestep at target FPS
    while (this.accumulator >= FRAME_MS) {
      this.state.tick(FRAME_MS);
      this.accumulator -= FRAME_MS;
    }

    this.renderer.draw(this.state.getCharacters());
  };
}
