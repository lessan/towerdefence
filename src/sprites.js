// ── Realm Ramparts — Programmatic Pixel-Art Sprites ──────────────────────────
// All sprites are pre-rendered to offscreen canvases on first call to loadSprites().
// Draw them with drawSprite(ctx, name, x, y).

const spriteCache = new Map();

function makeSpriteCanvas(width, height, drawFn) {
  const oc = document.createElement('canvas');
  oc.width = width;
  oc.height = height;
  const octx = oc.getContext('2d');
  octx.imageSmoothingEnabled = false;
  drawFn(octx, width, height);
  return oc;
}

// Helper: fill a single "pixel" (or NxN block)
function px(ctx, color, x, y, s = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, s, s);
}

// Helper: fill a rectangle
function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const PAL = {
  grassMid:    '#4a8c50',
  grassDark:   '#3d7a43',
  grassLight:  '#5fa666',
  stone:       '#8a8a8a',
  stoneLt:     '#aaaaaa',
  stoneDk:     '#666666',
  wood:        '#8B5E3C',
  woodLt:      '#a0714f',
  gold:        '#FFD700',
  goldDk:      '#e6c200',
  sand:        '#d2b48c',
  sandDk:      '#b8956a',
  sandLt:      '#e6cfa8',
  iron:        '#777777',
  ironDk:      '#555555',
  white:       '#ffffff',
  black:       '#000000',
  green:       '#44ff44',
  greenDk:     '#228822',
  brown:       '#885522',
  purple:      '#aa44ff',
  purpleDk:    '#7722bb',
  orange:      '#ff6622',
  orangeLt:    '#ff9966',
  red:         '#cc2222',
  redBright:   '#ff3333',
  yellow:      '#ffee00',
  yellowLt:    '#ffffaa',
  blue:        '#4488ff',
  blueLt:      '#88bbff',
  bronze:      '#b8860b',
  bronzeLt:    '#d4a843',
  greenGlow:   '#66ff66',
  greenGlowLt: '#aaffaa',
  skull:       '#e8e8d0',
};

// ─── TILE SPRITES (32×32) ────────────────────────────────────────────────────

function drawTileGrass(ctx) {
  // Base fill
  rect(ctx, PAL.grassMid, 0, 0, 32, 32);
  // Darker edge pixels (subtle border)
  rect(ctx, PAL.grassDark, 0, 0, 32, 1);
  rect(ctx, PAL.grassDark, 0, 0, 1, 32);
  rect(ctx, PAL.grassDark, 31, 0, 1, 32);
  rect(ctx, PAL.grassDark, 0, 31, 32, 1);
  // Corner darkening
  px(ctx, PAL.grassDark, 1, 1);
  px(ctx, PAL.grassDark, 30, 1);
  px(ctx, PAL.grassDark, 1, 30);
  px(ctx, PAL.grassDark, 30, 30);
  // Lighter highlight tuft details
  px(ctx, PAL.grassLight, 5, 6);
  px(ctx, PAL.grassLight, 6, 5);
  px(ctx, PAL.grassLight, 14, 10);
  px(ctx, PAL.grassLight, 15, 9);
  px(ctx, PAL.grassLight, 24, 20);
  px(ctx, PAL.grassLight, 25, 19);
  px(ctx, PAL.grassLight, 10, 24);
  px(ctx, PAL.grassLight, 11, 23);
  px(ctx, PAL.grassLight, 20, 5);
  px(ctx, PAL.grassLight, 8, 15);
  // Tiny grass tuft (3-pixel blade)
  px(ctx, PAL.grassLight, 18, 16);
  px(ctx, PAL.grassLight, 18, 15);
  px(ctx, PAL.grassLight, 19, 14);
}

