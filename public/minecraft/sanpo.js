// sanpo.js — 「南方さんぽ」: a latching stroll-checklist around the old
// 南方小学校 grounds (quest.js-style: monotonic latches + a single guarded
// onComplete). Visit every spot once and the cafe/bakery folks reward you
// with a ロスパン袋 (rescue_bag, handled by the caller's onComplete).
//
//   import { createSanpo } from './sanpo.js';
//   const sanpo = createSanpo({ onComplete: () => inv.collect('rescue_bag', 1) });
//   sanpo.update(player.pos);   // each frame (pos = {x,y,z} in world coords)
//   sanpo.credit('yard_lunch'); // scripted credits (e.g. 校庭ランチ bonus)
//
// The proximity/latching logic is PURE (createSanpoLogic — no DOM), so it can
// be unit-tested headlessly (sanpo.test.mjs). createSanpo wraps the logic in a
// small collapsed HUD chip that sits under the quest panel.

// Stroll spots (world x,z; latch within `r` blocks horizontally). The music
// room is on the 2nd floor, so it additionally requires the player to be high
// enough (minY, world feet-y) — standing under it on the 1st floor doesn't count.
export const SANPO_SPOTS = [
  { id: 'entrance', label: '昇降口',             x: 8,    z: -26, r: 4 },
  { id: 'plaza',    label: 'コミュニティー広場', x: 2.5,  z: -39, r: 4 },
  { id: 'library',  label: '図書室',             x: 37.5, z: -39, r: 4 },
  { id: 'music',    label: '音楽室（2F）',       x: -8.5, z: -39, r: 4, minY: 36 },
  { id: 'gym',      label: '体育館',             x: 38,   z: -4,  r: 4 },
  { id: 'shrine',   label: '神社',               x: 64,   z: -24, r: 4 },
];

// ---------------------------------------------------------------------------
// Pure latching logic — no DOM, fully unit-testable.
// ---------------------------------------------------------------------------
export function createSanpoLogic(opts) {
  const spots = (opts && opts.spots) || SANPO_SPOTS;
  const onComplete = (opts && typeof opts.onComplete === 'function') ? opts.onComplete : () => {};

  const latched = spots.map(() => false);
  const extras = new Set();  // scripted credits that aren't checklist spots
  let done = false;
  let completedOnce = false; // guards single onComplete() call (quest.js pattern)

  function evaluate() {
    done = latched.every(Boolean);
    if (done && !completedOnce) {
      completedOnce = true;
      onComplete();
    }
    return done;
  }

  // update(pos): latch any spot the player is standing in. Latches are
  // monotonic — leaving a spot never un-checks it. Returns true when the
  // visit set changed this call (lets the DOM layer re-render lazily).
  function update(pos) {
    if (!pos) return false;
    let changed = false;
    for (let i = 0; i < spots.length; i++) {
      if (latched[i]) continue;
      const s = spots[i];
      if (s.minY != null && !(pos.y > s.minY)) continue; // 2F spots need altitude
      const dx = pos.x - s.x, dz = pos.z - s.z;
      if (Math.hypot(dx, dz) <= (s.r != null ? s.r : 4)) {
        latched[i] = true;
        changed = true;
      }
    }
    if (changed) evaluate();
    return changed;
  }

  // credit(id): scripted latch by spot id (e.g. an event grants the visit).
  // Unknown ids are remembered as bonus "extras" but never affect completion.
  function credit(id) {
    const i = spots.findIndex((s) => s.id === id);
    if (i >= 0) {
      if (!latched[i]) { latched[i] = true; evaluate(); }
      return true;
    }
    extras.add(id);
    return false;
  }

  return {
    spots,
    update,
    credit,
    extras,
    count: () => latched.filter(Boolean).length,
    isLatched: (i) => !!latched[i],
    get done() { return done; },
  };
}

// ---------------------------------------------------------------------------
// HUD chip — a small collapsed pill under the quest panel; tap to expand the
// per-spot checklist. DOM pattern mirrors quest.js (inline styles, no CSS).
// ---------------------------------------------------------------------------
export function createSanpo(opts) {
  const logic = createSanpoLogic(opts);
  const total = logic.spots.length;

  const el = document.createElement('div');
  const ps = el.style;
  ps.position = 'fixed';
  // sits just below the quest panel (quest tops at 36px and is ~150px tall)
  ps.top = 'calc(196px + env(safe-area-inset-top, 0px))';
  ps.left = 'calc(8px + env(safe-area-inset-left, 0px))';
  ps.zIndex = '7';
  ps.maxWidth = '230px';
  ps.padding = '5px 9px';
  ps.borderRadius = '10px';
  ps.background = 'rgba(20, 16, 12, 0.55)';
  ps.color = '#fdf3e3';
  ps.font = '600 11px/1.45 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ps.letterSpacing = '0.2px';
  ps.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
  ps.userSelect = 'none';
  ps.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  ps.backdropFilter = 'blur(2px)';
  ps.pointerEvents = 'auto'; // unlike the quest panel: the chip is tappable
  ps.cursor = 'pointer';

  // Collapsed title line: 🚶 南方さんぽ n/6
  const titleEl = document.createElement('div');
  titleEl.style.fontSize = '12px';
  el.appendChild(titleEl);

  // Expandable spot list (collapsed by default).
  const listEl = document.createElement('div');
  listEl.style.display = 'none';
  listEl.style.marginTop = '3px';
  el.appendChild(listEl);

  const rows = logic.spots.map((s) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '4px';
    row.style.margin = '1px 0';
    const mark = document.createElement('span');
    const text = document.createElement('span');
    text.textContent = s.label;
    row.appendChild(mark);
    row.appendChild(text);
    listEl.appendChild(row);
    return { row, mark, text };
  });

  let expanded = false;
  el.addEventListener('click', () => {
    expanded = !expanded;
    listEl.style.display = expanded ? '' : 'none';
    render();
  });

  function render() {
    const n = logic.count();
    titleEl.textContent = logic.done
      ? `🚶 南方さんぽ ${n}/${total} 🎉`
      : `🚶 南方さんぽ ${n}/${total}${expanded ? '' : ' ▸'}`;
    if (!expanded) return;
    for (let i = 0; i < rows.length; i++) {
      const ok = logic.isLatched(i);
      rows[i].mark.textContent = ok ? '✅' : '・';
      rows[i].row.style.opacity = ok ? '0.7' : '1';
    }
  }

  document.body.appendChild(el);
  render();

  function update(playerPos) {
    if (logic.update(playerPos)) render();
    return logic.done;
  }

  function credit(id) {
    const r = logic.credit(id);
    render();
    return r;
  }

  return {
    update,
    credit,
    el,
    count: logic.count,
    get done() { return logic.done; },
  };
}

export default createSanpo;
