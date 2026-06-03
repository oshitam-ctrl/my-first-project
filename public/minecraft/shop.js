// 店頭 (shop counter) — the player-as-CUSTOMER side of プチヘルメース.
//
// The bakery panel (bakery.js) is the *supply* side (you bake). This is the
// *demand* side: walk up to the counter and BUY a loaf. Payment is in 規格外野菜
// (surplus_veg) — literally the shop's mission「もったいないをおいしいに」: you
// bring the bakery your imperfect produce and trade it for fresh bread. Buying
// only touches surplus_veg and the bread foods, so it never disturbs the quest
// economy (levain/wheat/bread counts the quest latches on).
//
// Deps are injected (inv, sfx, toast, itemDef, particles, onBuy); the module
// owns only its DOM and reads/writes the shared inventory.

const PRICE = 'surplus_veg'; // pay-with-produce currency

// Counter stock: id, emoji, cost (in 規格外野菜). Signature campagne costs more.
export const SHOP_STOCK = [
  { id: 'baguette',         emoji: '🥖', cost: 1 },
  { id: 'campagne',         emoji: '🍞', cost: 2 },
  { id: 'pain_de_mie',      emoji: '🍞', cost: 1 },
  { id: 'fruit_campagne',   emoji: '🍑', cost: 2 },
  { id: 'rescued_focaccia', emoji: '🫓', cost: 1 },
];

export function createShop({ inv, sfx, toast, itemDef, particles, onBuy }) {
  const name = (id) => (itemDef && itemDef(id)?.name) || id;

  // ---- DOM ----------------------------------------------------------------
  const root = document.createElement('div');
  Object.assign(root.style, {
    position: 'fixed', inset: '0', zIndex: '12', display: 'none',
    background: 'rgba(20,26,24,.62)', backdropFilter: 'blur(2px)',
    alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box',
  });
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    width: 'min(520px, 96vw)', maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    background: 'linear-gradient(180deg,#2f6f69,#244f4b)', color: '#f3efe6',
    border: '3px solid #173f3b', borderRadius: '16px', padding: '16px 16px 22px',
    boxShadow: '0 18px 50px rgba(0,0,0,.55)', font: '14px/1.5 system-ui,sans-serif',
  });
  root.appendChild(panel);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });

  const head = document.createElement('div');
  Object.assign(head.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' });
  const title = document.createElement('div');
  title.innerHTML = '🛍️ <b>プチヘルメース 店頭</b>';
  title.style.fontSize = '19px';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  Object.assign(closeBtn.style, { background: 'transparent', border: 'none', color: '#f3efe6', fontSize: '22px', cursor: 'pointer', lineHeight: '1' });
  closeBtn.addEventListener('click', close);
  head.appendChild(title); head.appendChild(closeBtn);
  panel.appendChild(head);

  const sub = document.createElement('div');
  sub.innerHTML = '「規格外野菜」と交換でパンをどうぞ — <span style="opacity:.8">もったいないを、おいしいに。</span>';
  Object.assign(sub.style, { fontSize: '12px', opacity: '.9', margin: '0 2px 12px' });
  panel.appendChild(sub);

  const list = document.createElement('div');
  Object.assign(list.style, { display: 'grid', gap: '8px' });
  panel.appendChild(list);

  const cards = SHOP_STOCK.map((s) => {
    const card = document.createElement('div');
    Object.assign(card.style, { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,.06)', border: '1px solid #3c6b66', borderRadius: '10px', padding: '8px 10px' });
    const ico = document.createElement('div'); ico.textContent = s.emoji; ico.style.fontSize = '26px';
    const info = document.createElement('div'); info.style.flex = '1'; info.style.minWidth = '0';
    const nm = document.createElement('div'); nm.style.fontWeight = '600'; nm.textContent = name(s.id);
    const cost = document.createElement('div'); cost.style.fontSize = '12px'; cost.style.opacity = '.9';
    info.appendChild(nm); info.appendChild(cost);
    const btn = document.createElement('button');
    Object.assign(btn.style, bigBtnStyle('#e7c46a'));
    btn.style.flex = '0 0 auto'; btn.style.padding = '10px 14px'; btn.textContent = '買う';
    btn.addEventListener('click', () => buy(s));
    card.appendChild(ico); card.appendChild(info); card.appendChild(btn);
    list.appendChild(card);
    return { s, cost, btn };
  });

  function buy(s) {
    if (inv.count(PRICE) < s.cost) { toast && toast('🥬 規格外野菜が足りません'); return false; }
    toast && toast('👩‍🍳 いらっしゃいませ');                 // ritual 1: greeting
    inv.take(PRICE, s.cost);
    inv.collect(s.id, 1);                                      // ritual 2: 受け渡し
    sfx && sfx.craft && sfx.craft();
    onBuy && onBuy(s.id);
    setTimeout(() => toast && toast('👩‍🍳 ありがとうございました、またどうぞ🥖'), 700); // ritual 3
    render();
    return true;
  }

  function render() {
    const have = inv.count(PRICE);
    for (const { s, cost, btn } of cards) {
      const ok = have >= s.cost;
      cost.innerHTML = `規格外野菜 <span style="color:${ok ? '#bfe6a6' : '#f0b8b8'}">${have}/${s.cost}</span>`;
      btn.disabled = !ok;
      btn.style.opacity = ok ? '1' : '.4';
    }
  }

  function open() { root.style.display = 'flex'; render(); }
  function close() { root.style.display = 'none'; }
  function isOpen() { return root.style.display !== 'none'; }
  function toggle() { isOpen() ? close() : open(); }

  document.body.appendChild(root);
  // __buy is a test/automation hook (buy by item id, no DOM needed).
  return { el: root, open, close, toggle, isOpen, render, buy, __buy: (id) => { const s = SHOP_STOCK.find((x) => x.id === id); return s ? buy(s) : false; } };
}

function bigBtnStyle(color) {
  return {
    background: color, color: '#1b1410', border: 'none', borderRadius: '10px',
    padding: '12px 14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    width: '100%', boxShadow: '0 3px 0 rgba(0,0,0,.3)',
  };
}
