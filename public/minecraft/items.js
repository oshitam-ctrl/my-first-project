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
