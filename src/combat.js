import { state } from './state.js';
import { applyDamage, applySlow } from './enemies.js';

let nextProjectileId = 1;

export function updateCombat(dt) {
  updateTowerFiring(dt);
  updateProjectiles(dt);
}

// ── Tower firing ──────────────────────────────────────────────────

function updateTowerFiring(dt) {
  for (const tower of state.towers) {
    tower.lastFired = (tower.lastFired || 0) + dt;
    const cooldown = 1 / tower.fireRate;
    if (tower.lastFired < cooldown) continue;

    const rangePx = tower.range * 32;

    if (tower.type === 'brazier') {
      // AoE DoT: damages all enemies in range every tick (no projectile)
      const inRange = getEnemiesInRange(tower, rangePx);
      if (inRange.length > 0) {
        for (const enemy of inRange) {
          applyDamage(enemy, tower.damage);
        }
        tower.lastFired = 0;
      }
    } else if (tower.type === 'belltower') {
      // AoE ring: damages + slows all in range
      const inRange = getEnemiesInRange(tower, rangePx);
      if (inRange.length > 0) {
        for (const enemy of inRange) {
          applyDamage(enemy, tower.damage);
          applySlow(enemy, 0.7, 1.5); // 30% slow for 1.5s
        }
        tower.lastFired = 0;
        // Spawn a visual ring projectile (no damage, just effect)
        spawnProjectile(tower, null, 'ring');
      }
    } else if (tower.type === 'lemonadecan') {
      // Splash AoE: targets nearest enemy, explodes in 1.5-cell radius
      const target = getNearestEnemy(tower, rangePx);
      if (target) {
        spawnProjectile(tower, target, 'splash');
        tower.lastFired = 0;
      }
    } else if (tower.type === 'ballista') {
      // Pierce: hits up to 2 enemies
      const target = getNearestEnemy(tower, rangePx);
      if (target) {
        spawnProjectile(tower, target, 'pierce');
        tower.lastFired = 0;
      }
    } else {
      // crossbow: single target
      const target = getNearestEnemy(tower, rangePx);
      if (target) {
        spawnProjectile(tower, target, 'single');
        tower.lastFired = 0;
      }
    }
  }
}

// ── Projectile spawning ───────────────────────────────────────────

function spawnProjectile(tower, target, kind) {
  const towerCx = tower.tileX * 32 + 16;
  const towerCy = tower.tileY * 32 + 16;
  state.projectiles.push({
    id: nextProjectileId++,
    kind,          // 'single' | 'pierce' | 'splash' | 'ring'
    towerType: tower.type,
    x: towerCx,
    y: towerCy,
    targetId: target ? target.id : null,
    damage: tower.damage,
    range: tower.range * 32, // for splash/ring radius
    speed: 220,    // px/s for tracking projectiles
    pierceLeft: kind === 'pierce' ? 2 : 0,
    dead: false,
  });
}

// ── Projectile update ─────────────────────────────────────────────

function updateProjectiles(dt) {
  const toRemove = [];

  for (const proj of state.projectiles) {
    if (proj.dead) { toRemove.push(proj.id); continue; }

    if (proj.kind === 'ring') {
      // Visual only — just expand and die after 0.3s
      proj.age = (proj.age || 0) + dt;
      if (proj.age >= 0.3) proj.dead = true;
      continue;
    }

    // Find current target
    const target = state.enemies.find(e => e.id === proj.targetId && !e.dead);
    if (!target) {
      // Target died — detonate splash at current pos, otherwise just remove
      if (proj.kind === 'splash') {
        detonateSplash(proj);
      }
      proj.dead = true;
      toRemove.push(proj.id);
      continue;
    }

    // Move toward target
    const dx = target.x - proj.x;
    const dy = target.y - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = proj.speed * dt;

    if (dist <= move) {
      // Hit!
      proj.x = target.x;
      proj.y = target.y;
      onProjectileHit(proj, target);
      proj.dead = true;
      toRemove.push(proj.id);
    } else {
      proj.x += (dx / dist) * move;
      proj.y += (dy / dist) * move;
    }
  }

  if (toRemove.length > 0) {
    state.projectiles = state.projectiles.filter(p => !toRemove.includes(p.id));
  }
}

function onProjectileHit(proj, target) {
  if (proj.kind === 'single') {
    applyDamage(target, proj.damage);
  } else if (proj.kind === 'pierce') {
    // Hit primary target
    applyDamage(target, proj.damage);
    proj.pierceLeft--;
    if (proj.pierceLeft > 0) {
      // Find next nearest enemy near impact point (not the primary)
      const next = state.enemies
        .filter(e => !e.dead && e.id !== target.id)
        .sort((a, b) => {
          const da = Math.hypot(a.x - proj.x, a.y - proj.y);
          const db = Math.hypot(b.x - proj.x, b.y - proj.y);
          return da - db;
        })[0];
      if (next && Math.hypot(next.x - proj.x, next.y - proj.y) < 64) {
        applyDamage(next, proj.damage);
      }
    }
  } else if (proj.kind === 'splash') {
    detonateSplash(proj);
  }
}

function detonateSplash(proj) {
  const splashPx = 1.5 * 32; // 1.5 cells
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const d = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
    if (d <= splashPx) {
      applyDamage(enemy, proj.damage);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function getEnemiesInRange(tower, rangePx) {
  const cx = tower.tileX * 32 + 16;
  const cy = tower.tileY * 32 + 16;
  return state.enemies.filter(e => {
    if (e.dead) return false;
    return Math.hypot(e.x - cx, e.y - cy) <= rangePx;
  });
}

function getNearestEnemy(tower, rangePx) {
  // Prefer most-advanced enemy (furthest along path) — use pathIndex as proxy
  const inRange = getEnemiesInRange(tower, rangePx);
  let nearest = null;
  for (const e of inRange) {
    if (nearest === null || e.pathIndex > nearest.pathIndex) {
      nearest = e;
    }
  }
  return nearest;
}
