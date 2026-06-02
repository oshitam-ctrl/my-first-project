// Fuller THREE stub: enough surface for main.js + particles.js to evaluate and
// run one frame headlessly so we can catch real startup-time JS errors.
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { this.x = s; this.y = s; this.z = s; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new V3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
  lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
}
class Color {
  constructor() { this.r = 1; this.g = 1; this.b = 1; }
  clone() { return new Color(); }
  copy() { return this; }
  lerp() { return this; }
  set() { return this; }
  setRGB() { return this; }
  setHex() { return this; }
  setHSL() { return this; }
  multiplyScalar() { return this; }
  offsetHSL() { return this; }
}
export const Vector3 = V3;
export { Color };
export class Fog { constructor(color, near, far) { this.color = new Color(); this.near = near; this.far = far; } }
export class Scene { constructor() { this.background = new Color(); this.fog = null; } add() {} remove() {} }
export class PerspectiveCamera {
  constructor() { this.position = new V3(); this.aspect = 1; }
  updateProjectionMatrix() {}
  lookAt() {}
  getWorldDirection(v) { v.set(0, -1, 0); return v; }
}
export class WebGLRenderer { constructor() {} setPixelRatio() {} setSize() {} render() {} }
export class MeshBasicMaterial { constructor(o = {}) { Object.assign(this, o); this.color = new Color(); } }
export class LineBasicMaterial { constructor(o = {}) { Object.assign(this, o); } }
export class BoxGeometry { constructor() {} dispose() {} }
export class EdgesGeometry { constructor() {} }
export class BufferGeometry { constructor() {} setAttribute() { return this; } dispose() {} }
export class Float32BufferAttribute { constructor(a, b) { this.array = a; this.itemSize = b; } }
export class Mesh {
  constructor(geo, mat) {
    this.geometry = geo || new BufferGeometry();
    this.material = mat || new MeshBasicMaterial();
    this.position = new V3();
    this.scale = { setScalar() {}, set() {} };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.userData = {};
    this.visible = true; this.renderOrder = 0; this.frustumCulled = true;
  }
}
export class LineSegments { constructor() { this.position = new V3(); this.visible = false; } }
export class CanvasTexture { constructor(image) { this.image = image; } }
export class Group {
  constructor() { this.position = new V3(); this.rotation = { x: 0, y: 0, z: 0 }; this.scale = new V3(1, 1, 1); this.children = []; this.visible = true; this.frustumCulled = true; }
  add(o) { this.children.push(o); return this; }
  remove() {}
  traverse(fn) { fn(this); this.children.forEach((c) => c.traverse ? c.traverse(fn) : fn(c)); }
}
export class Points {
  constructor(geo, mat) { this.geometry = geo || new BufferGeometry(); this.material = mat || new PointsMaterial(); this.position = new V3(); this.rotation = { x: 0, y: 0, z: 0 }; this.visible = true; this.frustumCulled = true; this.renderOrder = 0; }
}
export class PointsMaterial { constructor(o = {}) { Object.assign(this, o); this.color = new Color(); this.opacity = o.opacity ?? 1; } }
export class CircleGeometry { constructor() {} dispose() {} }
export class SphereGeometry { constructor() {} dispose() {} }
export class PlaneGeometry { constructor() {} dispose() {} }
export class Sprite { constructor(mat) { this.material = mat || {}; this.position = new V3(); this.scale = new V3(1, 1, 1); this.visible = true; this.frustumCulled = true; } }
export class SpriteMaterial { constructor(o = {}) { Object.assign(this, o); this.color = new Color(); this.opacity = o.opacity ?? 1; } }
export const AdditiveBlending = 2;
export const NormalBlending = 1;
export const NearestFilter = 1003;
export const SRGBColorSpace = 'srgb';
export const DoubleSide = 2;
