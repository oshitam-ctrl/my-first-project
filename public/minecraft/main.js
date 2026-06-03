// Bootstrap: renderer, chunk streaming, player physics, desktop + touch input,
// UI, day/night, audio, particles, progressive mining, sharing, and PWA wiring.
import * as THREE from './vendor/three.module.js';
import { World, CHUNK, HEIGHT, SEA_LEVEL } from './world.js';
import { buildAtlas, buildWaterTexture, BLOCKS } from './blocks.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { isTouchDevice, createTouchControls } from './touch.js';
import { getSeed, setSeedInURL, seedToCode, shareSeed } from './share.js';
import { createInventory } from './inventory.js';
import { createMobs } from './mobs.js';
import { createQuest } from './quest.js';
import { createSky } from './sky.js';
import { itemDef, blockToItem, isFood } from './items.js';
import { createFermentation } from './fermentation.js';
import { createBakery } from './bakery.js';
import { createShop, SHOP_STOCK } from './shop.js';
import { createGuide } from './guide.js';

// ---------------------------------------------------------------------------
// Settings (persisted)
// ---------------------------------------------------------------------------
const DEFAULTS = { sens: 1.0, dist: 8, sound: true, shake: true, creative: true, mobs: true, music: true };
function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('mc_settings') || '{}') }; }
  catch (e) { return { ...DEFAULTS }; }
}
function saveSettings() {
  try { localStorage.setItem('mc_settings', JSON.stringify(settings)); } catch (e) {}
}
const settings = loadSettings();
const creative = settings.creative;   // creative: fly, instant break, infinite blocks, full palette

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const PR_CAP = Math.min(window.devicePixelRatio || 1, 1.5);
let curPR = PR_CAP;
function applyPR() {
  renderer.setPixelRatio(curPR);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
applyPR();

const scene = new THREE.Scene();
const SKY_DAY = new THREE.Color(0x8fc8ff);
scene.background = SKY_DAY.clone();
let RENDER_DIST = settings.dist;
scene.fog = new THREE.Fog(SKY_DAY.clone(), 1, 100);
function applyRenderDist() {
  RENDER_DIST = settings.dist;
  const fogFar = RENDER_DIST * CHUNK;
  scene.fog.near = fogFar * 0.45;
  scene.fog.far = fogFar;
}
applyRenderDist();

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);
const sky = createSky({ THREE, scene, camera, renderDist: RENDER_DIST });
let curSun = 1; // latest sun level (0 night .. 1 noon), updated in updateDayNight

// ---------------------------------------------------------------------------
// World + materials  (seed may come from a shared URL)
// ---------------------------------------------------------------------------
const seed = getSeed(20260530);
setSeedInURL(seed);
const world = new World(seed);
const { texture, cols, rows } = buildAtlas();
world.texture = texture;
world.atlasCols = cols;
world.atlasRows = rows;

const matOpaque = new THREE.MeshBasicMaterial({ map: texture, vertexColors: true, side: THREE.DoubleSide });
const matTrans = new THREE.MeshBasicMaterial({
  map: texture, vertexColors: true, side: THREE.DoubleSide,
  transparent: true, opacity: 0.78, depthWrite: false,
});

// Water: separate tiling texture so we can scroll its UV offset each frame
// without moving every other tile in the shared atlas.
const waterTex = buildWaterTexture();
const matWater = new THREE.MeshBasicMaterial({
  map: waterTex, vertexColors: true, side: THREE.DoubleSide,
  transparent: true, opacity: 0.72, depthWrite: false,
});

// Leaves: alpha-cutout (alphaTest punches holes through the foliage texture).
// Uses the shared atlas (leaf tiles have genuine alpha=0 holes painted in).
// transparent:false + alphaTest renders in the opaque pass (no per-frame
// sort overhead), while still discarding pixels below the threshold.
const matLeaf = new THREE.MeshBasicMaterial({
  map: texture, vertexColors: true,
  side: THREE.DoubleSide,
  alphaTest: 0.5, depthWrite: true,
});

// ---------------------------------------------------------------------------
// Audio + particles
// ---------------------------------------------------------------------------
const sfx = createAudio();
sfx.setEnabled(settings.sound);
sfx.setMusicEnabled(settings.music !== false); // generative BGM (starts on first gesture)
sfx.setAmbienceEnabled(true); // satoyama soundscape (birds/insects/wind/water), muted by master/sound off
const particles = createParticles(scene, THREE, 160);

// representative colour of a block, sampled once from the atlas (for debris)
const colorCache = {};
function blockColorHex(id) {
  if (colorCache[id] != null) return colorCache[id];
  let hex = 0x888888;
  const def = BLOCKS[id];
  if (def) {
    const tw = texture.image.width / cols;
    const tile = def.faces[2];
    const sx = (tile % cols) * tw + (tw >> 1);
    const sy = Math.floor(tile / cols) * tw + (tw >> 1);
    try {
      const d = texture.image.getContext('2d').getImageData(sx, sy, 1, 1).data;
      hex = (d[0] << 16) | (d[1] << 8) | d[2];
    } catch (e) {}
  }
  colorCache[id] = hex;
  return hex;
}

// ---------------------------------------------------------------------------
// Chunk streaming
// ---------------------------------------------------------------------------
const meshes = new Map(); // "cx,cz" -> { opaque, trans }
const dirty = new Set();

function buildChunkMeshes(cx, cz) {
  const groups = world.buildGeometry(cx, cz);
  const key = cx + ',' + cz;
  removeChunkMeshes(key);
  const entry = {};
  // NOTE: buildGeometry emits vertices in WORLD coordinates, so the mesh must
  // sit at the origin. (Offsetting by cx*CHUNK here double-counts the position
  // and tears the world into a grid of gaps that worsens with distance.)
  const og = world.makeMesh(groups.opaque);
  if (og) {
    const m = new THREE.Mesh(og, matOpaque);
    m.position.set(0, 0, 0);
    m.frustumCulled = true;
    scene.add(m);
    entry.opaque = m;
  }
  const tg = world.makeMesh(groups.trans);
  if (tg) {
    const m = new THREE.Mesh(tg, matTrans);
    m.position.set(0, 0, 0);
    m.renderOrder = 1;
    scene.add(m);
    entry.trans = m;
  }
  // Water: animated translucent pass with its own tiling texture
  const wg = world.makeMesh(groups.water);
  if (wg) {
    const m = new THREE.Mesh(wg, matWater);
    m.position.set(0, 0, 0);
    m.renderOrder = 2; // render after glass so depth reads correctly
    scene.add(m);
    entry.water = m;
  }
  // Leaves: alpha-cutout foliage pass
  const lg = world.makeMesh(groups.leaf);
  if (lg) {
    const m = new THREE.Mesh(lg, matLeaf);
    m.position.set(0, 0, 0);
    m.frustumCulled = true;
    scene.add(m);
    entry.leaf = m;
  }
  meshes.set(key, entry);
}

function removeChunkMeshes(key) {
  const e = meshes.get(key);
  if (!e) return;
  for (const m of [e.opaque, e.trans, e.water, e.leaf]) {
    if (!m) continue;
    scene.remove(m);
    m.geometry.dispose();
  }
  meshes.delete(key);
}

function markDirty(cx, cz) {
  if (meshes.has(cx + ',' + cz)) dirty.add(cx + ',' + cz);
}

function updateChunks() {
  const pcx = Math.floor(player.pos.x / CHUNK);
  const pcz = Math.floor(player.pos.z / CHUNK);

  // unload far chunks (frees GPU memory — critical on mobile)
  for (const key of meshes.keys()) {
    const [cx, cz] = key.split(',').map(Number);
    if (Math.abs(cx - pcx) > RENDER_DIST + 1 || Math.abs(cz - pcz) > RENDER_DIST + 1) {
      removeChunkMeshes(key);
    }
  }

  let budget = 3; // chunk meshes built per frame (smoother streaming while flying)
  const ring = [];
  for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
    for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
      ring.push([dx, dz, dx * dx + dz * dz]);
    }
  }
  ring.sort((a, b) => a[2] - b[2]);
  for (const [dx, dz] of ring) {
    if (budget <= 0) break;
    const cx = pcx + dx, cz = pcz + dz;
    if (!meshes.has(cx + ',' + cz)) {
      buildChunkMeshes(cx, cz);
      budget--;
    }
  }

  let db = 4;
  for (const key of dirty) {
    if (db-- <= 0) break;
    const [cx, cz] = key.split(',').map(Number);
    buildChunkMeshes(cx, cz);
    dirty.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
const SPAWN = { x: 8.5, y: 31, z: -12 }; // schoolyard, in front of the Petit Hermès entrance
const player = {
  pos: new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z),
  vel: new THREE.Vector3(),
  yaw: 0, pitch: -0.05, // yaw 0 faces -z, toward the school entrance
  onGround: false, fly: false,
  width: 0.6, height: 1.8, eye: 1.62,
  health: 20, hunger: 20, air: 10, _peakY: 0, dead: false, // survival stats
};
// debug/verification: reposition the camera (e.g. aerial view) from tests
window.__view = (x, y, z, yaw = 0, pitch = -0.85) => {
  player.pos.set(x, y, z); player.yaw = yaw; player.pitch = pitch; player.fly = true; player.vel.set(0, 0, 0);
};
window.__time = (t) => { dayTime = t; }; // debug: set time of day [0,1) (0.25=morning,0.5=noon,0.0/1.0=midnight)
window.__weather = (w) => sky.setWeather(w);
// Scripted-movement debug hook for headless escape tests.
// Usage: window.__sim.place(x, y, z) to teleport; __sim.pressKeys({Space,KeyW,...}) for up to N frames.
window.__sim = {
  // Teleport player into position (disables fly so physics apply)
  place(x, y, z, yaw = 0) {
    player.pos.set(x, y, z);
    player.vel.set(0, 0, 0);
    player.yaw = yaw;
    player.fly = false;
    player.onGround = false;
  },
  // Simulate pressing a set of keys for `frames` physics frames at dt seconds each.
  // keysDown: object like { Space: true, KeyW: true }
  pressKeys(keysDown, frames = 60, dt = 1 / 20) {
    Object.assign(keys, keysDown);
    playing = true;
    for (let i = 0; i < frames; i++) movePlayer(dt);
    // Clear the injected keys
    for (const k of Object.keys(keysDown)) keys[k] = false;
  },
  // Return a snapshot of player state
  state() {
    return { x: player.pos.x, y: player.pos.y, z: player.pos.z, vy: player.vel.y, onGround: player.onGround };
  },
};

