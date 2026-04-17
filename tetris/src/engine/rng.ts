// シード可能 PRNG (Mulberry32) と 7-bag ランダマイザ。
// 同じシードなら必ず同じ順列が出るため、リプレイ・テスト・デバッグが安定する。

import { PieceKind } from './types';

export type PRNG = () => number; // [0,1)

export function mulberry32(seed: number): PRNG {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL: PieceKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function shuffle<T>(arr: T[], rand: PRNG): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class SevenBag {
  private rand: PRNG;
  private queue: PieceKind[] = [];

  constructor(seed: number) {
    this.rand = mulberry32(seed);
    this.refill();
  }

  private refill() {
    this.queue.push(...shuffle(ALL, this.rand));
  }

  peek(n: number): PieceKind[] {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }

  next(): PieceKind {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }
}
