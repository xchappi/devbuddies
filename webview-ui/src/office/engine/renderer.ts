import type { Character, CharacterState } from '../../types';
import { OFFICE_GRID, getTile } from './tiles';

const TILE_SIZE = 16;
const COLS = 16;
const ROWS = 12;

// ── Color palettes ──────────────────────────────────────────────────

const FLOOR_LIGHT = '#3b3552';
const FLOOR_DARK = '#332e4a';
const WALL_COLOR = '#4a4464';
const WALL_TOP = '#5c5680';
const DESK_COLOR = '#7a5c3a';
const DESK_TOP = '#8d6b42';
const CHAIR_COLOR = '#555070';
const CHAIR_SEAT = '#6b6590';
const PLANT_POT = '#8d6b42';
const PLANT_LEAF = '#4a8c5c';
const PLANT_LEAF2 = '#3d7a4e';
const COMPUTER_BODY = '#2a2a3a';
const COMPUTER_SCREEN = '#4ae0a0';
const COMPUTER_SCREEN_OFF = '#1a3a2a';

// Character colors per state
const BODY_COLOR: Record<CharacterState, string> = {
  idle: '#6088c0',
  walking: '#6088c0',
  typing: '#60a0d0',
  executing: '#e08040',
  celebrating: '#e0d040',
};

