import type { Character, CharacterState } from '../../types';
import { OFFICE_GRID, getTile } from './tiles';
import { getPalette } from './characterPalettes';
import type { CharacterPalette } from './characterPalettes';
import type { ParticleSystem, Particle } from './particles';

const TILE_SIZE = 16;
const COLS = 20;
const ROWS = 14;

// ── Color palettes ──────────────────────────────────────────────────

// Floor — wood plank
const WOOD_BASE = '#5a4a3a';
const WOOD_LIGHT = '#6b5a48';
const WOOD_DARK = '#4a3a2a';
const WOOD_LINE = '#3e3020';

// Walls
const WALL_COLOR = '#4a4464';
const WALL_TOP = '#5c5680';
const WALL_BASEBOARD = '#3a3450';
const WALL_BRICK_LIGHT = '#524c6a';

// Rug
const RUG_COLOR = '#8b4040';
const RUG_BORDER = '#6a3030';
const RUG_PATTERN = '#a05050';

// Desk
const DESK_COLOR = '#7a5c3a';
const DESK_TOP = '#8d6b42';

// Chair
const CHAIR_COLOR = '#555070';
const CHAIR_SEAT = '#6b6590';

// Plant
const PLANT_POT = '#8d6b42';
const PLANT_LEAF = '#4a8c5c';
const PLANT_LEAF2 = '#3d7a4e';

// Computer
const COMPUTER_BODY = '#2a2a3a';
const COMPUTER_SCREEN = '#4ae0a0';
const COMPUTER_SCREEN_OFF = '#1a3a2a';

// Window
const WINDOW_FRAME = '#6a6480';
const WINDOW_SKY = '#4080c0';
const WINDOW_SKY_LIGHT = '#60a0e0';

// Whiteboard
const WHITEBOARD_BG = '#e8e8e0';
const WHITEBOARD_FRAME = '#888888';

// Bookshelf
const BOOKSHELF_WOOD = '#6a4a2a';
const BOOK_COLORS = ['#cc4444', '#4488cc', '#44aa44', '#ddaa22', '#8844aa', '#44aaaa'];

// Coffee machine
const COFFEE_BODY = '#3a3a3a';
const COFFEE_TOP = '#4a4a4a';

// Water cooler
const WATER_BOTTLE = '#a0d0f0';
const WATER_BODY = '#888888';

// Door
const DOOR_COLOR = '#6a5030';
const DOOR_FRAME = '#4a3a20';
const DOOR_HANDLE = '#c0a040';

// Character state overlay colors
const STATE_COLORS: Record<CharacterState, string> = {
  idle: '#6088c0',
  walking: '#6088c0',
  typing: '#60a0d0',
  executing: '#e08040',
  celebrating: '#e0d040',
};

