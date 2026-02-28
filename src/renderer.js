import { state, STATES, getPath } from './state.js';
import { getTile, TILE_TYPES } from './grid.js';
import { getSelectedTowerType } from './input.js';
import { TOWER_DEFS } from './towers.js';

// Button hit areas exported for input detection
export const menuButtons = {
  regular: { x: 220, y: 260, w: 200, h: 36 },
  boss: { x: 220, y: 310, w: 200, h: 36 },
};

export function render(ctx) {
  ctx.clearRect(0, 0, 640, 480);
  switch (state.current) {
    case STATES.MENU:
      renderMenu(ctx);
      break;
    default:
      renderGame(ctx);
      break;
  }
}

function renderMenu(ctx) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#f5e642';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REALM RAMPARTS', 320, 200);

  // Regular Mode button
  const rb = menuButtons.regular;
  ctx.fillStyle = '#3a7d44';
  ctx.fillRect(rb.x, rb.y, rb.w, rb.h);
  ctx.strokeStyle = '#5cb85c';
  ctx.lineWidth = 2;
  ctx.strokeRect(rb.x, rb.y, rb.w, rb.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Regular Mode', rb.x + rb.w / 2, rb.y + 24);

  // Boss Mode button
  const bb = menuButtons.boss;
  ctx.fillStyle = '#7d3a3a';
  ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
  ctx.strokeStyle = '#c85c5c';
  ctx.lineWidth = 2;
  ctx.strokeRect(bb.x, bb.y, bb.w, bb.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Boss Mode', bb.x + bb.w / 2, bb.y + 24);
}

function renderGame(ctx) {
  // Background
  ctx.fillStyle = '#3a7d44';
  ctx.fillRect(0, 0, 640, 480);

  // Draw each tile
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 20; x++) {
      const tile = getTile(state.grid, x, y);
      if (tile) drawTile(ctx, tile, x, y);
    }
  }

  // Draw path overlay
  const path = getPath();
  if (path) {
    ctx.fillStyle = 'rgba(255, 220, 50, 0.35)';
    for (const node of path) {
      ctx.fillRect(node.x * 32 + 2, node.y * 32 + 2, 28, 28);
    }
    // Draw spawn and exit markers
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(0 * 32 + 6, 7 * 32 + 6, 20, 20);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(19 * 32 + 6, 7 * 32 + 6, 20, 20);
  }

  // Draw towers
  const towerColors = {
    crossbow:    '#8B4513',
    brazier:     '#228B22',
    belltower:   '#4169E1',
    ballista:    '#696969',
    lemonadecan: '#FFD700',
  };
  for (const tower of state.towers) {
    const px = tower.tileX * 32;
    const py = tower.tileY * 32;
    ctx.fillStyle = towerColors[tower.type] || '#888';
    ctx.fillRect(px + 2, py + 2, 28, 28);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tower.type[0].toUpperCase(), px + 16, py + 20);
  }

  // Draw feedback message
  if (state.feedback) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(220, 220, 200, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.feedback.message, 320, 245);
  }

  // HUD
  renderHUD(ctx);
}

function renderHUD(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, 640, 28);
  ctx.fillStyle = '#FFD700';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Gold: ${state.gold}`, 8, 18);
  ctx.fillStyle = '#ff6666';
  ctx.fillText(`Lives: ${state.lives}`, 120, 18);
  ctx.fillStyle = '#aaffaa';
  ctx.fillText(`Wave: ${state.wave}/${state.totalWaves}`, 220, 18);
  ctx.fillStyle = '#ffffff';
  const selected = getSelectedTowerType();
  const def = TOWER_DEFS[selected];
  const label = def ? `${def.name} (${def.cost}g)` : selected;
  ctx.fillText(`[1-4] ${label}  [R-click] sell`, 340, 18);
}

function drawTile(ctx, tile, x, y) {
  const px = x * 32;
  const py = y * 32;
  switch (tile.type) {
    case TILE_TYPES.GRASS:
      ctx.fillStyle = '#4a8c50';
      ctx.fillRect(px, py, 32, 32);
      // subtle grid line
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.strokeRect(px, py, 32, 32);
      break;
    case TILE_TYPES.UNBUILDABLE:
      // Spawn and exit zones — distinct sandy/stone colour
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(px, py, 32, 32);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.strokeRect(px, py, 32, 32);
      break;
    case TILE_TYPES.TOWER:
      // Base grass under tower
      ctx.fillStyle = '#4a8c50';
      ctx.fillRect(px, py, 32, 32);
      break;
  }
}
