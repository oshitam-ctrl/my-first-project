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
  // FRIENDLY HUMAN NPCs -----------------------------------------------------
  // Passive, no drop, no attack. Use the 'humanoid' model with a friendly face.
  // `friendly: true` selects calm eyes/smile + skin-tone head in addFace, and
  // marks them harmless (player attacks can hit but won't kill them).
  baker: {
    // パン屋の店主: cream apron-y look, mostly stands still.
    kind: 'passive', hp: 40, w: 0.6, h: 1.8, speed: 1.0, natural: false,
    model: 'humanoid', friendly: true, calm: true, invincible: true,
    // legs = apron/torso (teal apron), head = skin tone, limb = cream sleeves
    colors: { body: 0xfff4e0, head: 0xf0c8a0, limb: 0xfff4e0, legs: 0x4fb3a6, hair: 0x5a4634 },
    drop: null,
  },
  customer: {
    // お客さん: casual clothes, gentle normal wander.
    kind: 'passive', hp: 30, w: 0.6, h: 1.8, speed: 1.8,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { body: 0xc05a5a, head: 0xe8b890, limb: 0xc05a5a, legs: 0x3a5a8a, hair: 0x2a2018 },
    drop: null,
  },
  // -- townsfolk (roam naturally; varied looks so the village feels alive) --
  villager: {
    kind: 'passive', hp: 30, w: 0.6, h: 1.8, speed: 1.6,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { body: 0x8a6e52, head: 0xc9a07a, limb: 0x6e5440, legs: 0x6e5440, hair: 0x4a3a2a },
    drop: null,
  },
  child: {
    kind: 'passive', hp: 20, w: 0.5, h: 1.25, speed: 2.6, scale: 0.66,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { body: 0xe85d5d, head: 0xf0c8a0, limb: 0xe85d5d, legs: 0x3a6ad0, hair: 0x2a2018 },
    drop: null,
  },
  farmer: {
    kind: 'passive', hp: 30, w: 0.6, h: 1.8, speed: 1.6,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { body: 0x9aa45a, head: 0xe8b890, limb: 0x9aa45a, legs: 0x3a5a8a, hair: 0x3a2a1a, helmet: 0xd9c25a, brim: true },
    drop: null,
  },
  // -- "various worldviews": armored / enchanted heroes (curated, not random) --
  knight_diamond: {
    kind: 'passive', hp: 30, w: 0.6, h: 1.85, speed: 1.4, natural: false,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { head: 0xe8b890, limb: 0x4fd6c8, legs: 0x2a3a8a, body: 0x57e0d2, chest: 0x57e0d2, helmet: 0x57e0d2, cape: 0x2a6ad0 },
    drop: null,
  },
  knight_netherite: { // enchanted netherite — the マイクラ厨 easter egg
    kind: 'passive', hp: 30, w: 0.6, h: 1.85, speed: 1.4, natural: false,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { head: 0xd8a888, limb: 0x3a3438, legs: 0x2a2428, body: 0x46403f, chest: 0x46403f, helmet: 0x46403f, cape: 0x6a2a2a, glint: 0xb070ff },
    drop: null,
  },
  knight_gold: {
    kind: 'passive', hp: 30, w: 0.6, h: 1.85, speed: 1.4, natural: false,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { head: 0xe8b890, limb: 0xe8c33a, legs: 0x7a5a1a, body: 0xe8c33a, chest: 0xe8c33a, helmet: 0xe8c33a, cape: 0x8a1a1a },
    drop: null,
  },
  adventurer: { // iron armor + green cape
    kind: 'passive', hp: 30, w: 0.6, h: 1.85, speed: 1.6, natural: false,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { head: 0xe8b890, limb: 0x5a5a6a, legs: 0x3a3a4a, body: 0xcfd2d6, chest: 0xcfd2d6, helmet: 0xcfd2d6, cape: 0x2a8a4a },
    drop: null,
  },
  wizard: { // enchanter: purple robe, pointed hat, sparkles
    kind: 'passive', hp: 30, w: 0.6, h: 1.85, speed: 1.5, natural: false,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { head: 0xe8c0a0, limb: 0x6a3ac0, legs: 0x4a2a8a, body: 0x6a3ac0, helmet: 0x4a2a8a, hatPeak: true, hair: 0xdddddd, glint: 0x70f0ff },
    drop: null,
  },
  miner: {
    kind: 'passive', hp: 30, w: 0.6, h: 1.8, speed: 1.7, natural: false,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { head: 0xe8b890, limb: 0x5a4a3a, legs: 0x3a3a40, body: 0x5a4a3a, helmet: 0xe8c020, hair: 0x2a2018 },
    drop: null,
  },
  ninja: {
    kind: 'passive', hp: 30, w: 0.6, h: 1.8, speed: 2.4, natural: false,
    model: 'humanoid', friendly: true, invincible: true,
    colors: { head: 0x2a2a30, limb: 0x222226, legs: 0x222226, body: 0x2a2a30 },
    drop: null,
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

// Natural day spawns = animals + townsfolk only. Curated heroes (knights, wizard,
// the baker, …) are marked `natural:false` so they appear only where placed.
const PASSIVE_IDS = Object.keys(REGISTRY).filter((k) => REGISTRY[k].kind === 'passive' && REGISTRY[k].natural !== false);
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

  // Create a pivot Group for limb animation. The pivot sits at (px, pivotY, pz)
  // in group-space (the "joint" — hip, shoulder, etc.). The visible mesh is
  // placed inside the pivot, offset so its TOP edge is at the pivot origin:
  //   mesh.position.y = -(sy / 2)   (box is centered, so center = -half-height)
  // Rotating pivot.rotation.x swings the limb about that joint, producing a
  // natural walking motion. No per-frame allocations needed; we just set
  // pivot.rotation.x in syncMesh.
  //
  // The pivot itself is added to `parts.all` (for hurt-flash traversal) AND
  // the inner mesh is tracked (also for hurt-flash). The PIVOT is what we
  // store in parts.legs / parts.arms so callers can set pivot.rotation.x.
  //
  // offsetY: extra downward offset on the mesh centre (default 0). Useful when
  // the limb is not sy tall (e.g. for asymmetric parts).
  function makePivot(group, track, colorHex, sx, sy, sz, px, pivotY, pz, offsetY) {
    const pivot = new THREE.Group();
    pivot.position.set(px, pivotY, pz);
    group.add(pivot);
    // inner mesh: centred at -(sy/2) so its top aligns with the pivot origin
    const meshY = -(sy / 2) - (offsetY || 0);
    const m = new THREE.Mesh(unitBox, mat(colorHex));
    m.scale.set(sx, sy, sz);
    m.position.set(0, meshY, 0);
    m.userData.baseColor = colorHex;
    pivot.add(m);
    track(m); // register inner mesh so hurt-flash colours it
    // give the pivot a rotation object (the full-stub Group already has one;
    // guard in case a minimal stub only returns a plain {x,y,z} object)
    return pivot;
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
      if (c.friendly) {
        // FRIENDLY NPC (baker/customer): calm round eyes + a gentle smile.
        for (const ex of [0.1, -0.1]) {
          f(FEAT.white, 0.09, 0.09, 0.04, ex, hy + 0.06, hz);
          f(FEAT.black, 0.05, 0.05, 0.05, ex, hy + 0.06, hz + 0.01);
        }
        // small rosy cheeks
        for (const cx of [0.16, -0.16]) f(FEAT.pinkSnout, 0.06, 0.05, 0.03, cx, hy - 0.05, hz);
        // smile (a short dark mouth line)
        f(FEAT.black, 0.14, 0.03, 0.04, 0, hy - 0.13, hz);
      } else if (c.head === 0x4a8f4a) {
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
    const arms = []; // humanoid only: [rightArmPivot, leftArmPivot]
    let headMesh = null; // the head mesh (for head-look yaw)
    let bodyMesh = null; // main body/torso mesh (for idle breathing scale.y)
    const track = (m) => { all.push(m); return m; };

    if (def.model === 'quadruped') {
      // body: centred at bodyY+0.2, height 0.5
      const bodyY = 0.5, bodyH = 0.5;
      bodyMesh = track(box(group, c.body, 0.8, bodyH, 0.5, 0, bodyY + 0.2, 0));
      headMesh = track(box(group, c.head, 0.5, 0.5, 0.5, 0, bodyY + 0.4, 0.5));
      if (c.accent) track(box(group, c.accent, 0.52, 0.52, 0.2, 0, bodyY + 0.4, 0.62));
      headMesh.userData.isHead = true;
      // 4 legs — each in a pivot at hip height (top of leg = 0.45 up from feet)
      // pivot at y=0.45, mesh inside offset -0.225 so it hangs downward
      const lx = 0.28, lz = 0.18;
      for (const [px, pz] of [[lx, lz], [-lx, lz], [lx, -lz], [-lx, -lz]]) {
        legs.push(makePivot(group, track, c.leg, 0.22, 0.45, 0.22, px, 0.45, pz));
      }
    } else if (def.model === 'chicken') {
      bodyMesh = track(box(group, c.body, 0.4, 0.4, 0.35, 0, 0.4, 0));
      headMesh = track(box(group, c.head, 0.3, 0.3, 0.3, 0, 0.65, 0.18));
      track(box(group, c.beak, 0.12, 0.12, 0.15, 0, 0.65, 0.38));
      headMesh.userData.isHead = true;
      // two legs — pivot at y=0.27 (just under body bottom), mesh hangs 0.125 down
      for (const px of [0.1, -0.1]) {
        legs.push(makePivot(group, track, c.leg, 0.08, 0.25, 0.08, px, 0.27, 0));
      }
    } else if (def.model === 'humanoid') {
      // Torso: occupies roughly y=0.72 (hip) to y=1.47 (shoulder)
      bodyMesh = track(box(group, c.legs, 0.5, 0.75, 0.28, 0, 1.1, 0));
      if (c.body && c.body !== c.legs) track(box(group, c.body, 0.52, 0.42, 0.3, 0, 1.28, 0));
      headMesh = track(box(group, c.head, 0.45, 0.45, 0.45, 0, 1.65, 0));
      headMesh.userData.isHead = true;
      if (c.hair) {
        track(box(group, c.hair, 0.48, 0.16, 0.48, 0, 1.82, 0));
        track(box(group, c.hair, 0.48, 0.4, 0.12, 0, 1.66, -0.2));
      }
      // Arms: pivot at shoulder (y≈1.47), arm hangs 0.35 down from centre
      // Right arm (+x side)
      arms.push(makePivot(group, track, c.limb, 0.18, 0.7, 0.18, 0.34, 1.47, 0));
      // Left arm (-x side)
      arms.push(makePivot(group, track, c.limb, 0.18, 0.7, 0.18, -0.34, 1.47, 0));
      // Legs: pivot at hip (y≈0.72), leg hangs 0.35 down from centre
      for (const px of [0.13, -0.13]) {
        legs.push(makePivot(group, track, c.legs, 0.2, 0.7, 0.2, px, 0.72, 0));
      }
      // --- optional costume / armor overlays (knights, wizards, farmers, kids) ---
      if (c.chest) {
        track(box(group, c.chest, 0.56, 0.5, 0.34, 0, 1.22, 0));
        track(box(group, c.chest, 0.22, 0.2, 0.24, 0.34, 1.42, 0));
        track(box(group, c.chest, 0.22, 0.2, 0.24, -0.34, 1.42, 0));
      }
      if (c.cape) track(box(group, c.cape, 0.5, 0.85, 0.06, 0, 1.18, -0.2));
      if (c.helmet) {
        track(box(group, c.helmet, 0.52, 0.22, 0.52, 0, 1.9, 0));
        track(box(group, c.helmet, 0.52, 0.18, 0.12, 0, 1.78, -0.22));
        if (c.brim) track(box(group, c.helmet, 0.78, 0.06, 0.78, 0, 1.8, 0));
        if (c.hatPeak) track(box(group, c.helmet, 0.18, 0.55, 0.18, 0, 2.2, 0));
      }
      if (c.glint) {
        track(box(group, c.glint, 0.07, 0.07, 0.07, 0.32, 1.55, 0.22));
        track(box(group, c.glint, 0.06, 0.06, 0.06, -0.28, 1.3, 0.24));
      }
    } else if (def.model === 'creeper') {
      bodyMesh = track(box(group, c.body, 0.5, 1.0, 0.4, 0, 0.95, 0));
      headMesh = track(box(group, c.head, 0.5, 0.5, 0.5, 0, 1.55, 0));
      headMesh.userData.isHead = true;
      // 4 stubby legs — pivot at y=0.3 (just above feet)
      for (const [px, pz] of [[0.15, 0.18], [-0.15, 0.18], [0.15, -0.18], [-0.15, -0.18]]) {
        legs.push(makePivot(group, track, c.leg, 0.2, 0.3, 0.2, px, 0.3, pz));
      }
    } else if (def.model === 'spider') {
      bodyMesh = track(box(group, c.body, 0.7, 0.45, 0.9, 0, 0.45, -0.1));
      headMesh = track(box(group, c.head, 0.5, 0.4, 0.4, 0, 0.45, 0.45));
      headMesh.userData.isHead = true;
      track(box(group, c.eye, 0.4, 0.1, 0.05, 0, 0.55, 0.65));
      // 8 thin horizontal legs — stored flat; we'll animate rotation.z for jitter
      // Pivot at body centre (y=0.45), leg extends outward on x-axis
      for (const side of [1, -1]) {
        for (let i = 0; i < 4; i++) {
          const lz = 0.35 - i * 0.25;
          // horizontal legs: pivot at body edge, leg extends outward
          legs.push(makePivot(group, track, c.leg, 0.6, 0.08, 0.08, side * 0.35, 0.42, lz));
        }
      }
    } else {
      // fallback cube
      track(box(group, 0xff00ff, 0.6, 0.6, 0.6, 0, 0.3, 0));
    }

    // cosmetic facial features (eyes/snout/beak/etc.) on the front of the head
    addFace(group, track, def.model, c);

    // parts.arms and parts.head are optional (only set for relevant models)
    const parts = { all, legs, arms, head: headMesh, body: bodyMesh };
    return { group, parts };
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
    if (def.scale) group.scale.setScalar(def.scale); // smaller silhouette for kids
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
      persistent: false, // spawnAt() sets this true so the mob never despawns
    };
    mobs.push(mob);
    return mob;
  }

  // Spawn one mob of registry `typeId` at world (x,y,z). Unlike random spawns
  // this does NOT respect the soft cap and is marked persistent so the despawn
  // check (64-block / fell-out-of-world) leaves it alone — e.g. the baker
  // stays put in the shop. Returns the mob (or null for an unknown id).
  function spawnAt(typeId, x, y, z) {
    const mob = spawnMob(typeId, x, y, z);
    if (mob) mob.persistent = true;
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
    // Friendly/invincible NPCs (baker, customers) can be hit but never take
    // damage or die — cozy game. They still flash + gently scurry away.
    if (!mob.def.invincible) mob.hp -= dmg;
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
    // wander: pick a new heading every few seconds; sometimes idle. "calm"
    // mobs (e.g. the baker) mostly stand still with only rare gentle steps.
    const calm = mob.def.calm;
    mob.headingT -= dt;
    if (mob.headingT <= 0) {
      mob.headingT = calm ? 4 + Math.random() * 5 : 2 + Math.random() * 4;
      if (Math.random() < (calm ? 0.85 : 0.3)) {
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
  // Mesh sync + animation
  //
  // PIVOT SYSTEM: animatable limbs (legs, arms) are THREE.Group pivots whose
  // origin sits at the joint (hip/shoulder). The visible mesh inside each pivot
  // is offset downward so its top aligns with the pivot. Rotating pivot.rotation.x
  // therefore swings the limb from the joint — natural walking motion with zero
  // per-frame allocation.
  //
  // HEAD-LOOK: the head mesh is rotated in local Y toward the player when the
  // player is within HEAD_LOOK_DIST blocks, clamped to ±HEAD_LOOK_CLAMP rad.
  //
  // IDLE BREATHING: a small scale.y oscillation on the body mesh (± BREATHE_AMP)
  // gives the impression the mob is alive even when standing still.
  //
  // SPIDER LEGS: the spider's legs extend horizontally, so we animate rotation.z
  // (side-to-side jitter) rather than rotation.x.
  // -------------------------------------------------------------------------
  const HEAD_LOOK_DIST  = 5.0;   // blocks: turn head to watch player within this range
  const HEAD_LOOK_CLAMP = 0.55;  // max yaw offset for head-look (rad, ~30°)
  const HEAD_LOOK_RATE  = 4.0;   // lerp speed for head-look
  const BREATHE_AMP     = 0.025; // idle breathing scale.y amplitude
  const BREATHE_SPEED   = 1.4;   // idle breathe cycles per second

  function syncMesh(mob, dt) {
    mob.group.position.set(mob.pos.x, mob.pos.y, mob.pos.z);
    mob.group.rotation.y = mob.yaw;

    const p     = mob.parts;
    const legs  = p.legs;
    const arms  = p.arms;   // may be empty []
    const model = mob.def.model;
    const speed = Math.hypot(mob.vel.x, mob.vel.z);
    const isMoving = mob.moving && speed > 0.2;

    if (isMoving) {
      // --- WALK animation ---------------------------------------------------
      // animT accumulates faster when moving quickly (speed-scaled)
      mob.animT += dt * (6.0 + speed * 0.8);
      const amp = Math.min(0.5, 0.25 + speed * 0.05); // 0.25–0.5 rad

      if (model === 'spider') {
        // Spider: 8 horizontal legs jitter in Z with alternating phase
        const sw = Math.sin(mob.animT) * 0.3;
        for (let i = 0; i < legs.length; i++) {
          if (legs[i].rotation) legs[i].rotation.z = sw * (i % 2 === 0 ? 1 : -1);
        }
      } else if (model === 'creeper') {
        // Creeper: gentle sway — opposite front/back pairs (like a stubby quadruped)
        const sw = Math.sin(mob.animT) * amp * 0.6;
        for (let i = 0; i < legs.length; i++) {
          if (legs[i].rotation) legs[i].rotation.x = sw * (i % 2 === 0 ? 1 : -1);
        }
      } else if (model === 'quadruped') {
        // Quadruped: legs[0,1] = front-left, front-right; legs[2,3] = back-left, back-right
        // Diagonal pairs (0,3) and (1,2) swing in opposition for trot-like motion
        const sw = Math.sin(mob.animT) * amp;
        for (let i = 0; i < legs.length; i++) {
          if (legs[i].rotation) {
            // diagonal pair: 0 & 3 together, 1 & 2 together, opposite sign
            const phase = (i === 0 || i === 3) ? 1 : -1;
            legs[i].rotation.x = sw * phase;
          }
        }
      } else if (model === 'chicken') {
        // Chicken: legs alternate; also give body a subtle vertical bob
        const sw = Math.sin(mob.animT) * amp * 0.8;
        for (let i = 0; i < legs.length; i++) {
          if (legs[i].rotation) legs[i].rotation.x = sw * (i % 2 === 0 ? 1 : -1);
        }
        // small body bob: move group up/down slightly
        if (p.body && p.body.position) {
          p.body.position.y = 0.4 + Math.sin(mob.animT * 2) * 0.025;
        }
      } else {
        // Humanoid (zombie, skeleton, NPCs, etc.): legs swing, arms swing opposite
        const sw = Math.sin(mob.animT) * amp;
        for (let i = 0; i < legs.length; i++) {
          if (legs[i].rotation) legs[i].rotation.x = sw * (i % 2 === 0 ? 1 : -1);
        }
        // arms swing opposite to corresponding leg (right arm ↔ left leg, etc.)
        for (let i = 0; i < arms.length; i++) {
          if (arms[i] && arms[i].rotation) {
            arms[i].rotation.x = sw * (i % 2 === 0 ? -1 : 1);
          }
        }
      }
    } else {
      // --- IDLE: reset limbs + gentle breathing ----------------------------
      mob.animT += dt * BREATHE_SPEED * Math.PI * 2;
      for (let i = 0; i < legs.length; i++) {
        if (!legs[i].rotation) continue;
        // gently return to rest position
        legs[i].rotation.x *= 0.85;
        // spider idle: also damp Z
        if (model === 'spider') legs[i].rotation.z *= 0.85;
      }
      for (let i = 0; i < arms.length; i++) {
        if (arms[i] && arms[i].rotation) arms[i].rotation.x *= 0.85;
      }
      // Idle body scale.y breathing (skip spider/creeper whose scale changes feel odd)
      if (p.body && p.body.scale && model !== 'spider') {
        const breath = 1.0 + Math.sin(mob.animT) * BREATHE_AMP;
        p.body.scale.y = breath;
      }
      // Chicken: reset body bob
      if (model === 'chicken' && p.body && p.body.position) {
        p.body.position.y += (0.4 - p.body.position.y) * 0.2;
      }
    }

    // --- HEAD-LOOK: turn head toward player when nearby ---------------------
    if (p.head && p.head.rotation) {
      const dx = player.pos.x - mob.pos.x;
      const dz = player.pos.z - mob.pos.z;
      const distToPlayer = Math.hypot(dx, dz);
      if (distToPlayer < HEAD_LOOK_DIST) {
        // world yaw toward player, then subtract mob's own yaw → local offset
        const targetYaw = Math.atan2(dx, dz) - mob.yaw;
        // wrap to [-π, π]
        let delta = ((targetYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (delta < -Math.PI) delta += Math.PI * 2;
        // clamp
        delta = Math.max(-HEAD_LOOK_CLAMP, Math.min(HEAD_LOOK_CLAMP, delta));
        // lerp current toward target
        const cur = p.head.rotation.y || 0;
        p.head.rotation.y = cur + (delta - cur) * Math.min(1, HEAD_LOOK_RATE * dt);
      } else {
        // fade back to neutral when player is far away
        if (p.head.rotation.y) {
          p.head.rotation.y *= Math.max(0, 1 - HEAD_LOOK_RATE * dt);
        }
      }
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
      // despawn if far from player — but persistent (spawnAt) mobs never cull
      if (!mob.persistent) {
        const ddx = mob.pos.x - player.pos.x, ddz = mob.pos.z - player.pos.z;
        if (Math.hypot(ddx, ddz) > DESPAWN_DIST) removeMob(mob, null);
        // fell out of world
        else if (mob.pos.y < player.pos.y - 64) removeMob(mob, null);
      }
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
    spawnAt,
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
