// dialog.js — 会話ボックス・案内カード・購入/注文メニュー・トースト。
// ブランド: ベージュ #F5EDE4 × 深緑 #5C6B4A（/minecraft の About と同じ）。

const FONT = '"Hiragino Sans", "Noto Sans JP", system-ui, -apple-system, sans-serif';

export function createUI() {
  // ---- 会話ボックス（下部） ------------------------------------------------
  const dlg = el('div', {
    position: 'fixed', left: '50%', transform: 'translateX(-50%)',
    bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))', zIndex: '20',
    width: 'min(620px, 92vw)', display: 'none',
    background: 'rgba(245,237,228,.97)', color: '#3a3026',
    border: '2px solid #5C6B4A', borderRadius: '14px', padding: '14px 18px 12px',
    boxShadow: '0 14px 40px rgba(0,0,0,.4)', font: `15px/1.7 ${FONT}`, cursor: 'pointer',
  });
  const dlgName = el('div', { fontWeight: '800', color: '#5C6B4A', fontSize: '13px', marginBottom: '2px' });
  const dlgText = el('div', { whiteSpace: 'pre-wrap', minHeight: '48px' });
  const dlgNext = el('div', { textAlign: 'right', fontSize: '12px', opacity: '.65', marginTop: '4px' });
  dlgNext.textContent = 'クリック / E で つぎへ ▼';
  dlg.append(dlgName, dlgText, dlgNext);
  document.body.appendChild(dlg);

  let pages = null, pageIdx = 0, dlgDone = null;
  function showDialog(p, onDone) {
    pages = p; pageIdx = 0; dlgDone = onDone || null;
    renderPage();
    dlg.style.display = 'block';
  }
  function renderPage() {
    const [name, text] = pages[pageIdx];
    dlgName.textContent = name;
    dlgText.textContent = text;
    dlgNext.textContent = pageIdx === pages.length - 1 ? 'クリック / E で とじる' : 'クリック / E で つぎへ ▼';
  }
  function advanceDialog() {
    if (!pages) return false;
    pageIdx++;
    if (pageIdx >= pages.length) {
      dlg.style.display = 'none';
      pages = null;
      const cb = dlgDone; dlgDone = null;
      cb && cb();
    } else renderPage();
    return true;
  }
  dlg.addEventListener('click', (e) => { e.stopPropagation(); advanceDialog(); });

  // ---- モーダル（案内カード / メニュー共用の土台） ---------------------------
  const modal = el('div', {
    position: 'fixed', inset: '0', zIndex: '22', display: 'none',
    background: 'rgba(58,74,47,.5)', backdropFilter: 'blur(2px)',
    alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box',
  });
  const card = el('div', {
    width: 'min(520px, 94vw)', maxHeight: '84vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    background: '#F5EDE4', color: '#3a3026', border: '2px solid #5C6B4A',
    borderRadius: '16px', padding: '18px 20px', boxShadow: '0 18px 50px rgba(0,0,0,.5)',
    font: `14px/1.7 ${FONT}`,
  });
  modal.appendChild(card);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.body.appendChild(modal);

  let modalDone = null;
  function openModal() { modal.style.display = 'flex'; }
  function closeModal() {
    modal.style.display = 'none';
    const cb = modalDone; modalDone = null;
    cb && cb();
  }
  function header(title) {
    const head = el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
    const h = el('div', { fontSize: '18px', fontWeight: '800', color: '#5C6B4A' });
    h.textContent = title;
    const x = el('button', { background: 'transparent', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#5C6B4A', lineHeight: '1' });
    x.textContent = '✕';
    x.addEventListener('click', closeModal);
    head.append(h, x);
    return head;
  }

  // 読み物カード
  function showInfo(title, body, onDone) {
    modalDone = onDone || null;
    card.innerHTML = '';
    card.appendChild(header(title));
    const p = el('div', { whiteSpace: 'pre-wrap' });
    p.textContent = body;
    card.appendChild(p);
    openModal();
  }

  // 商品メニュー（パン屋/カフェ共用）
  function showMenu({ title, sub, items, buyLabel, onPick, picked }, onDone) {
    modalDone = onDone || null;
    card.innerHTML = '';
    card.appendChild(header(title));
    if (sub) {
      const s = el('div', { fontSize: '12px', opacity: '.85', marginBottom: '10px' });
      s.textContent = sub;
      card.appendChild(s);
    }
    const list = el('div', { display: 'grid', gap: '8px' });
    for (const it of items) {
      const row = el('div', {
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(92,107,74,.08)', border: '1px solid #d8cbb4',
        borderRadius: '10px', padding: '8px 10px',
      });
      const ico = el('div', { fontSize: '26px' }); ico.textContent = it.emoji;
      const info = el('div', { flex: '1', minWidth: '0' });
      const nm = el('div', { fontWeight: '700' });
      nm.textContent = `${it.name}  ¥${it.price}`;
      const ds = el('div', { fontSize: '12px', opacity: '.85' });
      ds.textContent = it.story;
      info.append(nm, ds);
      const btn = el('button', {
        background: '#5C6B4A', color: '#F5EDE4', border: 'none', borderRadius: '10px',
        padding: '10px 14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
        boxShadow: '0 3px 0 rgba(0,0,0,.25)', flex: '0 0 auto',
      });
      const got = picked && picked(it.id);
      btn.textContent = got ? '袋の中 ✓' : buyLabel;
      if (got) { btn.style.opacity = '.5'; btn.disabled = true; }
      btn.addEventListener('click', () => {
        onPick && onPick(it);
        btn.textContent = '袋の中 ✓';
        btn.style.opacity = '.5';
        btn.disabled = true;
      });
      row.append(ico, info, btn);
      list.appendChild(row);
    }
    card.appendChild(list);
    const note = el('div', { fontSize: '11px', opacity: '.6', marginTop: '10px' });
    note.textContent = '※ 価格はゲーム内の架空のものです';
    card.appendChild(note);
    openModal();
  }

  // ---- トースト --------------------------------------------------------------
  const toastEl = el('div', {
    position: 'fixed', left: '50%', transform: 'translateX(-50%)',
    top: 'calc(64px + env(safe-area-inset-top, 0px))', zIndex: '24',
    background: 'rgba(30,26,20,.85)', color: '#fdf3e3', padding: '8px 16px',
    borderRadius: '999px', font: `600 13px/1.4 ${FONT}`, display: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,.35)', maxWidth: '86vw', textAlign: 'center',
  });
  document.body.appendChild(toastEl);
  let toastTimer = 0;
  function toast(msg, ms = 2400) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.style.display = 'none'; }, ms);
  }

  // ---- インタラクトプロンプト（下部中央のチップ） ------------------------------
  const prompt = el('div', {
    position: 'fixed', left: '50%', transform: 'translateX(-50%)',
    bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', zIndex: '10',
    background: 'rgba(30,26,20,.78)', color: '#fdf3e3', padding: '9px 18px',
    borderRadius: '999px', font: `700 14px/1.3 ${FONT}`, display: 'none',
    border: '1px solid rgba(253,243,227,.35)', cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,.35)',
  });
  document.body.appendChild(prompt);
  function setPrompt(label, key) {
    if (!label) { prompt.style.display = 'none'; return; }
    prompt.textContent = `${key} ${label}`;
    prompt.style.display = 'block';
  }

  function isBusy() { return pages != null || modal.style.display === 'flex'; }

  return {
    showDialog, advanceDialog, showInfo, showMenu, toast, setPrompt, isBusy,
    closeModal, promptEl: prompt,
  };
}

function el(tag, styles) {
  const e = document.createElement(tag);
  Object.assign(e.style, styles);
  return e;
}
