// Evaluate main.js (which runs its loop body once via the no-op rAF stub) and
// report any startup-time error with a stack.
try {
  await import('../public/minecraft/main.js');
  console.log('OK: main.js evaluated and ran one frame without throwing.');
} catch (e) {
  console.log('STARTUP ERROR:\n' + (e && e.stack ? e.stack : e));
  process.exitCode = 1;
}
