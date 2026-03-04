import type { Tile, TileType } from '../../types';

const COLS = 16;
const ROWS = 12;

/** Create a tile with defaults */
function t(type: TileType, walkable = true): Tile {
  return { type, walkable, spriteX: 0, spriteY: 0 };
}

/** Build the 16x12 office layout as a flat array (row-major) */
function buildLayout(): Tile[] {
  const grid: Tile[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Top row = walls
      if (r === 0) {
        grid.push(t('wall', false));
        continue;
      }

      // Left and right walls
      if (c === 0 || c === COLS - 1) {
        grid.push(t('wall', false));
        continue;
      }

      // Desk positions (row 3 and row 7 at columns 4, 8, 12)
      const isDeskCol = c === 4 || c === 8 || c === 12;
      const isDeskRow = r === 3 || r === 7;
      const isChairRow = r === 4 || r === 8;

      if (isDeskCol && isDeskRow) {
        grid.push(t('desk', false));
        continue;
      }

      // Computers on desks (one tile above desk display area)
      if (isDeskCol && r === 2) {
        grid.push(t('computer', false));
        continue;
      }
      if (isDeskCol && r === 6) {
        grid.push(t('computer', false));
        continue;
      }

      // Chairs in front of desks
      if (isDeskCol && isChairRow) {
        grid.push(t('chair', true));
        continue;
      }

      // Plants in corners and along walls
      if (
        (r === 1 && (c === 1 || c === COLS - 2)) ||
        (r === ROWS - 1 && (c === 1 || c === COLS - 2)) ||
        (r === 5 && c === 1) ||
        (r === 5 && c === COLS - 2)
      ) {
        grid.push(t('plant', false));
        continue;
      }

      // Bottom wall
      if (r === ROWS - 1) {
        grid.push(t('wall', false));
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
