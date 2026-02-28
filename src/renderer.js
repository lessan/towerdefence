import { state, STATES, getPath } from './state.js';
import { getTile, TILE_TYPES } from './grid.js';

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
      // Placeholder tower — dark grey square with a lighter inner square
      ctx.fillStyle = '#4a8c50';
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#555566';
      ctx.fillRect(px + 4, py + 4, 24, 24);
      break;
  }
}
