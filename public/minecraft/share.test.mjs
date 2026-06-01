// Dependency-free Node test for share.js. Run: node share.test.mjs
// Uses injected href/baseUrl args so no browser/DOM is required.

import assert from 'node:assert';
import {
  parseSeedFromURL,
  getSeed,
  setSeedInURL,
  buildShareURL,
  randomSeed,
  seedToCode,
  codeToSeed,
  shareSeed,
} from './share.js';

let count = 0;
function check(actual, expected, msg) {
  assert.strictEqual(actual, expected, msg);
  count++;
}
function ok(cond, msg) {
  assert.ok(cond, msg);
  count++;
}

// --- parseSeedFromURL: query param, numeric ---
check(parseSeedFromURL('https://host/minecraft?seed=12345'), 12345, '?seed numeric');
check(parseSeedFromURL('https://host/minecraft?a=1&seed=42&b=2'), 42, '?seed among params');

// --- parseSeedFromURL: hash fragment, numeric ---
check(parseSeedFromURL('https://host/minecraft#seed=999'), 999, '#seed numeric');

// --- parseSeedFromURL: query takes precedence over hash ---
check(parseSeedFromURL('https://host/p?seed=1#seed=2'), 1, 'query beats hash');

// --- parseSeedFromURL: arbitrary string hashes deterministically to uint32 ---
const strSeed = parseSeedFromURL('https://host/p?seed=hello-world');
ok(Number.isInteger(strSeed) && strSeed >>> 0 === strSeed, 'string seed is uint32');
check(parseSeedFromURL('https://host/p#seed=hello-world'), strSeed, 'string hash stable across ?/#');
ok(parseSeedFromURL('https://host/p?seed=other') !== strSeed, 'different strings differ');

// --- parseSeedFromURL: none present -> null ---
check(parseSeedFromURL('https://host/minecraft'), null, 'no seed -> null');
check(parseSeedFromURL(''), null, 'empty href -> null');

// --- parseSeedFromURL: large decimal normalizes to uint32 ---
check(parseSeedFromURL('?seed=4294967296'), 0, '2^32 wraps to 0');

// --- getSeed: fallback behavior ---
// (No location in Node, so parseSeedFromURL() yields null -> fallback used.)
check(getSeed(7), 7, 'getSeed returns fallback when no URL seed');
check(getSeed(-1), 4294967295, 'getSeed normalizes fallback to uint32');

// --- seedToCode / codeToSeed round-trip ---
for (const s of [0, 1, 12345, 4294967295, randomSeed()]) {
  const code = seedToCode(s);
  ok(typeof code === 'string' && code.length > 0, 'code is non-empty string');
  check(codeToSeed(code), s >>> 0, `round-trip ${s}`);
}

// --- randomSeed returns a uint32 ---
const r = randomSeed();
ok(Number.isInteger(r) && r >= 0 && r <= 4294967295, 'randomSeed in uint32 range');

// --- buildShareURL format (injected baseUrl, no browser) ---
check(buildShareURL(12345, 'https://host/minecraft'), 'https://host/minecraft#seed=12345', 'buildShareURL basic');
check(buildShareURL(8, 'https://host/p#seed=old'), 'https://host/p#seed=8', 'buildShareURL strips old fragment');
check(buildShareURL(-1, 'https://host/p'), 'https://host/p#seed=4294967295', 'buildShareURL normalizes seed');

// --- setSeedInURL: no-op (no history in Node) must not throw ---
assert.doesNotThrow(() => setSeedInURL(123), 'setSeedInURL no-op safe');
count++;

// --- shareSeed: never throws, resolves to a valid state (no navigator) ---
const result = await shareSeed(123);
ok(['shared', 'copied', 'failed'].includes(result), `shareSeed resolved: ${result}`);

console.log(`All ${count} assertions passed.`);
