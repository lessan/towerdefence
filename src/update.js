import { state, STATES, transitionTo, initGameState, getPath, isGameOver } from './state.js';
import { flushInput, getSelectedTowerType, setSelectedTowerType } from './input.js';
import { menuButtons } from './renderer.js';
import { sidebarHitTest } from './ui.js';
import { placeTower, sellTower } from './towers.js';
import { getTile } from './grid.js';
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

      // Auto-proceed countdown (only if autoProceed is ON and not first wave)
      if (state.autoProceed && state.wave > 0 && state.wave < state.totalWaves) {
        state.waveIdleTimer -= dt;
        if (state.waveIdleTimer <= 0) {
          startWave();
          break;
        }
      }

      const events = flushInput();
      for (const e of events) {
        // Panel clicks (sidebar area x >= 640)
        if (e.type === 'click' && e.button === 0) {
          const sidebarAction = sidebarHitTest(e.x, e.y);
          if (sidebarAction) {
            handleSidebarAction(sidebarAction);
            continue;
          }
          // Game grid clicks (x < 640)
          if (e.x < 640) {
            const tileX = Math.floor(e.x / 32);
            const tileY = Math.floor(e.y / 32);
            const tile = getTile(state.grid, tileX, tileY);
            if (tile && tile.type === 'TOWER') {
              // Select placed tower for inspection
              state.selectedTowerTile = { x: tileX, y: tileY };
            } else {
              // Deselect any selected tower, then place
              state.selectedTowerTile = null;
              const result = placeTower(tileX, tileY, getSelectedTowerType());
              if (!result.success) state.feedback = { message: result.reason, timer: 1.5 };
            }
          }
        } else if (e.type === 'click' && e.button === 2 && e.x < 640) {
          const tileX = Math.floor(e.x / 32);
          const tileY = Math.floor(e.y / 32);
          const result = sellTower(tileX, tileY);
          if (result.success) {
            state.feedback = { message: `+${result.refund}g`, timer: 1.0 };
            // Clear selection if we sold the selected tower
            if (state.selectedTowerTile && state.selectedTowerTile.x === tileX && state.selectedTowerTile.y === tileY) {
              state.selectedTowerTile = null;
            }
          }
        } else if (e.type === 'keydown') {
          const keyMap = { '1': 'crossbow', '2': 'brazier', '3': 'belltower', '4': 'ballista' };
          if (keyMap[e.key]) { setSelectedTowerType(keyMap[e.key]); state.selectedTowerTile = null; }
          if (e.key === '5' && state.unlocks.lemonadecan) { setSelectedTowerType('lemonadecan'); state.selectedTowerTile = null; }
          if (e.key === 't' || e.key === 'T') state.turboMode = !state.turboMode;
          if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedTowerTile) {
            const st = state.selectedTowerTile;
            const result = sellTower(st.x, st.y);
            if (result.success) state.feedback = { message: `+${result.refund}g`, timer: 1.0 };
            state.selectedTowerTile = null;
          }
        }
      }
      // Tick feedback timer
      if (state.feedback) {
        state.feedback.timer -= dt;
        if (state.feedback.timer <= 0) state.feedback = null;
      }
      break;
    }
    case STATES.WAVE_RUNNING: {
      updateEnemies(dt);
      updateCombat(dt);
      updateWaveSpawner(dt);
      if (isGameOver()) transitionTo(STATES.GAME_OVER);
      const events = flushInput();
      for (const e of events) {
        if (e.type === 'click' && e.button === 0) {
          const sidebarAction = sidebarHitTest(e.x, e.y);
          if (sidebarAction) handleSidebarAction(sidebarAction);
        } else if (e.type === 'keydown') {
          if (e.key === 't' || e.key === 'T') state.turboMode = !state.turboMode;
        }
      }
      break;
    }
    case STATES.VICTORY: {
      if (!state.unlockChecked) {
        state.unlockChecked = true;
        checkUnlock();
      }
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

function handleSidebarAction(action) {
  switch (action) {
    case 'menu': transitionTo(STATES.MENU); break;
    case 'turbo': state.turboMode = !state.turboMode; break;
    case 'autoproceed':
      state.autoProceed = !state.autoProceed;
      if (state.autoProceed && state.waveIdleTimer <= 0) state.waveIdleTimer = 5;
      break;
    case 'startwave':
      if (state.current === STATES.WAVE_IDLE && state.wave < state.totalWaves) {
        startWave();
      }
      break;
    case 'sell':
      if (state.selectedTowerTile) {
        const st = state.selectedTowerTile;
        const result = sellTower(st.x, st.y);
        if (result.success) state.feedback = { message: `+${result.refund}g`, timer: 1.0 };
        state.selectedTowerTile = null;
      }
      break;
    default:
      // Tower selection
      if (action.startsWith('tower:')) {
        const type = action.split(':')[1];
        if (type === 'lemonadecan' && !state.unlocks.lemonadecan) break;
        setSelectedTowerType(type);
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
