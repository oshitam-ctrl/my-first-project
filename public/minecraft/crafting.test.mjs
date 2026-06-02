import assert from 'node:assert';
import { RECIPES, craftResult } from './crafting.js';

let passed = 0;
function check(name, actual, expected) {
  assert.deepStrictEqual(actual, expected, name);
  passed++;
}

const N = null;

// planks from log (shapeless), any position
check('log->planks', craftResult([N, N, N, N, 'oak_log', N, N, N, N]), {
  id: 'oak_planks',
  count: 4,
});

// sticks: planks above planks (vertical)
check(
  'sticks',
  craftResult(['oak_planks', N, N, 'oak_planks', N, N, N, N, N]),
  { id: 'stick', count: 4 }
);

// crafting_table 2x2 (4-length grid)
check('table 2x2', craftResult(['oak_planks', 'oak_planks', 'oak_planks', 'oak_planks']), {
  id: 'crafting_table',
  count: 1,
});

// crafting_table inside a 3x3 in bottom-right corner (position-independence)
check(
  'table offset',
  craftResult([N, N, N, N, 'oak_planks', 'oak_planks', N, 'oak_planks', 'oak_planks']),
  { id: 'crafting_table', count: 1 }
);

// pickaxe of each tier in different grid offsets
const matOf = {
  wood: 'oak_planks',
  stone: 'cobblestone',
  iron: 'iron_ingot',
  diamond: 'diamond',
};
// wood pickaxe top-left (standard)
{
  const m = matOf.wood;
  check(
    'wood_pickaxe TL',
    craftResult([m, m, m, N, 'stick', N, N, 'stick', N]),
    { id: 'wood_pickaxe', count: 1 }
  );
}
// stone pickaxe shifted right (cols 1-2 ... but pickaxe is 3 wide, so offset is rows)
{
  const m = matOf.stone;
  // already top-aligned; verify same shape recognized regardless (3-wide fills all cols)
  check(
    'stone_pickaxe',
    craftResult([m, m, m, N, 'stick', N, N, 'stick', N]),
    { id: 'stone_pickaxe', count: 1 }
  );
}
// iron pickaxe — full 3x3 footprint (only valid placement)
{
  const m = matOf.iron;
  check(
    'iron_pickaxe',
    craftResult([m, m, m, N, 'stick', N, N, 'stick', N]),
    { id: 'iron_pickaxe', count: 1 }
  );
}
// iron shovel offset to the RIGHT column (position-independence proof)
{
  const m = matOf.iron;
  check(
    'iron_shovel offset right col',
    craftResult([N, N, m, N, N, 'stick', N, N, 'stick']),
    { id: 'iron_shovel', count: 1 }
  );
}
// diamond pickaxe top-aligned
{
  const m = matOf.diamond;
  check(
    'diamond_pickaxe',
    craftResult([m, m, m, N, 'stick', N, N, 'stick', N]),
    { id: 'diamond_pickaxe', count: 1 }
  );
}

// torch: coal above stick, in middle column (offset)
check('torch', craftResult([N, 'coal', N, N, 'stick', N, N, N, N]), {
  id: 'torch',
  count: 4,
});

// sword: 2 material vertical + stick below
check(
  'wood_sword',
  craftResult([N, 'oak_planks', N, N, 'oak_planks', N, N, 'stick', N]),
  { id: 'wood_sword', count: 1 }
);

// bread: 3 wheat in a row, bottom row
check('bread', craftResult([N, N, N, N, N, N, 'wheat', 'wheat', 'wheat']), {
  id: 'bread',
  count: 1,
});

// --- Petit Hermès bakery recipes ---

// 発酵液 (levain) is intentionally NOT craftable in the grid: it comes only from
// time-based fermentation (fermentation.js). The old instant recipes were removed.
check('jar+veg->levain has no instant recipe', craftResult(['empty_jar', 'surplus_veg', N, N]), null);
check('3 veg->levain has no instant recipe', craftResult([N, 'surplus_veg', N, 'surplus_veg', N, N, N, N, 'surplus_veg']), null);

// levain + wheat -> bread x2
check('levain+wheat->bread x2', craftResult(['levain', 'wheat', N, N]), {
  id: 'bread',
  count: 2,
});

// levain + wheat -> bread x2, offset bottom-right, swapped order
check(
  'wheat+levain->bread x2 offset',
  craftResult([N, N, N, N, N, N, N, 'wheat', 'levain']),
  { id: 'bread', count: 2 }
);

// 3 wheat -> flour (use an L/scatter so it does NOT match the shaped 3-in-a-row bread)
check(
  '3 wheat->flour (non-row)',
  craftResult(['wheat', N, N, 'wheat', N, N, 'wheat', N, N]),
  { id: 'flour', count: 1 }
);

// flour + levain -> baguette x1 (signature: levain hard bread, not generic bread)
check('flour+levain->baguette', craftResult(['flour', 'levain', N, N]), {
  id: 'baguette',
  count: 1,
});


// --- Petit Hermès signature breads ---

// levain + flour + flour -> campagne (hero hard loaf); scattered & swapped
check(
  'levain+flour+flour->campagne',
  craftResult(['flour', N, 'levain', N, N, N, 'flour', N, N]),
  { id: 'campagne', count: 1 }
);

// levain + flour + wheat -> pain_de_mie
check(
  'levain+flour+wheat->pain_de_mie',
  craftResult(['levain', 'flour', 'wheat', N]),
  { id: 'pain_de_mie', count: 1 }
);

// campagne + rosemary -> rosemary_bread
check('campagne+rosemary->rosemary_bread', craftResult(['campagne', 'rosemary', N, N]), {
  id: 'rosemary_bread',
  count: 1,
});

// campagne + thinned_apple -> apple_bread (swapped order)
check('campagne+thinned_apple->apple_bread', craftResult(['thinned_apple', 'campagne', N, N]), {
  id: 'apple_bread',
  count: 1,
});

// campagne + ripe_fruit -> fruit_bread
check('campagne+ripe_fruit->fruit_bread', craftResult(['campagne', 'ripe_fruit', N, N]), {
  id: 'fruit_bread',
  count: 1,
});

// pain_de_mie -> toast x2 (single-input toasting), offset position
check('pain_de_mie->toast x2', craftResult([N, N, N, N, 'pain_de_mie', N, N, N, N]), {
  id: 'toast',
  count: 2,
});

// empty grid -> null
check('empty', craftResult([N, N, N, N, N, N, N, N, N]), null);
check('empty 2x2', craftResult([N, N, N, N]), null);

// nonsense grid -> null
check('nonsense', craftResult(['apple', 'sand', N, N, N, N, N, N, N]), null);

console.log(`All ${passed} tests passed. (${RECIPES.length} recipes)`);
