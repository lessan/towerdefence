import { createGrid } from './grid.js';

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
  unlocks: { lemonadecan: false },
  pathCache: null,
  gridDirty: false,
};

export function transitionTo(newState) {
  console.log(`[state] ${state.current} → ${newState}`);
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
}
