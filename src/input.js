import { state, STATES, transitionTo } from './state.js';

const inputQueue = [];

let selectedTowerType = 'crossbow';
export function setSelectedTowerType(type) { selectedTowerType = type; }
export function getSelectedTowerType() { return selectedTowerType; }

export function initInput(canvas) {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / 640));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / 480));
    inputQueue.push({ type: 'click', x, y, button: 0 });
  });
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / 640));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / 480));
    inputQueue.push({ type: 'click', x, y, button: 2 });
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.hoverTileX = Math.floor((e.clientX - rect.left) / (rect.width / 640) / 32);
    state.hoverTileY = Math.floor((e.clientY - rect.top) / (rect.height / 480) / 32);
  });

  window.addEventListener('keydown', (e) => {
    inputQueue.push({ type: 'keydown', key: e.key });
  });
}

export function flushInput() {
  return inputQueue.splice(0, inputQueue.length);
}
