import { isWalkable } from './tiles';

interface Point {
  x: number;
  y: number;
}

const COLS = 20;
const ROWS = 14;
const DIRS: Point[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

/** BFS pathfinding from start to end tile. Returns path array (including end, excluding start). */
export function findPath(start: Point, end: Point): Point[] {
  if (start.x === end.x && start.y === end.y) return [];

  const key = (x: number, y: number) => y * COLS + x;
  const visited = new Set<number>();
  const parent = new Map<number, number>();

  const queue: Point[] = [start];
  visited.add(key(start.x, start.y));

  while (queue.length > 0) {
    const cur = queue.shift()!;

    for (const d of DIRS) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      const nk = key(nx, ny);

      if (visited.has(nk)) continue;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;

      // Allow walking to the end tile even if it's not walkable (desk/chair)
      const isEnd = nx === end.x && ny === end.y;
      if (!isEnd && !isWalkable(nx, ny)) continue;

      visited.add(nk);
      parent.set(nk, key(cur.x, cur.y));

      if (isEnd) {
        // Reconstruct path
        const path: Point[] = [];
        let ck = nk;
        while (ck !== key(start.x, start.y)) {
          path.push({ x: ck % COLS, y: Math.floor(ck / COLS) });
          ck = parent.get(ck)!;
        }
        path.reverse();
        return path;
      }

      queue.push({ x: nx, y: ny });
    }
  }

  // No path found — return direct line as fallback
  return [end];
}
