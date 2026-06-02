// items.js — Unified ITEM registry for the voxel game.
// Pure data + small helpers. No DOM, no THREE. Importable in Node.
//
// Items are keyed by STRING id. Some items are placeable (map to a numeric
// block id from blocks.js); others are materials, tools, or food.

// ---------------------------------------------------------------------------
// Internal builders
// ---------------------------------------------------------------------------

function block(id, name, blockId, color, desc = '') {
  return { id, name, stack: 64, block: blockId, tool: undefined, food: undefined, color, desc };
}

function material(id, name, color, desc = '') {
  return { id, name, stack: 64, block: undefined, tool: undefined, food: undefined, color, desc };
}

function food(id, name, hunger, color, desc = '') {
  return { id, name, stack: 64, block: undefined, tool: undefined, food: { hunger }, color, desc };
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

const CLASS_DESC = {
  pickaxe: '石や鉱石を掘る道具。',
  axe: '木を素早く伐採する道具。',
  shovel: '土や砂を掘る道具。',
  sword: '敵を攻撃する武器。',
};

function tool(id, name, klass, tier, color) {
  const damage = klass === 'sword' ? TIER_SWORD_DAMAGE[tier] : TIER_TOOL_DAMAGE[tier];
  const desc = `${TIER_JP[tier]}製の${CLASS_JP[klass]}。${CLASS_DESC[klass]}`;
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
    desc,
  };
}

// ---------------------------------------------------------------------------
// Registry assembly
// ---------------------------------------------------------------------------

