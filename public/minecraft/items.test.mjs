import assert from 'node:assert';
import {
  ITEMS,
  itemDef,
  isBlockItem,
  isTool,
  isFood,
  blockToItem,
} from './items.js';

const ids = Object.keys(ITEMS);
let toolCount = 0;
let blockCount = 0;
let foodCount = 0;

for (const id of ids) {
  const def = ITEMS[id];

  // Basic shape
  assert.strictEqual(def.id, id, `id field matches key for ${id}`);
  assert.strictEqual(typeof def.name, 'string', `${id} has name`);
  assert.strictEqual(typeof def.stack, 'number', `${id} has stack`);
  assert.strictEqual(typeof def.color, 'number', `${id} has color`);

  if (def.tool) {
    toolCount++;
    const t = def.tool;
    assert.ok(['pickaxe', 'axe', 'shovel', 'sword'].includes(t.class), `${id} tool class`);
    assert.ok(['wood', 'stone', 'iron', 'diamond'].includes(t.tier), `${id} tool tier`);
    assert.strictEqual(typeof t.durability, 'number', `${id} durability`);
    assert.strictEqual(typeof t.speed, 'number', `${id} speed`);
    assert.strictEqual(typeof t.damage, 'number', `${id} damage`);
    assert.strictEqual(def.stack, 1, `${id} tool stack is 1`);
    assert.strictEqual(def.block, undefined, `${id} tool has no block`);
  }

  if (typeof def.block === 'number') {
    blockCount++;
    assert.strictEqual(def.stack, 64, `${id} block item stack 64`);
    // round-trip
    assert.ok(isBlockItem(id), `${id} reports as block item`);
    assert.strictEqual(blockToItem(def.block), id, `${id} round-trips via blockToItem`);
  }

  if (def.food) {
    foodCount++;
    assert.strictEqual(typeof def.food.hunger, 'number', `${id} food hunger`);
    assert.ok(isFood(id), `${id} reports as food`);
  }
}

// Helper correctness
assert.strictEqual(itemDef('does_not_exist'), undefined, 'unknown id -> undefined');
assert.strictEqual(blockToItem(9999), null, 'unknown block id -> null');
assert.strictEqual(isBlockItem('stick'), false, 'stick is not a block item');
assert.strictEqual(isTool('diamond_sword'), true, 'diamond_sword is a tool');
assert.strictEqual(isFood('apple'), true, 'apple is food');

// Counts
assert.strictEqual(toolCount, 16, 'exactly 16 tools (16 base)');
assert.strictEqual(blockCount, 53, 'exactly 53 block items (52 original + bread_block)');
assert.strictEqual(foodCount, 23, 'exactly 23 food items');

// Petit Hermès signature items
assert.strictEqual(ITEMS.campagne.food.hunger, 9, 'campagne hunger 9');
assert.strictEqual(ITEMS.toast.food.hunger, 6, 'toast hunger 6');
assert.strictEqual(isFood('baguette'), true, 'baguette is food');
assert.strictEqual(isFood('rosemary'), false, 'rosemary is not food (ingredient)');
assert.strictEqual(ITEMS.rosemary.color, 0x5f8a5a, 'rosemary color');

// 食品ロス救済ライン — 新アイテム
assert.strictEqual(isFood('fruit_campagne'), true, 'fruit_campagne is food');
assert.strictEqual(ITEMS.fruit_campagne.food.hunger, 11, 'fruit_campagne hunger 11');
assert.strictEqual(isFood('rye_hard_bread'), true, 'rye_hard_bread is food');
assert.strictEqual(ITEMS.rye_hard_bread.food.hunger, 10, 'rye_hard_bread hunger 10');
assert.strictEqual(isFood('rescued_focaccia'), true, 'rescued_focaccia is food');
assert.strictEqual(ITEMS.rescued_focaccia.food.hunger, 10, 'rescued_focaccia hunger 10');
assert.strictEqual(isFood('natural_yeast'), false, 'natural_yeast is not food (intermediate material)');
assert.strictEqual(ITEMS.natural_yeast.color, 0xe8d06a, 'natural_yeast color');
assert.strictEqual(isFood('rescue_bag'), false, 'rescue_bag is not food (container item)');
assert.strictEqual(ITEMS.rescue_bag.color, 0x8b6a3e, 'rescue_bag color');

