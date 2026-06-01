// mobs.js — mob/entity system for a Three.js voxel game (Minecraft-like).
//
// Self-contained ES module. The THREE namespace is injected via opts (we never
// import three ourselves). Mobs are simple block models (Groups of colored
// boxes), have lightweight AABB-vs-voxel physics, basic AI, spawn/despawn near
// the player, take melee damage from the player, and drop items on death.
//
// Tuned to feel roughly like modern Minecraft (Java 1.20-1.21): HP values,
// aggro ranges, creeper fuse + explosion, skeleton kiting, etc.
//
// Public factory:
//   export function createMobs(opts) -> api
//
// See the INTERFACE comment block near createMobs for the full opts/api shape.

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------
const GRAVITY = 28; // blocks/s^2 (snappy, MC-ish)
const TERMINAL_FALL = 40; // max downward speed
const SOFT_CAP = 24; // total live mobs near player
const SPAWN_INTERVAL = 1.5; // seconds between spawn attempts
const SPAWN_RING_MIN = 16;
const SPAWN_RING_MAX = 40;
const DESPAWN_DIST = 64;
const HURT_FLASH_TIME = 0.2; // seconds of red tint
const FLEE_TIME = 2.0; // passive flee duration after being hit

// ---------------------------------------------------------------------------
// Mob registry. Each entry defines stats + a model builder factory key.
// kind: 'passive' | 'hostile'
// model: which model-building function to use.
// ---------------------------------------------------------------------------
const REGISTRY = {
  // PASSIVE -----------------------------------------------------------------
  pig: {
    kind: 'passive', hp: 10, w: 0.9, h: 0.9, speed: 3.0,
    model: 'quadruped', colors: { body: 0xf0a0a0, head: 0xf0a0a0, leg: 0xd98a8a },
    drop: 'raw_porkchop',
  },
  cow: {
    kind: 'passive', hp: 10, w: 0.9, h: 1.3, speed: 3.0,
    model: 'quadruped', colors: { body: 0x53381f, head: 0x53381f, leg: 0x3a2815, accent: 0xffffff },
    drop: 'raw_beef',
  },
  sheep: {
    kind: 'passive', hp: 8, w: 0.9, h: 1.2, speed: 3.0,
    model: 'quadruped', colors: { body: 0xf0f0f0, head: 0xe0d6c8, leg: 0xd0c8bc },
    drop: 'raw_mutton',
  },
  chicken: {
    kind: 'passive', hp: 4, w: 0.5, h: 0.6, speed: 3.2,
    model: 'chicken', colors: { body: 0xffffff, head: 0xffffff, leg: 0xffcc33, beak: 0xff8800 },
    drop: 'raw_chicken',
  },
  // HOSTILE -----------------------------------------------------------------
  zombie: {
    kind: 'hostile', hp: 20, w: 0.6, h: 1.8, speed: 2.8, aggro: 16,
    behavior: 'melee', reach: 1.4, dmg: 3, atkCd: 1.0,
    model: 'humanoid', colors: { body: 0x3344aa, head: 0x4a8f4a, limb: 0x3a7a3a, legs: 0x223388 },
    drop: null,
  },
  skeleton: {
    kind: 'hostile', hp: 20, w: 0.6, h: 1.8, speed: 2.8, aggro: 16,
    behavior: 'ranged', keepDist: 7, reach: 12, dmg: 2, atkCd: 1.2,
    model: 'humanoid', colors: { body: 0xcccccc, head: 0xdedede, limb: 0xbcbcbc, legs: 0xaaaaaa },
    drop: null,
  },
  creeper: {
    kind: 'hostile', hp: 20, w: 0.6, h: 1.7, speed: 3.0, aggro: 16,
    behavior: 'creeper', fuseDist: 2.5, fuse: 1.3, blast: 20, blastRadius: 4,
    model: 'creeper', colors: { body: 0x4caa3c, head: 0x5cbf4c, leg: 0x3c8a30 },
    drop: null,
  },
  spider: {
    kind: 'hostile', hp: 16, w: 1.4, h: 0.9, speed: 4.2, aggro: 16,
    behavior: 'melee', reach: 1.5, dmg: 2, atkCd: 1.0, neutralDay: true,
    model: 'spider', colors: { body: 0x2a1a1a, head: 0x3a2222, leg: 0x1a1010, eye: 0xcc2222 },
    drop: null,
  },
};

const PASSIVE_IDS = Object.keys(REGISTRY).filter((k) => REGISTRY[k].kind === 'passive');
const HOSTILE_IDS = Object.keys(REGISTRY).filter((k) => REGISTRY[k].kind === 'hostile');