function drawTileUnbuildable(ctx) {
  // Sandy/cobblestone base
  rect(ctx, PAL.sand, 0, 0, 32, 32);
  // Stone line grid pattern
  rect(ctx, PAL.sandDk, 0, 0, 32, 1);
  rect(ctx, PAL.sandDk, 0, 0, 1, 32);
  rect(ctx, PAL.sandDk, 15, 1, 1, 31);
  rect(ctx, PAL.sandDk, 1, 10, 31, 1);
  rect(ctx, PAL.sandDk, 1, 22, 31, 1);
  rect(ctx, PAL.sandDk, 31, 0, 1, 32);
  rect(ctx, PAL.sandDk, 0, 31, 32, 1);
  // Lighter highlights on "stones"
  px(ctx, PAL.sandLt, 3, 3, 2);
  px(ctx, PAL.sandLt, 20, 4, 2);
  px(ctx, PAL.sandLt, 5, 14, 2);
  px(ctx, PAL.sandLt, 22, 16, 2);
  px(ctx, PAL.sandLt, 8, 25, 2);
  px(ctx, PAL.sandLt, 24, 27, 2);
}

function drawTileTower(ctx) {
  // Same as grass base
  rect(ctx, PAL.grassMid, 0, 0, 32, 32);
  // Edges
  rect(ctx, PAL.grassDark, 0, 0, 32, 1);
  rect(ctx, PAL.grassDark, 0, 0, 1, 32);
  rect(ctx, PAL.grassDark, 31, 0, 1, 32);
  rect(ctx, PAL.grassDark, 0, 31, 32, 1);
  // Corner shadows (larger than plain grass)
  rect(ctx, PAL.grassDark, 1, 1, 3, 1);
  rect(ctx, PAL.grassDark, 1, 1, 1, 3);
  rect(ctx, PAL.grassDark, 28, 1, 3, 1);
  rect(ctx, PAL.grassDark, 30, 1, 1, 3);
  rect(ctx, PAL.grassDark, 1, 30, 3, 1);
  rect(ctx, PAL.grassDark, 1, 28, 1, 3);
  rect(ctx, PAL.grassDark, 28, 30, 3, 1);
  rect(ctx, PAL.grassDark, 30, 28, 1, 3);
  // Light tuft
  px(ctx, PAL.grassLight, 10, 14);
  px(ctx, PAL.grassLight, 22, 18);
}

// ─── TOWER SPRITES (32×32, top-down) ────────────────────────────────────────

function drawTowerCrossbow(ctx) {
  // Wooden post base (centre circle-ish)
  rect(ctx, PAL.wood, 12, 12, 8, 8);
  rect(ctx, PAL.woodLt, 13, 13, 6, 6);
  rect(ctx, PAL.wood, 11, 14, 1, 4);
  rect(ctx, PAL.wood, 20, 14, 1, 4);
  rect(ctx, PAL.wood, 14, 11, 4, 1);
  rect(ctx, PAL.wood, 14, 20, 4, 1);

  // Crossbow T-shape on top
  // Horizontal bow arm
  rect(ctx, PAL.woodLt, 6, 14, 20, 2);
  rect(ctx, PAL.wood, 6, 14, 1, 2);
  rect(ctx, PAL.wood, 25, 14, 1, 2);
  // String
  px(ctx, PAL.sandLt, 7, 15);
  px(ctx, PAL.sandLt, 24, 15);
  // Vertical stock
  rect(ctx, PAL.woodLt, 15, 10, 2, 14);
  // Bolt (pointing right)
  rect(ctx, PAL.iron, 17, 14, 8, 2);
  // Bolt tip
  rect(ctx, PAL.ironDk, 25, 14, 2, 1);
  rect(ctx, PAL.ironDk, 26, 15, 1, 1);
  px(ctx, PAL.ironDk, 25, 15);
}

