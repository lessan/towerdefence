import { createGrid } from './grid.js';
import { findPath } from './pathfinding.js';
import { recordStat } from './stats.js';

export const STATES = {
  MENU: 'MENU',
  WAVE_IDLE: 'WAVE_IDLE',
  WAVE_RUNNING: 'WAVE_RUNNING',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
};

export const state = {
  current: STATES.MENU,
  mode: 'regular',
  grid: null,
  towers: [],
  enemies: [],
  projectiles: [],
  gold: 0,
  lives: 0,
  wave: 0,
  totalWaves: 0,
  spawnQueue: [],
  spawnTimer: 0,
  waveIdleTimer: 0,
  waveMessage: null,
  waveMessageTimer: 0,
  unlocks: { lemonadecan: false },
  pathCache: null,
  gridDirty: false,
  feedback: null,
  newUnlock: false,
  unlockChecked: false,
  hoverTileX: undefined,
  hoverTileY: undefined,
  turboMode: false,
  autoProceed: false,
  mouseX: 0,
  mouseY: 0,
  selectedTowerTile: null,
  waveClearMessage: null,
  waveClearTimer: 0,
};

export function transitionTo(newState) {
  state.current = newState;
}

export function initGameState(mode) {
  state.mode = mode;
  state.grid = createGrid(20, 15);
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.gold = mode === 'boss' ? 400 : 200;
  state.lives = mode === 'boss' ? 10 : 20;
  state.wave = 0;
  state.totalWaves = mode === 'boss' ? 5 : 10;
  state.spawnQueue = [];
  state.pathCache = null;
  state.gridDirty = true;
  state.newUnlock = false;
  state.unlockChecked = false;
  state.selectedTowerTile = null;
  state.waveClearMessage = null;
  state.waveClearTimer = 0;
  recordStat('gamesStarted');
}

// Call after any grid change. Recomputes path and caches it.
// Returns the new path (array of {x,y}) or null if blocked.
export function refreshPath() {
  const SPAWN = { x: 0, y: 7 };
  const EXIT  = { x: 19, y: 7 };
  state.pathCache = findPath(state.grid, SPAWN, EXIT);
  state.gridDirty = false;
  return state.pathCache;
}

export function isGameOver() {
  return state.lives <= 0;
}

// Returns cached path, refreshing if dirty.
export function getPath() {
  if (state.gridDirty || !state.pathCache) refreshPath();
  return state.pathCache;
}
