# Game Design Document — Realm Ramparts

## 1. Overview

**Title:** Realm Ramparts
**Platform:** Browser (HTML5 Canvas, vanilla JavaScript)
**Genre:** Tower Defence — Maze-builder variant
**Theme:** Medieval fantasy, bright and cheerful
**Visual Style:** True pixel art (hard-edged sprites) with smooth sub-pixel movement for enemies and projectiles

**Core Loop:** Players place towers on a grid to build walls and mazes. Enemies pathfind from spawn to exit using A\*. The player must keep at least one valid path open at all times — any tower placement that would block all paths is rejected. Enemies killed award gold, which is spent on more towers.

**Scope:** 1 map, 5 tower types, 4 enemy types, 10 regular waves, 5 boss waves.

---

## 2. Game Modes

### Regular Mode
- 10 waves of increasing difficulty.
- Uses the 3 regular enemy types.
- Completing wave 10 for the first time unlocks the secret Lemonade Can tower (persisted via `localStorage`).

### Boss Mode
- Separate opt-in mode selectable from the main menu.
- Same map and tower placement rules as regular mode.
- 5 waves using boss-mode exclusive enemies only (the 3 regular enemies do not appear).
- The Lemonade Can tower is available in boss mode if previously unlocked.
- Completing boss mode does **not** unlock the Lemonade Can.

---

## 3. Map & Grid

- **Grid size:** 20 columns x 15 rows (300 cells).
- **Cell size:** 32 x 32 pixels (canvas resolution: 640 x 480).
- **Spawn point:** Top-left area (column 0, row 7 — middle-left edge).
- **Exit point:** Bottom-right area (column 19, row 7 — middle-right edge).
- Towers occupy exactly 1 cell each.
- The spawn and exit cells (and their immediate neighbours) are unbuildable, shown with a distinct ground texture.
- The default open path runs horizontally across the centre of the map. Players build mazes above and below this line.
- Terrain is a bright grass field with occasional decorative flowers and cobblestones (non-blocking visual details only).
- Pathfinding: A\* recalculated on every tower placement attempt. If no valid path exists from spawn to exit, the placement is rejected and the player is shown a brief "Path blocked!" indicator.

---

## 4. Towers

All towers are placed on a single grid cell. Towers cannot be sold in v1.

### 4.1 Tower Stats

| # | Name | Damage | Range (cells) | Fire Rate (shots/sec) | Cost (gold) | Description |
|---|------|--------|---------------|----------------------|-------------|-------------|
| 1 | Squire's Crossbow | 15 | 3.0 | 1.5 | 50 | A simple wooden crossbow turret on a short post. |
| 2 | Alchemist's Brazier | 8 / tick | 2.0 | 3.0 | 75 | A bubbling bronze cauldron that spits green fire in an area. |
| 3 | Ballista of the Keep | 60 | 5.0 | 0.5 | 125 | A massive iron-tipped ballista bolt launcher on a stone base. |
| 4 | Herald's Bell Tower | 20 | 2.5 | 1.0 | 100 | A small stone bell tower that sends out a shockwave ring. |
| 5 | The Lemonade Can | 200 | 6.0 | 4.0 | 300 | A bright yellow aluminium can of fizzy lemonade. Absurd. |

### 4.2 Tower Details

#### Squire's Crossbow (50g)
- **Visual:** A knee-high wooden post with a small repeating crossbow mounted on top. Tan wood, iron-grey bolt tips. The bow rotates to face targets.
- **Behaviour:** Single-target. Fires a bolt projectile at the nearest enemy. Reliable early-game tower with balanced stats.
- **Flavour:** *"Every squire starts somewhere. Most start here."*

#### Alchemist's Brazier (75g)
- **Visual:** A squat bronze cauldron on three stubby legs, filled with glowing green liquid. Bubbles pop on the surface. Green fire splashes outward when attacking.
- **Behaviour:** Area-of-effect (AoE). Deals 8 damage per tick (3 ticks/sec = 24 DPS) to all enemies within range. Short range but punishes clustered enemies.
- **Flavour:** *"The alchemist insists it's perfectly safe. The alchemist is missing both eyebrows."*

