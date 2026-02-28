import { state, STATES } from './state.js';

export function render(ctx) {
  ctx.clearRect(0, 0, 640, 480);
  switch (state.current) {
    case STATES.MENU:
      renderMenu(ctx);
      break;
    default:
      renderGame(ctx);
      break;
  }
}

function renderMenu(ctx) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#f5e642';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REALM RAMPARTS', 320, 200);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('[ click to start ]', 320, 260);
}

function renderGame(ctx) {
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, 640, 480);
}