function drawTowerBrazier(ctx) {
  // Cauldron body (squat oval)
  rect(ctx, PAL.bronze, 8, 10, 16, 12);
  rect(ctx, PAL.bronze, 10, 9, 12, 1);
  rect(ctx, PAL.bronze, 10, 22, 12, 1);
  // Lighter rim
  rect(ctx, PAL.bronzeLt, 9, 10, 14, 2);
  // Dark bottom
  rect(ctx, PAL.wood, 10, 20, 12, 2);

  // Three stubby legs
  rect(ctx, PAL.ironDk, 10, 23, 2, 4);
  rect(ctx, PAL.ironDk, 15, 23, 2, 4);
  rect(ctx, PAL.ironDk, 20, 23, 2, 4);

  // Green glow inside
  rect(ctx, PAL.greenGlow, 11, 12, 10, 6);
  rect(ctx, PAL.greenGlowLt, 13, 13, 6, 4);
  // Bubble details
  px(ctx, PAL.white, 13, 13);
  px(ctx, PAL.white, 18, 14);
  px(ctx, PAL.yellowLt, 15, 12);
}

function drawTowerBelltower(ctx) {
  // Square stone tower base
  rect(ctx, PAL.stone, 8, 8, 16, 18);
  // Stone detail lines
  rect(ctx, PAL.stoneDk, 8, 8, 16, 1);
  rect(ctx, PAL.stoneDk, 8, 8, 1, 18);
  rect(ctx, PAL.stoneDk, 23, 8, 1, 18);
  rect(ctx, PAL.stoneDk, 8, 25, 16, 1);
  // Lighter stone highlight
  rect(ctx, PAL.stoneLt, 10, 10, 5, 3);
  rect(ctx, PAL.stoneLt, 17, 15, 4, 3);
  // Mortar lines
  rect(ctx, PAL.stoneDk, 8, 16, 16, 1);

  // Golden bell on top
  rect(ctx, PAL.gold, 12, 4, 8, 8);
  rect(ctx, PAL.gold, 13, 3, 6, 1);
  rect(ctx, PAL.goldDk, 12, 11, 8, 2);
  // Bell clapper
  px(ctx, PAL.ironDk, 16, 11);
  px(ctx, PAL.ironDk, 16, 12);
  // Bell highlight
  px(ctx, PAL.yellowLt, 14, 5);
  px(ctx, PAL.yellowLt, 15, 5);
  // Bell top hook
  px(ctx, PAL.ironDk, 15, 2);
  px(ctx, PAL.ironDk, 16, 2);
}

function drawTowerBallista(ctx) {
  // Large stone base
  rect(ctx, PAL.stone, 4, 10, 24, 16);
  rect(ctx, PAL.stoneDk, 4, 10, 24, 1);
  rect(ctx, PAL.stoneDk, 4, 10, 1, 16);
  rect(ctx, PAL.stoneDk, 27, 10, 1, 16);
  rect(ctx, PAL.stoneDk, 4, 25, 24, 1);
  rect(ctx, PAL.stoneLt, 6, 12, 8, 3);
  rect(ctx, PAL.stoneLt, 18, 18, 6, 3);

  // Heavy wooden arm (diagonal-ish, pointing right)
  rect(ctx, PAL.wood, 8, 14, 18, 4);
  rect(ctx, PAL.woodLt, 9, 15, 16, 2);
  // Pivot mount
  rect(ctx, PAL.ironDk, 12, 13, 4, 6);
  rect(ctx, PAL.iron, 13, 14, 2, 4);

  // Big iron bolt tip (pointing right)
  rect(ctx, PAL.iron, 26, 14, 4, 4);
  rect(ctx, PAL.ironDk, 30, 15, 2, 2);
  px(ctx, PAL.ironDk, 31, 16);
}

