// Bootstrap: renderer, chunk streaming, player physics, input, UI, day/night.
import * as THREE from 'three';
import { World, CHUNK, HEIGHT, SEA_LEVEL } from './world.js';
import { buildAtlas, BLOCKS, isSolid } from './blocks.js';

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const SKY_DAY = new THREE.Color(0x8fc8ff);
scene.background = SKY_DAY.clone();
const RENDER_DIST = 6; // chunks
const fogFar = RENDER_DIST * CHUNK;
scene.fog = new THREE.Fog(SKY_DAY.clone(), fogFar * 0.45, fogFar);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);

// ---------------------------------------------------------------------------
// World + materials
// ---------------------------------------------------------------------------
const world = new World();
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

  // unload far chunks
  for (const key of meshes.keys()) {
    const [cx, cz] = key.split(',').map(Number);
    if (Math.abs(cx - pcx) > RENDER_DIST + 1 || Math.abs(cz - pcz) > RENDER_DIST + 1) {
      removeChunkMeshes(key);
    }
  }

  // build nearest missing chunk, budgeted
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

  // process dirty re-meshes
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
  yaw: 0,
  pitch: 0,
  onGround: false,
  fly: false,
  width: 0.6,
  height: 1.8,
  eye: 1.62,
};
// spawn on top of terrain
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

function movePlayer(dt) {
  const input = new THREE.Vector3();
  const f = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const r = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  if (keys['KeyW']) input.add(f);
  if (keys['KeyS']) input.sub(f);
  if (keys['KeyD']) input.add(r);
  if (keys['KeyA']) input.sub(r);
  if (input.lengthSq() > 0) input.normalize();

  const speed = player.fly ? FLY : keys['ShiftLeft'] ? SPRINT : WALK;
  player.vel.x = input.x * speed;
  player.vel.z = input.z * speed;

  if (player.fly) {
    let vy = 0;
    if (keys['Space']) vy += FLY;
    if (keys['ShiftLeft']) vy -= FLY;
    player.vel.y = vy;
  } else {
    player.vel.y -= GRAVITY * dt;
    if (keys['Space'] && player.onGround) {
      player.vel.y = JUMP;
      player.onGround = false;
    }
  }

  // resolve per axis
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

  if (p.y < -20) { // fell out of world — respawn
    p.set(8, Math.max(world.heightAt(8, 8), SEA_LEVEL) + 2, 8);
    player.vel.set(0, 0, 0);
  }
}

function syncCamera() {
  camera.position.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch),
    -Math.cos(player.yaw) * Math.cos(player.pitch)
  );
  camera.lookAt(camera.position.clone().add(dir));
}

// ---------------------------------------------------------------------------
// Block targeting + highlight
// ---------------------------------------------------------------------------
const hlGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
const hlEdges = new THREE.LineSegments(
  new THREE.EdgesGeometry(hlGeo),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
);
hlEdges.visible = false;
scene.add(hlEdges);

function currentTarget() {
  const origin = camera.position.clone();
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  return world.raycast(origin, dir, 7);
}

function applyEdit(cx, cz, wx, wy, wz) {
  markDirty(cx, cz);
  // re-mesh neighbours when editing a chunk border
  const lx = wx - cx * CHUNK, lz = wz - cz * CHUNK;
  if (lx === 0) markDirty(cx - 1, cz);
  if (lx === CHUNK - 1) markDirty(cx + 1, cz);
  if (lz === 0) markDirty(cx, cz - 1);
  if (lz === CHUNK - 1) markDirty(cx, cz + 1);
}

function breakBlock() {
  const hit = currentTarget();
  if (!hit) return;
  const [x, y, z] = hit.block;
  if (world.getBlock(x, y, z) === 8) return; // bedrock unbreakable
  world.setBlock(x, y, z, 0);
  applyEdit(Math.floor(x / CHUNK), Math.floor(z / CHUNK), x, y, z);
}

