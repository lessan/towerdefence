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
const SLOT_H_NORMAL = 52;
const SLOT_H_EXPANDED = 84;  // selected slot shows stats
const SLOT_Y_START = 24; // below compact HUD
const SLOT_X = SB_X + 10;
const SLOT_W = 240;

// Module-level hit areas — rebuilt each renderSidebar call
let currentTowerSlotRects = [];
let currentBtnStartwave = null;
let currentBtnAutoproceed = null;
let currentBtnTurbo = null;
let currentBtnSell = null;
let currentBtnMenu = null;

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

  // Compact HUD in sidebar top
  ctx.fillStyle = 'rgba(10, 8, 20, 0.95)';
  ctx.fillRect(SB_X, 0, SB_W, 22);
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`\u2B21 ${state.gold}g`, SB_X + 8, 15);
  ctx.fillStyle = state.lives <= 5 ? '#ff4444' : '#ff9999';
  ctx.fillText(`\u2665 ${state.lives}`, SB_X + 70, 15);
  ctx.fillStyle = '#aaddff';
  ctx.fillText(`W${state.wave}/${state.totalWaves}`, SB_X + 115, 15);
  ctx.fillStyle = state.mode === 'boss' ? '#ff6644' : '#88cc88';
  ctx.fillText(state.mode === 'boss' ? '\u2694BOSS' : '\u2605REG', SB_X + 160, 15);
  if (state.turboMode) {
    ctx.fillStyle = '#ffcc44';
    ctx.fillText('\u26A1\u00D72', SB_X + 215, 15);
  }

  // Tower slots with dynamic heights
  const towers = getTowerList();
  const selected = getSelectedTowerType();
  const towerSlotRects = [];

  let slotY = SLOT_Y_START;

  towers.forEach((def, i) => {
    const isSelected = selected === def.id;
    const slotH = isSelected ? SLOT_H_EXPANDED : SLOT_H_NORMAL;
    const isLocked = def.id === 'lemonadecan' && !state.unlocks.lemonadecan;
    const canAfford = state.gold >= def.cost;

    // Slot background
    ctx.fillStyle = isSelected ? '#3a4a6a' : (canAfford ? '#2a2a3a' : '#1a1a22');
    ctx.fillRect(SLOT_X, slotY, SLOT_W, slotH - 4);
    if (isSelected) {
      ctx.strokeStyle = '#7799ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(SLOT_X, slotY, SLOT_W, slotH - 4);
    }

    // Sprite
    ctx.imageSmoothingEnabled = false;
    drawSprite(ctx, 'tower_' + def.id, SLOT_X + 4, slotY + 8);

    // Name
    ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(def.name, SLOT_X + 40, slotY + 16);

    // Cost + key
    ctx.fillStyle = canAfford ? '#FFD700' : '#884400';
    ctx.font = '10px monospace';
    ctx.fillText(def.cost + 'g', SLOT_X + 40, slotY + 30);
    ctx.fillStyle = '#888888';
    ctx.fillText('[' + (i + 1) + ']', SLOT_X + 90, slotY + 30);

    // Expanded stats (only when selected)
    if (isSelected) {
      ctx.fillStyle = '#aaccff';
      ctx.font = '10px monospace';
      ctx.fillText(`DMG ${def.damage}  RNG ${def.range}  SPD ${def.fireRate}/s`, SLOT_X + 8, slotY + 48);
      if (def.special) {
        ctx.fillStyle = '#88ffaa';
        ctx.fillText(def.special, SLOT_X + 8, slotY + 62);
      }
      // Selection arrow
      ctx.fillStyle = '#7799ff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('\u25C0', SLOT_X + SLOT_W - 6, slotY + 22);
    }

    // Lock overlay
    if (isLocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(SLOT_X, slotY, SLOT_W, slotH - 4);
      ctx.fillStyle = '#888888';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F512}', SLOT_X + SLOT_W / 2, slotY + 28);
    }

    towerSlotRects.push({ id: def.id, x: SLOT_X, y: slotY, w: SLOT_W, h: slotH - 4 });
    slotY += slotH;
  });

  currentTowerSlotRects = towerSlotRects;

  // Dynamic button positions after tower slots
  const controlsY = slotY + 8;

  // Selected placed tower info + sell button
  let btnY = controlsY;
  if (state.selectedTowerTile) {
    const tile = getTile(state.grid, state.selectedTowerTile.x, state.selectedTowerTile.y);
    if (tile && tile.type === 'TOWER' && tile.towerRef) {
      const tw = tile.towerRef;
      const refund = Math.floor(tw.cost * 0.8);

      ctx.fillStyle = '#ffcc44';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(tw.name || tw.type, SLOT_X, btnY + 12);
      ctx.fillStyle = '#aaccff';
      ctx.font = '10px monospace';
      ctx.fillText('DMG: ' + tw.damage + '  RNG: ' + tw.range + '  SPD: ' + tw.fireRate + '/s', SLOT_X, btnY + 26);
      btnY += 32;

      // Sell button — greyed out during wave
      const canSell = state.current === STATES.WAVE_IDLE;
      const sellRect = { x: SLOT_X, y: btnY, w: SLOT_W, h: 22 };
      ctx.fillStyle = canSell ? '#6a2222' : '#2a2a2a';
      ctx.fillRect(sellRect.x, sellRect.y, sellRect.w, sellRect.h);
      ctx.strokeStyle = canSell ? '#8a3333' : '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(sellRect.x, sellRect.y, sellRect.w, sellRect.h);
      ctx.fillStyle = canSell ? '#ffcc88' : '#555555';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(canSell ? `SELL +${refund}g (80%)` : 'SELL (wave in progress)', sellRect.x + sellRect.w / 2, sellRect.y + 16);
      if (canSell) {
        ctx.fillStyle = '#888899';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('[DEL] to sell', SLOT_X + SLOT_W, sellRect.y + 32);
      }
      currentBtnSell = sellRect;
      btnY += 30;
    } else {
      currentBtnSell = null;
    }
  } else {
    currentBtnSell = null;
  }

  // Start Wave button
  if (state.current === STATES.WAVE_IDLE) {
    const swRect = { x: SLOT_X, y: btnY, w: SLOT_W, h: 34 };
    const timerActive = state.autoProceed && state.waveIdleTimer > 0;
    const canStart = state.wave < state.totalWaves && !timerActive;

    ctx.fillStyle = canStart ? '#4a7c59' : '#555566';
    ctx.fillRect(swRect.x, swRect.y, swRect.w, swRect.h);
    ctx.strokeStyle = canStart ? '#6a9c79' : '#666677';
    ctx.lineWidth = 1;
    ctx.strokeRect(swRect.x, swRect.y, swRect.w, swRect.h);

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
    ctx.fillText(btnLabel, swRect.x + swRect.w / 2, swRect.y + 22);
    currentBtnStartwave = swRect;
    btnY += 42;
  } else {
    currentBtnStartwave = null;
  }

  // Auto-proceed toggle
  if (state.current === STATES.WAVE_IDLE) {
    const apRect = { x: SLOT_X, y: btnY, w: SLOT_W, h: 28 };
    ctx.fillStyle = state.autoProceed ? '#2a3a5a' : '#1a1a2a';
    ctx.fillRect(apRect.x, apRect.y, apRect.w, apRect.h);
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    ctx.strokeRect(apRect.x, apRect.y, apRect.w, apRect.h);

    ctx.fillStyle = state.autoProceed ? '#aaccff' : '#888899';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    const apLabel = state.autoProceed ? '[\u2713] Auto-proceed (5s)' : '[ ] Auto-proceed';
    ctx.fillText(apLabel, apRect.x + 8, apRect.y + 18);
    currentBtnAutoproceed = apRect;
    btnY += 36;
  } else {
    currentBtnAutoproceed = null;
  }

  // Turbo toggle — visible in WAVE_IDLE and WAVE_RUNNING
  if (state.current === STATES.WAVE_IDLE || state.current === STATES.WAVE_RUNNING) {
    const tRect = { x: SLOT_X, y: btnY, w: SLOT_W, h: 28 };
    ctx.fillStyle = state.turboMode ? '#3a2a1a' : '#1a1a2a';
    ctx.fillRect(tRect.x, tRect.y, tRect.w, tRect.h);
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    ctx.strokeRect(tRect.x, tRect.y, tRect.w, tRect.h);

    ctx.fillStyle = state.turboMode ? '#ffcc44' : '#888899';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    const turboLabel = state.turboMode ? '[\u2713] Turbo x2 \u26A1' : '[ ] Turbo x2';
    ctx.fillText(turboLabel, tRect.x + 8, tRect.y + 18);
    currentBtnTurbo = tRect;
    btnY += 36;
  } else {
    currentBtnTurbo = null;
  }

  // Back to Menu button — always visible, pinned to bottom
  const menuRect = { x: SLOT_X, y: 434, w: SLOT_W, h: 34 };
  ctx.fillStyle = '#4a2222';
  ctx.fillRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h);
  ctx.strokeStyle = '#6a3333';
  ctx.lineWidth = 1;
  ctx.strokeRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h);

  ctx.fillStyle = '#ffaaaa';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Back to Menu', menuRect.x + menuRect.w / 2, menuRect.y + 22);
  currentBtnMenu = menuRect;
}

// Hit-test: returns action string or null
export function sidebarHitTest(x, y) {
  if (x < SB_X) return null;

  // Tower slot hit test (dynamic rects)
  for (const rect of currentTowerSlotRects) {
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
      return 'tower:' + rect.id;
    }
  }

  // Sell button (only when a tower is selected AND during WAVE_IDLE)
  if (state.selectedTowerTile && currentBtnSell && state.current === STATES.WAVE_IDLE && hitRect(x, y, currentBtnSell)) return 'sell';

  // Start Wave button
  if (currentBtnStartwave && hitRect(x, y, currentBtnStartwave)) return 'startwave';

  // Auto-proceed toggle
  if (currentBtnAutoproceed && hitRect(x, y, currentBtnAutoproceed)) return 'autoproceed';

  // Turbo toggle
  if (currentBtnTurbo && hitRect(x, y, currentBtnTurbo)) return 'turbo';

  // Menu button
  if (currentBtnMenu && hitRect(x, y, currentBtnMenu)) return 'menu';

  return null;
}

function hitRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Keep old exports as aliases for backwards compatibility
export const renderTowerPanel = renderSidebar;
export const panelHitTest = sidebarHitTest;