const GRAVITY = 28;
const WALK = 5.2, SPRINT = 8.5, FLY = 11, JUMP = 9.2;

function collidesAt(px, py, pz) {
  const hw = player.width / 2;
  const x0 = Math.floor(px - hw), x1 = Math.floor(px + hw);
  const y0 = Math.floor(py), y1 = Math.floor(py + player.height - 0.001);
  const z0 = Math.floor(pz - hw), z1 = Math.floor(pz + hw);
  for (let y = y0; y <= y1; y++)
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++)
        if (world.isSolidAt(x, y, z)) return true;
  return false;
}

// Y-axis-only collision check: only tests the block slab introduced by the
// vertical movement from prevY to newY. Moving up checks only the new top row;
// moving down checks only the new bottom row. This prevents horizontal walls
// (that were already overlapping before the move) from blocking vertical movement,
// which matches Minecraft behavior and lets the player swim up past levee walls.
function collidesAtY(px, prevY, newY, pz) {
  const hw = player.width / 2;
  const x0 = Math.floor(px - hw), x1 = Math.floor(px + hw);
  const z0 = Math.floor(pz - hw), z1 = Math.floor(pz + hw);
  const h = player.height - 0.001;
  if (newY > prevY) {
    // Moving up: check only the new top layer(s)
    const oldTopY = Math.floor(prevY + h);
    const newTopY = Math.floor(newY + h);
    for (let y = oldTopY + 1; y <= newTopY; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          if (world.isSolidAt(x, y, z)) return true;
    return false;
  } else if (newY < prevY) {
    // Moving down: check only the new bottom layer(s)
    const oldBotY = Math.floor(prevY);
    const newBotY = Math.floor(newY);
    for (let y = newBotY; y < oldBotY; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++)
          if (world.isSolidAt(x, y, z)) return true;
    return false;
  }
  return false; // no movement
}

// Returns true if the player's AABB at (px,py,pz) overlaps any WATER block (id 7).
function inWaterAt(px, py, pz) {
  const hw = player.width / 2;
  const x0 = Math.floor(px - hw), x1 = Math.floor(px + hw);
  const y0 = Math.floor(py), y1 = Math.floor(py + player.height - 0.001);
  const z0 = Math.floor(pz - hw), z1 = Math.floor(pz + hw);
  for (let y = y0; y <= y1; y++)
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++)
        if (world.getBlock(x, y, z) === 7) return true;
  return false;
}

// Attempt auto-step-up: if horizontally blocked at current Y but clear one
// block higher, snap the player up onto the ledge (max step height 1.0).
// Only active when on or near the ground (not while airborne / jumping high).
// Returns true if the step succeeded.
function tryStepUp(newX, newZ) {
  const p = player.pos;
  // Only step when near the ground (prevents climbing walls mid-air)
  if (player.vel.y > 1.0) return false;
  const STEP_MAX = 1.0;
  // Find the exact height to step to: scan upward from current foot + epsilon
  for (let s = 0.25; s <= STEP_MAX; s += 0.25) {
    const stepY = p.y + s;
    if (!collidesAt(newX, stepY, newZ) && !collidesAt(newX, stepY, p.z) && !collidesAt(p.x, stepY, newZ)) {
      // Make sure head has clearance at the new position
      if (!collidesAt(newX, stepY, newZ)) {
        p.y = stepY;
        player.vel.y = 0;
        player.onGround = true;
        return true;
      }
    }
  }
  return false;
}

// Buoyancy / swim-up constants
const SWIM_UP_VEL   = 4.5;  // upward velocity when holding jump in water
const BUOYANCY_ACC  = 10.0; // upward acceleration countering gravity (makes sinking slow)
const BUOYANCY_DAMP = 0.7;  // horizontal drag factor while in water (per second)

let stepTimer = 0;
function movePlayer(dt) {
  // unified input: keyboard + touch joystick
  let moveF = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
  let moveR = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
  if (touch) { moveF += -touch.move.z; moveR += touch.move.x; }

  const input = new THREE.Vector3();
  const f = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const r = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  input.addScaledVector(f, moveF);
  input.addScaledVector(r, moveR);
  if (input.lengthSq() > 1) input.normalize();

  const speed = player.fly ? FLY : keys['ShiftLeft'] ? SPRINT : WALK;
  player.vel.x = input.x * speed;
  player.vel.z = input.z * speed;

  const jumpHeld = keys['Space'] || touchJump;

  // Check if the player is currently inside water (feet or body)
  const p = player.pos;
  const swimming = !player.fly && inWaterAt(p.x, p.y, p.z);

  if (player.fly) {
    let vy = 0;
    if (jumpHeld || touchVert > 0) vy += FLY;
    if (keys['ShiftLeft'] || touchVert < 0) vy -= FLY;
    player.vel.y = vy;
  } else if (swimming) {
    // In water: apply buoyancy to slow sinking, swim up on jump.
    // Buoyancy partially counters gravity so the player sinks slowly.
    player.vel.y += (-GRAVITY + BUOYANCY_ACC) * dt;
    // Clamp downward velocity so sinking is slow (not freefall)
    if (player.vel.y < -2.0) player.vel.y = -2.0;
    // Swim up when jump is held
    if (jumpHeld) {
      player.vel.y = SWIM_UP_VEL;
    }
    // Light horizontal drag in water
    const drag = Math.pow(BUOYANCY_DAMP, dt);
    player.vel.x *= drag;
    player.vel.z *= drag;
  } else {
    player.vel.y -= GRAVITY * dt;
    if (jumpHeld && player.onGround) { player.vel.y = JUMP; player.onGround = false; }
  }

  // --- X movement with auto-step-up ---
  p.x += player.vel.x * dt;
  if (collidesAt(p.x, p.y, p.z)) {
    // Try to step up over a ≤1-block ledge before reverting
    if (!tryStepUp(p.x, p.z)) {
      p.x -= player.vel.x * dt; player.vel.x = 0;
    }
  }
  // --- Z movement with auto-step-up ---
  p.z += player.vel.z * dt;
  if (collidesAt(p.x, p.y, p.z)) {
    if (!tryStepUp(p.x, p.z)) {
      p.z -= player.vel.z * dt; player.vel.z = 0;
    }
  }

  player.onGround = false;
  const vyBefore = player.vel.y;
  const prevY = p.y;
  p.y += player.vel.y * dt;
  // Y-collision: only check the new block layer swept by the move (not side walls
  // that were already overlapping before the move). This lets the player swim up
  // past a levee wall they're already touching horizontally.
  if (collidesAtY(p.x, prevY, p.y, p.z)) {
    if (player.vel.y <= 0) player.onGround = true;
    p.y = prevY;
    player.vel.y = 0;
  }
  // fall damage on landing (survival; applyDamage no-ops in creative/fly)
  if (player.onGround) {
    if (vyBefore < -0.1 && !player.fly) applyDamage(Math.max(0, Math.floor((player._peakY || p.y) - p.y) - 3));
    player._peakY = p.y;
  } else {
    player._peakY = Math.max(player._peakY || p.y, p.y);
  }

  if (p.y < -20) {
    p.set(SPAWN.x, SPAWN.y, SPAWN.z);
    player.vel.set(0, 0, 0);
    player._peakY = p.y;
  }

  // footsteps
  const movingGround = !player.fly && player.onGround && (player.vel.x !== 0 || player.vel.z !== 0);
  if (movingGround) {
    stepTimer += dt;
    if (stepTimer > 0.34) { sfx.step(); stepTimer = 0; }
  } else stepTimer = 0.34;
}

let shakeMag = 0;
function syncCamera() {
  camera.position.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  if (shakeMag > 0.001) {
    camera.position.x += (Math.random() - 0.5) * shakeMag;
    camera.position.y += (Math.random() - 0.5) * shakeMag;
    camera.position.z += (Math.random() - 0.5) * shakeMag;
  }
  const dir = new THREE.Vector3(
    -Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch),
    -Math.cos(player.yaw) * Math.cos(player.pitch)
  );
  camera.lookAt(camera.position.clone().add(dir));
}

function applyLook(dx, dy, scale) {
  player.yaw -= dx * scale;
  player.pitch -= dy * scale;
  const lim = Math.PI / 2 - 0.01;
  player.pitch = Math.max(-lim, Math.min(lim, player.pitch));
}

// --- survival: health / hunger / damage (no effect in creative) ----------
const statsCanvas = document.getElementById('stats');
const sctx = statsCanvas.getContext('2d');
const hurtEl = document.getElementById('hurt');

function applyDamage(n) {
  if (creative || player.dead || n <= 0) return;
  if (inv.holdingShield()) n *= 0.35;                          // blocking with a shield
  n *= 1 - Math.min(0.8, inv.armorPoints() * 0.04);            // armor: 4%/point, cap 80%
  if (n <= 0.01) return;
  player.health = Math.max(0, player.health - n);
  sfx.hurt();
  hurtEl.style.opacity = '0.85';
  setTimeout(() => { hurtEl.style.opacity = '0'; }, 110);
  if (settings.shake) shakeMag = Math.max(shakeMag, 0.22);
  if (player.health <= 0) die();
}
function die() {
  player.dead = true;
  toast('やられた… リスポーンします');
  setTimeout(() => {
    player.pos.set(SPAWN.x, SPAWN.y, SPAWN.z);
    player.vel.set(0, 0, 0);
    player.health = 20; player.hunger = 20; player.air = 10; player._peakY = player.pos.y;
    player.dead = false;
  }, 900);
}
function updateSurvival(dt) {
  if (creative || player.dead) return;
  player.hunger = Math.max(0, player.hunger - dt * 0.05); // slow drain
  if (player.hunger >= 18 && player.health < 20) {        // natural regen
    player.health = Math.min(20, player.health + dt * 0.6);
    player.hunger = Math.max(0, player.hunger - dt * 0.1);
  } else if (player.hunger <= 0 && player.health > 1) {   // starve (floors at 1)
    player.health = Math.max(1, player.health - dt * 0.4);
  }
  const headId = world.getBlock(Math.floor(player.pos.x), Math.floor(player.pos.y + player.eye), Math.floor(player.pos.z));
  if (headId === 7) { player.air -= dt; if (player.air <= 0) applyDamage(dt * 2); } // drowning
  else player.air = 10;
}
function heartPath(c, x, y, s) {
  const r = s * 0.29;
  c.beginPath();
  c.arc(x + s * 0.3, y + s * 0.32, r, Math.PI, 0);
  c.arc(x + s * 0.7, y + s * 0.32, r, Math.PI, 0);
  c.lineTo(x + s * 0.5, y + s * 0.95);
  c.closePath();
}
function icon(c, x, y, fill, color) {
  c.fillStyle = 'rgba(0,0,0,0.45)'; heartPath(c, x, y, 11); c.fill();
  if (fill > 0) {
    c.save();
    if (fill < 1) { c.beginPath(); c.rect(x, y, 5.5, 11); c.clip(); }
    c.fillStyle = color; heartPath(c, x, y, 11); c.fill();
    c.restore();
  }
}
window.__player = () => ({ health: player.health, hunger: player.hunger, air: player.air });
window.__hurt = (n) => applyDamage(n); // debug/verification
function drawStats() {
  if (creative) { if (statsCanvas.style.display !== 'none') statsCanvas.style.display = 'none'; return; }
  statsCanvas.style.display = 'block';
  sctx.clearRect(0, 0, 220, 44);
  for (let i = 0; i < 10; i++) {
    const x = 4 + i * 21;
    const hp = player.health - i * 2;
    icon(sctx, x, 2, hp >= 2 ? 1 : hp >= 1 ? 0.5 : 0, '#e23b3b');
    const f = player.hunger - i * 2;
    icon(sctx, x, 24, f >= 2 ? 1 : f >= 1 ? 0.5 : 0, '#c98a3a');
  }
}

