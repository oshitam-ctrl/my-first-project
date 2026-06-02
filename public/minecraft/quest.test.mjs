// Node test for quest.js — builds the QUEST HUD against a tiny DOM stub.
// Run: node quest.test.mjs
import assert from 'node:assert';

// --- minimal document stub ---------------------------------------------------
function makeEl() {
  return {
    style: {},
    children: [],
    textContent: '',
    innerHTML: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(child) { this.children.push(child); return child; },
    setAttribute() {},
  };
}
const body = makeEl();
global.document = {
  body,
  createElement: () => makeEl(),
};

const { createQuest } = await import('./quest.js');

// --- build doesn't throw + panel attached -----------------------------------
let completes = 0;
const quest = createQuest({ onComplete: () => { completes++; } });
assert.ok(quest && quest.el, 'createQuest returns an api with an el');
assert.ok(body.children.includes(quest.el), 'panel appended to document.body');

// helper: count how many steps render as done (✅ marks).
// rows live under listEl (el.children[1]); each row's first child is the mark.
function doneCount() {
  const listEl = quest.el.children[1];
  return listEl.children.filter((row) => row.children[0].textContent === '✅').length;
}

// --- nothing collected: 0 done ----------------------------------------------
quest.update({ wheat: 0, veg: 0, levain: 0, bread: 0, nearBaker: false });
assert.strictEqual(doneCount(), 0, 'nothing collected -> 0 steps done');
assert.strictEqual(quest.done, false, 'not done initially');

// --- progressively advance ---------------------------------------------------
quest.update({ wheat: 1, veg: 0, levain: 0, bread: 0, nearBaker: false });
assert.strictEqual(doneCount(), 1, 'wheat done -> 1 step');

quest.update({ wheat: 1, veg: 2, levain: 0, bread: 0, nearBaker: false });
assert.strictEqual(doneCount(), 2, 'wheat+veg -> 2 steps');

quest.update({ wheat: 1, veg: 2, levain: 1, bread: 0, nearBaker: false });
assert.strictEqual(doneCount(), 3, 'levain -> 3 steps');

quest.update({ wheat: 1, veg: 2, levain: 1, bread: 1, nearBaker: false });
assert.strictEqual(doneCount(), 4, 'bread baked but not delivered -> 4 steps');
assert.strictEqual(completes, 0, 'onComplete not fired before delivery');

// --- all done: onComplete fires exactly once --------------------------------
quest.update({ wheat: 1, veg: 2, levain: 1, bread: 1, nearBaker: true });
assert.strictEqual(quest.done, true, 'all steps satisfied -> done');
assert.strictEqual(completes, 1, 'onComplete fired once');

// extra updates must not re-fire onComplete
quest.update({ wheat: 9, veg: 9, levain: 9, bread: 9, nearBaker: true });
quest.update({ wheat: 1, veg: 1, levain: 1, bread: 1, nearBaker: true });
assert.strictEqual(completes, 1, 'onComplete still fired only once');

// --- reset clears completion -------------------------------------------------
quest.reset();
assert.strictEqual(quest.done, false, 'reset clears done');
quest.update({ wheat: 1, veg: 1, levain: 1, bread: 1, nearBaker: true });
assert.strictEqual(completes, 2, 'onComplete fires again after reset');

console.log('OK: quest.js builds, steps advance, onComplete guarded.');