#### Ballista of the Keep (125g)
- **Visual:** A large stone platform supporting a heavy wooden ballista. The bolt is oversized with iron flanges. Winds up visibly before each shot.
- **Behaviour:** Single-target. High damage, long range, slow fire rate. The bolt pierces through the first enemy and hits one additional enemy behind it (pierce = 2 targets max).
- **Flavour:** *"When diplomacy fails, the Ballista speaks volumes — at 300 feet per second."*

#### Herald's Bell Tower (100g)
- **Visual:** A small square stone tower with a golden bell at the top. When it fires, the bell swings and visible sound-wave rings ripple outward.
- **Behaviour:** AoE ring attack. Damages all enemies within range. Additionally applies a 30% slow effect for 1.5 seconds. Good crowd-control tower.
- **Flavour:** *"BONG. BONG. BONG. The heralds never stop. Neither does the headache."*

#### The Lemonade Can (300g) — SECRET TOWER
- **Visual:** A modern bright-yellow aluminium soft-drink can with a red-and-white "LEMONADE" label, a pull-tab top, and condensation droplets. Completely anachronistic in the medieval setting. When it fires, it shoots a stream of fizzy golden liquid in a rapid arc.
- **Behaviour:** Rapid-fire AoE. Fires 4 shots per second, each dealing 200 damage in a 1.5-cell splash radius. Effectively 800 DPS in an area. Targets the strongest enemy in range.
- **Unlock:** Beat wave 10 of regular mode for the first time. Persisted in `localStorage`.
- **Flavour:** *"Refreshingly overpowered. Contains: citric acid, carbonated water, and the tears of a thousand goblins."*

---

## 5. Enemies

### 5.1 Regular Enemies

| # | Name | HP | Speed | Gold Reward | First Appears |
|---|------|----|-------|-------------|---------------|
| 1 | Goblin Scurrier | 30 | Fast (90 px/sec) | 5g | Wave 1 |
| 2 | Skeleton Marcher | 80 | Medium (60 px/sec) | 12g | Wave 3 |
| 3 | Armoured Troll | 200 | Slow (35 px/sec) | 25g | Wave 6 |

### 5.2 Regular Enemy Details

#### Goblin Scurrier
- **Visual:** A tiny bright-green goblin in a tattered brown tunic, carrying a comically oversized wooden shield. Bounces as it runs. 8x10 pixel sprite.
- **Behaviour:** Fast but fragile. Appears in large groups. The primary early-game enemy and remains a threat in later waves due to swarm counts.

#### Skeleton Marcher
- **Visual:** A white-bone skeleton wearing a rusty iron helmet and carrying a bent sword. Walks with a stiff, jerky gait. 10x12 pixel sprite.
- **Behaviour:** Mid-tier enemy. Moderate speed and health. Arrives in medium-sized packs.

#### Armoured Troll
- **Visual:** A large blue-grey troll wearing riveted iron plate armour. Lumbers forward with heavy footsteps. 14x16 pixel sprite (largest regular enemy).
- **Behaviour:** Slow and tanky. High HP requires sustained fire. Arrives in small numbers but can absorb enormous punishment.

### 5.3 Boss-Mode Exclusive Enemies

| # | Name | HP | Speed | Gold Reward | Special Trait |
|---|------|----|-------|-------------|---------------|
| B1 | Lich of the Barrow | 500 | Slow (30 px/sec) | 60g | Regeneration (10 HP/sec) |
| B2 | Twinblood Ogre | 350 | Medium (55 px/sec) | 40g | Splits into 2 Ogre Runts on death (each: 100 HP, fast, 15g) |
| B3 | Ironhide Wyrm | 800 | Slow (25 px/sec) | 80g | 50% damage reduction (armoured) |

#### Lich of the Barrow
- **Visual:** A floating skeletal figure in tattered purple robes, surrounded by a faint green glow. Ghostly wisps trail behind it. 12x16 pixel sprite.
- **Behaviour:** Regenerates 10 HP per second. Must be killed with sustained, high DPS. Regeneration does not exceed max HP.