// ---------------------------------------------------------------------------
// Block targeting + highlight + progressive mining (crack stages)
// ---------------------------------------------------------------------------
const hlEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
);
hlEdges.visible = false;
scene.add(hlEdges);

// crack overlay
const CRACK_STAGES = 6;
const crackTex = [];
for (let s = 0; s < CRACK_STAGES; s++) crackTex.push(makeCrackTexture(s, CRACK_STAGES));
const crackMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: crackTex[0] });
const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), crackMat);
crackMesh.visible = false;
scene.add(crackMesh);

function makeCrackTexture(stage, stages) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 16, 16);
  x.strokeStyle = 'rgba(0,0,0,0.6)';
  x.lineWidth = 1;
  const segs = Math.round(((stage + 1) / stages) * 9);
  for (let i = 0; i < segs; i++) {
    let px = 8, py = 8;
    x.beginPath();
    x.moveTo(px, py);
    const steps = 2 + ((i * 7 + stage) % 3);
    for (let k = 0; k < steps; k++) {
      px += ((i * 53 + k * 29 + stage * 7) % 11) - 5;
      py += ((i * 31 + k * 17 + stage * 13) % 11) - 5;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

function currentTarget() {
  const origin = camera.position.clone();
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  return world.raycast(origin, dir, 7);
}

// Mining time depends on block hardness and the held tool; harvesting (getting
// a drop) requires a tool of the right class and tier.
const TIER_RANK = { hand: 0, wood: 1, stone: 2, iron: 3, diamond: 4 };
function breakTimeFor(id) {
  const b = BLOCKS[id];
  if (!b) return 0.3;
  const hard = b.hardness == null ? 0.3 : b.hardness;
  if (!isFinite(hard)) return Infinity; // bedrock
  const tool = inv.heldTool();
  const speed = (tool && b.tool && tool.class === b.tool) ? tool.speed : 1;
  return Math.max(0.12, (hard * 0.6) / speed);
}
function canHarvest(id) {
  const b = BLOCKS[id];
  if (!b) return false;
  if (b.tier == null) return true;
  const tool = inv.heldTool();
  return !!(tool && b.tool && tool.class === b.tool && TIER_RANK[tool.tier] >= TIER_RANK[b.tier]);
}

let breakTarget = null;
let breakProgress = 0;
let creativeBreakCD = 0;   // throttle for creative instant-break while held
let _prevCrackStage = -1;  // track crack stage advances for per-hit feedback

function sameBlock(a, b) { return b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }

// ---------------------------------------------------------------------------
// Eating animation state
// ---------------------------------------------------------------------------
// eatState: null when idle, or an object during the eat animation.
// Lifecycle: startEat() -> updateEat(dt) each frame -> finishEat() / cancelEat()
// ---------------------------------------------------------------------------
const EAT_DUR = 1.25;           // total animation duration (seconds)
const EAT_BITES = 3;            // number of bite bobs
const EAT_BOB_FREQ = EAT_BITES / EAT_DUR; // bobs per second
let eatState = null;            // null or { itemId, t, colorHex, slotAtStart, nextSfxT, nextPartT }

// Exposed via window so the viewmodel (inside the IIFE) can read the eat pose offsets.
// Returns null when not eating, or { raiseFrac, bobY } for viewmodel to apply.
window._eatAnimPose = function () { return eatState ? eatState._pose : null; };

function startEat() {
  if (eatState) return;  // already eating
  const itemId = inv.selectedItem();
  if (!itemId || !isFood(itemId)) return;
  const def = itemDef(itemId);
  if (!def || !def.food) return;
  // Don't eat if hunger is already full (survival mechanic like Minecraft)
  if (!creative && player.hunger >= 20) return;
  const colorHex = def.color != null ? def.color : 0xddaa55;
  eatState = {
    itemId,
    t: 0,
    colorHex,
    slotAtStart: inv.selected,
    nextSfxT: 0,      // time of next sfx.eat() call
    nextPartT: 0,     // time of next particle burst
    _pose: { raiseFrac: 0, bobY: 0 },
  };
}

function cancelEat() {
  eatState = null;
}

function updateEat(dt) {
  if (!eatState) return;

  // Cancel conditions: mining, UI open, slot change
  if (breakHeld || inv.isOpen() ||
      (typeof bakery !== 'undefined' && bakery && typeof bakery.isOpen === 'function' && bakery.isOpen()) ||
      eatState.slotAtStart !== inv.selected) {
    cancelEat();
    return;
  }

  eatState.t += dt;
  const frac = Math.min(1, eatState.t / EAT_DUR);  // 0→1 over animation

  // --- raise-toward-center: lerp from base offset toward center top-of-screen
  // We express as a 0→1 "raise fraction" that the viewmodel will interpolate
  const raiseFrac = frac < 0.85 ? (frac / 0.85) : 1.0;

  // --- bite bob: sinusoidal up-down, ~3 bobs during the animation
  // Amplitude grows then fades at the end (last 15% = completion)
  const bobAmp = frac < 0.85 ? Math.min(1, frac * 3) * 0.045 : 0;
  const bobY = Math.sin(frac * EAT_BITES * Math.PI * 2) * bobAmp;

  eatState._pose.raiseFrac = raiseFrac;
  eatState._pose.bobY = bobY;

  // --- sound: play sfx.eat() a couple times during the animation
  if (eatState.t >= eatState.nextSfxT && frac < 0.9) {
    if (typeof sfx.eat === 'function') sfx.eat();
    eatState.nextSfxT = eatState.t + 0.38;
  }

  // --- particles: emit food-colored debris near camera each ~0.22s
  if (eatState.t >= eatState.nextPartT && frac < 0.9) {
    // Emit near the crosshair (slightly in front of camera)
    const dir = new THREE.Vector3();
    try { camera.getWorldDirection(dir); } catch (e) {}
    const px = camera.position.x + dir.x * 0.5;
    const py = camera.position.y + dir.y * 0.5 - 0.08;
    const pz = camera.position.z + dir.z * 0.5;
    try {
      particles.burst(px, py, pz, eatState.colorHex, 4, 1.2);
    } catch (e) {}
    eatState.nextPartT = eatState.t + 0.22;
  }

  // --- finish: animation complete → apply food effect
  if (eatState.t >= EAT_DUR) {
    const def = itemDef(eatState.itemId);
    const hunger = def && def.food ? def.food.hunger : 0;
    // consume one item from the slot
    if (inv.consumeSelected(1)) {
      if (!creative) {
        player.hunger = Math.min(20, player.hunger + hunger);
        // Small health regen bonus like Minecraft
        player.health = Math.min(20, player.health + 0.5);
      }
      // Celebratory particle burst + crosshair flash
      try {
        particles.burst(
          camera.position.x + 0,
          camera.position.y - 0.1,
          camera.position.z + 0,
          eatState.colorHex, 10, 1.8
        );
      } catch (e) {}
      flashCrosshair('#' + (eatState.colorHex).toString(16).padStart(6, '0'));
    }
    cancelEat();
  }
}

// Debug hook: allow tests to trigger eating (survival scenario)
window.__eat = () => startEat();

function applyEdit(cx, cz, wx, wy, wz) {
  markDirty(cx, cz);
  const lx = wx - cx * CHUNK, lz = wz - cz * CHUNK;
  if (lx === 0) markDirty(cx - 1, cz);
  if (lx === CHUNK - 1) markDirty(cx + 1, cz);
  if (lz === 0) markDirty(cx, cz - 1);
  if (lz === CHUNK - 1) markDirty(cx, cz + 1);
}

let freezeUntil = 0;
function doBreak(x, y, z, id) {
  world.setBlock(x, y, z, 0);
  applyEdit(Math.floor(x / CHUNK), Math.floor(z / CHUNK), x, y, z);
  particles.burst(x + 0.5, y + 0.5, z + 0.5, blockColorHex(id), 18, 3.4);
  sfx.break(id);
  freezeUntil = performance.now() + 55;            // hit-pause
  if (settings.shake) shakeMag = 0.12;             // screen kick (toggleable)
  // drops -> inventory (only with the right tool/tier), then wear the tool
  const b = BLOCKS[id];
  if (b && b.drop !== null && canHarvest(id)) {
    const dropId = b.drop !== undefined ? b.drop : blockToItem(id);
    if (dropId) inv.collect(dropId, b.dropCount || 1);
  }
  inv.damageHeldTool(1);
}

function placeBlock() {
  const sdef = inv.selectedDef();
  if (sdef && sdef.magic) { castMagic(sdef.magic); return; } // wands cast instead of placing

  // --- Eating: if holding a food item, start the eat animation instead of placing ---
  const heldId = inv.selectedItem();
  if (heldId && isFood(heldId)) { startEat(); return; }

  const hit = currentTarget();
  if (!hit) return;
  // right-click / tap on an interactive block opens it instead of placing
  const targetId = world.getBlock(hit.block[0], hit.block[1], hit.block[2]);
  if (targetId === 20) { toggleInv(3); return; }   // crafting table -> 3x3
  const [x, y, z] = hit.place;
  if (y < 1 || y >= HEIGHT) return;
  const hw = player.width / 2 + 0.02;
  const p = player.pos;
  if (x + 1 > p.x - hw && x < p.x + hw &&
      y + 1 > p.y && y < p.y + player.height &&
      z + 1 > p.z - hw && z < p.z + hw) return;
  if (world.getBlock(x, y, z) !== 0) return;
  const itemId = inv.selectedItem();
  const def = itemId && itemDef(itemId);
  if (!def || def.block == null || !BLOCKS[def.block]) return; // not a placeable block
  if (!inv.consumeSelected(1)) return;
  const id = def.block;
  world.setBlock(x, y, z, id);
  applyEdit(Math.floor(x / CHUNK), Math.floor(z / CHUNK), x, y, z);
  particles.burst(x + 0.5, y + 0.5, z + 0.5, blockColorHex(id), 6, 1.6);
  sfx.place(id);
  vmSwing(); // viewmodel swing on block place
}

function updateMining(dt) {
  const hit = playing ? currentTarget() : null;
  if (hit) {
    hlEdges.visible = true;
    hlEdges.position.set(hit.block[0] + 0.5, hit.block[1] + 0.5, hit.block[2] + 0.5);
  } else {
    hlEdges.visible = false;
  }

  if (breakHeld && hit && playing && !inv.isOpen()) {
    // Cancel any active eating when mining starts
    if (eatState) cancelEat();

    const [x, y, z] = hit.block;
    const id = world.getBlock(x, y, z);
    const hard = breakTimeFor(id);
    if (!isFinite(hard)) { breakProgress = 0; crackMesh.visible = false; _prevCrackStage = -1; return; } // bedrock
    if (creative) { // instant break with a small throttle while held
      creativeBreakCD -= dt;
      if (creativeBreakCD <= 0) { doBreak(x, y, z, id); creativeBreakCD = 0.18; vmSwing(); }
      crackMesh.visible = false;
      return;
    }
    if (!sameBlock(hit.block, breakTarget)) {
      breakTarget = hit.block.slice(); breakProgress = 0; _prevCrackStage = -1;
      vmSwing(); // viewmodel swing when starting to mine a new block
    }
    breakProgress += dt / hard;
    const s = Math.min(CRACK_STAGES - 1, Math.floor(breakProgress * CRACK_STAGES));

    // --- Mining hit feedback: trigger on each new crack stage ---
    if (s !== _prevCrackStage && _prevCrackStage >= 0) {
      // Hand swing for each hit
      vmSwing();
      // Camera recoil — intensifies with progress (more shake at higher stages)
      const recoilMag = 0.04 + breakProgress * 0.06;
      if (settings.shake) shakeMag = Math.max(shakeMag, recoilMag);
      // Debris particles flying off the hit block face toward the camera
      // Use a modest count so it doesn't overwhelm; count grows with progress
      const debrisCount = 2 + Math.floor(breakProgress * 4);
      try {
        // Shoot debris slightly toward the camera (biased away from block center)
        const dir = new THREE.Vector3();
        try { camera.getWorldDirection(dir); } catch (_e) {}
        // Offset spawn slightly in the camera direction to avoid z-fighting
        const px = x + 0.5 - dir.x * 0.3;
        const py = y + 0.5 - dir.y * 0.3;
        const pz = z + 0.5 - dir.z * 0.3;
        // Spread is modest so debris feels like chips, not an explosion
        const spread = 1.0 + breakProgress * 1.2;
        particles.burst(px, py, pz, blockColorHex(id), debrisCount, spread);
      } catch (_e) {}
    }
    _prevCrackStage = s;

    crackMat.map = crackTex[s];
    crackMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    crackMesh.visible = true;
    if (breakProgress >= 1) {
      doBreak(x, y, z, id);
      breakProgress = 0; breakTarget = null; crackMesh.visible = false; _prevCrackStage = -1;
    }
  } else {
    breakProgress = 0; breakTarget = null; crackMesh.visible = false; creativeBreakCD = 0; _prevCrackStage = -1;
  }
}

// ---------------------------------------------------------------------------
// Input — desktop (keyboard + pointer lock) and shared state
// ---------------------------------------------------------------------------
const keys = {};
let playing = false;
let breakHeld = false;
let touchJump = false;
let touchVert = 0;
let lastSpace = 0;
let locked = false;      // desktop pointer lock active
let dragging = false;    // desktop drag-to-look fallback (when pointer lock is unavailable)
let dragMoved = 0;

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) e.preventDefault();
  if (inv.isOpen()) { if (e.code === 'Escape' || e.code === 'KeyE' || e.code === 'KeyI') toggleInv(); return; }
  if ((e.code === 'KeyE' || e.code === 'KeyI') && playing) { toggleInv(2); return; }
  if (e.code === 'Escape' && playing && !locked) { // pause when not using pointer lock
    playing = false; breakHeld = false; overlay.style.display = 'flex'; return;
  }
  if (keys[e.code]) return;
  keys[e.code] = true;
  if (e.code === 'Space') {
    const now = performance.now();
    if (now - lastSpace < 280) player.fly = !player.fly;
    lastSpace = now;
  }
  if (/^Digit[1-9]$/.test(e.code)) {
    inv.setSelected(parseInt(e.code.slice(5), 10) - 1);
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

const overlay = document.getElementById('overlay');
let shownDesktopHint = false;
function startPlay() {
  sfx.resume();
  playing = true;                 // start regardless of pointer lock support
  overlay.style.display = 'none';
  if (!isTouch) { try { canvas.requestPointerLock(); } catch (e) {} } // mouse-look enhancement only
  // One-time desktop controls hint: the 🎒 button can't be clicked while the
  // mouse is pointer-locked, so make the keyboard shortcut obvious.
  if (!isTouch && !shownDesktopHint) {
    shownDesktopHint = true;
    toast('⌨️ 移動:WASD ／ アイテム:E または I ／ 工房:🥖（右上）／ 飛ぶ:Space×2');
  }
}
overlay.addEventListener('click', startPlay);
// iOS Safari may not synthesize a `click` on a non-interactive <div> when
// `touch-action: none` is set, so also start on `touchend` (which doubles as
// the required user-gesture to unlock Web Audio). preventDefault avoids a
// duplicate synthesized click.
overlay.addEventListener('touchend', (e) => { e.preventDefault(); startPlay(); }, { passive: false });

// desktop pointer lock (optional — game runs with or without it)
document.addEventListener('pointerlockchange', () => {
  const wasLocked = locked;
  locked = document.pointerLockElement === canvas;
  if (!locked) breakHeld = false;
  if (!locked && wasLocked && !inv.isOpen()) { // Esc out of lock -> pause (unless opening inventory)
    playing = false;
    overlay.style.display = 'flex';
  }
});
document.addEventListener('mousemove', (e) => {
  if (!playing || isTouch || inv.isOpen()) return;
  // Locked: smooth FPS look. Not locked: rotate only while dragging the mouse.
  if (locked || dragging) {
    applyLook(e.movementX, e.movementY, 0.0022 * settings.sens);
    if (!locked) {
      dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
      if (dragMoved > 6) breakHeld = false; // a look-drag, not mining
    }
  }
});
document.addEventListener('mousedown', (e) => {
  if (!playing || isTouch || inv.isOpen()) return;
  if (e.button === 0) {
    if (tryAttackMob()) return;
    breakHeld = true;
    if (!locked) { dragging = true; dragMoved = 0; }
  } else if (e.button === 2) {
    placeBlock();
  }
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 0) { breakHeld = false; dragging = false; }
});
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('wheel', (e) => {
  if (!playing || inv.isOpen()) return;
  inv.scroll(e.deltaY > 0 ? 1 : -1);
});

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener('resize', onResize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
window.addEventListener('beforeunload', () => world.saveEdits());

// pause + save when the tab is hidden (mobile rarely fires beforeunload)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { paused = true; world.saveEdits(); }
  else { paused = false; last = performance.now(); }
});

