// Bootstrap: renderer, chunk streaming, player physics, desktop + touch input,
// UI, day/night, audio, particles, progressive mining, sharing, and PWA wiring.
import * as THREE from './vendor/three.module.js';
import { World, CHUNK, HEIGHT, SEA_LEVEL } from './world.js';
import { buildAtlas, BLOCKS } from './blocks.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { isTouchDevice, createTouchControls } from './touch.js';
import { getSeed, setSeedInURL, seedToCode, shareSeed } from './share.js';

// ---------------------------------------------------------------------------
// Settings (persisted)
// ---------------------------------------------------------------------------
const DEFAULTS = { sens: 1.0, dist: 6, sound: true, shake: true };
function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('mc_settings') || '{}') }; }
  catch (e) { return { ...DEFAULTS }; }
}
function saveSettings() {
  try { localStorage.setItem('mc_settings', JSON.stringify(settings)); } catch (e) {}
}
const settings = loadSettings();

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

// ---------------------------------------------------------------------------
// Audio + particles
// ---------------------------------------------------------------------------
const sfx = createAudio();
sfx.setEnabled(settings.sound);
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
  const og = world.makeMesh(groups.opaque);
  if (og) {
    const m = new THREE.Mesh(og, matOpaque);
    m.position.set(cx * CHUNK, 0, cz * CHUNK);
    m.frustumCulled = true;
    scene.add(m);
    entry.opaque = m;
  }
  const tg = world.makeMesh(groups.trans);
  if (tg) {
    const m = new THREE.Mesh(tg, matTrans);
    m.position.set(cx * CHUNK, 0, cz * CHUNK);
    m.renderOrder = 1;
    scene.add(m);
    entry.trans = m;
  }
  meshes.set(key, entry);
}

