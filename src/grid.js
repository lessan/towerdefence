export const TILE_TYPES = {
  GRASS: 'GRASS',
  TOWER: 'TOWER',
  UNBUILDABLE: 'UNBUILDABLE',
};

// Creates a cols x rows grid. Marks spawn, exit, and their immediate neighbours as UNBUILDABLE.
// Spawn: col 0, row 7. Exit: col 19, row 7.
export function createGrid(cols, rows) {
  const grid = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      row.push({ x, y, type: TILE_TYPES.GRASS, towerRef: null });
    }
    grid.push(row);
  }

  // Mark spawn (0,7) and exit (19,7) and their 4-directional neighbours as UNBUILDABLE
  const specialCells = [
    { x: 0, y: 7 },   // spawn
    { x: 19, y: 7 },  // exit
  ];
  const dirs = [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ];

  for (const cell of specialCells) {
    for (const dir of dirs) {
      const nx = cell.x + dir.dx;
      const ny = cell.y + dir.dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        grid[ny][nx].type = TILE_TYPES.UNBUILDABLE;
      }
    }
  }

  return grid;
}

// Returns tile object at (x, y), or null if out of bounds.
export function getTile(grid, x, y) {
  if (y < 0 || y >= grid.length) return null;
  if (x < 0 || x >= grid[0].length) return null;
  return grid[y][x];
}

// Sets the type of tile at (x, y). Does not allow changing UNBUILDABLE tiles.
export function setTile(grid, x, y, type) {
  const tile = getTile(grid, x, y);
  if (!tile) return false;
  if (tile.type === TILE_TYPES.UNBUILDABLE) return false;
  tile.type = type;
  return true;
}

// Returns true if tile is buildable (type === GRASS)
export function isBuildable(grid, x, y) {
  const tile = getTile(grid, x, y);
  if (!tile) return false;
  return tile.type === TILE_TYPES.GRASS;
}

// Returns array of all TOWER tiles (for rendering)
export function getTowerTiles(grid) {
  const towers = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x].type === TILE_TYPES.TOWER) {
        towers.push(grid[y][x]);
      }
    }
  }
  return towers;
}
