import type { Tile, TileType } from '../../types';

const COLS = 20;
const ROWS = 14;

/** Create a tile with defaults */
function t(type: TileType, walkable = true): Tile {
  return { type, walkable, spriteX: 0, spriteY: 0 };
}

/**
 * Build the 20x14 office layout as a flat array (row-major).
 *
 * Layout sketch:
 *  Row 0:  wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall
 *  Row 1:  wall plant window  ...windows...  window clock window  ...  window plant wall
 *  Row 2:  wall  comp  .  comp  .  comp  .  comp  . whiteboard . bookshelf . coffee . water . plant wall
 *  Row 3:  wall  desk  .  desk  .  desk  .  desk  .  .  .  .  .  .  .  .  .  .  wall
 *  Row 4:  wall  chair .  chair .  chair .  chair .  .  .  .  .  .  .  .  .  .  wall
 *  Row 5:  wall  .  .  .  .  .  rug rug rug rug rug rug  .  .  .  .  .  .  .  wall
 *  Row 6:  wall  .  .  .  .  .  rug rug rug rug rug rug  .  .  .  .  .  .  .  wall
 *  Row 7:  wall  comp  .  comp  .  comp  .  comp  .  .  .  .  .  .  .  .  .  .  wall
 *  Row 8:  wall  desk  .  desk  .  desk  .  desk  .  .  .  .  .  .  .  .  .  .  wall
 *  Row 9:  wall  chair .  chair .  chair .  chair .  .  .  .  .  .  .  .  .  .  wall
 *  Row 10: wall  .  .  .  .  .  rug rug rug rug rug rug  .  .  .  .  .  .  .  wall
 *  Row 11: wall  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  wall
 *  Row 12: wall plant .  .  .  .  .  .  .  door  .  .  .  .  .  .  .  .  plant wall
 *  Row 13: wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall wall
 */
function buildLayout(): Tile[] {
  const grid: Tile[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Top and bottom walls
      if (r === 0 || r === ROWS - 1) {
        grid.push(t('wall', false));
        continue;
      }

      // Left and right walls
      if (c === 0 || c === COLS - 1) {
        grid.push(t('wall', false));
        continue;
      }

      // ── Row 1: Windows along top wall ──
      if (r === 1) {
        if (c === 1 || c === COLS - 2) {
          grid.push(t('plant', false));
          continue;
        }
        if (c === 10) {
          grid.push(t('clock', false));
          continue;
        }
        if (c >= 3 && c <= 17 && c !== 10) {
          grid.push(t('window', false));
          continue;
        }
        grid.push(t('floor', true));
        continue;
      }

      // ── Desk columns: 4, 8, 12, 16 ──
      const isDeskCol = c === 4 || c === 8 || c === 12 || c === 16;

      // Top row of desks (row 3) and bottom row (row 8)
      if (isDeskCol && (r === 3 || r === 8)) {
        grid.push(t('desk', false));
        continue;
      }

      // Computers above desks (row 2, row 7)
      if (isDeskCol && (r === 2 || r === 7)) {
        grid.push(t('computer', false));
        continue;
      }

      // Chairs below desks (row 4, row 9)
      if (isDeskCol && (r === 4 || r === 9)) {
        grid.push(t('chair', true));
        continue;
      }

      // ── Right-side furniture (row 2) ──
      if (r === 2 && c === 14) {
        grid.push(t('whiteboard', false));
        continue;
      }
      if (r === 2 && c === 15) {
        grid.push(t('bookshelf', false));
        continue;
      }
      if (r === 3 && c === 14) {
        grid.push(t('coffee_machine', false));
        continue;
      }
      if (r === 3 && c === 15) {
        grid.push(t('water_cooler', false));
        continue;
      }

      // ── Rug in center area ──
      if ((r === 5 || r === 6 || r === 10) && c >= 7 && c <= 12) {
        grid.push(t('rug', true));
        continue;
      }

      // ── Door at bottom center ──
      if (r === 12 && c === 10) {
        grid.push(t('door', true));
        continue;
      }

      // ── Corner plants ──
      if (r === 12 && (c === 1 || c === COLS - 2)) {
        grid.push(t('plant', false));
        continue;
      }

      // ── Extra plants along walls ──
      if (r === 6 && c === 1) {
        grid.push(t('plant', false));
        continue;
      }
      if (r === 6 && c === COLS - 2) {
        grid.push(t('plant', false));
        continue;
      }

      // Everything else is walkable floor
      grid.push(t('floor', true));
    }
  }

  return grid;
}

export const OFFICE_GRID = buildLayout();

/** Check if a tile is walkable */
export function isWalkable(col: number, row: number): boolean {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  return OFFICE_GRID[row * COLS + col].walkable;
}

/** Get tile at position */
export function getTile(col: number, row: number): Tile | undefined {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return undefined;
  return OFFICE_GRID[row * COLS + col];
}