function drawTowerLemonadecan(ctx) {
  // Blue ring at bottom
  rect(ctx, PAL.blue, 8, 26, 16, 3);
  // Can body (bright yellow)
  rect(ctx, '#ffdd00', 8, 5, 16, 22);
  // Blue ring at top
  rect(ctx, PAL.blue, 8, 3, 16, 3);

  // Can rim top
  rect(ctx, PAL.stoneLt, 10, 2, 12, 1);
  // Pull tab (red)
  rect(ctx, PAL.redBright, 13, 2, 6, 2);
  px(ctx, PAL.ironDk, 14, 1);
  px(ctx, PAL.ironDk, 17, 1);

  // White "LEMON" text pixels (simplified)
  const tx = 10;
  const ty = 13;
  // L
  rect(ctx, PAL.white, tx, ty, 1, 5);
  rect(ctx, PAL.white, tx, ty + 4, 2, 1);
  // E
  rect(ctx, PAL.white, tx + 3, ty, 1, 5);
  rect(ctx, PAL.white, tx + 4, ty, 1, 1);
  rect(ctx, PAL.white, tx + 4, ty + 2, 1, 1);
  rect(ctx, PAL.white, tx + 4, ty + 4, 1, 1);
  // M
  rect(ctx, PAL.white, tx + 6, ty, 1, 5);
  rect(ctx, PAL.white, tx + 8, ty, 1, 5);
  px(ctx, PAL.white, tx + 7, ty + 1);
  // O (simplified)
  rect(ctx, PAL.white, tx + 10, ty, 1, 5);
  rect(ctx, PAL.white, tx + 12, ty, 1, 5);
  px(ctx, PAL.white, tx + 11, ty);
  px(ctx, PAL.white, tx + 11, ty + 4);

  // Highlight/condensation
  px(ctx, PAL.white, 10, 8, 2);
  px(ctx, PAL.white, 11, 22);
  px(ctx, PAL.white, 20, 10);
  px(ctx, PAL.white, 19, 20);

  // Can edge shading
  rect(ctx, '#ccaa00', 8, 5, 1, 22);
  rect(ctx, '#ccaa00', 23, 5, 1, 22);

  // Bottom rim
  rect(ctx, PAL.stoneLt, 10, 28, 12, 1);
}

// ─── ENEMY SPRITES (24×24 effective, centred in 32×32) ──────────────────────

function drawEnemyGoblin(ctx) {
  const ox = 4, oy = 4; // offset to centre 24×24 in 32×32
  // Big round head
  rect(ctx, PAL.green, ox + 6, oy + 2, 12, 12);
  rect(ctx, PAL.green, ox + 8, oy + 1, 8, 1);
  rect(ctx, PAL.green, ox + 8, oy + 14, 8, 1);
  // Darker shade
  rect(ctx, PAL.greenDk, ox + 6, oy + 12, 12, 2);
  // Eyes (big dot eyes)
  px(ctx, PAL.black, ox + 9, oy + 6, 2);
  px(ctx, PAL.black, ox + 14, oy + 6, 2);
  // Eye shine
  px(ctx, PAL.white, ox + 9, oy + 6);
  px(ctx, PAL.white, ox + 14, oy + 6);
  // Mouth
  px(ctx, PAL.black, ox + 11, oy + 10);
  px(ctx, PAL.black, ox + 12, oy + 10);
  // Tiny body
  rect(ctx, '#886633', ox + 9, oy + 15, 6, 6);
  // Legs
  rect(ctx, PAL.green, ox + 9, oy + 21, 2, 3);
  rect(ctx, PAL.green, ox + 13, oy + 21, 2, 3);
}

function drawEnemyOrc(ctx) {
  const ox = 4, oy = 4;
  // Broader head
  rect(ctx, PAL.greenDk, ox + 4, oy + 2, 16, 12);
  rect(ctx, PAL.greenDk, ox + 6, oy + 1, 12, 1);
  rect(ctx, PAL.greenDk, ox + 6, oy + 14, 12, 1);
  // Lighter face
  rect(ctx, '#339933', ox + 6, oy + 4, 12, 8);
  // Eyes (angry)
  rect(ctx, PAL.black, ox + 8, oy + 5, 3, 2);
  rect(ctx, PAL.black, ox + 14, oy + 5, 3, 2);
  px(ctx, PAL.redBright, ox + 9, oy + 5);
  px(ctx, PAL.redBright, ox + 15, oy + 5);
  // Tusks (two white pixels at bottom of face)
  px(ctx, PAL.white, ox + 9, oy + 12, 2);
  px(ctx, PAL.white, ox + 14, oy + 12, 2);
  // Body (broad)
  rect(ctx, PAL.greenDk, ox + 6, oy + 15, 12, 6);
  rect(ctx, '#556633', ox + 7, oy + 15, 10, 5); // armor
  // Legs
  rect(ctx, PAL.greenDk, ox + 7, oy + 21, 3, 3);
  rect(ctx, PAL.greenDk, ox + 14, oy + 21, 3, 3);
}