// ---------------------------------------------------------------------------
// Touch input
// ---------------------------------------------------------------------------
const isTouch = isTouchDevice();
let touch = null;
if (isTouch) {
  document.body.classList.add('touch');
  touch = createTouchControls({
    root: document.body,
    isFlying: () => player.fly,
    onLook: (dx, dy) => { if (playing) applyLook(dx, dy, 0.004 * settings.sens); },
    // First in-game touch also (re)unlocks audio on mobile — belt-and-suspenders
    // in case the start-overlay gesture didn't unlock the AudioContext.
    onPlace: () => { sfx.resume(); if (playing) placeBlock(); },
    onBreakStart: () => { sfx.resume(); if (playing && !tryAttackMob()) breakHeld = true; },
    onBreakEnd: () => { breakHeld = false; },
    onJump: (down) => { if (down) sfx.resume(); touchJump = down; },
    onToggleFly: () => { player.fly = !player.fly; },
    onVertical: (dir) => { touchVert = dir; },
  });
}

// ---------------------------------------------------------------------------
// Hotbar UI
// ---------------------------------------------------------------------------
const inv = createInventory({ texture, cols, sfx, creative, onSelect: () => {} });
inv.mountHotbar(document.getElementById('hotbar'));

// Open/close the inventory, freeing the mouse cursor (desktop) for slot clicks.
function toggleInv(size = 2) {
  inv.toggleScreen(size);
  if (inv.isOpen()) {
    if (!isTouch && document.pointerLockElement) document.exitPointerLock();
  } else if (!isTouch && playing) {
    canvas.requestPointerLock();
  }
}

// Inventory button in the top bar (works for touch + desktop).
{
  const b = document.createElement('button');
  b.textContent = '🎒'; b.title = 'インベントリ (E)';
  b.addEventListener('click', (e) => { e.stopPropagation(); sfx.resume(); if (playing) toggleInv(2); });
  const tb = document.getElementById('topbar');
  if (tb) tb.insertBefore(b, tb.firstChild);
}

// About / story panel (Petit Hermès worldview) — title link + in-game ℹ️ button.
{
  const about = document.getElementById('about');
  const show = (e) => { if (e) { e.stopPropagation(); e.preventDefault(); } if (about) about.style.display = 'flex'; };
  const hide = (e) => { if (e) e.stopPropagation(); if (about) about.style.display = 'none'; };
  const link = document.getElementById('about-link');
  if (link) { link.addEventListener('click', show); link.addEventListener('touchend', show, { passive: false }); }
  const close = document.getElementById('about-close');
  if (close) close.addEventListener('click', hide);
  if (about) about.addEventListener('click', (e) => { if (e.target === about) hide(); });
  const ib = document.createElement('button');
  ib.textContent = 'ℹ️'; ib.title = 'プチヘルメースについて';
  ib.addEventListener('click', (e) => { e.stopPropagation(); show(); });
  const tb2 = document.getElementById('topbar');
  if (tb2) tb2.insertBefore(ib, tb2.firstChild);
}

