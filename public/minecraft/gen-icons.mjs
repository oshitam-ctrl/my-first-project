// gen-icons.mjs — dependency-free PNG icon generator for Voxel Craft.
//
// Encodes 8-bit RGBA PNGs by hand: PNG signature + IHDR + IDAT + IEND,
// each chunk length-prefixed and CRC32-checked. IDAT is raw scanlines
// (filter byte 0 per row) compressed with node:zlib deflateSync.
//
// Run:  node gen-icons.mjs
// Emits icon-192.png (192x192) and icon-512.png (512x512) beside this file.

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));

// ---- CRC32 (PNG polynomial 0xEDB88320) -----------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// ---- Chunk writer --------------------------------------------------------
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// ---- RGBA buffer -> PNG --------------------------------------------------
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 = truecolor + alpha (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data: one filter byte (0 = None) per scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Tiny drawing helpers ------------------------------------------------
function makeCanvas(size) {
  return { size, data: Buffer.alloc(size * size * 4) };
}

function setPx(cv, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= cv.size || y >= cv.size) return;
  const i = (y * cv.size + x) * 4;
  cv.data[i] = r;
  cv.data[i + 1] = g;
  cv.data[i + 2] = b;
  cv.data[i + 3] = a;
}

function fillRect(cv, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setPx(cv, x, y, color);
  }
}

// Filled rounded square (used for the background plate).
function fillRoundedRect(cv, x0, y0, w, h, radius, color) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = true;
      // Corner regions: keep only pixels within `radius` of the corner arc.
      const cx = x < radius ? radius : x >= w - radius ? w - 1 - radius : x;
      const cy = y < radius ? radius : y >= h - radius ? h - 1 - radius : y;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > radius * radius) inside = false;
      if (inside) setPx(cv, x0 + x, y0 + y, color);
    }
  }
}

// ---- Draw an isometric grass block on a sky-blue rounded plate -----------
function drawIcon(size) {
  const cv = makeCanvas(size);
  const s = size / 192; // scale factor relative to the 192 design grid.
  const R = (n) => Math.round(n * s);

  const SKY = [143, 200, 255, 255]; // #8fc8ff
  const GRASS_TOP = [122, 196, 78, 255]; // bright grass green
  const GRASS_DARK = [90, 168, 69, 255]; // #5aa845 side shade
  const DIRT_LIGHT = [150, 105, 66, 255];
  const DIRT_DARK = [120, 82, 50, 255];
  const OUTLINE = [38, 32, 28, 255];

  // Background rounded plate.
  fillRoundedRect(cv, 0, 0, size, size, R(34), SKY);

  // Isometric cube geometry on the design grid, then scaled.
  const cx = size / 2;
  const topY = R(44); // apex of the top face
  const halfW = R(64); // half width of the cube at its widest
  const faceH = R(56); // vertical height of a side face
  const midY = topY + R(40); // where the top diamond meets the sides

  // --- Top face (grass), a diamond ---
  for (let y = topY; y <= midY; y++) {
    const t = (y - topY) / (midY - topY); // 0..1 down the top diamond
    const spread = Math.round(halfW * t);
    for (let x = cx - spread; x <= cx + spread; x++) {
      setPx(cv, x, y, GRASS_TOP);
    }
  }

  // --- Left side face ---
  for (let y = 0; y < faceH; y++) {
    const yy = midY + y;
    // left edge climbs from apex-left down; columns span the lower-left rhombus
    for (let x = cx - halfW; x <= cx; x++) {
      const edge = midY + Math.round((cx - x) / halfW * 0) ; // flat top boundary
      void edge;
      // bottom boundary of left face slopes down toward center
      const bottom = midY + faceH + Math.round((x - (cx - halfW)) / halfW * 0);
      if (yy <= bottom) {
        // top strip = grass side, rest = dirt
        if (y < R(14)) setPx(cv, x, yy, GRASS_DARK);
        else setPx(cv, x, yy, DIRT_LIGHT);
      }
    }
  }

  // --- Right side face ---
  for (let y = 0; y < faceH; y++) {
    const yy = midY + y;
    for (let x = cx; x <= cx + halfW; x++) {
      if (y < R(14)) setPx(cv, x, yy, GRASS_DARK);
      else setPx(cv, x, yy, DIRT_DARK);
    }
  }

  // --- A few dirt speckles for texture (right face) ---
  fillRect(cv, cx + R(18), midY + R(26), R(8), R(8), DIRT_LIGHT);
  fillRect(cv, cx + R(40), midY + R(38), R(7), R(7), DIRT_LIGHT);
  // grass speckles on left face top strip
  fillRect(cv, cx - R(40), midY + R(4), R(7), R(6), GRASS_TOP);

  // --- Chunky outlines around the cube silhouette + inner edges ---
  const drawLine = (x1, y1, x2, y2, color, thick) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x1 + (dx * i) / steps);
      const y = Math.round(y1 + (dy * i) / steps);
      for (let ox = 0; ox < thick; ox++) {
        for (let oy = 0; oy < thick; oy++) {
          setPx(cv, x + ox, y + oy, color);
        }
      }
    }
  };

  const th = Math.max(2, R(4));
  // top diamond edges
  drawLine(cx, topY, cx - halfW, midY, OUTLINE, th);
  drawLine(cx, topY, cx + halfW, midY, OUTLINE, th);
  drawLine(cx - halfW, midY, cx, midY + R(40), OUTLINE, th);
  drawLine(cx + halfW, midY, cx, midY + R(40), OUTLINE, th);
  // vertical edges
  drawLine(cx - halfW, midY, cx - halfW, midY + faceH, OUTLINE, th);
  drawLine(cx + halfW, midY, cx + halfW, midY + faceH, OUTLINE, th);
  drawLine(cx, midY + R(40), cx, midY + faceH + R(40), OUTLINE, th);
  // bottom edges
  drawLine(cx - halfW, midY + faceH, cx, midY + faceH + R(40), OUTLINE, th);
  drawLine(cx + halfW, midY + faceH, cx, midY + faceH + R(40), OUTLINE, th);

  return encodePNG(size, size, cv.data);
}

// ---- Emit the two icons --------------------------------------------------
for (const size of [192, 512]) {
  const png = drawIcon(size);
  const file = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, png);
  console.log(`wrote ${file} (${png.length} bytes, ${size}x${size})`);
}
