import { state, STATES } from './state.js';

export function update(dt) {
  switch (state.current) {
    case STATES.MENU: break;
    case STATES.WAVE_IDLE: break;
    case STATES.WAVE_RUNNING: break;
    case STATES.GAME_OVER: break;
    case STATES.VICTORY: break;
  }
}