// ---------------------------------------------------------------------------
// First-person held-item viewmodel (Minecraft-style, bottom-right)
// ---------------------------------------------------------------------------
// Rendered as a THREE.Group in the scene, repositioned every frame to sit in
// camera-view space (right/down/forward offset from camera). We deliberately
// avoid camera.add() so the stub (which has no Object3D hierarchy) stays safe.
// All THREE API calls are guarded with optional-chaining / null checks so the
// headless test with the full-stub never throws.
// ---------------------------------------------------------------------------
(function () {
  // ---- constants -----------------------------------------------------------
  const VM_X =  0.26;   // right offset in camera space
  const VM_Y = -0.20;   // down offset  in camera space
  const VM_Z =  0.45;   // distance in front of camera (forward along camera -Z)

  // ---- state ---------------------------------------------------------------
  let vmLastSlot = -1;  // track selected slot to rebuild mesh on change
  let vmGroup = null;   // THREE.Group that holds the mesh(es)
  let vmMesh = null;    // the current held-item mesh (child of vmGroup)
  let vmIconCanvas = null; // off-screen canvas for item-icon texture
  let vmIconCtx = null;
  let vmIconTex = null; // THREE.CanvasTexture

  // animation state
  let vmBobT = 0;       // walk-bob phase accumulator
  let vmSwingT = 0;     // swing timer (0 = idle, >0 = animating, counts down)
  const VM_SWING_DUR = 0.25; // seconds for one swing cycle

  // ---- swing trigger (called externally) ----------------------------------
  // Exposed via closure; called by placeBlock() and mining break-start.
  function triggerSwing() {
    vmSwingT = VM_SWING_DUR;
  }
  // Make it accessible to the rest of main.js
  window._vmSwing = triggerSwing;

  // ---- icon canvas (reused across item changes) ---------------------------
  function ensureIconCanvas() {
    if (vmIconCanvas) return;
    vmIconCanvas = document.createElement('canvas');
    vmIconCanvas.width = vmIconCanvas.height = 32;
    vmIconCtx = vmIconCanvas.getContext('2d');
  }

  // Draw the item icon using the same logic as inventory.drawIcon
  function drawVmIcon(id) {
    ensureIconCanvas();
    const ctx = vmIconCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 32);
    if (!id) {
      // empty hand: draw skin-coloured rectangle
      ctx.fillStyle = '#c68642';
      ctx.fillRect(8, 4, 16, 24);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(8, 20, 16, 8);
      return;
    }
    const def = itemDef(id);
    if (def && def.block != null && BLOCKS[def.block]) {
      // block item: draw atlas face tile
      const tile = BLOCKS[def.block].faces[2]; // side face
      const tw = texture.image ? texture.image.width / cols : 16;
      try {
        ctx.imageSmoothingEnabled = false;
        if (texture.image) {
          ctx.drawImage(texture.image,
            (tile % cols) * tw, Math.floor(tile / cols) * tw, tw, tw,
            2, 2, 28, 28);
        }
      } catch (e) { /* stub/headless: image may not exist */ }
    } else if (def) {
      const c = def.color ?? 0x888888;
      const hex = '#' + c.toString(16).padStart(6, '0');
      if (def.tool) {
        ctx.fillStyle = '#6b4a1e'; ctx.fillRect(14, 12, 4, 16);
        ctx.fillStyle = hex; ctx.fillRect(8, 4, 16, 8);
      } else {
        ctx.fillStyle = hex;
        ctx.beginPath(); ctx.arc(16, 16, 11, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // ---- mesh builders -------------------------------------------------------
  // Build or replace the mesh inside vmGroup for the given item id.
  // id may be null (empty hand).
  function buildVmMesh(id) {
    // remove previous mesh
    if (vmMesh && vmGroup) {
      try { vmGroup.remove(vmMesh); } catch (e) {}
      try { vmMesh.geometry && vmMesh.geometry.dispose && vmMesh.geometry.dispose(); } catch (e) {}
      try { vmMesh.material && vmMesh.material.dispose && vmMesh.material.dispose(); } catch (e) {}
      vmMesh = null;
    }

    const def = id ? itemDef(id) : null;
    const isBlock = def && def.block != null && BLOCKS[def.block];

    if (isBlock) {
      // Small tilted cube with per-face atlas tiles drawn to a canvas texture.
      // BoxGeometry UV maps each face 0→1, so a full-face canvas looks correct.
      try {
        ensureIconCanvas(); // ensure vmIconCanvas/vmIconCtx are ready
        const bdef = BLOCKS[def.block];
        // Draw top face tile (faces[0]) on left half, side face (faces[2]) on right half
        // Actually we just draw the side tile (faces[2]) since that's most recognisable,
        // and use it on all faces — matches inventory icon style.
        const sideTile = bdef.faces[2];
        const tw = texture.image ? texture.image.width / cols : 16;
        const ctx = vmIconCtx;
        if (ctx) {
          ctx.clearRect(0, 0, 32, 32);
          ctx.imageSmoothingEnabled = false;
          if (texture.image) {
            ctx.drawImage(texture.image,
              (sideTile % cols) * tw, Math.floor(sideTile / cols) * tw, tw, tw,
              0, 0, 32, 32);
          } else {
            ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 32, 32);
          }
        }
        if (!vmIconTex) {
          vmIconTex = new THREE.CanvasTexture(vmIconCanvas);
          if (vmIconTex.magFilter !== undefined) vmIconTex.magFilter = THREE.NearestFilter;
          if (vmIconTex.minFilter !== undefined) vmIconTex.minFilter = THREE.NearestFilter;
        } else {
          if (vmIconTex.needsUpdate !== undefined) vmIconTex.needsUpdate = true;
        }
        const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
        const mat = new THREE.MeshBasicMaterial({
          map: vmIconTex,
          depthTest: false,   // always draw on top of world geometry
          depthWrite: false,
        });
        vmMesh = new THREE.Mesh(geo, mat);
        vmMesh.rotation.x =  0.42;  // tilt forward (Minecraft-style isometric)
        vmMesh.rotation.y = -0.72;  // rotate to show two faces
        vmMesh.renderOrder = 999;   // render last so it appears on top
        vmMesh.frustumCulled = false;
      } catch (e) { vmMesh = null; }
    } else {
      // Flat quad with icon canvas texture (tool, food, or hand); always on top
      try {
        drawVmIcon(id);  // also handles null -> draws hand
        if (!vmIconTex) {
          vmIconTex = new THREE.CanvasTexture(vmIconCanvas);
          if (vmIconTex.magFilter !== undefined) vmIconTex.magFilter = THREE.NearestFilter;
          if (vmIconTex.minFilter !== undefined) vmIconTex.minFilter = THREE.NearestFilter;
        } else {
          // Refresh existing texture
          if (vmIconTex.needsUpdate !== undefined) vmIconTex.needsUpdate = true;
        }
        const geo = new THREE.PlaneGeometry(0.20, 0.20);
        const isTool = def && def.tool;
        const mat = new THREE.MeshBasicMaterial({
          map: vmIconTex,
          transparent: true,
          depthTest: false,  // always draw on top of world geometry
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        vmMesh = new THREE.Mesh(geo, mat);
        // Tool: angled like a held pickaxe; food/other: slightly less angled
        vmMesh.rotation.x = isTool ? -0.55 : -0.35;
        vmMesh.rotation.z = isTool ?  0.65 :  0.15;
        vmMesh.renderOrder = 999;
        vmMesh.frustumCulled = false;
      } catch (e) { vmMesh = null; }
    }

    if (vmMesh && vmGroup) {
      try { vmGroup.add(vmMesh); } catch (e) {}
    }
  }

  // ---- init ----------------------------------------------------------------
  try {
    vmGroup = new THREE.Group();
    vmGroup.frustumCulled = false;
    vmGroup.renderOrder = 999;
    scene.add(vmGroup);
    buildVmMesh(null); // start with empty-hand mesh
  } catch (e) {
    vmGroup = null;
  }

  // ---- per-frame update ----------------------------------------------------
  // Called from the main render loop; dt in seconds.
  function updateViewmodel(dt) {
    if (!vmGroup) return;

    // Visibility: only show in first-person play, not when any overlay is open
    const shouldShow = playing && !inv.isOpen() &&
      !(typeof bakery !== 'undefined' && bakery && typeof bakery.isOpen === 'function' && bakery.isOpen()) &&
      !document.getElementById('about')?.style?.display?.startsWith('flex') &&
      !document.getElementById('settings')?.style?.display?.startsWith('block');
    vmGroup.visible = shouldShow;

    if (!shouldShow) return;

    // Rebuild mesh if selected slot changed
    const slot = inv.selected;
    const itemId = inv.selectedItem();
    if (slot !== vmLastSlot) {
      vmLastSlot = slot;
      // Redraw icon canvas (non-block items) and re-upload texture
      if (vmIconTex) {
        drawVmIcon(itemId);
        if (vmIconTex.needsUpdate !== undefined) vmIconTex.needsUpdate = true;
      }
      buildVmMesh(itemId);
    }

    // ---- walk bob -----------------------------------------------------------
    const hSpeed = Math.sqrt(
      player.vel.x * player.vel.x + player.vel.z * player.vel.z
    );
    const isWalking = hSpeed > 0.5 && player.onGround;
    if (isWalking) vmBobT += dt * 8.5; // ~2.7 bobs/sec

    const bobY  = isWalking ? Math.sin(vmBobT) * 0.020 : 0;
    const bobX  = isWalking ? Math.sin(vmBobT * 0.5) * 0.012 : 0;
    const bobRZ = isWalking ? Math.sin(vmBobT * 0.5) * 0.06 : 0;

    // ---- swing animation ----------------------------------------------------
    let swingX = 0, swingY = 0, swingRX = 0;
    if (vmSwingT > 0) {
      vmSwingT = Math.max(0, vmSwingT - dt);
      const p = 1 - vmSwingT / VM_SWING_DUR; // 0->1 over duration
      // ease-out arc: forward then back
      const arc = p < 0.5
        ? 4 * p * p * p                         // ease-in during first half
        : 1 - Math.pow(-2 * p + 2, 3) / 2;     // ease-out during second half
      const sineArc = Math.sin(arc * Math.PI);  // peak at midpoint, back to 0
      swingRX = sineArc * -0.9;   // rotate forward (down) then back
      swingY  = sineArc * -0.04;  // slight downward dip
      swingX  = sineArc *  0.05;  // slight rightward arc
    }

    // ---- eat animation: raise item toward screen center with bite bobs ------
    // Read pose from the eat state (exposed via window._eatAnimPose).
    // raiseFrac 0→1 moves the item from the normal corner position toward center.
    // bobY adds the per-bite vertical bob.
    let eatOffX = 0, eatOffY = 0, eatRX = 0;
    const eatPose = typeof window._eatAnimPose === 'function' ? window._eatAnimPose() : null;
    if (eatPose) {
      const rf = eatPose.raiseFrac;  // 0=normal, 1=raised-center
      // Move item toward center: cancel the right-offset and raise it
      eatOffX = -VM_X * rf * 0.85;       // slide toward horizontal center
      eatOffY =  0.12 * rf;              // raise toward screen center
      eatRX   = -0.35 * rf;             // tilt item toward camera (forward lean)
      eatOffY += eatPose.bobY;           // add bite bob on top
    }

    // ---- compute camera-local axes in world space ---------------------------
    // Camera faces -Z in local space; we derive right/up/fwd from yaw+pitch.
    const cosY = Math.cos(player.yaw),   sinY = Math.sin(player.yaw);
    const cosP = Math.cos(player.pitch), sinP = Math.sin(player.pitch);

    // Camera forward: (−sinY·cosP, sinP, −cosY·cosP)
    // Camera right  : ( cosY,       0,    −sinY)
    // Camera up     : ( sinY·sinP,  cosP, cosY·sinP)
    const rx = cosY,        ry = 0,    rz = -sinY;
    const ux = sinY * sinP, uy = cosP, uz = cosY * sinP;
    const fx = -sinY * cosP, fy = sinP, fz = -cosY * cosP;

    // Target position: camera + offset in camera space
    const ox = VM_X + bobX + swingX + eatOffX;
    const oy = VM_Y + bobY + swingY + eatOffY;
    const oz = VM_Z;

    const camX = camera.position.x;
    const camY = camera.position.y;
    const camZ = camera.position.z;

    try {
      vmGroup.position.set(
        camX + rx * ox + ux * oy + fx * oz,
        camY + ry * ox + uy * oy + fy * oz,
        camZ + rz * ox + uz * oy + fz * oz
      );

      // Orientation: match camera yaw+pitch, plus mesh's own pre-rotation + eat tilt
      vmGroup.rotation.order = 'YXZ';
      vmGroup.rotation.y = -player.yaw;
      vmGroup.rotation.x = -player.pitch + swingRX + eatRX;
      vmGroup.rotation.z = bobRZ;
    } catch (e) { /* stub safety */ }
  }

  // Expose updateViewmodel and triggerSwing for the main loop
  window._updateViewmodel = updateViewmodel;
})();

// Helper: trigger viewmodel swing (used in placeBlock and mining)
function vmSwing() {
  if (typeof window._vmSwing === 'function') window._vmSwing();
}

// Mobs / entities (passive animals by day, hostiles at night)
const mobs = createMobs({
  THREE, scene,
  solidAt: (x, y, z) => { const b = BLOCKS[world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))]; return !!(b && b.solid); },
  groundKind: (x, y, z) => {
    const id = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    if (id === 1) return 'grass';
    const b = BLOCKS[id];
    return b && b.solid ? 'solid' : 'air';
  },
  player,
  onHurtPlayer: (dmg) => { applyDamage(dmg || 1); }, // real damage in survival; no-op in creative
  addDrop: (itemId, n) => { if (itemId) inv.collect(itemId, n); },
  sfx,
  isNight: () => false, // bakery game: only peaceful animals spawn, never hostiles
  enabled: settings.mobs !== false,
});
window.__mobCount = () => mobs.count(); // debug/verification hook

// Populate the world: the baker behind the counter + a lively, varied cast in
// the yard — townsfolk, kids, and a few "various-worldview" heroes (diamond /
// netherite / gold knights, an enchanter, an adventurer…) so kids, grown-ups and
// Minecraft fans all find someone fun. Each has a name + a personality line.
// A barista also stands inside the "South in North" cafe room (world -19,31,-39).
let baker = null;
let barista = null;
const customers = []; // (every spawned yard NPC; used for the delivery hearts)
// type, world (x,z), name, line — spread across the open schoolyard (ground y31),
// in front of the facade (z=-24), clear of the harvest field (x -8..0, z -8..2).
const NPC_ROSTER = [
  ['villager', 10, -8,  'みどりさん', '今日のパン、どれにしようかな。天然酵母っていい香りねぇ🥖'],
  ['child', 16, -6,    'はると', 'ここ、昔おじいちゃんが通った学校なんだって！すごくない！？'],
  ['child', 24, -8,    'ゆい', '校庭でかけっこしよ〜！広いね〜！'],
  ['farmer', 32, -12,  'たけぞうさん', '規格外の野菜、捨てるのがもったいなくてなぁ。ここで酵母にしてくれると聞いて'],
  ['customer', -14, -10, 'さとう先生', '昔ここで教えとったんよ。廃校になって寂しかったが、またにぎやかになってよかった'],
  ['knight_diamond', 28, -16, 'ダイヤの騎士アル', 'この旧校舎、見事な地域の砦じゃ。パンの香りで胸が和む'],
  ['knight_netherite', 36, -8, 'ネザライトの勇者', 'ネザーの業火で鍛えた鎧だ。だが発酵の香りには、どんな魔法も敵わん'],
  ['knight_gold', -18, -6, '黄金の騎士', '金より価値あるもの——それは地域の人がつながる場所よ'],
  ['adventurer', 4, -18, '旅人リン', '各地を巡ってきた。廃校の再生と食品ロスのパン屋——ここは本物の宝地だ'],
  ['wizard', -10, -16, '魔法使いミント', '発酵は小さな魔法じゃよ。もったいないをおいしいに変える——これぞ里山の知恵'],
  ['miner', 20, -20,   '鉱夫ゴロウ', 'ダイヤも掘ったが、結局パンが一番うまい。天然酵母はひと味ちがうな'],
  ['ninja', 40, -14,   '影', '……（校庭を見回し、こくりとうなずく）'],
];
if (settings.mobs !== false) {
  baker = mobs.spawnAt('baker', 14, 31, -37); // behind the deep counter (local 50,2,13); customers reach it from the counter front (z=15)
  // Barista inside the "South in North" cafe room (local x17,y2,z11 → world -19,31,-39)
  barista = mobs.spawnAt('customer', -19, 31, -39);
  if (barista) {
    barista.npcName = 'South in North のマスター';
    barista.npcLine = 'コーヒーいかが？ここ、昔の理科室なんだ。校庭で飲むと最高だよ☕';
    customers.push(barista);
  }
  for (const [type, x, z, name, line] of NPC_ROSTER) {
    const m = mobs.spawnAt(type, x, 31, z);
    if (m) { m.npcName = name; m.npcLine = line; customers.push(m); }
  }
  // ── Customers INSIDE the bakery — browsing the cases (the shop feels alive) ──
  // World coords on the browse floor (x10..19, z-35..-31). Tethered to an anchor
  // so they mill near a display without pathfinding into walls/counter.
  const SHOP_GUESTS = [
    ['customer', 11, -33, 'ご近所の奥さん', 'このカンパーニュ、美味しそう…どれにしようかしら🍞'],
    ['customer', 18, -34, '常連の大学生', 'バゲット、外はパリッ、中はもっちりなんだよね🥖'],
    ['child',    15, -32, 'ゆうき',       'クロワッサンのいいにおい！ねえ、これ買って〜🥐'],
  ];
  for (const [type, x, z, name, line] of SHOP_GUESTS) {
    const m = mobs.spawnAt(type, x, 31, z);
    if (m) { m.npcName = name; m.npcLine = line; m.shopGuest = true; m.anchor = { x, z }; customers.push(m); }
  }
}
// nearest named yard NPC to the player (for proximity speech bubbles)
function nearestNpc(maxD) {
  let best = null, bestD = maxD;
  for (const m of customers) {
    if (!m || !m.npcLine) continue;
    const d = Math.hypot(player.pos.x - m.pos.x, player.pos.z - m.pos.z);
    if (d < bestD) { bestD = d; best = m; }
  }
  return best;
}
// 常連さん — the delivery payoff names a regular who lights up when you hand over bread.
const REGULARS = ['みどりさん', 'たけしさん', 'ご近所のゆいちゃん', '常連のさとうさん'];

// Guided "today's work" quest so first-time visitors know exactly what to do.
let questDone = false;
const quest = createQuest({
  onComplete: () => {
    questDone = true;
    const regular = REGULARS[Math.floor(Math.random() * REGULARS.length)];
    deliveredTo = regular;
    toast(`🎉 ${regular}にパンを届けました！「ありがとう、また来ますね」`);
    if (settings.shake) shakeMag = 0.18;
    // hearts bloom over the counter — the moment of delight.
    if (baker) {
      for (let i = 0; i < 14; i++) particles.burst(baker.pos.x, baker.pos.y + 1.6, baker.pos.z, 0xff6fa5, 1, 2.0);
      for (const c of customers) for (let i = 0; i < 6; i++) particles.burst(c.pos.x, c.pos.y + 1.6, c.pos.z, 0xff9ec4, 1, 1.6);
    }
    sfx.craft && sfx.craft();
    setTimeout(() => toast('🔗 右上の共有ボタンで、この「焼けた！」をシェアしよう🥖'), 2800);
  },
});
let deliveredTo = null;
// debug/QA hook: force a quest re-evaluation and return completion state, so the
// headless playthrough is deterministic even if the rAF loop is throttled.
window.__quest = () => { try { updateQuest(); } catch (e) {} return { done: questDone }; };
// debug/QA hook: the baker's LIVE position (it wanders), so the playthrough can
// deliver to where the baker actually is.
window.__bakerPos = () => (baker && baker.pos ? { x: baker.pos.x, y: baker.pos.y, z: baker.pos.z } : null);
// the baker greets the player when nearby (story warmth)
const speechEl = document.createElement('div');
Object.assign(speechEl.style, {
  position: 'fixed', left: '50%', top: '13%', transform: 'translateX(-50%)', zIndex: '7', display: 'none',
  maxWidth: '82vw', padding: '10px 16px', borderRadius: '12px', background: 'rgba(43,111,106,.92)', color: '#fff',
  fontSize: '14px', lineHeight: '1.5', textAlign: 'center', boxShadow: '0 6px 20px rgba(0,0,0,.4)', pointerEvents: 'none',
});
document.body.appendChild(speechEl);
// 🏷 price card — shown when the player is at the counter (legible product menu;
// freeform in-world 3D text isn't feasible, so we surface prices as a HUD card).
const priceCardEl = document.createElement('div');
Object.assign(priceCardEl.style, {
  position: 'fixed', right: 'calc(12px + env(safe-area-inset-right,0px))', top: '20%', zIndex: '7', display: 'none',
  padding: '10px 13px', borderRadius: '12px', background: 'rgba(47,111,105,.94)', color: '#f3efe6',
  font: '12px/1.7 system-ui,"Noto Sans JP",sans-serif', boxShadow: '0 6px 20px rgba(0,0,0,.4)',
  pointerEvents: 'none', whiteSpace: 'pre',
});
document.body.appendChild(priceCardEl);
function priceCardText() {
  const lines = SHOP_STOCK.map((s) => `${itemDef(s.id)?.name || s.id} … 規格外野菜 ${s.cost}`);
  return '🏷 本日のパン（規格外野菜と交換）\n' + lines.join('\n') + '\n🛍️ 右上のボタンで購入';
}
let wasInBakery = false; // edge-detect shop entry for the door chime + greeting
const guide = createGuide(); // bottom-center wayfinding compass
const BREADS = ['bread', 'campagne', 'baguette', 'pain_de_mie', 'rosemary_bread', 'apple_bread', 'fruit_bread', 'toast'];
// Bakery doorway world position — the entrance to the shop bay (easier to find than the baker NPC deep inside).
const BAKERY_DOOR = { x: 13.5, z: -30 };
// One-time “stairs hint” shown after bakery is found (2F wayfinding).
let stairsHintShown = false;
function updateQuest() {
  const bread = BREADS.reduce((s, id) => s + inv.count(id), 0);
  const nearBaker = !!(baker && playing && Math.hypot(player.pos.x - baker.pos.x, player.pos.z - baker.pos.z) < 3.5);
  // Trigger bakeryFound when player enters the bakery bay (near doorway OR near baker NPC)
  const nearDoor = playing && Math.hypot(player.pos.x - BAKERY_DOOR.x, player.pos.z - BAKERY_DOOR.z) < 4;
  if ((nearBaker || nearDoor) && !bakeryFound) {
    bakeryFound = true;
    toast('🥖 パン屋はここ！奥の扉が工房だよ');
    // Show 2F stairs hint shortly after arriving at the bakery
    setTimeout(() => {
      if (!stairsHintShown) {
        stairsHintShown = true;
        toast('🪜 校舎の両端の階段から2階（教室）へ行けるよ');
      }
    }, 3500);
  }
  quest.update({ wheat: inv.count('wheat'), veg: inv.count('surplus_veg'), levain: inv.count('levain'), bread, nearBaker });
  if (nearBaker) {
    speechEl.style.display = 'block';
    // Baker greeting lines — warm, mission-driven voice
    const BAKER_GREET = [
      'いらっしゃい！今日のカンパーニュ、いい感じに焼けたよ🥖',
      'この酵母ね、畑で捨てられるはずだった果物からおこしたんよ。もったいないでしょう？',
      '昔ここ、子どもたちの教室だったんよ。今はパンの香りでいっぱい。',
      '「もったいない」を「おいしい」に——それがうちのパン作りです🌾',
    ];
    const greetIdx = Math.floor(performance.now() / 8000) % BAKER_GREET.length;
    speechEl.textContent = questDone
      ? `👩‍🍳 ありがとう！${deliveredTo ? `${deliveredTo}も喜んでた。` : ''}”もったいない”を”おいしい”に。本日も開店です🥖`
      : (bread > 0 ? '👩‍🍳 わぁ、焼けたのね！こっちに届けてくれる？🥖'
        : `👩‍🍳 ${BAKER_GREET[greetIdx]}`);
  } else {
    const npc = playing ? nearestNpc(3.0) : null;
    if (npc) { speechEl.style.display = 'block'; speechEl.textContent = `🧑 ${npc.npcName}：${npc.npcLine}`; }
    else speechEl.style.display = 'none';
  }
  // ── Door chime + いらっしゃいませ on entering the shop (rising edge) ──────────
  const inBakery = playing && player.pos.x > 9 && player.pos.x < 20 && player.pos.z > -39 && player.pos.z < -30.5;
  if (inBakery && !wasInBakery) {
    sfx.resume(); sfx.chime && sfx.chime();
    if (!nearBaker) { // don't stomp the baker's own line
      speechEl.style.display = 'block';
      speechEl.textContent = '👩‍🍳 いらっしゃいませ！プチヘルメースへようこそ🥖';
      setTimeout(() => { if (speechEl.textContent.includes('ようこそ')) speechEl.style.display = 'none'; }, 3500);
    }
  }
  wasInBakery = inBakery;
  // ── Price card near the counter ─────────────────────────────────────────────
  if (nearCounter()) { priceCardEl.style.display = 'block'; priceCardEl.textContent = priceCardText(); }
  else priceCardEl.style.display = 'none';
  updateGuide(bread);
}

// Wayfinding: choose the next target/label from the player's progress.
const FIELD = { x: -4, z: -3 };          // schoolyard farm plot (harvest)
let bakeryFound = false;                  // becomes true once the player enters the bakery bay
function updateGuide(bread) {
  if (!playing || questDone) { guide.hide(); return; }
  // Onboarding: first guide points to the BAKERY DOORWAY (world ~x13.5, z-30)
  // so first-timers find the entrance before anything else.
  if (!bakeryFound) {
    guide.update({ player, target: BAKERY_DOOR, label: '🥖 パン屋はこちら（校舎内）' });
    return;
  }
  const wheat = inv.count('wheat'), veg = inv.count('surplus_veg'), levain = inv.count('levain');
  let opts = null;
  if (wheat < 1 || veg < 1) {
    opts = { player, target: FIELD, label: '⛏ 畑で小麦と規格外野菜を集めよう' };
  } else if (levain < 1) {
    opts = { player, target: null, label: '🥖 右上の工房ボタンで「瓶に仕込む」' };
  } else if (bread < 1) {
    opts = { player, target: null, label: '🥖 右上の工房ボタンで「焼く！」' };
  } else if (baker) {
    opts = { player, target: { x: baker.pos.x, z: baker.pos.z }, label: '🥖 店主にパンを届けよう' };
  }
  guide.update(opts);
}

// --- Bakery: time-based fermentation + one-tap baking (casual, no grid puzzle) ---
const ferment = createFermentation();
const bakery = createBakery({
  inv, ferment, sfx, toast, itemDef,
  onBake: (id, n) => { if (settings.shake) shakeMag = 0.12; },
});
// 🥖 top-bar button opens the bakery counter.
{
  const b = document.createElement('button');
  b.textContent = '🥖'; b.title = 'パン工房をひらく';
  b.addEventListener('click', (e) => { e.stopPropagation(); sfx.resume(); if (playing) bakery.open(); });
  const tb = document.getElementById('topbar');
  if (tb) tb.insertBefore(b, tb.firstChild);
}

// --- 店頭 (shop counter): the player-as-customer "buy bread" side ---
const COUNTER = { x: 14.5, z: -34 }; // world centre of the counter/browse area
function nearCounter() { return playing && Math.hypot(player.pos.x - COUNTER.x, player.pos.z - COUNTER.z) < 5.5; }
const shop = createShop({
  inv, sfx, toast, itemDef, particles,
  onBuy: (id) => { if (settings.shake) shakeMag = 0.12; particles.burst(player.pos.x, player.pos.y + 1.2, player.pos.z, 0xffd9a8, 8, 1.8); },
});
// 🛍️ top-bar button opens the counter when you're standing at it.
{
  const b = document.createElement('button');
  b.textContent = '🛍️'; b.title = '店頭で買う';
  b.addEventListener('click', (e) => {
    e.stopPropagation(); sfx.resume();
    if (!playing) return;
    if (nearCounter()) shop.open(); else toast('🛍️ カウンターに近づいてね');
  });
  const tb = document.getElementById('topbar');
  if (tb) tb.insertBefore(b, tb.firstChild);
}
window.__shop = { open: () => shop.open(), buy: (id) => shop.__buy(id), isOpen: () => shop.isOpen() };

// debug/verification hooks for the bakery loop (harmless in prod)
window.__bakery = {
  give: (id, n = 1) => inv.collect(id, n),
  count: (id) => inv.count(id),
  ferments: () => ferment.count(),
  startFerment: () => ferment.start(performance.now()),
  // force all pending jars ready now (fast-forward), so tests don't wait 75s
  matureAll: () => ferment.rush(),
  pump: () => updateFermentation(), // run one fermentation tick (loop is paused when tab hidden)
};
// Matured jars yield 発酵液 — celebrate with a pop + bubbles + a toast.
function updateFermentation() {
  const done = ferment.update(performance.now());
  for (const _ of done) {
    inv.collect('levain', 1);
    sfx.pop && sfx.pop();
    if (playing) particles.burst(player.pos.x, player.pos.y + 1.2, player.pos.z, 0xe7d08a, 8, 1.6);
  }
  if (done.length) toast(`🫧 発酵液ができた！（×${done.length}）パン工房で焼こう`);
}

const crosshairEl = document.getElementById('crosshair');
function flashCrosshair(color) {
  if (!crosshairEl) return;
  crosshairEl.style.transition = 'none';
  crosshairEl.style.transform = 'translate(-50%,-50%) scale(1.7)';
  crosshairEl.style.filter = `drop-shadow(0 0 4px ${color || '#ff5a3a'})`;
  setTimeout(() => {
    crosshairEl.style.transition = 'transform .16s, filter .16s';
    crosshairEl.style.transform = 'translate(-50%,-50%) scale(1)';
    crosshairEl.style.filter = 'none';
  }, 30);
}

// Player melee: if a mob is under (or near) the crosshair, hit it instead of mining.
function tryAttackMob() {
  const base = new THREE.Vector3();
  camera.getWorldDirection(base);
  const t = inv.heldTool();
  const dmg = creative ? 1000 : (t && t.damage ? t.damage : 2);
  const origin = camera.position;
  let mob = mobs.attack(origin.clone(), base, 3.8, dmg);
  if (!mob) { // forgiving aim cone
    for (const [ox, oy] of [[0.09, 0], [-0.09, 0], [0, 0.09], [0, -0.09], [0.07, 0.07], [-0.07, -0.07]]) {
      const d = base.clone(); d.x += ox; d.y += oy; d.normalize();
      mob = mobs.attack(origin.clone(), d, 3.8, dmg);
      if (mob) break;
    }
  }
  if (mob) {
    particles.burst(mob.pos.x, mob.pos.y + 0.6, mob.pos.z, 0xffe0a0, 14, 3.4); // impact spark
    sfx.break(1);
    flashCrosshair('#ff5a3a');
    if (settings.shake) shakeMag = Math.max(shakeMag, 0.08);
    return true;
  }
  return false;
}

// Cast a spell from a magic wand/staff (right-click / tap when holding one).
function castMagic(kind) {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const origin = camera.position.clone();
  sfx.select();
  if (kind === 'heal') {
    if (!creative) player.health = Math.min(20, player.health + 6);
    for (let i = 0; i < 16; i++) particles.burst(player.pos.x, player.pos.y + 1, player.pos.z, 0x8aff9a, 1, 2.2);
    flashCrosshair('#8aff9a');
    return;
  }
  const color = kind === 'fire' ? 0xff6a1a : kind === 'frost' ? 0x7ad0ff : 0xffe65a;
  const dmg = creative ? 1000 : (kind === 'bolt' ? 10 : 7);
  for (let d = 1; d <= 16; d += 1.2) particles.burst(origin.x + dir.x * d, origin.y + dir.y * d, origin.z + dir.z * d, color, 3, 1.7);
  mobs.attack(origin, dir, 16, dmg); // damage the first mob along the beam
  flashCrosshair('#' + color.toString(16).padStart(6, '0'));
  if (settings.shake) shakeMag = Math.max(shakeMag, 0.14);
}

// ---------------------------------------------------------------------------
// Top bar: sound / share / settings / reset
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
let toastT = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 1700);
}

