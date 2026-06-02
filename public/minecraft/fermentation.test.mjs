// Unit tests for the fermentation tracker. Run: node fermentation.test.mjs
import { createFermentation, FERMENT_MS, TEND_BONUS_MS, TEND_MAX } from './fermentation.js';

let failed = 0;
function ok(cond, msg) { if (!cond) { failed++; console.error('FAIL:', msg); } }
function near(a, b, eps, msg) { ok(Math.abs(a - b) <= eps, `${msg} (got ${a}, want ~${b})`); }

// Maturation
{
  const f = createFermentation();
  const jar = f.start(1000);
  ok(jar.readyAt === 1000 + FERMENT_MS, 'readyAt = start + duration');
  ok(f.update(1000 + FERMENT_MS - 1).length === 0, 'not ready 1ms early');
  ok(f.count() === 1, 'still pending before maturity');
  const done = f.update(1000 + FERMENT_MS);
  ok(done.length === 1 && done[0].id === jar.id, 'matures exactly at readyAt');
  ok(f.count() === 0, 'removed after maturing');
  ok(f.update(9e9).length === 0, 'no double-yield');
}

// Multiple jars, independent timers
{
  const f = createFermentation({ duration: 1000 });
  f.start(0); f.start(500);
  ok(f.update(1000).length === 1, 'first jar matures at 1000');
  ok(f.count() === 1, 'second jar still going');
  ok(f.update(1500).length === 1, 'second matures at 1500');
}

// list() progress
{
  const f = createFermentation({ duration: 1000 });
  f.start(0);
  near(f.list(0)[0].progress, 0, 1e-9, 'progress 0 at start');
  near(f.list(500)[0].progress, 0.5, 1e-9, 'progress 0.5 halfway');
  near(f.list(2000)[0].progress, 1, 1e-9, 'progress clamps to 1');
  ok(f.list(500)[0].remaining === 500, 'remaining ms');
}

// Tending speeds it up but is capped
{
  const f = createFermentation();
  const jar = f.start(0);
  const r0 = jar.readyAt;
  ok(f.tend(jar.id, 0) === true, 'first tend works');
  ok(jar.readyAt === r0 - TEND_BONUS_MS, 'tend shaves bonus');
  for (let i = 0; i < TEND_MAX; i++) f.tend(jar.id, 0);
  ok(f.tend(jar.id, 0) === false, 'tend capped at TEND_MAX');
  ok(f.tend(999, 0) === false, 'tend unknown id is a no-op');
  ok(jar.readyAt >= 1, 'tend never pushes readyAt to the past');
}

if (failed) { console.error(`\n${failed} fermentation test(s) failed`); process.exit(1); }
console.log('all fermentation tests passed');