function drawEnemyTroll(ctx) {
  const ox = 4, oy = 4;
  // Large brown hunched lump
  rect(ctx, PAL.brown, ox + 3, oy + 4, 18, 16);
  rect(ctx, PAL.brown, ox + 5, oy + 2, 14, 2);
  rect(ctx, PAL.brown, ox + 5, oy + 20, 14, 2);
  // Rounded top
  rect(ctx, PAL.brown, ox + 7, oy + 1, 10, 1);
  // Lighter belly
  rect(ctx, '#996633', ox + 7, oy + 10, 10, 8);
  // Small angry dot eyes
  px(ctx, PAL.redBright, ox + 9, oy + 6, 2);
  px(ctx, PAL.redBright, ox + 14, oy + 6, 2);
  // Frown
  rect(ctx, PAL.black, ox + 10, oy + 9, 5, 1);
  // Hunched shadow
  rect(ctx, '#664411', ox + 3, oy + 16, 18, 2);
  // Feet
  rect(ctx, '#664411', ox + 5, oy + 22, 4, 2);
  rect(ctx, '#664411', ox + 15, oy + 22, 4, 2);
}

function drawEnemyLich(ctx) {
  const ox = 4, oy = 4;
  // Purple hooded robe (triangular)
  rect(ctx, PAL.purple, ox + 6, oy + 0, 12, 4);
  rect(ctx, PAL.purple, ox + 5, oy + 4, 14, 6);
  rect(ctx, PAL.purple, ox + 4, oy + 10, 16, 6);
  rect(ctx, PAL.purple, ox + 3, oy + 16, 18, 4);
  // Wispy bottom (robes fading)
  rect(ctx, PAL.purpleDk, ox + 4, oy + 20, 4, 2);
  rect(ctx, PAL.purpleDk, ox + 10, oy + 20, 3, 3);
  rect(ctx, PAL.purpleDk, ox + 16, oy + 20, 4, 2);
  px(ctx, PAL.purpleDk, ox + 6, oy + 22);
  px(ctx, PAL.purpleDk, ox + 17, oy + 22);
  // White skull face
  rect(ctx, PAL.skull, ox + 8, oy + 4, 8, 7);
  rect(ctx, PAL.skull, ox + 9, oy + 3, 6, 1);
  // Eye sockets
  px(ctx, PAL.black, ox + 10, oy + 6, 2);
  px(ctx, PAL.black, ox + 14, oy + 6, 2);
  // Nose
  px(ctx, PAL.black, ox + 12, oy + 8);
  // Jaw line
  rect(ctx, '#ccccbb', ox + 9, oy + 10, 6, 1);
  // Green glow around
  px(ctx, PAL.greenGlow, ox + 7, oy + 3);
  px(ctx, PAL.greenGlow, ox + 17, oy + 5);
  px(ctx, PAL.greenGlow, ox + 5, oy + 9);
}