$('btn-sound').addEventListener('click', () => {
  settings.sound = !settings.sound;
  sfx.setEnabled(settings.sound);
  sfx.resume();
  $('btn-sound').style.opacity = settings.sound ? '1' : '0.4';
  $('set-sound').checked = settings.sound;
  saveSettings();
});
$('btn-sound').style.opacity = settings.sound ? '1' : '0.4';

async function doShare() {
  const res = await shareSeed(seed, 'プチヘルメース');
  toast(res === 'shared' ? '共有しました🥖' : res === 'copied' ? 'リンクをコピーしました🔗' : '共有に失敗しました');
}
$('btn-share').addEventListener('click', doShare);

$('btn-reset').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!confirm('このワールドの編集をすべてリセットしますか？')) return;
  world.resetWorld();
  for (const key of [...meshes.keys()]) removeChunkMeshes(key);
  location.reload();
});

// settings panel
const panel = $('settings');
function openSettings() {
  $('set-sens').value = settings.sens;
  $('sens-val').textContent = settings.sens.toFixed(1) + '×';
  $('set-dist').value = settings.dist;
  $('dist-val').textContent = settings.dist;
  $('set-sound').checked = settings.sound;
  $('set-shake').checked = settings.shake;
  $('set-creative').checked = settings.creative;
  $('set-mobs').checked = settings.mobs !== false;
  $('set-music').checked = settings.music !== false;
  $('seed-code').textContent = seedToCode(seed) + '  (#' + seed + ')';
  panel.style.display = 'block';
}
$('btn-settings').addEventListener('click', openSettings);
$('set-close').addEventListener('click', () => { panel.style.display = 'none'; });
$('set-sens').addEventListener('input', (e) => {
  settings.sens = parseFloat(e.target.value);
  $('sens-val').textContent = settings.sens.toFixed(1) + '×';
  saveSettings();
});
$('set-dist').addEventListener('input', (e) => {
  settings.dist = parseInt(e.target.value, 10);
  $('dist-val').textContent = settings.dist;
  applyRenderDist();
  saveSettings();
});
$('set-sound').addEventListener('change', (e) => {
  settings.sound = e.target.checked;
  sfx.setEnabled(settings.sound);
  $('btn-sound').style.opacity = settings.sound ? '1' : '0.4';
  saveSettings();
});
$('set-shake').addEventListener('change', (e) => { settings.shake = e.target.checked; saveSettings(); });
$('set-music').addEventListener('change', (e) => { settings.music = e.target.checked; sfx.setMusicEnabled(settings.music); saveSettings(); });
$('set-creative').addEventListener('change', (e) => {
  settings.creative = e.target.checked; saveSettings();
  toast(settings.creative ? 'クリエイティブ：リロードで反映' : 'サバイバル：リロードで反映');
  setTimeout(() => location.reload(), 700);
});
$('set-mobs').addEventListener('change', (e) => {
  settings.mobs = e.target.checked;
  mobs.setEnabled(settings.mobs);
  if (!settings.mobs) mobs.clear();
  saveSettings();
});

