// One-tap "パン工房" counter — the casual, no-puzzle path to baking.
//
// Non-gamers (the shop's Instagram followers, on a phone, for ~2-3 min) bounce
// off Minecraft's 2x2/3x3 crafting grid. This panel replaces that puzzle with a
// recipe book: tap 仕込む to seal a fermentation jar (which then bubbles for a
// while → 発酵液), and tap 焼く！ on a card to bake — ingredients are deducted
// and the bread appears. Cards grey out until you can afford them, so it's
// impossible to get "stuck not knowing what to do".
//
// Deps are injected (inv, ferment tracker, sfx, toast, itemDef, onBake) so the
// module owns only its DOM. Reads/writes the shared inventory; never reaches
// into the engine.

// Flattened one-tap bakes (mirror crafting.js, minus the levain step which is
// time-based fermentation below). Ordered easiest → signature.
const BAKES = [
  { result: 'flour',         count: 1, emoji: '🌾', need: [['wheat', 3]] },
  { result: 'bread',         count: 2, emoji: '🍞', need: [['levain', 1], ['wheat', 1]] },
  { result: 'baguette',      count: 1, emoji: '🥖', need: [['flour', 1], ['levain', 1]] },
  { result: 'campagne',      count: 1, emoji: '🍞', need: [['levain', 1], ['flour', 2]] },
  { result: 'pain_de_mie',   count: 1, emoji: '🍞', need: [['levain', 1], ['flour', 1], ['wheat', 1]] },
  { result: 'rosemary_bread', count: 1, emoji: '🌿', need: [['campagne', 1], ['rosemary', 1]] },
  { result: 'apple_bread',   count: 1, emoji: '🍎', need: [['campagne', 1], ['thinned_apple', 1]] },
  { result: 'fruit_bread',   count: 1, emoji: '🍇', need: [['campagne', 1], ['ripe_fruit', 1]] },
];

const FERMENT_NEED = [['empty_jar', 1], ['surplus_veg', 1]];

