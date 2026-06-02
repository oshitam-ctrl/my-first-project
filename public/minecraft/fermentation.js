// Time-based natural-yeast fermentation — the heart of Petit Hermès.
//
// The shop's identity is 天然酵母 (wild yeast): surplus farm veg sealed in a jar
// of water and left to bubble for a while becomes 発酵液 (levain/種). Rather than
// an instant craft, fermentation here *takes time*, so the player waits, watches
// the jar swell and bubble, and is rewarded with a "ぷくっ" when it's ready.
//
// Pure and dependency-free: time is passed in (no Date.now()), so the whole
// module is unit-testable in Node without a clock or DOM.

export const FERMENT_MS = 75000;   // ~75s base — long enough to feel alive, short for a 2-3min visit
export const TEND_BONUS_MS = 6000; // each "かきまぜる" tap shaves this much off
export const TEND_MAX = 4;         // capped so a jar can't be rushed to instant

export function createFermentation({ duration = FERMENT_MS } = {}) {
  const jars = [];
  let nextId = 1;

  // Seal a new jar at time `t`. Returns the jar record.
  function start(t) {
    const jar = { id: nextId++, startAt: t, readyAt: t + duration, tends: 0 };
    jars.push(jar);
    return jar;
  }

  // Advance to time `t`; return (and remove) the jars that just matured.
  function update(t) {
    const done = [];
    for (let i = jars.length - 1; i >= 0; i--) {
      if (t >= jars[i].readyAt) { done.push(jars[i]); jars.splice(i, 1); }
    }
    return done;
  }

  // Tap a jar to stir/feed it: nudges it along, capped. Returns true if it took.
  function tend(id, t) {
    const jar = jars.find((j) => j.id === id);
    if (!jar || jar.tends >= TEND_MAX) return false;
    jar.tends++;
    jar.readyAt = Math.max(t + 1, jar.readyAt - TEND_BONUS_MS);
    return true;
  }

  // Snapshot for the UI: progress 0..1, remaining ms, whether it can still be tended.
  function list(t) {
    return jars.map((j) => {
      const total = j.readyAt - j.startAt;
      const progress = total <= 0 ? 1 : Math.max(0, Math.min(1, (t - j.startAt) / total));
      return { id: j.id, progress, remaining: Math.max(0, j.readyAt - t), canTend: j.tends < TEND_MAX };
    });
  }

  // Test/debug helper: bring every pending jar to maturity immediately.
  function rush() { for (const j of jars) j.readyAt = j.startAt; }

  return { start, update, tend, list, rush, count: () => jars.length };
}
