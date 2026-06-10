// main.js — プチヘルメースの谷（リアル3D散策版）ブートストラップ。
// 構成: terrain/sky/water/vegetation = 谷、buildings/interiors/props = 場所、
// character/npc = 人、hotspots/dialog/quests = 擬似体験、audio/petals = 空気感。

import * as THREE from './vendor/three.module.js';
import {
  SPAWN, WORLD_R, SCHOOL, FLOOR_Y, colliders,
  registerSchoolColliders, registerGymColliders, HOTSPOTS, BENCH_LUNCH,
} from './layout.js';
import { heightAt, surfaceAt, buildTerrain } from './terrain.js';
import { createSky } from './sky.js';
import { createWater } from './water.js';
import { createVegetation } from './vegetation.js';
import { buildSchool, buildGym } from './buildings.js';
import { buildInteriors } from './interiors.js';
import { buildProps } from './props.js';
import { makeHumanoid, PALETTES } from './character.js';
import { createNPCs } from './npc.js';
import { createControls } from './controls.js';
import { createTouchControls, isTouchDevice } from './touch.js';
import { step, segmentClearT, PLAYER_R } from './collide.js';
import { createHotspotLogic } from './hotspots.js';
import { createUI } from './dialog.js';
import { createQuestHUD } from './quests.js';
import { createPetals } from './petals.js';
import { createAudio } from './audio.js';
import {
  BREADS, JARS, CAFE_MENU, INFO, OSHITA_DIALOG, OSHITA_SHORT,
  BARISTA_DIALOG, VILLAGER_LINES, KID_LINES, createQuestChain,
} from './data.js';

// ---------------------------------------------------------------------------
// 設定
// ---------------------------------------------------------------------------
function loadSettings() {
  try { return { sound: true, ...JSON.parse(localStorage.getItem('world_settings') || '{}') }; }
  catch (e) { return { sound: true }; }
}
function saveSettings() {
  try { localStorage.setItem('world_settings', JSON.stringify(settings)); } catch (e) {}
}
const settings = loadSettings();
const touchMode = isTouchDevice();

// ---------------------------------------------------------------------------
// レンダラ / シーン / カメラ
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const PR_CAP = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(PR_CAP);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1400);
camera.rotation.order = 'YXZ';

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

// ---------------------------------------------------------------------------
// ワールド構築
// ---------------------------------------------------------------------------
const sky = createSky(THREE, scene);
scene.add(buildTerrain(THREE));
const water = createWater(THREE, scene);
createVegetation(THREE, scene);
buildSchool(THREE, scene);
buildGym(THREE, scene);
buildInteriors(THREE, scene);
buildProps(THREE, scene);
registerSchoolColliders();
registerGymColliders();
const npcs = createNPCs(THREE, scene);
const petals = createPetals(THREE, scene);

// ---------------------------------------------------------------------------
// プレイヤー
// ---------------------------------------------------------------------------
const player = {
  pos: new THREE.Vector3(SPAWN.x, heightAt(SPAWN.x, SPAWN.z), SPAWN.z),
  ry: SPAWN.ry, speed: 0,
};
const hero = makeHumanoid(THREE, PALETTES.player);
hero.group.position.copy(player.pos);
hero.group.rotation.y = player.ry;
scene.add(hero.group);

const controls = createControls(canvas, { yaw: Math.PI, pitch: -0.24 });
let touch = null;
if (touchMode) {
  touch = createTouchControls({
    root: document.body,
    onLook: (dx, dy) => controls.applyLook(dx, dy),
    onInteract: () => controls.queueInteract(),
  });
}

// ---------------------------------------------------------------------------
// UI / クエスト / 袋
// ---------------------------------------------------------------------------
const ui = createUI();
const hud = createQuestHUD();
const bagEl = document.getElementById('bag');
const bag = {
  items: [],
  add(it) { this.items.push(it); this.render(); },
  has(id) { return this.items.some((x) => x.id === id); },
  takeFirstFood() {
    const i = this.items.findIndex((x) => x.id !== 'rescue_bag');
    return i >= 0 ? this.items.splice(i, 1)[0] : null;
  },
  render() {
    bagEl.style.display = this.items.length ? 'block' : 'none';
    bagEl.textContent = `🛍 ふくろ ${this.items.length}点`;
  },
};

