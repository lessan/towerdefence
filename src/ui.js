import { state, STATES } from './state.js';
import { TOWER_DEFS } from './towers.js';
import { getTile } from './grid.js';
import { drawSprite } from './sprites.js';
import { getSelectedTowerType, setSelectedTowerType } from './input.js';

// Sidebar layout constants
const SB_X = 640;       // sidebar left edge
const SB_W = 260;       // sidebar width
const SB_H = 480;

// Tower slot layout — single column, 5 rows
const SLOT_H = 52;
const SLOT_Y_START = 30; // below HUD extension
const SLOT_X = SB_X + 10;
const SLOT_W = 240;

// Button areas (for hit testing)
const BTN_STARTWAVE   = { x: SB_X + 10, y: 310, w: 240, h: 34 };
const BTN_AUTOPROCEED = { x: SB_X + 10, y: 352, w: 240, h: 28 };
const BTN_TURBO       = { x: SB_X + 10, y: 388, w: 240, h: 28 };
const BTN_SELL        = { x: SB_X + 10, y: 296, w: 240, h: 22 };
const BTN_MENU        = { x: SB_X + 10, y: 434, w: 240, h: 34 };

function getTowerList() {
  return Object.entries(TOWER_DEFS).map(([id, def]) => ({ id, ...def }));
}

