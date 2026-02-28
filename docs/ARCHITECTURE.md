# Tower Defence Game — Technical Architecture

## 1. File & Folder Structure

```
index.html              ← single HTML page, loads main.js as module
style.css               ← minimal CSS (canvas centering, UI overlays)
src/
  main.js               ← entry point, game loop, bootstrap
  state.js              ← game state machine + top-level GameState object
  grid.js               ← tile grid creation, tile queries
  pathfinding.js        ← A* implementation
  towers.js             ← tower type definitions, placement logic
  enemies.js            ← enemy type definitions, movement logic
  waves.js              ← wave definitions, spawn scheduling
  combat.js             ← targeting, projectile creation, damage resolution
  economy.js            ← gold balance, purchase validation
  renderer.js           ← canvas drawing (layers, sprites, HUD)
  ui.js                 ← menu screens, HUD buttons, overlays
  sprites.js            ← image loading, sprite draw helpers
  input.js              ← mouse/touch event binding, tile coordinate mapping
  unlock.js             ← localStorage read/write for unlocks
assets/
  sprites/              ← individual 32x32 PNG files (one per entity frame)
docs/
  ARCHITECTURE.md       ← this file
```

All source files use ES module syntax (`import`/`export`). `index.html` loads `src/main.js` with `<script type="module">`. No bundler required — modern browsers handle this natively.

Sprite size is **32x32 pixels**. This gives reasonable detail for pixel art while keeping the grid visually clear on a 20x15 map (640x480 logical pixels).

---

## 2. Game State Machine

### States

| State           | Description                                      |
|-----------------|--------------------------------------------------|
| `MENU`          | Title screen. Start regular or boss mode.        |
| `WAVE_IDLE`     | Building phase between waves. Player places towers. |
| `WAVE_RUNNING`  | Enemies spawning and moving. Player can still build. |
| `GAME_OVER`     | Lives reached 0. Show score, restart option.     |
| `VICTORY`       | All waves cleared. Show score, unlock check.     |

### Transitions

```
MENU ──────────────► WAVE_IDLE
                        │
                        │ player clicks "Send Wave" / auto-start timer
                        ▼
                     WAVE_RUNNING ◄────────┐
                        │                  │
                        │ all enemies      │ next wave exists
                        │ cleared          │
                        ▼                  │
                     WAVE_IDLE ────────────┘
                        │
                        │ final wave cleared
                        ▼
                     VICTORY

     (from WAVE_IDLE or WAVE_RUNNING)
                        │
                        │ lives <= 0
                        ▼
                     GAME_OVER

     (from GAME_OVER or VICTORY)
                        │
                        │ player clicks restart / menu
                        ▼
                      MENU
```

### Ownership

`state.js` owns the current state value and exposes `transitionTo(newState)`. Transitions are triggered by:

- **MENU → WAVE_IDLE**: `ui.js` on button click (sets game mode: regular or boss).
- **WAVE_IDLE → WAVE_RUNNING**: `ui.js` on "Send Wave" click, calls `waves.js` to begin spawning.
- **WAVE_RUNNING → WAVE_IDLE**: `waves.js` detects all enemies dead and no more spawns pending.
- **WAVE_RUNNING → GAME_OVER**: `state.js` checks `lives <= 0` each frame.
- **WAVE_IDLE → VICTORY**: `waves.js` detects final wave complete.
- **GAME_OVER / VICTORY → MENU**: `ui.js` on button click, calls `state.js` to reset.

Boss mode uses the same states. The difference is which wave table is loaded (see section on waves).

---

## 3. Core Data Models

All game data lives in a single `GameState` object owned by `state.js`. No hidden state elsewhere.

### GameState (top-level)

```js
{
  phase: "MENU",              // current state machine phase
  mode: "regular",            // "regular" | "boss"
  grid: [],                   // 2D array of Tile objects [row][col]
  towers: [],                 // active Tower objects
  enemies: [],                // active Enemy objects
  projectiles: [],            // active Projectile objects
  gold: 100,                  // current gold balance
  lives: 20,                  // remaining lives
  currentWave: 0,             // 0-indexed wave number
  waveSpawner: null,          // active spawner state (see waves.js)
  unlocks: {
    lemonade: false           // loaded from localStorage on boot
  },
  nextId: 1,                  // monotonic ID counter for entities
  pathDirty: true             // flag: recalculate path before next use
}
```

### Tile

