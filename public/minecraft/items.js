// items.js — Unified ITEM registry for the voxel game.
// Pure data + small helpers. No DOM, no THREE. Importable in Node.
//
// Items are keyed by STRING id. Some items are placeable (map to a numeric
// block id from blocks.js); others are materials, tools, or food.

// ---------------------------------------------------------------------------
// Internal builders
// ---------------------------------------------------------------------------

function block(id, name, blockId, color) {
  return { id, name, stack: 64, block: blockId, tool: undefined, food: undefined, color };
}

function material(id, name, color) {
  return { id, name, stack: 64, block: undefined, tool: undefined, food: undefined, color };
}

function food(id, name, hunger, color) {
  return { id, name, stack: 64, block: undefined, tool: undefined, food: { hunger }, color };
}

const TIER_DURABILITY = { wood: 59, stone: 131, iron: 250, diamond: 1561 };
const TIER_SPEED = { wood: 2, stone: 4, iron: 6, diamond: 8 };
// Non-sword melee damage rising by tier (2..5).
const TIER_TOOL_DAMAGE = { wood: 2, stone: 3, iron: 4, diamond: 5 };
// Sword damage by tier.
const TIER_SWORD_DAMAGE = { wood: 4, stone: 5, iron: 6, diamond: 7 };

const TIER_JP = { wood: '木', stone: '石', iron: '鉄', diamond: 'ダイヤモンド' };
const CLASS_JP = { pickaxe: 'ツルハシ', axe: 'オノ', shovel: 'シャベル', sword: 'ケン' };
const TIER_COLOR = { wood: 0x9c7a4d, stone: 0x9a9a9a, iron: 0xd8d8d8, diamond: 0x4ee8e0 };

function tool(id, name, klass, tier, color) {
  const damage = klass === 'sword' ? TIER_SWORD_DAMAGE[tier] : TIER_TOOL_DAMAGE[tier];
  return {
    id,
    name,
    stack: 1,
    block: undefined,
    tool: {
      class: klass,
      tier,
      durability: TIER_DURABILITY[tier],
      speed: TIER_SPEED[tier],
      damage,
    },
    food: undefined,
    color,
  };
}

// A legendary sword with custom tool stats (still a real tool: isTool() true).
function legendarySword(id, name, tier, durability, speed, damage, color) {
  return {
    id,
    name,
    stack: 1,
    block: undefined,
    tool: { class: 'sword', tier, durability, speed, damage },
    food: undefined,
    color,
  };
}

// Armor piece. Custom `armor` (defense points) + `slot` ('head'|'chest').
// Not a tool, not a block, not food.
function armor(id, name, armorPoints, slot, color) {
  return {
    id,
    name,
    stack: 1,
    block: undefined,
    tool: undefined,
    food: undefined,
    armor: armorPoints,
    slot,
    color,
  };
}

// Shield. Custom `shield:true` flag.
function shield(id, name, color) {
  return {
    id,
    name,
    stack: 1,
    block: undefined,
    tool: undefined,
    food: undefined,
    shield: true,
    color,
  };
}

// Magic item (wand/staff). Custom `magic` string id.
function magic(id, name, magicId, color) {
  return {
    id,
    name,
    stack: 1,
    block: undefined,
    tool: undefined,
    food: undefined,
    magic: magicId,
    color,
  };
}

// ---------------------------------------------------------------------------
// Registry assembly
// ---------------------------------------------------------------------------

