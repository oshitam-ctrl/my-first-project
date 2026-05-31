// Block registry + procedurally generated texture atlas (asset-free).
// Every tile is painted into a single canvas, uploaded once as a
// NearestFilter CanvasTexture so all chunk meshes share one material.
import * as THREE from 'three';

export const TILE = 16; // px per tile
export const ATLAS_COLS = 8; // tiles per row in the atlas

// Tile indices into the atlas grid.
const T = {
  grass_top: 0,
  grass_side: 1,
  dirt: 2,
  stone: 3,
  sand: 4,
  log_side: 5,
  log_top: 6,
  leaves: 7,
  water: 8,
  bedrock: 9,
  plank: 10,
  cobble: 11,
  snow: 12,
  glass: 13,
  brick: 14,
  pumpkin_side: 15,
  pumpkin_top: 16,
};

// Block definitions. `faces` = [top, bottom, side] tile indices.
// solid: participates in collision. opaque: culls neighbour faces.
export const BLOCKS = {
  1: { name: 'Grass', faces: [T.grass_top, T.dirt, T.grass_side], solid: true, opaque: true },
  2: { name: 'Dirt', faces: [T.dirt, T.dirt, T.dirt], solid: true, opaque: true },
  3: { name: 'Stone', faces: [T.stone, T.stone, T.stone], solid: true, opaque: true },
  4: { name: 'Sand', faces: [T.sand, T.sand, T.sand], solid: true, opaque: true },
  5: { name: 'Wood', faces: [T.log_top, T.log_top, T.log_side], solid: true, opaque: true },
  6: { name: 'Leaves', faces: [T.leaves, T.leaves, T.leaves], solid: true, opaque: false },
  7: { name: 'Water', faces: [T.water, T.water, T.water], solid: false, opaque: false, liquid: true },
  8: { name: 'Bedrock', faces: [T.bedrock, T.bedrock, T.bedrock], solid: true, opaque: true },
  9: { name: 'Planks', faces: [T.plank, T.plank, T.plank], solid: true, opaque: true },
  10: { name: 'Cobble', faces: [T.cobble, T.cobble, T.cobble], solid: true, opaque: true },
  11: { name: 'Snow', faces: [T.snow, T.dirt, T.snow], solid: true, opaque: true },
  12: { name: 'Glass', faces: [T.glass, T.glass, T.glass], solid: true, opaque: false },
  13: { name: 'Brick', faces: [T.brick, T.brick, T.brick], solid: true, opaque: true },
  14: { name: 'Pumpkin', faces: [T.pumpkin_top, T.pumpkin_top, T.pumpkin_side], solid: true, opaque: true },
};

export function isOpaque(id) {
  return id !== 0 && BLOCKS[id] && BLOCKS[id].opaque;
}
export function isSolid(id) {
  return id !== 0 && BLOCKS[id] && BLOCKS[id].solid;
}
export function isLiquid(id) {
  return id !== 0 && BLOCKS[id] && BLOCKS[id].liquid;
}

// --- procedural tile painting -------------------------------------------

function noisePx(ctx, base, vary) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = (Math.random() - 0.5) * vary;
      const r = clamp(base[0] + n);
      const g = clamp(base[1] + n);
      const b = clamp(base[2] + n);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

