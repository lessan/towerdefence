import { state } from './state.js';
import { earn } from './economy.js';
import { recordStat } from './stats.js';

export const ENEMY_DEFS = {
  goblin:  { name: 'Goblin',          hp: 60,  speed: 80, goldReward: 10,  special: null },
  orc:     { name: 'Orc',             hp: 150, speed: 50, goldReward: 20,  special: null },
  troll:   { name: 'Troll',           hp: 350, speed: 30, goldReward: 40,  special: null },
  lich:    { name: 'Lich',            hp: 500, speed: 40, goldReward: 100, special: 'regen' },
  ogre:    { name: 'Twinblood Ogre',  hp: 400, speed: 45, goldReward: 80,  special: 'split' },
  wyrm:    { name: 'Ironhide Wyrm',   hp: 800, speed: 25, goldReward: 150, special: 'armour' },
  ogrunt:  { name: 'Ogre Runt',       hp: 150, speed: 60, goldReward: 15,  special: null },
};

let nextEnemyId = 1;

// Spawns an enemy of the given type at the spawn point.
// Gets the current path from state.pathCache and sets enemy's path.
// Returns the new enemy object (also pushed to state.enemies).
export function spawnEnemy(type) {
  const def = ENEMY_DEFS[type];
  if (!def) return null;
  const path = state.pathCache;
  if (!path || path.length === 0) return null;

  const enemy = {
    id: nextEnemyId++,
    type,
    name: def.name,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed,
    goldReward: def.goldReward,
    special: def.special,
    // Position in pixels — start at center of spawn tile
    x: path[0].x * 32 + 16,
    y: path[0].y * 32 + 16,
    // Path following
    path: path.slice(),
    pathIndex: 1,       // index of the NEXT waypoint to head toward
    // Status effects
    slowTimer: 0,
    slowFactor: 1.0,
    // Flags
    reachedExit: false,
    dead: false,
  };
  state.enemies.push(enemy);
  return enemy;
}

// Called every frame. Moves all enemies along their paths.
// Handles: smooth movement, reaching exit, death, special traits.
export function updateEnemies(dt) {
  const toRemove = [];

  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.reachedExit) {
      toRemove.push(enemy.id);
      continue;
    }

    // Tick down slow timer
    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= dt;
      if (enemy.slowTimer <= 0) {
        enemy.slowTimer = 0;
        enemy.slowFactor = 1.0;
      }
    }

    // Regen (Lich)
    if (enemy.special === 'regen') {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + 10 * dt);
    }

    // Move toward next waypoint
    if (enemy.pathIndex >= enemy.path.length) {
      enemy.reachedExit = true;
      onEnemyReachedExit(enemy);
      toRemove.push(enemy.id);
      continue;
    }

    const target = enemy.path[enemy.pathIndex];
    const targetX = target.x * 32 + 16;
    const targetY = target.y * 32 + 16;

    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const effectiveSpeed = enemy.speed * enemy.slowFactor;
    const move = effectiveSpeed * dt;

    if (dist <= move) {
      enemy.x = targetX;
      enemy.y = targetY;
      enemy.pathIndex++;
    } else {
      enemy.x += (dx / dist) * move;
      enemy.y += (dy / dist) * move;
    }
  }

  if (toRemove.length > 0) {
    state.enemies = state.enemies.filter(e => !toRemove.includes(e.id));
  }
}

// Called when an enemy's HP drops to 0. Handles death + special traits.
export function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  earn(enemy.goldReward);
  recordStat('enemiesKilled');

  // Split (Twinblood Ogre)
  if (enemy.special === 'split') {
    spawnRuntsAt(enemy);
  }
}

function spawnRuntsAt(parentEnemy) {
  for (let i = 0; i < 2; i++) {
    const runt = spawnEnemy('ogrunt');
    if (runt) {
      runt.x = parentEnemy.x;
      runt.y = parentEnemy.y;
      // Use parent's path copy and clamp pathIndex to valid range
      runt.path = parentEnemy.path.slice();
      runt.pathIndex = Math.min(parentEnemy.pathIndex, runt.path.length - 1);
    }
  }
}

// Called when enemy reaches the exit tile. Deducts a life.
function onEnemyReachedExit(enemy) {
  state.lives = Math.max(0, state.lives - 1);
}

// Apply a slow effect to an enemy (from Bell Tower)
export function applySlow(enemy, factor, duration) {
  if (factor < enemy.slowFactor || enemy.slowTimer <= 0) {
    enemy.slowFactor = factor;
    enemy.slowTimer = duration;
  }
}

// Apply damage to an enemy. Respects armour (Ironhide Wyrm).
// Returns actual damage dealt.
export function applyDamage(enemy, damage) {
  if (enemy.dead) return 0;
  let actual = damage;
  if (enemy.special === 'armour') actual = Math.ceil(damage * 0.5);
  enemy.hp -= actual;
  if (enemy.hp <= 0) killEnemy(enemy);
  return actual;
}