function drawEnemyOgre(ctx) {
  const ox = 4, oy = 4;
  // Large orange body
  rect(ctx, PAL.orange, ox + 4, oy + 2, 16, 16);
  rect(ctx, PAL.orange, ox + 6, oy + 1, 12, 1);
  rect(ctx, PAL.orange, ox + 6, oy + 18, 12, 1);
  // Lighter face area
  rect(ctx, PAL.orangeLt, ox + 7, oy + 4, 10, 8);
  // X eyes (angry)
  px(ctx, PAL.black, ox + 9, oy + 5);
  px(ctx, PAL.black, ox + 11, oy + 5);
  px(ctx, PAL.black, ox + 10, oy + 6);
  px(ctx, PAL.black, ox + 9, oy + 7);
  px(ctx, PAL.black, ox + 11, oy + 7);
  // Second X eye
  px(ctx, PAL.black, ox + 14, oy + 5);
  px(ctx, PAL.black, ox + 16, oy + 5);
  px(ctx, PAL.black, ox + 15, oy + 6);
  px(ctx, PAL.black, ox + 14, oy + 7);
  px(ctx, PAL.black, ox + 16, oy + 7);
  // Angry mouth
  rect(ctx, PAL.black, ox + 10, oy + 10, 5, 1);
  rect(ctx, PAL.redBright, ox + 10, oy + 11, 5, 1);
  // Big fists
  rect(ctx, PAL.orange, ox + 1, oy + 12, 4, 5);
  rect(ctx, PAL.orangeLt, ox + 1, oy + 12, 3, 4);
  rect(ctx, PAL.orange, ox + 19, oy + 12, 4, 5);
  rect(ctx, PAL.orangeLt, ox + 20, oy + 12, 3, 4);
  // Legs
  rect(ctx, PAL.orange, ox + 7, oy + 19, 4, 4);
  rect(ctx, PAL.orange, ox + 13, oy + 19, 4, 4);
}

function drawEnemyWyrm(ctx) {
  const ox = 4, oy = 4;
  // Serpentine S-shape body (dark red)
  const bodyColor = PAL.red;
  const scaleColor = PAL.iron;
  // Head (left side)
  rect(ctx, bodyColor, ox + 2, oy + 4, 6, 5);
  // Eye glint
  px(ctx, PAL.yellow, ox + 6, oy + 5);
  px(ctx, PAL.white, ox + 6, oy + 5);
  // Upper curve going right
  rect(ctx, bodyColor, ox + 7, oy + 6, 6, 4);
  rect(ctx, bodyColor, ox + 12, oy + 8, 5, 4);
  // Middle curve going left
  rect(ctx, bodyColor, ox + 10, oy + 11, 5, 4);
  rect(ctx, bodyColor, ox + 5, oy + 13, 6, 4);
  // Lower curve going right (tail)
  rect(ctx, bodyColor, ox + 9, oy + 15, 6, 4);
  rect(ctx, bodyColor, ox + 14, oy + 17, 5, 3);
  // Tail tip
  rect(ctx, bodyColor, ox + 18, oy + 18, 3, 2);
  px(ctx, bodyColor, ox + 21, oy + 19);

  // Scale detail (grey pixels scattered on body)
  px(ctx, scaleColor, ox + 4, oy + 6);
  px(ctx, scaleColor, ox + 9, oy + 8);
  px(ctx, scaleColor, ox + 14, oy + 10);
  px(ctx, scaleColor, ox + 12, oy + 13);
  px(ctx, scaleColor, ox + 7, oy + 15);
  px(ctx, scaleColor, ox + 11, oy + 17);
  px(ctx, scaleColor, ox + 16, oy + 18);

  // Darker underbelly accents
  rect(ctx, '#881111', ox + 2, oy + 8, 6, 1);
  rect(ctx, '#881111', ox + 10, oy + 14, 5, 1);
}

