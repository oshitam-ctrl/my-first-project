// Minimal THREE stub so world.js/blocks.js can be imported in Node for
// headless logic tests. Only the symbols the logic paths touch are provided.
export class BufferGeometry { setAttribute() { return this; } }
export class Float32BufferAttribute {
  constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; }
}
export class CanvasTexture { constructor(image) { this.image = image; } }
export const NearestFilter = 1003;
export const SRGBColorSpace = 'srgb';
export const DoubleSide = 2;
