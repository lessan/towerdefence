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