```js
{
  x: 5,                       // grid column (0-indexed)
  y: 3,                       // grid row (0-indexed)
  type: "ground",             // "ground" | "path_start" | "path_end" | "blocked"
  towerId: null               // ID of tower placed here, or null
}
```

`path_start` and `path_end` are fixed tiles on the map edges where enemies enter and exit. `blocked` tiles are decorative obstacles that cannot be built on. Towers can only be placed on `ground` tiles with `towerId === null`.

### Tower

```js
{
  id: 1,
  type: "arrow",              // "arrow" | "cannon" | "frost" | "ballista" | "lemonade"
  x: 5,                       // grid column
  y: 3,                       // grid row
  range: 3.5,                 // range in tile units (float)
  damage: 10,
  fireRate: 1.0,              // shots per second
  lastFired: 0,               // timestamp (ms) of last shot
  special: null               // type-specific data (e.g. slow % for frost)
}
```

### Enemy

```js
{
  id: 7,
  type: "soldier",            // "soldier" | "cavalry" | "armored" | "boss_soldier" | ...
  x: 0.0,                     // world x in tile units (float, for smooth movement)
  y: 7.0,                     // world y in tile units (float)
  hp: 50,
  maxHp: 50,
  speed: 2.0,                 // tiles per second
  path: [{x:0,y:7}, ...],     // cached A* waypoint list
  pathIndex: 0,               // index of next waypoint in path
  goldReward: 10,
  isBoss: false,
  slowTimer: 0                // remaining slow effect duration (ms)
}
```

### Projectile

```js
{
  id: 12,
  x: 5.5,                     // world x (float)
  y: 3.5,                     // world y (float)
  targetId: 7,                // enemy ID being tracked
  damage: 10,
  speed: 8.0,                 // tiles per second
  type: "arrow",              // matches tower type, used for sprite selection
  special: null               // e.g. { effect: "slow", duration: 2000, factor: 0.5 }
}
```

### Wave

```js
{
  waveNumber: 0,
  spawns: [
    { enemyType: "soldier", count: 8, interval: 800 },
    { enemyType: "cavalry", count: 3, interval: 1200 }
  ]
}
```

Spawns are processed sequentially: all soldiers spawn first, then cavalry.

---

## 4. Game Loop

### Approach: Delta-Time

The loop uses `requestAnimationFrame` with delta-time scaling. This is simpler than a fixed-timestep accumulator and sufficient for a tower defence game where perfect determinism is not required. Frame-rate-independent movement prevents speed-up on fast monitors and slow-down on laggy frames.

### Loop Structure

```js
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;  // delta in seconds
  lastTime = timestamp;

  // Clamp dt to prevent spiral of death after tab-away
  const clampedDt = Math.min(dt, 0.1);

  if (state.phase === "WAVE_IDLE" || state.phase === "WAVE_RUNNING") {
    update(clampedDt);
  }

  render();
  requestAnimationFrame(gameLoop);
}
```

### Update Order

Each `update(dt)` call runs these systems in order:

1. **Input processing** — `input.js` has already queued events; process any pending tower placements.
2. **Wave spawner** — `waves.js` checks if it is time to spawn the next enemy.
3. **Pathfinding** — if `state.pathDirty`, run A* once and cache the result. Assign the new path to all active enemies that need it.
4. **Enemy movement** — `enemies.js` moves each enemy along its path by `speed * dt` tiles.
5. **Combat** — `combat.js` runs tower targeting, creates projectiles, moves projectiles, resolves hits.
6. **Cleanup** — remove dead enemies (award gold), remove arrived enemies (subtract lives), remove expired projectiles.
7. **State checks** — check for wave completion, game over, or victory.

### Start / Stop

- The `requestAnimationFrame` loop runs continuously once the page loads. It always calls `render()` so menus are drawn.
- `update()` is only called in `WAVE_IDLE` and `WAVE_RUNNING` phases. In `MENU`, `GAME_OVER`, and `VICTORY`, the loop only renders the appropriate screen.

---

## 5. Rendering Pipeline

### Canvas Setup

```html
<canvas id="game" width="640" height="480"></canvas>
```

Logical resolution is 640x480 (20 columns x 15 rows x 32px). The canvas is scaled via CSS to fit the viewport while maintaining aspect ratio:

```css
canvas {
  image-rendering: pixelated;        /* Chrome/Edge */
  image-rendering: crisp-edges;      /* Firefox */
  width: 100%;
  max-width: 960px;                  /* 1.5x for sharp scaling */
}
```

On the JS side:

```js
ctx.imageSmoothingEnabled = false;
```

