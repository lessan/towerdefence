import { state, STATES, transitionTo, initGameState, getPath } from './state.js';
import { flushInput } from './input.js';
import { menuButtons } from './renderer.js';

export function update(dt) {
  switch (state.current) {
    case STATES.MENU:
      updateMenu();
      break;
    case STATES.WAVE_IDLE:
      getPath();
      break;
    case STATES.WAVE_RUNNING: break;
    case STATES.GAME_OVER: break;
    case STATES.VICTORY: break;
  }
}

function updateMenu() {
  const events = flushInput();
  for (const e of events) {
    if (e.type !== 'click' || e.button !== 0) continue;
    const { x, y } = e;

    const rb = menuButtons.regular;
    if (x >= rb.x && x < rb.x + rb.w && y >= rb.y && y < rb.y + rb.h) {
      initGameState('regular');
      transitionTo(STATES.WAVE_IDLE);
      return;
    }

    const bb = menuButtons.boss;
    if (x >= bb.x && x < bb.x + bb.w && y >= bb.y && y < bb.y + bb.h) {
      initGameState('boss');
      transitionTo(STATES.WAVE_IDLE);
      return;
    }
  }
}
