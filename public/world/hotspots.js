// hotspots.js — 近接インタラクションの純ロジック（sanpo.js のパターン）。
// update(pos) は「いま反応できる最寄りのスポット」を返す（なければ null）。
// DOM（プロンプト表示）と実行は main.js / dialog.js 側の責務。

export function createHotspotLogic(spots) {
  let active = null;

  function update(pos) {
    if (!pos) return (active = null);
    let best = null, bestD = Infinity;
    for (const s of spots) {
      const d = Math.hypot(pos.x - s.x, pos.z - s.z);
      if (d <= s.r && d < bestD) { best = s; bestD = d; }
    }
    active = best;
    return active;
  }

  return {
    update,
    get active() { return active; },
  };
}
