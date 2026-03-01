import { state, STATES, transitionTo } from './state.js';
import { spawnEnemy } from './enemies.js';
import { recordStat } from './stats.js';

// Each spawn entry: { type: string, count: number, interval: number (seconds between spawns) }
// Each wave: { waveNumber, spawns: [SpawnEntry], message?: string }

export const WAVE_DEFS_REGULAR = [
  { waveNumber: 1,  spawns: [{ type: 'goblin', count: 8,  interval: 0.6 }] },
  { waveNumber: 2,  spawns: [{ type: 'goblin', count: 12, interval: 0.5 }] },
  { waveNumber: 3,  spawns: [{ type: 'goblin', count: 10, interval: 0.5 }, { type: 'orc', count: 3, interval: 1.2 }] },
  { waveNumber: 4,  spawns: [{ type: 'orc',    count: 6,  interval: 1.0 }] },
  { waveNumber: 5,  spawns: [{ type: 'goblin', count: 15, interval: 0.4 }, { type: 'orc', count: 5, interval: 0.9 }], message: 'Halfway there!' },
  { waveNumber: 6,  spawns: [{ type: 'orc',    count: 8,  interval: 0.8 }, { type: 'troll', count: 2, interval: 3.0 }] },
  { waveNumber: 7,  spawns: [{ type: 'troll',  count: 3,  interval: 2.5 }, { type: 'goblin', count: 10, interval: 0.4 }] },
  { waveNumber: 8,  spawns: [{ type: 'orc',    count: 10, interval: 0.7 }, { type: 'troll', count: 3, interval: 2.0 }] },
  { waveNumber: 9,  spawns: [{ type: 'troll',  count: 5,  interval: 1.8 }, { type: 'orc', count: 8, interval: 0.6 }] },
  { waveNumber: 10, spawns: [{ type: 'goblin', count: 20, interval: 0.3 }, { type: 'orc', count: 10, interval: 0.5 }, { type: 'troll', count: 5, interval: 1.5 }], message: 'FINAL WAVE!' },
];

export const WAVE_DEFS_BOSS = [
  { waveNumber: 1, spawns: [{ type: 'lich',  count: 2, interval: 4.0 }] },
  { waveNumber: 2, spawns: [{ type: 'ogre',  count: 2, interval: 5.0 }] },
  { waveNumber: 3, spawns: [{ type: 'lich',  count: 2, interval: 3.0 }, { type: 'wyrm', count: 1, interval: 6.0 }] },
  { waveNumber: 4, spawns: [{ type: 'ogre',  count: 3, interval: 4.0 }, { type: 'lich', count: 2, interval: 3.0 }] },
  { waveNumber: 5, spawns: [{ type: 'wyrm',  count: 2, interval: 5.0 }, { type: 'ogre', count: 2, interval: 4.0 }, { type: 'lich', count: 3, interval: 2.5 }], message: 'BOSS FINALE!' },
];

// Builds a flat, time-sorted queue of { time, type } spawn events
function buildSpawnQueue(waveDef) {
  const events = [];
  for (const group of waveDef.spawns) {
    for (let i = 0; i < group.count; i++) {
      events.push({ time: i * group.interval, type: group.type });
    }
  }
  // Sort by time so interleaving works naturally
  events.sort((a, b) => a.time - b.time);
  return events;
}

// Starts the next wave. Transitions to WAVE_RUNNING.
export function startWave() {
  const defs = state.mode === 'boss' ? WAVE_DEFS_BOSS : WAVE_DEFS_REGULAR;
  state.wave++;
  const waveDef = defs[state.wave - 1];
  if (!waveDef) return;
  state.spawnQueue = buildSpawnQueue(waveDef);
  state.spawnTimer = 0;
  state.waveMessage = waveDef.message || null;
  state.waveMessageTimer = waveDef.message ? 3.0 : 0;
  transitionTo(STATES.WAVE_RUNNING);
}

// Called every frame during WAVE_RUNNING.
// Spawns enemies from queue as their time arrives.
// When queue is empty AND all enemies are dead -> transition to WAVE_IDLE (or VICTORY).
export function updateWaveSpawner(dt) {
  state.spawnTimer += dt;

  // Spawn any enemies whose time has come
  while (state.spawnQueue.length > 0 && state.spawnTimer >= state.spawnQueue[0].time) {
    const event = state.spawnQueue.shift();
    spawnEnemy(event.type);
  }

  // Tick wave message
  if (state.waveMessageTimer > 0) {
    state.waveMessageTimer -= dt;
    if (state.waveMessageTimer <= 0) state.waveMessage = null;
  }

  // Check if wave is over (queue empty and no enemies alive)
  if (state.spawnQueue.length === 0 && state.enemies.length === 0) {
    onWaveComplete();
  }
}

function onWaveComplete() {
  recordStat('totalWavesCleared');
  const totalWaves = state.mode === 'boss' ? 5 : 10;
  if (state.wave >= totalWaves) {
    if (state.mode === 'boss') recordStat('bossGamesWon');
    else recordStat('gamesWon');
    transitionTo(STATES.VICTORY);
  } else {
    // Show wave clear message
    state.waveClearMessage = `WAVE ${state.wave} CLEARED!`;
    state.waveClearTimer = state.turboMode ? 1.25 : 2.5;
    transitionTo(STATES.WAVE_IDLE);
    state.waveIdleTimer = state.autoProceed ? (state.turboMode ? 2.5 : 5) : 0;
  }
}
