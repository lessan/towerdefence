import { getTile, setTile, isBuildable, TILE_TYPES } from './grid.js';
import { isPathBlocked } from './pathfinding.js';
import { state } from './state.js';
import { canAfford, spend, earn } from './economy.js';
import { recordStat } from './stats.js';

export const TOWER_DEFS = {
  crossbow: {
    name: "Squire's Crossbow",
    damage: 15,
    range: 3.0,
    fireRate: 1.5,
    cost: 50,
    aoe: false,
    special: null,
  },
  brazier: {
    name: "Alchemist's Brazier",
    damage: 8,
    range: 2.0,
    fireRate: 3.0,
    cost: 75,
    aoe: true,
    special: 'dot',
  },
  belltower: {
    name: "Herald's Bell Tower",
    damage: 15,
    range: 2.5,
    fireRate: 1.0,
    cost: 100,
    aoe: true,
    special: 'slow',
  },
  ballista: {
    name: 'Ballista of the Keep',
    damage: 60,
    range: 5.0,
    fireRate: 0.5,
    cost: 125,
    aoe: false,
    special: 'pierce',
  },
  lemonadecan: {
    name: 'The Lemonade Can',
    damage: 200,
    range: 6.0,
    fireRate: 4.0,
    cost: 300,
    aoe: true,
    special: 'splash',
  },
};

// Places a tower on the grid at (tileX, tileY) of the given type.
// Returns { success: boolean, reason?: string }
export function placeTower(tileX, tileY, type) {
  const def = TOWER_DEFS[type];
  if (!def) return { success: false, reason: 'Unknown tower type' };
  if (!isBuildable(state.grid, tileX, tileY)) return { success: false, reason: 'Not buildable' };
  if (!canAfford(def.cost)) return { success: false, reason: 'Not enough gold' };

  // Temporarily mark as TOWER to test path
  setTile(state.grid, tileX, tileY, TILE_TYPES.TOWER);
  if (isPathBlocked(state.grid, { x: 0, y: 7 }, { x: 19, y: 7 })) {
    // Revert — placement would block path
    setTile(state.grid, tileX, tileY, TILE_TYPES.GRASS);
    return { success: false, reason: 'Path blocked' };
  }

  // Confirmed — create the tower object and register it
  const tower = {
    id: `tower_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    tileX,
    tileY,
    ...def,
    lastFired: 1 / def.fireRate, // start ready to fire immediately
  };
  const tile = getTile(state.grid, tileX, tileY);
  tile.towerRef = tower;
  state.towers.push(tower);
  spend(def.cost);
  state.gridDirty = true;
  recordStat('towersPlaced');
  return { success: true };
}

// Sells the tower at (tileX, tileY). Returns { success, reason?, refund? }
export function sellTower(tileX, tileY) {
  const tile = getTile(state.grid, tileX, tileY);
  if (!tile || tile.type !== TILE_TYPES.TOWER) return { success: false, reason: 'No tower here' };
  const tower = tile.towerRef;
  const refund = Math.floor(tower.cost * 0.8);
  // Remove from state.towers
  state.towers = state.towers.filter(t => t.id !== tower.id);
  tile.towerRef = null;
  setTile(state.grid, tileX, tileY, TILE_TYPES.GRASS);
  earn(refund);
  state.gridDirty = true;
  recordStat('towersSold');
  return { success: true, refund };
}

// Stub — combat phase will fill this in
export function updateTowers(dt) {}