function removeChunkMeshes(key) {
  const e = meshes.get(key);
  if (!e) return;
  for (const m of [e.opaque, e.trans]) {
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

  let budget = 2;
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
const player = {
  pos: new THREE.Vector3(8, 0, 8),
  vel: new THREE.Vector3(),
  yaw: 0, pitch: 0,
  onGround: false, fly: false,
  width: 0.6, height: 1.8, eye: 1.62,
};
{
  const h = world.heightAt(8, 8);
  player.pos.y = Math.max(h, SEA_LEVEL) + 2;
}

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
  if (player.fly) {
    let vy = 0;
    if (jumpHeld || touchVert > 0) vy += FLY;
    if (keys['ShiftLeft'] || touchVert < 0) vy -= FLY;
    player.vel.y = vy;
  } else {
    player.vel.y -= GRAVITY * dt;
    if (jumpHeld && player.onGround) { player.vel.y = JUMP; player.onGround = false; }
  }

  const p = player.pos;
  p.x += player.vel.x * dt;
  if (collidesAt(p.x, p.y, p.z)) { p.x -= player.vel.x * dt; player.vel.x = 0; }
  p.z += player.vel.z * dt;
  if (collidesAt(p.x, p.y, p.z)) { p.z -= player.vel.z * dt; player.vel.z = 0; }

  player.onGround = false;
  p.y += player.vel.y * dt;
  if (collidesAt(p.x, p.y, p.z)) {
    if (player.vel.y <= 0) player.onGround = true;
    p.y -= player.vel.y * dt;
    player.vel.y = 0;
  }

  if (p.y < -20) {
    p.set(8, Math.max(world.heightAt(8, 8), SEA_LEVEL) + 2, 8);
    player.vel.set(0, 0, 0);
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

const HARDNESS = { 3: 0.62, 8: Infinity, 10: 0.62, 13: 0.7, 5: 0.45 }; // stone/bedrock/cobble/brick/wood
function hardnessOf(id) { return HARDNESS[id] != null ? HARDNESS[id] : 0.32; }

let breakTarget = null;
let breakProgress = 0;

function sameBlock(a, b) { return b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }

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
}

function placeBlock() {
  const hit = currentTarget();
  if (!hit) return;
  const [x, y, z] = hit.place;
  if (y < 1 || y >= HEIGHT) return;
  const hw = player.width / 2 + 0.02;
  const p = player.pos;
  if (x + 1 > p.x - hw && x < p.x + hw &&
      y + 1 > p.y && y < p.y + player.height &&
      z + 1 > p.z - hw && z < p.z + hw) return;
  if (world.getBlock(x, y, z) !== 0) return;
  const id = hotbar[selected];
  world.setBlock(x, y, z, id);
  applyEdit(Math.floor(x / CHUNK), Math.floor(z / CHUNK), x, y, z);
  particles.burst(x + 0.5, y + 0.5, z + 0.5, blockColorHex(id), 6, 1.6);
  sfx.place(id);
}

function updateMining(dt) {
  const hit = playing ? currentTarget() : null;
  if (hit) {
    hlEdges.visible = true;
    hlEdges.position.set(hit.block[0] + 0.5, hit.block[1] + 0.5, hit.block[2] + 0.5);
  } else {
    hlEdges.visible = false;
  }

  if (breakHeld && hit && playing) {
    const [x, y, z] = hit.block;
    const id = world.getBlock(x, y, z);
    const hard = hardnessOf(id);
    if (!isFinite(hard)) { breakProgress = 0; crackMesh.visible = false; return; } // bedrock
    if (!sameBlock(hit.block, breakTarget)) { breakTarget = hit.block.slice(); breakProgress = 0; }
    breakProgress += dt / hard;
    const s = Math.min(CRACK_STAGES - 1, Math.floor(breakProgress * CRACK_STAGES));
    crackMat.map = crackTex[s];
    crackMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    crackMesh.visible = true;
    if (breakProgress >= 1) { doBreak(x, y, z, id); breakProgress = 0; breakTarget = null; crackMesh.visible = false; }
  } else {
    breakProgress = 0; breakTarget = null; crackMesh.visible = false;
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
    const n = parseInt(e.code.slice(5), 10) - 1;
    if (n < hotbar.length) selectSlot(n);
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

const overlay = document.getElementById('overlay');
function startPlay() {
  sfx.resume();
  playing = true;                 // start regardless of pointer lock support
  overlay.style.display = 'none';
  if (!isTouch) { try { canvas.requestPointerLock(); } catch (e) {} } // mouse-look enhancement only
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
  if (!locked && wasLocked) {            // user pressed Esc out of pointer lock -> pause
    playing = false;
    overlay.style.display = 'flex';
  }
});
document.addEventListener('mousemove', (e) => {
  if (!playing || isTouch) return;
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
  if (!playing || isTouch) return;
  if (e.button === 0) {
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
  if (!playing) return;
  selectSlot((selected + (e.deltaY > 0 ? 1 : -1) + hotbar.length) % hotbar.length);
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
    onPlace: () => { if (playing) placeBlock(); },
    onBreakStart: () => { if (playing) breakHeld = true; },
    onBreakEnd: () => { breakHeld = false; },
    onJump: (down) => { touchJump = down; },
    onToggleFly: () => { player.fly = !player.fly; },
    onVertical: (dir) => { touchVert = dir; },
  });
}

// ---------------------------------------------------------------------------
// Hotbar UI
// ---------------------------------------------------------------------------
const hotbar = [1, 2, 3, 4, 5, 9, 10, 13, 14];
let selected = 0;
const hotbarEl = document.getElementById('hotbar');

function buildHotbar() {
  hotbarEl.innerHTML = '';
  hotbar.forEach((id, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    const sw = document.createElement('canvas');
    sw.width = sw.height = 32;
    drawSwatch(sw.getContext('2d'), id);
    slot.appendChild(sw);
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = i + 1;
    slot.appendChild(num);
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = BLOCKS[id].name;
    slot.appendChild(name);
    slot.addEventListener('pointerdown', (e) => { e.stopPropagation(); selectSlot(i); sfx.resume(); });
    hotbarEl.appendChild(slot);
  });
  selectSlot(0);
}
function drawSwatch(ctx, id) {
  const tile = BLOCKS[id].faces[2];
  const tw = texture.image.width / cols;
  const tx = (tile % cols) * tw;
  const ty = Math.floor(tile / cols) * tw;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, 32, 32);
  ctx.drawImage(texture.image, tx, ty, tw, tw, 0, 0, 32, 32);
}
function selectSlot(n) {
  selected = n;
  [...hotbarEl.children].forEach((c, i) => c.classList.toggle('active', i === n));
  sfx.select();
}
buildHotbar();

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

$('btn-share').addEventListener('click', async () => {
  const res = await shareSeed(seed, 'Voxel Craft');
  toast(res === 'shared' ? '共有しました' : res === 'copied' ? 'リンクをコピーしました' : '共有に失敗しました');
});

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

// ---------------------------------------------------------------------------
// Day / night cycle
// ---------------------------------------------------------------------------
let dayTime = 0.28;
const NIGHT = new THREE.Color(0x0a1430);
function updateDayNight(dt) {
  dayTime = (dayTime + dt / 120) % 1;
  const sun = Math.max(0, Math.sin(dayTime * Math.PI * 2 - Math.PI / 2));
  const light = 0.18 + 0.82 * sun;
  matOpaque.color.setRGB(light, light, light);
  matTrans.color.setRGB(light, light, light);
  const sky = NIGHT.clone().lerp(SKY_DAY, sun);
  scene.background.copy(sky);
  scene.fog.color.copy(sky);
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
  if (playing && !frozen) movePlayer(dt);
  syncCamera();
  shakeMag *= 0.82;
  updateChunks();
  updateDayNight(dt);
  updateMining(dt);
  particles.update(dt);

  renderer.render(scene, camera);
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
