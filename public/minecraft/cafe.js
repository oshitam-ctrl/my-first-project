// ☕ South in North — the old-classroom cafe on the same 1F as プチヘルメース.
//
// Sibling of shop.js (the bakery counter): same panel pattern, same
// pay-with-produce economy. The cafe cooks in the 旧給食室 (old school
// kitchen) — spice curry, quiche, tartines, veg soup — and you're welcome to
// carry a desk out and eat in the schoolyard (校庭ランチ, see main.js).
//
// Deps are injected (inv, sfx, toast, itemDef, particles, onOrder); the module
// owns only its DOM and reads/writes the shared inventory.

const PRICE = 'surplus_veg'; // pay-with-produce currency (same as the bakery)

// Cafe menu: id, emoji, cost (in 規格外野菜). Kitchen mains cost more.
export const CAFE_STOCK = [
  { id: 'spice_curry',    emoji: '🍛', cost: 2 },
  { id: 'quiche',         emoji: '🥧', cost: 2 },
  { id: 'tartine',        emoji: '🥪', cost: 1 },
  { id: 'veg_soup',       emoji: '🍲', cost: 1 },
  { id: 'baked_sweets',   emoji: '🍪', cost: 1 },
  { id: 'seasonal_drink', emoji: '🥤', cost: 1 },
];

export function createCafe({ inv, sfx, toast, itemDef, particles, onOrder }) {
  const name = (id) => (itemDef && itemDef(id)?.name) || id;

  // ---- DOM ----------------------------------------------------------------
  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed', inset: '0', zIndex: '12', display: 'none',
    background: 'rgba(22,24,18,.62)', backdropFilter: 'blur(2px)',
    alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box',
  });
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    width: 'min(520px, 96vw)', maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    background: 'linear-gradient(180deg,#5c6b4a,#3a4a2f)', color: '#f5ede4',
    border: '3px solid #2c3823', borderRadius: '16px', padding: '16px 16px 22px',
    boxShadow: '0 18px 50px rgba(0,0,0,.55)', font: '14px/1.5 system-ui,sans-serif',
  });
  root.appendChild(panel);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });

  const head = document.createElement('div');
  Object.assign(head.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' });
  const title = document.createElement('div');
  title.innerHTML = '☕ <b>South in North</b>';
  title.style.fontSize = '19px';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  Object.assign(closeBtn.style, { background: 'transparent', border: 'none', color: '#f5ede4', fontSize: '22px', cursor: 'pointer', lineHeight: '1' });
  closeBtn.addEventListener('click', close);
  head.appendChild(title); head.appendChild(closeBtn);
  panel.appendChild(head);

  const sub = document.createElement('div');
  sub.innerHTML = '旧教室のカフェ — <span style="opacity:.85">校庭で食べてもいいよ</span>';
  Object.assign(sub.style, { fontSize: '12px', opacity: '.9', margin: '0 2px 12px' });
  panel.appendChild(sub);

  const list = document.createElement('div');
  Object.assign(list.style, { display: 'grid', gap: '8px' });
  panel.appendChild(list);

  const cards = CAFE_STOCK.map((s) => {
    const card = document.createElement('div');
    Object.assign(card.style, { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,.07)', border: '1px solid #76855f', borderRadius: '10px', padding: '8px 10px' });
    const ico = document.createElement('div'); ico.textContent = s.emoji; ico.style.fontSize = '26px';
    const info = document.createElement('div'); info.style.flex = '1'; info.style.minWidth = '0';
    const nm = document.createElement('div'); nm.style.fontWeight = '600'; nm.textContent = name(s.id);
    const cost = document.createElement('div'); cost.style.fontSize = '12px'; cost.style.opacity = '.9';
    info.appendChild(nm); info.appendChild(cost);
    const btn = document.createElement('button');
    Object.assign(btn.style, bigBtnStyle('#e8d5b7'));
    btn.style.flex = '0 0 auto'; btn.style.padding = '10px 14px'; btn.textContent = '注文する';
    btn.addEventListener('click', () => order(s));
    card.appendChild(ico); card.appendChild(info); card.appendChild(btn);
    list.appendChild(card);
    return { s, cost, btn };
  });

  function order(s) {
    if (inv.count(PRICE) < s.cost) { toast && toast('🥬 規格外野菜が足りません'); return false; }
    toast && toast('👨‍🍳 いらっしゃい！旧給食室で仕込んだよ');           // ritual 1: greeting
    inv.take(PRICE, s.cost);
    inv.collect(s.id, 1);                                                // ritual 2: 受け渡し
    sfx && sfx.craft && sfx.craft();
    onOrder && onOrder(s.id);
    setTimeout(() => toast && toast('☕ ごゆっくり。机ごと校庭に持ち出してもいいよ🌿'), 700); // ritual 3
    render();
    return true;
  }

  function render() {
    const have = inv.count(PRICE);
    for (const { s, cost, btn } of cards) {
      const ok = have >= s.cost;
      cost.innerHTML = `規格外野菜 <span style="color:${ok ? '#cfe6a6' : '#f0b8b8'}">${have}/${s.cost}</span>`;
      btn.disabled = !ok;
      btn.style.opacity = ok ? '1' : '.4';
    }
  }

  function open() { root.style.display = 'flex'; render(); }
  function close() { root.style.display = 'none'; }
  function isOpen() { return root.style.display !== 'none'; }
  function toggle() { isOpen() ? close() : open(); }

  document.body.appendChild(root);
  // __order is a test/automation hook (order by item id, no DOM needed).
  return { el: root, open, close, toggle, isOpen, render, order, __order: (id) => { const s = CAFE_STOCK.find((x) => x.id === id); return s ? order(s) : false; } };
}

function bigBtnStyle(color) {
  return {
    background: color, color: '#1b1410', border: 'none', borderRadius: '10px',
    padding: '12px 14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    width: '100%', boxShadow: '0 3px 0 rgba(0,0,0,.3)',
  };
}
