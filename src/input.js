import { state, STATES, transitionTo } from './state.js';

const inputQueue = [];

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
}

export function flushInput() {
  return inputQueue.splice(0, inputQueue.length);
}