This ensures pixel art sprites stay hard-edged at any display scale.

### Layer Order (back to front)

1. **Background grid** — alternating tile colors or a grass texture. Drawn once to an offscreen canvas and blitted each frame for performance.
2. **Grid overlay** — subtle grid lines (1px, low-alpha).
3. **Towers** — drawn at their grid position. Static sprites (no animation needed for v1).
4. **Enemies** — drawn at their floating-point (x, y) position. Health bars drawn above each enemy.
5. **Projectiles** — small sprites or colored circles moving toward targets.
6. **UI overlay** — HUD elements: gold count, lives, wave number, tower selection panel. Drawn directly on the main canvas (no DOM overlay needed for v1).
7. **Screen overlays** — menu, game-over, victory screens drawn as semi-transparent rectangles with text.

### Sprite Drawing

Individual PNG files, one per entity type. Loaded at startup via `sprites.js`:

```js
// sprites.js
const spriteCache = {};

export function loadSprite(name, path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { spriteCache[name] = img; resolve(); };
    img.src = path;
  });
}

export function drawSprite(ctx, name, x, y) {
  const img = spriteCache[name];
  if (img) ctx.drawImage(img, Math.round(x), Math.round(y), 32, 32);
}
```

`Math.round()` snaps the draw position to whole pixels, preserving crisp edges even while the entity's logical position is a float. This gives smooth movement (the position updates by fractional amounts each frame) with sharp rendering (the sprite is always drawn on an integer pixel boundary).

---

## 6. Pathfinding Integration

### A* Implementation

`pathfinding.js` exports a single function:

```js
export function findPath(grid, start, end)  // returns [{x, y}, ...] or null
```

The grid is treated as a 2D walkability map. A tile is walkable if `type !== "blocked"` and `towerId === null`. Diagonal movement is **not allowed** (4-directional only) to match the grid-based tower placement aesthetic.

### When A* Runs

- **On tower placement**: before confirming placement, run A* to validate the path is not fully blocked. If `findPath()` returns `null`, reject the placement and notify the player.
- **On tower removal** (if implemented): set `pathDirty = true`.
- **On wave start**: if `pathDirty`, recalculate.

Setting `pathDirty = true` after a successful tower placement means the path is recalculated once before the next use. This avoids running A* multiple times if the player places several towers in quick succession during `WAVE_IDLE`.

### Path Caching

The most recent valid path is stored as `state.cachedPath` (an array of `{x, y}` waypoints). When a new enemy spawns, it receives a **copy** of this path in its `path` field.

### Enemy Path Following

Each enemy has a `pathIndex` pointing to its next waypoint. Each frame:

```
direction = normalize(path[pathIndex] - enemy position)
enemy position += direction * speed * dt
if distance(enemy position, path[pathIndex]) < threshold:
    pathIndex++
if pathIndex >= path.length:
    enemy has reached the end → subtract a life, remove enemy
```

If a tower is placed mid-wave and the path changes, enemies already on the field keep their current path. Only newly spawned enemies get the updated path. This is simpler and avoids jarring movement changes. Enemies that would walk through a newly placed tower are an acceptable edge case at this scale (they clip through briefly).

---

## 7. Input Handling

### Mouse Flow

1. Player clicks a tower button in the HUD → enters **placement mode**. `input.selectedTowerType` is set.
2. Mouse moves over the grid → `renderer.js` draws a ghost preview of the tower on the hovered tile, colored green (valid) or red (invalid).
3. Player left-clicks a tile →
   - `economy.js` checks if the player can afford the tower.
   - `pathfinding.js` validates the path is not blocked.
   - If both pass: tower is created, gold is deducted, `pathDirty = true`.
   - If either fails: show feedback (flash the tile red, show a toast message).
4. Right-click or Escape → cancels placement mode.

### Event Binding

`input.js` binds `mousedown`, `mousemove`, `contextmenu`, and `keydown` on the canvas element. It converts pixel coordinates to grid coordinates:

```js
function pixelToGrid(px, py) {
  return {
    x: Math.floor(px / TILE_SIZE),
    y: Math.floor(py / TILE_SIZE)
  };
}
```

Events are stored as pending actions and processed at the start of `update()`, not inline in event handlers. This prevents state mutations during the render phase.

### Touch Support (v1)

Touch events map to mouse events: `touchstart` → `mousedown`, `touchmove` → `mousemove`. No multi-touch or gesture handling. Right-click equivalent: a "Cancel" button in the HUD.

---

## 8. Module Dependency Graph