const HEAD_COLOR = '#f0d0a0';
const HAIR_COLOR = '#5a3820';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = COLS * TILE_SIZE;
    this.height = ROWS * TILE_SIZE;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Resize the canvas to fit the container while maintaining pixel-perfect scaling */
  resize(containerWidth: number, containerHeight: number): void {
    const scaleX = Math.floor(containerWidth / this.width) || 1;
    const scaleY = Math.floor(containerHeight / this.height) || 1;
    const scale = Math.min(scaleX, scaleY);
    this.canvas.style.width = `${this.width * scale}px`;
    this.canvas.style.height = `${this.height * scale}px`;
  }

  /** Draw a full frame */
  draw(characters: Character[]): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw tiles
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = OFFICE_GRID[r * COLS + c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        switch (tile.type) {
          case 'floor':
            this.drawFloor(ctx, x, y, c, r);
            break;
          case 'wall':
            this.drawWall(ctx, x, y, r);
            break;
          case 'desk':
            this.drawFloor(ctx, x, y, c, r);
            this.drawDesk(ctx, x, y);
            break;
          case 'chair':
            this.drawFloor(ctx, x, y, c, r);
            this.drawChair(ctx, x, y);
            break;
          case 'plant':
            this.drawFloor(ctx, x, y, c, r);
            this.drawPlant(ctx, x, y);
            break;
          case 'computer':
            this.drawFloor(ctx, x, y, c, r);
            this.drawComputer(ctx, x, y, characters);
            break;
        }
      }
    }

    // Draw characters Z-sorted by Y position
    const sorted = [...characters].sort((a, b) => a.y - b.y);
    for (const char of sorted) {
      this.drawCharacter(ctx, char);
    }
  }

  // ── Tile drawing ──────────────────────────────────────────────────

  private drawFloor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    col: number,
    row: number,
  ): void {
    ctx.fillStyle = (col + row) % 2 === 0 ? FLOOR_LIGHT : FLOOR_DARK;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  private drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, row: number): void {
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    if (row === 0) {
      ctx.fillStyle = WALL_TOP;
      ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
    }
  }

  private drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Desk top
    ctx.fillStyle = DESK_TOP;
    ctx.fillRect(x + 1, y + 2, 14, 4);
    // Desk legs
    ctx.fillStyle = DESK_COLOR;
    ctx.fillRect(x + 2, y + 6, 2, 8);
    ctx.fillRect(x + 12, y + 6, 2, 8);
    // Desk surface highlight
    ctx.fillStyle = DESK_TOP;
    ctx.fillRect(x + 1, y + 6, 14, 2);
  }

  private drawChair(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Seat
    ctx.fillStyle = CHAIR_SEAT;
    ctx.fillRect(x + 3, y + 6, 10, 4);
    // Back
    ctx.fillStyle = CHAIR_COLOR;
    ctx.fillRect(x + 4, y + 2, 8, 4);
    // Legs
    ctx.fillRect(x + 4, y + 10, 2, 4);
    ctx.fillRect(x + 10, y + 10, 2, 4);
  }

  private drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Pot
    ctx.fillStyle = PLANT_POT;
    ctx.fillRect(x + 4, y + 10, 8, 5);
    ctx.fillRect(x + 5, y + 9, 6, 2);
    // Leaves
    ctx.fillStyle = PLANT_LEAF;
    ctx.fillRect(x + 5, y + 3, 6, 6);
    ctx.fillStyle = PLANT_LEAF2;
    ctx.fillRect(x + 3, y + 5, 4, 4);
    ctx.fillRect(x + 9, y + 4, 4, 4);
    // Stem
    ctx.fillStyle = PLANT_LEAF2;
    ctx.fillRect(x + 7, y + 7, 2, 3);
  }

  private drawComputer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    characters: Character[],
  ): void {
    // Monitor body
    ctx.fillStyle = COMPUTER_BODY;
    ctx.fillRect(x + 3, y + 4, 10, 8);
    // Screen — glow if any character is typing at this desk
    const col = Math.floor(x / TILE_SIZE);
    const hasActiveChar = characters.some(c => {
      const deskPos = [
        { x: 4, y: 3 },
        { x: 8, y: 3 },
        { x: 12, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 12, y: 7 },
      ];
      const seat = deskPos[c.deskIndex % deskPos.length];
      return seat.x === col && (c.state === 'typing' || c.state === 'executing');
    });
    ctx.fillStyle = hasActiveChar ? COMPUTER_SCREEN : COMPUTER_SCREEN_OFF;
    ctx.fillRect(x + 4, y + 5, 8, 6);
    // Stand
    ctx.fillStyle = COMPUTER_BODY;
    ctx.fillRect(x + 6, y + 12, 4, 2);
    ctx.fillRect(x + 5, y + 14, 6, 1);
  }

  // ── Character drawing ─────────────────────────────────────────────

  private drawCharacter(ctx: CanvasRenderingContext2D, char: Character): void {
    const x = Math.round(char.x);
    const y = Math.round(char.y);
    const flip = char.direction === 'left';
    const bounce = this.getBounce(char);

    // Body
    ctx.fillStyle = BODY_COLOR[char.state];
    ctx.fillRect(x + 4, y + 6 + bounce, 8, 7);

    // Head
    ctx.fillStyle = HEAD_COLOR;
    ctx.fillRect(x + 4, y + 1 + bounce, 8, 6);

    // Hair
    ctx.fillStyle = HAIR_COLOR;
    ctx.fillRect(x + 4, y + 1 + bounce, 8, 2);

    // Eyes
    ctx.fillStyle = '#222';
    if (flip) {
      ctx.fillRect(x + 5, y + 4 + bounce, 2, 2);
      ctx.fillRect(x + 8, y + 4 + bounce, 2, 2);
    } else {
      ctx.fillRect(x + 6, y + 4 + bounce, 2, 2);
      ctx.fillRect(x + 9, y + 4 + bounce, 2, 2);
    }

    // Arms
    ctx.fillStyle = BODY_COLOR[char.state];
    if (char.state === 'typing') {
      // Arms extended forward (typing)
      const armBounce = char.animFrame % 2 === 0 ? -1 : 0;
      ctx.fillRect(x + 2, y + 7 + bounce + armBounce, 3, 3);
      ctx.fillRect(x + 11, y + 7 + bounce - armBounce, 3, 3);
    } else {
      // Arms at sides
      ctx.fillRect(x + 2, y + 7 + bounce, 3, 5);
      ctx.fillRect(x + 11, y + 7 + bounce, 3, 5);
    }

    // Legs (walking animation)
    ctx.fillStyle = '#3a3a5a';
    if (char.state === 'walking') {
      const legOffset = char.animFrame % 2 === 0 ? 1 : -1;
      ctx.fillRect(x + 5, y + 13 + bounce, 3, 3);
      ctx.fillRect(x + 5 + legOffset, y + 14 + bounce, 3, 2);
      ctx.fillRect(x + 8, y + 13 + bounce, 3, 3);
      ctx.fillRect(x + 8 - legOffset, y + 14 + bounce, 3, 2);
    } else {
      ctx.fillRect(x + 5, y + 13, 3, 3);
      ctx.fillRect(x + 8, y + 13, 3, 3);
    }

    // Executing glow effect
    if (char.state === 'executing') {
      ctx.fillStyle = `rgba(224, 128, 64, ${0.2 + 0.1 * Math.sin(char.animFrame * 1.5)})`;
      ctx.fillRect(x + 1, y + bounce, 14, 16);
    }

    // Celebrating particles
    if (char.state === 'celebrating') {
      ctx.fillStyle = '#f0e040';
      const seed = char.animFrame;
      for (let i = 0; i < 4; i++) {
        const px = x + 4 + ((seed * 7 + i * 5) % 10);
        const py = y - 2 + ((seed * 3 + i * 4) % 6);
        ctx.fillRect(px, py, 2, 2);
      }
    }
  }

  private getBounce(char: Character): number {
    switch (char.state) {
      case 'typing':
        return char.animFrame % 2 === 0 ? -1 : 0;
      case 'idle':
        return char.animFrame % 4 < 2 ? 0 : -1;
      case 'celebrating':
        return -(char.animFrame % 3);
      default:
        return 0;
    }
  }
}