// ---------------------------------------------------------------------------
// createMobs factory
// ---------------------------------------------------------------------------
export function createMobs(opts) {
  const {
    THREE,
    scene,
    solidAt,
    groundKind,
    player,
    onHurtPlayer = () => {},
    addDrop = () => {},
    sfx = null,
    isNight = () => false,
  } = opts;
  let enabled = opts.enabled !== false;

  // Live mob list. Each mob:
  //  { id, def, group, pos{x,y,z}, vel{x,y,z}, yaw, hp, onGround,
  //    state, stateT, atkT, hurtT, headingT, dirX, dirZ, animT,
  //    fuseT?, parts{...refs for animation/flash} }
  const mobs = [];

  // --- shared geometry/material caches (perf) -----------------------------
  // BoxGeometry is unit; we scale per-part via mesh.scale, so one geo is reused.
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const matCache = new Map(); // colorHex -> MeshBasicMaterial
  function mat(colorHex) {
    let m = matCache.get(colorHex);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color: colorHex });
      matCache.set(colorHex, m);
    }
    return m;
  }

  // Build one box mesh. size/pos in blocks (local to the mob group, origin at
  // feet center). Returns the mesh; caller may keep a ref for animation.
  function box(group, colorHex, sx, sy, sz, px, py, pz) {
    const m = new THREE.Mesh(unitBox, mat(colorHex));
    m.scale.set(sx, sy, sz);
    m.position.set(px, py, pz);
    // base color stored so hurt-flash can restore it
    m.userData.baseColor = colorHex;
    group.add(m);
    return m;
  }

  // -------------------------------------------------------------------------
  // Model builders. Each returns { group, parts } where parts holds meshes we
  // animate (legs) or flash (all). Origin (0,0,0) is the feet center.
  // -------------------------------------------------------------------------
  // Face-feature colors (shared, species-neutral). Reusing the box() helper +
  // mat() cache keeps these cheap and lets hurt-flash tint them too.
  const FEAT = {
    black: 0x111111,
    white: 0xf6f6f6,
    pinkSnout: 0xe79aa6,
    nostril: 0x9c5a66,
    earPig: 0xe48f9b,
    muzzle: 0xb89a78,
    hornCow: 0xd8c8a0,
    sheepFace: 0x2b2622,
    earSheep: 0xd8d0c4,
    beak: 0xff8800,
    wattle: 0xcc2222,
    zombieEye: 0x202820,
    creeperFace: 0x0a1a0a,
    spiderEye: 0xff3030,
  };

  // Add cosmetic facial features. They're parented to the group (which only
  // carries rotation.y = yaw, no scale), positioned at the head's local center
  // plus small offsets, so they "look" where the mob walks. The local +z axis
  // is the front for every model (heads/beaks/eyes are all placed at +z).
  // hx/hy = head center, hz = head front-face z. Each feature is tracked so it
  // hurt-flashes with the rest of the body.
  function addFace(group, track, model, c) {
    const f = (color, sx, sy, sz, px, py, pz) =>
      track(box(group, color, sx, sy, sz, px, py, pz));

    if (model === 'quadruped') {
      const hy = 0.9, hz = 0.755; // head center y; just in front of head front face (0.5+0.25)
      // eyes (white sclera + dark pupil) — common to all quadrupeds
      for (const ex of [0.13, -0.13]) {
        f(FEAT.white, 0.1, 0.1, 0.04, ex, hy + 0.08, hz);
        f(FEAT.black, 0.05, 0.05, 0.05, ex, hy + 0.08, hz + 0.01);
      }
      if (c.head === 0xf0a0a0) {
        // PIG: pink snout w/ nostrils + ears
        f(FEAT.pinkSnout, 0.24, 0.16, 0.08, 0, hy - 0.06, hz);
        for (const nx of [0.05, -0.05]) f(FEAT.nostril, 0.04, 0.06, 0.04, nx, hy - 0.06, hz + 0.03);
        for (const ex2 of [0.16, -0.16]) f(FEAT.earPig, 0.1, 0.1, 0.04, ex2, hy + 0.28, hz - 0.18);
      } else if (c.accent) {
        // COW: lighter muzzle, horns, ears
        f(FEAT.muzzle, 0.3, 0.2, 0.06, 0, hy - 0.1, hz);
        for (const nx of [0.07, -0.07]) f(FEAT.nostril, 0.05, 0.06, 0.04, nx, hy - 0.1, hz + 0.02);
        for (const hxx of [0.16, -0.16]) f(FEAT.hornCow, 0.07, 0.07, 0.07, hxx, hy + 0.3, hz - 0.22);
        for (const exx of [0.27, -0.27]) f(FEAT.muzzle, 0.1, 0.08, 0.06, exx, hy + 0.08, hz - 0.22);
      } else {
        // SHEEP: dark face panel + ears
        f(FEAT.sheepFace, 0.34, 0.36, 0.06, 0, hy - 0.02, hz);
        // re-add eyes on the dark face for contrast
        for (const ex of [0.09, -0.09]) f(FEAT.white, 0.06, 0.06, 0.04, ex, hy + 0.04, hz + 0.02);
        for (const exx of [0.22, -0.22]) f(FEAT.earSheep, 0.1, 0.09, 0.06, exx, hy + 0.02, hz - 0.22);
      }
    } else if (model === 'chicken') {
      const hy = 0.65, hz = 0.335; // head center; front face at 0.18+0.15
      for (const ex of [0.07, -0.07]) f(FEAT.black, 0.05, 0.05, 0.04, ex, hy + 0.05, hz);
      // red wattle under the (existing) beak
      f(FEAT.wattle, 0.06, 0.08, 0.05, 0, hy - 0.12, hz - 0.02);
      // tiny red comb on top
      f(FEAT.wattle, 0.06, 0.06, 0.12, 0, hy + 0.17, hz - 0.06);
    } else if (model === 'humanoid') {
      const hy = 1.65, hz = 0.235; // head center y; front face at 0.225
      if (c.head === 0x4a8f4a) {
        // ZOMBIE: dark sunken eyes + darker mouth line
        for (const ex of [0.1, -0.1]) f(FEAT.zombieEye, 0.1, 0.08, 0.05, ex, hy + 0.06, hz);
        f(FEAT.zombieEye, 0.24, 0.05, 0.04, 0, hy - 0.13, hz);
      } else {
        // SKELETON: black eye sockets + nasal/mouth line on white skull
        for (const ex of [0.1, -0.1]) f(FEAT.black, 0.1, 0.1, 0.05, ex, hy + 0.06, hz);
        f(FEAT.black, 0.05, 0.08, 0.05, 0, hy - 0.06, hz); // nasal cavity
        f(FEAT.black, 0.22, 0.04, 0.04, 0, hy - 0.16, hz); // mouth/teeth line
      }
    } else if (model === 'creeper') {
      const hy = 1.55, hz = 0.255; // head center y; front face at 0.25
      // iconic creeper face: two square eyes + mouth with downward fangs
      for (const ex of [0.12, -0.12]) f(FEAT.creeperFace, 0.12, 0.12, 0.05, ex, hy + 0.08, hz);
      f(FEAT.creeperFace, 0.1, 0.18, 0.05, 0, hy - 0.1, hz); // mouth center stem
      for (const mx of [0.1, -0.1]) f(FEAT.creeperFace, 0.1, 0.1, 0.05, mx, hy - 0.18, hz); // fangs
    } else if (model === 'spider') {
      const hy = 0.55, hz = 0.685; // head center ~0.45; front cluster just past 0.65
      // cluster of small red eyes (two big + two small rows)
      for (const ex of [0.1, -0.1]) f(FEAT.spiderEye, 0.08, 0.08, 0.04, ex, hy + 0.02, hz);
      for (const ex of [0.18, -0.18]) f(FEAT.spiderEye, 0.06, 0.06, 0.04, ex, hy + 0.05, hz - 0.02);
      for (const ex of [0.06, -0.06]) f(FEAT.spiderEye, 0.05, 0.05, 0.04, ex, hy + 0.1, hz - 0.02);
      // mandible hint below the eyes
      for (const mx of [0.07, -0.07]) f(FEAT.black, 0.05, 0.05, 0.06, mx, hy - 0.12, hz);
    }
  }

  function buildModel(def) {
    const group = new THREE.Group();
    const c = def.colors;
    const all = [];
    const legs = [];
    const track = (m) => { all.push(m); return m; };

    if (def.model === 'quadruped') {
      const bodyY = 0.5, bodyH = 0.5;
      track(box(group, c.body, 0.8, bodyH, 0.5, 0, bodyY + 0.2, 0)); // body
      const head = track(box(group, c.head, 0.5, 0.5, 0.5, 0, bodyY + 0.4, 0.5)); // head front
      if (c.accent) track(box(group, c.accent, 0.52, 0.52, 0.2, 0, bodyY + 0.4, 0.62));
      // 4 legs
      const lx = 0.28, lz = 0.18;
      for (const [px, pz] of [[lx, lz], [-lx, lz], [lx, -lz], [-lx, -lz]]) {
        legs.push(track(box(group, c.leg, 0.22, 0.45, 0.22, px, 0.22, pz)));
      }
      head.userData.isHead = true;
    } else if (def.model === 'chicken') {
      track(box(group, c.body, 0.4, 0.4, 0.35, 0, 0.4, 0));
      const head = track(box(group, c.head, 0.3, 0.3, 0.3, 0, 0.65, 0.18));
      track(box(group, c.beak, 0.12, 0.12, 0.15, 0, 0.65, 0.38));
      // two legs
      for (const px of [0.1, -0.1]) {
        legs.push(track(box(group, c.leg, 0.08, 0.25, 0.08, px, 0.13, 0)));
      }
      head.userData.isHead = true;
    } else if (def.model === 'humanoid') {
      track(box(group, c.legs, 0.5, 0.75, 0.28, 0, 1.1, 0)); // body/torso
      const head = track(box(group, c.head, 0.45, 0.45, 0.45, 0, 1.65, 0)); // head
      // arms
      track(box(group, c.limb, 0.18, 0.7, 0.18, 0.34, 1.1, 0));
      track(box(group, c.limb, 0.18, 0.7, 0.18, -0.34, 1.1, 0));
      // legs
      for (const px of [0.13, -0.13]) {
        legs.push(track(box(group, c.legs, 0.2, 0.7, 0.2, px, 0.35, 0)));
      }
      head.userData.isHead = true;
    } else if (def.model === 'creeper') {
      track(box(group, c.body, 0.5, 1.0, 0.4, 0, 0.95, 0)); // body
      const head = track(box(group, c.head, 0.5, 0.5, 0.5, 0, 1.55, 0)); // head
      // 4 stubby legs
      for (const [px, pz] of [[0.15, 0.18], [-0.15, 0.18], [0.15, -0.18], [-0.15, -0.18]]) {
        legs.push(track(box(group, c.leg, 0.2, 0.3, 0.2, px, 0.15, pz)));
      }
      head.userData.isHead = true;
    } else if (def.model === 'spider') {
      track(box(group, c.body, 0.7, 0.45, 0.9, 0, 0.45, -0.1)); // abdomen
      const head = track(box(group, c.head, 0.5, 0.4, 0.4, 0, 0.45, 0.45)); // head
      track(box(group, c.eye, 0.4, 0.1, 0.05, 0, 0.55, 0.65));
      // 8 thin legs (4 per side)
      for (const side of [1, -1]) {
        for (let i = 0; i < 4; i++) {
          const lz = 0.35 - i * 0.25;
          legs.push(track(box(group, c.leg, 0.6, 0.08, 0.08, side * 0.55, 0.4, lz)));
        }
      }
      head.userData.isHead = true;
    } else {
      // fallback cube
      track(box(group, 0xff00ff, 0.6, 0.6, 0.6, 0, 0.3, 0));
    }

    // cosmetic facial features (eyes/snout/beak/etc.) on the front of the head
    addFace(group, track, def.model, c);

    return { group, parts: { all, legs } };
  }

  // -------------------------------------------------------------------------
  // Physics helpers
  // -------------------------------------------------------------------------
  // Is the column blocked at world (x,z) over the mob's body height starting at
  // feet y? Samples feet and head voxel cells.
  function blockedAt(x, y, z, h) {
    const fx = Math.floor(x), fz = Math.floor(z);
    const feetY = Math.floor(y + 0.1);
    const headY = Math.floor(y + h - 0.1);
    for (let yy = feetY; yy <= headY; yy++) {
      if (solidAt(fx, yy, fz)) return true;
    }
    return false;
  }

  // Is there solid ground directly under feet?
  function groundUnder(x, y, z) {
    return solidAt(Math.floor(x), Math.floor(y - 0.05), Math.floor(z));
  }

  // -------------------------------------------------------------------------
  // Spawning
  // -------------------------------------------------------------------------
  // Scan downward from a high y to find a standable surface at column (x,z).
  // Returns the feet-y to spawn at, or null if none found / unsuitable.
  function findGround(x, z, wantGrass) {
    const cx = Math.floor(x), cz = Math.floor(z);
    // scan a reasonable vertical window around the player's height
    const top = Math.floor(player.pos.y) + 16;
    const bottom = Math.floor(player.pos.y) - 24;
    for (let y = top; y >= bottom; y--) {
      if (solidAt(cx, y, cz)) {
        // surface is at y; feet go at y+1; need 2 air blocks above for body
        if (solidAt(cx, y + 1, cz) || solidAt(cx, y + 2, cz)) return null;
        if (wantGrass) {
          if (groundKind(cx, y, cz) !== 'grass') return null;
        } else {
          const k = groundKind(cx, y, cz);
          if (k === 'air') return null; // not on water/air
        }
        return y + 1;
      }
    }
    return null;
  }

  function spawnOne() {
    if (mobs.length >= SOFT_CAP) return;
    const night = isNight();
    const ids = night ? HOSTILE_IDS : PASSIVE_IDS;
    if (ids.length === 0) return;
    const id = ids[(Math.random() * ids.length) | 0];

    // pick a random spot in the spawn ring around the player
    const ang = Math.random() * Math.PI * 2;
    const r = SPAWN_RING_MIN + Math.random() * (SPAWN_RING_MAX - SPAWN_RING_MIN);
    const x = player.pos.x + Math.cos(ang) * r;
    const z = player.pos.z + Math.sin(ang) * r;

    const feetY = findGround(x, z, !night); // day: grass; night: any solid
    if (feetY == null) return;
    spawnMob(id, x + 0.5 - (x - Math.floor(x)), feetY, z + 0.5 - (z - Math.floor(z)));
  }

  function spawnMob(id, x, y, z) {
    const def = REGISTRY[id];
    if (!def) return null;
    const { group, parts } = buildModel(def);
    group.position.set(x, y, z);
    scene.add(group);
    const mob = {
      id, def, group, parts,
      pos: { x, y, z },
      vel: { x: 0, y: 0, z: 0 },
      yaw: Math.random() * Math.PI * 2,
      hp: def.hp,
      onGround: false,
      state: 'idle',
      stateT: 0,
      atkT: 0,
      hurtT: 0,
      headingT: 0,
      dirX: 0, dirZ: 0,
      animT: 0,
      moving: false,
      fuseT: 0,
      dead: false,
    };
    mobs.push(mob);
    return mob;
  }

  // -------------------------------------------------------------------------
  // Removal
  // -------------------------------------------------------------------------
  function removeMob(mob, drop) {
    if (mob.dead) return;
    mob.dead = true;
    scene.remove(mob.group);
    const i = mobs.indexOf(mob);
    if (i >= 0) mobs.splice(i, 1);
    if (drop) addDrop(drop, 1);
  }

  // -------------------------------------------------------------------------
  // Hurt flash: tint all parts red, restore after HURT_FLASH_TIME. Because we
  // share materials across mobs, we swap each mesh to a dedicated red material
  // during flash and back to the cached base material after.
  // -------------------------------------------------------------------------
  const redMat = new THREE.MeshBasicMaterial({ color: 0xff3030 });
  function flash(mob) {
    mob.hurtT = HURT_FLASH_TIME;
    for (const m of mob.parts.all) m.material = redMat;
  }
  function unflash(mob) {
    for (const m of mob.parts.all) m.material = mat(m.userData.baseColor);
  }

  // -------------------------------------------------------------------------
  // Damage application + knockback
  // -------------------------------------------------------------------------
  function hurt(mob, dmg, fromX, fromZ, knock) {
    mob.hp -= dmg;
    flash(mob);
    if (sfx && sfx.break) { try { sfx.break(mob.id); } catch (e) { /* optional */ } }
    // knockback: shove away from source on the horizontal plane
    if (knock) {
      let dx = mob.pos.x - fromX, dz = mob.pos.z - fromZ;
      const d = Math.hypot(dx, dz) || 1;
      dx /= d; dz /= d;
      mob.vel.x += dx * knock;
      mob.vel.z += dz * knock;
      mob.vel.y += knock * 0.5; // a little pop up
    }
    // passive mobs flee when hit
    if (mob.def.kind === 'passive') {
      mob.state = 'flee';
      mob.stateT = FLEE_TIME;
      const dx = mob.pos.x - fromX, dz = mob.pos.z - fromZ;
      const d = Math.hypot(dx, dz) || 1;
      mob.dirX = dx / d; mob.dirZ = dz / d;
    }
    if (mob.hp <= 0) {
      // ~30% chance to actually drop something (sparingly), if a drop is defined
      const drop = mob.def.drop && Math.random() < 0.4 ? mob.def.drop : null;
      removeMob(mob, drop);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Per-mob physics step. Moves horizontally with step-up, applies gravity and
  // ground collision.
  // -------------------------------------------------------------------------
  function physics(mob, dt) {
    const def = mob.def;
    // gravity
    mob.vel.y -= GRAVITY * dt;
    if (mob.vel.y < -TERMINAL_FALL) mob.vel.y = -TERMINAL_FALL;

    // horizontal proposed move
    const nx = mob.pos.x + mob.vel.x * dt;
    const nz = mob.pos.z + mob.vel.z * dt;

    // try X axis
    if (!blockedAt(nx, mob.pos.y, mob.pos.z, def.h)) {
      mob.pos.x = nx;
    } else if (mob.onGround && !blockedAt(nx, mob.pos.y + 1, mob.pos.z, def.h) && !solidAt(Math.floor(nx), Math.floor(mob.pos.y + 1.1), Math.floor(mob.pos.z))) {
      // step up 1 block
      mob.pos.x = nx;
      mob.pos.y += 1;
    } else {
      mob.vel.x = 0;
    }
    // try Z axis
    if (!blockedAt(mob.pos.x, mob.pos.y, nz, def.h)) {
      mob.pos.z = nz;
    } else if (mob.onGround && !blockedAt(mob.pos.x, mob.pos.y + 1, nz, def.h) && !solidAt(Math.floor(mob.pos.x), Math.floor(mob.pos.y + 1.1), Math.floor(nz))) {
      mob.pos.z = nz;
      mob.pos.y += 1;
    } else {
      mob.vel.z = 0;
    }

    // vertical move + ground collision
    let ny = mob.pos.y + mob.vel.y * dt;
    if (mob.vel.y <= 0) {
      // landing: snap feet to the top of the solid cell they're entering
      // (previously a narrow 0.6 window caused a sink->snap vertical jitter)
      const groundY = Math.floor(ny - 0.02);
      if (solidAt(Math.floor(mob.pos.x), groundY, Math.floor(mob.pos.z))) {
        ny = groundY + 1;
        mob.vel.y = 0;
        mob.onGround = true;
      } else {
        mob.onGround = false;
      }
    } else {
      // moving up: check head
      if (solidAt(Math.floor(mob.pos.x), Math.floor(ny + def.h), Math.floor(mob.pos.z))) {
        mob.vel.y = 0;
        ny = mob.pos.y;
      }
      mob.onGround = false;
    }
    mob.pos.y = ny;

    // horizontal damping (friction) when grounded
    if (mob.onGround) {
      mob.vel.x *= 0.7;
      mob.vel.z *= 0.7;
    }
  }

  // Steer the mob's intended horizontal velocity toward (dirX,dirZ) at speed.
  function steer(mob, dirX, dirZ, speed) {
    const d = Math.hypot(dirX, dirZ);
    if (d < 1e-4) return;
    dirX /= d; dirZ /= d;
    // preserve any knockback impulse by adding toward target velocity
    const tvx = dirX * speed, tvz = dirZ * speed;
    mob.vel.x += (tvx - mob.vel.x) * 0.5;
    mob.vel.z += (tvz - mob.vel.z) * 0.5;
    mob.yaw = Math.atan2(dirX, dirZ);
    mob.moving = true;
  }

  // -------------------------------------------------------------------------
  // AI per mob
  // -------------------------------------------------------------------------
  function ai(mob, dt) {
    const def = mob.def;
    mob.moving = false;
    const px = player.pos.x, py = player.pos.y, pz = player.pos.z;
    const dx = px - mob.pos.x, dz = pz - mob.pos.z;
    const distH = Math.hypot(dx, dz);

    if (def.kind === 'passive') {
      passiveAI(mob, dt);
    } else {
      hostileAI(mob, dt, dx, dz, distH);
    }
  }

  function passiveAI(mob, dt) {
    if (mob.state === 'flee') {
      mob.stateT -= dt;
      steer(mob, mob.dirX, mob.dirZ, mob.def.speed * 1.5);
      if (mob.stateT <= 0) { mob.state = 'idle'; mob.headingT = 0; }
      return;
    }
    // wander: pick a new heading every few seconds; sometimes idle
    mob.headingT -= dt;
    if (mob.headingT <= 0) {
      mob.headingT = 2 + Math.random() * 4;
      if (Math.random() < 0.3) {
        mob.dirX = 0; mob.dirZ = 0; // pause
      } else {
        const a = Math.random() * Math.PI * 2;
        mob.dirX = Math.cos(a); mob.dirZ = Math.sin(a);
      }
    }
    if (mob.dirX || mob.dirZ) steer(mob, mob.dirX, mob.dirZ, mob.def.speed);
  }

  function hostileAI(mob, dt, dx, dz, distH) {
    const def = mob.def;
    mob.atkT -= dt;

    // spider is neutral in daylight: wander unless it's night
    if (def.neutralDay && !isNight()) {
      passiveAI(mob, dt);
      return;
    }

    if (distH > def.aggro) {
      // out of range: idle-wander cheaply
      passiveAI(mob, dt);
      return;
    }

    if (def.behavior === 'melee') {
      if (distH > def.reach) {
        steer(mob, dx, dz, def.speed);
      } else {
        // face player and attack on cooldown
        mob.yaw = Math.atan2(dx, dz);
        if (mob.atkT <= 0) { onHurtPlayer(def.dmg); mob.atkT = def.atkCd; }
      }
    } else if (def.behavior === 'ranged') {
      // skeleton: keep ~keepDist; back off if too close, approach if too far,
      // and fire on cooldown when within line range.
      if (distH < def.keepDist - 1) {
        steer(mob, -dx, -dz, def.speed); // retreat
      } else if (distH > def.keepDist + 1) {
        steer(mob, dx, dz, def.speed); // close in
      } else {
        mob.yaw = Math.atan2(dx, dz);
      }
      if (distH <= def.reach && mob.atkT <= 0) {
        onHurtPlayer(def.dmg);
        mob.atkT = def.atkCd;
        spawnArrow(mob, dx, dz, player.pos.y - mob.pos.y);
      }
    } else if (def.behavior === 'creeper') {
      if (distH > def.fuseDist) {
        // approach; reset fuse if we wander out of range
        steer(mob, dx, dz, def.speed);
        if (mob.fuseT > 0) { mob.fuseT = 0; unflash(mob); }
      } else {
        mob.yaw = Math.atan2(dx, dz);
        mob.fuseT += dt;
        // flash white while fusing (blink)
        const blink = Math.floor(mob.fuseT * 8) % 2 === 0;
        for (const m of mob.parts.all) m.material = blink ? whiteMat : mat(m.userData.baseColor);
        if (mob.fuseT >= def.fuse) {
          explode(mob);
        }
      }
    }
  }

  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Creeper explosion: damage falls off linearly with distance, then dies.
  function explode(mob) {
    const dx = player.pos.x - mob.pos.x;
    const dy = player.pos.y - mob.pos.y;
    const dz = player.pos.z - mob.pos.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < mob.def.blastRadius) {
      const dmg = Math.max(0, Math.round(mob.def.blast * (1 - d / mob.def.blastRadius)));
      if (dmg > 0) onHurtPlayer(dmg);
    }
    removeMob(mob, null);
  }

  // -------------------------------------------------------------------------
  // Skeleton "arrow": a tiny box that flies toward the player for visual
  // feedback. Damage was already applied; this is cosmetic and self-removing.
  // -------------------------------------------------------------------------
  const arrows = []; // { mesh, pos, vel, t }
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x999999 });
  function spawnArrow(mob, dx, dz, dy) {
    const d = Math.hypot(dx, dy + 1, dz) || 1;
    const mesh = new THREE.Mesh(unitBox, arrowMat);
    mesh.scale.set(0.1, 0.1, 0.4);
    const sx = mob.pos.x, sy = mob.pos.y + 1.4, sz = mob.pos.z;
    mesh.position.set(sx, sy, sz);
    scene.add(mesh);
    const speed = 24;
    arrows.push({
      mesh,
      pos: { x: sx, y: sy, z: sz },
      vel: { x: (dx / d) * speed, y: ((dy + 1) / d) * speed, z: (dz / d) * speed },
      t: 0.6,
    });
  }
  function updateArrows(dt) {
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];
      a.t -= dt;
      a.pos.x += a.vel.x * dt;
      a.pos.y += a.vel.y * dt;
      a.pos.z += a.vel.z * dt;
      if (a.mesh.position.set) a.mesh.position.set(a.pos.x, a.pos.y, a.pos.z);
      if (a.t <= 0 || solidAt(Math.floor(a.pos.x), Math.floor(a.pos.y), Math.floor(a.pos.z))) {
        scene.remove(a.mesh);
        arrows.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Mesh sync + cheap leg-swing animation
  // -------------------------------------------------------------------------
  function syncMesh(mob, dt) {
    mob.group.position.set(mob.pos.x, mob.pos.y, mob.pos.z);
    mob.group.rotation.y = mob.yaw;
    // leg swing while moving
    if (mob.moving && Math.hypot(mob.vel.x, mob.vel.z) > 0.2) {
      mob.animT += dt * 8;
      const sw = Math.sin(mob.animT) * 0.4;
      const legs = mob.parts.legs;
      for (let i = 0; i < legs.length; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        if (legs[i].rotation) legs[i].rotation.x = sw * dir;
      }
    } else {
      const legs = mob.parts.legs;
      for (let i = 0; i < legs.length; i++) if (legs[i].rotation) legs[i].rotation.x = 0;
    }
    // hurt flash timeout
    if (mob.hurtT > 0) {
      mob.hurtT -= dt;
      if (mob.hurtT <= 0 && mob.fuseT <= 0) unflash(mob);
    }
  }

  // -------------------------------------------------------------------------
  // attack(): player melee ray. Damage nearest mob whose AABB intersects the
  // ray within `reach`. Returns the mob hit (or null). Applies knockback.
  // -------------------------------------------------------------------------
  function attack(origin, dir, reach, dmg) {
    // normalize dir
    const dl = Math.hypot(dir.x, dir.y, dir.z) || 1;
    const dxn = dir.x / dl, dyn = dir.y / dl, dzn = dir.z / dl;

    let best = null, bestT = reach;
    for (const mob of mobs) {
      // mob AABB centered on x/z, from feet y to y+h
      const def = mob.def;
      const minX = mob.pos.x - def.w / 2, maxX = mob.pos.x + def.w / 2;
      const minY = mob.pos.y, maxY = mob.pos.y + def.h;
      const minZ = mob.pos.z - def.w / 2, maxZ = mob.pos.z + def.w / 2;
      const t = rayAABB(origin, dxn, dyn, dzn, minX, minY, minZ, maxX, maxY, maxZ, reach);
      if (t != null && t < bestT) { bestT = t; best = mob; }
    }
    if (best) {
      const died = hurt(best, dmg, player.pos.x, player.pos.z, 8);
      return died ? null : best; // mob removed if it died
    }
    return null;
  }

  // Slab-method ray vs AABB. Returns entry distance t in [0,maxT] or null.
  function rayAABB(o, dx, dy, dz, minX, minY, minZ, maxX, maxY, maxZ, maxT) {
    let tmin = 0, tmax = maxT;
    // X
    if (Math.abs(dx) < 1e-8) {
      if (o.x < minX || o.x > maxX) return null;
    } else {
      let t1 = (minX - o.x) / dx, t2 = (maxX - o.x) / dx;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
    // Y
    if (Math.abs(dy) < 1e-8) {
      if (o.y < minY || o.y > maxY) return null;
    } else {
      let t1 = (minY - o.y) / dy, t2 = (maxY - o.y) / dy;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
    // Z
    if (Math.abs(dz) < 1e-8) {
      if (o.z < minZ || o.z > maxZ) return null;
    } else {
      let t1 = (minZ - o.z) / dz, t2 = (maxZ - o.z) / dz;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
    return tmin;
  }

  // -------------------------------------------------------------------------
  // Main update loop
  // -------------------------------------------------------------------------
  let spawnT = 0;
  function update(dt) {
    if (!enabled) return;
    if (dt > 0.1) dt = 0.1; // clamp big steps (tab switch etc.)

    // spawn attempts on a timer
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnT = SPAWN_INTERVAL;
      spawnOne();
    }

    // step each mob (iterate backwards: mobs may be removed via explode)
    for (let i = mobs.length - 1; i >= 0; i--) {
      const mob = mobs[i];
      if (mob.dead) continue;
      ai(mob, dt);
      physics(mob, dt);
      syncMesh(mob, dt);
      // despawn if far from player
      const ddx = mob.pos.x - player.pos.x, ddz = mob.pos.z - player.pos.z;
      if (Math.hypot(ddx, ddz) > DESPAWN_DIST) removeMob(mob, null);
      // fell out of world
      else if (mob.pos.y < player.pos.y - 64) removeMob(mob, null);
    }

    updateArrows(dt);
  }

  // -------------------------------------------------------------------------
  // Misc API
  // -------------------------------------------------------------------------
  function setEnabled(on) {
    enabled = !!on;
    if (!enabled) clear();
  }

  function clear() {
    for (const mob of mobs.slice()) removeMob(mob, null);
    mobs.length = 0;
    for (const a of arrows.slice()) scene.remove(a.mesh);
    arrows.length = 0;
  }

  function count() {
    return mobs.length;
  }

  const api = {
    update,
    attack,
    setEnabled,
    clear,
    count,
    // exposed for testing/advanced use:
    _spawnMob: spawnMob,
    _registry: REGISTRY,
  };
  return api;
}

export default createMobs;
