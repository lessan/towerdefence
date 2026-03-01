import { state, STATES, transitionTo } from './state.js';
import { getTile, TILE_TYPES } from './grid.js';
import { TOWER_DEFS } from './towers.js';

const inputQueue = [];

let selectedTowerType = null;
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
    canvas.style.cursor = resolveCursor(px, py);
  });

  canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default';
  });

  window.addEventListener('keydown', (e) => {
    inputQueue.push({ type: 'keydown', key: e.key });
  });
}

export function flushInput() {
  return inputQueue.splice(0, inputQueue.length);
}

// Returns the CSS cursor string for the current mouse position and game state.
function resolveCursor(px, py) {
  // Outside game grid or not in a placement state → default
  if (state.current !== STATES.WAVE_IDLE) return 'default';
  if (px >= 640 || py < 0 || py >= 480) return 'default';
  if (!state.grid) return 'default';

  const tx = Math.floor(px / 32);
  const ty = Math.floor(py / 32);
  const tile = getTile(state.grid, tx, ty);
  if (!tile) return 'default';

  if (tile.type === TILE_TYPES.GRASS) {
    if (!selectedTowerType) return 'default'; // no tower selected — no placement mode
    const def = TOWER_DEFS[selectedTowerType];
    if (def && state.gold >= def.cost) return 'none'; // custom tower cursor drawn on canvas
    return 'default'; // can't afford — no preview, normal cursor
  }

  // TOWER or UNBUILDABLE tile
  return 'not-allowed';
}