// ---------------------------------------------------------------------------
// Water animation: gentle UV scroll on matWater each frame
// ---------------------------------------------------------------------------
// Accumulated world time (seconds) used to scroll the water texture offset.
// The offset is guarded with optional chaining so the headless THREE stub
// (which has no Vector2 / offset on CanvasTexture) doesn't throw.
let _waterTime = 0;
function updateWaterAnimation(dt) {
  _waterTime += dt;
  // Scroll diagonally: ~0.04 units/s horizontally, ~0.03 units/s vertically.
  // Values wrap naturally because the texture uses RepeatWrapping.
  const u = (_waterTime * 0.04) % 1;
  const v = (_waterTime * 0.03) % 1;
  // matWater.map is the waterTex CanvasTexture; in the browser it has an
  // `offset` Vector2. In the headless stub it won't — guard safely.
  if (matWater.map && matWater.map.offset && typeof matWater.map.offset.set === 'function') {
    matWater.map.offset.set(u, v);
    matWater.map.needsUpdate = false; // offset change doesn't require needsUpdate
  }
}

// ---------------------------------------------------------------------------
// Day / night cycle
// ---------------------------------------------------------------------------
let dayTime = 0.28;
const NIGHT = new THREE.Color(0x0a1430);
function updateDayNight(dt) {
  dayTime = (dayTime + dt / 120) % 1;
  const sun = Math.max(0, Math.sin(dayTime * Math.PI * 2 - Math.PI / 2));
  curSun = sun;
  const light = 0.18 + 0.82 * sun;
  matOpaque.color.setRGB(light, light, light);
  matTrans.color.setRGB(light, light, light);
  matWater.color.setRGB(light, light, light);
  matLeaf.color.setRGB(light, light, light);
  const skyColor = NIGHT.clone().lerp(SKY_DAY, sun);
  scene.background.copy(skyColor);
  scene.fog.color.copy(skyColor);
}

