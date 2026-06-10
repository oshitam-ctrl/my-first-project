// quality.js — 端末別の品質プリセット（1箇所で管理）。
// low(モバイル): MSAA/SSAO/ポスプロ無し・簡易水面・地形分割減・PR上限低め。

import { isTouchDevice } from './touch.js';

export function detectQuality() {
  const touch = isTouchDevice();
  return touch
    ? { name: 'low', touch, prCap: 1.25, terrainSegments: 170, post: false }
    : { name: 'high', touch, prCap: 1.5, terrainSegments: 230, post: true };
}
