// quest.js — always-visible step-by-step QUEST checklist for プチヘルメース.
// Self-contained ES module: no imports, inline styles only, no external CSS.
//
//   import { createQuest } from './quest.js';
//   const quest = createQuest({ onComplete: () => playFanfare() });
//   quest.update({ wheat, veg, levain, bread, nearBaker });
//   quest.reset();
//
// API: { update(state), reset(), el, done }

// Ordered step definitions. Each `done(state)` returns whether it is satisfied,
// and `progress(state)` returns a compact "n/1" style string.
const STEPS = [
  {
    label: '畑で小麦を集める',
    done: (s) => num(s.wheat) >= 1,
    progress: (s) => `${Math.min(num(s.wheat), 1)}/1`,
  },
  {
    label: '規格外野菜を集める',
    done: (s) => num(s.veg) >= 1,
    progress: (s) => `${Math.min(num(s.veg), 1)}/1`,
  },
  {
    label: '空き瓶＋野菜で“発酵液”をつくる',
    done: (s) => num(s.levain) >= 1,
    progress: (s) => `${Math.min(num(s.levain), 1)}/1`,
  },
  {
    label: '発酵液＋小麦粉でパンを焼く',
    done: (s) => num(s.bread) >= 1,
    progress: (s) => `${Math.min(num(s.bread), 1)}/1`,
  },
  {
    label: '店主にパンを届ける',
    done: (s) => !!s.nearBaker && num(s.bread) >= 1,
    progress: (s) => `${(!!s.nearBaker && num(s.bread) >= 1) ? 1 : 0}/1`,
  },
];

function num(v) {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

const TITLE = '🥖 今日のしごと';
const CELEBRATION = '🎉 パンが焼けました！本日のプチヘルメース、開店です';

export function createQuest(opts) {
  const onComplete = (opts && typeof opts.onComplete === 'function')
    ? opts.onComplete
    : () => {};

  // --- HUD panel: top-left, just below the FPS HUD ---
  const el = document.createElement('div');
  const ps = el.style;
  ps.position = 'fixed';
  ps.top = 'calc(36px + env(safe-area-inset-top, 0px))';
  ps.left = 'calc(8px + env(safe-area-inset-left, 0px))';
  ps.zIndex = '7';
  ps.maxWidth = '230px';
  ps.padding = '6px 9px';
  ps.borderRadius = '10px';
  ps.background = 'rgba(20, 16, 12, 0.55)';
  ps.color = '#fdf3e3';
  ps.font = '600 11px/1.45 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ps.letterSpacing = '0.2px';
  ps.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
  ps.pointerEvents = 'none'; // never blocks the game
  ps.userSelect = 'none';
  ps.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  ps.backdropFilter = 'blur(2px)';

  // Title line.
  const titleEl = document.createElement('div');
  titleEl.textContent = TITLE;
  titleEl.style.marginBottom = '4px';
  titleEl.style.fontSize = '12px';
  el.appendChild(titleEl);

  // List container holds either the per-step rows or the celebration line.
  const listEl = document.createElement('div');
  el.appendChild(listEl);

  // Build one row per step up front; we only mutate their contents on update.
  const rows = STEPS.map(() => {
    const row = document.createElement('div');
    const rs = row.style;
    rs.display = 'flex';
    rs.alignItems = 'baseline';
    rs.gap = '4px';
    rs.margin = '1px 0';
    rs.whiteSpace = 'normal';

    const mark = document.createElement('span');
    mark.style.flex = '0 0 auto';
    const text = document.createElement('span');
    text.style.flex = '1 1 auto';
    const prog = document.createElement('span');
    prog.style.flex = '0 0 auto';
    prog.style.opacity = '0.65';
    prog.style.fontVariantNumeric = 'tabular-nums';

    row.appendChild(mark);
    row.appendChild(text);
    row.appendChild(prog);
    listEl.appendChild(row);
    return { row, mark, text, prog };
  });

  // Celebration line (hidden until completion).
  const celebrateEl = document.createElement('div');
  celebrateEl.textContent = CELEBRATION;
  celebrateEl.style.display = 'none';
  celebrateEl.style.color = '#ffe7a8';
  celebrateEl.style.lineHeight = '1.5';
  el.appendChild(celebrateEl);

  document.body.appendChild(el);

  let done = false;          // true once all steps satisfied
  let completedOnce = false; // guards single onComplete() call

  function renderSteps(state) {
    listEl.style.display = '';
    celebrateEl.style.display = 'none';
    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i];
      const r = rows[i];
      const ok = step.done(state);
      r.mark.textContent = ok ? '✅' : '・';
      r.text.textContent = step.label;
      r.prog.textContent = step.progress(state);
      // Dim completed text slightly.
      r.text.style.opacity = ok ? '0.55' : '1';
      r.row.style.opacity = ok ? '0.85' : '1';
    }
  }

  function renderCelebration() {
    listEl.style.display = 'none';
    celebrateEl.style.display = '';
  }

  function update(state) {
    const s = state || {};
    const allDone = STEPS.every((step) => step.done(s));
    done = allDone;

    if (allDone) {
      renderCelebration();
      if (!completedOnce) {
        completedOnce = true;
        onComplete();
      }
    } else {
      renderSteps(s);
    }
    return done;
  }

  function reset() {
    done = false;
    completedOnce = false;
    renderSteps({});
  }

  // Initial paint: nothing collected.
  renderSteps({});

  const api = {
    update,
    reset,
    el,
    get done() { return done; },
  };
  return api;
}