const chain = createQuestChain({
  onAdvance: (s, i) => { hud.set(s.banner, i + 1, chain.steps.length); sfx.open(); },
  onAllDone: () => {
    hud.setDone();
    sfx.fanfare();
    petals.burst(player.pos.x, player.pos.y + 1.6, player.pos.z);
    bag.add({ id: 'rescue_bag', name: 'ロスパン袋' });
    setTimeout(() => hud.showThanks(), 1600);
  },
});

const hotspots = createHotspotLogic(HOTSPOTS);
const sfx = createAudio();
sfx.setEnabled(settings.sound);

// ---------------------------------------------------------------------------
// インタラクション
// ---------------------------------------------------------------------------
let oshitaTalked = false, baristaTalked = false, villagerIdx = 0, kidIdx = 0;

function refreshQuest() {
  const s = chain.current();
  if (s) hud.set(s.banner, chain.index + 1, chain.steps.length);
}

function doAction(spot) {
  switch (spot.action) {
    case 'talk_oshita': {
      sfx.talk();
      const pages = oshitaTalked ? [OSHITA_SHORT[Math.floor(Math.random() * OSHITA_SHORT.length)]] : OSHITA_DIALOG;
      oshitaTalked = true;
      ui.showDialog(pages, () => { if (chain.credit('talk_oshita')) refreshQuest(); });
      break;
    }
    case 'shop':
      sfx.open();
      ui.showMenu({
        title: '🥖 プチヘルメース 店頭',
        sub: '「売り切れたらおしまい」の自家製酵母パン。今日の顔ぶれはこちら。',
        items: BREADS, buyLabel: '買う',
        picked: (id) => bag.has(id),
        onPick: (it) => {
          bag.add(it);
          sfx.buy();
          ui.toast(`👩‍🍳 ${it.name}、袋に入れますね。ありがとうございます🥖`);
          if (chain.credit('buy_bread')) refreshQuest();
        },
      });
      break;
    case 'jars': {
      sfx.open();
      const body = JARS.map((j) => `● ${j.name}\n　${j.story}`).join('\n\n');
      ui.showInfo('🫙 酵母の瓶棚', body, () => { if (chain.credit('see_jars')) refreshQuest(); });
      break;
    }
    case 'oven':
      sfx.open();
      ui.showInfo('🔥 石窯', '窯の奥で、次のカンパーニュがゆっくり膨らんでいる。\nパチ、パチ、と薪のはぜる音。\nあたたかい小麦の匂いが部屋いっぱいに広がる。');
      break;
    case 'cafe': {
      sfx.talk();
      const open = () => ui.showMenu({
        title: '☕ South in North',
        sub: '旧教室のカフェ。仕込みは廊下の先の旧給食室で。',
        items: CAFE_MENU, buyLabel: '注文する',
        picked: (id) => bag.has(id),
        onPick: (it) => {
          bag.add(it);
          sfx.buy();
          ui.toast(`👨‍🍳 ${it.name}どうぞ。校庭で食べてもいいよ🌿`);
          if (chain.credit('order_cafe')) refreshQuest();
        },
      });
      if (!baristaTalked) { baristaTalked = true; ui.showDialog(BARISTA_DIALOG, open); }
      else open();
      break;
    }
    case 'lunch': {
      const food = bag.takeFirstFood();
      if (!food) { ui.toast('🥖 まずはパン屋さんかカフェで なにか買ってこよう'); break; }
      sfx.eat();
      ui.showDialog([[
        '校庭ランチ',
        `ベンチにすわって、${food.name}をたべた。\n\n小麦と酵母のやさしい味。\n校庭を風がわたって、桜の花びらがひらり。\n\n……ごちそうさまでした。`,
      ]], () => { if (chain.credit('yard_lunch')) refreshQuest(); });
      petals.burst(BENCH_LUNCH.x, heightAt(BENCH_LUNCH.x, BENCH_LUNCH.z) + 1.6, BENCH_LUNCH.z);
      break;
    }
    case 'compost':
      sfx.open();
      ui.showInfo(INFO.compost.title, INFO.compost.body, () => { if (chain.credit('see_compost')) refreshQuest(); });
      break;
    case 'pray':
      sfx.pray();
      ui.showInfo(INFO.shrine.title, INFO.shrine.body, () => { if (chain.credit('pray')) refreshQuest(); });
      break;
    case 'talk_villager':
      sfx.talk();
      ui.showDialog([VILLAGER_LINES[villagerIdx++ % VILLAGER_LINES.length]]);
      break;
    case 'talk_kid':
      sfx.talk();
      ui.showDialog([KID_LINES[kidIdx++ % KID_LINES.length]]);
      break;
    case 'info': {
      sfx.open();
      const inf = INFO[spot.info];
      if (inf) ui.showInfo(inf.title, inf.body);
      break;
    }
  }
}