#### Twinblood Ogre
- **Visual:** A hulking red-skinned ogre with two heads, wearing a chain harness. Each head snarls independently. 16x16 pixel sprite.
- **Behaviour:** On death, splits into 2 Ogre Runts — smaller (10x10), faster (80 px/sec) versions with 100 HP each. Each Runt awards 15g on kill. Forces the player to handle a sudden burst of fast enemies.

#### Ironhide Wyrm
- **Visual:** A long serpentine dragon-worm with overlapping iron-grey scales. Slithers forward with a segmented body animation. 20x12 pixel sprite (long and low).
- **Behaviour:** Takes 50% reduced damage from all sources (armour). Extremely slow but nearly unkillable without heavy investment. The ultimate tank enemy.

---

## 6. Wave Definitions

### 6.1 Regular Mode (10 Waves)

Player starts with 200 gold. A 10-second countdown precedes wave 1. Each subsequent wave starts 8 seconds after the previous wave is cleared.

| Wave | Enemies | Notable |
|------|---------|---------|
| 1 | 8 Goblin Scurriers | Introduction wave. Easy. |
| 2 | 12 Goblin Scurriers | Slightly larger swarm. |
| 3 | 6 Goblin Scurriers + 4 Skeleton Marchers | Skeletons introduced. Mixed speeds. |
| 4 | 10 Skeleton Marchers | Pure skeleton wave. Tests mid-tier DPS. |
| 5 | 15 Goblin Scurriers + 5 Skeleton Marchers | Large mixed wave. First difficulty spike. |
| 6 | 3 Armoured Trolls + 6 Skeleton Marchers | Trolls introduced. Tanky frontline. |
| 7 | 20 Goblin Scurriers + 3 Armoured Trolls | Swarm + tanks simultaneously. |
| 8 | 8 Skeleton Marchers + 5 Armoured Trolls | Heavy wave. High total HP. |
| 9 | 25 Goblin Scurriers + 6 Skeleton Marchers + 4 Armoured Trolls | All types, large numbers. Major spike. |
| 10 | 10 Skeleton Marchers + 8 Armoured Trolls + 30 Goblin Scurriers | Final wave. Everything at once. |

### 6.2 Boss Mode (5 Waves)

Player starts with 400 gold (more starting gold because boss enemies are expensive to defend against). A 15-second countdown precedes wave 1. Each subsequent wave starts 12 seconds after the previous wave is cleared.

| Wave | Enemies | Notable |
|------|---------|---------|
| B1 | 3 Liches of the Barrow | Regeneration test. Sustained DPS required. |
| B2 | 4 Twinblood Ogres | Splits on death = 4 + 8 runts. Tests burst handling. |
| B3 | 2 Ironhide Wyrms + 2 Liches | Armour + regen combo. |
| B4 | 5 Twinblood Ogres + 3 Liches | Split chaos + regen. Major spike. |
| B5 | 3 Ironhide Wyrms + 4 Liches + 6 Twinblood Ogres | All boss types. Endurance test. |

---

## 7. Economy

### Starting Gold
- **Regular mode:** 200g
- **Boss mode:** 400g

### Kill Rewards

| Enemy | Gold Reward |
|-------|-------------|
| Goblin Scurrier | 5g |
| Skeleton Marcher | 12g |
| Armoured Troll | 25g |
| Lich of the Barrow | 60g |
| Twinblood Ogre | 40g |
| Ogre Runt (split) | 15g |
| Ironhide Wyrm | 80g |

### Tower Costs

| Tower | Cost |
|-------|------|
| Squire's Crossbow | 50g |
| Alchemist's Brazier | 75g |
| Herald's Bell Tower | 100g |
| Ballista of the Keep | 125g |
| The Lemonade Can | 300g |

### Economy Notes
- No wave-completion bonus in v1. All income comes from kills.
- No selling towers in v1. Placement is permanent.
- No interest or passive income mechanics.
- Estimated total gold from regular mode (all kills): approximately 1,300g — enough for a varied but not complete tower loadout, forcing strategic choices.

