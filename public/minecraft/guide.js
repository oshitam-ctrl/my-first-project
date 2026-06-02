// Wayfinding — a bottom-center "compass" that points first-time visitors to the
// next thing to do. Casual players (on a phone, never played Minecraft) get
// lost in an open world; this removes "where do I go?" friction entirely.
//
// Two display modes, driven by what the next quest step needs:
//   • a world target  → a rotating arrow + label + distance ("⛏ 畑へ 23m")
//   • a UI action      → just a pulsing text banner ("🥖工房ボタンを開こう")
//
// Self-contained DOM module (inline styles, no imports). update() is called
// each frame with the player pose and the chosen target/label.

export function createGuide() {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed', left: '50%', bottom: 'calc(96px + env(safe-area-inset-bottom,0px))',
    transform: 'translateX(-50%)', zIndex: '6', display: 'none', alignItems: 'center', gap: '8px',
    padding: '7px 13px', borderRadius: '999px', background: 'rgba(43,111,106,.9)', color: '#fff',
    font: '700 13px/1 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif',
    boxShadow: '0 4px 16px rgba(0,0,0,.35)', pointerEvents: 'none', userSelect: 'none',
    whiteSpace: 'nowrap', backdropFilter: 'blur(2px)',
  });
  const arrow = document.createElement('div');
  arrow.textContent = '➤'; // base glyph points right; we rotate from "up"
  Object.assign(arrow.style, { fontSize: '17px', transition: 'transform .15s ease-out', display: 'none' });
  const label = document.createElement('span');
  el.appendChild(arrow); el.appendChild(label);
  document.body.appendChild(el);

  // Soft pulse so the banner draws the eye without nagging.
  let pulse = 0;

  // opts: { player:{pos,yaw}, target:{x,z}|null, label, near } — target null = UI-action mode.
  function update(opts) {
    if (!opts || !opts.label) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    pulse = (pulse + 0.06) % (Math.PI * 2);
    el.style.opacity = String(0.82 + 0.18 * Math.sin(pulse));
    if (opts.target) {
      const { pos, yaw } = opts.player;
      const dx = opts.target.x - pos.x, dz = opts.target.z - pos.z;
      const dist = Math.hypot(dx, dz);
      // forward = (-sin yaw, -cos yaw); right = (cos yaw, -sin yaw) — matches main.js
      const af = dx * -Math.sin(yaw) + dz * -Math.cos(yaw);
      const ar = dx * Math.cos(yaw) + dz * -Math.sin(yaw);
      const ang = Math.atan2(ar, af) * 180 / Math.PI; // 0 = dead ahead → arrow up
      arrow.style.display = dist < 2.5 ? 'none' : 'block';
      arrow.style.transform = `rotate(${ang - 90}deg)`; // glyph points right at 0°, so -90 → up
      label.textContent = dist < 2.5 ? `${opts.label} 👍 着いた！` : `${opts.label}  ${Math.round(dist)}m`;
    } else {
      arrow.style.display = 'none';
      label.textContent = opts.label;
    }
  }

  function hide() { el.style.display = 'none'; }
  return { el, update, hide };
}
