export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

export type ParticlePreset = 'typing' | 'executing' | 'celebrating' | 'session_start' | 'session_end' | 'dust';

const CONFETTI_COLORS = ['#ff4060', '#40ff80', '#4080ff', '#ffe040', '#ff80c0', '#80ffff'];

/** Create particles for a given preset at position (x, y) */
export function emitParticles(preset: ParticlePreset, x: number, y: number): Particle[] {
  switch (preset) {
    case 'typing':
      return emitTyping(x, y);
    case 'executing':
      return emitExecuting(x, y);
    case 'celebrating':
      return emitCelebrating(x, y);
    case 'session_start':
      return emitSessionStart(x, y);
    case 'session_end':
      return emitSessionEnd(x, y);
    case 'dust':
      return emitDust(x, y);
  }
}

function emitTyping(x: number, y: number): Particle[] {
  const count = 1 + Math.floor(Math.random() * 2);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + Math.random() * 8 - 4,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: -10 - Math.random() * 15,
      life: 400 + Math.random() * 400,
      maxLife: 800,
      color: '#4ae0a0',
      size: 1,
      gravity: 0,
    });
  }
  return particles;
}

function emitExecuting(x: number, y: number): Particle[] {
  const count = 3 + Math.floor(Math.random() * 3);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 15 + Math.random() * 25;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 200 + Math.random() * 300,
      maxLife: 500,
      color: '#e0a040',
      size: 1 + Math.floor(Math.random() * 2),
      gravity: 0,
    });
  }
  return particles;
}

function emitCelebrating(x: number, y: number): Particle[] {
  const count = 5 + Math.floor(Math.random() * 4);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + Math.random() * 6 - 3,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: -25 - Math.random() * 20,
      life: 600 + Math.random() * 400,
      maxLife: 1000,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 2,
      gravity: 40,
    });
  }
  return particles;
}

function emitSessionStart(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 8 + Math.random() * 12;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 400 + Math.random() * 300,
      maxLife: 700,
      color: i % 2 === 0 ? '#ffffff' : '#80e0ff',
      size: 1,
      gravity: 0,
    });
  }
  return particles;
}

function emitSessionEnd(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: x + Math.random() * 10 - 5,
      y: y + Math.random() * 10 - 5,
      vx: (Math.random() - 0.5) * 8,
      vy: -5 - Math.random() * 10,
      life: 400 + Math.random() * 400,
      maxLife: 800,
      color: '#888888',
      size: 2,
      gravity: 0,
    });
  }
  return particles;
}

function emitDust(x: number, y: number): Particle[] {
  return [{
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: -1 - Math.random() * 2,
    life: 3000 + Math.random() * 2000,
    maxLife: 5000,
    color: '#ffffff',
    size: 1,
    gravity: 0,
  }];
}

/** Particle system manager */
export class ParticleSystem {
  particles: Particle[] = [];
  private dustTimer = 0;

  /** Emit a preset at position */
  emit(preset: ParticlePreset, x: number, y: number): void {
    const newParticles = emitParticles(preset, x, y);
    this.particles.push(...newParticles);
  }

  /** Tick all particles, remove dead ones */
  tick(deltaMs: number): void {
    const dt = deltaMs / 1000;

    // Ambient dust
    this.dustTimer += deltaMs;
    if (this.dustTimer >= 500) {
      this.dustTimer -= 500;
      // Random position within office bounds
      const dx = 32 + Math.random() * 256;
      const dy = 32 + Math.random() * 192;
      this.emit('dust', dx, dy);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= deltaMs;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /** Get all live particles */
  getParticles(): readonly Particle[] {
    return this.particles;
  }
}