function drawEnemyOgrunt(ctx) {
  const ox = 4, oy = 4;
  // Small orange body (like ogre but tiny)
  rect(ctx, PAL.orange, ox + 7, oy + 5, 10, 10);
  rect(ctx, PAL.orange, ox + 8, oy + 4, 8, 1);
  rect(ctx, PAL.orange, ox + 8, oy + 15, 8, 1);
  // Lighter face
  rect(ctx, PAL.orangeLt, ox + 9, oy + 6, 6, 6);
  // X eyes (same as ogre, tiny)
  px(ctx, PAL.black, ox + 10, oy + 7);
  px(ctx, PAL.black, ox + 11, oy + 8);
  px(ctx, PAL.black, ox + 10, oy + 9);
  px(ctx, PAL.black, ox + 13, oy + 7);
  px(ctx, PAL.black, ox + 14, oy + 8);
  px(ctx, PAL.black, ox + 13, oy + 9);
  // Mouth
  rect(ctx, PAL.black, ox + 11, oy + 11, 3, 1);
  // Tiny fists
  rect(ctx, PAL.orange, ox + 5, oy + 10, 3, 3);
  rect(ctx, PAL.orange, ox + 16, oy + 10, 3, 3);
  // Tiny legs
  rect(ctx, PAL.orange, ox + 9, oy + 16, 2, 3);
  rect(ctx, PAL.orange, ox + 13, oy + 16, 2, 3);
}

// ─── PROJECTILE SPRITES (small, centred in 32×32) ──────────────────────────

function drawProjCrossbow(ctx) {
  // Small yellow bolt 8×3, centred
  const ox = 12, oy = 14;
  rect(ctx, PAL.gold, ox, oy, 8, 3);
  // Pointed tip (right side)
  px(ctx, PAL.goldDk, ox + 7, oy);
  px(ctx, PAL.goldDk, ox + 7, oy + 2);
  rect(ctx, PAL.ironDk, ox + 8, oy + 1, 2, 1);
  // Fletching (left side)
  px(ctx, PAL.redBright, ox, oy);
  px(ctx, PAL.redBright, ox, oy + 2);
}

function drawProjBrazier(ctx) {
  // Green fire blob ~8px, centred
  const cx = 16, cy = 16;
  // Outer green
  rect(ctx, PAL.greenGlow, cx - 4, cy - 3, 8, 6);
  rect(ctx, PAL.greenGlow, cx - 3, cy - 4, 6, 8);
  // Inner bright
  rect(ctx, PAL.greenGlowLt, cx - 2, cy - 2, 4, 4);
  // Yellow centre
  px(ctx, PAL.yellow, cx - 1, cy - 1, 2);
  // Top flicker
  px(ctx, PAL.greenGlow, cx, cy - 5);
  px(ctx, PAL.greenGlowLt, cx - 1, cy - 4);
}

function drawProjBelltower(ctx) {
  // Blue sound-wave arc 12×12
  const cx = 16, cy = 16;
  // Draw a curved arc (not full circle) opening to the right
  // Outer arc
  ctx.fillStyle = PAL.blue;
  // Right-facing arc approximation with pixels
  px(ctx, PAL.blue, cx + 3, cy - 5);
  px(ctx, PAL.blue, cx + 4, cy - 4);
  px(ctx, PAL.blue, cx + 5, cy - 3);
  px(ctx, PAL.blue, cx + 6, cy - 2);
  px(ctx, PAL.blue, cx + 6, cy - 1);
  px(ctx, PAL.blue, cx + 6, cy);
  px(ctx, PAL.blue, cx + 6, cy + 1);
  px(ctx, PAL.blue, cx + 5, cy + 2);
  px(ctx, PAL.blue, cx + 4, cy + 3);
  px(ctx, PAL.blue, cx + 3, cy + 4);
  // Inner arc (lighter)
  px(ctx, PAL.blueLt, cx + 1, cy - 3);
  px(ctx, PAL.blueLt, cx + 2, cy - 2);
  px(ctx, PAL.blueLt, cx + 3, cy - 1);
  px(ctx, PAL.blueLt, cx + 3, cy);
  px(ctx, PAL.blueLt, cx + 2, cy + 1);
  px(ctx, PAL.blueLt, cx + 1, cy + 2);
}

