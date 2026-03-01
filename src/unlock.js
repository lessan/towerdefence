import { state } from './state.js';
import { recordStat } from './stats.js';

const UNLOCK_KEY = 'td_lemonade_unlocked';

function storage() {
  return typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {} };
}

// Check if the player has earned the Lemonade Can unlock.
// Unlock condition: regular mode, wave 10 cleared, lives >= 10
export function checkUnlock() {
  if (state.mode !== 'regular') return false;
  if (state.wave < 10) return false;
  if (state.lives < 10) return false;
  if (!isUnlocked(UNLOCK_KEY)) {
    setUnlocked(UNLOCK_KEY);
    state.unlocks.lemonadecan = true;
    state.newUnlock = true;
    recordStat('lemonadeCanUnlocks');
    return true;
  }
  return false;
}

export function isUnlocked(key) {
  return storage().getItem(key) === 'true';
}

export function setUnlocked(key) {
  storage().setItem(key, 'true');
}

// Call on game boot to load persisted unlocks into state
export function loadUnlocks() {
  state.unlocks.lemonadecan = isUnlocked(UNLOCK_KEY);
}

export function reloadUnlocks() {
  state.unlocks.lemonadecan = isUnlocked(UNLOCK_KEY);
}