ui.promptEl.addEventListener('click', (e) => { e.stopPropagation(); controls.queueInteract(); });

// ---------------------------------------------------------------------------
// スタート画面 / ボタン
// ---------------------------------------------------------------------------
const overlay = document.getElementById('overlay');
const hint = document.getElementById('hint');
hint.textContent = touchMode
  ? '左スティックで移動｜右ドラッグで見回す｜タップで調べる'
  : 'WASD/矢印キーで移動｜ドラッグで見回す｜E で調べる';
hint.style.display = 'none';

let started = false;
overlay.addEventListener('click', (e) => {
  if (e.target.closest('a')) return;
  overlay.style.display = 'none';
  hint.style.display = 'block';
  if (!started) {
    started = true;
    refreshQuest();
    ui.toast('🚌 バスを降りた。坂の上に、なつかしい校舎が見える。', 3600);
  }
});

const btnSound = document.getElementById('btn-sound');
btnSound.textContent = settings.sound ? '🔊' : '🔇';
btnSound.addEventListener('click', () => {
  settings.sound = !settings.sound;
  sfx.setEnabled(settings.sound);
  btnSound.textContent = settings.sound ? '🔊' : '🔇';
  saveSettings();
});
const ZOOMS = [6.2, 3.6, 9.5];
let zoomIdx = 0;
document.getElementById('btn-cam').addEventListener('click', () => { zoomIdx = (zoomIdx + 1) % ZOOMS.length; });

// ---------------------------------------------------------------------------
// QA / デバッグフック（test-world/shot-qa.mjs が使う）
// ---------------------------------------------------------------------------
let viewOverride = null; // { x,y,z,yaw,pitch } — 自由カメラ
window.__view = (x, y, z, yaw = 0, pitch = -0.3) => { viewOverride = { x, y, z, yaw, pitch }; };
window.__follow = () => { viewOverride = null; };
window.__time = (t) => sky.setTime(t);
window.__warp = (x, z, ry = Math.PI) => {
  player.pos.set(x, heightAt(x, z), z);
  player.ry = ry;
  controls.state.yaw = ry;
  viewOverride = null;
};
window.__quest = chain;
window.__bag = bag;

