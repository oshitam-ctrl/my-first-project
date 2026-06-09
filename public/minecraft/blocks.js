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
  sign_open:      74, // 営業中 — brand deep-green field, bold "OPEN" + lamp dot
  sign_name:      75, // shop sign — stamp-motif logo (perforated edge + PH emblem)
  sign_aframe:    76, // A-frame chalkboard — slate + chalk lines + loaf glyph
  // ── S1 schoolhouse / brand foundation tiles ───────────────────────────────
  cubby_front:    77, // 下駄箱 — 3×3 open shoe cells in a wood frame
  greenboard:     78, // 緑黒板 — deep green board + chalk tray + chalk lines
  school_floor:   79, // 教室の明るい木床
  plaster:        80, // 白壁 (暖白 #F5EDE4)
  sash_window:    81, // 窓枠付きガラス — white cross sash on glass
  gym_floor:      82, // 体育館床 + オレンジコートライン
  clock_face:     83, // 校舎時計 — white dial + hands
  emblem:         84, // 校章 — navy field + gold 5-petal rosette
  notice:         85, // 掲示板 — cork + pinned paper
  sink_top:       86, // 手洗い場 — stainless top, 2 basins + faucets
  sink_side:      87, // 手洗い場 — tiled front + steel apron
  vault_top:      88, // 跳び箱 — leather pad top with stitch border
  vault_side:     89, // 跳び箱 — stacked wooden tiers
  sakura:         90, // 桜の葉 (cutout, pink)
  cedar_log:      91, // 杉の幹 (top = T.log_top)
  cedar_leaves:   92, // 杉葉 (cutout, dark blue-green)
  vend_front:     93, // 自販機 — lit product window + dispense slot
  vend_side:      94, // 自販機 — blue body side
  rice:           95, // 稲 — thin green stalks over paddy mud
  tin_roof:       96, // トタン屋根 — vertical corrugation + rust streaks
  kawara:         97, // 瓦 — overlapping blue-grey arc rows
  mie_top:        98, // 食パン — soft crumb top + golden crust rim
  mie_side:       99, // 食パン — pale crumb side + crust bands
  tartine_top:   100, // タルティーヌ — slice + red/green toppings (side = bread_side)
  soup_top:      101, // スープ鍋 — pot rim + orange soup + veg dots
  pot_side:      102, // 鍋 — charcoal body + steel rim (shared soup/curry)
  curry_top:     103, // カレー鍋 — pot rim + brown curry swirl
  quiche_top:    104, // キッシュ — golden disk + crimped edge + cut lines
  cookie_top:    105, // 焼き菓子 — tray of cookies/biscotti
  slat:          106, // 木スラット陳列棚 — 3 boards + shadow grooves
  basket_top:    107, // かご — weave + bread ovals + flour
  basket_side:   108, // かご — woven side
  price_card:    109, // 値札カード — cream card + ¥ + text lines
  coffee:        110, // コーヒー器具 — dripper + carafe + steam
  menu_stand:    111, // メニュースタンド — dark frame + cream menu
  stainless:     112, // 給食室調理台 — brushed steel
  desk_top:      113, // 学校机 — light wood + frame line
  desk_side:     114, // 学校机 — apron + 2 legs
  chair:         115, // 学校椅子 — seat + backrest slats + legs
  flag:          116, // 国旗 — white field + red sun disc
  guardrail:     117, // ガードレール — 2 white corrugated beams
  brand_green:   118, // ブランド深緑 #5C6B4A ウール織
  wheat_beige:   119, // 麦色 #E8D5B7
  compost_top:   120, // ぐるぐるコンポスト — wood frame + soil + scraps + swirl
  compost_side:  121, // コンポスト — wood slats over dark soil
  yeast_jars:    122, // 酵母瓶棚 — colourful bubbling jars on a shelf
  isshou:        123, // 一升パン — furoshiki wrap: wheat cloth + knot + checker
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

  // ── S1: 旧南方小学校 schoolhouse blocks ────────────────────────────────────
  66: { name: 'Shoe Cubby', faces: [T.plank, T.plank, T.cubby_front], solid: true, opaque: true, hardness: 0.5, tool: 'axe', tier: null },
  67: { name: 'Green Board', faces: [T.greenboard, T.greenboard, T.greenboard], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  68: { name: 'School Floor', faces: [T.school_floor, T.school_floor, T.school_floor], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  69: { name: 'Plaster', faces: [T.plaster, T.plaster, T.plaster], solid: true, opaque: true, hardness: 1.5, tool: 'pickaxe', tier: null },
  70: { name: 'Sash Window', faces: [T.sash_window, T.sash_window, T.sash_window], solid: true, opaque: false, hardness: 0.3, tool: null, tier: null, drop: null },
  71: { name: 'Gym Floor', faces: [T.gym_floor, T.gym_floor, T.gym_floor], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  72: { name: 'School Clock', faces: [T.clock_face, T.clock_face, T.clock_face], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  73: { name: 'School Emblem', faces: [T.emblem, T.emblem, T.emblem], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  74: { name: 'Notice Board', faces: [T.notice, T.notice, T.notice], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  75: { name: 'Sink Unit', faces: [T.sink_top, T.sink_side, T.sink_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  76: { name: 'Vault Box', faces: [T.vault_top, T.vault_side, T.vault_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  77: { name: 'Sakura Leaves', faces: [T.sakura, T.sakura, T.sakura], solid: true, opaque: false, hardness: 0.2, tool: null, tier: null, drop: null },
  78: { name: 'Cedar Log', faces: [T.log_top, T.log_top, T.cedar_log], solid: true, opaque: true, hardness: 2.0, tool: 'axe', tier: null },
  79: { name: 'Cedar Leaves', faces: [T.cedar_leaves, T.cedar_leaves, T.cedar_leaves], solid: true, opaque: false, hardness: 0.2, tool: null, tier: null, drop: null },
  80: { name: 'Vending Machine', faces: [T.vend_side, T.vend_side, T.vend_front], solid: true, opaque: true, hardness: 0.6, tool: null, tier: null, light: 8 },
  81: { name: 'Rice', faces: [T.rice, T.rice, T.rice], solid: false, opaque: false, hardness: 0.2, tool: null, tier: null, drop: null },
  82: { name: 'Tin Roof', faces: [T.tin_roof, T.tin_roof, T.tin_roof], solid: true, opaque: true, hardness: 1.0, tool: 'pickaxe', tier: null },
  83: { name: 'Kawara', faces: [T.kawara, T.kawara, T.kawara], solid: true, opaque: true, hardness: 1.5, tool: 'pickaxe', tier: null },
  // South in North / bakery product + fixture blocks (Bread(56)-style props)
  84: { name: 'Pain de Mie', faces: [T.mie_top, T.mie_top, T.mie_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  85: { name: 'Tartine', faces: [T.tartine_top, T.tartine_top, T.bread_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  86: { name: 'Soup Pot', faces: [T.soup_top, T.pot_side, T.pot_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  87: { name: 'Curry Pot', faces: [T.curry_top, T.pot_side, T.pot_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  88: { name: 'Quiche', faces: [T.quiche_top, T.quiche_top, T.pastry_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  89: { name: 'Cookie Tray', faces: [T.cookie_top, T.bread_side, T.bread_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  90: { name: 'Slat Shelf', faces: [T.slat, T.slat, T.slat], solid: true, opaque: true, hardness: 0.5, tool: 'axe', tier: null },
  91: { name: 'Bread Basket', faces: [T.basket_top, T.basket_side, T.basket_side], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  92: { name: 'Price Card', faces: [T.price_card, T.price_card, T.price_card], solid: true, opaque: true, hardness: 0.4, tool: null, tier: null },
  93: { name: 'Coffee Kit', faces: [T.coffee, T.coffee, T.coffee], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  94: { name: 'Menu Stand', faces: [T.menu_stand, T.menu_stand, T.menu_stand], solid: true, opaque: true, hardness: 0.4, tool: null, tier: null },
  95: { name: 'Stainless', faces: [T.stainless, T.stainless, T.stainless], solid: true, opaque: true, hardness: 1.5, tool: 'pickaxe', tier: null },
  96: { name: 'School Desk', faces: [T.desk_top, T.desk_side, T.desk_side], solid: true, opaque: true, hardness: 0.5, tool: 'axe', tier: null },
  97: { name: 'School Chair', faces: [T.chair, T.chair, T.chair], solid: true, opaque: true, hardness: 0.5, tool: 'axe', tier: null },
  98: { name: 'Flag', faces: [T.flag, T.flag, T.flag], solid: true, opaque: true, hardness: 0.4, tool: null, tier: null },
  99: { name: 'Guard Rail', faces: [T.guardrail, T.guardrail, T.guardrail], solid: true, opaque: false, hardness: 0.8, tool: 'pickaxe', tier: null },
  100: { name: 'Brand Green', faces: [T.brand_green, T.brand_green, T.brand_green], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  101: { name: 'Wheat Beige', faces: [T.wheat_beige, T.wheat_beige, T.wheat_beige], solid: true, opaque: true, hardness: 0.8, tool: null, tier: null },
  102: { name: 'Compost', faces: [T.compost_top, T.compost_side, T.compost_side], solid: true, opaque: true, hardness: 0.5, tool: 'shovel', tier: null },
  103: { name: 'Yeast Shelf', faces: [T.yeast_jars, T.yeast_jars, T.yeast_jars], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
  104: { name: 'Isshou Pan', faces: [T.isshou, T.isshou, T.isshou], solid: true, opaque: true, hardness: 0.5, tool: null, tier: null },
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

  // sign_open: 営業中 — brand deep-green field #5C6B4A, beige plate,
  // bold "OPEN" + amber lamp dot. (ティール廃止 → ブランド深緑)
  [T.sign_open]: (c) => {
    noisePx(c, [92, 107, 74], 8);               // brand deep-green field #5C6B4A
    c.fillStyle = 'rgba(245, 237, 228, 0.96)';  // warm beige plate #F5EDE4
    c.fillRect(1, 3, 14, 9);
    c.fillStyle = '#3a4a2f';                     // dark forest-green text
    c.font = 'bold 6px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('OPEN', 8, 8);
    c.fillStyle = '#ffb24d';                      // amber "open" lamp
    c.beginPath(); c.arc(13, 2, 1.6, 0, Math.PI * 2); c.fill();
  },
  // sign_name: 切手モチーフロゴ — warm beige #F5EDE4 stamp field, perforated
  // stamp-edge dots all around, deep-green #5C6B4A round emblem + "PH".
  [T.sign_name]: (c) => {
    noisePx(c, [245, 237, 228], 6);             // beige stamp field #F5EDE4
    // darker margin ring so the punched perforations read at 16px
    c.fillStyle = 'rgba(160, 148, 124, 0.55)';
    c.fillRect(0, 0, TILE, 1); c.fillRect(0, TILE - 1, TILE, 1);
    c.fillRect(0, 0, 1, TILE); c.fillRect(TILE - 1, 0, 1, TILE);
    // perforated edge: bright punched dots along the border
    c.fillStyle = '#ffffff';
    for (let i = 1; i < TILE - 1; i += 3) {
      c.fillRect(i, 0, 1, 1); c.fillRect(i, TILE - 1, 1, 1);
      c.fillRect(0, i, 1, 1); c.fillRect(TILE - 1, i, 1, 1);
    }
    // thin inner frame line in brand green
    c.strokeStyle = '#5c6b4a'; c.lineWidth = 1;
    c.strokeRect(2.5, 2.5, 11, 11);
    // deep-green round emblem + cream "PH" monogram
    c.fillStyle = '#5c6b4a';
    c.beginPath(); c.arc(8, 8, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f5ede4';
    c.font = 'bold 5px Georgia, serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PH', 8, 8.5);
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

  // ── S1 schoolhouse tiles ─────────────────────────────────────────────────
  // cubby_front: 下駄箱 — wood frame, 3×3 dark open cells, white shoes inside.
  [T.cubby_front]: (c) => {
    noisePx(c, [150, 116, 72], 12);              // wood frame
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      const x = 1 + col * 5, y = 1 + row * 5;
      c.fillStyle = 'rgba(38, 26, 14, 0.95)';    // open cell shadow
      c.fillRect(x, y, 4, 4);
      if ((row * 3 + col) % 4 !== 3) {           // most cells hold a shoe pair
        c.fillStyle = 'rgba(238, 238, 232, 0.95)';
        c.fillRect(x + 1, y + 2, 2, 1);
      }
    }
  },
  // greenboard: 緑黒板 — deep green field, chalk writing, wood chalk tray.
  [T.greenboard]: (c) => {
    noisePx(c, [24, 78, 58], 10);                // deep green board
    c.strokeStyle = 'rgba(238, 238, 228, 0.75)'; // chalk lines
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(2, 4); c.lineTo(11, 4); c.stroke();
    c.beginPath(); c.moveTo(3, 7); c.lineTo(13, 7); c.stroke();
    c.beginPath(); c.moveTo(2, 10); c.lineTo(9, 10); c.stroke();
    c.fillStyle = 'rgb(150, 116, 72)';           // wooden chalk tray
    c.fillRect(0, 13, TILE, 3);
    c.fillStyle = '#f0f0ea'; c.fillRect(3, 13, 3, 1);  // white chalk stick
    c.fillStyle = '#e8c050'; c.fillRect(9, 13, 3, 1);  // yellow chalk stick
  },
  // school_floor: 明るい教室木床 — warm bright planks, thin seams.
  [T.school_floor]: (c) => {
    noisePx(c, [198, 168, 118], 14);
    c.strokeStyle = 'rgba(146, 116, 72, 0.8)';
    for (let y = 0; y < TILE; y += 4) {
      c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(TILE, y + 0.5); c.stroke();
    }
    c.strokeStyle = 'rgba(146, 116, 72, 0.55)';  // staggered butt joints
    for (const [jx, jy] of [[5, 0], [11, 4], [3, 8], [9, 12]]) {
      c.beginPath(); c.moveTo(jx + 0.5, jy); c.lineTo(jx + 0.5, jy + 4); c.stroke();
    }
  },
  // plaster: 白壁 — warm white #F5EDE4 with the faintest trowel texture.
  [T.plaster]: (c) => {
    noisePx(c, [240, 236, 226], 7);
    c.strokeStyle = 'rgba(214, 206, 190, 0.4)';
    c.beginPath(); c.moveTo(0, 5.5); c.lineTo(TILE, 5.5); c.stroke();
    c.beginPath(); c.moveTo(0, 11.5); c.lineTo(TILE, 11.5); c.stroke();
  },
  // sash_window: 窓枠付きガラス — glass tint + bold white cross sash frame.
  [T.sash_window]: (c) => {
    c.clearRect(0, 0, TILE, TILE);
    c.fillStyle = 'rgba(185, 220, 235, 0.30)';   // glass
    c.fillRect(0, 0, TILE, TILE);
    c.fillStyle = 'rgba(246, 244, 236, 0.95)';   // white sash frame + muntins
    c.fillRect(0, 0, TILE, 2); c.fillRect(0, TILE - 2, TILE, 2);
    c.fillRect(0, 0, 2, TILE); c.fillRect(TILE - 2, 0, 2, TILE);
    c.fillRect(7, 0, 2, TILE); c.fillRect(0, 7, TILE, 2);
    c.fillStyle = 'rgba(255, 255, 255, 0.45)';   // glass glint
    c.fillRect(3, 3, 2, 3);
  },
  // gym_floor: 体育館床 — birch-toned boards + bold orange court line.
  [T.gym_floor]: (c) => {
    noisePx(c, [208, 178, 122], 12);
    c.strokeStyle = 'rgba(162, 132, 86, 0.7)';
    for (let y = 0; y < TILE; y += 4) {
      c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(TILE, y + 0.5); c.stroke();
    }
    c.fillStyle = 'rgba(216, 110, 30, 0.95)';    // court line
    c.fillRect(0, 6, TILE, 2);
  },
  // clock_face: 校舎時計 — dark wood surround, white dial, black hands.
  [T.clock_face]: (c) => {
    noisePx(c, [88, 70, 48], 10);                // wood surround
    c.fillStyle = '#f2f0e8';                      // white dial
    c.beginPath(); c.arc(8, 8, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3a3a3a'; c.lineWidth = 1;
    c.beginPath(); c.arc(8, 8, 6, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#3a3a3a';                      // 12/3/6/9 tick marks
    c.fillRect(7, 3, 2, 1); c.fillRect(7, 12, 2, 1);
    c.fillRect(3, 7, 1, 2); c.fillRect(12, 7, 1, 2);
    c.strokeStyle = '#1e1e1e';                    // hands (11:30 — opening!)
    c.beginPath(); c.moveTo(8, 8); c.lineTo(8, 4); c.stroke();   // minute
    c.beginPath(); c.moveTo(8, 8); c.lineTo(5, 6); c.stroke();   // hour
    c.fillRect(7, 7, 2, 2);                       // hub
  },
  // emblem: 校章 — navy field, gold ring, gold 5-petal rosette.
  [T.emblem]: (c) => {
    noisePx(c, [40, 50, 92], 8);                 // navy field
    c.strokeStyle = '#d8b44a'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(8, 8, 6.2, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#e8c860';                      // five gold petals
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      c.beginPath(); c.arc(8 + Math.cos(a) * 3, 8 + Math.sin(a) * 3, 2, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#b08828';                      // rosette centre
    c.beginPath(); c.arc(8, 8, 1.6, 0, Math.PI * 2); c.fill();
  },
  // notice: 掲示板 — cork field, wood frame, pinned white papers.
  [T.notice]: (c) => {
    noisePx(c, [188, 148, 96], 18);              // cork
    c.strokeStyle = 'rgba(110, 78, 42, 0.9)'; c.lineWidth = 1;
    c.strokeRect(0.5, 0.5, 15, 15);              // wood frame
    c.fillStyle = 'rgba(248, 246, 238, 0.95)';   // papers
    c.fillRect(2, 3, 5, 6); c.fillRect(9, 2, 5, 7); c.fillRect(5, 10, 6, 4);
    c.strokeStyle = 'rgba(150, 150, 150, 0.7)';  // text scribble lines
    c.beginPath(); c.moveTo(3, 5); c.lineTo(6, 5); c.stroke();
    c.beginPath(); c.moveTo(10, 4); c.lineTo(13, 4); c.stroke();
    c.beginPath(); c.moveTo(10, 6); c.lineTo(13, 6); c.stroke();
    c.beginPath(); c.moveTo(6, 12); c.lineTo(10, 12); c.stroke();
    c.fillStyle = '#c83030';                     // red pins
    c.fillRect(4, 3, 1, 1); c.fillRect(11, 2, 1, 1); c.fillRect(7, 10, 1, 1);
  },
  // sink_top: 手洗い場上面 — stainless, two dark basins, faucet stubs.
  [T.sink_top]: (c) => {
    noisePx(c, [198, 202, 206], 8);              // stainless
    c.fillStyle = 'rgba(238, 240, 242, 0.8)';    // bright front rim
    c.fillRect(0, TILE - 1, TILE, 1);
    c.fillStyle = '#2a2e32';                      // basins
    c.beginPath(); c.arc(4.5, 9, 2.6, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(11.5, 9, 2.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgb(150, 154, 160)';          // faucets
    c.fillRect(3, 2, 3, 2); c.fillRect(10, 2, 3, 2);
    c.fillRect(4, 4, 1, 2); c.fillRect(11, 4, 1, 2);
  },
  // sink_side: 手洗い場側面 — steel apron over white tiles + grout grid.
  [T.sink_side]: (c) => {
    noisePx(c, [218, 218, 212], 8);              // white tile
    c.fillStyle = 'rgb(172, 176, 182)';          // stainless apron
    c.fillRect(0, 0, TILE, 4);
    c.fillStyle = 'rgba(238, 240, 242, 0.7)';
    c.fillRect(0, 0, TILE, 1);
    c.strokeStyle = 'rgba(170, 170, 164, 0.8)';  // grout lines
    for (let y = 7; y < TILE; y += 4) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(TILE, y + 0.5); c.stroke(); }
    for (let x = 3; x < TILE; x += 5) { c.beginPath(); c.moveTo(x + 0.5, 4); c.lineTo(x + 0.5, TILE); c.stroke(); }
  },
  // vault_top: 跳び箱上面 — tan leather pad with a stitched border.
  [T.vault_top]: (c) => {
    noisePx(c, [196, 158, 104], 12);             // leather
    c.strokeStyle = 'rgba(120, 88, 48, 0.9)'; c.lineWidth = 1;
    c.strokeRect(1.5, 1.5, 13, 13);              // stitch border
    c.fillStyle = 'rgba(120, 88, 48, 0.7)';      // stitch dashes
    for (let i = 3; i < 13; i += 3) { c.fillRect(i, 1, 1, 1); c.fillRect(i, 14, 1, 1); c.fillRect(1, i, 1, 1); c.fillRect(14, i, 1, 1); }
    c.fillStyle = 'rgba(232, 206, 160, 0.5)';    // worn centre highlight
    c.fillRect(5, 5, 6, 6);
  },
  // vault_side: 跳び箱側面 — alternating stacked wooden tiers.
  [T.vault_side]: (c) => {
    noisePx(c, [186, 150, 100], 12);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 ? 'rgba(150, 112, 64, 0.55)' : 'rgba(214, 180, 128, 0.45)';
      c.fillRect(0, i * 4, TILE, 4);
      c.fillStyle = 'rgba(80, 56, 28, 0.85)';    // tier seam
      c.fillRect(0, i * 4, TILE, 1);
    }
    c.fillStyle = '#f0ece0';                      // tier-number patch
    c.fillRect(6, 6, 4, 3);
    c.fillStyle = '#5a4020'; c.fillRect(7, 7, 2, 1);
  },
  // sakura: 桜の葉 — pink blossom foliage with alpha-cutout holes.
  [T.sakura]: (c) => {
    c.clearRect(0, 0, TILE, TILE);
    noisePx(c, [235, 170, 195], 26);
    c.fillStyle = 'rgba(250, 215, 228, 0.85)';   // bright petal highlights
    for (let i = 0; i < 8; i++) c.fillRect((Math.random() * 14) | 0, (Math.random() * 14) | 0, 2, 2);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 22; i++) {
      const px = (Math.random() * TILE) | 0;
      const py = (Math.random() * TILE) | 0;
      c.fillStyle = 'rgba(0,0,0,1)';
      c.fillRect(px, py, 1 + ((i * 3) % 2), 1 + ((i * 5) % 2));
    }
    c.globalCompositeOperation = 'source-over';
  },
  // cedar_log: 杉の幹 — reddish-brown bark with vertical striations.
  [T.cedar_log]: (c) => {
    noisePx(c, [112, 74, 48], 14);
    c.strokeStyle = 'rgba(66, 42, 24, 0.75)';
    for (let x = 1; x < TILE; x += 3) {
      c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, TILE); c.stroke();
    }
    c.strokeStyle = 'rgba(160, 112, 72, 0.5)';   // peeling-bark highlights
    c.beginPath(); c.moveTo(5.5, 2); c.lineTo(5.5, 9); c.stroke();
    c.beginPath(); c.moveTo(11.5, 6); c.lineTo(11.5, 14); c.stroke();
  },
  // cedar_leaves: 杉葉 — dark blue-green dense foliage, alpha-cutout.
  [T.cedar_leaves]: (c) => {
    c.clearRect(0, 0, TILE, TILE);
    noisePx(c, [38, 72, 58], 24);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 18; i++) {
      const px = (Math.random() * TILE) | 0;
      const py = (Math.random() * TILE) | 0;
      c.fillStyle = 'rgba(0,0,0,1)';
      c.fillRect(px, py, 1 + ((i * 5) % 2), 1 + ((i * 3) % 2));
    }
    c.globalCompositeOperation = 'source-over';
  },
  // vend_front: 自販機 — blue body, lit product window with 6 cans, slot.
  [T.vend_front]: (c) => {
    noisePx(c, [38, 88, 168], 10);               // blue cabinet
    c.fillStyle = '#e8f0f4';                      // lit product window
    c.fillRect(2, 2, 12, 8);
    const cans = ['#d23a2e', '#e8a020', '#3a9a4a', '#e8d040', '#9a3aa0', '#28b0c8'];
    for (let i = 0; i < 6; i++) {                 // two rows of three cans
      c.fillStyle = cans[i];
      c.fillRect(3 + (i % 3) * 4, 3 + ((i / 3) | 0) * 4, 2, 3);
    }
    c.fillStyle = '#15233a';                      // dispense slot
    c.fillRect(3, 12, 6, 3);
    c.fillStyle = '#c8d0d8';                      // coin panel
    c.fillRect(11, 11, 2, 4);
    c.fillStyle = '#303840'; c.fillRect(11, 12, 2, 1);
  },
  // vend_side: 自販機側面 — plain blue body with edge shading.
  [T.vend_side]: (c) => {
    noisePx(c, [38, 88, 168], 10);
    c.fillStyle = 'rgba(16, 40, 90, 0.6)';
    c.fillRect(0, 0, 1, TILE); c.fillRect(TILE - 1, 0, 1, TILE);
    c.fillRect(0, TILE - 2, TILE, 2);
    c.fillStyle = 'rgba(255, 255, 255, 0.18)';   // body highlight
    c.fillRect(2, 1, 2, 13);
  },
  // rice: 稲 — green stalk strokes with grain tips over paddy mud.
  [T.rice]: (c) => {
    noisePx(c, [96, 102, 76], 16);               // paddy mud/water base
    c.strokeStyle = 'rgba(120, 178, 70, 0.95)';  // green stalks
    for (let x = 2; x < TILE; x += 3) {
      c.beginPath(); c.moveTo(x + 0.5, 3); c.lineTo(x + 0.5, TILE); c.stroke();
    }
    c.fillStyle = 'rgb(196, 200, 110)';          // drooping grain heads
    for (let x = 2; x < TILE; x += 3) c.fillRect(x - 1, 1, 3, 2);
  },
  // tin_roof: トタン屋根 — vertical corrugation + rust streaks.
  [T.tin_roof]: (c) => {
    noisePx(c, [150, 158, 162], 10);
    for (let x = 0; x < TILE; x += 4) {
      c.fillStyle = 'rgba(230, 234, 238, 0.55)'; // ridge highlight
      c.fillRect(x, 0, 1, TILE);
      c.fillStyle = 'rgba(86, 92, 98, 0.7)';     // valley shadow
      c.fillRect(x + 2, 0, 1, TILE);
    }
    c.fillStyle = 'rgba(160, 92, 40, 0.6)';      // rust streaks
    c.fillRect(6, 5, 1, 9); c.fillRect(13, 2, 1, 7); c.fillRect(2, 9, 1, 6);
  },
  // kawara: 瓦 — overlapping blue-grey roof-tile arc rows.
  [T.kawara]: (c) => {
    noisePx(c, [92, 106, 122], 12);
    c.strokeStyle = 'rgba(38, 50, 66, 0.9)'; c.lineWidth = 1;
    for (let row = 0; row < 4; row++) {
      const y = 4 + row * 4;
      const off = row % 2 ? 4 : 0;
      for (let x = -4 + off; x <= TILE; x += 8) {
        c.beginPath(); c.arc(x + 4, y, 4, Math.PI, Math.PI * 2); c.stroke();
      }
    }
    c.fillStyle = 'rgba(176, 192, 208, 0.4)';    // glaze glints
    for (let i = 0; i < 8; i++) c.fillRect((Math.random() * 15) | 0, (Math.random() * 15) | 0, 1, 1);
  },
  // mie_top: 食パン — soft white crumb square with a golden crust rim.
  [T.mie_top]: (c) => {
    noisePx(c, [240, 228, 200], 10);             // soft crumb
    c.fillStyle = 'rgba(200, 148, 66, 0.92)';    // golden crust rim
    c.fillRect(0, 0, TILE, 2); c.fillRect(0, TILE - 2, TILE, 2);
    c.fillRect(0, 0, 2, TILE); c.fillRect(TILE - 2, 0, 2, TILE);
    c.fillStyle = 'rgba(214, 188, 140, 0.5)';    // faint crumb pores
    for (const [hx, hy] of [[4, 5], [9, 4], [12, 7], [5, 10], [10, 11], [7, 7]]) c.fillRect(hx, hy, 1, 1);
  },
  // mie_side: 食パン側面 — pale crumb with crust bands top and bottom.
  [T.mie_side]: (c) => {
    noisePx(c, [238, 226, 196], 10);
    c.fillStyle = 'rgba(190, 134, 54, 0.9)';     // baked top crust
    c.fillRect(0, 0, TILE, 3);
    c.fillRect(0, TILE - 2, TILE, 2);            // base crust
    c.fillStyle = 'rgba(250, 242, 222, 0.6)';    // airy crumb band
    c.fillRect(1, 4, TILE - 2, 3);
    c.fillStyle = 'rgba(208, 182, 134, 0.5)';    // crumb pores
    for (const [hx, hy] of [[3, 6], [8, 5], [12, 8], [5, 10], [10, 12], [13, 11]]) c.fillRect(hx, hy, 2, 1);
  },
  // tartine_top: タルティーヌ — open-face slice with red/green/cream toppings.
  [T.tartine_top]: (c) => {
    noisePx(c, [150, 110, 64], 12);              // wooden serving board
    c.fillStyle = '#e8d5a8';                      // bread slice
    c.beginPath(); c.ellipse(8, 8, 6.2, 4.6, 0.3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(160, 106, 44, 0.9)'; c.lineWidth = 1;
    c.beginPath(); c.ellipse(8, 8, 6.2, 4.6, 0.3, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#d23a4a';                      // strawberry / tomato bits
    c.fillRect(5, 6, 2, 2); c.fillRect(10, 9, 2, 2);
    c.fillStyle = '#4a8a3a';                      // rocket / herb leaves
    c.fillRect(8, 5, 2, 1); c.fillRect(6, 10, 2, 1);
    c.fillStyle = '#f7f2e2';                      // cream cheese dabs
    c.fillRect(9, 7, 2, 1); c.fillRect(5, 8, 1, 1);
  },
  // soup_top: スープ鍋 — dark pot rim, orange soup, floating veg.
  [T.soup_top]: (c) => {
    noisePx(c, [58, 60, 66], 10);                // pot body
    c.strokeStyle = 'rgba(170, 176, 184, 0.9)'; c.lineWidth = 1;
    c.beginPath(); c.arc(8, 8, 6.8, 0, Math.PI * 2); c.stroke(); // steel rim
    c.fillStyle = '#e08830';                      // soup surface
    c.beginPath(); c.arc(8, 8, 5.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d24a2e'; c.fillRect(5, 6, 2, 2);   // tomato
    c.fillStyle = '#e8c040'; c.fillRect(9, 9, 2, 2);   // corn/potato
    c.fillStyle = '#4a8a3a'; c.fillRect(9, 5, 2, 1);   // greens
    c.strokeStyle = 'rgba(248, 200, 130, 0.7)';        // steam swirl
    c.beginPath(); c.arc(7, 8, 2.5, 0.6, 2.8); c.stroke();
  },
  // pot_side: 鍋側面 — charcoal body, steel rim band, rivet handles.
  [T.pot_side]: (c) => {
    noisePx(c, [58, 60, 66], 10);
    c.fillStyle = 'rgb(176, 182, 190)';          // steel rim band
    c.fillRect(0, 0, TILE, 2);
    c.fillStyle = 'rgba(255, 255, 255, 0.12)';   // body sheen
    c.fillRect(3, 3, 2, 11);
    c.fillStyle = 'rgb(140, 146, 154)';          // handle rivets
    c.fillRect(1, 5, 2, 3); c.fillRect(13, 5, 2, 3);
  },
  // curry_top: カレー鍋 — pot rim, rich brown curry with a swirl + veg.
  [T.curry_top]: (c) => {
    noisePx(c, [58, 60, 66], 10);                // pot body
    c.strokeStyle = 'rgba(170, 176, 184, 0.9)'; c.lineWidth = 1;
    c.beginPath(); c.arc(8, 8, 6.8, 0, Math.PI * 2); c.stroke(); // steel rim
    c.fillStyle = '#9a5a24';                      // curry surface
    c.beginPath(); c.arc(8, 8, 5.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(120, 64, 20, 0.9)';     // simmering swirl
    c.beginPath(); c.arc(8, 8, 3, 0.4, 4.6); c.stroke();
    c.fillStyle = '#e8a020'; c.fillRect(6, 6, 2, 2);   // carrot
    c.fillStyle = '#e8d8b0'; c.fillRect(9, 9, 2, 2);   // potato
    c.fillStyle = '#4a8a3a'; c.fillRect(10, 6, 2, 1);  // herbs
  },
  // quiche_top: キッシュ — golden disk, crimped edge, cut lines, filling.
  [T.quiche_top]: (c) => {
    noisePx(c, [120, 90, 60], 10);               // board
    c.fillStyle = '#e0a84a';                      // golden custard
    c.beginPath(); c.arc(8, 8, 6.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(150, 96, 32, 0.95)'; c.lineWidth = 1;
    c.beginPath(); c.arc(8, 8, 6.5, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(150, 96, 32, 0.85)';     // crimped pastry edge
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      c.fillRect((8 + Math.cos(a) * 6) | 0, (8 + Math.sin(a) * 6) | 0, 1, 1);
    }
    c.strokeStyle = 'rgba(140, 90, 30, 0.8)';    // cut lines
    c.beginPath(); c.moveTo(8, 2); c.lineTo(8, 14); c.stroke();
    c.beginPath(); c.moveTo(2, 8); c.lineTo(14, 8); c.stroke();
    c.fillStyle = '#4a8a3a'; c.fillRect(5, 5, 2, 1);   // spinach
    c.fillStyle = '#c84040'; c.fillRect(10, 10, 1, 1); // bacon/tomato
  },
  // cookie_top: 焼き菓子 — dark tray with cookies and biscotti.
  [T.cookie_top]: (c) => {
    noisePx(c, [92, 70, 48], 10);                // tray
    c.strokeStyle = 'rgba(54, 38, 22, 0.9)';
    c.strokeRect(0.5, 0.5, 15, 15);
    c.fillStyle = '#caa050';                      // round cookies
    c.beginPath(); c.arc(4.5, 4.5, 2.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(11, 5, 2.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(5, 11, 2.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a3418';                      // choco chips
    c.fillRect(4, 4, 1, 1); c.fillRect(11, 4, 1, 1); c.fillRect(5, 11, 1, 1);
    c.fillStyle = '#d8b878';                      // biscotti stick
    c.fillRect(9, 9, 5, 3);
    c.fillStyle = 'rgba(120, 80, 40, 0.8)';
    c.fillRect(10, 10, 1, 1); c.fillRect(12, 10, 1, 1);
  },
  // slat: 木スラット陳列棚 — three boards with deep shadow grooves.
  [T.slat]: (c) => {
    noisePx(c, [174, 136, 88], 12);
    c.fillStyle = 'rgba(48, 32, 16, 0.9)';       // shadow grooves
    c.fillRect(0, 4, TILE, 2); c.fillRect(0, 10, TILE, 2);
    c.strokeStyle = 'rgba(120, 90, 54, 0.6)';    // wood grain
    for (const gy of [2, 8, 14]) { c.beginPath(); c.moveTo(1, gy + 0.5); c.lineTo(15, gy + 0.5); c.stroke(); }
    c.fillStyle = 'rgba(228, 196, 148, 0.5)';    // top-edge light
    c.fillRect(0, 0, TILE, 1); c.fillRect(0, 6, TILE, 1); c.fillRect(0, 12, TILE, 1);
  },
  // basket_top: かご — woven crosshatch + three bread ovals + flour dust.
  [T.basket_top]: (c) => {
    noisePx(c, [160, 118, 62], 14);              // wicker base
    c.strokeStyle = 'rgba(106, 72, 32, 0.7)';    // weave crosshatch
    for (let i = -TILE; i < TILE * 2; i += 4) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i + TILE, TILE); c.stroke();
      c.beginPath(); c.moveTo(i + TILE, 0); c.lineTo(i, TILE); c.stroke();
    }
    c.fillStyle = '#d99a4e';                      // bread rolls
    c.beginPath(); c.ellipse(5, 5, 3, 2.2, 0.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(11, 6, 3, 2.2, -0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(7, 11, 3, 2.2, 0.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(150, 92, 30, 0.8)';    // crust scores
    c.beginPath(); c.moveTo(3, 5); c.lineTo(7, 5); c.stroke();
    c.beginPath(); c.moveTo(9, 6); c.lineTo(13, 6); c.stroke();
    c.fillStyle = 'rgba(248, 238, 215, 0.7)';    // flour dust
    for (let i = 0; i < 8; i++) c.fillRect((Math.random() * 15) | 0, (Math.random() * 15) | 0, 1, 1);
  },
  // basket_side: かご側面 — horizontal wicker bands.
  [T.basket_side]: (c) => {
    noisePx(c, [160, 118, 62], 14);
    c.strokeStyle = 'rgba(106, 72, 32, 0.8)';
    for (let y = 1; y < TILE; y += 3) {
      c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(TILE, y + 0.5); c.stroke();
    }
    c.fillStyle = 'rgba(206, 162, 98, 0.6)';     // alternating weave bumps
    for (let y = 0; y < TILE; y += 3) {
      for (let x = (y / 3) % 2 ? 0 : 3; x < TILE; x += 6) c.fillRect(x, y, 3, 1);
    }
  },
  // price_card: 値札カード — cream card on wood, text lines + red ¥.
  [T.price_card]: (c) => {
    noisePx(c, [120, 90, 56], 10);               // wood backdrop
    c.fillStyle = '#f5edd8';                      // cream card
    c.fillRect(2, 3, 12, 10);
    c.strokeStyle = 'rgba(90, 70, 44, 0.6)';
    c.strokeRect(2.5, 3.5, 11, 9);
    c.strokeStyle = 'rgba(120, 120, 116, 0.85)'; // item-name lines
    c.beginPath(); c.moveTo(4, 6); c.lineTo(12, 6); c.stroke();
    c.beginPath(); c.moveTo(4, 8); c.lineTo(10, 8); c.stroke();
    c.fillStyle = '#c03030';                      // red price
    c.font = 'bold 5px system-ui, sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('¥600', 4, 11);
  },
  // coffee: コーヒー器具 — dripper cone + glass carafe with coffee + steam.
  [T.coffee]: (c) => {
    noisePx(c, [226, 216, 198], 10);             // counter backdrop
    c.fillStyle = '#3a3e44';                      // dripper cone
    c.beginPath(); c.moveTo(4, 3); c.lineTo(12, 3); c.lineTo(8, 7); c.closePath(); c.fill();
    c.fillStyle = 'rgba(170, 195, 205, 0.65)';   // glass carafe
    c.fillRect(4, 8, 8, 6);
    c.fillStyle = '#6a3a18';                      // brewed coffee
    c.fillRect(5, 11, 6, 3);
    c.strokeStyle = 'rgba(120, 120, 116, 0.6)';  // steam wisps
    c.beginPath(); c.moveTo(6, 2); c.lineTo(7, 0); c.stroke();
    c.beginPath(); c.moveTo(10, 2); c.lineTo(9, 0); c.stroke();
    c.fillStyle = '#3a3e44';                      // carafe handle
    c.fillRect(12, 9, 2, 1); c.fillRect(13, 9, 1, 4); c.fillRect(12, 12, 2, 1);
  },
  // menu_stand: メニュースタンド — dark frame, cream menu, listing lines.
  [T.menu_stand]: (c) => {
    noisePx(c, [70, 52, 34], 10);                // dark wood frame
    c.fillStyle = '#f3ecdc';                      // cream menu sheet
    c.fillRect(3, 2, 10, 12);
    c.fillStyle = '#5c6b4a';                      // brand-green header band
    c.fillRect(3, 2, 10, 2);
    c.strokeStyle = 'rgba(110, 110, 106, 0.85)'; // menu lines
    for (const my of [6, 8, 10, 12]) { c.beginPath(); c.moveTo(4, my + 0.5); c.lineTo(12, my + 0.5); c.stroke(); }
    c.fillStyle = '#c03030';                      // today's-special dot
    c.fillRect(4, 6, 1, 1);
  },
  // stainless: 給食室調理台 — brushed steel with horizontal brushing.
  [T.stainless]: (c) => {
    noisePx(c, [188, 192, 198], 6);
    c.strokeStyle = 'rgba(225, 229, 234, 0.6)';  // brush highlights
    for (let y = 2; y < TILE; y += 4) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(TILE, y + 0.5); c.stroke(); }
    c.strokeStyle = 'rgba(140, 144, 150, 0.6)';
    for (let y = 4; y < TILE; y += 4) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(TILE, y + 0.5); c.stroke(); }
    c.strokeStyle = 'rgba(120, 124, 130, 0.9)';  // panel edge
    c.strokeRect(0.5, 0.5, 15, 15);
    c.fillStyle = 'rgb(120, 124, 130)';          // corner screws
    c.fillRect(1, 1, 1, 1); c.fillRect(14, 1, 1, 1); c.fillRect(1, 14, 1, 1); c.fillRect(14, 14, 1, 1);
  },
  // desk_top: 学校机 — bright local-timber top with a frame line.
  [T.desk_top]: (c) => {
    noisePx(c, [202, 170, 118], 12);
    c.strokeStyle = 'rgba(120, 90, 52, 0.9)';
    c.strokeRect(0.5, 0.5, 15, 15);              // edge frame
    c.strokeStyle = 'rgba(160, 128, 80, 0.6)';   // wood grain
    for (const gy of [4, 8, 12]) { c.beginPath(); c.moveTo(2, gy + 0.5); c.lineTo(14, gy + 0.5); c.stroke(); }
    c.fillStyle = 'rgba(90, 66, 38, 0.8)';       // pencil groove
    c.fillRect(3, 2, 10, 1);
  },
  // desk_side: 学校机側面 — apron + two sturdy legs over shadow.
  [T.desk_side]: (c) => {
    noisePx(c, [196, 164, 112], 12);
    c.fillStyle = 'rgba(60, 44, 26, 0.45)';      // under-desk shadow
    c.fillRect(0, 4, TILE, 12);
    c.fillStyle = 'rgb(150, 116, 72)';           // apron board
    c.fillRect(0, 0, TILE, 4);
    c.strokeStyle = 'rgba(90, 66, 38, 0.9)';
    c.beginPath(); c.moveTo(0, 3.5); c.lineTo(TILE, 3.5); c.stroke();
    c.fillStyle = 'rgb(168, 132, 84)';           // legs
    c.fillRect(1, 4, 2, 12); c.fillRect(13, 4, 2, 12);
  },
  // chair: 学校椅子 — backrest slats, seat board, two legs.
  [T.chair]: (c) => {
    noisePx(c, [120, 92, 58], 12);               // dim classroom backdrop
    c.fillStyle = 'rgb(196, 158, 104)';          // backrest slats
    c.fillRect(3, 1, 10, 2); c.fillRect(3, 4, 10, 2);
    c.fillStyle = 'rgb(208, 172, 116)';          // seat board
    c.fillRect(2, 7, 12, 3);
    c.strokeStyle = 'rgba(80, 58, 32, 0.9)';
    c.beginPath(); c.moveTo(2, 9.5); c.lineTo(14, 9.5); c.stroke();
    c.fillStyle = 'rgb(150, 116, 72)';           // legs
    c.fillRect(3, 10, 2, 6); c.fillRect(11, 10, 2, 6);
  },
  // flag: 国旗 — white field, red sun disc, grey pole strip.
  [T.flag]: (c) => {
    noisePx(c, [240, 240, 242], 8);              // white field
    c.fillStyle = '#cc2030';                      // red disc
    c.beginPath(); c.arc(8, 8, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(190, 190, 194, 0.9)';    // pole strip
    c.fillRect(0, 0, 1, TILE);
    c.fillStyle = 'rgba(210, 210, 214, 0.5)';    // gentle wave shading
    c.fillRect(11, 1, 2, 14);
  },
  // guardrail: ガードレール — two bold white corrugated beams on a dark post
  // backdrop (opaque:false culling, but painted solid for the opaque pass).
  [T.guardrail]: (c) => {
    noisePx(c, [88, 94, 90], 12);                // shaded post backdrop
    c.fillStyle = 'rgb(238, 240, 240)';          // white W-beams
    c.fillRect(0, 2, TILE, 4); c.fillRect(0, 9, TILE, 4);
    c.fillStyle = 'rgba(170, 176, 178, 0.9)';    // corrugation shadow groove
    c.fillRect(0, 4, TILE, 1); c.fillRect(0, 11, TILE, 1);
    c.fillStyle = 'rgb(150, 156, 158)';          // mounting bolts
    c.fillRect(7, 3, 2, 2); c.fillRect(7, 10, 2, 2);
  },
  // brand_green: ブランド深緑 #5C6B4A — wool weave.
  [T.brand_green]: (c) => {
    noisePx(c, [92, 107, 74], 10);
    c.fillStyle = 'rgba(70, 84, 56, 0.5)';       // weave dots
    for (let y = 0; y < TILE; y += 2) {
      for (let x = y % 4 ? 0 : 2; x < TILE; x += 4) c.fillRect(x, y, 1, 1);
    }
  },
  // wheat_beige: 麦色 #E8D5B7 — soft warm wool.
  [T.wheat_beige]: (c) => {
    noisePx(c, [232, 213, 183], 9);
    c.fillStyle = 'rgba(206, 184, 148, 0.5)';    // weave dots
    for (let y = 1; y < TILE; y += 2) {
      for (let x = y % 4 === 1 ? 0 : 2; x < TILE; x += 4) c.fillRect(x, y, 1, 1);
    }
  },
  // compost_top: ぐるぐるコンポスト — wood frame, dark soil, scraps, swirl.
  [T.compost_top]: (c) => {
    noisePx(c, [150, 116, 72], 12);              // wood frame
    c.fillStyle = 'rgb(74, 52, 32)';             // dark composting soil
    c.fillRect(2, 2, 12, 12);
    c.fillStyle = 'rgba(50, 34, 20, 0.7)';       // soil clumps
    for (let i = 0; i < 10; i++) c.fillRect(2 + ((Math.random() * 11) | 0), 2 + ((Math.random() * 11) | 0), 1, 1);
    c.fillStyle = '#e8a020'; c.fillRect(4, 5, 2, 1);   // veg scraps
    c.fillStyle = '#4a8a3a'; c.fillRect(10, 4, 2, 1);
    c.fillStyle = '#d24a2e'; c.fillRect(5, 10, 1, 1);
    c.fillStyle = '#e8d5b7'; c.fillRect(10, 11, 2, 1); // bread crumb
    c.strokeStyle = 'rgba(228, 206, 168, 0.85)'; // ぐるぐる swirl arrow
    c.lineWidth = 1;
    c.beginPath(); c.arc(8, 8, 3, 0.3, 5.2); c.stroke();
    c.fillStyle = 'rgba(228, 206, 168, 0.9)';
    c.fillRect(10, 6, 2, 2);                     // arrowhead
  },
  // compost_side: コンポスト側面 — wood slats with soil showing in the gaps.
  [T.compost_side]: (c) => {
    noisePx(c, [150, 116, 72], 14);              // slats
    c.fillStyle = 'rgb(64, 44, 26)';             // soil gaps between slats
    c.fillRect(1, 4, 14, 2); c.fillRect(1, 10, 14, 2);
    c.fillStyle = 'rgba(96, 70, 40, 0.9)';       // corner posts
    c.fillRect(0, 0, 2, TILE); c.fillRect(TILE - 2, 0, 2, TILE);
    c.strokeStyle = 'rgba(106, 78, 44, 0.7)';    // slat grain
    for (const gy of [2, 8, 14]) { c.beginPath(); c.moveTo(2, gy + 0.5); c.lineTo(14, gy + 0.5); c.stroke(); }
  },
  // yeast_jars: 酵母瓶棚 — four bubbling fruit-yeast jars on a wooden shelf.
  [T.yeast_jars]: (c) => {
    noisePx(c, [110, 82, 50], 10);               // dim shelf backdrop
    c.fillStyle = 'rgb(150, 116, 72)';           // shelf board
    c.fillRect(0, 13, TILE, 3);
    c.strokeStyle = 'rgba(90, 66, 38, 0.9)';
    c.beginPath(); c.moveTo(0, 13.5); c.lineTo(TILE, 13.5); c.stroke();
    // jars: いちご(赤) / 柿(橙) / ゆず(黄) / ハーブ(緑)
    const jars = ['#c84040', '#e08830', '#e8c840', '#5a9a4a'];
    for (let i = 0; i < 4; i++) {
      const x = 1 + i * 4;
      c.fillStyle = '#caa86a';                   // lid
      c.fillRect(x, 4, 3, 2);
      c.fillStyle = jars[i];                     // ferment body
      c.fillRect(x, 6, 3, 7);
      c.fillStyle = 'rgba(255, 255, 255, 0.85)'; // プクプク bubbles
      c.fillRect(x + 1, 7, 1, 1); c.fillRect(x, 9 + (i % 2), 1, 1);
      c.fillStyle = 'rgba(255, 255, 255, 0.35)'; // glass highlight
      c.fillRect(x + 2, 6, 1, 7);
    }
  },
  // isshou: 一升パン — furoshiki wrap: wheat cloth, checker, top knot.
  [T.isshou]: (c) => {
    noisePx(c, [226, 200, 158], 12);             // wheat-colour cloth
    c.fillStyle = 'rgba(180, 150, 100, 0.4)';    // 市松 checker pattern
    for (let y = 0; y < TILE; y += 4) {
      for (let x = (y / 4) % 2 ? 0 : 4; x < TILE; x += 8) c.fillRect(x, y, 4, 4);
    }
    c.fillStyle = '#b08850';                      // knot ears
    c.beginPath(); c.moveTo(3, 4); c.lineTo(6, 1); c.lineTo(7, 4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(13, 4); c.lineTo(10, 1); c.lineTo(9, 4); c.closePath(); c.fill();
    c.fillStyle = '#9a7440';                      // knot centre
    c.fillRect(6, 3, 4, 3);
    c.strokeStyle = 'rgba(120, 88, 48, 0.8)';    // gathered cloth folds
    c.beginPath(); c.moveTo(8, 6); c.lineTo(3, 14); c.stroke();
    c.beginPath(); c.moveTo(8, 6); c.lineTo(13, 14); c.stroke();
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
