// Headless test of the survival inventory: stacking, mining-drop add, crafting
// (grid -> result -> cursor), consume-on-place, tools. Run:
//   node --import ./setup.mjs ./inventory.test.mjs
import assert from 'node:assert';
import { createInventory } from '../public/minecraft/inventory.js';

let n = 0;
const ok = (name, c) => { assert.ok(c, name); n++; console.log('  ✓ ' + name); };

console.log('Inventory / crafting tests');
const inv = createInventory({ texture: { image: { width: 128 } }, cols: 8, sfx: null, creative: false, onSelect() {} });
inv.mountHotbar(document.getElementById('hotbar'));
const D = inv._debug;

// add + selection
ok('add oak_log -> 0 leftover', inv.add('oak_log', 1) === 0);
inv.setSelected(0);
ok('selectedItem is oak_log', inv.selectedItem() === 'oak_log');

// craft: a log placed in the grid yields 4 planks onto the cursor
D.craft[0] = { item: 'oak_log', count: 1 };
D.takeResult();
const cur = D.getCursor();
ok('craft oak_log -> 4 oak_planks on cursor', cur && cur.item === 'oak_planks' && cur.count === 4);
ok('craft consumed the grid log', D.craft[0] === null);

// place the cursor stack into an empty inventory slot
D.clickSlot('main', 9);
ok('cursor placed into slot 9', D.main[9] && D.main[9].item === 'oak_planks' && D.main[9].count === 4);
ok('cursor now empty', D.getCursor() == null);

// stacking past 64 spills into another slot
ok('add 70 dirt -> 0 leftover', inv.add('dirt', 70) === 0);
let dirt = 0; for (const c of D.main) if (c && c.item === 'dirt') dirt += c.count;
ok('70 dirt stored across slots', dirt === 70);

// tools: heldTool + durability
inv.add('iron_pickaxe', 1);
let pickIdx = D.main.findIndex((c) => c && c.item === 'iron_pickaxe');
inv.setSelected(pickIdx < 9 ? pickIdx : 0);
if (pickIdx >= 9) { // move pickaxe into a hotbar slot for the test
  D.clickSlot('main', pickIdx); D.clickSlot('main', 1); inv.setSelected(1);
}
const t = inv.heldTool();
ok('heldTool reads iron pickaxe', t && t.class === 'pickaxe' && t.tier === 'iron');
inv.damageHeldTool(1);
ok('pickaxe survives one use', inv.selectedItem() === 'iron_pickaxe');

// consume-on-place
inv.setSelected(0);
const before = D.main[0] ? D.main[0].count : 0;
ok('consumeSelected succeeds', inv.consumeSelected(1) === true);
ok('count decreased by 1', (D.main[0] ? D.main[0].count : 0) === before - 1);

// creative mode: prefilled hotbar, infinite place, no pickup
const cinv = createInventory({ texture: { image: { width: 128 } }, cols: 8, sfx: null, creative: true, onSelect() {} });
cinv.mountHotbar(document.getElementById('hotbar'));
cinv.setSelected(0);
ok('creative prefills hotbar slot 0 = grass', cinv.selectedItem() === 'grass');
const c0 = cinv._debug.main[0].count;
ok('creative place does not consume', cinv.consumeSelected(1) === true && cinv._debug.main[0].count === c0);
ok('creative add is a no-op', cinv.add('dirt', 5) === 0);

console.log(`\nAll ${n} inventory assertions passed.`);