```
                   main.js
                  /   |   \
                 /    |    \
            state.js  |  renderer.js
           /  |  \    |    /   |
          /   |   \   |   /    |
     grid.js  |  ui.js | sprites.js
       |      |    |   |
  pathfinding  |  input.js
       |      |
    towers.js |
       |      |
    enemies.js|
       \      |
        combat.js
          |
       economy.js
          |
       unlock.js
```

**Textual dependency list** (each module lists its imports):

| Module          | Imports from                                      |
|-----------------|---------------------------------------------------|
| `main.js`       | `state`, `renderer`, `input`, `ui`, `sprites`, `unlock` |
| `state.js`      | (none — pure data + transition logic)             |
| `grid.js`       | `state`                                           |
| `pathfinding.js`| (none — pure function, receives grid as argument) |
| `towers.js`     | `state`, `grid`, `pathfinding`, `economy`         |
| `enemies.js`    | `state`                                           |
| `waves.js`      | `state`, `enemies`                                |
| `combat.js`     | `state`, `enemies`                                |
| `economy.js`    | `state`                                           |
| `renderer.js`   | `state`, `sprites`                                |
| `ui.js`         | `state`, `towers`, `waves`, `input`, `unlock`     |
| `sprites.js`    | (none — pure image loading)                       |
| `input.js`      | `state`                                           |
| `unlock.js`     | (none — pure localStorage access)                 |

The graph is **acyclic**. Data flows downward from `main.js`. `state.js` is the shared data hub but imports nothing, preventing circular dependencies.

---

## 9. Performance Notes

### Expected Entity Counts

| Entity      | Typical Max | Absolute Worst Case |
|-------------|-------------|---------------------|
| Towers      | 40-60       | ~100 (filling most of the grid) |
| Enemies     | 30-40       | ~60 (large wave, slow enemies) |
| Projectiles | 20-30       | ~80 (many fast-firing towers)  |

Total entities on screen: typically under 130, worst case under 250.

### Why This Is Fine

At 250 entities, each frame does:
- ~250 position updates (trivial arithmetic)
- ~60 tower targeting checks (each scans ~40 enemies for range — ~2400 distance calculations)
- ~250 sprite draws

This is well within the budget of a 60fps `requestAnimationFrame` loop on any modern browser. **No spatial partitioning, object pooling, or other optimizations are needed at this scale.**

### Optimizations Included Anyway (Low Cost, High Value)

1. **Background caching**: The grid background is drawn once to an offscreen canvas and blitted each frame, avoiding 300 individual tile draws per frame.
2. **Path caching**: A* runs only when the grid changes, not every frame.
3. **Delta-time clamping**: `Math.min(dt, 0.1)` prevents a burst of catch-up updates after the browser tab is backgrounded and resumed.

### What to Watch

- If projectile counts spike (many frost towers with high fire rate), consider limiting active projectiles per tower.
- Canvas `drawImage` calls are the main rendering cost. If performance drops, batch sprites by type to reduce texture switching (unlikely to be needed).

---

## 10. Tower Type Reference

| Tower     | Range | Damage | Fire Rate | Special                  | Cost |
|-----------|-------|--------|-----------|--------------------------|------|
| Arrow     | 3.5   | 10     | 1.0/s     | None                     | 25   |
| Cannon    | 2.5   | 40     | 0.4/s     | Splash (1 tile radius)   | 60   |
| Frost     | 3.0   | 5      | 0.8/s     | Slows target 50% for 2s  | 40   |
| Ballista  | 5.0   | 25     | 0.5/s     | Piercing (hits 2 enemies)| 80   |
| Lemonade  | 3.0   | 15     | 1.2/s     | Bonus gold on kill (+5)  | 50   |

Lemonade tower is only available when `unlocks.lemonade === true`. Unlock condition: complete all 10 regular waves without losing a life.

## 11. Enemy Type Reference

| Enemy         | HP   | Speed | Gold | Notes                         |
|---------------|------|-------|------|-------------------------------|
| Soldier       | 50   | 2.0   | 10   | Basic unit                    |
| Cavalry       | 30   | 4.0   | 15   | Fast, low HP                  |
| Armored       | 120  | 1.2   | 25   | High HP, slow                 |
| Boss Soldier  | 300  | 1.5   | 100  | Boss-mode only, high HP       |
| Boss Cavalry  | 180  | 3.0   | 80   | Boss-mode only                |
| Boss Armored  | 600  | 0.8   | 150  | Boss-mode only, very tanky    |

Boss variants appear only in boss mode waves.
