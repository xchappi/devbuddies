import type { Character, CharacterState, ActivityType } from '../../types';
import { findPath } from './pathfinding';

const WALK_SPEED = 2.5; // tiles per second
const ANIM_FRAME_MS = 200;
const TILE_SIZE = 16;

/** Spawn position (entrance, bottom-center of office) */
const ENTRANCE = { x: 8, y: 10 };

/** Desk positions (must match extension constants) */
const DESK_POSITIONS = [
  { x: 4, y: 3 },
  { x: 8, y: 3 },
  { x: 12, y: 3 },
  { x: 4, y: 7 },
  { x: 8, y: 7 },
  { x: 12, y: 7 },
] as const;

/** Create a new character at the entrance */
export function createCharacter(id: string, deskIndex: number): Character {
  const seat = DESK_POSITIONS[deskIndex % DESK_POSITIONS.length];
  // Character sits one row below the desk (on the chair)
  const targetX = seat.x;
  const targetY = seat.y + 1;

  const path = findPath(ENTRANCE, { x: targetX, y: targetY });

  return {
    id,
    x: ENTRANCE.x * TILE_SIZE,
    y: ENTRANCE.y * TILE_SIZE,
    targetX: targetX * TILE_SIZE,
    targetY: targetY * TILE_SIZE,
    state: 'walking',
    animFrame: 0,
    animTimer: 0,
    deskIndex,
    direction: targetX < ENTRANCE.x ? 'left' : 'right',
    path: path.map(p => ({ x: p.x * TILE_SIZE, y: p.y * TILE_SIZE })),
    pathIndex: 0,
  };
}

/** Create a character that walks from desk back to entrance (leave animation) */
export function createLeavingPath(char: Character): void {
  const currentTile = {
    x: Math.round(char.x / TILE_SIZE),
    y: Math.round(char.y / TILE_SIZE),
  };
  const path = findPath(currentTile, ENTRANCE);
  char.path = path.map(p => ({ x: p.x * TILE_SIZE, y: p.y * TILE_SIZE }));
  char.pathIndex = 0;
  char.state = 'walking';
}

/** Map an ActivityType from the extension to a CharacterState */
export function activityToState(activity: ActivityType): CharacterState {
  switch (activity) {
    case 'coding':
      return 'typing';
    case 'executing':
      return 'executing';
    case 'thinking':
      return 'idle';
    case 'idle':
      return 'idle';
  }
}

/** Tick a character's animation and movement. Returns true if character reached exit and should be removed. */
export function tickCharacter(char: Character, deltaMs: number): boolean {
  char.animTimer += deltaMs;
  if (char.animTimer >= ANIM_FRAME_MS) {
    char.animTimer -= ANIM_FRAME_MS;
    char.animFrame = (char.animFrame + 1) % 4;
  }

  if (char.state === 'walking') {
    return tickWalking(char, deltaMs);
  }

  // Idle, typing, executing, celebrating — no position change
  return false;
}

function tickWalking(char: Character, deltaMs: number): boolean {
  if (char.pathIndex >= char.path.length) {
    // Reached destination
    // If destination is the entrance, character is leaving
    if (
      Math.abs(char.x - ENTRANCE.x * TILE_SIZE) < 2 &&
      Math.abs(char.y - ENTRANCE.y * TILE_SIZE) < 2
    ) {
      return true; // Remove character
    }
    char.state = 'typing'; // Arrived at desk, start working
    return false;
  }

  const target = char.path[char.pathIndex];
  const dx = target.x - char.x;
  const dy = target.y - char.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const step = WALK_SPEED * TILE_SIZE * (deltaMs / 1000);

  if (dist <= step) {
    char.x = target.x;
    char.y = target.y;
    char.pathIndex++;
  } else {
    char.x += (dx / dist) * step;
    char.y += (dy / dist) * step;
  }

  // Update direction
  if (dx !== 0) {
    char.direction = dx > 0 ? 'right' : 'left';
  }

  return false;
}
