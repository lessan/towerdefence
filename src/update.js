import { state, STATES, transitionTo, initGameState, getPath, isGameOver } from './state.js';
import { flushInput, getSelectedTowerType, setSelectedTowerType } from './input.js';
import { menuButtons } from './renderer.js';
import { placeTower, sellTower } from './towers.js';
import { updateEnemies } from './enemies.js';
import { updateCombat } from './combat.js';
import { updateWaveSpawner, startWave } from './waves.js';
import { checkUnlock } from './unlock.js';

export function update(dt) {
  switch (state.current) {
    case STATES.MENU:
      updateMenu();
      break;
    case STATES.WAVE_IDLE: {
      getPath(); // keep cache fresh
      const events = flushInput();
      for (const e of events) {
        if (e.type === 'keydown') {
          const keyMap = { '1': 'crossbow', '2': 'brazier', '3': 'belltower', '4': 'ballista' };
          if (keyMap[e.key]) setSelectedTowerType(keyMap[e.key]);
          if (e.key === '5' && state.unlocks.lemonadecan) setSelectedTowerType('lemonadecan');
          continue;
        }
        if (e.type !== 'click') continue;

        // Check Start Wave button click
        if (e.button === 0) {
          if (e.x >= 440 && e.x <= 630 && e.y >= 450 && e.y <= 478) {
            if (state.waveIdleTimer <= 0 && state.wave < state.totalWaves) {
              startWave();
              continue; // skip tower placement for this click
            }
          }
        }

        const tileX = Math.floor(e.x / 32);
        const tileY = Math.floor(e.y / 32);
        if (e.button === 0) {
          // Left click — place tower
          const result = placeTower(tileX, tileY, getSelectedTowerType());
          if (!result.success) {
            state.feedback = { message: result.reason, timer: 1.5 };
          }
        } else if (e.button === 2) {
          // Right click — sell tower
          const result = sellTower(tileX, tileY);
          if (result.success) {
            state.feedback = { message: `+${result.refund}g`, timer: 1.0 };
          }
        }
      }
      // Auto-countdown between waves (not first wave)
      if (state.wave > 0 && state.waveIdleTimer > 0) {
        state.waveIdleTimer -= dt;
      }
      // Tick feedback timer
      if (state.feedback) {
        state.feedback.timer -= dt;
        if (state.feedback.timer <= 0) state.feedback = null;
      }
      break;
    }
    case STATES.WAVE_RUNNING:
      updateEnemies(dt);
      updateCombat(dt);
      updateWaveSpawner(dt);
      if (isGameOver()) {
        transitionTo(STATES.GAME_OVER);
      }
      break;
    case STATES.VICTORY: {
      if (!state.newUnlock) checkUnlock();
      const events = flushInput();
      for (const e of events) {
        if (e.type === 'click') transitionTo(STATES.MENU);
      }
      break;
    }
    case STATES.GAME_OVER: {
      const events = flushInput();
      for (const e of events) {
        if (e.type === 'click') transitionTo(STATES.MENU);
      }
      break;
    }
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
