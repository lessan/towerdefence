const STATS_KEY = 'td_stats';

const defaultStats = {
  gamesStarted: 0,
  gamesWon: 0,
  bossGamesWon: 0,
  totalWavesCleared: 0,
  enemiesKilled: 0,
  goldEarned: 0,
  towersPlaced: 0,
  towersSold: 0,
  lemonadeCanUnlocks: 0,
};

function load() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...defaultStats, ...JSON.parse(raw) } : { ...defaultStats };
  } catch { return { ...defaultStats }; }
}

function save(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}

export function getStats() { return load(); }

export function recordStat(key, amount = 1) {
  const stats = load();
  if (key in stats) {
    stats[key] += amount;
    save(stats);
  }
}

export function clearAllData() {
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem('td_lemonade_unlocked');
  } catch {}
}