function drawProjBallista(ctx) {
  // Large grey bolt 12×5, centred
  const ox = 10, oy = 13;
  rect(ctx, PAL.iron, ox, oy, 12, 5);
  rect(ctx, PAL.stoneLt, ox + 1, oy + 1, 10, 3);
  // Iron tip (darker, right side)
  rect(ctx, PAL.ironDk, ox + 11, oy, 3, 5);
  rect(ctx, PAL.ironDk, ox + 14, oy + 1, 2, 3);
  px(ctx, PAL.ironDk, ox + 16, oy + 2);
  // Fletching
  px(ctx, '#884444', ox, oy);
  px(ctx, '#884444', ox, oy + 4);
  px(ctx, '#884444', ox + 1, oy);
  px(ctx, '#884444', ox + 1, oy + 4);
}

function drawProjLemonadecan(ctx) {
  // Bright yellow fizzy bubble circle ~10px, centred
  const cx = 16, cy = 16;
  // Outer circle
  rect(ctx, PAL.gold, cx - 4, cy - 3, 8, 6);
  rect(ctx, PAL.gold, cx - 3, cy - 4, 6, 8);
  rect(ctx, PAL.gold, cx - 5, cy - 1, 10, 2);
  // Inner bright
  rect(ctx, PAL.yellow, cx - 3, cy - 2, 6, 4);
  rect(ctx, PAL.yellow, cx - 2, cy - 3, 4, 6);
  // White sparkle pixel inside
  px(ctx, PAL.white, cx - 1, cy - 2);
  px(ctx, PAL.white, cx, cy - 2);
  px(ctx, PAL.white, cx - 2, cy);
  // Fizzy outer sparkles
  px(ctx, PAL.yellowLt, cx + 4, cy - 4);
  px(ctx, PAL.yellowLt, cx - 4, cy + 3);
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export function loadSprites() {
  // Tiles
  spriteCache.set('tile_grass',       makeSpriteCanvas(32, 32, drawTileGrass));
  spriteCache.set('tile_unbuildable', makeSpriteCanvas(32, 32, drawTileUnbuildable));
  spriteCache.set('tile_tower',       makeSpriteCanvas(32, 32, drawTileTower));

  // Towers
  spriteCache.set('tower_crossbow',     makeSpriteCanvas(32, 32, drawTowerCrossbow));
  spriteCache.set('tower_brazier',      makeSpriteCanvas(32, 32, drawTowerBrazier));
  spriteCache.set('tower_belltower',    makeSpriteCanvas(32, 32, drawTowerBelltower));
  spriteCache.set('tower_ballista',     makeSpriteCanvas(32, 32, drawTowerBallista));
  spriteCache.set('tower_lemonadecan',  makeSpriteCanvas(32, 32, drawTowerLemonadecan));

  // Enemies
  spriteCache.set('enemy_goblin',  makeSpriteCanvas(32, 32, drawEnemyGoblin));
  spriteCache.set('enemy_orc',     makeSpriteCanvas(32, 32, drawEnemyOrc));
  spriteCache.set('enemy_troll',   makeSpriteCanvas(32, 32, drawEnemyTroll));
  spriteCache.set('enemy_lich',    makeSpriteCanvas(32, 32, drawEnemyLich));
  spriteCache.set('enemy_ogre',    makeSpriteCanvas(32, 32, drawEnemyOgre));
  spriteCache.set('enemy_wyrm',    makeSpriteCanvas(32, 32, drawEnemyWyrm));
  spriteCache.set('enemy_ogrunt',  makeSpriteCanvas(32, 32, drawEnemyOgrunt));

  // Projectiles
  spriteCache.set('proj_crossbow',     makeSpriteCanvas(32, 32, drawProjCrossbow));
  spriteCache.set('proj_brazier',      makeSpriteCanvas(32, 32, drawProjBrazier));
  spriteCache.set('proj_belltower',    makeSpriteCanvas(32, 32, drawProjBelltower));
  spriteCache.set('proj_ballista',     makeSpriteCanvas(32, 32, drawProjBallista));
  spriteCache.set('proj_lemonadecan',  makeSpriteCanvas(32, 32, drawProjLemonadecan));
}

export function drawSprite(ctx, name, x, y) {
  const sprite = spriteCache.get(name);
  if (!sprite) return;
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}
