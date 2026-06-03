// Block registry + procedurally generated texture atlas (asset-free).
// Every tile is painted into a single canvas, uploaded once as a
// NearestFilter CanvasTexture so all chunk meshes share one material.
import * as THREE from './vendor/three.module.js';

export const TILE = 16; // px per tile
export const ATLAS_COLS = 8; // tiles per row in the atlas

// Tile indices into the atlas grid.
const T = {
  grass_top: 0,
  grass_side: 1,
  dirt: 2,
  stone: 3,
  sand: 4,
  log_side: 5,
  log_top: 6,
  leaves: 7,
  water: 8,
  bedrock: 9,
  plank: 10,
  cobble: 11,
  snow: 12,
  glass: 13,
  brick: 14,
  pumpkin_side: 15,
  pumpkin_top: 16,
  coal_ore: 17,
  iron_ore: 18,
  gold_ore: 19,
  diamond_ore: 20,
  redstone_ore: 21,
  table_top: 22,
  table_side: 23,
  furnace_front: 24,
  furnace_side: 25,
  furnace_top: 26,
  torch: 27,
  birch_log: 28,
  birch_leaves: 29,
  spruce_log: 30,
  spruce_leaves: 31,
  dry_grass: 32,
  cactus: 33,
  stone_bricks: 34,
  mossy_cobble: 35,
  wool_white: 36,
  wool_red: 37,
  wool_blue: 38,
  wool_yellow: 39,
  wool_green: 40,
  wool_black: 41,
  gravel: 42,
  clay: 43,
  sandstone: 44,
  red_sandstone: 45,
  smooth_stone: 46,
  granite: 47,
  diorite: 48,
  andesite: 49,
  deepslate: 50,
  calcite: 51,
  bookshelf: 52,
  hay_bale: 53,
  obsidian: 54,
  packed_ice: 55,
  spruce_planks: 56,
  birch_planks: 57,
  wheat_crop: 58,
  veg_crop: 59,
  lantern: 60,   // glowing lantern tile (warm amber)
  bread_top:  61, // bread loaf — golden-brown crusty top with a score slash
  bread_side: 62, // bread loaf — warm crumb/crust side face
  register_front: 63, // cash register — body + LCD display + key grid + drawer
  register_side:  64, // cash register — plain body side with drawer seam
  scale_top:      65, // kitchen scale — round dial seen from above on the pan
  scale_side:     66, // kitchen scale — metal base + dial + pan lip
  jar_side:       67, // glass canister — clear body, lid band, flour contents
  baguette_top:   68, // baguette — long stick with diagonal ear-cuts
  baguette_side:  69, // baguette — warm crumb side
  campagne_top:   70, // campagne boule — cross-score (クープ) + heavy flour
  campagne_side:  71, // campagne — floured domed crust
  pastry_top:     72, // croissant — nested crescent lamination, glossy
  pastry_side:    73, // croissant — laminated layered bands
  sign_open:      74, // 営業中 — teal field, bold "OPEN" + lamp dot
  sign_name:      75, // shop sign — cream field, teal "PH" monogram + wheat
  sign_aframe:    76, // A-frame chalkboard — slate + chalk lines + loaf glyph
};

