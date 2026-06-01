// Mobile touch controls (Bedrock-style): left floating joystick to move,
// right half drag-to-look, tap-to-place / hold-to-break, jump + fly buttons.
// Uses Pointer Events with per-pointerId tracking for simultaneous move+look.
//
// createTouchControls(opts) -> controller
//   opts.root            element to attach the overlay to (e.g. document.body)
//   opts.onLook(dx,dy)   look delta in pixels (right-thumb drag)
//   opts.onPlace()       a quick tap on the look area
//   opts.onBreakStart()  / opts.onBreakEnd()   press-and-hold on the look area
//   opts.onJump(down)    jump button pressed/released (bool)
//   opts.onToggleFly()   double-tap of the jump button
//   opts.onVertical(dir) -1 down / +1 up / 0 none  (used while flying)
//   opts.isFlying()      -> bool, controls whether vertical buttons show
// controller.move        live {x, z} in [-1,1]  (read each frame)
// controller.setVisible(b), controller.destroy()

const TAP_MS = 180;          // press shorter than this (with little move) = tap
const TAP_MOVE = 10;         // px of movement that still counts as a tap
const HOLD_MS = 180;         // press longer than this (still) = break hold
const JOY_RADIUS = 56;       // px travel for full deflection
const DEAD = 0.12;           // radial dead zone (fraction)

export function isTouchDevice() {
  return (typeof window !== 'undefined') &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
}

