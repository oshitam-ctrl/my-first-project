// Node test for shop.js (店頭 buy panel). Stubs a minimal DOM + a fake inventory
// so the pure module can be exercised headlessly. Run: node shop.test.mjs
import assert from 'node:assert';

// --- minimal DOM stub (createShop only builds simple elements) ---
function fakeEl() {
  return new Proxy({ style: {}, children: [], textContent: '', innerHTML: '', disabled: false,
    appendChild(c) { this.children.push(c); return c; }, addEventListener() {}, },
    { get(t, p) { return p in t ? t[p] : () => {}; }, set(t, p, v) { t[p] = v; return true; } });
}
global.document = { createElement: () => fakeEl(), body: fakeEl() };
global.setTimeout = (fn) => { try { fn(); } catch {} return 0; }; // run ritual toast inline

const { createShop, SHOP_STOCK } = await import('./shop.js');

// --- fake inventory ---
function fakeInv(init = {}) {
  const bag = { ...init };
  return {
    count: (id) => bag[id] || 0,
    take: (id, n = 1) => { const had = bag[id] || 0; const t = Math.min(had, n); bag[id] = had - t; return t; },
    collect: (id, n = 1) => { bag[id] = (bag[id] || 0) + n; return 0; },
    _bag: bag,
  };
}

const toasts = [];
const inv = fakeInv({ surplus_veg: 3 });
const shop = createShop({ inv, sfx: {}, toast: (m) => toasts.push(m), itemDef: (id) => ({ name: id }), particles: { burst() {} }, onBuy() {} });

assert.strictEqual(typeof shop.open, 'function', 'shop.open exists');
assert.strictEqual(typeof shop.__buy, 'function', 'shop.__buy exists');
assert.ok(SHOP_STOCK.length >= 3, 'shop has stock');

// buy a baguette (cost 1 surplus_veg) → produce down 1, bread up 1
const ok = shop.__buy('baguette');
assert.strictEqual(ok, true, 'buy succeeded with enough produce');
assert.strictEqual(inv.count('surplus_veg'), 2, 'surplus_veg decremented by cost');
assert.strictEqual(inv.count('baguette'), 1, 'received 1 baguette');
assert.ok(toasts.some((t) => t.includes('いらっしゃいませ')), 'greeting ritual fired');
assert.ok(toasts.some((t) => t.includes('ありがとう')), 'thanks ritual fired');

// campagne costs 2 → after this, produce = 0
assert.strictEqual(shop.__buy('campagne'), true, 'buy campagne (cost 2)');
assert.strictEqual(inv.count('surplus_veg'), 0, 'produce now 0');

// broke → cannot buy
assert.strictEqual(shop.__buy('baguette'), false, 'cannot buy when out of produce');
assert.strictEqual(inv.count('baguette'), 1, 'no extra bread when broke');

console.log('all shop tests passed');
