// On-screen diagnostic so startup failures are visible on devices without
// DevTools (managed/enterprise browsers). Loaded as an external module BEFORE
// main.js, so it can catch main.js's load/eval errors and report them.
const VERSION = 'v7';
const box = document.getElementById('diag');

function show(msg, bg) {
  if (!box) return;
  box.style.display = 'block';
  box.style.background = bg || 'rgba(0,0,0,.8)';
  box.textContent = msg;
}

show('診断 ' + VERSION + '：スクリプト読込中…', 'rgba(0,0,0,.8)');

// Catch resource load errors (capture phase reaches <script> failures) and
// uncaught runtime/module errors.
addEventListener('error', (e) => {
  const src = e.target && (e.target.src || e.target.href);
  const m = e.message || (src ? '読込失敗: ' + src : 'スクリプトエラー');
  show('❌ ' + VERSION + ' ' + m, 'rgba(170,0,0,.92)');
}, true);
addEventListener('unhandledrejection', (e) => {
  const r = e.reason;
  show('❌ ' + VERSION + ' ' + (r && (r.message || r)), 'rgba(170,0,0,.92)');
});

// If main.js never sets the loaded flag, it didn't run.
setTimeout(() => {
  if (!window.__mcLoaded) {
    show('⚠ ' + VERSION + ' main.js が起動していません（CSP / ブラウザポリシー / ネットワーク制限の可能性）。この表示を撮って送ってください。',
      'rgba(190,80,0,.96)');
  }
}, 4500);
