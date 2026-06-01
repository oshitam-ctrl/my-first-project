// Node test for sky.js using a tiny stub THREE namespace (no real WebGL).
// Run: node sky.test.mjs
import assert from 'node:assert';

// ---- minimal stub THREE ---------------------------------------------------
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
}
class Color {
  constructor() { this.r = 1; this.g = 1; this.b = 1; }
  setHex() { return this; }
  setRGB(r, g, b) { this.r = r; this.g = g; this.b = b; return this; }
}
class Object3D {
  constructor() {
    this.position = new Vector3();
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = new Vector3(1, 1, 1);
    this.children = [];
    this.visible = true;
    this.frustumCulled = true;
    this.renderOrder = 0;
  }
  add(o) { this.children.push(o); return this; }
  remove(o) {
    const i = this.children.indexOf(o);
    if (i >= 0) this.children.splice(i, 1);
    return this;
  }
}
class Group extends Object3D {}
class Mesh extends Object3D {
  constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
}
class Points extends Object3D {
  constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
}
class Sprite extends Object3D {
  constructor(material) { super(); this.material = material; }
}
class SpriteMaterial { constructor(o = {}) { Object.assign(this, o); this.color = new Color(); } }
class CircleGeometry { constructor() { this.attributes = {}; } dispose() {} }
class BoxGeometry { constructor() { this.attributes = {}; } dispose() {} }
class SphereGeometry { constructor() { this.attributes = {}; } dispose() {} }
class BufferGeometry {
  constructor() { this.attributes = {}; }
  setAttribute(name, attr) { this.attributes[name] = attr; return this; }
  dispose() {}
}
class Float32BufferAttribute {
  constructor(array) { this.array = array; this.needsUpdate = false; }
}
class MeshBasicMaterial { constructor(o = {}) { Object.assign(this, o); if (!this.color) this.color = new Color(); } dispose() {} }
class PointsMaterial { constructor(o = {}) { Object.assign(this, o); if (!this.color) this.color = new Color(); } dispose() {} }

const THREE = {
  Vector3, Color, Group, Mesh, Points, Sprite, SpriteMaterial,
  CircleGeometry, BoxGeometry, SphereGeometry, BufferGeometry,
  Float32BufferAttribute, MeshBasicMaterial, PointsMaterial,
};

const scene = new Group();
const camera = { position: new Vector3(10, 70, -5) };

const { createSky } = await import('./sky.js');

// 1. builds + adds to scene
const sky = createSky({ THREE, scene, camera, renderDist: 8 });
assert.ok(sky, 'createSky returns api');
assert.ok(scene.children.length >= 1, 'sky added an object to the scene');

// 2. api shape
assert.strictEqual(typeof sky.update, 'function', 'update fn');
assert.strictEqual(typeof sky.setWeather, 'function', 'setWeather fn');
assert.strictEqual(typeof sky.weather, 'function', 'weather fn');
assert.strictEqual(typeof sky.setEnabled, 'function', 'setEnabled fn');

// 3. update runs many times (noon and night) without throwing
assert.doesNotThrow(() => {
  for (let i = 0; i < 200; i++) {
    sky.update(0.1, 1, 0.3);
    sky.update(0.1, 0, 0.8);
  }
}, 'update loop');

// 4. weather switching
assert.doesNotThrow(() => {
  sky.setWeather('rain');
  for (let i = 0; i < 100; i++) sky.update(0.05, 0.5, 0.5);
}, 'rain');
assert.strictEqual(sky.weather(), 'rain', 'weather() reports rain');

assert.doesNotThrow(() => {
  sky.setWeather('snow');
  for (let i = 0; i < 100; i++) sky.update(0.05, 0.2, 0.9);
}, 'snow');
assert.strictEqual(sky.weather(), 'snow', 'weather() reports snow');

assert.doesNotThrow(() => { sky.setWeather('clear'); }, 'clear');
assert.strictEqual(sky.weather(), 'clear', 'weather() reports clear');

// 5. enable/disable
assert.doesNotThrow(() => {
  sky.setEnabled(false);
  sky.update(0.1, 1, 0.25); // should early-return, no throw
  sky.setEnabled(true);
  sky.setWeather('rain');
  sky.update(0.1, 0, 0.75);
}, 'setEnabled toggling');

// 6. camera follow: root position copied from camera
const root = scene.children[0];
assert.strictEqual(root.position.x, camera.position.x, 'root follows camera x');

console.log('all sky tests passed');