export function renderSidebar(ctx) {
  // Sidebar background
  ctx.fillStyle = 'rgba(15, 12, 25, 0.92)';
  ctx.fillRect(SB_X, 0, SB_W, SB_H);

  // Separator line between game area and sidebar
  ctx.strokeStyle = '#554488';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SB_X, 0);
  ctx.lineTo(SB_X, SB_H);
  ctx.stroke();

  // HUD extension bar at top of sidebar
  ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
  ctx.fillRect(SB_X, 0, SB_W, 26);

  // Tower slots
  const towers = getTowerList();
  const selected = getSelectedTowerType();

  towers.forEach((def, i) => {
    const sy = SLOT_Y_START + i * SLOT_H;
    const isSelected = selected === def.id;
    const canAfford = state.gold >= def.cost;
    const isLocked = def.id === 'lemonadecan' && !state.unlocks.lemonadecan;

    // Slot background
    ctx.fillStyle = isSelected ? '#3a4a6a' : (canAfford ? '#2a2a3a' : '#1a1a22');
    ctx.fillRect(SLOT_X, sy, SLOT_W, SLOT_H - 4);

    // Selection border
    if (isSelected) {
      ctx.strokeStyle = '#7799ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(SLOT_X, sy, SLOT_W, SLOT_H - 4);
    }

    // Tower sprite (left 40px area, centred)
    ctx.imageSmoothingEnabled = false;
    drawSprite(ctx, 'tower_' + def.id, SLOT_X + 4, sy + 8);

    // Tower name (bold)
    ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(def.name, SLOT_X + 40, sy + 16);

    // Cost and key shortcut
    ctx.fillStyle = canAfford ? '#FFD700' : '#884400';
    ctx.font = '10px monospace';
    ctx.fillText(def.cost + 'g', SLOT_X + 40, sy + 30);

    ctx.fillStyle = '#888888';
    ctx.fillText('[' + (i + 1) + ']', SLOT_X + 40 + 50, sy + 30);

    // Selection indicator (right side)
    if (isSelected) {
      ctx.fillStyle = '#7799ff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('\u25C0', SLOT_X + SLOT_W - 6, sy + 22);
    }

    // Lock overlay for lemonade can
    if (isLocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(SLOT_X, sy, SLOT_W, SLOT_H - 4);
      ctx.fillStyle = '#888888';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F512}', SLOT_X + SLOT_W / 2, sy + 30);
    }
  });

  // Selected tower description area (y: 268–308)
  if (state.selectedTowerTile) {
    // Show selected placed tower info + sell button
    const tile = getTile(state.grid, state.selectedTowerTile.x, state.selectedTowerTile.y);
    if (tile && tile.type === 'TOWER' && tile.towerRef) {
      const tw = tile.towerRef;
      const refund = Math.floor(tw.cost * 0.8);
      ctx.fillStyle = '#ffcc44';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(tw.name || tw.type, SLOT_X, 274);
      ctx.fillStyle = '#aaccff';
      ctx.font = '10px monospace';
      ctx.fillText('DMG: ' + tw.damage + '  RNG: ' + tw.range + '  SPD: ' + tw.fireRate + '/s', SLOT_X, 288);

      // Sell button
      ctx.fillStyle = '#6a2222';
      ctx.fillRect(BTN_SELL.x, BTN_SELL.y, BTN_SELL.w, BTN_SELL.h);
      ctx.strokeStyle = '#8a3333';
      ctx.lineWidth = 1;
      ctx.strokeRect(BTN_SELL.x, BTN_SELL.y, BTN_SELL.w, BTN_SELL.h);
      ctx.fillStyle = '#ffaaaa';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SELL +' + refund + 'g (80%)', BTN_SELL.x + BTN_SELL.w / 2, BTN_SELL.y + 16);
      ctx.fillStyle = '#888899';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('[DEL] to sell', SLOT_X + SLOT_W, BTN_SELL.y + 32);
    }
  } else {
    // Show tower-to-place description
    const selDef = towers.find(t => t.id === selected);
    if (selDef) {
      ctx.fillStyle = '#aaccff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('DMG: ' + selDef.damage + '  RNG: ' + selDef.range + '  SPD: ' + selDef.fireRate + '/s', SLOT_X, 280);
      if (selDef.special) {
        ctx.fillStyle = '#88ffaa';
        ctx.fillText('Special: ' + selDef.special, SLOT_X, 296);
      }
    }
  }

  // Start Wave button (y: 310–344)
  if (state.current === STATES.WAVE_IDLE) {
    const timerActive = state.autoProceed && state.waveIdleTimer > 0;
    const canStart = state.wave < state.totalWaves && !timerActive;

    ctx.fillStyle = canStart ? '#4a7c59' : '#555566';
    ctx.fillRect(BTN_STARTWAVE.x, BTN_STARTWAVE.y, BTN_STARTWAVE.w, BTN_STARTWAVE.h);
    ctx.strokeStyle = canStart ? '#6a9c79' : '#666677';
    ctx.lineWidth = 1;
    ctx.strokeRect(BTN_STARTWAVE.x, BTN_STARTWAVE.y, BTN_STARTWAVE.w, BTN_STARTWAVE.h);

    let btnLabel;
    if (state.wave === 0) {
      btnLabel = 'Start Wave 1  \u2192';
    } else if (timerActive) {
      btnLabel = 'Wave ' + (state.wave + 1) + ' in ' + Math.ceil(state.waveIdleTimer) + 's';
    } else {
      btnLabel = 'Next Wave \u2192';
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(btnLabel, BTN_STARTWAVE.x + BTN_STARTWAVE.w / 2, BTN_STARTWAVE.y + 22);
  }

  // Auto-proceed toggle (y: 352–380)
  if (state.current === STATES.WAVE_IDLE) {
    ctx.fillStyle = state.autoProceed ? '#2a3a5a' : '#1a1a2a';
    ctx.fillRect(BTN_AUTOPROCEED.x, BTN_AUTOPROCEED.y, BTN_AUTOPROCEED.w, BTN_AUTOPROCEED.h);
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    ctx.strokeRect(BTN_AUTOPROCEED.x, BTN_AUTOPROCEED.y, BTN_AUTOPROCEED.w, BTN_AUTOPROCEED.h);

    ctx.fillStyle = state.autoProceed ? '#aaccff' : '#888899';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    const apLabel = state.autoProceed ? '[\u2713] Auto-proceed (5s)' : '[ ] Auto-proceed';
    ctx.fillText(apLabel, BTN_AUTOPROCEED.x + 8, BTN_AUTOPROCEED.y + 18);
  }

  // Turbo toggle (y: 388–416) — visible in WAVE_IDLE and WAVE_RUNNING
  if (state.current === STATES.WAVE_IDLE || state.current === STATES.WAVE_RUNNING) {
    ctx.fillStyle = state.turboMode ? '#3a2a1a' : '#1a1a2a';
    ctx.fillRect(BTN_TURBO.x, BTN_TURBO.y, BTN_TURBO.w, BTN_TURBO.h);
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    ctx.strokeRect(BTN_TURBO.x, BTN_TURBO.y, BTN_TURBO.w, BTN_TURBO.h);

    ctx.fillStyle = state.turboMode ? '#ffcc44' : '#888899';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    const turboLabel = state.turboMode ? '[\u2713] Turbo x2 \u26A1' : '[ ] Turbo x2';
    ctx.fillText(turboLabel, BTN_TURBO.x + 8, BTN_TURBO.y + 18);
  }

  // Back to Menu button (y: 434–468) — always visible
  ctx.fillStyle = '#4a2222';
  ctx.fillRect(BTN_MENU.x, BTN_MENU.y, BTN_MENU.w, BTN_MENU.h);
  ctx.strokeStyle = '#6a3333';
  ctx.lineWidth = 1;
  ctx.strokeRect(BTN_MENU.x, BTN_MENU.y, BTN_MENU.w, BTN_MENU.h);

  ctx.fillStyle = '#ffaaaa';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Back to Menu', BTN_MENU.x + BTN_MENU.w / 2, BTN_MENU.y + 22);
}

// Hit-test: returns action string or null
export function sidebarHitTest(x, y) {
  if (x < SB_X) return null;

  // Tower slot hit test
  const towers = getTowerList();
  for (let i = 0; i < towers.length; i++) {
    const sy = SLOT_Y_START + i * SLOT_H;
    if (x >= SLOT_X && x <= SLOT_X + SLOT_W && y >= sy && y <= sy + SLOT_H - 4) {
      return 'tower:' + towers[i].id;
    }
  }

  // Sell button (only when a tower is selected)
  if (state.selectedTowerTile && hitRect(x, y, BTN_SELL)) return 'sell';

  // Start Wave button
  if (hitRect(x, y, BTN_STARTWAVE)) return 'startwave';

  // Auto-proceed toggle
  if (hitRect(x, y, BTN_AUTOPROCEED)) return 'autoproceed';

  // Turbo toggle
  if (hitRect(x, y, BTN_TURBO)) return 'turbo';

  // Menu button
  if (hitRect(x, y, BTN_MENU)) return 'menu';

  return null;
}

function hitRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Keep old exports as aliases for backwards compatibility
export const renderTowerPanel = renderSidebar;
export const panelHitTest = sidebarHitTest;