// Feed the generative soundscape a coarse "where am I" scene so it can crossfade
// between outdoor birds/insects/wind and a muffled indoor bed, add a river layer
// near water, and thin the birds at night. Throttled (~0.4s) — cheap but no need
// to recompute every frame.
const SCHOOL_BBOX = { x0: -33, x1: 48, z0: -49, z1: -23, y0: 29, y1: 46 };
let ambTimer = 0;
function updateAmbience(dt) {
  ambTimer -= dt;
  if (ambTimer > 0) return;
  ambTimer = 0.4;
  const p = player.pos;
  const indoor =
    p.x >= SCHOOL_BBOX.x0 && p.x <= SCHOOL_BBOX.x1 &&
    p.z >= SCHOOL_BBOX.z0 && p.z <= SCHOOL_BBOX.z1 &&
    p.y >= SCHOOL_BBOX.y0 && p.y <= SCHOOL_BBOX.y1;
  // Sample a small neighbourhood for a WATER block (id 7) to open the river layer.
  let nearWater = false;
  const px = Math.floor(p.x), py = Math.floor(p.y), pz = Math.floor(p.z);
  for (let dx = -2; dx <= 2 && !nearWater; dx++)
    for (let dz = -2; dz <= 2 && !nearWater; dz++)
      for (let dy = -1; dy <= 1; dy++)
        if (world.getBlock(px + dx, py + dy, pz + dz) === 7) { nearWater = true; break; }
  // Inside the bakery bay → a warmer, cosier indoor bed (oven-shop ambience).
  const inBakery = p.x > 9 && p.x < 20 && p.z > -49 && p.z < -30 && p.y >= 29 && p.y <= 36;
  sfx.setAmbienceScene({ outdoor: !indoor, nearWater, night: curSun < 0.25, inBakery });
}

// ---------------------------------------------------------------------------
// HUD + dynamic resolution
// ---------------------------------------------------------------------------
const hud = document.getElementById('hud');
let frames = 0, fpsTime = 0, fps = 0;
function updateHud(dt) {
  frames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = Math.round(frames / fpsTime);
    frames = 0; fpsTime = 0;
    // dynamic resolution: ease pixelRatio toward a smooth 30+ fps
    if (fps < 28 && curPR > 0.7) { curPR = Math.max(0.7, curPR - 0.15); applyPR(); }
    else if (fps > 52 && curPR < PR_CAP) { curPR = Math.min(PR_CAP, curPR + 0.1); applyPR(); }
  }
  const p = player.pos;
  hud.textContent =
    `FPS ${fps}  |  XYZ ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}` +
    `  |  ${player.fly ? 'FLY' : 'WALK'}  |  chunks ${meshes.size}`;
  drawStats();
  updateQuest();
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
let last = performance.now();
let paused = false;
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (paused) return;
  if (dt > 0.05) dt = 0.05; // clamp (also covers tab-resume spikes)

  const frozen = now < freezeUntil;
  if (playing && !frozen && !inv.isOpen()) movePlayer(dt);
  if (playing) updateSurvival(dt);
  syncCamera();
  shakeMag *= 0.82;
  updateChunks();
  updateDayNight(dt);
  updateWaterAnimation(dt);
  if (playing) updateAmbience(dt);
  updateFermentation();
  bakery.tick();
  sky.update(dt, curSun, dayTime);
  updateMining(dt);
  if (playing && !inv.isOpen()) updateEat(dt);
  particles.update(dt);
  if (playing) mobs.update(dt);

  renderer.render(scene, camera);
  // Update first-person held-item viewmodel (after render to avoid one-frame lag)
  if (typeof window._updateViewmodel === 'function') window._updateViewmodel(dt);
  updateHud(dt);
}
loop();

// Register the service worker (offline + installable PWA) from the module rather
// than an inline <script>, so a strict Content-Security-Policy can't block it.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  });
}