const _defs = [
  // --- Block items (placeable) ---
  block('grass', '草ブロック', 1, 0x7cbd56),
  block('dirt', '土', 2, 0x866043),
  block('stone', '石', 3, 0x808080),
  block('sand', '砂', 4, 0xe0d8a0),
  block('oak_log', 'オークの原木', 5, 0x8b6d3f),
  block('oak_leaves', 'オークの葉', 6, 0x4a8a32),
  block('oak_planks', 'オークの木材', 9, 0xb9905a),
  block('cobblestone', '丸石', 10, 0x6e6e6e),
  block('snow', '雪', 11, 0xf0f5ff),
  block('glass', 'ガラス', 12, 0xbfe5ee),
  block('brick', 'レンガ', 13, 0x9c5a44),
  block('pumpkin', 'カボチャ', 14, 0xd9821a),
  block('coal_ore', '石炭鉱石', 15, 0x4a4a4a),
  block('iron_ore', '鉄鉱石', 16, 0xc4a181),
  block('gold_ore', '金鉱石', 17, 0xd6b34a),
  block('diamond_ore', 'ダイヤモンド鉱石', 18, 0x6fd8cf),
  block('redstone_ore', 'レッドストーン鉱石', 19, 0xa83232),
  block('crafting_table', '作業台', 20, 0x9a6b3f),
  block('furnace', 'かまど', 21, 0x707070),
  block('torch', 'たいまつ', 22, 0xffcc55),
  block('birch_log', 'シラカバの原木', 23, 0xdfded6),
  block('birch_leaves', 'シラカバの葉', 24, 0x7aaa50),
  block('spruce_log', 'トウヒの原木', 25, 0x4e3822),
  block('spruce_leaves', 'トウヒの葉', 26, 0x284e2e),
  block('dry_grass', '枯れ草ブロック', 27, 0x969c4e),
  block('cactus', 'サボテン', 28, 0x3a7836),
  block('stone_bricks', '石レンガ', 29, 0x7a7a7d),
  block('mossy_cobble', '苔むした丸石', 30, 0x466e37),
  block('white_wool', '白い羊毛', 31, 0xebebeb),
  block('red_wool', '赤い羊毛', 32, 0xaa3732),
  block('blue_wool', '青い羊毛', 33, 0x374bb4),
  block('yellow_wool', '黄色い羊毛', 34, 0xc8b428),
  block('green_wool', '緑の羊毛', 35, 0x468c37),
  block('black_wool', '黒い羊毛', 36, 0x28282c),
  block('gravel', '砂利', 37, 0x7c7876),
  block('clay', '粘土ブロック', 38, 0xa6acb6),
  block('sandstone', '砂岩', 39, 0xded2a0),
  block('red_sandstone', '赤い砂岩', 40, 0xbe6e37),
  block('smooth_stone', '滑らかな石', 41, 0xa0a0a3),
  block('granite', '花崗岩', 42, 0x966455),
  block('diorite', '閃緑岩', 43, 0xe1e1e4),
  block('andesite', '安山岩', 44, 0x888a8c),
  block('deepslate', '深層岩', 45, 0x46464c),
  block('calcite', '方解石', 46, 0xe1e2de),
  block('obsidian', '黒曜石', 47, 0x1e182c),
  block('packed_ice', '氷塊', 48, 0x96beeb),
  block('bookshelf', '本棚', 49, 0xa07846),
  block('hay_bale', '干草の俵', 50, 0xb49628),
  block('spruce_planks', 'トウヒの板材', 51, 0x6e5232),
  block('birch_planks', 'シラカバの板材', 52, 0xc8b687),

  // --- Materials ---
  material('stick', '棒', 0x9c7a4d),
  material('coal', '石炭', 0x2b2b2b),
  material('raw_iron', '鉄の原石', 0xd0a98a),
  material('iron_ingot', '鉄インゴット', 0xd8d8d8),
  material('raw_gold', '金の原石', 0xe0c070),
  material('gold_ingot', '金インゴット', 0xf4d54a),
  material('diamond', 'ダイヤモンド', 0x4ee8e0),
  material('redstone', 'レッドストーンダスト', 0xd11414),
  material('flint', '火打石', 0x4d4d52),
  material('wheat', '小麦', 0xd9c25a),

  // --- Food ---
  food('apple', 'リンゴ', 4, 0xd83232),
  food('bread', 'パン', 5, 0xc89a4a),

  // --- Legendary swords (custom tool stats) ---
  legendarySword('dragonbone_sword', '竜骨の剣', 'diamond', 2000, 8, 12, 0xb9e4e8),
  legendarySword('inferno_blade', '業火の剣', 'diamond', 1800, 8, 11, 0xff6a2a),
  legendarySword('frost_edge', '氷雪の剣', 'diamond', 1800, 8, 10, 0x8fd4ff),

  // --- Armor ---
  armor('dragon_helm', '竜の兜', 3, 'head', 0x6f7bd6),
  armor('dragon_chestplate', '竜の鎧', 8, 'chest', 0x6f7bd6),
  armor('mythril_helm', 'ミスリルの兜', 2, 'head', 0x9fe6c9),
  armor('mythril_chestplate', 'ミスリルの鎧', 6, 'chest', 0x9fe6c9),

  // --- Shield ---
  shield('aegis_shield', '聖盾アイギス', 0xd9c66a),

  // --- Magic ---
  magic('fire_wand', '業火の杖', 'fire', 0xff7a1a),
  magic('frost_wand', '氷結の杖', 'frost', 0x7ad0ff),
  magic('heal_staff', '癒しの杖', 'heal', 0x8aff9a),
  magic('bolt_wand', '雷光の杖', 'bolt', 0xffe65a),
];

// Tools: classes × tiers
for (const tier of ['wood', 'stone', 'iron', 'diamond']) {
  for (const klass of ['pickaxe', 'axe', 'shovel', 'sword']) {
    const id = `${tier}_${klass}`;
    const name = `${TIER_JP[tier]}の${CLASS_JP[klass]}`;
    _defs.push(tool(id, name, klass, tier, TIER_COLOR[tier]));
  }
}

export const ITEMS = {};
for (const def of _defs) {
  ITEMS[def.id] = def;
}

// Reverse map: numeric block id -> string item id
const _blockToItem = {};
for (const def of _defs) {
  if (typeof def.block === 'number') {
    _blockToItem[def.block] = def.id;
  }
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function itemDef(id) {
  return ITEMS[id];
}

export function isBlockItem(id) {
  const def = ITEMS[id];
  return !!def && typeof def.block === 'number';
}

export function isTool(id) {
  const def = ITEMS[id];
  return !!def && !!def.tool;
}

export function isFood(id) {
  const def = ITEMS[id];
  return !!def && !!def.food;
}

export function blockToItem(blockId) {
  const id = _blockToItem[blockId];
  return id === undefined ? null : id;
}
