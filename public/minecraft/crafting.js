// crafting.js — pure crafting system for a voxel game.
// Items are referenced by string ids. Grid is an array of 9 (3x3 row-major)
// or 4 (2x2 row-major) of item-id strings or null.

const MATERIALS = {
  wood: 'oak_planks',
  stone: 'cobblestone',
  iron: 'iron_ingot',
  diamond: 'diamond',
};

// Build a shaped tool recipe (pattern is array of rows of strings).
// 'M' = material, 'S' = stick, ' ' or '.' = empty.
function toolRecipe(pattern, material, resultId, count = 1) {
  const mat = MATERIALS[material];
  const rows = pattern.map((row) =>
    row.split('').map((c) => {
      if (c === 'M') return mat;
      if (c === 'S') return 'stick';
      return null;
    })
  );
  return { type: 'shaped', pattern: rows, result: { id: resultId, count } };
}

function shaped(pattern, result) {
  return { type: 'shaped', pattern, result };
}

function shapeless(ingredients, result) {
  return { type: 'shapeless', ingredients, result };
}

const P = 'oak_planks';

export const RECIPES = [
  // Shapeless: 1 oak_log -> 4 oak_planks
  shapeless(['oak_log'], { id: 'oak_planks', count: 4 }),

  // Sticks: planks above planks (vertical) -> 4 stick
  shaped([[P], [P]], { id: 'stick', count: 4 }),

  // crafting_table: 2x2 of planks -> 1 crafting_table
  shaped(
    [
      [P, P],
      [P, P],
    ],
    { id: 'crafting_table', count: 1 }
  ),

  // furnace: 8 cobblestone ring (empty center)
  shaped(
    [
      ['cobblestone', 'cobblestone', 'cobblestone'],
      ['cobblestone', null, 'cobblestone'],
      ['cobblestone', 'cobblestone', 'cobblestone'],
    ],
    { id: 'furnace', count: 1 }
  ),

  // chest: 8 oak_planks ring (empty center)
  shaped(
    [
      [P, P, P],
      [P, null, P],
      [P, P, P],
    ],
    { id: 'chest', count: 1 }
  ),

  // torch: coal above stick -> 4 torch
  shaped([['coal'], ['stick']], { id: 'torch', count: 4 }),

  // bread: 3 wheat in a row
  shaped([['wheat', 'wheat', 'wheat']], { id: 'bread', count: 1 }),

  // --- Petit Hermès bakery recipes ---
  // 規格外野菜を瓶で発酵させて発酵液: empty_jar + surplus_veg -> levain
  shapeless(['empty_jar', 'surplus_veg'], { id: 'levain', count: 1 }),

  // 発酵液と小麦を混ぜてパン: levain + wheat -> bread x2
  shapeless(['levain', 'wheat'], { id: 'bread', count: 2 }),

  // 小麦から小麦粉: wheat x3 -> flour
  shapeless(['wheat', 'wheat', 'wheat'], { id: 'flour', count: 1 }),

  // 小麦粉と発酵液でもパン: flour + levain -> bread x2
  shapeless(['flour', 'levain'], { id: 'bread', count: 2 }),

  // 野菜たっぷりでたくさんの発酵液: surplus_veg x3 -> levain x2
  shapeless(['surplus_veg', 'surplus_veg', 'surplus_veg'], { id: 'levain', count: 2 }),
];

// Tools for each material tier.
for (const tier of ['wood', 'stone', 'iron', 'diamond']) {
  // pickaxe: 3 material across top, sticks down the middle
  RECIPES.push(
    toolRecipe(['MMM', '.S.', '.S.'], tier, `${tier}_pickaxe`)
  );
  // axe: 2 material top + 1 material mid-left, sticks down middle (standard)
  RECIPES.push(toolRecipe(['MM', 'MS', '.S'], tier, `${tier}_axe`));
  // shovel: 1 material on top + 2 stick vertical
  RECIPES.push(toolRecipe(['M', 'S', 'S'], tier, `${tier}_shovel`));
  // sword: 2 material vertical + 1 stick below
  RECIPES.push(toolRecipe(['M', 'M', 'S'], tier, `${tier}_sword`));
}

// --- Matching helpers ---

// Normalize grid input (len 4 or 9) into a 3x3 matrix of ids/null.
function toMatrix(grid) {
  if (!Array.isArray(grid)) return null;
  if (grid.length === 9) {
    return [grid.slice(0, 3), grid.slice(3, 6), grid.slice(6, 9)];
  }
  if (grid.length === 4) {
    // place 2x2 into top-left of a 3x3 (gets trimmed anyway)
    return [
      [grid[0], grid[1], null],
      [grid[2], grid[3], null],
      [null, null, null],
    ];
  }
  return null;
}

const norm = (c) => (c === undefined || c === null || c === '' ? null : c);

// Trim fully-empty outer rows and columns; returns a tight matrix.
function trim(matrix) {
  let rows = matrix.map((r) => r.map(norm));
  // drop empty rows
  rows = rows.filter((r) => r.some((c) => c !== null));
  if (rows.length === 0) return [];
  // find non-empty column range
  const width = rows[0].length;
  let minC = width;
  let maxC = -1;
  for (const r of rows) {
    for (let c = 0; c < width; c++) {
      if (r[c] !== null) {
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  return rows.map((r) => r.slice(minC, maxC + 1));
}

function shapesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (norm(a[i][j]) !== norm(b[i][j])) return false;
    }
  }
  return true;
}

function mirror(shape) {
  return shape.map((r) => [...r].reverse());
}

function matchShaped(trimmed, recipe) {
  const pat = trim(recipe.pattern);
  if (shapesEqual(trimmed, pat)) return true;
  // trivial horizontal-mirror tolerance
  if (shapesEqual(trimmed, mirror(pat))) return true;
  return false;
}

function matchShapeless(matrix, recipe) {
  const items = [];
  for (const row of matrix) {
    for (const cell of row) {
      const c = norm(cell);
      if (c !== null) items.push(c);
    }
  }
  if (items.length !== recipe.ingredients.length) return false;
  const need = [...recipe.ingredients];
  for (const it of items) {
    const idx = need.indexOf(it);
    if (idx === -1) return false;
    need.splice(idx, 1);
  }
  return need.length === 0;
}

export function craftResult(grid) {
  const matrix = toMatrix(grid);
  if (!matrix) return null;
  const trimmed = trim(matrix);
  if (trimmed.length === 0) return null; // empty grid

  for (const recipe of RECIPES) {
    if (recipe.type === 'shaped') {
      if (matchShaped(trimmed, recipe)) {
        return { id: recipe.result.id, count: recipe.result.count };
      }
    } else if (recipe.type === 'shapeless') {
      if (matchShapeless(matrix, recipe)) {
        return { id: recipe.result.id, count: recipe.result.count };
      }
    }
  }
  return null;
}