function placeBlock() {
  const hit = currentTarget();
  if (!hit) return;
  const [x, y, z] = hit.place;
  if (y < 1 || y >= HEIGHT) return;
  // don't place inside the player
  const hw = player.width / 2 + 0.02;
  const p = player.pos;
  if (x + 1 > p.x - hw && x < p.x + hw &&
      y + 1 > p.y && y < p.y + player.height &&
      z + 1 > p.z - hw && z < p.z + hw) return;
  if (world.getBlock(x, y, z) !== 0) return;
  world.setBlock(x, y, z, hotbar[selected]);
  applyEdit(Math.floor(x / CHUNK), Math.floor(z / CHUNK), x, y, z);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const keys = {};
let locked = false;
let lastSpace = 0;

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) e.preventDefault();
  if (keys[e.code]) return; // ignore auto-repeat for toggles
  keys[e.code] = true;

  if (e.code === 'Space') {
    const now = performance.now();
    if (now - lastSpace < 280) player.fly = !player.fly; // double-tap to fly
    lastSpace = now;
  }
  if (e.code >= 'Digit1' && e.code <= 'Digit9') {
    const n = parseInt(e.code.slice(5), 10) - 1;
    if (n < hotbar.length) selectSlot(n);
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

canvas.addEventListener('click', () => {
  if (!locked) canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  document.getElementById('overlay').style.display = locked ? 'none' : 'flex';
});
document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  const s = 0.0022;
  player.yaw -= e.movementX * s;
  player.pitch -= e.movementY * s;
  const lim = Math.PI / 2 - 0.01;
  player.pitch = Math.max(-lim, Math.min(lim, player.pitch));
});
document.addEventListener('mousedown', (e) => {
  if (!locked) return;
  if (e.button === 0) breakBlock();
  else if (e.button === 2) placeBlock();
});
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('wheel', (e) => {
  if (!locked) return;
  selectSlot((selected + (e.deltaY > 0 ? 1 : -1) + hotbar.length) % hotbar.length);
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('beforeunload', () => world.saveEdits());

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
    hotbarEl.appendChild(slot);
  });
  selectSlot(0);
}

// draw a small preview swatch by sampling the atlas tile (side face)
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
}

buildHotbar();

// reset button
document.getElementById('reset').addEventListener('click', (e) => {
  e.stopPropagation();
  world.resetWorld();
  for (const key of [...meshes.keys()]) removeChunkMeshes(key);
  location.reload();
});

// ---------------------------------------------------------------------------
// Day / night cycle
// ---------------------------------------------------------------------------
let dayTime = 0.28; // 0..1
const NIGHT = new THREE.Color(0x0a1430);

function updateDayNight(dt) {
  dayTime = (dayTime + dt / 120) % 1; // ~2 min full cycle
  // brightness: 1 at noon, ~0.18 at midnight
  const sun = Math.max(0, Math.sin(dayTime * Math.PI * 2 - Math.PI / 2));
  const light = 0.18 + 0.82 * sun;
  matOpaque.color.setRGB(light, light, light);
  matTrans.color.setRGB(light, light, light);
  const sky = NIGHT.clone().lerp(SKY_DAY, sun);
  scene.background.copy(sky);
  scene.fog.color.copy(sky);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
const hud = document.getElementById('hud');
let frames = 0, fpsTime = 0, fps = 0;

function updateHud(dt) {
  frames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = Math.round(frames / fpsTime);
    frames = 0;
    fpsTime = 0;
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
function loop() {
  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05; // clamp to avoid tunnelling on hitches

  if (locked) movePlayer(dt);
  syncCamera();
  updateChunks();
  updateDayNight(dt);

  const hit = currentTarget();
  if (hit) {
    hlEdges.visible = true;
    hlEdges.position.set(hit.block[0] + 0.5, hit.block[1] + 0.5, hit.block[2] + 0.5);
  } else {
    hlEdges.visible = false;
  }

  renderer.render(scene, camera);
  updateHud(dt);
  requestAnimationFrame(loop);
}
loop();