// Spot-check stats
assert.strictEqual(ITEMS.diamond_sword.tool.damage, 7, 'diamond sword damage 7');
assert.strictEqual(ITEMS.wood_pickaxe.tool.durability, 59, 'wood pickaxe durability 59');
assert.strictEqual(ITEMS.iron_shovel.tool.speed, 6, 'iron shovel speed 6');

// --- desc field assertions ---
// All items must have a desc field (string, may be empty)
for (const id of ids) {
  const def = ITEMS[id];
  assert.strictEqual(typeof def.desc, 'string', `${id} has desc field`);
}

// Bakery / food-loss items must have non-empty desc
const mustHaveDesc = [
  'levain', 'natural_yeast', 'surplus_veg', 'campagne', 'rescue_bag',
  'flour', 'baguette', 'pain_de_mie', 'rosemary', 'thinned_apple', 'ripe_fruit',
  'fruit_campagne', 'rye_hard_bread', 'rescued_focaccia', 'rosemary_bread',
  'apple_bread', 'fruit_bread', 'toast',
];
for (const id of mustHaveDesc) {
  assert.ok(ITEMS[id] && ITEMS[id].desc.length > 0, `${id} desc is non-empty`);
}

// Key standard food and materials
assert.ok(ITEMS.apple.desc.length > 0, 'apple has desc');
assert.ok(ITEMS.bread.desc.length > 0, 'bread has desc');
assert.ok(ITEMS.iron_ingot.desc.length > 0, 'iron_ingot has desc');
assert.ok(ITEMS.diamond.desc.length > 0, 'diamond has desc');
assert.ok(ITEMS.wheat.desc.length > 0, 'wheat has desc');

// Tools must have non-empty desc (auto-generated)
assert.ok(ITEMS.wood_pickaxe.desc.length > 0, 'wood_pickaxe has desc');
assert.ok(ITEMS.diamond_sword.desc.length > 0, 'diamond_sword has desc');
assert.ok(ITEMS.iron_axe.desc.length > 0, 'iron_axe has desc');
assert.ok(ITEMS.stone_shovel.desc.length > 0, 'stone_shovel has desc');

// Specific desc content checks
assert.ok(ITEMS.levain.desc.includes('酵母'), 'levain desc mentions 酵母');
assert.ok(ITEMS.natural_yeast.desc.includes('種菌'), 'natural_yeast desc mentions 種菌');
assert.ok(ITEMS.surplus_veg.desc.includes('規格外'), 'surplus_veg desc mentions 規格外');
assert.ok(ITEMS.campagne.desc.includes('酵母'), 'campagne desc mentions 酵母');
assert.ok(ITEMS.rescue_bag.desc.includes('ランダム'), 'rescue_bag desc mentions ランダム');
assert.ok(ITEMS.flour.desc.includes('粉'), 'flour desc mentions 粉');

// New bread_block item
assert.ok(ITEMS.bread_block, 'bread_block item exists');
assert.strictEqual(ITEMS.bread_block.block, 56, 'bread_block maps to block id 56');
assert.ok(isBlockItem('bread_block'), 'bread_block is a block item');
assert.strictEqual(blockToItem(56), 'bread_block', 'blockToItem(56) round-trips to bread_block');
assert.ok(ITEMS.bread_block.name.length > 0, 'bread_block has a name');
assert.ok(ITEMS.bread_block.desc.length > 0, 'bread_block has a desc');
assert.ok(ITEMS.bread_block.desc.includes('パン'), 'bread_block desc mentions パン');
// bread_block is décor, not food
assert.strictEqual(ITEMS.bread_block.food, undefined, 'bread_block has no food property');

console.log(`OK: ${ids.length} items (${blockCount} blocks, ${toolCount} tools, ${foodCount} food)`);
console.log('OK: desc field assertions passed');
console.log('OK: bread_block assertions passed');
