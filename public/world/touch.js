// touch.js — モバイル操作（/minecraft 版 touch.js を散策用に簡略化）。
// 左半分: フローティングジョイスティック（強く倒すと小走り）
// 右半分: ドラッグで見回し / 短いタップ = 調べる
//
// createTouchControls({ root, onLook(dx,dy), onInteract() }) -> controller
//   controller.move  {x, z} -1..1（毎フレーム読む）
//   controller.setVisible(b), controller.destroy()

const TAP_MS = 220;
const TAP_MOVE = 12;
const JOY_RADIUS = 56;
const DEAD = 0.12;

export function isTouchDevice() {
  return (typeof window !== 'undefined') &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
}

export function createTouchControls(opts) {
  const root = opts.root || document.body;
  const move = { x: 0, z: 0 };

  const layer = el('div', {
    position: 'fixed', inset: '0', zIndex: '8', touchAction: 'none', background: 'transparent',
  });
  layer.id = 'touch-layer';

  const joyBase = el('div', {
    position: 'absolute', width: '108px', height: '108px', borderRadius: '50%',
    border: '2px solid rgba(255,255,255,.35)', background: 'rgba(255,255,255,.10)',
    transform: 'translate(-50%,-50%)', display: 'none', pointerEvents: 'none',
  });
  const joyKnob = el('div', {
    position: 'absolute', width: '50px', height: '50px', borderRadius: '50%',
    background: 'rgba(255,255,255,.40)', border: '2px solid rgba(255,255,255,.6)',
    transform: 'translate(-50%,-50%)', display: 'none', pointerEvents: 'none',
  });
  layer.appendChild(joyBase);
  layer.appendChild(joyKnob);
  root.appendChild(layer);

  let joyId = null, joyOx = 0, joyOy = 0;
  let lookId = null, lookLastX = 0, lookLastY = 0, lookStartT = 0, lookMoved = 0;
  const halfX = () => window.innerWidth / 2;

  function onDown(e) {
    const x = e.clientX, y = e.clientY;
    if (x < halfX() && joyId === null) {
      joyId = e.pointerId; joyOx = x; joyOy = y;
      move.x = 0; move.z = 0;
      showJoy(x, y);
    } else if (lookId === null) {
      lookId = e.pointerId;
      lookLastX = x; lookLastY = y;
      lookStartT = performance.now(); lookMoved = 0;
    }
    layer.setPointerCapture && layer.setPointerCapture(e.pointerId);
  }

  function onMove(e) {
    if (e.pointerId === joyId) {
      let dx = e.clientX - joyOx, dy = e.clientY - joyOy;
      const len = Math.hypot(dx, dy);
      if (len > JOY_RADIUS) { dx *= JOY_RADIUS / len; dy *= JOY_RADIUS / len; }
      moveKnob(joyOx + dx, joyOy + dy);
      let nx = dx / JOY_RADIUS, nz = dy / JOY_RADIUS;
      const mag = Math.hypot(nx, nz);
      if (mag < DEAD) { nx = 0; nz = 0; }
      else {
        const k = (mag - DEAD) / (1 - DEAD) / mag;
        nx *= k; nz *= k;
      }
      move.x = nx; move.z = nz;
    } else if (e.pointerId === lookId) {
      const dx = e.clientX - lookLastX, dy = e.clientY - lookLastY;
      lookLastX = e.clientX; lookLastY = e.clientY;
      lookMoved += Math.abs(dx) + Math.abs(dy);
      if (lookMoved >= TAP_MOVE) opts.onLook && opts.onLook(dx, dy);
    }
  }

  function onUp(e) {
    if (e.pointerId === joyId) {
      joyId = null; move.x = 0; move.z = 0; hideJoy();
    } else if (e.pointerId === lookId) {
      const dt = performance.now() - lookStartT;
      if (dt <= TAP_MS && lookMoved < TAP_MOVE) opts.onInteract && opts.onInteract();
      lookId = null;
    }
  }

  layer.addEventListener('pointerdown', onDown);
  layer.addEventListener('pointermove', onMove);
  layer.addEventListener('pointerup', onUp);
  layer.addEventListener('pointercancel', onUp);
  layer.addEventListener('lostpointercapture', onUp);

  function showJoy(x, y) {
    joyBase.style.left = x + 'px'; joyBase.style.top = y + 'px';
    joyBase.style.display = 'block'; moveKnob(x, y);
  }
  function moveKnob(x, y) {
    joyKnob.style.left = x + 'px'; joyKnob.style.top = y + 'px';
    joyKnob.style.display = 'block';
  }
  function hideJoy() { joyBase.style.display = 'none'; joyKnob.style.display = 'none'; }

  return {
    move,
    setVisible(b) { layer.style.display = b ? 'block' : 'none'; },
    destroy() { layer.remove(); },
  };
}

function el(tag, styles) {
  const e = document.createElement(tag);
  Object.assign(e.style, styles);
  return e;
}
