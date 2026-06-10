// quests.js — 右上のクエストバナー（スクショの「クエスト: …」風）と完走カード。
// 進行ロジックは data.js の createQuestChain（純ロジック）が持つ。

import { QUEST_DONE_BANNER, THANKS_CARD } from './data.js';

const FONT = '"Hiragino Sans", "Noto Sans JP", system-ui, -apple-system, sans-serif';

export function createQuestHUD() {
  const banner = document.createElement('div');
  Object.assign(banner.style, {
    position: 'fixed', top: 'calc(10px + env(safe-area-inset-top, 0px))',
    right: 'calc(10px + env(safe-area-inset-right, 0px))', zIndex: '9',
    background: 'rgba(30,26,20,.78)', color: '#fdf3e3', padding: '8px 14px',
    borderRadius: '10px', font: `700 13px/1.4 ${FONT}`,
    border: '1px solid rgba(253,243,227,.3)', boxShadow: '0 4px 14px rgba(0,0,0,.35)',
    maxWidth: 'min(64vw, 420px)', transition: 'transform .18s ease-out', pointerEvents: 'none',
  });
  document.body.appendChild(banner);

  function set(text, n, total) {
    banner.textContent = total != null ? `クエスト: ${text}　${n}/${total}` : `クエスト: ${text}`;
    banner.style.transform = 'scale(1.08)';
    setTimeout(() => { banner.style.transform = 'scale(1)'; }, 180);
  }
  function setDone() { set(QUEST_DONE_BANNER); }

  // 完走カード（サンクスカード）
  function showThanks(onClose) {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position: 'fixed', inset: '0', zIndex: '30', display: 'flex',
      alignItems: 'center', justifyContent: 'center', background: 'rgba(58,74,47,.45)',
      backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
      padding: '16px', boxSizing: 'border-box',
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(480px, 92vw)', background: '#F5EDE4', color: '#3a3026',
      border: '2px solid #5C6B4A', borderRadius: '18px', padding: '26px 24px',
      boxShadow: '0 22px 70px rgba(0,0,0,.5)', font: `14px/1.8 ${FONT}`,
      textAlign: 'center', maxHeight: '86vh', overflowY: 'auto',
    });
    const h = document.createElement('div');
    Object.assign(h.style, { fontSize: '22px', fontWeight: '800', color: '#5C6B4A', marginBottom: '12px' });
    h.textContent = THANKS_CARD.title;
    const p = document.createElement('div');
    p.style.whiteSpace = 'pre-wrap';
    p.textContent = THANKS_CARD.body;
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      marginTop: '16px', padding: '12px 26px', border: 'none', borderRadius: '10px',
      background: '#5C6B4A', color: '#F5EDE4', fontWeight: '800', fontSize: '15px', cursor: 'pointer',
    });
    btn.textContent = 'ひきつづき散策する';
    btn.addEventListener('click', () => { wrap.remove(); onClose && onClose(); });
    card.append(h, p, btn);
    wrap.appendChild(card);
    document.body.appendChild(wrap);
  }

  return { set, setDone, showThanks, el: banner };
}