export function createTouchControls(opts) {
  const root = opts.root || document.body;
  const move = { x: 0, z: 0 };

  // --- overlay DOM --------------------------------------------------------
  const layer = el('div', {
    position: 'fixed', inset: '0', zIndex: '8', touchAction: 'none',
    // let the canvas show through; this layer only catches pointer input
    background: 'transparent',
  });
  layer.id = 'touch-layer';

  // joystick visuals (hidden until first touch in the left zone)
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

  // action buttons (right thumb zone)
  const btnWrap = el('div', {
    position: 'absolute', right: 'calc(env(safe-area-inset-right,0px) + 16px)',
    bottom: 'calc(env(safe-area-inset-bottom,0px) + 26px)',
    display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center',
  });
  const btnJump = button('⤒', 'ジャンプ / 飛行中は上昇 (2回タップで飛行切替)');
  const btnDown = button('▼', '降下');
  btnDown.style.display = 'none';
  btnWrap.appendChild(btnJump);
  btnWrap.appendChild(btnDown);
  layer.appendChild(btnWrap);

  root.appendChild(layer);

  // --- pointer state ------------------------------------------------------
  // We track up to two "world" pointers: one for the move joystick (left half),
  // one for look/interact (right half). Buttons handle their own pointers.
  let joyId = null, joyOx = 0, joyOy = 0;
  let lookId = null, lookLastX = 0, lookLastY = 0, lookStartX = 0, lookStartY = 0;
  let lookStartT = 0, lookMoved = 0, breaking = false, holdTimer = 0;

  const halfX = () => window.innerWidth / 2;

  function onDown(e) {
    const x = e.clientX, y = e.clientY;
    // buttons are handled separately (they stopPropagation), so here we only
    // see presses on the open play area.
    if (x < halfX() && joyId === null) {
      joyId = e.pointerId; joyOx = x; joyOy = y;
      move.x = 0; move.z = 0;
      showJoy(x, y);
    } else if (x >= halfX() && lookId === null) {
      lookId = e.pointerId;
      lookLastX = lookStartX = x; lookLastY = lookStartY = y;
      lookStartT = performance.now(); lookMoved = 0; breaking = false;
      clearTimeout(holdTimer);
      // if the finger stays still long enough, begin breaking (hold).
      holdTimer = setTimeout(() => {
        if (lookId === e.pointerId && lookMoved < TAP_MOVE) {
          breaking = true;
          opts.onBreakStart && opts.onBreakStart();
        }
      }, HOLD_MS);
    }
    layer.setPointerCapture && layer.setPointerCapture(e.pointerId);
  }

  function onMove(e) {
    if (e.pointerId === joyId) {
      let dx = e.clientX - joyOx, dy = e.clientY - joyOy;
      const len = Math.hypot(dx, dy);
      const max = JOY_RADIUS;
      if (len > max) { dx *= max / len; dy *= max / len; }
      moveKnob(joyOx + dx, joyOy + dy);
      let nx = dx / max, nz = dy / max;       // -1..1
      const mag = Math.hypot(nx, nz);
      if (mag < DEAD) { nx = 0; nz = 0; }
      else {
        // rescale past the dead zone so control is smooth (no hard edge)
        const k = (mag - DEAD) / (1 - DEAD) / mag;
        nx *= k; nz *= k;
      }
      move.x = nx; move.z = nz;
    } else if (e.pointerId === lookId) {
      const dx = e.clientX - lookLastX, dy = e.clientY - lookLastY;
      lookLastX = e.clientX; lookLastY = e.clientY;
      lookMoved += Math.abs(dx) + Math.abs(dy);
      if (lookMoved >= TAP_MOVE) { opts.onLook && opts.onLook(dx, dy); }
    }
  }

  function onUp(e) {
    if (e.pointerId === joyId) {
      joyId = null; move.x = 0; move.z = 0; hideJoy();
    } else if (e.pointerId === lookId) {
      clearTimeout(holdTimer);
      const dt = performance.now() - lookStartT;
      if (breaking) {
        opts.onBreakEnd && opts.onBreakEnd();
      } else if (dt <= TAP_MS && lookMoved < TAP_MOVE) {
        opts.onPlace && opts.onPlace();   // quick tap = place
      }
      breaking = false; lookId = null;
    }
  }

  layer.addEventListener('pointerdown', onDown);
  layer.addEventListener('pointermove', onMove);
  layer.addEventListener('pointerup', onUp);
  layer.addEventListener('pointercancel', onUp);
  // safety: if the OS revokes capture mid-gesture, treat it as a release so a
  // hold-to-break can never get stuck on.
  layer.addEventListener('lostpointercapture', onUp);

  // --- buttons ------------------------------------------------------------
  let lastJumpTap = 0;
  bindHold(btnJump, (down) => {
    const flying = opts.isFlying && opts.isFlying();
    if (down) {
      const now = performance.now();
      if (now - lastJumpTap < 280) {        // double-tap toggles fly...
        opts.onToggleFly && opts.onToggleFly();
        lastJumpTap = 0;                     // ...and does NOT also move this frame
        return;
      }
      lastJumpTap = now;
      if (flying) opts.onVertical && opts.onVertical(1); // ascend while flying
      else opts.onJump && opts.onJump(true);             // jump on the ground
    } else {
      opts.onJump && opts.onJump(false);
      if (flying) opts.onVertical && opts.onVertical(0);
    }
  });
  bindHold(btnDown, (down) => opts.onVertical && opts.onVertical(down ? -1 : 0));

  // reflect fly state on the button layout
  function refreshFly() {
    const flying = opts.isFlying && opts.isFlying();
    btnDown.style.display = flying ? 'flex' : 'none';
    btnJump.textContent = flying ? '✈' : '⤒';
  }
  const flyPoll = setInterval(refreshFly, 250);

  // --- helpers ------------------------------------------------------------
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
    destroy() {
      clearInterval(flyPoll);
      layer.remove();
    },
  };
}

// small inline-styled element factory
function el(tag, styles) {
  const e = document.createElement(tag);
  Object.assign(e.style, styles);
  return e;
}

function button(label, title) {
  const b = el('div', {
    width: '64px', height: '64px', borderRadius: '50%',
    background: 'rgba(0,0,0,.34)', border: '2px solid rgba(255,255,255,.4)',
    color: '#fff', fontSize: '26px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', touchAction: 'none', userSelect: 'none',
    textShadow: '0 1px 3px rgba(0,0,0,.7)',
  });
  b.textContent = label;
  b.title = title;
  return b;
}

// press/release helper that swallows the event so it doesn't reach the play area
function bindHold(node, cb) {
  const down = (e) => { e.preventDefault(); e.stopPropagation(); node.setPointerCapture && node.setPointerCapture(e.pointerId); node.style.filter = 'brightness(1.4)'; cb(true); };
  const up = (e) => { e.preventDefault(); e.stopPropagation(); node.style.filter = ''; cb(false); };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
}