const _defs = [
  // --- Block items (placeable) ---
  block('grass', '草ブロック', 1, 0x7cbd56, '緑の草が生えた土ブロック。'),
  block('dirt', '土', 2, 0x866043, '普通の土。農地にも使える。'),
  block('stone', '石', 3, 0x808080, '地下に多い基本的な石。'),
  block('sand', '砂', 4, 0xe0d8a0, '砂漠や海辺で見られる砂。'),
  block('oak_log', 'オークの原木', 5, 0x8b6d3f, 'オークの木から採れる原木。'),
  block('oak_leaves', 'オークの葉', 6, 0x4a8a32, 'オークの木の葉。'),
  block('oak_planks', 'オークの木材', 9, 0xb9905a, '原木から作った木の板。建築の基本材。'),
  block('cobblestone', '丸石', 10, 0x6e6e6e, '石を掘ると手に入る丸石。'),
  block('snow', '雪', 11, 0xf0f5ff, '雪が積もったブロック。'),
  block('glass', 'ガラス', 12, 0xbfe5ee, '砂を焼いて作る透明なブロック。'),
  block('brick', 'レンガ', 13, 0x9c5a44, '焼いた粘土で作る丈夫なブロック。'),
  block('pumpkin', 'カボチャ', 14, 0xd9821a, 'ハロウィン気分のオレンジなブロック。'),
  block('coal_ore', '石炭鉱石', 15, 0x4a4a4a, '石炭が含まれた鉱石。燃料になる。'),
  block('iron_ore', '鉄鉱石', 16, 0xc4a181, '鉄が含まれた鉱石。道具の材料。'),
  block('gold_ore', '金鉱石', 17, 0xd6b34a, '金が含まれた鉱石。'),
  block('diamond_ore', 'ダイヤモンド鉱石', 18, 0x6fd8cf, '希少なダイヤモンドが含まれた鉱石。'),
  block('redstone_ore', 'レッドストーン鉱石', 19, 0xa83232, 'レッドストーンが含まれた鉱石。'),
  block('crafting_table', '作業台', 20, 0x9a6b3f, 'アイテムをクラフトするための台。'),
  block('furnace', 'かまど', 21, 0x707070, '燃料を使って素材を製錬する。'),
  block('torch', 'たいまつ', 22, 0xffcc55, '周囲を明るく照らす光源。'),
  block('birch_log', 'シラカバの原木', 23, 0xdfded6, 'シラカバの白い原木。'),
  block('birch_leaves', 'シラカバの葉', 24, 0x7aaa50, 'シラカバの木の葉。'),
  block('spruce_log', 'トウヒの原木', 25, 0x4e3822, 'トウヒの暗い原木。'),
  block('spruce_leaves', 'トウヒの葉', 26, 0x284e2e, 'トウヒの暗緑色の葉。'),
  block('dry_grass', '枯れ草ブロック', 27, 0x969c4e, '乾いた草が生えたブロック。'),
  block('cactus', 'サボテン', 28, 0x3a7836, '砂漠に生えるトゲのある植物。'),
  block('stone_bricks', '石レンガ', 29, 0x7a7a7d, '整形された石のブロック。建築向き。'),
  block('mossy_cobble', '苔むした丸石', 30, 0x466e37, '苔が生えた丸石。'),
  block('white_wool', '白い羊毛', 31, 0xebebeb, '羊から刈り取った白い羊毛。'),
  block('red_wool', '赤い羊毛', 32, 0xaa3732, '染めた赤い羊毛ブロック。'),
  block('blue_wool', '青い羊毛', 33, 0x374bb4, '染めた青い羊毛ブロック。'),
  block('yellow_wool', '黄色い羊毛', 34, 0xc8b428, '染めた黄色い羊毛ブロック。'),
  block('green_wool', '緑の羊毛', 35, 0x468c37, '染めた緑の羊毛ブロック。'),
  block('black_wool', '黒い羊毛', 36, 0x28282c, '染めた黒い羊毛ブロック。'),
  block('gravel', '砂利', 37, 0x7c7876, '重力で落ちる砂利ブロック。'),
  block('clay', '粘土ブロック', 38, 0xa6acb6, '川底で採れる粘土のブロック。'),
  block('sandstone', '砂岩', 39, 0xded2a0, '砂が固まった岩ブロック。'),
  block('red_sandstone', '赤い砂岩', 40, 0xbe6e37, '赤い砂が固まった岩ブロック。'),
  block('smooth_stone', '滑らかな石', 41, 0xa0a0a3, '表面を磨いた滑らかな石。'),
  block('granite', '花崗岩', 42, 0x966455, '地下で産出する火成岩。'),
  block('diorite', '閃緑岩', 43, 0xe1e1e4, '白っぽい地下の岩石。'),
  block('andesite', '安山岩', 44, 0x888a8c, '灰色の地下の岩石。'),
  block('deepslate', '深層岩', 45, 0x46464c, '深い地下に存在する暗い岩。'),
  block('calcite', '方解石', 46, 0xe1e2de, '白い方解石のブロック。'),
  block('obsidian', '黒曜石', 47, 0x1e182c, '非常に硬い黒いブロック。ダイヤが必要。'),
  block('packed_ice', '氷塊', 48, 0x96beeb, '圧縮された氷のブロック。'),
  block('bookshelf', '本棚', 49, 0xa07846, '本がぎっしり並んだ棚。'),
  block('hay_bale', '干草の俵', 50, 0xb49628, '干し草を束ねた俵。'),
  block('spruce_planks', 'トウヒの板材', 51, 0x6e5232, 'トウヒの原木から作った暗い板材。'),
  block('birch_planks', 'シラカバの板材', 52, 0xc8b687, 'シラカバの原木から作った明るい板材。'),
  block('wheat_crop', '麦畑', 53, 0xd6b846, '育てると小麦が収穫できる。'),
  block('veg_crop', '野菜の苗', 54, 0x4e8c3c, '育てると野菜が収穫できる。'),
  // Bakery display block — artisan loaf, golden-brown crust. Décor only (it is the
  // bread you see in the display case and on shelves, not food consumed by right-click).
  block('bread_block', 'パン', 56, 0xd28840, '焼きたてのパン。お店の主役。ショーケースや棚に並べて。'),

  // --- Materials ---
  material('stick', '棒', 0x9c7a4d, '木から作る棒。道具のクラフトに使う。'),
  material('coal', '石炭', 0x2b2b2b, 'かまどやたいまつの燃料になる炭。'),
  material('raw_iron', '鉄の原石', 0xd0a98a, '鉱石から採れた未加工の鉄。製錬が必要。'),
  material('iron_ingot', '鉄インゴット', 0xd8d8d8, '製錬した鉄。道具や武器の材料。'),
  material('raw_gold', '金の原石', 0xe0c070, '鉱石から採れた未加工の金。製錬が必要。'),
  material('gold_ingot', '金インゴット', 0xf4d54a, '製錬した金。'),
  material('diamond', 'ダイヤモンド', 0x4ee8e0, '最強の道具が作れる貴重な宝石。'),
  material('redstone', 'レッドストーンダスト', 0xd11414, '回路や仕掛けに使う赤い粉末。'),
  material('flint', '火打石', 0x4d4d52, '砂利から採れるとがった石。'),
  material('wheat', '小麦', 0xd9c25a, '農地で育てた小麦。パンの材料になる。'),

  // --- Food ---
  food('apple', 'リンゴ', 4, 0xd83232, '木から落ちる赤いリンゴ。そのまま食べられる。'),
  food('bread', 'パン', 5, 0xc89a4a, '小麦から作る基本的なパン。'),

  // --- Meat / food ---
  food('raw_chicken', '生の鶏肉', 2, 0xe7b3a0, '生の鶏肉。焼いた方がお腹が満たされる。'),
  food('cooked_chicken', '焼き鳥', 6, 0xb5793f, 'かまどで焼いた鶏肉。香ばしい焼き鳥。'),
  food('raw_porkchop', '生の豚肉', 3, 0xe89a9a, '生の豚肉。焼いて食べよう。'),
  food('cooked_porkchop', '焼き豚肉', 8, 0xc06a3a, 'かまどで焼いた豚肉。ジューシー。'),
  food('raw_beef', '生の牛肉', 3, 0xc05a5a, '生の牛肉。焼くと美味しいステーキになる。'),
  food('steak', 'ステーキ', 8, 0x7a3d2a, 'かまどで焼いた牛肉。満腹度が高い。'),
  food('raw_mutton', '生の羊肉', 2, 0xd98a8a, '生の羊肉。焼いた方が美味しい。'),
  food('cooked_mutton', '焼き羊肉', 6, 0xb0603a, 'かまどで焼いた羊肉。'),

  // --- Bakery / ingredients ---
  material('leather', '革', 0x9a6b3f, '動物から採れる革。防具などに使う。'),
  material('empty_jar', '空き瓶', 0xbfe0e6, '発酵液を育てるための空き瓶。'),
  food('surplus_veg', '規格外野菜', 1, 0x86b94f, '形は規格外でも味は一級品。瓶で発酵液に。'),
  material('levain', '発酵液', 0xd9c98a, '規格外野菜から育てた天然酵母。パン作りの素。'),
  material('flour', '小麦粉', 0xeee6d0, '小麦を挽いた粉。パン生地の材料。'),

  // --- Petit Hermès signature ingredients ---
  material('rosemary', 'ローズマリー', 0x5f8a5a, '香り豊かなハーブ。ハードパンの風味付けに。'),
  food('thinned_apple', '摘果りんご', 2, 0x8fbf4a, '間引いた小さなりんご。パンの風味アップに使う。'),
  food('ripe_fruit', '完熟フルーツ', 3, 0xd8732a, '完熟した甘いフルーツ。パンにも食べてもおいしい。'),

  // --- Petit Hermès signature breads (天然酵母ハードパン) ---
  food('campagne', '天然酵母カンパーニュ', 9, 0xc79a5b, '自家製酵母で焼いた看板のハードパン。'),
  food('baguette', 'バゲット', 7, 0xddb877, '外はパリパリ中はもちもちのフランスパン。'),
  food('pain_de_mie', '食パン', 8, 0xeaddc0, 'ふわふわしっとりの食パン。トーストしても美味。'),
  food('rosemary_bread', 'ローズマリーのハードパン', 9, 0xb89150, 'ローズマリーの香りが広がるハードパン。'),
  food('apple_bread', '摘果りんごパン', 9, 0xd2a85e, '摘果りんごの甘みが生きた酵母パン。'),
  food('fruit_bread', '完熟フルーツパン', 9, 0xcf8f4a, '完熟フルーツの甘みが広がる天然酵母パン。'),
  food('toast', 'トースト', 6, 0xc88a44, 'こんがり焼いたトースト。サクサク食感。'),

  // --- 食品ロス救済 × 天然酵母 — 新アイテム ---
  // 天然酵母: 規格外フルーツから培養した種菌。発酵液(levain)をさらに育てたもの。
  // 中間素材なので material() (food値なし)。
  material('natural_yeast', '天然酵母', 0xe8d06a, '発酵液をさらに育てた種菌。ハードパンに使う。'),

  // フルーツカンパーニュ: 旗艦カンパーニュ＋完熟/摘果フルーツで風味アップ。
  food('fruit_campagne', 'フルーツカンパーニュ', 11, 0xd4904a, '旗艦カンパーニュにフルーツの風味を加えた逸品。'),

  // ライ麦ハードパン: 小麦粉＋levain＋ライ麦風味の丈夫なパン。
  food('rye_hard_bread', 'ライ麦ハードパン', 10, 0x9a7040, 'ライ麦と天然酵母の力強いハードパン。'),

  // 規格外フォカッチャ: 規格外野菜＋小麦粉＋levainで"もったいない→おいしい"。
  food('rescued_focaccia', '規格外フォカッチャ', 10, 0xc8a850, '規格外野菜ともったいない精神が生んだ絶品フォカッチャ。'),

  // ロスパン袋: おまかせ袋。開けるとランダムなパンが出てくる。
  material('rescue_bag', 'ロスパン袋', 0x8b6a3e, 'パンの詰め合わせ。工房で開けるとランダムに1つ。'),
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