---

## 8. Unlock System

### Lemonade Can Unlock Flow

1. Player completes wave 10 of regular mode (all enemies in wave 10 killed, none reach exit).
2. Game sets `localStorage` key: `td_lemonade_unlocked = "true"`.
3. An unlock popup appears: a pixel-art Lemonade Can drops from the top of the screen, lands with a bounce, and a text banner reads **"SECRET UNLOCKED: The Lemonade Can!"** with a fizzy particle effect. The popup auto-dismisses after 3 seconds or on click.
4. On every subsequent game load, the game checks `localStorage` for `td_lemonade_unlocked`. If `"true"`, the Lemonade Can appears as a 5th option in the tower build panel with a sparkle indicator.
5. The Lemonade Can is available in both regular mode and boss mode once unlocked.
6. Boss mode completion does **not** set the unlock flag. Only regular mode wave 10 completion does.

### Player Lives
- The player has **20 lives** in regular mode and **10 lives** in boss mode.
- Each enemy that reaches the exit removes 1 life (regardless of enemy type).
- When lives reach 0, the game is over. A "Game Over" screen shows the wave reached.
- Lives are displayed as a heart icon + number in the HUD.

---

## 9. Art Direction

### Style
- **True pixel art:** Hard-edged sprites with no anti-aliasing. No sub-pixel rendering on sprites themselves.
- **Movement:** Enemies and projectiles move smoothly using sub-pixel positioning. They glide between grid cells — no tile-snapping.
- **Sprite sizes:** Towers fit within 32x32 cells. Enemies range from 8x10 (Goblin) to 20x12 (Wyrm). Projectiles are 4x4 or smaller.
- **Animation:** 2-4 frame idle animations for towers. 2-frame walk cycles for enemies. Projectiles do not animate (static sprites with rotation).

### Colour Palette
Bright, cheerful medieval fantasy. Suggested base palette (expandable):

| Use | Colour | Hex |
|-----|--------|-----|
| Grass (light) | Soft green | `#7EC850` |
| Grass (dark) | Deeper green | `#5B8C3E` |
| Stone/walls | Warm grey | `#A0937D` |
| Wood | Tan/brown | `#C4A265` |
| Gold UI | Bright gold | `#FFD700` |
| Enemy HP bar BG | Dark red | `#8B0000` |
| Enemy HP bar fill | Bright red | `#FF3333` |
| Sky/UI background | Soft blue | `#87CEEB` |
| Highlights | Cream white | `#FFF8E7` |

### UI Layout
- **Top bar:** Wave counter (left), gold display (centre), lives display (right).
- **Right panel (4 cells wide):** Tower build panel. Each tower shown as icon + name + cost. Click to select, then click a grid cell to place.
- **Grid area:** 20x15 playfield occupies the main canvas area.
- Hover over a grid cell shows range preview (translucent circle) for the selected tower.
- Invalid placements flash the cell red briefly.

---

## 10. Audio Notes

Scope: Simple sound effects only. No background music in v1.

| Event | Sound |
|-------|-------|
| Tower placed | Short stone-clunk thud |
| Tower fires (crossbow) | Quick twang |
| Tower fires (brazier) | Sizzle-pop |
| Tower fires (ballista) | Deep thwunk |
| Tower fires (bell) | Resonant bell ring |
| Tower fires (lemonade) | Fizzy carbonation hiss |
| Enemy killed | Soft pop + coin clink |
| Enemy reaches exit | Sad descending tone |
| Wave start | Horn fanfare (short) |
| Wave cleared | Cheerful chime |
| Game over | Low descending brass |
| Lemonade unlock | Soda-can opening hiss + triumphant sting |
| Path blocked (invalid placement) | Dull buzz/thud |

All sounds should be short (under 1 second) except the unlock sting (up to 2 seconds). Sounds can be generated or sourced from free SFX libraries (e.g., jsfxr for retro-style procedural sounds).
