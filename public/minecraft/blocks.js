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
  21: { name: 'Furnace', faces: [T.furnace_top, T.furnace_top, T.furnace_front], solid: true, opaque: true, hardness: 3.5, tool: 'pickaxe', tier: 'wood' },
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
  49: { name: 'Bookshelf', faces: [T.bookshelf, T.bookshelf, T.bookshelf], solid: true, opaque: true, hardness: 1.5, tool: 'axe', tier: null },
  50: { name: 'Hay Bale', faces: [T.hay_bale, T.hay_bale, T.hay_bale], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  51: { name: 'Spruce Planks', faces: [T.spruce_planks, T.spruce_planks, T.spruce_planks], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  52: { name: 'Birch Planks', faces: [T.birch_planks, T.birch_planks, T.birch_planks], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
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
    noisePx(c, [60, 118, 45], 34);
    // punch a few transparent-ish darker holes for foliage feel
    c.fillStyle = 'rgba(30,70,25,0.6)';
    for (let i = 0; i < 14; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 1, 1);
  },
  [T.water]: (c) => noisePx(c, [54, 110, 196], 14),
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
    noisePx(c, [122, 170, 80], 30);
    c.fillStyle = 'rgba(90,135,55,0.6)';
    for (let i = 0; i < 14; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 1, 1);
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
    noisePx(c, [40, 78, 46], 28);
    c.fillStyle = 'rgba(24,52,30,0.6)';
    for (let i = 0; i < 14; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 1, 1);
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