export function createBakery({ inv, ferment, sfx, toast, itemDef, onBake, now = () => performance.now() }) {
  const name = (id) => (itemDef(id)?.name || id);
  const has = (need) => need.every(([id, n]) => inv.count(id) >= n);

  // ---- DOM ----------------------------------------------------------------
  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed', inset: '0', zIndex: '12', display: 'none',
    background: 'rgba(20,26,24,.62)', backdropFilter: 'blur(2px)',
    alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box',
  });
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    width: 'min(560px, 96vw)', maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    background: 'linear-gradient(180deg,#3a2f25,#2b231b)', color: '#f3ead9',
    border: '3px solid #6b5640', borderRadius: '16px', padding: '16px 16px 22px',
    boxShadow: '0 18px 50px rgba(0,0,0,.55)', font: '14px/1.5 system-ui,sans-serif',
  });
  root.appendChild(panel);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });

  const head = document.createElement('div');
  Object.assign(head.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' });
  const title = document.createElement('div');
  title.innerHTML = '🥖 <b>パン工房</b>';
  title.style.fontSize = '19px';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  Object.assign(closeBtn.style, { background: 'transparent', border: 'none', color: '#f3ead9', fontSize: '22px', cursor: 'pointer', lineHeight: '1' });
  closeBtn.addEventListener('click', close);
  head.appendChild(title); head.appendChild(closeBtn);
  panel.appendChild(head);

  // --- Fermentation section ---
  const fermSec = document.createElement('div');
  Object.assign(fermSec.style, { background: 'rgba(0,0,0,.22)', border: '1px solid #5c4a36', borderRadius: '12px', padding: '12px', marginBottom: '14px' });
  const fermHead = document.createElement('div');
  fermHead.innerHTML = '🫙 <b>発酵</b> <span style="opacity:.7;font-size:12px">— 規格外野菜を瓶に仕込んで天然酵母（発酵液）に</span>';
  fermHead.style.marginBottom = '8px';
  fermSec.appendChild(fermHead);
  const startBtn = document.createElement('button');
  Object.assign(startBtn.style, bigBtnStyle('#7a5'));
  startBtn.addEventListener('click', () => {
    if (!has(FERMENT_NEED)) { toast('🫙 空き瓶と規格外野菜が必要です'); return; }
    for (const [id, n] of FERMENT_NEED) inv.take(id, n);
    ferment.start(now());
    sfx && sfx.craft && sfx.craft();
    toast('🫙 瓶に仕込みました。ぷくぷく…発酵を待とう');
    render();
  });
  fermSec.appendChild(startBtn);
  const jarList = document.createElement('div');
  jarList.style.marginTop = '10px';
  fermSec.appendChild(jarList);
  panel.appendChild(fermSec);

  // --- Bake section ---
  const bakeHead = document.createElement('div');
  bakeHead.innerHTML = '🔥 <b>焼く</b> <span style="opacity:.7;font-size:12px">— 材料がそろえばワンタップ</span>';
  bakeHead.style.margin = '2px 2px 8px';
  panel.appendChild(bakeHead);
  const bakeList = document.createElement('div');
  Object.assign(bakeList.style, { display: 'grid', gap: '8px' });
  panel.appendChild(bakeList);

  const cards = BAKES.map((b) => {
    const card = document.createElement('div');
    Object.assign(card.style, { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,.18)', border: '1px solid #5c4a36', borderRadius: '10px', padding: '8px 10px' });
    const ico = document.createElement('div'); ico.textContent = b.emoji; ico.style.fontSize = '26px';
    const info = document.createElement('div'); info.style.flex = '1'; info.style.minWidth = '0';
    const nm = document.createElement('div'); nm.style.fontWeight = '600';
    nm.textContent = `${name(b.result)}${b.count > 1 ? ` ×${b.count}` : ''}`;
    const ing = document.createElement('div'); ing.style.fontSize = '12px'; ing.style.opacity = '.85';
    info.appendChild(nm); info.appendChild(ing);
    const btn = document.createElement('button');
    Object.assign(btn.style, bigBtnStyle('#d08a3a'));
    btn.style.flex = '0 0 auto'; btn.style.padding = '10px 14px'; btn.textContent = '焼く！';
    btn.addEventListener('click', () => bake(b));
    card.appendChild(ico); card.appendChild(info); card.appendChild(btn);
    bakeList.appendChild(card);
    return { b, ing, btn };
  });

  function bake(b) {
    if (!has(b.need)) { toast('材料が足りません'); return; }
    for (const [id, n] of b.need) inv.take(id, n);
    inv.collect(b.result, b.count);
    sfx && sfx.craft && sfx.craft();
    toast(`🔥 ${name(b.result)}が焼けた！`);
    onBake && onBake(b.result, b.count);
    render();
  }

  // ---- render -------------------------------------------------------------
  function render() {
    startBtn.disabled = !has(FERMENT_NEED);
    startBtn.style.opacity = startBtn.disabled ? '.45' : '1';
    startBtn.textContent = `🫙 瓶に仕込む（空き瓶＋規格外野菜）`;
    // jars in progress
    const jars = ferment.list(now());
    if (!jars.length) {
      jarList.innerHTML = '<div style="opacity:.6;font-size:12px">仕込み中の瓶はありません</div>';
    } else {
      jarList.innerHTML = '';
      for (const j of jars) {
        const row = document.createElement('div');
        Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' });
        const pct = Math.round(j.progress * 100);
        const bubble = j.progress < 0.34 ? '🫧' : j.progress < 0.7 ? '🫧🫧' : '🫧🫧🫧';
        const bar = document.createElement('div');
        Object.assign(bar.style, { flex: '1', height: '14px', borderRadius: '7px', background: 'rgba(255,255,255,.12)', overflow: 'hidden' });
        const fill = document.createElement('div');
        Object.assign(fill.style, { width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#caa84e,#e7d08a)', transition: 'width .3s' });
        bar.appendChild(fill);
        const label = document.createElement('div');
        label.style.fontSize = '12px'; label.style.minWidth = '92px';
        label.textContent = `${bubble} あと${Math.ceil(j.remaining / 1000)}秒`;
        const tendBtn = document.createElement('button');
        Object.assign(tendBtn.style, bigBtnStyle('#5a8'));
        tendBtn.style.padding = '6px 10px'; tendBtn.style.fontSize = '12px';
        tendBtn.textContent = 'かきまぜる';
        tendBtn.disabled = !j.canTend;
        tendBtn.style.opacity = j.canTend ? '1' : '.4';
        tendBtn.addEventListener('click', () => { if (ferment.tend(j.id, now())) { sfx && sfx.pop && sfx.pop(); render(); } });
        row.appendChild(label); row.appendChild(bar); row.appendChild(tendBtn);
        jarList.appendChild(row);
      }
    }
    // bake cards
    for (const { b, ing, btn } of cards) {
      ing.innerHTML = b.need.map(([id, n]) => {
        const ok = inv.count(id) >= n;
        return `<span style="color:${ok ? '#bfe6a6' : '#e7a3a3'}">${name(id)} ${inv.count(id)}/${n}</span>`;
      }).join(' ＋ ');
      const affordable = has(b.need);
      btn.disabled = !affordable;
      btn.style.opacity = affordable ? '1' : '.4';
    }
  }

  function open() { root.style.display = 'flex'; render(); }
  function close() { root.style.display = 'none'; }
  function isOpen() { return root.style.display !== 'none'; }
  function toggle() { isOpen() ? close() : open(); }
  // Called from the loop so progress bars animate live while the panel is open.
  function tick() { if (isOpen()) render(); }

  document.body.appendChild(root);
  return { el: root, open, close, toggle, isOpen, tick, render };
}

function bigBtnStyle(color) {
  return {
    background: color, color: '#1b1410', border: 'none', borderRadius: '10px',
    padding: '12px 14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    width: '100%', boxShadow: '0 3px 0 rgba(0,0,0,.3)',
  };
}
