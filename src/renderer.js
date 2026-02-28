import { state, STATES, getPath } from './state.js';
import { getTile, TILE_TYPES } from './grid.js';
import { getSelectedTowerType } from './input.js';
import { TOWER_DEFS } from './towers.js';
import { drawSprite } from './sprites.js';

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
    case STATES.GAME_OVER:
      renderGame(ctx);
      renderGameOver(ctx);
      break;
    case STATES.VICTORY:
      renderGame(ctx);
      renderVictory(ctx);
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
  // Layer 0: Background
  ctx.fillStyle = '#3a7d44';
  ctx.fillRect(0, 0, 640, 480);

  // Layer 1: Tiles
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 20; x++) {
      const tile = getTile(state.grid, x, y);
      if (tile) drawTileSprite(ctx, tile, x, y);
    }
  }

  // Layer 2: Path overlay
  const path = getPath();
  if (path) {
    ctx.fillStyle = 'rgba(255, 220, 50, 0.35)';
    for (const node of path) {
      ctx.fillRect(node.x * 32 + 2, node.y * 32 + 2, 28, 28);
    }
  }

  // Layer 3: Spawn/exit markers
  if (path) {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(0 * 32 + 6, 7 * 32 + 6, 20, 20);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(19 * 32 + 6, 7 * 32 + 6, 20, 20);
  }

  // Layer 4: Tower range preview (WAVE_IDLE only)
  if (state.current === STATES.WAVE_IDLE) {
    drawRangePreview(ctx);
  }

  // Layer 5: Towers
  for (const tower of state.towers) {
    ctx.imageSmoothingEnabled = false;
    drawSprite(ctx, 'tower_' + tower.type, tower.tileX * 32, tower.tileY * 32);
  }

  // Layer 6: Enemies + HP bars
  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy);
  }

  // Layer 7 & 8: Projectiles (including ring effects)
  for (const proj of state.projectiles) {
    drawProjectile(ctx, proj);
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

  // Layer 9: HUD bar
  renderHUD(ctx);

  // Layer 10: Tower panel / Start Wave button (bottom area)
  if (state.current === STATES.WAVE_IDLE) {
    const btnLabel = state.wave === 0
      ? 'Start Wave 1'
      : state.waveIdleTimer > 0
        ? `Next wave in ${Math.ceil(state.waveIdleTimer)}s`
        : `Send Wave ${state.wave + 1}`;

    ctx.fillStyle = state.waveIdleTimer > 0 ? '#555566' : '#4a7c59';
    ctx.fillRect(440, 450, 190, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(btnLabel, 535, 469);
  }

  // Wave message banner (WAVE_RUNNING only)
  if (state.waveMessage) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(160, 210, 320, 40);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.waveMessage, 320, 237);
  }
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
  const hint = state.unlocks.lemonadecan ? `[1-5] ${label}  [R-click] sell` : `[1-4] ${label}  [R-click] sell`;
  ctx.fillText(hint, 340, 18);
}

function drawTileSprite(ctx, tile, x, y) {
  const px = x * 32;
  const py = y * 32;
  ctx.imageSmoothingEnabled = false;
  switch (tile.type) {
    case TILE_TYPES.GRASS:
      drawSprite(ctx, 'tile_grass', px, py);
      break;
    case TILE_TYPES.UNBUILDABLE:
      drawSprite(ctx, 'tile_unbuildable', px, py);
      break;
    case TILE_TYPES.TOWER:
      drawSprite(ctx, 'tile_tower', px, py);
      break;
  }
}

function drawRangePreview(ctx) {
  const mx = state.hoverTileX;
  const my = state.hoverTileY;
  if (mx === undefined || my === undefined) return;

  const tile = getTile(state.grid, mx, my);
  if (!tile) return;

  let rangePx = 0;
  let colour = 'rgba(255,255,255,0.2)';

  if (tile.type === 'GRASS') {
    // Hovering buildable tile — show selected tower range
    const def = TOWER_DEFS[getSelectedTowerType()];
    if (def) rangePx = def.range * 32;
    colour = 'rgba(100,200,255,0.2)';
  } else if (tile.type === 'TOWER' && tile.towerRef) {
    // Hovering placed tower — show its range
    rangePx = tile.towerRef.range * 32;
    colour = 'rgba(255,200,100,0.25)';
  }

  if (rangePx > 0) {
    const cx = mx * 32 + 16;
    const cy = my * 32 + 16;
    ctx.beginPath();
    ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.strokeStyle = colour.replace('0.2', '0.6').replace('0.25', '0.6');
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawEnemy(ctx, enemy) {
  // Draw sprite centred on enemy position
  ctx.imageSmoothingEnabled = false;
  drawSprite(ctx, 'enemy_' + enemy.type, Math.round(enemy.x) - 16, Math.round(enemy.y) - 16);

  // Armour indicator (Wyrm) — grey outline
  if (enemy.special === 'armour') {
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(Math.round(enemy.x), Math.round(enemy.y), 13, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Slow indicator — blue tint ring
  if (enemy.slowTimer > 0) {
    ctx.strokeStyle = 'rgba(100,150,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(Math.round(enemy.x), Math.round(enemy.y), 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  // HP bar above the sprite (only show when damaged)
  if (enemy.hp < enemy.maxHp) {
    const barW = 24;
    const barH = 4;
    const bx = Math.round(enemy.x) - barW / 2;
    const by = Math.round(enemy.y) - 16 - 6;
    ctx.fillStyle = '#550000';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(bx, by, Math.round(barW * (enemy.hp / enemy.maxHp)), barH);
  }
}

function drawProjectile(ctx, proj) {
  // Layer 8: Ring projectile (Bell Tower expanding arc) — no sprite
  if (proj.kind === 'ring') {
    const age = proj.age || 0;
    const radius = 20 + age * 80;
    const alpha = 1 - age / 0.3;
    ctx.strokeStyle = `rgba(100, 160, 255, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(Math.round(proj.x), Math.round(proj.y), radius, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  // Layer 7: Travelling projectile sprite
  ctx.imageSmoothingEnabled = false;
  drawSprite(ctx, 'proj_' + proj.towerType, Math.round(proj.x) - 6, Math.round(proj.y) - 6);
}

function renderGameOver(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', 320, 200);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText(`Wave ${state.wave} / ${state.totalWaves}`, 320, 255);
  ctx.fillText(`Gold: ${state.gold}`, 320, 285);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  ctx.fillText('click to return to menu', 320, 360);
}

function renderVictory(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, 640, 480);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', 320, 180);

  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText(`Lives remaining: ${state.lives} / ${state.mode === 'boss' ? 10 : 20}`, 320, 240);
  ctx.fillText(`Gold: ${state.gold}`, 320, 270);

  if (state.newUnlock) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SECRET UNLOCKED: The Lemonade Can!', 320, 330);
    ctx.fillStyle = '#ffff88';
    ctx.font = '15px monospace';
    ctx.fillText('Key [5] now available in future games', 320, 358);
  }

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  ctx.fillText('click to return to menu', 320, 420);
}