// ---------------------------------------------------------------------------
// メインループ
// ---------------------------------------------------------------------------
let wasInside = false, stride = 0, boundaryToastT = 0;
const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  const busy = ui.isBusy();

  // --- 入力と移動 ---
  let f = 0, s = 0, jog = false;
  if (!busy && started) {
    const inp = controls.input();
    f = inp.f; s = inp.s; jog = inp.jog;
    if (touch) {
      f += -touch.move.z;
      s += touch.move.x;
      if (Math.hypot(touch.move.x, touch.move.z) > 0.85) jog = true;
    }
    const L = Math.hypot(f, s);
    if (L > 1) { f /= L; s /= L; }
  }
  const yaw = controls.state.yaw;
  const speed = (jog ? 5.4 : 3.0) * Math.hypot(f, s);
  if (speed > 0.01) {
    const wx = (Math.sin(yaw) * f + Math.sin(yaw - Math.PI / 2) * s);
    const wz = (Math.cos(yaw) * f + Math.cos(yaw - Math.PI / 2) * s);
    const mv = step(player.pos, wx * speed * dt, wz * speed * dt, heightAt, colliders, PLAYER_R);
    player.pos.x = mv.x; player.pos.z = mv.z;
    // 世界の縁
    const rr = Math.hypot(player.pos.x, player.pos.z);
    if (rr > WORLD_R) {
      player.pos.x *= WORLD_R / rr; player.pos.z *= WORLD_R / rr;
      if (performance.now() > boundaryToastT) {
        boundaryToastT = performance.now() + 6000;
        ui.toast('⛰ ここから先は山道。今日はこのへんで。');
      }
    }
    // キャラの向き
    const targetRy = Math.atan2(wx, wz);
    let diff = targetRy - player.ry;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.ry += diff * Math.min(1, dt * 10);
    // 足音
    stride += speed * dt;
    if (stride > (jog ? 2.1 : 1.7)) {
      stride = 0;
      sfx.footstep(surfaceAt(player.pos.x, player.pos.z));
    }
  }
  // 接地（なめらかに追従）
  const gy = heightAt(player.pos.x, player.pos.z);
  player.pos.y += (gy - player.pos.y) * Math.min(1, dt * 14);
  player.speed = speed;
  hero.group.position.copy(player.pos);
  hero.group.rotation.y = player.ry;
  hero.update(dt, speed);

  // --- 校舎の出入り（ドアチャイム） ---
  const inside = player.pos.x > SCHOOL.minX && player.pos.x < SCHOOL.maxX &&
                 player.pos.z > SCHOOL.minZ && player.pos.z < SCHOOL.maxZ;
  if (inside && !wasInside) { sfx.chime(); ui.toast('🔔 いらっしゃいませ'); }
  wasInside = inside;

  // --- カメラ ---
  if (viewOverride) {
    camera.position.set(viewOverride.x, viewOverride.y, viewOverride.z);
    camera.rotation.set(viewOverride.pitch, viewOverride.yaw, 0);
  } else {
    const pitch = controls.state.pitch;
    const head = new THREE.Vector3(player.pos.x, player.pos.y + 1.55, player.pos.z);
    const dist = inside ? Math.min(2.7, ZOOMS[zoomIdx]) : ZOOMS[zoomIdx];
    const dx = Math.sin(yaw) * Math.cos(pitch), dy = Math.sin(pitch), dz = Math.cos(yaw) * Math.cos(pitch);
    let cx = head.x - dx * dist, cy = head.y - dy * dist - Math.sin(pitch) * 0, cz = head.z - dz * dist;
    cy = head.y - dy * dist + 0.35;
    const t = segmentClearT(head.x, head.y, head.z, cx, cy, cz, heightAt, colliders, 0.3);
    cx = head.x + (cx - head.x) * t;
    cy = head.y + (cy - head.y) * t;
    cz = head.z + (cz - head.z) * t;
    camera.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 10));
    camera.lookAt(head.x + dx * 2, head.y + dy * 2 + 0.2, head.z + dz * 2);
  }

  // --- ワールド更新 ---
  const tNow = performance.now() * 0.001;
  water.update(tNow);
  sky.update(dt, player.pos);
  npcs.update(dt, player.pos);
  petals.update(dt, player.pos, heightAt);
  sfx.update(dt, player.pos, inside);

  // --- クエスト / ホットスポット ---
  if (started && !busy && chain.update(player.pos)) refreshQuest();
  const spot = busy ? null : hotspots.update(player.pos);
  ui.setPrompt(spot ? spot.label : null, touchMode ? '👆' : 'Ｅ');

  // --- インタラクト ---
  if (controls.consumeInteract()) {
    if (ui.isBusy()) ui.advanceDialog();
    else if (spot && started) doAction(spot);
  }

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);

// PWA（任意・失敗しても無害）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
