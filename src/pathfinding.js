import { getTile } from './grid.js';

const DIRS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Returns array of {x,y} waypoints (start->end inclusive), or null if no path.
export function findPath(grid, start, end) {
  const cols = grid[0].length;
  const rows = grid.length;
  const key = (x, y) => y * cols + x;

  const startKey = key(start.x, start.y);
  const endKey = key(end.x, end.y);

  const gScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map();
  const openSet = new Set();
  const closedSet = new Set();

  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(start, end));
  openSet.add(startKey);

  // Simple open set — pick lowest fScore each iteration
  while (openSet.size > 0) {
    let currentKey = -1;
    let bestF = Infinity;
    for (const k of openSet) {
      const f = fScore.get(k);
      if (f < bestF) {
        bestF = f;
        currentKey = k;
      }
    }

    if (currentKey === endKey) {
      // Reconstruct path
      const path = [];
      let ck = currentKey;
      while (ck !== undefined) {
        const cx = ck % cols;
        const cy = (ck - cx) / cols;
        path.push({ x: cx, y: cy });
        ck = cameFrom.get(ck);
      }
      path.reverse();
      return path;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    const cx = currentKey % cols;
    const cy = (currentKey - cx) / cols;
    const tentativeG = gScore.get(currentKey) + 1;

    for (const dir of DIRS) {
      const nx = cx + dir.dx;
      const ny = cy + dir.dy;
      const nk = key(nx, ny);

      if (closedSet.has(nk)) continue;

      const tile = getTile(grid, nx, ny);
      if (!tile || tile.type === 'TOWER') continue;

      if (!openSet.has(nk) || tentativeG < gScore.get(nk)) {
        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + heuristic({ x: nx, y: ny }, end));
        openSet.add(nk);
      }
    }
  }

  return null;
}

// Returns true if no valid path exists from start to end.
export function isPathBlocked(grid, start, end) {
  return findPath(grid, start, end) === null;
}