/** Desk positions for computer screen glow matching */
const DESK_POSITIONS = [
  { x: 4, y: 3 },
  { x: 8, y: 3 },
  { x: 12, y: 3 },
  { x: 16, y: 3 },
  { x: 4, y: 8 },
  { x: 8, y: 8 },
  { x: 12, y: 8 },
  { x: 16, y: 8 },
];

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

  /** Get the current display scale for hit testing */
  getScale(): number {
    const displayWidth = parseInt(this.canvas.style.width) || this.width;
    return displayWidth / this.width;
  }

  /** Draw a full frame */
  draw(characters: Character[], particles: ParticleSystem, timeMs: number, _alpha: number): void {
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
            this.drawWall(ctx, x, y, r, c, timeMs);
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
            this.drawPlant(ctx, x, y, timeMs);
            break;
          case 'computer':
            this.drawFloor(ctx, x, y, c, r);
            this.drawComputer(ctx, x, y, c, characters, timeMs);
            break;
          case 'window':
            this.drawWindow(ctx, x, y, timeMs);
            break;
          case 'whiteboard':
            this.drawFloor(ctx, x, y, c, r);
            this.drawWhiteboard(ctx, x, y);
            break;
          case 'bookshelf':
            this.drawFloor(ctx, x, y, c, r);
            this.drawBookshelf(ctx, x, y);
            break;
          case 'coffee_machine':
            this.drawFloor(ctx, x, y, c, r);
            this.drawCoffeeMachine(ctx, x, y, timeMs);
            break;
          case 'water_cooler':
            this.drawFloor(ctx, x, y, c, r);
            this.drawWaterCooler(ctx, x, y);
            break;
          case 'clock':
            this.drawClock(ctx, x, y);
            break;
          case 'rug':
            this.drawRug(ctx, x, y, c, r);
            break;
          case 'door':
            this.drawFloor(ctx, x, y, c, r);
            this.drawDoor(ctx, x, y);
            break;
        }
      }
    }

    // Draw monitor glow on floor when character is typing
    for (const char of characters) {
      if (char.state === 'typing' || char.state === 'executing') {
        const desk = DESK_POSITIONS[char.deskIndex % DESK_POSITIONS.length];
        const glowX = desk.x * TILE_SIZE;
        const glowY = (desk.y + 1) * TILE_SIZE;
        const glowAlpha = char.state === 'typing'
          ? 0.08 + 0.03 * Math.sin(timeMs / 500)
          : 0.1 + 0.04 * Math.sin(timeMs / 300);
        const glowColor = char.state === 'typing' ? '74, 224, 160' : '224, 128, 64';
        ctx.fillStyle = `rgba(${glowColor}, ${glowAlpha})`;
        ctx.fillRect(glowX - 4, glowY, TILE_SIZE + 8, TILE_SIZE);
      }
    }

    // Draw characters Z-sorted by Y position
    const sorted = [...characters].sort((a, b) => a.y - b.y);
    for (const char of sorted) {
      this.drawCharacter(ctx, char, timeMs);
    }

    // Draw particles on top
    this.drawParticles(ctx, particles);
  }

  // ── Floor ──────────────────────────────────────────────────────────

  private drawFloor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    col: number,
    _row: number,
  ): void {
    // Wood plank base
    ctx.fillStyle = col % 2 === 0 ? WOOD_BASE : WOOD_LIGHT;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Horizontal plank lines
    ctx.fillStyle = WOOD_LINE;
    ctx.fillRect(x, y + 4, TILE_SIZE, 1);
    ctx.fillRect(x, y + 10, TILE_SIZE, 1);

    // Subtle color variation
    if ((col + _row) % 3 === 0) {
      ctx.fillStyle = WOOD_DARK;
      ctx.fillRect(x + 2, y + 1, 4, 2);
    }
  }

  // ── Wall ───────────────────────────────────────────────────────────

  private drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, row: number, col: number, _timeMs: number): void {
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Subtle brick pattern
    if (row === 0) {
      ctx.fillStyle = WALL_BRICK_LIGHT;
      const offset = (col % 2) * 8;
      ctx.fillRect(x + offset, y + 2, 7, 5);
      ctx.fillRect(x + ((offset + 8) % 16), y + 9, 7, 5);

      // Top accent
      ctx.fillStyle = WALL_TOP;
      ctx.fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 3);
    }

    // Bottom wall with baseboard
    if (row === ROWS - 1) {
      ctx.fillStyle = WALL_BASEBOARD;
      ctx.fillRect(x, y, TILE_SIZE, 3);
    }

    // Side walls baseboard
    if ((col === 0 || col === COLS - 1) && row > 0 && row < ROWS - 1) {
      ctx.fillStyle = WALL_BASEBOARD;
      if (col === 0) {
        ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
      } else {
        ctx.fillRect(x, y, 2, TILE_SIZE);
      }
    }
  }

  // ── Window ─────────────────────────────────────────────────────────

  private drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number): void {
    // Wall background
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Window frame
    ctx.fillStyle = WINDOW_FRAME;
    ctx.fillRect(x + 1, y + 2, 14, 12);

    // Sky gradient (two-tone)
    const skyShift = Math.sin(timeMs / 8000) * 0.1;
    ctx.fillStyle = WINDOW_SKY;
    ctx.fillRect(x + 2, y + 3, 12, 5);
    ctx.fillStyle = WINDOW_SKY_LIGHT;
    ctx.fillRect(x + 2, y + 8, 12, 5);

    // Cross frame
    ctx.fillStyle = WINDOW_FRAME;
    ctx.fillRect(x + 7, y + 3, 2, 10);
    ctx.fillRect(x + 2, y + 7, 12, 2);

    // Light reflection
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + skyShift})`;
    ctx.fillRect(x + 3, y + 4, 3, 2);
  }

  // ── Desk ───────────────────────────────────────────────────────────

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
    // Wood grain detail
    ctx.fillStyle = DESK_COLOR;
    ctx.fillRect(x + 4, y + 3, 8, 1);
  }

  // ── Chair ──────────────────────────────────────────────────────────

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
    // Seat cushion highlight
    ctx.fillStyle = '#7a7498';
    ctx.fillRect(x + 4, y + 7, 8, 1);
  }

  // ── Plant ──────────────────────────────────────────────────────────

  private drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number): void {
    // Pot
    ctx.fillStyle = PLANT_POT;
    ctx.fillRect(x + 4, y + 10, 8, 5);
    ctx.fillRect(x + 5, y + 9, 6, 2);
    // Pot rim
    ctx.fillStyle = '#a07848';
    ctx.fillRect(x + 3, y + 9, 10, 1);

    // Leaf sway (1px oscillation)
    const sway = Math.sin(timeMs / 2000) > 0 ? 1 : 0;

    // Leaves
    ctx.fillStyle = PLANT_LEAF;
    ctx.fillRect(x + 5 + sway, y + 3, 6, 6);
    ctx.fillStyle = PLANT_LEAF2;
    ctx.fillRect(x + 3, y + 5 + sway, 4, 4);
    ctx.fillRect(x + 9, y + 4, 4, 4);
    // Stem
    ctx.fillStyle = PLANT_LEAF2;
    ctx.fillRect(x + 7, y + 7, 2, 3);
  }

  // ── Computer ───────────────────────────────────────────────────────

  private drawComputer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    col: number,
    characters: Character[],
    timeMs: number,
  ): void {
    // Monitor body
    ctx.fillStyle = COMPUTER_BODY;
    ctx.fillRect(x + 3, y + 4, 10, 8);

    // Screen — glow if any character is typing at this desk
    const hasActiveChar = characters.some(c => {
      const seat = DESK_POSITIONS[c.deskIndex % DESK_POSITIONS.length];
      return seat.x === col && (c.state === 'typing' || c.state === 'executing');
    });

    if (hasActiveChar) {
      // Screen flicker effect
      const flicker = 0.85 + 0.15 * Math.sin(timeMs / 200);
      const r = Math.round(74 * flicker);
      const g = Math.round(224 * flicker);
      const b = Math.round(160 * flicker);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else {
      ctx.fillStyle = COMPUTER_SCREEN_OFF;
    }
    ctx.fillRect(x + 4, y + 5, 8, 6);

    // Screen text lines (when active)
    if (hasActiveChar) {
      ctx.fillStyle = '#2a6a4a';
      ctx.fillRect(x + 5, y + 6, 5, 1);
      ctx.fillRect(x + 5, y + 8, 6, 1);
      ctx.fillRect(x + 5, y + 10, 4, 1);
    }

    // Stand
    ctx.fillStyle = COMPUTER_BODY;
    ctx.fillRect(x + 6, y + 12, 4, 2);
    ctx.fillRect(x + 5, y + 14, 6, 1);
  }

  // ── Whiteboard ─────────────────────────────────────────────────────

  private drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Frame
    ctx.fillStyle = WHITEBOARD_FRAME;
    ctx.fillRect(x + 1, y + 1, 14, 14);
    // White surface
    ctx.fillStyle = WHITEBOARD_BG;
    ctx.fillRect(x + 2, y + 2, 12, 12);
    // Scribble lines
    ctx.fillStyle = '#cc4444';
    ctx.fillRect(x + 3, y + 4, 7, 1);
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(x + 4, y + 7, 8, 1);
    ctx.fillStyle = '#44aa44';
    ctx.fillRect(x + 3, y + 10, 6, 1);
    // Marker tray
    ctx.fillStyle = '#666666';
    ctx.fillRect(x + 3, y + 13, 10, 1);
  }

  // ── Bookshelf ──────────────────────────────────────────────────────

  private drawBookshelf(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Wooden frame
    ctx.fillStyle = BOOKSHELF_WOOD;
    ctx.fillRect(x + 1, y + 1, 14, 14);
    // Shelves
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(x + 2, y + 7, 12, 1);
    ctx.fillRect(x + 2, y + 13, 12, 1);
    // Books (top shelf)
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = BOOK_COLORS[i % BOOK_COLORS.length];
      ctx.fillRect(x + 2 + i * 2, y + 2, 2, 5);
    }
    // Books (bottom shelf)
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = BOOK_COLORS[(i + 3) % BOOK_COLORS.length];
      ctx.fillRect(x + 3 + i * 2, y + 8, 2, 5);
    }
  }

  // ── Coffee Machine ─────────────────────────────────────────────────

  private drawCoffeeMachine(ctx: CanvasRenderingContext2D, x: number, y: number, timeMs: number): void {
    // Body
    ctx.fillStyle = COFFEE_BODY;
    ctx.fillRect(x + 3, y + 4, 10, 10);
    // Top
    ctx.fillStyle = COFFEE_TOP;
    ctx.fillRect(x + 4, y + 2, 8, 3);
    // Indicator light (blinking)
    const lightOn = Math.sin(timeMs / 1000) > 0;
    ctx.fillStyle = lightOn ? '#44ff44' : '#224422';
    ctx.fillRect(x + 11, y + 5, 1, 1);
    // Spout
    ctx.fillStyle = '#555555';
    ctx.fillRect(x + 6, y + 11, 4, 2);
    // Cup
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(x + 6, y + 13, 4, 2);
  }

  // ── Water Cooler ───────────────────────────────────────────────────

  private drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Bottle
    ctx.fillStyle = WATER_BOTTLE;
    ctx.fillRect(x + 5, y + 1, 6, 6);
    ctx.fillRect(x + 6, y + 0, 4, 2);
    // Bottle highlight
    ctx.fillStyle = '#c0e8ff';
    ctx.fillRect(x + 6, y + 2, 2, 3);
    // Body
    ctx.fillStyle = WATER_BODY;
    ctx.fillRect(x + 4, y + 7, 8, 7);
    // Spigots
    ctx.fillStyle = '#cc4444';
    ctx.fillRect(x + 5, y + 9, 2, 1);
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(x + 9, y + 9, 2, 1);
  }

  // ── Clock ──────────────────────────────────────────────────────────

  private drawClock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Wall background
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Clock body (circle approximated by rect)
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(x + 3, y + 3, 10, 10);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + 4, y + 2, 8, 12);
    ctx.fillRect(x + 2, y + 4, 12, 8);

    // Clock face
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4, y + 4, 8, 8);

    // Clock hands — real time
    const now = new Date();
    const cx = x + 8;
    const cy = y + 8;

    // Hour hand
    const hourAngle = ((now.getHours() % 12) + now.getMinutes() / 60) * (Math.PI / 6) - Math.PI / 2;
    const hx = Math.round(cx + Math.cos(hourAngle) * 2);
    const hy = Math.round(cy + Math.sin(hourAngle) * 2);
    ctx.fillStyle = '#222222';
    ctx.fillRect(Math.min(cx, hx), Math.min(cy, hy), Math.abs(hx - cx) || 1, Math.abs(hy - cy) || 1);

    // Minute hand
    const minAngle = (now.getMinutes() / 60) * Math.PI * 2 - Math.PI / 2;
    const mx = Math.round(cx + Math.cos(minAngle) * 3);
    const my = Math.round(cy + Math.sin(minAngle) * 3);
    ctx.fillStyle = '#444444';
    ctx.fillRect(Math.min(cx, mx), Math.min(cy, my), Math.abs(mx - cx) || 1, Math.abs(my - cy) || 1);

    // Center dot
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(cx, cy, 1, 1);

    // Border detail
    ctx.fillStyle = '#888888';
    ctx.fillRect(x + 3, y + 3, 10, 1);
    ctx.fillRect(x + 3, y + 12, 10, 1);
  }

  // ── Rug ────────────────────────────────────────────────────────────

  private drawRug(ctx: CanvasRenderingContext2D, x: number, y: number, col: number, row: number): void {
    // First draw wood floor beneath
    ctx.fillStyle = col % 2 === 0 ? WOOD_BASE : WOOD_LIGHT;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Rug base
    ctx.fillStyle = RUG_COLOR;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Border edges
    const isLeft = col === 7;
    const isRight = col === 12;
    const isTop = row === 5;
    const isBottom = row === 6 || row === 10;

    if (isLeft) {
      ctx.fillStyle = RUG_BORDER;
      ctx.fillRect(x, y, 2, TILE_SIZE);
    }
    if (isRight) {
      ctx.fillStyle = RUG_BORDER;
      ctx.fillRect(x + 14, y, 2, TILE_SIZE);
    }
    if (isTop) {
      ctx.fillStyle = RUG_BORDER;
      ctx.fillRect(x, y, TILE_SIZE, 2);
    }
    if (isBottom) {
      ctx.fillStyle = RUG_BORDER;
      ctx.fillRect(x, y + 14, TILE_SIZE, 2);
    }

    // Pattern
    if ((col + row) % 2 === 0) {
      ctx.fillStyle = RUG_PATTERN;
      ctx.fillRect(x + 4, y + 4, 4, 4);
      ctx.fillRect(x + 10, y + 10, 4, 4);
    }
  }

  // ── Door ───────────────────────────────────────────────────────────

  private drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Door frame
    ctx.fillStyle = DOOR_FRAME;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Door body
    ctx.fillStyle = DOOR_COLOR;
    ctx.fillRect(x + 2, y + 1, 12, 14);
    // Panel detail
    ctx.fillStyle = '#5a4020';
    ctx.fillRect(x + 3, y + 2, 10, 5);
    ctx.fillRect(x + 3, y + 9, 10, 5);
    // Handle
    ctx.fillStyle = DOOR_HANDLE;
    ctx.fillRect(x + 11, y + 7, 2, 2);
  }

  // ── Character drawing ─────────────────────────────────────────────

  private drawCharacter(ctx: CanvasRenderingContext2D, char: Character, timeMs: number): void {
    const x = Math.round(char.x);
    const y = Math.round(char.y);
    const flip = char.direction === 'left';
    const bounce = this.getBounce(char);
    const palette = getPalette(char.paletteIndex);

    // 1px dark outline/shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 3, y + 2 + bounce, 10, 14);

    // ── Body/Shirt ──
    ctx.fillStyle = palette.shirt;
    ctx.fillRect(x + 4, y + 7 + bounce, 8, 5);
    // Shirt shadow
    ctx.fillStyle = palette.shirtShadow;
    ctx.fillRect(x + 4, y + 10 + bounce, 8, 2);
    // Collar detail
    ctx.fillStyle = palette.shirt;
    ctx.fillRect(x + 5, y + 7 + bounce, 6, 1);

    // ── Head ──
    ctx.fillStyle = palette.skin;
    ctx.fillRect(x + 4, y + 1 + bounce, 8, 6);
    // Skin shading (shadow side)
    ctx.fillStyle = palette.skinShadow;
    if (flip) {
      ctx.fillRect(x + 10, y + 2 + bounce, 2, 4);
    } else {
      ctx.fillRect(x + 4, y + 2 + bounce, 2, 4);
    }

    // ── Hair ──
    this.drawHair(ctx, x, y + bounce, palette, flip);

    // ── Eyes ──
    const blinkFrame = char.animFrame === 7; // blink on frame 7 of 8
    if (!blinkFrame) {
      // Eye whites
      ctx.fillStyle = '#ffffff';
      if (flip) {
        ctx.fillRect(x + 5, y + 4 + bounce, 2, 2);
        ctx.fillRect(x + 8, y + 4 + bounce, 2, 2);
      } else {
        ctx.fillRect(x + 6, y + 4 + bounce, 2, 2);
        ctx.fillRect(x + 9, y + 4 + bounce, 2, 2);
      }
      // Pupils (direction-aware)
      ctx.fillStyle = '#222222';
      const eyeOff = flip ? -1 : 0;
      if (flip) {
        ctx.fillRect(x + 5 + eyeOff, y + 4 + bounce, 1, 2);
        ctx.fillRect(x + 8 + eyeOff, y + 4 + bounce, 1, 2);
      } else {
        ctx.fillRect(x + 7 + eyeOff, y + 4 + bounce, 1, 2);
        ctx.fillRect(x + 10 + eyeOff, y + 4 + bounce, 1, 2);
      }
      // Eye highlight
      ctx.fillStyle = '#ffffff';
      if (flip) {
        ctx.fillRect(x + 6, y + 4 + bounce, 1, 1);
        ctx.fillRect(x + 9, y + 4 + bounce, 1, 1);
      } else {
        ctx.fillRect(x + 6, y + 4 + bounce, 1, 1);
        ctx.fillRect(x + 9, y + 4 + bounce, 1, 1);
      }
    } else {
      // Closed eyes (blink)
      ctx.fillStyle = '#222222';
      if (flip) {
        ctx.fillRect(x + 5, y + 5 + bounce, 2, 1);
        ctx.fillRect(x + 8, y + 5 + bounce, 2, 1);
      } else {
        ctx.fillRect(x + 6, y + 5 + bounce, 2, 1);
        ctx.fillRect(x + 9, y + 5 + bounce, 2, 1);
      }
    }

    // ── Arms ──
    if (char.state === 'typing') {
      // Arms extended forward (typing) with bounce
      const armBounce = char.animFrame % 2 === 0 ? -1 : 0;
      // Shirt color arms
      ctx.fillStyle = palette.shirt;
      ctx.fillRect(x + 2, y + 7 + bounce + armBounce, 3, 3);
      ctx.fillRect(x + 11, y + 7 + bounce - armBounce, 3, 3);
      // Hands (skin color)
      ctx.fillStyle = palette.skin;
      ctx.fillRect(x + 1, y + 8 + bounce + armBounce, 2, 2);
      ctx.fillRect(x + 13, y + 8 + bounce - armBounce, 2, 2);
    } else if (char.state === 'executing') {
      // Raised arms
      ctx.fillStyle = palette.shirt;
      ctx.fillRect(x + 1, y + 4 + bounce, 3, 4);
      ctx.fillRect(x + 12, y + 4 + bounce, 3, 4);
      ctx.fillStyle = palette.skin;
      ctx.fillRect(x + 1, y + 3 + bounce, 2, 2);
      ctx.fillRect(x + 13, y + 3 + bounce, 2, 2);
    } else if (char.state === 'celebrating') {
      // Arms up celebrating
      const wave = Math.sin(timeMs / 100) > 0 ? -1 : 0;
      ctx.fillStyle = palette.shirt;
      ctx.fillRect(x + 1, y + 3 + bounce + wave, 3, 4);
      ctx.fillRect(x + 12, y + 3 + bounce - wave, 3, 4);
      ctx.fillStyle = palette.skin;
      ctx.fillRect(x + 0, y + 2 + bounce + wave, 2, 2);
      ctx.fillRect(x + 14, y + 2 + bounce - wave, 2, 2);
    } else {
      // Arms at sides
      ctx.fillStyle = palette.shirt;
      ctx.fillRect(x + 2, y + 7 + bounce, 3, 5);
      ctx.fillRect(x + 11, y + 7 + bounce, 3, 5);
      // Hands
      ctx.fillStyle = palette.skin;
      ctx.fillRect(x + 2, y + 11 + bounce, 2, 2);
      ctx.fillRect(x + 12, y + 11 + bounce, 2, 2);
    }

    // ── Pants ──
    ctx.fillStyle = palette.pants;
    ctx.fillRect(x + 5, y + 12 + bounce, 6, 2);

    // ── Legs/Shoes ──
    ctx.fillStyle = palette.shoes;
    if (char.state === 'walking') {
      const legOffset = char.animFrame % 2 === 0 ? 1 : -1;
      ctx.fillRect(x + 5 + legOffset, y + 14 + bounce, 3, 2);
      ctx.fillRect(x + 8 - legOffset, y + 14 + bounce, 3, 2);
    } else {
      ctx.fillRect(x + 5, y + 14, 3, 2);
      ctx.fillRect(x + 8, y + 14, 3, 2);
    }

    // ── State effects ──
    // Executing glow
    if (char.state === 'executing') {
      ctx.fillStyle = `rgba(224, 128, 64, ${0.15 + 0.1 * Math.sin(timeMs / 200)})`;
      ctx.fillRect(x + 1, y + bounce, 14, 16);
    }

    // Celebrating jump
    if (char.state === 'celebrating') {
      // Already handled via bounce, but add state color overlay
      ctx.fillStyle = `rgba(224, 208, 64, ${0.08 + 0.05 * Math.sin(timeMs / 150)})`;
      ctx.fillRect(x + 2, y + bounce, 12, 14);
    }
  }

  private drawHair(ctx: CanvasRenderingContext2D, x: number, y: number, palette: CharacterPalette, flip: boolean): void {
    ctx.fillStyle = palette.hair;

    switch (palette.hairStyle) {
      case 'short':
        ctx.fillRect(x + 4, y + 1, 8, 2);
        ctx.fillRect(x + 3, y + 1, 1, 3);
        ctx.fillRect(x + 12, y + 1, 1, 3);
        break;
      case 'long':
        ctx.fillRect(x + 4, y + 1, 8, 2);
        ctx.fillRect(x + 3, y + 1, 1, 6);
        ctx.fillRect(x + 12, y + 1, 1, 6);
        ctx.fillRect(x + 3, y + 7, 2, 2);
        ctx.fillRect(x + 11, y + 7, 2, 2);
        break;
      case 'ponytail':
        ctx.fillRect(x + 4, y + 1, 8, 2);
        if (flip) {
          ctx.fillRect(x + 3, y + 2, 2, 2);
          ctx.fillRect(x + 2, y + 3, 2, 4);
        } else {
          ctx.fillRect(x + 11, y + 2, 2, 2);
          ctx.fillRect(x + 12, y + 3, 2, 4);
        }
        break;
      case 'buzz':
        ctx.fillRect(x + 4, y + 1, 8, 1);
        ctx.fillRect(x + 5, y + 0, 6, 1);
        break;
      case 'curly':
        ctx.fillRect(x + 3, y + 0, 10, 3);
        ctx.fillRect(x + 3, y + 1, 1, 3);
        ctx.fillRect(x + 12, y + 1, 1, 3);
        // Curly bumps
        ctx.fillRect(x + 4, y + 0, 2, 1);
        ctx.fillRect(x + 8, y + 0, 2, 1);
        break;
    }
  }

  private getBounce(char: Character): number {
    switch (char.state) {
      case 'typing':
        return char.animFrame % 2 === 0 ? -1 : 0;
      case 'idle':
        // Breathing animation — slower with 8 frames
        return char.animFrame % 8 < 4 ? 0 : -1;
      case 'celebrating':
        // Jump animation
        return -Math.abs(Math.sin(char.animFrame * 0.8)) * 3;
      default:
        return 0;
    }
  }

  // ── Particles ─────────────────────────────────────────────────────

  private drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleSystem): void {
    for (const p of particles.getParticles()) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
