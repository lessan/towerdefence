import { state } from './state.js';
import { recordStat } from './stats.js';

export function canAfford(cost) {
  return state.gold >= cost;
}

export function spend(amount) {
  if (state.gold < amount) return false;
  state.gold -= amount;
  return true;
}

export function earn(amount) {
  state.gold += amount;
  recordStat('goldEarned', amount);
}
