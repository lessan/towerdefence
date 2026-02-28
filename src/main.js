import { state, transitionTo, STATES } from './state.js';
import { update } from './update.js';
import { render } from './renderer.js';
import { initInput } from './input.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  update(dt);
  render(ctx);
  requestAnimationFrame(loop);
}

initInput(canvas);
transitionTo(STATES.MENU);
requestAnimationFrame(loop);
