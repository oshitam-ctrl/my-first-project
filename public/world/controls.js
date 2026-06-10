// controls.js — PC操作: WASD/矢印で移動、ドラッグで見回し、E/Enter/クリックで調べる。
// カメラはオービット追従（yaw/pitch をここで持ち、main がカメラ位置を決める）。

export function createControls(dom, opts = {}) {
  const state = {
    yaw: opts.yaw != null ? opts.yaw : Math.PI, // π = 北（-z）を見る
    pitch: opts.pitch != null ? opts.pitch : -0.26,
    keys: Object.create(null),
    interactQueued: false,
  };

  window.addEventListener('keydown', (e) => {
    state.keys[e.code] = true;
    if (e.code === 'KeyE' || e.code === 'Enter') state.interactQueued = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { state.keys[e.code] = false; });
  window.addEventListener('blur', () => { state.keys = Object.create(null); });

  // ドラッグで見回す（ポインタロック無し: モバイルの touch.js と操作感を揃える）
  let dragging = false, lastX = 0, lastY = 0, moved = 0;
  dom.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return; // タッチは touch.js が担当
    dragging = true; lastX = e.clientX; lastY = e.clientY; moved = 0;
    dom.setPointerCapture && dom.setPointerCapture(e.pointerId);
  });
  dom.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    applyLook(dx, dy);
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) state.interactQueued = true; // 動かさないクリック = 調べる
  };
  dom.addEventListener('pointerup', endDrag);
  dom.addEventListener('pointercancel', endDrag);

  function applyLook(dx, dy) {
    state.yaw -= dx * 0.0042;
    state.pitch -= dy * 0.0036;
    state.pitch = Math.max(-1.1, Math.min(0.5, state.pitch));
  }

  // 移動入力（カメラ基準）: { f: 前後 -1..1, s: 左右 -1..1, jog: bool }
  function input() {
    const k = state.keys;
    let f = 0, s = 0;
    if (k.KeyW || k.ArrowUp) f += 1;
    if (k.KeyS || k.ArrowDown) f -= 1;
    if (k.KeyD || k.ArrowRight) s += 1;
    if (k.KeyA || k.ArrowLeft) s -= 1;
    const L = Math.hypot(f, s);
    if (L > 1) { f /= L; s /= L; }
    return { f, s, jog: !!(k.ShiftLeft || k.ShiftRight) };
  }

  function consumeInteract() {
    const q = state.interactQueued;
    state.interactQueued = false;
    return q;
  }

  return { state, input, applyLook, consumeInteract, queueInteract() { state.interactQueued = true; } };
}
