import type { Character, ActivityType } from '../../types';
import { createCharacter, createLeavingPath, activityToState, tickCharacter } from './characters';
import { ParticleSystem } from './particles';

const TILE_SIZE = 16;

/**
 * Imperative game state — NOT React state.
 * Manages characters, office simulation, and particle system.
 */
export class OfficeState {
  characters: Map<string, Character> = new Map();
  particles: ParticleSystem = new ParticleSystem();
  /** Tracks which desk indices are taken */
  private assignedDesks: Set<number> = new Set();
  /** Characters scheduled for removal after walk-away */
  private leaving: Set<string> = new Set();

  /** Add a new character (session created) */
  addCharacter(id: string): void {
    if (this.characters.has(id)) return;

    const deskIndex = this.findFreeDesk();
    const char = createCharacter(id, deskIndex);
    this.characters.set(id, char);
    this.assignedDesks.add(deskIndex);

    // Spawn sparkle at entrance
    this.particles.emit('session_start', char.x + 8, char.y + 8);
  }

  /** Remove a character with walk-away animation (session ended) */
  removeCharacter(id: string): void {
    const char = this.characters.get(id);
    if (!char) return;

    this.leaving.add(id);
    this.assignedDesks.delete(char.deskIndex);

    // Fade puff at desk
    this.particles.emit('session_end', char.x + 8, char.y + 8);
    createLeavingPath(char);
  }

  /** Update character activity (agent activity message) */
  updateCharacterActivity(id: string, activity: ActivityType): void {
    const char = this.characters.get(id);
    if (!char || this.leaving.has(id)) return;

    // Only change state if character is at their desk (not walking)
    if (char.state !== 'walking') {
      char.state = activityToState(activity);
    }
  }

  /** Advance simulation by deltaMs */
  tick(deltaMs: number): void {
    for (const [id, char] of this.characters) {
      const shouldRemove = tickCharacter(char, deltaMs);
      if (shouldRemove) {
        this.characters.delete(id);
        this.leaving.delete(id);
        continue;
      }

      // Emit state-based particles
      if (char.state === 'typing' && Math.random() < 0.15) {
        this.particles.emit('typing', char.x + 8, char.y);
      }
      if (char.state === 'executing' && Math.random() < 0.2) {
        this.particles.emit('executing', char.x + 8, char.y + 8);
      }
      if (char.state === 'celebrating' && Math.random() < 0.25) {
        this.particles.emit('celebrating', char.x + 8, char.y);
      }
    }

    this.particles.tick(deltaMs);
  }

  /** Get all characters as an array (for rendering) */
  getCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  private findFreeDesk(): number {
    for (let i = 0; i < 8; i++) {
      if (!this.assignedDesks.has(i)) return i;
    }
    // All desks taken — wrap around
    return this.characters.size % 8;
  }
}
