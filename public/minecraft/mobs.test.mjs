// mobs.test.mjs — Node test for mobs.js using a tiny stub THREE namespace.
// Run: node mobs.test.mjs
import assert from 'node:assert';
import { createMobs } from './mobs.js';

let passed = 0;
function check(name, cond) {
  assert.ok(cond, name);
  passed++;
  console.log('ok -', name);
}

// --- tiny stub THREE -------------------------------------------------------
class Color {
  constructor(c = 0) { this.value = c; }
  set(c) { this.value = c; return this; }
}
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
}
class BoxGeometry { constructor(w, h, d) { this.w = w; this.h = h; this.d = d; } }
class MeshBasicMaterial { constructor(o = {}) { this.color = new Color(o.color || 0); } }
class Object3D {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Vector3();
    this.scale = new Vector3(1, 1, 1);
    this.children = [];
    this.userData = {};
  }
  add(c) { this.children.push(c); return this; }
  remove(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); }
}
class Group extends Object3D {}
class Mesh extends Object3D {
  constructor(geo, matl) { super(); this.geometry = geo; this.material = matl; }
}
class Scene extends Object3D {}

const THREE = { Color, Vector3, BoxGeometry, MeshBasicMaterial, Group, Mesh, Object3D };

// --- stub opts -------------------------------------------------------------
const scene = new Scene();
let hurtTotal = 0;
const drops = [];
const player = { pos: { x: 0, y: 1, z: 0 }, yaw: 0 };

function makeOpts(over = {}) {
  return Object.assign({
    THREE,
    scene,
    // ground: everything at y<=0 is solid, above is air
    solidAt: (x, y, z) => y <= 0,
    groundKind: (x, y, z) => (y === 0 ? 'grass' : 'air'),
    player,
    onHurtPlayer: (d) => { hurtTotal += d; },
    addDrop: (id, n) => { drops.push([id, n]); },
    sfx: null,
    isNight: () => false,
    enabled: true,
  }, over);
}

// 1) builds
const mobs = createMobs(makeOpts());
check('createMobs returns api with expected methods',
  mobs && typeof mobs.update === 'function' && typeof mobs.attack === 'function' &&
  typeof mobs.setEnabled === 'function' && typeof mobs.clear === 'function' &&
  typeof mobs.count === 'function');

// 2) update runs many times without throwing
let threw = false;
try { for (let i = 0; i < 500; i++) mobs.update(0.1); } catch (e) { threw = true; console.error(e); }
check('500x update(0.1) without throwing', !threw);

// 3) spawning produced mobs over time (daytime -> passive on grass)
check('spawning produced mobs (count>0)', mobs.count() > 0);

// 4) soft cap respected
check('soft cap respected (count<=24)', mobs.count() <= 24);

// 5) spawned mob mesh added to scene
check('meshes added to scene', scene.children.length > 0);

// 6) attack can kill a mob -> count decreases
mobs.clear();
const pig = mobs._spawnMob('pig', 0, 1, 2); // 2 blocks in front (+z)
const before = mobs.count();
check('one pig spawned', before === 1 && pig);
// fire ray straight along +z from player eye; pig hp 10, dmg 50 = one-shot
let killedNull = null;
for (let i = 0; i < 5 && mobs.count() > 0; i++) {
  killedNull = mobs.attack({ x: 0, y: 1.5, z: 0 }, { x: 0, y: 0, z: 1 }, 5, 50);
}
check('attack reduced mob count to 0 (killed)', mobs.count() === 0);

// 7) attack returns null when nothing in the way
mobs.clear();
const miss = mobs.attack({ x: 0, y: 1.5, z: 0 }, { x: 0, y: 0, z: 1 }, 5, 10);
check('attack with no target returns null', miss === null);

// 8) clear empties everything
mobs._spawnMob('cow', 0, 1, 1);
mobs._spawnMob('zombie', 1, 1, 1);
check('mobs present before clear', mobs.count() === 2);
mobs.clear();
check('clear empties mobs', mobs.count() === 0);

// 9) hostile spawning at night on solid ground
const nightMobs = createMobs(makeOpts({ isNight: () => true }));
let nthrew = false;
try { for (let i = 0; i < 500; i++) nightMobs.update(0.1); } catch (e) { nthrew = true; console.error(e); }
check('night update runs + spawns hostiles', !nthrew && nightMobs.count() > 0);
nightMobs.clear();

// 10) creeper explosion damages the player and removes the creeper.
// (disable ambient spawning so we observe only the creeper we placed)
const cm = createMobs(makeOpts({ enabled: false }));
cm.setEnabled(true); // enabled, but we step the creeper manually below
const creeper = cm._spawnMob('creeper', 0, 1, 1.5); // within fuse distance (~2.5)
const hurtBefore = hurtTotal;
let exploded = false;
for (let i = 0; i < 40; i++) {
  cm.update(0.1); // run past the ~1.3s fuse
  if (creeper.dead) { exploded = true; break; }
}
check('creeper exploded (dead) and damaged player',
  exploded && hurtTotal > hurtBefore);
cm.clear();

// 11) spawnAt('baker', ...) increases count and the NPC persists.
const npc = createMobs(makeOpts({ enabled: false })); // no ambient spawns
const cBefore = npc.count();
const baker = npc.spawnAt('baker', 0, 1, 0);
check('spawnAt baker returns a mob and increases count',
  baker && npc.count() === cBefore + 1);
check('spawnAt mob is marked persistent', baker.persistent === true);

// move the player far away (well past the 64-block despawn) then step time:
// the persistent baker must NOT be culled.
player.pos.x = 1000; player.pos.z = 1000;
let bThrew = false;
try { for (let i = 0; i < 30; i++) npc.update(0.1); } catch (e) { bThrew = true; console.error(e); }
check('updates near persistent NPC do not throw', !bThrew);
check('persistent baker survives despawn distance', npc.count() === cBefore + 1 && !baker.dead);
player.pos.x = 0; player.pos.z = 0; // restore

// 12) attacking near a customer does not throw (and the customer is harmless,
// never dies even when hit repeatedly).
const customer = npc.spawnAt('customer', 0, 1, 2); // 2 blocks in front (+z)
let aThrew = false;
let hit = null;
try {
  for (let i = 0; i < 10; i++) {
    hit = npc.attack({ x: 0, y: 1.5, z: 0 }, { x: 0, y: 0, z: 1 }, 5, 50);
  }
} catch (e) { aThrew = true; console.error(e); }
check('attacking near a customer does not throw', !aThrew);
check('friendly customer hit but never dies (invincible)', !customer.dead);
npc.clear();

console.log(`\nAll ${passed} assertions passed.`);
