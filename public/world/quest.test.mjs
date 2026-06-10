// quest.test.mjs — クエストチェーン（純ロジック）とホットスポット近接の検証。
// Run: node quest.test.mjs
import assert from 'node:assert';
import { createQuestChain, QUESTS, BREADS, JARS, CAFE_MENU } from './data.js';
import { createHotspotLogic } from './hotspots.js';
import { HOTSPOTS } from './layout.js';

let passed = 0;
function check(name, cond) {
  assert.ok(cond, name);
  passed++;
  console.log('ok -', name);
}

// --- データ整合 -----------------------------------------------------------------
check('quest chain has 10 steps', QUESTS.length === 10);
check('bread lineup has signature campagne', BREADS.some((b) => b.id === 'campagne'));
check('6 yeast jars', JARS.length === 6);
check('cafe menu non-empty', CAFE_MENU.length >= 4);
for (const q of QUESTS) {
  check(`quest '${q.id}' is reach or event`, q.type === 'reach' ? Number.isFinite(q.x + q.z + q.r) : typeof q.event === 'string');
}
// event クエストのイベントに対応するホットスポットがあること
const actions = new Set(HOTSPOTS.map((h) => h.action));
const eventToAction = {
  talk_oshita: 'talk_oshita', buy_bread: 'shop', see_jars: 'jars',
  order_cafe: 'cafe', yard_lunch: 'lunch', see_compost: 'compost', pray: 'pray',
};
for (const q of QUESTS.filter((q) => q.type === 'event')) {
  check(`event '${q.event}' has a hotspot`, actions.has(eventToAction[q.event]));
}

// --- 進行: reach → event → 先取り credit → 完走 -----------------------------------
let advanced = 0, allDone = 0;
const chain = createQuestChain({
  onAdvance: () => advanced++,
  onAllDone: () => allDone++,
});
check('starts at step 0', chain.index === 0 && chain.current().id === 'arrive');
check('far position does not advance', chain.update({ x: 100, z: 100 }) === false && chain.index === 0);
check('reaching the yard advances', chain.update({ x: 0, z: 0 }) === true && chain.current().id === 'enter');
check('wrong event is held (not lost)', chain.credit('pray') === false && chain.index === 1);
chain.update({ x: -14, z: -40 }); // パン屋到達
check('now waiting for talk', chain.current().id === 'talk');
check('talk credit advances', chain.credit('talk_oshita') === true && chain.current().id === 'buy');
chain.credit('buy_bread');
chain.credit('see_jars');
chain.credit('order_cafe');
chain.credit('yard_lunch');
chain.credit('see_compost');
check('now bridge (reach)', chain.current().id === 'bridge');
chain.update({ x: 10, z: 66 });
// pray は冒頭で先取り済み → 橋到達と同時にスキップされ完走
check('prefetched pray auto-completes the chain', chain.done === true);
check('onAllDone fired exactly once', allDone === 1);
chain.credit('pray');
check('extra credits after done are harmless', allDone === 1);

// --- ホットスポット近接 ------------------------------------------------------------
const hs = createHotspotLogic([
  { id: 'a', x: 0, z: 0, r: 2 },
  { id: 'b', x: 1, z: 0, r: 2 },
]);
check('nearest spot wins', hs.update({ x: 0.9, z: 0 }).id === 'b');
check('outside range -> null', hs.update({ x: 50, z: 0 }) === null);

console.log(`\n${passed} checks passed`);