const painters = {
  [T.grass_top]: (c) => noisePx(c, [86, 145, 58], 28),
  [T.dirt]: (c) => noisePx(c, [134, 96, 67], 26),
  [T.stone]: (c) => noisePx(c, [128, 128, 130], 22),
  [T.sand]: (c) => noisePx(c, [219, 205, 152], 18),
  [T.leaves]: (c) => {
    noisePx(c, [60, 118, 45], 34);
    // punch a few transparent-ish darker holes for foliage feel
    c.fillStyle = 'rgba(30,70,25,0.6)';
    for (let i = 0; i < 14; i++) c.fillRect((Math.random() * TILE) | 0, (Math.random() * TILE) | 0, 1, 1);
  },
  [T.water]: (c) => noisePx(c, [54, 110, 196], 14),
  [T.bedrock]: (c) => noisePx(c, [40, 40, 44], 30),
  [T.snow]: (c) => noisePx(c, [236, 240, 245], 12),
  [T.cobble]: (c) => {
    noisePx(c, [115, 115, 118], 24);
    c.strokeStyle = 'rgba(60,60,62,0.7)';
    c.strokeRect(0.5, 0.5, 7, 7);
    c.strokeRect(8.5, 4.5, 6, 6);
    c.strokeRect(2.5, 9.5, 6, 5);
  },
  [T.glass]: (c) => {
    c.clearRect(0, 0, TILE, TILE);
    c.fillStyle = 'rgba(180,220,235,0.22)';
    c.fillRect(0, 0, TILE, TILE);
    c.strokeStyle = 'rgba(220,240,250,0.9)';
    c.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
  },
  [T.brick]: (c) => {
    noisePx(c, [156, 74, 60], 12);
    c.strokeStyle = 'rgba(225,210,200,0.85)';
    for (let y = 0; y < TILE; y += 4) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
    for (let y = 0; y < TILE; y += 4) {
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = off; x < TILE; x += 8) {
        c.beginPath();
        c.moveTo(x + 0.5, y);
        c.lineTo(x + 0.5, y + 4);
        c.stroke();
      }
    }
  },
  [T.plank]: (c) => {
    noisePx(c, [167, 130, 78], 16);
    c.strokeStyle = 'rgba(110,82,46,0.8)';
    for (let y = 0; y < TILE; y += 5) {
      c.beginPath();
      c.moveTo(0, y + 0.5);
      c.lineTo(TILE, y + 0.5);
      c.stroke();
    }
  },
  [T.log_side]: (c) => {
    noisePx(c, [104, 78, 47], 14);
    c.strokeStyle = 'rgba(70,50,28,0.7)';
    for (let x = 1; x < TILE; x += 3) {
      c.beginPath();
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, TILE);
      c.stroke();
    }
  },
  [T.log_top]: (c) => {
    noisePx(c, [150, 116, 72], 14);
    c.strokeStyle = 'rgba(96,72,42,0.8)';
    for (let r = 6; r > 0; r -= 2) {
      c.beginPath();
      c.arc(8, 8, r, 0, Math.PI * 2);
      c.stroke();
    }
  },
  [T.grass_side]: (c) => {
    noisePx(c, [134, 96, 67], 26); // dirt base
    // green top strip
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = (Math.random() - 0.5) * 26;
        c.fillStyle = `rgb(${clamp(86 + n)},${clamp(145 + n)},${clamp(58 + n)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  },
  [T.pumpkin_side]: (c) => {
    noisePx(c, [214, 130, 30], 14);
    c.strokeStyle = 'rgba(150,88,18,0.8)';
    for (let x = 2; x < TILE; x += 4) {
      c.beginPath();
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, TILE);
      c.stroke();
    }
  },
  [T.pumpkin_top]: (c) => {
    noisePx(c, [196, 116, 26], 14);
    c.fillStyle = '#6b4a1e';
    c.fillRect(7, 6, 2, 4);
  },
};

export function buildAtlas() {
  const cols = ATLAS_COLS;
  const rows = Math.ceil((Math.max(...Object.values(T)) + 1) / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * TILE;
  canvas.height = rows * TILE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (const idx of Object.values(T)) {
    const tx = (idx % cols) * TILE;
    const ty = Math.floor(idx / cols) * TILE;
    const tile = document.createElement('canvas');
    tile.width = TILE;
    tile.height = TILE;
    const tctx = tile.getContext('2d');
    const paint = painters[idx];
    if (paint) paint(tctx);
    else noisePx(tctx, [200, 0, 200], 0); // missing-texture magenta
    ctx.drawImage(tile, tx, ty);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;

  return { texture, cols, rows };
}

// UV rect for a tile index, with a tiny inset to avoid bleeding.
export function tileUV(idx, cols, rows) {
  const inset = 0.0008;
  const cx = idx % cols;
  const cy = Math.floor(idx / cols);
  const u0 = cx / cols + inset;
  const u1 = (cx + 1) / cols - inset;
  // canvas y is top-down; three UV is bottom-up
  const v1 = 1 - cy / rows - inset;
  const v0 = 1 - (cy + 1) / rows + inset;
  return { u0, v0, u1, v1 };
}
