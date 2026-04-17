// プレースホルダアイコン生成。Node 標準ライブラリのみ使用。
// 黒背景に白の「T」を描いた単純な PNG を 192/512 で出す。

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ TABLE[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}
const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size) {
  // RGBA8
  const w = size, h = size;
  // 画素データ：各行の先頭に filter byte 0
  const rowLen = 1 + w * 4;
  const raw = Buffer.alloc(rowLen * h);
  // 背景黒 (0,0,0,255)、T形状を白で
  // T：上端バー（高さ size*0.18）＋中央縦棒（幅 size*0.18）
  const barH = Math.round(size * 0.18);
  const stemW = Math.round(size * 0.18);
  const pad = Math.round(size * 0.18);
  const topY0 = pad;
  const topY1 = pad + barH;
  const topX0 = pad;
  const topX1 = size - pad;
  const stemX0 = Math.floor((size - stemW) / 2);
  const stemX1 = stemX0 + stemW;
  const stemY1 = size - pad;
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0; // filter
    for (let x = 0; x < w; x++) {
      const off = y * rowLen + 1 + x * 4;
      let isWhite = false;
      if (y >= topY0 && y < topY1 && x >= topX0 && x < topX1) isWhite = true;
      if (y >= topY0 && y < stemY1 && x >= stemX0 && x < stemX1) isWhite = true;
      const v = isWhite ? 255 : 0;
      raw[off] = v; raw[off + 1] = v; raw[off + 2] = v; raw[off + 3] = 255;
    }
  }
  const idat = deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(6, 9);  // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(new URL('../public/icon-192.png', import.meta.url), makePng(192));
writeFileSync(new URL('../public/icon-512.png', import.meta.url), makePng(512));
console.log('generated icon-192.png and icon-512.png');
