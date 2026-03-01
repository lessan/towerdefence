import { state, STATES, getPath } from './state.js';
import { getTile, TILE_TYPES } from './grid.js';
import { getSelectedTowerType } from './input.js';
import { TOWER_DEFS } from './towers.js';
import { drawSprite } from './sprites.js';
import { renderSidebar } from './ui.js';

// Button hit areas exported for input detection
export const menuButtons = {
  regular: { x: 210, y: 280, w: 220, h: 40 },
  boss: { x: 210, y: 335, w: 220, h: 40 },
};

export function render(ctx) {
  ctx.clearRect(0, 0, 900, 480);
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
  // Dark starry background
  ctx.fillStyle = '#0d0d1f';
  ctx.fillRect(0, 0, 900, 480);

  // Decorative pixel-art style border (game area only)
  ctx.strokeStyle = '#554488';
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, 616, 456);
  ctx.strokeStyle = '#332266';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, 604, 444);

  // Title (centred on game area at x=320)
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REALM', 320, 140);
  ctx.fillStyle = '#e6c200';
  ctx.fillText('RAMPARTS', 320, 200);

  // Subtitle
  ctx.fillStyle = '#9988cc';
  ctx.font = '15px monospace';
  ctx.fillText('a maze-builder tower defence', 320, 235);

  // Mode buttons
  const rb = menuButtons.regular;
  drawMenuButton(ctx, rb.x + rb.w / 2, rb.y + rb.h / 2, rb.w, rb.h, 'Regular Mode  \u25B6', '#3a6a3a', '#4a8a4a');
  const bb = menuButtons.boss;
  drawMenuButton(ctx, bb.x + bb.w / 2, bb.y + bb.h / 2, bb.w, bb.h, 'Boss Mode  \u2694', '#6a2a2a', '#8a3a3a');

  // Unlock hint
  if (state.unlocks.lemonadecan) {
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u{1F3C6} Lemonade Can unlocked', 320, 415);
  } else {
    ctx.fillStyle = '#554466';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('complete regular mode (\u226510 lives) to unlock secret tower', 320, 415);
  }

  // Controls hint
  ctx.fillStyle = '#443355';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[1-4] select tower   click to place   right-click to sell', 320, 445);
}

function drawMenuButton(ctx, cx, cy, w, h, label, bg, hover) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hover;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + 6);
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

  // Placement ghost (WAVE_IDLE only, GRASS tile, can afford)
  if (state.current === STATES.WAVE_IDLE) {
    const tx = state.hoverTileX;
    const ty = state.hoverTileY;
    if (tx >= 0 && tx < 20 && ty >= 0 && ty < 15 && state.mouseX < 640) {
      const tile = getTile(state.grid, tx, ty);
      const def = TOWER_DEFS[getSelectedTowerType()];
      if (tile && tile.type === 'GRASS' && def && state.gold >= def.cost) {
        ctx.globalAlpha = 0.45;
        ctx.imageSmoothingEnabled = false;
        drawSprite(ctx, 'tower_' + getSelectedTowerType(), tx * 32, ty * 32);
        ctx.globalAlpha = 1.0;
      }
    }
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

  // Custom cursor — only drawn when CSS cursor is 'none' (GRASS tile + can afford + WAVE_IDLE)
  const canvas = ctx.canvas;
  if (canvas.style.cursor === 'none' && state.mouseX < 640) {
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.9;
    drawSprite(ctx, 'tower_' + getSelectedTowerType(), Math.round(state.mouseX) - 8, Math.round(state.mouseY) - 8);
    ctx.globalAlpha = 1.0;
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

  // Layer 10: Sidebar
  if (state.current === STATES.WAVE_IDLE || state.current === STATES.WAVE_RUNNING) {
    renderSidebar(ctx);
  }
}

function renderHUD(ctx) {
  ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
  ctx.fillRect(0, 0, 640, 26);

  // Gold
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('\u2B21 ' + state.gold + 'g', 8, 17);

  // Lives
  ctx.fillStyle = state.lives <= 5 ? '#ff4444' : '#ff9999';
  ctx.fillText('\u2665 ' + state.lives, 100, 17);

  // Wave
  ctx.fillStyle = '#aaddff';
  ctx.fillText('Wave ' + state.wave + '/' + state.totalWaves, 175, 17);

  // Mode badge
  ctx.fillStyle = state.mode === 'boss' ? '#ff6644' : '#88cc88';
  ctx.fillText(state.mode === 'boss' ? '\u2694 BOSS' : '\u2605 REGULAR', 290, 17);

  // Selected tower name
  const def = TOWER_DEFS[getSelectedTowerType()];
  if (def) {
    ctx.fillStyle = '#ccccff';
    ctx.textAlign = 'right';
    ctx.fillText('\u25B8 ' + def.name + ' (' + def.cost + 'g)', 632, 17);
  }

  // Turbo indicator (right side, in sidebar HUD area)
  if (state.turboMode) {
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('\u26A1x2', 892, 17);
  }
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
  // Show range for selected (clicked) placed tower
  if (state.selectedTowerTile) {
    const st = state.selectedTowerTile;
    const tile = getTile(state.grid, st.x, st.y);
    if (tile && tile.type === 'TOWER' && tile.towerRef) {
      const rangePx = tile.towerRef.range * 32;
      const cx = st.x * 32 + 16;
      const cy = st.y * 32 + 16;
      ctx.beginPath();
      ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,200,100,0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,100,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Highlight border around selected tower tile
      ctx.strokeStyle = '#ffcc44';
      ctx.lineWidth = 2;
      ctx.strokeRect(st.x * 32, st.y * 32, 32, 32);
    }
  }

  // Show range preview for hovered GRASS tile (placement preview)
  const mx = state.hoverTileX;
  const my = state.hoverTileY;
  if (mx === undefined || my === undefined) return;

  const tile = getTile(state.grid, mx, my);
  if (!tile) return;

  if (tile.type === 'GRASS') {
    const def = TOWER_DEFS[getSelectedTowerType()];
    if (def) {
      const rangePx = def.range * 32;
      const cx = mx * 32 + 16;
      const cy = my * 32 + 16;
      ctx.beginPath();
      ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,200,255,0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,200,255,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
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
    ctx.strokeStyle = 'rgba(100, 160, 255, ' + alpha.toFixed(2) + ')';
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
  ctx.fillRect(0, 0, 900, 480);
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', 320, 200);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText('Wave ' + state.wave + ' / ' + state.totalWaves, 320, 255);
  ctx.fillText('Gold: ' + state.gold, 320, 285);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  ctx.fillText('click to return to menu', 320, 360);
}

function renderVictory(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, 900, 480);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', 320, 180);

  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText('Lives remaining: ' + state.lives + ' / ' + (state.mode === 'boss' ? 10 : 20), 320, 240);
  ctx.fillText('Gold: ' + state.gold, 320, 270);

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
