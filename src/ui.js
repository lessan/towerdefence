import { state } from './state.js';
import { TOWER_DEFS } from './towers.js';
import { drawSprite } from './sprites.js';
import { getSelectedTowerType, setSelectedTowerType } from './input.js';

// Tower panel: 5 slots across the bottom of the canvas
// Each slot: 64px wide x 60px tall, starting at y=420
// Right side 345-640 is info area (selected tower description)

const PANEL_Y = 420;
const SLOT_W = 64;
const SLOT_H = 60;
const SLOTS_START_X = 8;

export function renderTowerPanel(ctx) {
  // Panel background
  ctx.fillStyle = 'rgba(20, 15, 30, 0.88)';
  ctx.fillRect(0, PANEL_Y, 640, 60);
  ctx.strokeStyle = '#555566';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, PANEL_Y, 640, 60);

  const towers = getTowerList();

  towers.forEach((def, i) => {
    const sx = SLOTS_START_X + i * (SLOT_W + 4);
    const sy = PANEL_Y + 4;
    const selected = getSelectedTowerType() === def.id;
    const canAfford = state.gold >= def.cost;

    // Slot background
    ctx.fillStyle = selected ? '#3a4a6a' : (canAfford ? '#2a2a3a' : '#1a1a22');
    ctx.fillRect(sx, sy, SLOT_W, SLOT_H - 8);

    // Selection border
    if (selected) {
      ctx.strokeStyle = '#7799ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, SLOT_W, SLOT_H - 8);
    }

    // Tower sprite (centred in slot)
    ctx.imageSmoothingEnabled = false;
    drawSprite(ctx, 'tower_' + def.id, sx + 16, sy + 4);

    // Key hint
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('[' + (i + 1) + ']', sx + 2, sy + SLOT_H - 12);

    // Cost
    ctx.fillStyle = canAfford ? '#FFD700' : '#884400';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(def.cost + 'g', sx + SLOT_W - 2, sy + SLOT_H - 12);

    // Lock indicator for lemonade can
    if (def.id === 'lemonadecan' && !state.unlocks.lemonadecan) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(sx, sy, SLOT_W, SLOT_H - 8);
      ctx.fillStyle = '#888888';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F512}', sx + SLOT_W / 2, sy + 30);
    }
  });

  // Selected tower info (right side)
  renderSelectedTowerInfo(ctx, towers);
}

function renderSelectedTowerInfo(ctx, towers) {
  const def = towers.find(t => t.id === getSelectedTowerType());
  if (!def) return;

  const ix = 345;
  const iy = PANEL_Y + 8;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(def.name, ix, iy + 10);

  ctx.fillStyle = '#aaccff';
  ctx.font = '10px monospace';
  ctx.fillText('DMG: ' + def.damage + '  RNG: ' + def.range + '  SPD: ' + def.fireRate + '/s', ix, iy + 24);

  ctx.fillStyle = state.gold >= def.cost ? '#FFD700' : '#ff6644';
  ctx.fillText('Cost: ' + def.cost + 'g  (have: ' + state.gold + 'g)', ix, iy + 38);

  if (def.special) {
    ctx.fillStyle = '#88ffaa';
    ctx.fillText(def.special, ix, iy + 52);
  }
}

function getTowerList() {
  return Object.entries(TOWER_DEFS).map(([id, def]) => ({ id, ...def }));
}

// Hit-test: returns tower type string if click is in the panel, null otherwise
export function panelHitTest(x, y) {
  if (y < PANEL_Y || y > PANEL_Y + 60) return null;
  const towers = getTowerList();
  for (let i = 0; i < towers.length; i++) {
    const sx = SLOTS_START_X + i * (SLOT_W + 4);
    if (x >= sx && x <= sx + SLOT_W) {
      const def = towers[i];
      // Don't select locked tower
      if (def.id === 'lemonadecan' && !state.unlocks.lemonadecan) return null;
      return def.id;
    }
  }
  return null;
}
