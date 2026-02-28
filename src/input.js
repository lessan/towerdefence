import { state, STATES, transitionTo } from './state.js';

const inputQueue = [];

let selectedTowerType = 'crossbow';
export function setSelectedTowerType(type) { selectedTowerType = type; }
export function getSelectedTowerType() { return selectedTowerType; }

export function initInput(canvas) {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (900 / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (480 / rect.height));
    inputQueue.push({ type: 'click', x, y, button: 0 });
  });
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (900 / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (480 / rect.height));
    inputQueue.push({ type: 'click', x, y, button: 2 });
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 480 / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    state.mouseX = px;
    state.mouseY = py;
    state.hoverTileX = Math.floor(px / 32);
    state.hoverTileY = Math.floor(py / 32);
  });

  window.addEventListener('keydown', (e) => {
    inputQueue.push({ type: 'keydown', key: e.key });
  });
}

export function flushInput() {
  return inputQueue.splice(0, inputQueue.length);
}
