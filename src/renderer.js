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

  // Draw enemies
  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy);
  }

  // Draw projectiles
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

  // HUD
  renderHUD(ctx);

  // Start Wave button (only in WAVE_IDLE)
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

function drawEnemy(ctx, enemy) {
  const r = 10;
  const colours = {
    goblin:  '#44ff44',
    orc:     '#228822',
    troll:   '#885522',
    lich:    '#aa44ff',
    ogre:    '#ff6622',
    wyrm:    '#cc2222',
    ogrunt:  '#ff9966',
  };
  ctx.fillStyle = colours[enemy.type] || '#ffffff';
  ctx.beginPath();
  ctx.arc(Math.round(enemy.x), Math.round(enemy.y), r, 0, Math.PI * 2);
  ctx.fill();

  // Armour indicator (Wyrm) — grey outline
  if (enemy.special === 'armour') {
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Slow indicator — blue tint ring
  if (enemy.slowTimer > 0) {
    ctx.strokeStyle = 'rgba(100,150,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(Math.round(enemy.x), Math.round(enemy.y), r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // HP bar (only show when damaged)
  if (enemy.hp < enemy.maxHp) {
    const barW = 24;
    const barH = 4;
    const bx = Math.round(enemy.x) - barW / 2;
    const by = Math.round(enemy.y) - r - 8;
    ctx.fillStyle = '#550000';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(bx, by, Math.round(barW * (enemy.hp / enemy.maxHp)), barH);
  }
}

function drawProjectile(ctx, proj) {
  if (proj.kind === 'ring') {
    // Expanding ring (Bell Tower visual)
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

  // Travelling projectile
  const colours = {
    crossbow:    '#ffff88',
    brazier:     '#88ff44',
    belltower:   '#88aaff',
    ballista:    '#ffcc44',
    lemonadecan: '#ffff00',
  };
  const r = proj.kind === 'splash' ? 5 : 3;
  ctx.fillStyle = colours[proj.towerType] || '#ffffff';
  ctx.beginPath();
  ctx.arc(Math.round(proj.x), Math.round(proj.y), r, 0, Math.PI * 2);
  ctx.fill();
}