// Block definitions. `faces` = [top, bottom, side] tile indices.
// solid: participates in collision. opaque: culls neighbour faces.
// Mining metadata: hardness (base break time), tool (class that mines it fast),
// tier (min tool tier required to DROP anything; null = hand is enough),
// drop (item id; undefined = drops itself, null = drops nothing), dropCount.
export const BLOCKS = {
  1: { name: 'Grass', faces: [T.grass_top, T.dirt, T.grass_side], solid: true, opaque: true, hardness: 0.6, tool: 'shovel', tier: null, drop: 'dirt' },
  2: { name: 'Dirt', faces: [T.dirt, T.dirt, T.dirt], solid: true, opaque: true, hardness: 0.5, tool: 'shovel', tier: null },
  3: { name: 'Stone', faces: [T.stone, T.stone, T.stone], solid: true, opaque: true, hardness: 1.5, tool: 'pickaxe', tier: 'wood', drop: 'cobblestone' },
  4: { name: 'Sand', faces: [T.sand, T.sand, T.sand], solid: true, opaque: true, hardness: 0.5, tool: 'shovel', tier: null },
  5: { name: 'Wood', faces: [T.log_top, T.log_top, T.log_side], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  6: { name: 'Leaves', faces: [T.leaves, T.leaves, T.leaves], solid: true, opaque: false, hardness: 0.2, tool: null, tier: null, drop: null },
  7: { name: 'Water', faces: [T.water, T.water, T.water], solid: false, opaque: false, liquid: true },
  8: { name: 'Bedrock', faces: [T.bedrock, T.bedrock, T.bedrock], solid: true, opaque: true, hardness: Infinity },
  9: { name: 'Planks', faces: [T.plank, T.plank, T.plank], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  10: { name: 'Cobble', faces: [T.cobble, T.cobble, T.cobble], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  11: { name: 'Snow', faces: [T.snow, T.dirt, T.snow], solid: true, opaque: true, hardness: 0.5, tool: 'shovel', tier: null },
  12: { name: 'Glass', faces: [T.glass, T.glass, T.glass], solid: true, opaque: false, hardness: 0.3, tool: null, tier: null, drop: null },
  13: { name: 'Brick', faces: [T.brick, T.brick, T.brick], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  14: { name: 'Pumpkin', faces: [T.pumpkin_top, T.pumpkin_top, T.pumpkin_side], solid: true, opaque: true, hardness: 1.0, tool: 'axe', tier: null },
  15: { name: 'Coal Ore', faces: [T.coal_ore, T.coal_ore, T.coal_ore], solid: true, opaque: true, hardness: 3.0, tool: 'pickaxe', tier: 'wood', drop: 'coal' },
  16: { name: 'Iron Ore', faces: [T.iron_ore, T.iron_ore, T.iron_ore], solid: true, opaque: true, hardness: 3.0, tool: 'pickaxe', tier: 'stone', drop: 'raw_iron' },
  17: { name: 'Gold Ore', faces: [T.gold_ore, T.gold_ore, T.gold_ore], solid: true, opaque: true, hardness: 3.0, tool: 'pickaxe', tier: 'iron', drop: 'raw_gold' },
  18: { name: 'Diamond Ore', faces: [T.diamond_ore, T.diamond_ore, T.diamond_ore], solid: true, opaque: true, hardness: 3.0, tool: 'pickaxe', tier: 'iron', drop: 'diamond' },
  19: { name: 'Redstone Ore', faces: [T.redstone_ore, T.redstone_ore, T.redstone_ore], solid: true, opaque: true, hardness: 3.0, tool: 'pickaxe', tier: 'iron', drop: 'redstone', dropCount: 4 },
  20: { name: 'Crafting Table', faces: [T.table_top, T.plank, T.table_side], solid: true, opaque: true, hardness: 2.5, tool: 'axe', tier: null },
  21: { name: 'Furnace', faces: [T.furnace_top, T.furnace_top, T.furnace_front], solid: true, opaque: true, hardness: 3.5, tool: 'pickaxe', tier: 'wood', light: 13 },
  23: { name: 'Birch Log', faces: [T.birch_log, T.birch_log, T.birch_log], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  24: { name: 'Birch Leaves', faces: [T.birch_leaves, T.birch_leaves, T.birch_leaves], solid: true, opaque: false, hardness: 0.2, tool: null, tier: null, drop: null },
  25: { name: 'Spruce Log', faces: [T.spruce_log, T.spruce_log, T.spruce_log], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  26: { name: 'Spruce Leaves', faces: [T.spruce_leaves, T.spruce_leaves, T.spruce_leaves], solid: true, opaque: false, hardness: 0.2, tool: null, tier: null, drop: null },
  27: { name: 'Dry Grass', faces: [T.dry_grass, T.dirt, T.grass_side], solid: true, opaque: true, hardness: 0.6, tool: 'shovel', tier: null, drop: 'dirt' },
  28: { name: 'Cactus', faces: [T.cactus, T.cactus, T.cactus], solid: true, opaque: true, hardness: 0.4, tool: null, tier: null },
  29: { name: 'Stone Bricks', faces: [T.stone_bricks, T.stone_bricks, T.stone_bricks], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  30: { name: 'Mossy Cobblestone', faces: [T.mossy_cobble, T.mossy_cobble, T.mossy_cobble], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  31: { name: 'White Wool', faces: [T.wool_white, T.wool_white, T.wool_white], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  32: { name: 'Red Wool', faces: [T.wool_red, T.wool_red, T.wool_red], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  33: { name: 'Blue Wool', faces: [T.wool_blue, T.wool_blue, T.wool_blue], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  34: { name: 'Yellow Wool', faces: [T.wool_yellow, T.wool_yellow, T.wool_yellow], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  35: { name: 'Green Wool', faces: [T.wool_green, T.wool_green, T.wool_green], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  36: { name: 'Black Wool', faces: [T.wool_black, T.wool_black, T.wool_black], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  37: { name: 'Gravel', faces: [T.gravel, T.gravel, T.gravel], solid: true, opaque: true, hardness: 0.6, tool: 'shovel', tier: null },
  38: { name: 'Clay', faces: [T.clay, T.clay, T.clay], solid: true, opaque: true, hardness: 0.6, tool: 'shovel', tier: null },
  39: { name: 'Sandstone', faces: [T.sandstone, T.sandstone, T.sandstone], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  40: { name: 'Red Sandstone', faces: [T.red_sandstone, T.red_sandstone, T.red_sandstone], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  41: { name: 'Smooth Stone', faces: [T.smooth_stone, T.smooth_stone, T.smooth_stone], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  42: { name: 'Granite', faces: [T.granite, T.granite, T.granite], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  43: { name: 'Diorite', faces: [T.diorite, T.diorite, T.diorite], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  44: { name: 'Andesite', faces: [T.andesite, T.andesite, T.andesite], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  45: { name: 'Deepslate', faces: [T.deepslate, T.deepslate, T.deepslate], solid: true, opaque: true, hardness: 3.0, tool: 'pickaxe', tier: 'wood' },
  46: { name: 'Calcite', faces: [T.calcite, T.calcite, T.calcite], solid: true, opaque: true, hardness: 2.0, tool: 'pickaxe', tier: 'wood' },
  47: { name: 'Obsidian', faces: [T.obsidian, T.obsidian, T.obsidian], solid: true, opaque: true, hardness: 8.0, tool: 'pickaxe', tier: 'wood' },
  48: { name: 'Packed Ice', faces: [T.packed_ice, T.packed_ice, T.packed_ice], solid: true, opaque: true, hardness: 0.6, tool: 'pickaxe', tier: 'wood' },
  55: { name: 'Lantern', faces: [T.lantern, T.lantern, T.lantern], solid: true, opaque: true, hardness: 1.5, tool: 'pickaxe', tier: null, light: 14 },
  // 56 = BREAD — a basket/tray of fresh artisan loaves for display in the bakery.
  // top face: golden crust with score; bottom: dark pan base; sides: warm crumb.
  56: { name: 'Bread', faces: [T.bread_top, T.bread_top, T.bread_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  // 57/58/59 = bakery counter equipment (対面販売 service counter props).
  57: { name: 'Register', faces: [T.register_front, T.register_side, T.register_side], solid: true, opaque: true, hardness: 0.6, tool: null, tier: null },
  58: { name: 'Scale', faces: [T.scale_top, T.scale_side, T.scale_side], solid: true, opaque: true, hardness: 0.6, tool: null, tier: null },
  59: { name: 'Jar', faces: [T.jar_side, T.jar_side, T.jar_side], solid: true, opaque: false, hardness: 0.3, tool: null, tier: null, drop: null },
  // 60/61/62 = bakery product display blocks (distinct breads for the cases).
  60: { name: 'Baguette', faces: [T.baguette_top, T.baguette_top, T.baguette_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  61: { name: 'Campagne', faces: [T.campagne_top, T.campagne_top, T.campagne_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  62: { name: 'Pastry',   faces: [T.pastry_top,   T.pastry_top,   T.pastry_side],   solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  // 22/63/64 = shop signage blocks (storefront identity).
  65: { name: 'Open Sign', faces: [T.sign_open, T.sign_open, T.sign_open], solid: true, opaque: true, hardness: 0.4, tool: null, tier: null },
  63: { name: 'Shop Sign', faces: [T.sign_name, T.sign_name, T.sign_name], solid: true, opaque: true, hardness: 0.4, tool: null, tier: null },
  64: { name: 'A-Frame',   faces: [T.sign_aframe, T.sign_aframe, T.sign_aframe], solid: true, opaque: true, hardness: 0.4, tool: null, tier: null },
  49: { name: 'Bookshelf', faces: [T.bookshelf, T.bookshelf, T.bookshelf], solid: true, opaque: true, hardness: 1.5, tool: 'axe', tier: null },
  50: { name: 'Hay Bale', faces: [T.hay_bale, T.hay_bale, T.hay_bale], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  51: { name: 'Spruce Planks', faces: [T.spruce_planks, T.spruce_planks, T.spruce_planks], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  52: { name: 'Birch Planks', faces: [T.birch_planks, T.birch_planks, T.birch_planks], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  53: { name: 'Wheat Crop', faces: [T.wheat_crop, T.wheat_crop, T.wheat_crop], solid: false, opaque: false, hardness: 0.2, tool: null, tier: null, drop: 'wheat' },
  54: { name: 'Vegetable Crop', faces: [T.veg_crop, T.veg_crop, T.veg_crop], solid: false, opaque: false, hardness: 0.2, tool: null, tier: null, drop: 'surplus_veg' },
};

export function isOpaque(id) {
  return id !== 0 && BLOCKS[id] && BLOCKS[id].opaque;
}
export function isSolid(id) {
  return id !== 0 && BLOCKS[id] && BLOCKS[id].solid;
}
export function isLiquid(id) {
  return id !== 0 && BLOCKS[id] && BLOCKS[id].liquid;
}
// Returns the block-light emission level (0..15) for the given block id.
export function blockLightEmit(id) {
  return (id !== 0 && BLOCKS[id] && BLOCKS[id].light) ? BLOCKS[id].light : 0;
}

// --- procedural tile painting -------------------------------------------

function noisePx(ctx, base, vary) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = (Math.random() - 0.5) * vary;
      const r = clamp(base[0] + n);
      const g = clamp(base[1] + n);
      const b = clamp(base[2] + n);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// Stone tile with coloured ore speckles.
function oreTile(c, speck) {
  noisePx(c, [128, 128, 130], 22);
  for (let i = 0; i < 11; i++) {
    const x = (Math.random() * 13) | 0;
    const y = (Math.random() * 13) | 0;
    c.fillStyle = `rgb(${speck[0]},${speck[1]},${speck[2]})`;
    c.fillRect(x, y, 2, 2);
  }
}

const painters = {
  [T.grass_top]: (c) => noisePx(c, [86, 145, 58], 28),
  [T.dirt]: (c) => noisePx(c, [134, 96, 67], 26),
  [T.stone]: (c) => noisePx(c, [128, 128, 130], 22),
  [T.sand]: (c) => noisePx(c, [219, 205, 152], 18),
  [T.leaves]: (c) => {
    // Start transparent so alpha-cutout holes are real gaps, not dark smudges
    c.clearRect(0, 0, TILE, TILE);
    noisePx(c, [60, 118, 45], 34);
    // Punch genuine alpha=0 holes for foliage cutout rendering
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 22; i++) {
      const px = (Math.random() * TILE) | 0;
      const py = (Math.random() * TILE) | 0;
      c.fillStyle = 'rgba(0,0,0,1)';
      c.fillRect(px, py, 1 + ((i * 3) % 2), 1 + ((i * 5) % 2));
    }
    c.globalCompositeOperation = 'source-over';
  },
  [T.water]: (c) => {
    // Soft blue-teal base with gentle diagonal ripple lines
    noisePx(c, [54, 110, 196], 18);
    c.strokeStyle = 'rgba(100,165,230,0.55)';
    c.lineWidth = 1;
    for (let i = -TILE; i < TILE * 2; i += 4) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i + TILE, TILE); c.stroke();
    }
    // lighter highlight strips
    c.strokeStyle = 'rgba(180,220,255,0.30)';
    for (let i = -TILE; i < TILE * 2; i += 7) {
      c.beginPath(); c.moveTo(i + 2, 0); c.lineTo(i + 2 + TILE, TILE); c.stroke();
    }
  },
  [T.bedrock]: (c) => noisePx(c, [40, 40, 44], 30),
  [T.snow]: (c) => noisePx(c, [236, 240, 245], 12),
  [T.cobble]: (c) => {
    noisePx(c, [115, 115, 118], 24);
    c.strokeStyle = 'rgba(60,60,62,0.7)';
    c.strokeRect(0.5, 0.5, 7, 7);
    c.strokeRect(8.5, 4.5, 6, 6);
    c.strokeRect(2.5, 9.5, 6, 5);
  },
  [T.glass]: (c) => {
    c.clearRect(0, 0, TILE, TILE);
    c.fillStyle = 'rgba(180,220,235,0.22)';
    c.fillRect(0, 0, TILE, TILE);
    c.strokeStyle = 'rgba(220,240,250,0.9)';
    c.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
  },
  [T.brick]: (c) => {
    noisePx(c, [156, 74, 60], 12);
    c.strokeStyle = 'rgba(225,210,200,0.85)';
    for (let y = 0; y < TILE; y += 4) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
    for (let y = 0; y < TILE; y += 4) {
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = off; x < TILE; x += 8) {
        c.beginPath();
        c.moveTo(x + 0.5, y);
        c.lineTo(x + 0.5, y + 4);
        c.stroke();
      }
    }
  },
  [T.plank]: (c) => {
    noisePx(c, [167, 130, 78], 16);
    c.strokeStyle = 'rgba(110,82,46,0.8)';
    for (let y = 0; y < TILE; y += 5) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
  },
  [T.log_side]: (c) => {
    noisePx(c, [104, 78, 47], 14);
    c.strokeStyle = 'rgba(70,50,28,0.7)';
    for (let x = 1; x < TILE; x += 3) {
      c.beginPath();
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, TILE);
      c.stroke();
    }
  },
  [T.log_top]: (c) => {
    noisePx(c, [150, 116, 72], 14);
    c.strokeStyle = 'rgba(96,72,42,0.8)';
    for (let r = 6; r > 0; r -= 2) {
      c.beginPath();
      c.arc(8, 8, r, 0, Math.PI * 2);
      c.stroke();
    }
  },
  [T.grass_side]: (c) => {
    noisePx(c, [134, 96, 67], 26); // dirt base
    // green top strip
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = (Math.random() - 0.5) * 26;
        c.fillStyle = `rgb(${clamp(86 + n)},${clamp(145 + n)},${clamp(58 + n)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  },
  [T.pumpkin_side]: (c) => {
    noisePx(c, [214, 130, 30], 14);
    c.strokeStyle = 'rgba(150,88,18,0.8)';
    for (let x = 2; x < TILE; x += 4) {
      c.beginPath();
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, TILE);
      c.stroke();
    }
  },
  [T.pumpkin_top]: (c) => {
    noisePx(c, [196, 116, 26], 14);
    c.fillStyle = '#6b4a1e';
    c.fillRect(7, 6, 2, 4);
  },
  [T.coal_ore]: (c) => oreTile(c, [32, 32, 34]),
  [T.iron_ore]: (c) => oreTile(c, [198, 162, 122]),
  [T.gold_ore]: (c) => oreTile(c, [240, 205, 70]),
  [T.diamond_ore]: (c) => oreTile(c, [110, 220, 225]),
  [T.redstone_ore]: (c) => oreTile(c, [205, 40, 40]),
  [T.table_top]: (c) => {
    noisePx(c, [167, 130, 78], 14);
    c.strokeStyle = 'rgba(80,55,30,0.9)';
    c.strokeRect(0.5, 0.5, 15, 15);
    c.beginPath(); c.moveTo(8, 0); c.lineTo(8, 16); c.moveTo(0, 8); c.lineTo(16, 8); c.stroke();
  },
  [T.table_side]: (c) => {
    noisePx(c, [150, 116, 72], 14);
    c.strokeStyle = 'rgba(80,55,30,0.85)';
    c.strokeRect(1.5, 1.5, 13, 13);
    c.beginPath(); c.moveTo(4, 4); c.lineTo(12, 12); c.moveTo(12, 4); c.lineTo(4, 12); c.stroke();
  },
  [T.furnace_top]: (c) => {
    noisePx(c, [112, 112, 115], 22);
    c.fillStyle = 'rgba(60,60,62,0.85)'; c.fillRect(4, 4, 8, 8);
  },
  [T.furnace_side]: (c) => noisePx(c, [112, 112, 115], 22),
  [T.furnace_front]: (c) => {
    noisePx(c, [112, 112, 115], 22);
    c.fillStyle = '#222'; c.fillRect(3, 5, 10, 8);
    c.fillStyle = '#e08a30'; c.fillRect(5, 9, 6, 3);
  },
  [T.torch]: (c) => {
    c.clearRect(0, 0, 16, 16);
    c.fillStyle = '#6b4a1e'; c.fillRect(7, 8, 2, 8);
    c.fillStyle = '#ffd24a'; c.fillRect(6, 4, 4, 4);
    c.fillStyle = '#ff8a1e'; c.fillRect(7, 5, 2, 2);
  },
  [T.birch_log]: (c) => {
    noisePx(c, [223, 222, 214], 12);
    c.fillStyle = 'rgba(60,52,42,0.8)';
    c.fillRect(2, 3, 3, 1);
    c.fillRect(10, 6, 4, 1);
    c.fillRect(4, 11, 3, 1);
    c.fillRect(11, 13, 2, 1);
  },
  [T.birch_leaves]: (c) => {
    c.clearRect(0, 0, TILE, TILE);
    noisePx(c, [122, 170, 80], 30);
    // Genuine alpha=0 holes for cutout rendering
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 22; i++) {
      const px = (Math.random() * TILE) | 0;
      const py = (Math.random() * TILE) | 0;
      c.fillStyle = 'rgba(0,0,0,1)';
      c.fillRect(px, py, 1 + ((i * 3) % 2), 1 + ((i * 7) % 2));
    }
    c.globalCompositeOperation = 'source-over';
  },
  [T.spruce_log]: (c) => {
    noisePx(c, [78, 56, 34], 14);
    c.strokeStyle = 'rgba(50,34,20,0.7)';
    for (let x = 1; x < TILE; x += 3) {
      c.beginPath();
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, TILE);
      c.stroke();
    }
  },
  [T.spruce_leaves]: (c) => {
    c.clearRect(0, 0, TILE, TILE);
    noisePx(c, [40, 78, 46], 28);
    // Genuine alpha=0 holes for cutout rendering
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 22; i++) {
      const px = (Math.random() * TILE) | 0;
      const py = (Math.random() * TILE) | 0;
      c.fillStyle = 'rgba(0,0,0,1)';
      c.fillRect(px, py, 1 + ((i * 5) % 2), 1 + ((i * 3) % 2));
    }
    c.globalCompositeOperation = 'source-over';
  },
  [T.dry_grass]: (c) => noisePx(c, [150, 156, 78], 18),
  [T.cactus]: (c) => {
    noisePx(c, [58, 120, 54], 16);
    c.fillStyle = 'rgba(34,82,34,0.85)';
    c.fillRect(0, 0, 2, TILE);
    c.fillRect(TILE - 2, 0, 2, TILE);
  },
  [T.stone_bricks]: (c) => {
    noisePx(c, [122, 122, 125], 16);
    c.strokeStyle = 'rgba(86,86,90,0.85)';
    // horizontal mortar lines every 8px
    for (let y = 0; y < TILE; y += 8) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
    // vertical mortar lines, offset every other row for a brick bond
    for (let y = 0; y < TILE; y += 8) {
      const off = (y / 8) % 2 ? 0 : 8;
      for (let x = off; x < TILE; x += 16) {
        c.beginPath();
        c.moveTo(x + 0.5, y);
        c.lineTo(x + 0.5, y + 8);
        c.stroke();
      }
    }
  },
  [T.mossy_cobble]: (c) => {
    noisePx(c, [115, 115, 118], 24);
    c.strokeStyle = 'rgba(60,60,62,0.7)';
    c.strokeRect(0.5, 0.5, 7, 7);
    c.strokeRect(8.5, 4.5, 6, 6);
    c.strokeRect(2.5, 9.5, 6, 5);
    // green moss patches
    c.fillStyle = 'rgba(70,110,55,0.7)';
    for (let i = 0; i < 22; i++) {
      c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 2, 2);
    }
  },
  [T.wool_white]: (c) => noisePx(c, [235, 235, 235], 10),
  [T.wool_red]: (c) => noisePx(c, [170, 55, 50], 10),
  [T.wool_blue]: (c) => noisePx(c, [55, 75, 180], 10),
  [T.wool_yellow]: (c) => noisePx(c, [200, 180, 40], 10),
  [T.wool_green]: (c) => noisePx(c, [70, 140, 55], 10),
  [T.wool_black]: (c) => noisePx(c, [40, 40, 44], 10),
  [T.gravel]: (c) => {
    noisePx(c, [124, 120, 118], 34);
    c.fillStyle = 'rgba(80,76,74,0.6)';
    for (let i = 0; i < 18; i++) {
      c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 2, 2);
    }
  },
  [T.clay]: (c) => noisePx(c, [166, 172, 182], 10),
  [T.sandstone]: (c) => {
    noisePx(c, [222, 210, 160], 12);
    c.strokeStyle = 'rgba(190,176,128,0.7)';
    for (let y = 3; y < TILE; y += 4) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
  },
  [T.red_sandstone]: (c) => {
    noisePx(c, [190, 110, 55], 14);
    c.strokeStyle = 'rgba(150,82,40,0.7)';
    for (let y = 3; y < TILE; y += 4) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
  },
  [T.smooth_stone]: (c) => noisePx(c, [160, 160, 163], 8),
  [T.granite]: (c) => {
    noisePx(c, [150, 100, 85], 18);
    c.fillStyle = 'rgba(200,160,150,0.6)';
    for (let i = 0; i < 16; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 2, 2);
  },
  [T.diorite]: (c) => {
    noisePx(c, [225, 225, 228], 14);
    c.fillStyle = 'rgba(150,150,155,0.6)';
    for (let i = 0; i < 16; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 2, 2);
  },
  [T.andesite]: (c) => {
    noisePx(c, [136, 138, 140], 16);
    c.fillStyle = 'rgba(110,112,114,0.6)';
    for (let i = 0; i < 16; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 2, 2);
  },
  [T.deepslate]: (c) => noisePx(c, [70, 70, 76], 20),
  [T.calcite]: (c) => noisePx(c, [225, 226, 222], 10),
  [T.bookshelf]: (c) => {
    noisePx(c, [160, 120, 70], 14);
    // top and bottom plank rims
    c.fillStyle = 'rgba(110,82,46,0.9)';
    c.fillRect(0, 0, TILE, 2);
    c.fillRect(0, TILE - 2, TILE, 2);
    c.fillRect(0, 7, TILE, 2);
    // coloured book spines on two shelves
    const spines = ['#a83232', '#3258a8', '#3a9a3a', '#c8b428', '#7a3aa8', '#c87a28'];
    for (const yTop of [2, 9]) {
      let x = 1;
      while (x < TILE - 1) {
        const w = 2 + ((Math.random() * 2) | 0);
        c.fillStyle = spines[(Math.random() * spines.length) | 0];
        c.fillRect(x, yTop, Math.min(w, TILE - 1 - x), 5);
        x += w + 1;
      }
    }
  },
  [T.hay_bale]: (c) => {
    noisePx(c, [180, 150, 40], 16);
    c.strokeStyle = 'rgba(140,112,28,0.8)';
    for (let y = 0; y < TILE; y += 3) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
  },
  [T.obsidian]: (c) => {
    noisePx(c, [30, 24, 44], 12);
    c.fillStyle = 'rgba(110,90,150,0.4)';
    for (let i = 0; i < 6; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 1, 1);
  },
  [T.packed_ice]: (c) => {
    noisePx(c, [150, 190, 235], 12);
    c.strokeStyle = 'rgba(200,225,250,0.6)';
    c.beginPath(); c.moveTo(0, 4); c.lineTo(TILE, 8); c.stroke();
    c.beginPath(); c.moveTo(0, 11); c.lineTo(TILE, 14); c.stroke();
  },
  [T.spruce_planks]: (c) => {
    noisePx(c, [110, 82, 50], 14);
    c.strokeStyle = 'rgba(72,52,30,0.8)';
    for (let y = 0; y < TILE; y += 5) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
  },
  [T.birch_planks]: (c) => {
    noisePx(c, [200, 182, 135], 14);
    c.strokeStyle = 'rgba(160,144,100,0.8)';
    for (let y = 0; y < TILE; y += 5) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
  },
  [T.wheat_crop]: (c) => {
    // golden wheat stalks: greenish-brown soil base + vertical golden lines
    noisePx(c, [120, 96, 58], 16);
    c.strokeStyle = 'rgba(214,184,70,0.95)';
    for (let x = 2; x < TILE; x += 3) {
      c.beginPath();
      c.moveTo(x + 0.5, 2);
      c.lineTo(x + 0.5, TILE);
      c.stroke();
    }
    // grain heads near the top
    c.fillStyle = 'rgb(230,202,96)';
    for (let x = 2; x < TILE; x += 3) c.fillRect(x - 1, 1, 3, 3);
  },
  [T.lantern]: (c) => {
    // Warm amber glow: golden centre square with bright orange halo
    noisePx(c, [70, 58, 40], 14);
    c.fillStyle = '#e09020'; c.fillRect(4, 4, 8, 8);
    c.fillStyle = '#ffd060'; c.fillRect(6, 6, 4, 4);
    c.fillStyle = '#fff0a0'; c.fillRect(7, 7, 2, 2); // hot core
    // decorative cage bars
    c.strokeStyle = 'rgba(40,30,20,0.85)';
    c.strokeRect(3.5, 3.5, 9, 9);
    c.beginPath(); c.moveTo(8, 3); c.lineTo(8, 13); c.moveTo(3, 8); c.lineTo(13, 8); c.stroke();
  },
  [T.veg_crop]: (c) => {
    // leafy green base with a few coloured veg dots
    noisePx(c, [78, 140, 60], 26);
    c.fillStyle = 'rgba(40,90,35,0.5)';
    for (let i = 0; i < 12; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 1, 1);
    // veg dots: tomato red, carrot orange, eggplant purple
    const veg = ['#d23a2e', '#e08a28', '#7a3a9a', '#e0c84a'];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = veg[(Math.random() * veg.length) | 0];
      const x = (Math.random() * (TILE - 2)) | 0;
      const y = (Math.random() * (TILE - 2)) | 0;
      c.fillRect(x, y, 2, 2);
    }
  },

  // ── BREAD tiles ─────────────────────────────────────────────────────────────
  // bread_top: golden-brown crusty top face — oval loaf body with a diagonal
  // score slash (the "grigne"), a dusting of flour (pale specks), and warm noise.
  [T.bread_top]: (c) => {
    // warm golden-brown base with subtle crust variation
    noisePx(c, [194, 140, 62], 22);
    // darker crust rim around the top (simulate rounded loaf edge)
    c.fillStyle = 'rgba(110, 68, 20, 0.6)';
    c.fillRect(0, 0, TILE, 2);    // top edge crust
    c.fillRect(0, TILE - 2, TILE, 2); // bottom edge crust
    c.fillRect(0, 0, 2, TILE);    // left edge crust
    c.fillRect(TILE - 2, 0, 2, TILE); // right edge crust
    // golden highlight stripe through the centre — sun-baked crown
    c.fillStyle = 'rgba(230, 185, 70, 0.55)';
    c.fillRect(3, 5, 10, 6);
    // diagonal score/slash (the baker's cut — "grigne"):
    // runs upper-left to lower-right, 1px wide, warm cream colour
    c.strokeStyle = 'rgba(245, 220, 150, 0.92)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(4, 2);
    c.lineTo(12, 10);
    c.stroke();
    // parallel second slash (lighter)
    c.strokeStyle = 'rgba(235, 210, 135, 0.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(6, 2);
    c.lineTo(14, 10);
    c.stroke();
    // flour dusting: small pale specks scattered on crust
    c.fillStyle = 'rgba(248, 238, 215, 0.7)';
    for (let i = 0; i < 14; i++) {
      const fx = (Math.random() * (TILE - 1)) | 0;
      const fy = (Math.random() * (TILE - 1)) | 0;
      c.fillRect(fx, fy, 1, 1);
    }
  },

  // bread_side: warm crumb interior visible on the side — shows the open
  // crumb holes and a thin darker crust border along the top/bottom.
  [T.bread_side]: (c) => {
    // warm amber-orange mid-crust base
    noisePx(c, [188, 128, 52], 20);
    // top crust strip (dark, baked)
    c.fillStyle = 'rgba(100, 58, 16, 0.75)';
    c.fillRect(0, 0, TILE, 3);
    // bottom crust strip
    c.fillRect(0, TILE - 2, TILE, 2);
    // crumb interior: lighter warm tone in the centre band
    c.fillStyle = 'rgba(220, 175, 90, 0.4)';
    c.fillRect(1, 3, TILE - 2, TILE - 6);
    // open-crumb "holes" — irregular small dark ellipses
    c.fillStyle = 'rgba(138, 82, 28, 0.6)';
    const holeSeeds = [[2,5],[6,4],[11,6],[4,9],[9,10],[13,8],[3,12],[8,12],[12,11],[6,8]];
    for (const [hx, hy] of holeSeeds) {
      c.fillRect(hx, hy, 2, 1);
    }
    // highlight along bottom of top crust (golden where bread rises)
    c.fillStyle = 'rgba(228, 185, 80, 0.55)';
    c.fillRect(1, 3, TILE - 2, 2);
  },

  // register_front: cash register face — dark charcoal body, a mint LCD display
  // up top, a 3×2 key grid below, and a drawer seam with a brass knob.
  [T.register_front]: (c) => {
    noisePx(c, [70, 72, 80], 12);              // dark charcoal body
    // mint LCD display window (top third)
    c.fillStyle = 'rgba(150, 210, 180, 0.92)';
    c.fillRect(3, 2, 10, 4);
    c.strokeStyle = 'rgba(28, 30, 36, 0.9)';   // dark bezel
    c.lineWidth = 1;
    c.strokeRect(3, 2, 10, 4);
    // key grid — 3 columns × 2 rows of pale buttons
    c.fillStyle = 'rgba(202, 202, 208, 0.88)';
    for (const ky of [9, 12]) for (const kx of [3, 7, 11]) c.fillRect(kx, ky, 2, 2);
    // drawer seam near the bottom + brass knob
    c.strokeStyle = 'rgba(28, 28, 34, 0.9)';
    c.beginPath();
    c.moveTo(1, 14.5);
    c.lineTo(15, 14.5);
    c.stroke();
    c.fillStyle = 'rgba(206, 168, 86, 0.95)';  // brass pull
    c.fillRect(7, 15, 2, 1);
    // warm rim highlight on the top edge
    c.fillStyle = 'rgba(255, 255, 255, 0.10)';
    c.fillRect(0, 0, TILE, 1);
  },

  // register_side: plain charcoal body with the drawer seam + a soft highlight.
  [T.register_side]: (c) => {
    noisePx(c, [70, 72, 80], 12);
    c.strokeStyle = 'rgba(28, 28, 34, 0.9)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(1, 14.5);
    c.lineTo(15, 14.5);
    c.stroke();
    c.fillStyle = 'rgba(255, 255, 255, 0.08)'; // vertical body highlight
    c.fillRect(2, 1, 1, 13);
  },

  // scale_top: brushed-metal weighing pan seen from above with a round dial
  // ring and a red pointer needle.
  [T.scale_top]: (c) => {
    noisePx(c, [205, 208, 212], 10);           // brushed metal pan
    c.strokeStyle = 'rgba(120, 125, 130, 0.9)';// dial ring
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(8, 8, 6, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(236, 238, 241, 0.6)';  // pale pan centre
    c.beginPath();
    c.arc(8, 8, 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(200, 40, 40, 0.9)';  // red needle to upper-right
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(8, 8);
    c.lineTo(11, 5);
    c.stroke();
  },

  // scale_side: metal column with a darker base block, a round dial face up top
  // (white face + red needle), and a thin pan lip across the top.
  [T.scale_side]: (c) => {
    noisePx(c, [180, 184, 190], 12);           // metal body
    c.fillStyle = 'rgba(120, 124, 130, 0.9)';  // darker base block
    c.fillRect(2, 11, 12, 4);
    c.fillStyle = 'rgba(232, 234, 238, 0.85)'; // pan lip
    c.fillRect(1, 1, 14, 2);
    c.strokeStyle = 'rgba(110, 115, 120, 0.9)';// dial ring
    c.lineWidth = 1;
    c.beginPath();
    c.arc(8, 6, 4, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(245, 246, 248, 0.85)'; // white dial face
    c.beginPath();
    c.arc(8, 6, 3, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(200, 40, 40, 0.9)';  // red needle
    c.beginPath();
    c.moveTo(8, 6);
    c.lineTo(10, 4);
    c.stroke();
  },

  // jar_side: glossy glass canister — faint glass tint, a warm cork/metal lid
  // band, a golden flour fill in the lower half, and a bright specular streak.
  [T.jar_side]: (c) => {
    noisePx(c, [190, 215, 222], 8);            // faint glass tint
    c.fillStyle = 'rgba(220, 238, 242, 0.45)'; // glass body inset
    c.fillRect(2, 3, 12, 11);
    c.fillStyle = 'rgba(220, 180, 110, 0.5)';  // flour/sugar contents, lower half
    c.fillRect(3, 8, 10, 6);
    c.fillStyle = 'rgba(150, 120, 70, 0.92)';  // cork/metal lid band
    c.fillRect(2, 1, 12, 3);
    c.fillStyle = 'rgba(255, 255, 255, 0.5)';  // specular highlight streak
    c.fillRect(4, 4, 2, 8);
  },

  // baguette_top: a long thin stick with the classic diagonal "ear" cuts.
  [T.baguette_top]: (c) => {
    noisePx(c, [205, 150, 70], 18);               // golden crust
    c.fillStyle = 'rgba(110, 70, 24, 0.55)';      // end crust caps (it's a stick)
    c.fillRect(0, 0, TILE, 2); c.fillRect(0, TILE - 2, TILE, 2);
    c.strokeStyle = 'rgba(247, 224, 156, 0.92)';  // cream ear-cut slashes
    c.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const y = 3 + i * 3.4;
      c.beginPath(); c.moveTo(5, y); c.lineTo(11, y + 2.2); c.stroke();
    }
    c.fillStyle = 'rgba(248, 238, 215, 0.5)';     // light flour dust
    for (let i = 0; i < 8; i++) c.fillRect((Math.random() * 15) | 0, (Math.random() * 15) | 0, 1, 1);
  },
  // baguette_side: warm crumb with thin top/bottom crust strips.
  [T.baguette_side]: (c) => {
    noisePx(c, [192, 132, 56], 18);
    c.fillStyle = 'rgba(100, 58, 16, 0.7)';
    c.fillRect(0, 0, TILE, 2); c.fillRect(0, TILE - 2, TILE, 2);
    c.fillStyle = 'rgba(222, 176, 92, 0.4)';      // crumb band
    c.fillRect(1, 3, TILE - 2, TILE - 6);
    c.fillStyle = 'rgba(150, 92, 34, 0.5)';       // a few open-crumb holes
    for (const [hx, hy] of [[3, 6], [8, 5], [12, 8], [6, 10], [11, 11]]) c.fillRect(hx, hy, 2, 1);
  },
  // campagne_top: rustic round boule — bold cross score (クープ) + heavy flour.
  [T.campagne_top]: (c) => {
    noisePx(c, [198, 142, 66], 22);
    c.fillStyle = 'rgba(110, 68, 20, 0.5)';       // rounded crust rim
    c.fillRect(0, 0, TILE, 2); c.fillRect(0, TILE - 2, TILE, 2);
    c.fillRect(0, 0, 2, TILE); c.fillRect(TILE - 2, 0, 2, TILE);
    c.strokeStyle = 'rgba(245, 222, 150, 0.92)';  // cross-score
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(4, 8); c.lineTo(12, 8); c.stroke();
    c.beginPath(); c.moveTo(8, 4); c.lineTo(8, 12); c.stroke();
    c.fillStyle = 'rgba(248, 240, 220, 0.75)';    // heavy flour dusting
    for (let i = 0; i < 22; i++) c.fillRect((Math.random() * 15) | 0, (Math.random() * 15) | 0, 1, 1);
  },
  // campagne_side: domed floured crust — dark crust arc + light crown.
  [T.campagne_side]: (c) => {
    noisePx(c, [185, 128, 52], 20);
    c.fillStyle = 'rgba(96, 56, 16, 0.7)';        // dark base crust
    c.fillRect(0, TILE - 3, TILE, 3);
    c.fillStyle = 'rgba(236, 214, 168, 0.55)';    // floured crown band
    c.fillRect(1, 2, TILE - 2, 3);
    c.fillStyle = 'rgba(248, 240, 220, 0.6)';
    for (let i = 0; i < 12; i++) c.fillRect((Math.random() * 15) | 0, (Math.random() * 9) | 0, 1, 1);
  },
  // pastry_top: croissant — nested crescent lamination arcs + glossy sheen.
  [T.pastry_top]: (c) => {
    noisePx(c, [214, 168, 86], 16);               // golden buttery
    c.strokeStyle = 'rgba(240, 205, 120, 0.85)';  // lamination crescents
    c.lineWidth = 1;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(8, 14, 3 + i * 2.2, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    c.fillStyle = 'rgba(120, 74, 26, 0.5)';       // crescent tips
    c.fillRect(2, 11, 2, 2); c.fillRect(12, 11, 2, 2);
    c.fillStyle = 'rgba(255, 246, 220, 0.4)';     // glossy highlight
    c.fillRect(6, 4, 4, 2);
  },
  // pastry_side: laminated dough — alternating layer bands.
  [T.pastry_side]: (c) => {
    noisePx(c, [206, 158, 80], 14);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? 'rgba(232, 188, 100, 0.6)' : 'rgba(150, 98, 40, 0.5)';
      c.fillRect(1, 2 + i * 3, TILE - 2, 2);
    }
    c.fillStyle = 'rgba(255, 246, 220, 0.35)';
    c.fillRect(2, 2, TILE - 4, 1);
  },

  // sign_open: 営業中 — teal field, cream plate, bold "OPEN" + amber lamp dot.
  [T.sign_open]: (c) => {
    noisePx(c, [47, 120, 112], 8);              // teal field
    c.fillStyle = 'rgba(243, 234, 217, 0.96)';  // cream plate
    c.fillRect(1, 3, 14, 9);
    c.fillStyle = '#234b46';                     // dark teal text
    c.font = 'bold 6px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('OPEN', 8, 8);
    c.fillStyle = '#ffb24d';                      // amber "open" lamp
    c.beginPath(); c.arc(13, 2, 1.6, 0, Math.PI * 2); c.fill();
  },
  // sign_name: shop sign — cream field, teal "PH" monogram + gold wheat sprig.
  [T.sign_name]: (c) => {
    noisePx(c, [235, 228, 210], 8);             // cream field
    c.strokeStyle = '#2f7870'; c.lineWidth = 1.5; c.strokeRect(1, 1, 14, 14); // teal border
    c.fillStyle = '#2b6f6a';                      // teal monogram
    c.font = 'bold 8px Georgia, serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PH', 7, 8);
    c.strokeStyle = '#c79a3c'; c.lineWidth = 1;   // gold wheat sprig
    c.beginPath(); c.moveTo(13, 12); c.lineTo(12, 5); c.stroke();
    for (const wy of [6, 8, 10]) { c.beginPath(); c.moveTo(12, wy); c.lineTo(14, wy - 1); c.stroke(); }
  },
  // sign_aframe: sidewalk chalkboard — slate field, chalk lines + a loaf glyph.
  [T.sign_aframe]: (c) => {
    noisePx(c, [40, 44, 46], 10);               // slate
    c.strokeStyle = 'rgba(232, 232, 226, 0.85)'; c.lineWidth = 1;
    for (const ly of [4, 7, 10]) { c.beginPath(); c.moveTo(3, ly); c.lineTo(13, ly); c.stroke(); }
    c.fillStyle = '#d9a23e';                      // little gold loaf glyph
    c.beginPath(); c.ellipse(8, 13, 4, 2, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(120, 80, 30, 0.8)'; c.beginPath(); c.moveTo(6, 13); c.lineTo(10, 13); c.stroke();
  },
};

export function buildAtlas() {
  const cols = ATLAS_COLS;
  const rows = Math.ceil((Math.max(...Object.values(T)) + 1) / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * TILE;
  canvas.height = rows * TILE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (const idx of Object.values(T)) {
    const tx = (idx % cols) * TILE;
    const ty = Math.floor(idx / cols) * TILE;
    const tile = document.createElement('canvas');
    tile.width = TILE;
    tile.height = TILE;
    const tctx = tile.getContext('2d');
    const paint = painters[idx];
    if (paint) paint(tctx);
    else noisePx(tctx, [200, 0, 200], 0); // missing-texture magenta
    ctx.drawImage(tile, tx, ty);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;

  return { texture, cols, rows };
}

// Build a small standalone tiling water texture (separate from the atlas so
// its UV offset can be animated without moving every other tile).
// Returns a THREE.CanvasTexture set to RepeatWrapping.
export function buildWaterTexture() {
  const SIZE = 32; // 32×32 gives enough detail at NearestFilter
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const c = canvas.getContext('2d');

  // Blue-teal base
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const n = (Math.random() - 0.5) * 28;
      const r = Math.max(0, Math.min(255, Math.round(48 + n)));
      const g = Math.max(0, Math.min(255, Math.round(110 + n)));
      const b = Math.max(0, Math.min(255, Math.round(200 + n * 0.5)));
      c.fillStyle = `rgba(${r},${g},${b},0.88)`;
      c.fillRect(x, y, 1, 1);
    }
  }
  // Diagonal ripple highlights
  c.strokeStyle = 'rgba(130,190,240,0.55)';
  c.lineWidth = 1;
  for (let i = -SIZE; i < SIZE * 2; i += 5) {
    c.beginPath(); c.moveTo(i, 0); c.lineTo(i + SIZE, SIZE); c.stroke();
  }
  c.strokeStyle = 'rgba(200,235,255,0.28)';
  for (let i = -SIZE; i < SIZE * 2; i += 9) {
    c.beginPath(); c.moveTo(i + 2, 0); c.lineTo(i + 2 + SIZE, SIZE); c.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  // RepeatWrapping lets us scroll offset for animation (wrapS/wrapT = 1000 = RepeatWrapping)
  if (typeof THREE.RepeatWrapping !== 'undefined') {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  } else {
    // stub fallback: RepeatWrapping may not exist; assign numeric value directly
    tex.wrapS = 1000;
    tex.wrapT = 1000;
  }
  return tex;
}

// UV rect for a tile index, with a tiny inset to avoid bleeding.
export function tileUV(idx, cols, rows) {
  const inset = 0.0008;
  const cx = idx % cols;
  const cy = Math.floor(idx / cols);
  const u0 = cx / cols + inset;
  const u1 = (cx + 1) / cols - inset;
  // canvas y is top-down; three UV is bottom-up
  const v1 = 1 - cy / rows - inset;
  const v0 = 1 - (cy + 1) / rows + inset;
  return { u0, v0, u1, v1 };
}
