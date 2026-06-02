// World sharing via the URL: encode/decode a 32-bit world seed so that opening
// a shared link regenerates the exact same world. Seeds are uint32 integers.
//
// Pure, dependency-free ES module. Browser globals (location / history /
// navigator) are accessed only through guarded, injectable parameters so the
// whole module is unit-testable in Node without a DOM.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Force any number into an unsigned 32-bit integer.
function toUint32(n) {
  return n >>> 0;
}

// Deterministic string -> uint32 hash (xmur3-style). Used when a seed value is
// not a plain decimal number, so arbitrary text maps stably to a world seed.
function hashStringToUint32(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  // Final avalanche so small inputs spread across all 32 bits.
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

// Coerce a raw seed-ish value (decimal string or arbitrary text) to a uint32.
// A purely numeric token is treated as the literal seed; anything else hashes.
function coerceSeedValue(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (value === '') return null;
  // Strict decimal integer (avoids "0x..", "1e3", "12px" being mis-parsed).
  if (/^[0-9]+$/.test(value)) {
    return toUint32(Number(value));
  }
  return hashStringToUint32(value);
}

// Pull a `seed` token out of a query string or hash fragment ("seed=123").
function extractSeedToken(fragment) {
  if (!fragment) return null;
  let frag = fragment;
  if (frag[0] === '?' || frag[0] === '#') frag = frag.slice(1); // drop leader
  if (frag === '') return null;
  for (const part of frag.split('&')) {
    const eq = part.indexOf('=');
    if ((eq === -1 ? part : part.slice(0, eq)) === 'seed') {
      const val = eq === -1 ? '' : part.slice(eq + 1);
      try {
        return decodeURIComponent(val);
      } catch {
        return val; // Malformed escapes: use the raw value rather than throw.
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Parse a seed from a URL string (or window.location if omitted). Accepts
// ?seed=... or #seed=... ; value may be a decimal uint32 OR an arbitrary string
// (hashed into a uint32 deterministically). Returns a uint32, or null if none.
export function parseSeedFromURL(href = (typeof location !== 'undefined' ? location.href : '')) {
  if (!href) return null;
  let search = '';
  let hash = '';
  try {
    // Resolve relative inputs against a dummy base so plain hrefs still parse.
    const url = new URL(href, 'http://_local_/');
    search = url.search;
    hash = url.hash;
  } catch {
    // Fallback for non-URL strings: split manually on '#' then '?'.
    const hi = href.indexOf('#');
    if (hi !== -1) {
      hash = href.slice(hi);
      href = href.slice(0, hi);
    }
    const qi = href.indexOf('?');
    if (qi !== -1) search = href.slice(qi);
  }
  // Prefer the query param, then fall back to the hash fragment.
  const raw = extractSeedToken(search) ?? extractSeedToken(hash);
  return coerceSeedValue(raw);
}

// Return a seed: the URL seed if present, else `fallback` (normalized uint32).
export function getSeed(fallback) {
  const fromUrl = parseSeedFromURL();
  if (fromUrl !== null) return fromUrl;
  return toUint32(fallback);
}

// Update the URL (history.replaceState) to encode the seed in the hash as
// #seed=<n>, WITHOUT reloading. No-op if window/history unavailable.
export function setSeedInURL(seed) {
  const s = toUint32(seed);
  if (typeof history === 'undefined' || typeof history.replaceState !== 'function') return;
  let base = '';
  if (typeof location !== 'undefined') {
    // Keep the existing path + query; replace only the fragment.
    base = (location.pathname || '') + (location.search || '');
  }
  try {
    history.replaceState(history.state, '', `${base}#seed=${s}`);
  } catch {
    // Some sandboxed/file: contexts forbid replaceState — fail silently.
  }
}

// Build an absolute shareable URL string for a seed, based on
// location.origin+pathname when available, else an explicit baseUrl arg.
// e.g. https://host/minecraft#seed=12345
export function buildShareURL(seed, baseUrl) {
  const s = toUint32(seed);
  let base = baseUrl;
  if (base == null && typeof location !== 'undefined') {
    base = (location.origin || '') + (location.pathname || '');
  }
  base = base || '';
  // Strip any pre-existing fragment so we don't end up with two '#'.
  const hi = base.indexOf('#');
  if (hi !== -1) base = base.slice(0, hi);
  return `${base}#seed=${s}`;
}

// A fresh random uint32 seed. Prefers crypto when present for better spread.
export function randomSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] >>> 0;
  }
  return Math.floor(Math.random() * 4294967296) >>> 0;
}

// Stringify a uint32 seed to a short human-friendly base36 code.
export function seedToCode(seed) {
  return toUint32(seed).toString(36);
}

// Parse a base36 code back into a uint32 seed.
export function codeToSeed(code) {
  const n = parseInt(String(code).trim(), 36);
  return Number.isFinite(n) ? toUint32(n) : 0;
}

// Try to share via the Web Share API; fall back to clipboard; resolve to one of
// 'shared' | 'copied' | 'failed'. Feature-detects navigator.share /
// navigator.clipboard and never throws. (navigator.share needs a user gesture
// and HTTPS — we just attempt and catch.)
export async function shareSeed(seed, title = 'プチヘルメース', text) {
  const url = buildShareURL(seed);
  if (!text) text = `「プチヘルメース」をマイクラ風の世界で疑似体験🥖 畑の余り野菜と発酵でパン作り！ #プチヘルメース`;

  // 1) Native share sheet, when available.
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch {
      // User cancelled or share unavailable — fall through to clipboard.
    }
  }

  // 2) Clipboard fallback.
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      // Permission denied or insecure context.
    }
  }

  // 3) Nothing worked.
  return 'failed';
}
