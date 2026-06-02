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

// --- shift-click quick-move -------------------------------------------
const sinv = createInventory({ texture: { image: { width: 128 } }, cols: 8, sfx: null, creative: false, onSelect() {} });
sinv.mountHotbar(document.getElementById('hotbar'));
// put a stack in hotbar slot 2, shift-click moves it to storage (9..35)
sinv.add('stone', 32);
// stone should land in slot 0 (first empty hotbar slot after oak_log in slot 0 above... actually sinv is fresh)
let stoneHotbarIdx = sinv._debug.main.findIndex((c) => c && c.item === 'stone');
ok('stone placed in hotbar for shift-click test', stoneHotbarIdx >= 0 && stoneHotbarIdx < 9);
sinv._debug.clickSlot('main', stoneHotbarIdx, true); // shift+click
const stoneInStorage = sinv._debug.main.slice(9).some((c) => c && c.item === 'stone');
const stoneGoneFromHotbar = !sinv._debug.main[stoneHotbarIdx];
ok('shift-click moves stack from hotbar to storage', stoneInStorage && stoneGoneFromHotbar);

// shift-click back: storage slot -> hotbar
let stoneStorageIdx = sinv._debug.main.findIndex((c, i) => i >= 9 && c && c.item === 'stone');
sinv._debug.clickSlot('main', stoneStorageIdx, true); // shift+click back
const stoneBackInHotbar = sinv._debug.main.slice(0, 9).some((c) => c && c.item === 'stone');
ok('shift-click moves stack from storage back to hotbar', stoneBackInHotbar);

// --- name popup (stub-safe: just verify it doesn't throw) ----------------
const pinv = createInventory({ texture: { image: { width: 128 } }, cols: 8, sfx: null, creative: false, onSelect() {} });
pinv.mountHotbar(document.getElementById('hotbar'));
pinv.add('grass', 1);
let threw = false;
try { pinv.setSelected(0); } catch (e) { threw = true; }
ok('setSelected with item does not throw (name popup safe)', !threw);
try { pinv.setSelected(1); } catch (e) { threw = true; } // empty slot
ok('setSelected with empty slot does not throw (name popup safe)', !threw);

// --- tooltip: paintSlot stores _cell on element ----------------------------
const tinv = createInventory({ texture: { image: { width: 128 } }, cols: 8, sfx: null, creative: false, onSelect() {} });
tinv.mountHotbar(document.getElementById('hotbar'));
tinv.add('campagne', 2);
// Open the screen so buildScreen() runs and storageSlots are created
tinv.toggleScreen();
// After opening, storage slots should have been painted with _cell
// campagne should have landed in hotbar (slot 0), check that paintSlot stores _cell
// We test the API-level: itemDef('campagne').desc is non-empty
import { itemDef as _itemDef } from '../public/minecraft/items.js';
const _campDef = _itemDef('campagne');
ok('campagne has desc', typeof _campDef.desc === 'string' && _campDef.desc.length > 0);
ok('campagne desc mentions 酵母', _campDef.desc.includes('酵母'));
const _levainDef = _itemDef('levain');
ok('levain has desc', typeof _levainDef.desc === 'string' && _levainDef.desc.length > 0);
const _rescueDef = _itemDef('rescue_bag');
ok('rescue_bag has desc mentioning ランダム', _rescueDef.desc.includes('ランダム'));
const _pickDef = _itemDef('wood_pickaxe');
ok('wood_pickaxe has desc', typeof _pickDef.desc === 'string' && _pickDef.desc.length > 0);
// Food items have food.hunger, tools have tool stats — verify we can build tooltip data
const _swordDef = _itemDef('iron_sword');
ok('iron_sword tool has damage/speed/durability', _swordDef.tool.damage > 0 && _swordDef.tool.speed > 0 && _swordDef.tool.durability > 0);
// Verify toggleScreen doesn't throw (tooltip ensureTooltip is stub-safe)
let tthrew = false;
try { tinv.toggleScreen(); } catch (e) { tthrew = true; }
ok('toggleScreen (close) does not throw', !tthrew);

console.log(`\nAll ${n} inventory assertions passed.`);
