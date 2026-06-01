// Fuller THREE stub: enough surface for main.js + particles.js to evaluate and
// run one frame headlessly so we can catch real startup-time JS errors.
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new V3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
  lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
}
class Color {
  constructor() {}
  clone() { return new Color(); }
  copy() { return this; }
  lerp() { return this; }
  setRGB() { return this; }
  setHex() { return this; }
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
    this.scale = { setScalar() {} };
    this.visible = true; this.renderOrder = 0; this.frustumCulled = true;
  }
}
export class LineSegments { constructor() { this.position = new V3(); this.visible = false; } }
export class CanvasTexture { constructor(image) { this.image = image; } }
export const NearestFilter = 1003;
export const SRGBColorSpace = 'srgb';
export const DoubleSide = 2;
