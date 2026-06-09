// landmark.js — voxel recreation of "プチヘルメース" (Petit Hermès),
// a bakery inside a renovated old 2-story Japanese elementary school
// (北広島町立南方小学校). Self-contained ES module, stamped into a host world.
//
// Coordinate frame (LOCAL): origin (0,0,0) = south-west corner at GROUND level.
//   +x = building length (east), +z = toward the front yard / viewer, +y = up.
//   y=0 is the solid ground/platform layer; structures sit at y>=1.
// stamp(x, y, z, id) places a block; the host clamps out-of-range writes.
//
// World mapping: world = (LM_X+x, LM_Y+y, LM_Z+z)
//   where LM_X=-36, LM_Y=29, LM_Z=-50.
//   Baker NPC stands at world (11,31,-32) = local (47,2,18) — behind the west counter,
//   beside the 2-wide customer walk-in (x49..50) so the entrance stays open.
//   Barista NPC stands at world (-19,31,-39) = local (17,2,11) — inside the cafe.
//   Player spawns at world (8.5,31,-12) = local (44.5,2,38) facing -z (toward building).
//   Front facade plane: local z=26 = world z=-24.
//
// FLOOR PLAN:
//   Building footprint: local x4..83, z2..26 (80 wide × 25 deep).
//   Facade (front wall) at z=26. Back wall at z=2.
//   CORRIDOR (廊下): z21..25 (4 deep), full width x5..82.
//   ROOM zone: z3..19 (17 deep). Divider walls at x=11,22,33,44,57,68,79.
//   BAY breakdown:
//     West stair tower:  x5..10
//     CAFE "South in North" (GF):  x12..21  ← 旧教室をカフェに改装
//     理科室 (science room) (GF):  x23..32  ← lab benches, sinks, stools
//     Classroom 3 (GF):  x34..43
//     BAKERY:            x45..56
//     Classroom 4 (GF):  x58..67
//     図書室 (library) (GF):  x69..78  ← bookshelves, reading tables
//     East stair tower:  x80..82
//
//   FLOOR 2:
//     2F Classroom 1:    x12..21
//     音楽室 (music room) (2F): x23..32  ← piano, music stands, chairs
//     2F Classroom 3:    x34..43
//     2F Classroom 4:    x45..56  (above bakery)
//     2F Classroom 5:    x58..67
//     2F Classroom 6:    x69..78
//
//   VERTICAL:
//     y=0  foundation (SANDSTONE)
//     y=1  floor-1 plank
//     y2..7  floor-1 interior (6 blocks tall)
//     y=8  floor-2 deck (SANDSTONE)
//     y9..14 floor-2 interior (6 blocks tall)
//     y=15 roof slab (SMOOTH_STONE)
//     y=16 parapet

export const LANDMARK = { w: 88, d: 80, clearH: 40 };

export function buildPetitHermes(stamp, B) {
  const { w, d, clearH } = LANDMARK;
  const cx = Math.floor(w / 2); // = 44, entrance centered here → world x8

  // ── small helpers ──────────────────────────────────────────────────────────
  const fillBox = (x0, y0, z0, x1, y1, z1, id) => {
    const [ax, bx] = x0 <= x1 ? [x0, x1] : [x1, x0];
    const [ay, by] = y0 <= y1 ? [y0, y1] : [y1, y0];
    const [az, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
    for (let x = ax; x <= bx; x++)
      for (let y = ay; y <= by; y++)
        for (let z = az; z <= bz; z++) stamp(x, y, z, id);
  };

  // hollow rectangular wall ring (4 vertical walls, no top/bottom)
  const wallRing = (x0, z0, x1, y0, y1, z1, id) => {
    fillBox(x0, y0, z0, x1, y1, z0, id); // back wall (low z)
    fillBox(x0, y0, z1, x1, y1, z1, id); // front wall (high z)
    fillBox(x0, y0, z0, x0, y1, z1, id); // west wall
    fillBox(x1, y0, z0, x1, y1, z1, id); // east wall
  };

  // ==========================================================================
  // 1) SITE PREP — clear ONLY the building footprint volume + lay foundation.
  //    World y=29 is already flat (valley scenery). Air-clear only the
  //    building volume to avoid bloating the stamp cache.
  // ==========================================================================
  // Building footprint local x4..83, z2..26
  const bx0 = 4, bx1 = 83;  // footprint x extents (80 blocks wide)
  const bz0 = 2, bz1 = 26;  // footprint z extents (facade at z=26)

  // Clear air over the building volume
  for (let x = bx0; x <= bx1; x++)
    for (let z = bz0; z <= bz1; z++)
      for (let y = 1; y <= clearH; y++) stamp(x, y, z, B.AIR);

  // Foundation layer (SANDSTONE slab at y=0 under the building)
  fillBox(bx0, 0, bz0, bx1, 0, bz1, B.SANDSTONE);

  // ==========================================================================
  // 2) BUILDING SHELL — two full floors.
  //    Floor-1: y1 plank, y2..7 interior, y8 deck.
  //    Floor-2: y9..14 interior, y15 roof slab, y16 parapet.
  // ==========================================================================
  const f1   = 1;   // floor-1 plank level
  const f1Hi = 7;   // floor-1 ceiling (top of interior air = y7; wall reaches y7)
  const deck = 8;   // floor-2 deck (SANDSTONE; also floor-2 plank base)
  const f2Hi = 14;  // floor-2 ceiling
  const roof = 15;  // roof slab
  const ppt  = 16;  // parapet top

  // Floor-1 plank deck
  fillBox(bx0, f1, bz0, bx1, f1, bz1, B.OAK_PLANKS);
  // Floor-2 deck (SANDSTONE structural slab) + OAK_PLANKS overlay
  fillBox(bx0, deck, bz0, bx1, deck, bz1, B.SANDSTONE);
  fillBox(bx0, deck, bz0, bx1, deck, bz1, B.OAK_PLANKS);
  // Roof slab
  fillBox(bx0, roof, bz0, bx1, roof, bz1, B.SMOOTH_STONE);
  // Parapet
  wallRing(bx0, bz0, bx1, ppt, ppt, bz1, B.SMOOTH_STONE);

  // Perimeter walls — floor-1: y2..f1Hi (y2..7), floor-2: y9..f2Hi (y9..14)
  wallRing(bx0, bz0, bx1, 2, f1Hi, bz1, B.SANDSTONE);       // floor-1 shell
  wallRing(bx0, bz0, bx1, deck + 1, f2Hi, bz1, B.SANDSTONE); // floor-2 shell

  // ==========================================================================
  // 3) WINDOW BANDS — long horizontal GLASS bands on front + back + ends.
  //    Pattern: 2 glass, 1 mullion, repeat. Applied after shell, before rooms.
  // ==========================================================================
  const windowBand = (yLo, yHi, zWall, xLo, xHi, paneId) => {
    for (let x = xLo; x <= xHi; x++) {
      if (((x - xLo) % 3) !== 2) fillBox(x, yLo, zWall, x, yHi, zWall, paneId);
    }
  };
  // S2: real schoolhouse SASH_WINDOW (white-mullion panes) on the 2F bands and
  // the end walls; the GROUND-FLOOR facade + back keep plain GLASS so the shop
  // window display stays bright and readable from the yard.
  const SASH = (B.SASH_WINDOW != null ? B.SASH_WINDOW : B.GLASS);
  // Floor-1 front (z=26) and back (z=2): y3..6 (mid-band, keep y2+y7 solid)
  windowBand(3, 6, bz1, bx0 + 2, bx1 - 2, B.GLASS); // front
  windowBand(3, 6, bz0, bx0 + 2, bx1 - 2, B.GLASS); // back
  // Floor-2 front and back: y10..13 — sash windows (renovated old school look)
  windowBand(deck + 2, f2Hi - 1, bz1, bx0 + 2, bx1 - 2, SASH); // front
  windowBand(deck + 2, f2Hi - 1, bz0, bx0 + 2, bx1 - 2, SASH); // back
  // End walls (west x=4, east x=83) — both floors, sash windows
  for (let z = bz0 + 2; z <= bz1 - 2; z++) {
    if (((z - (bz0 + 2)) % 3) !== 2) {
      fillBox(bx0, 3, z, bx0, 6, z, SASH);
      fillBox(bx1, 3, z, bx1, 6, z, SASH);
      fillBox(bx0, deck + 2, z, bx0, f2Hi - 1, z, SASH);
      fillBox(bx1, deck + 2, z, bx1, f2Hi - 1, z, SASH);
    }
  }

  // ==========================================================================
  // 4) ENTRANCE — centered on cx=44, in facade wall z=26.
  //    2-wide × 3-tall walk-in opening (y2..4, x43..44).
  //    CALCITE pillars + lintel, teal pilasters, 暖簾, bread emblems, name plate.
  //    Facade entrance → world x8, world z=-24.
  // ==========================================================================
  const dz = bz1; // facade z=26

  // CALCITE pillars flanking the entrance (x42 and x47)
  fillBox(cx - 2, f1, dz, cx - 2, f1Hi, dz, B.CALCITE); // west pillar
  fillBox(cx + 2, f1, dz, cx + 2, f1Hi, dz, B.CALCITE); // east pillar
  fillBox(cx - 2, f1, dz + 1, cx - 2, f1Hi, dz + 1, B.CALCITE); // project out
  fillBox(cx + 2, f1, dz + 1, cx + 2, f1Hi, dz + 1, B.CALCITE);
  // Lintel across top
  fillBox(cx - 2, f1Hi, dz, cx + 2, f1Hi, dz, B.SMOOTH_STONE);
  fillBox(cx - 2, f1Hi, dz + 1, cx + 2, f1Hi, dz + 1, B.SMOOTH_STONE);
  // Doorway opening: x43..44, y2..4 (walk-in height 3), z26
  fillBox(cx - 1, 2, dz, cx, 4, dz, B.AIR);
  // Also clear the corridor behind the entrance z21..25 at the entrance column
  fillBox(cx - 1, 2, 21, cx, 4, dz, B.AIR);

  // Shopfront: name plate band above door
  fillBox(cx - 2, f1Hi - 1, dz, cx + 2, f1Hi - 1, dz, B.STONE_BRICKS);
  fillBox(cx - 1, f1Hi - 1, dz, cx + 1, f1Hi - 1, dz, B.CALCITE); // crest disc
  // Teal/white pilasters flanking the entrance (striped)
  for (let y = 3; y <= f1Hi - 1; y++) {
    const stripe = (y % 2 === 0) ? B.BLUE_WOOL : B.WHITE_WOOL;
    stamp(cx - 3, y, dz, stripe);
    stamp(cx + 3, y, dz, stripe);
  }
  // HAY bread emblems at base of pilasters
  stamp(cx - 3, 2, dz, B.HAY);
  stamp(cx + 3, 2, dz, B.HAY);
  // BLUE_WOOL 暖簾 in the top of the doorway
  stamp(cx - 1, 5, dz, B.BLUE_WOOL);
  stamp(cx,     5, dz, B.BLUE_WOOL);

  // ── STOREFRONT IDENTITY: shop-name sign, OPEN sign, window display, A-frame ──
  // Petit Hermès brand sign on the name plate (centre, above the door).
  if (B.SHOP_SIGN != null) stamp(cx, f1Hi - 1, dz, B.SHOP_SIGN);
  // 営業中 OPEN sign at eye height on the east pillar face, toward the yard.
  if (B.OPEN_SIGN != null) stamp(cx + 2, 3, dz + 1, B.OPEN_SIGN);
  // WINDOW DISPLAY: a shallow bread shelf at z25, just behind the facade glass
  // (z26, y3..6), flanking the doorway — varied loaves seen from the schoolyard.
  {
    const sd = (id) => (id != null ? id : B.BREAD); // fall back to BREAD if undefined
    fillBox(cx - 4, 2, dz - 1, cx - 2, 2, dz - 1, B.SPRUCE_PLANKS); // west ledge x40..42
    fillBox(cx + 2, 2, dz - 1, cx + 4, 2, dz - 1, B.SPRUCE_PLANKS); // east ledge x46..48
    stamp(cx - 4, 3, dz - 1, sd(B.BAGUETTE)); stamp(cx - 3, 3, dz - 1, sd(B.CAMPAGNE)); stamp(cx - 2, 3, dz - 1, sd(B.PASTRY));
    stamp(cx + 2, 3, dz - 1, sd(B.CAMPAGNE)); stamp(cx + 3, 3, dz - 1, sd(B.BAGUETTE)); stamp(cx + 4, 3, dz - 1, sd(B.PASTRY));
  }

  // Brick stoop (steps widening into yard)
  fillBox(cx - 2, f1, dz + 1, cx + 1, f1, dz + 2, B.BRICK); // landing
  for (let s = 1; s <= 3; s++) {
    fillBox(cx - 1 - s, f1, dz + 2 + s, cx + s, f1, dz + 2 + s, B.BRICK);
  }
  // A-frame sidewalk chalkboard beside the entrance (west, off the walk path).
  if (B.AFRAME != null) stamp(cx - 3, 2, dz + 2, B.AFRAME);

  // ==========================================================================
  // 5) CORRIDOR (廊下) — GROUND FLOOR, z21..25, full width x5..82.
  //    Floor: OAK_PLANKS at y1. Interior air y2..7.
  //    Back wall (corridor-room interface) at z20: SANDSTONE, full height y2..7.
  //    Facade glass window band already set. Corridor ceiling = floor-2 deck (y8).
  // ==========================================================================
  // Corridor interior: x5..82, z21..25, y2..7 — already cleared by site prep
  // Lay OAK_PLANKS floor on corridor (y=1 already done by floor-1 plank fill above)

  // Corridor COIR mat just inside entrance
  fillBox(cx - 1, f1, 23, cx, f1, 25, B.DRY_GRASS);

  // ==========================================================================
  // 6) GROUND FLOOR INTERIORS — hollow THEN walls (FIX A: hollow first so
  //    dividers placed afterwards survive).
  //    Order mirrors the correct 2F sequence: hollow → dividers → corridor
  //    back wall → doorways.  Previously the dividers were stamped BEFORE the
  //    hollow, so the hollow erased them across z3..19.
  // ==========================================================================
  // Step 6-a: Hollow out all bays (room zone z3..19 y2..7)
  fillBox(5, 2, 3, 82, f1Hi, 19, B.AIR);

  // Step 6-b: BAY DIVIDER WALLS — SANDSTONE, full room depth z2..19, y2..f1Hi.
  //    Positions: x11, x22, x33, x44, x57, x68, x79.
  //    Placed AFTER hollow so they are not erased.
  for (const divX of [11, 22, 33, 44, 57, 68, 79]) {
    fillBox(divX, 2, 2, divX, f1Hi, 19, B.SANDSTONE);
  }

  // Step 6-c: Corridor back wall at z=20, full width x5..82, y2..f1Hi.
  fillBox(5, 2, 20, 82, f1Hi, 20, B.SANDSTONE); // corridor back wall, full width

  // Step 6-c2 (S2): PLASTER re-skin — the renovated corridor wall is warm white
  // 漆喰 (#F5EDE4), not raw sandstone. Painted over the full wall BEFORE the
  // doorways are carved in step 6-d, so every doorway stays open.
  if (B.PLASTER != null) fillBox(5, 2, 20, 82, f1Hi, 20, B.PLASTER);

  // Step 6-d: Doorways per bay through the corridor back wall (z=20): 2-wide × 4-tall (y2..5)
  // West stair bay — single opening
  fillBox(6, 2, 20, 9, 5, 20, B.AIR); // west stair bay doorway
  // Classrooms 1-5 and Bakery
  for (const [bayX0, bayX1] of [[12,21],[23,32],[34,43],[45,56],[58,67],[69,78]]) {
    const doorCx = Math.floor((bayX0 + bayX1) / 2);
    fillBox(doorCx - 1, 2, 20, doorCx, 5, 20, B.AIR);
  }
  // East stair bay doorway
  fillBox(80, 2, 20, 82, 5, 20, B.AIR);

  // ==========================================================================
  // 7) GROUND FLOOR ROOM FURNISHINGS — individual bay fit-outs.
  // ==========================================================================

  // ── Classroom helper (ground floor) ────────────────────────────────────────
  const classroom_gf = (rx0, rx1) => {
    const rw = rx1 - rx0 + 1;
    const bbW = Math.min(rw - 2, 9); // blackboard width
    const bbX0 = rx0 + 1;
    const bbX1 = Math.min(rx1 - 1, bbX0 + bbW - 1);
    // Blackboard on back wall z=2, y3..6 — real 緑黒板 (green board + chalk rail)
    fillBox(bbX0, 3, 2, bbX1, 6, 2, (B.GREEN_BOARD != null ? B.GREEN_BOARD : B.BLACK_WOOL));
    // Teacher desk (CRAFTING_TABLE) + chair (SPRUCE_PLANKS) at z=3..4
    const tDx = Math.floor((rx0 + rx1) / 2) - 1;
    stamp(tDx,     2, 3, B.CRAFTING_TABLE);
    stamp(tDx + 1, 2, 3, B.CRAFTING_TABLE);
    stamp(tDx,     2, 4, B.SPRUCE_PLANKS); // chair
    stamp(tDx + 1, 2, 4, B.SPRUCE_PLANKS);
    // Student desk grid: 3 cols × 4 rows
    // cols: spread across bay width, rows at z=7,10,13,16
    const cols3 = [
      rx0 + Math.floor(rw * 0.2),
      rx0 + Math.floor(rw * 0.5),
      rx0 + Math.floor(rw * 0.8),
    ];
    for (const dz2 of [7, 10, 13, 16]) {
      for (const dx of cols3) {
        stamp(dx, 2, dz2, B.SPRUCE_PLANKS);      // desk
        stamp(dx, 2, dz2 + 1, B.BIRCH_PLANKS);  // chair behind desk (+z toward corridor)
      }
    }
    // (Back wall windows at z=2 are handled by the building-level windowBand;
    //  the blackboard already fills y=3..6 at z=2 for the blackboard area,
    //  and side wall windows on z>2 provide natural light from the sides.)
  };

  // ==========================================================================
  // 7b) CAFE "South in North" — x12..21, z3..19 (旧Classroom 1の改装).
  //     Same校舎 inner room, converted from classroom to a cozy cafe.
  //     Serves coffee, curry, and local-vegetable dishes.
  //     Counter along z=19 (corridor-facing). Chalkboard menu on back wall z=2.
  //     Tables/chairs mid-room; lanterns for warmth; potted plants; teal accent.
  //     Barista NPC at local (17,2,11) = world (-19,31,-39).
  // ==========================================================================
  const cfX0 = 12, cfX1 = 21; // cafe bay x extents
  const cfCounterZ = 19;       // counter faces the corridor

  // TEAL accent wall on west (inner corridor side): paint the corridor-face at z=20
  // Actually: paint the back wall z=2 with teal accent (BLUE_WOOL) + chalkboard menu
  fillBox(cfX0, 2, 2, cfX1, f1Hi, 2, B.BLUE_WOOL);
  // CHALKBOARD MENU (BLACK_WOOL) on back wall z=2, mid-height — "COFFEE" board
  fillBox(cfX0 + 1, 3, 2, cfX1 - 1, 6, 2, B.BLACK_WOOL);

  // SERVING COUNTER along z=19 — ONE block tall (top y2), like the bakery: you
  // step in and face it, looking DOWN onto the cups/coffee at eye level.
  fillBox(cfX0 + 1, 2, cfCounterZ, cfX1 - 1, 2, cfCounterZ, B.SPRUCE_PLANKS);
  // Cafe items ON the counter (y2): cups, coffee-bean jar, register, mug, pastry.
  stamp(cfX0 + 1, 2, cfCounterZ, B.CALCITE);                         // x13: cups/saucers
  if (B.JAR != null) stamp(cfX0 + 3, 2, cfCounterZ, B.JAR);          // x15: coffee-bean jar
  if (B.REGISTER != null) stamp(cfX0 + 5, 2, cfCounterZ, B.REGISTER); // x17: register
  stamp(cfX0 + 7, 2, cfCounterZ, B.HAY);                             // x19: warm mug
  if (B.PASTRY != null) stamp(cfX1 - 1, 2, cfCounterZ, B.PASTRY);    // x20: croissant
  // Barista stands just BEHIND the counter at local (17,2,18) — 対面 service.

  // TEAL side accent strip on west wall x=12, z3..19 (thin pillar/wainscot)
  for (let az = 3; az <= 19; az += 2) stamp(cfX0, 3, az, B.BLUE_WOOL);

  // CAFE TABLES (small 1×1 SPRUCE_PLANKS tops) + BIRCH_PLANKS chairs around them
  // Table cluster 1: around z=7
  stamp(cfX0 + 2, 2, 7,  B.SPRUCE_PLANKS); // table
  stamp(cfX0 + 4, 2, 7,  B.SPRUCE_PLANKS); // table
  stamp(cfX0 + 2, 2, 8,  B.BIRCH_PLANKS);  // chair (south)
  stamp(cfX0 + 2, 2, 6,  B.BIRCH_PLANKS);  // chair (north)
  stamp(cfX0 + 4, 2, 8,  B.BIRCH_PLANKS);
  stamp(cfX0 + 4, 2, 6,  B.BIRCH_PLANKS);
  // Table cluster 2: around z=13
  stamp(cfX0 + 2, 2, 13, B.SPRUCE_PLANKS);
  stamp(cfX0 + 5, 2, 13, B.SPRUCE_PLANKS);
  stamp(cfX0 + 2, 2, 14, B.BIRCH_PLANKS);
  stamp(cfX0 + 2, 2, 12, B.BIRCH_PLANKS);
  stamp(cfX0 + 5, 2, 14, B.BIRCH_PLANKS);
  stamp(cfX0 + 5, 2, 12, B.BIRCH_PLANKS);

  // POTTED PLANTS (OAK_LEAVES pots) in two corners for warmth
  stamp(cfX0 + 1, 2, 3, B.OAK_LEAVES); // back-west corner
  stamp(cfX1 - 1, 2, 3, B.OAK_LEAVES); // back-east corner
  stamp(cfX0 + 1, 3, 3, B.GREEN_WOOL); // second leaf layer
  stamp(cfX1 - 1, 3, 3, B.GREEN_WOOL);

  // LANTERNS over the cafe (warm amber, just below ceiling y=f1Hi-1=6)
  if (B.LANTERN != null) {
    stamp(cfX0 + 2, f1Hi - 1, 7,  B.LANTERN); // above table cluster 1
    stamp(cfX0 + 2, f1Hi - 1, 13, B.LANTERN); // above table cluster 2
    stamp(cfX0 + 4, f1Hi - 1, 18, B.LANTERN); // near counter
  }

  // ==========================================================================
  // 7c) 理科室 (science room) — GF x23..32 (replaces generic Classroom 2).
  //     Lab benches (CRAFTING_TABLE rows) + sinks (CALCITE basin + WATER) +
  //     round stools (BIRCH_PLANKS) + periodic-table blackboard on z=2.
  // ==========================================================================
  const scX0 = 23, scX1 = 32; // science room bay x extents
  // Blackboard (periodic table / 理科) on back wall z=2, y3..6 — 緑黒板
  fillBox(scX0 + 1, 3, 2, scX1 - 1, 6, 2, (B.GREEN_BOARD != null ? B.GREEN_BOARD : B.BLACK_WOOL));
  // Teacher demo bench (CRAFTING_TABLE pair) at z=3
  const scMid = Math.floor((scX0 + scX1) / 2);
  stamp(scMid - 1, 2, 3, B.CRAFTING_TABLE);
  stamp(scMid,     2, 3, B.CRAFTING_TABLE);
  stamp(scMid - 1, 2, 4, B.SPRUCE_PLANKS); // teacher stool
  stamp(scMid,     2, 4, B.SPRUCE_PLANKS);
  // Lab bench rows: 2 rows of CRAFTING_TABLE pairs at z=7 and z=12
  // Row 1 (z=7): two benches across the bay
  stamp(scX0 + 1, 2, 7,  B.CRAFTING_TABLE);
  stamp(scX0 + 2, 2, 7,  B.CRAFTING_TABLE);
  stamp(scX0 + 5, 2, 7,  B.CRAFTING_TABLE);
  stamp(scX0 + 6, 2, 7,  B.CRAFTING_TABLE);
  // Stools behind each bench (z=8), BIRCH_PLANKS
  stamp(scX0 + 1, 2, 8,  B.BIRCH_PLANKS);
  stamp(scX0 + 2, 2, 8,  B.BIRCH_PLANKS);
  stamp(scX0 + 5, 2, 8,  B.BIRCH_PLANKS);
  stamp(scX0 + 6, 2, 8,  B.BIRCH_PLANKS);
  // Row 2 (z=12): same layout
  stamp(scX0 + 1, 2, 12, B.CRAFTING_TABLE);
  stamp(scX0 + 2, 2, 12, B.CRAFTING_TABLE);
  stamp(scX0 + 5, 2, 12, B.CRAFTING_TABLE);
  stamp(scX0 + 6, 2, 12, B.CRAFTING_TABLE);
  stamp(scX0 + 1, 2, 13, B.BIRCH_PLANKS);
  stamp(scX0 + 2, 2, 13, B.BIRCH_PLANKS);
  stamp(scX0 + 5, 2, 13, B.BIRCH_PLANKS);
  stamp(scX0 + 6, 2, 13, B.BIRCH_PLANKS);
  // Sinks: CALCITE basin + WATER block at z=16..17 on east wall x=31
  stamp(scX1 - 1, 2, 16, B.CALCITE); // sink basin
  stamp(scX1 - 1, 2, 17, B.WATER);   // water in sink
  stamp(scX1 - 2, 2, 16, B.CALCITE); // second basin
  stamp(scX1 - 2, 2, 17, B.WATER);
  // Round stools by sinks (BIRCH_PLANKS)
  stamp(scX1 - 1, 2, 15, B.BIRCH_PLANKS);
  stamp(scX1 - 2, 2, 15, B.BIRCH_PLANKS);
  // Storage shelves (SPRUCE_PLANKS) on west wall x=23
  fillBox(scX0, 3, 8, scX0, 5, 11, B.SPRUCE_PLANKS);
  // LANTERNS for lab lighting
  if (B.LANTERN != null) {
    stamp(scX0 + 3, f1Hi - 1, 7,  B.LANTERN);
    stamp(scX0 + 3, f1Hi - 1, 14, B.LANTERN);
  }

  // Generic GF classrooms (Classroom 4 remains standard)
  // Classroom 2 (23-32) replaced by 理科室 above
  // Classroom 3 (34-43) replaced by コミュニティー広場 below (S2)
  classroom_gf(58, 67);  // Classroom 4 (GF)

  // ==========================================================================
  // 7c2) コミュニティー広場 (community plaza) — GF x34..43, beside the 昇降口.
  //      The real story: 広島工業大学の学生×北広島町産木材で作られた机と椅子が
  //      並ぶ、地域の人が集まる元教室。Bright SCHOOL_FLOOR, a GREEN_BOARD
  //      welcome wall, school-desk clusters, a long bench, a NOTICE_BOARD
  //      photo gallery and a reading-corner bookshelf.
  // ==========================================================================
  {
    const pzX0 = 34, pzX1 = 43;
    // Bright school-wood floor across the whole room
    fillBox(pzX0, 1, 3, pzX1, 1, 19, B.SCHOOL_FLOOR);
    // Welcome wall: GREEN_BOARD on z=2 (「ようこそ 旧南方小学校へ」)
    fillBox(pzX0 + 1, 3, 2, pzX1 - 1, 6, 2, (B.GREEN_BOARD != null ? B.GREEN_BOARD : B.BLACK_WOOL));
    // 町産木材 school-desk clusters (2 desks + 2 chairs each) ×4
    for (const [dcx, dcz] of [[36, 7], [40, 7], [36, 12], [40, 12]]) {
      stamp(dcx,     2, dcz,     B.SCHOOL_DESK);
      stamp(dcx + 1, 2, dcz,     B.SCHOOL_DESK);
      stamp(dcx,     2, dcz + 1, B.SCHOOL_CHAIR);
      stamp(dcx + 1, 2, dcz + 1, B.SCHOOL_CHAIR);
    }
    // Long community bench facing the corridor
    fillBox(36, 2, 16, 41, 2, 16, B.SPRUCE_PLANKS);
    // NOTICE_BOARD photo/history gallery on the east wall (x=43, beside divider x44)
    for (let nz = 6; nz <= 14; nz += 3) {
      stamp(pzX1, 3, nz, B.NOTICE_BOARD);
      stamp(pzX1, 4, nz, B.NOTICE_BOARD);
    }
    // Reading-corner bookshelf in the back-west corner
    fillBox(35, 2, 3, 35, 4, 4, B.BOOKSHELF);
  }

  // ==========================================================================
  // 7d) 図書室 (library) — GF x69..78 (replaces generic Classroom 5).
  //     Bookshelves along walls + reading tables + LANTERN reading lamps.
  //     Bookshelves = SPRUCE_PLANKS shelf base with BLUE/GREEN/BLACK_WOOL "books".
  // ==========================================================================
  const lbX0 = 69, lbX1 = 78; // library bay x extents
  // No blackboard — whiteboard (WHITE_WOOL) on back wall z=2 instead
  fillBox(lbX0 + 1, 3, 2, lbX1 - 1, 5, 2, B.WHITE_WOOL);
  // Title banner in WHITE_WOOL above: use BLACK_WOOL "books" band at y=6 for contrast
  fillBox(lbX0 + 1, 6, 2, lbX1 - 1, 6, 2, B.BLACK_WOOL);
  // BOOKSHELVES on west wall (x=69): alternating book-colour rows, z4..18, y3..5
  for (let bz2 = 4; bz2 <= 18; bz2++) {
    const bookCol = (((bz2 - 4) % 3) === 0) ? B.BLUE_WOOL
                  : (((bz2 - 4) % 3) === 1) ? B.GREEN_WOOL
                  : B.BLACK_WOOL;
    stamp(lbX0, 3, bz2, B.SPRUCE_PLANKS); // shelf plank
    stamp(lbX0, 4, bz2, bookCol);          // book colour band
    stamp(lbX0, 5, bz2, B.SPRUCE_PLANKS); // upper shelf
  }
  // BOOKSHELVES on east wall (x=78): same pattern but shifted
  for (let bz2 = 4; bz2 <= 18; bz2++) {
    const bookCol = (((bz2 - 4) % 3) === 2) ? B.BLUE_WOOL
                  : (((bz2 - 4) % 3) === 0) ? B.GREEN_WOOL
                  : B.BLACK_WOOL;
    stamp(lbX1, 3, bz2, B.SPRUCE_PLANKS);
    stamp(lbX1, 4, bz2, bookCol);
    stamp(lbX1, 5, bz2, B.SPRUCE_PLANKS);
  }
  // Reading tables (SPRUCE_PLANKS) with chairs (BIRCH_PLANKS)
  // Table 1: z=7..8 mid-bay
  const lbMid = Math.floor((lbX0 + lbX1) / 2);
  stamp(lbMid - 1, 2, 7,  B.SPRUCE_PLANKS);
  stamp(lbMid,     2, 7,  B.SPRUCE_PLANKS);
  stamp(lbMid - 1, 2, 8,  B.BIRCH_PLANKS); // chair south side
  stamp(lbMid,     2, 8,  B.BIRCH_PLANKS);
  stamp(lbMid - 1, 2, 6,  B.BIRCH_PLANKS); // chair north side
  stamp(lbMid,     2, 6,  B.BIRCH_PLANKS);
  // Table 2: z=13..14
  stamp(lbMid - 1, 2, 13, B.SPRUCE_PLANKS);
  stamp(lbMid,     2, 13, B.SPRUCE_PLANKS);
  stamp(lbMid - 1, 2, 14, B.BIRCH_PLANKS);
  stamp(lbMid,     2, 14, B.BIRCH_PLANKS);
  stamp(lbMid - 1, 2, 12, B.BIRCH_PLANKS);
  stamp(lbMid,     2, 12, B.BIRCH_PLANKS);
  // LANTERN reading lamps over each table
  if (B.LANTERN != null) {
    stamp(lbMid - 1, f1Hi - 1, 7,  B.LANTERN);
    stamp(lbMid - 1, f1Hi - 1, 13, B.LANTERN);
    // Cozy corner lamp near entry
    stamp(lbX0 + 1, f1Hi - 1, 17, B.LANTERN);
  }

  // ==========================================================================
  // 8) BAKERY (パン屋) — プチヘルメース, a 天然酵母 boulangerie in a renovated
  //    old school. Ground floor, x45..56, z3..19. Customer-first layout:
  //      z15..19  = SPACIOUS browsing floor (the shop you walk into).
  //      z=14     = low service counter (1 block, top y2) with レジ/はかり/瓶,
  //                 staff gap at x52 so the baker can step out.
  //      z=13     = baker stands BEHIND the counter → world (14,31,-37).
  //      x45/x46, z15..19 = WEST glass display case packed with BREAD; above it
  //                 a 天然酵母 jar shelf (GLASS/JAR + teal lids) at y4..6.
  //      x55/x56, z15..19 = EAST glass display case + upper BREAD shelf.
  //      x50..51, z=17    = hero カンパーニュ pedestal island (CALCITE + BREAD).
  //      z=11 partition   = BLACK_WOOL chalkboard MENU (west) + teal brand band
  //                 with a CALCITE frame & BREAD emblem (east) — looks like PH.
  //      Warm CALCITE-shade LANTERN pendants over the floor + counter.
  //      OAK_LEAVES potted plants flank the entrance (z=19).
  //    Palette: teal BLUE_WOOL + cream CALCITE + warm SPRUCE.  HAY ONLY in the
  //    workshop (flour sacks); the sales zone uses the BREAD block throughout.
  // ==========================================================================
  const bkX0 = 45, bkX1 = 56;            // bakery bay x extents (x45/x56 = wall display faces)
  const bkPartZ = 11;                    // partition wall between sales and workshop
  const counterZ = 14;                   // service counter pushed DEEP, leaving z15..19 a
                                         // SPACIOUS customer browsing floor (the shop)
  const bakerZ   = 13;                   // baker stands BEHIND the counter
  // Distinct bakery products for the cases; fall back to plain BREAD if the host
  // palette doesn't define them (keeps the headless landmark test compatible).
  const DISP = (id) => (id != null ? id : B.BREAD);

  // ── A) PARTITION WALL (STONE_BRICKS base + teal BLUE_WOOL sales face) ──────
  fillBox(bkX0, 2, bkPartZ, bkX1, f1Hi, bkPartZ, B.STONE_BRICKS);
  fillBox(50, 2, bkPartZ, 51, 4, bkPartZ, B.AIR);              // workshop passage
  fillBox(bkX0, 2, bkPartZ, bkX1, f1Hi, bkPartZ, B.BLUE_WOOL); // teal sales face
  fillBox(50, 2, bkPartZ, 51, 4, bkPartZ, B.AIR);              // re-open passage

  // ── B) CHALKBOARD MENU + Petit Hermès brand band on the partition (z=11) ───
  // Chalkboard west of the passage (x46..49, y3..5) under a WHITE_WOOL header.
  fillBox(bkX0 + 1, 3, bkPartZ, 49, 5, bkPartZ, B.BLACK_WOOL);
  fillBox(bkX0 + 1, 6, bkPartZ, 49, 6, bkPartZ, B.WHITE_WOOL);
  stamp(46, 4, bkPartZ, B.CALCITE); stamp(48, 4, bkPartZ, B.CALCITE); // price-tag accents
  // Brand band EAST of the passage (x52..55): teal banner + CALCITE marble frame
  // + a centred BREAD emblem — "this is プチヘルメース".
  fillBox(52, 5, bkPartZ, 55, 5, bkPartZ, B.BLUE_WOOL);
  fillBox(52, 6, bkPartZ, 55, 6, bkPartZ, B.CALCITE);
  stamp(53, 5, bkPartZ, B.BREAD); stamp(54, 5, bkPartZ, B.BREAD); // loaf emblem

  // ── C) SERVICE COUNTER at z=14, ONE block tall (top y2), staff gap at x52 ──
  // Customers stand on the open z15..19 floor and look DOWN onto the counter.
  fillBox(bkX0 + 1, 2, counterZ, bkX1 - 1, 2, counterZ, B.SPRUCE_PLANKS);
  stamp(47, 2, counterZ, B.BREAD);
  if (B.SCALE != null)    stamp(48, 2, counterZ, B.SCALE);    // はかり
  if (B.REGISTER != null) stamp(49, 2, counterZ, B.REGISTER); // レジ — pay point, dead ahead
  if (B.JAR != null)      stamp(50, 2, counterZ, B.JAR);      // 保存瓶
  stamp(51, 2, counterZ, DISP(B.CAMPAGNE));  // 看板 campagne
  stamp(53, 2, counterZ, DISP(B.BAGUETTE));  // baguette
  stamp(55, 2, counterZ, DISP(B.PASTRY));    // croissant
  fillBox(52, 2, counterZ, 52, 5, counterZ, B.AIR);           // staff gap (baker steps out)

  // ── D) WEST display case (x45 back / x46 glass front), varied breads ───────
  fillBox(bkX0, 2, 15, bkX0, 3, 19, B.SPRUCE_PLANKS);  // case back/base on x45
  fillBox(46, 2, 15, 46, 3, 19, B.GLASS);              // glass front toward the floor
  const WEST = [B.BAGUETTE, B.CAMPAGNE, B.PASTRY, B.BAGUETTE, B.CAMPAGNE];
  for (let z = 15; z <= 19; z++) stamp(bkX0, 2, z, DISP(WEST[z - 15])); // loaves behind glass
  fillBox(bkX0, 3, 15, bkX0, 3, 19, B.CALCITE);        // marble case top
  stamp(bkX0, 2, 16, B.CALCITE); stamp(bkX0, 2, 18, B.CALCITE); // price-tag accents

  // ── E) EAST display case (x56 back / x55 glass front) + upper bread shelf ──
  fillBox(bkX1, 2, 15, bkX1, 3, 19, B.SPRUCE_PLANKS);
  fillBox(55, 2, 15, 55, 3, 19, B.GLASS);
  const EAST = [B.CAMPAGNE, B.PASTRY, B.BAGUETTE, B.BAGUETTE, B.PASTRY];
  for (let z = 15; z <= 19; z++) stamp(bkX1, 2, z, DISP(EAST[z - 15]));
  fillBox(bkX1, 3, 15, bkX1, 3, 19, B.CALCITE);
  stamp(bkX1, 2, 16, B.CALCITE); stamp(bkX1, 2, 18, B.CALCITE);
  fillBox(bkX1, 5, 15, bkX1, 5, 19, B.SPRUCE_PLANKS);  // upper shelf plank
  stamp(bkX1, 6, 15, B.BREAD); stamp(bkX1, 6, 17, B.BREAD); stamp(bkX1, 6, 19, B.BREAD); // extra loaves up top

  // ── F) HERO カンパーニュ pedestal island (centre floor, in the door sightline)
  fillBox(50, 2, 17, 51, 2, 17, B.CALCITE);  // marble pedestal (top y2)
  stamp(50, 3, 17, B.BREAD);                 // 看板 loaf (kept as BREAD)
  stamp(51, 3, 17, DISP(B.CAMPAGNE));        // signature campagne beside it

  // ── G) 天然酵母 fermentation-jar feature (west wall upper shelf y4..6) ──────
  fillBox(bkX0, 4, 15, bkX0, 4, 19, B.SPRUCE_PLANKS);  // jar shelf plank on x45
  for (let z = 15; z <= 19; z++) {
    if (B.JAR != null) stamp(bkX0, 5, z, (z % 2 ? B.JAR : B.GLASS));
    else               stamp(bkX0, 5, z, B.GLASS);
    stamp(bkX0, 6, z, B.BLUE_WOOL);                    // teal jar lids
  }

  // ── H) PENDANT LAMPS over the browsing floor + counter (warm amber) ────────
  if (B.LANTERN != null) {
    for (const [lx, lz] of [[48, 16], [51, 18], [54, 16], [49, counterZ]]) {
      stamp(lx, f1Hi - 1, lz, B.CALCITE);   // CALCITE shade (y6)
      stamp(lx, f1Hi - 2, lz, B.LANTERN);   // LANTERN glow (y5)
    }
  }

  // ── I) GREENERY: potted plants flanking the entrance (CALCITE pot + leaves) ─
  stamp(47, 2, 19, B.CALCITE); stamp(47, 3, 19, B.OAK_LEAVES);
  stamp(54, 2, 19, B.CALCITE); stamp(54, 3, 19, B.OAK_LEAVES);

  // ── J) CARVE AIR LAST: baker cell + staff gap stay clear ───────────────────
  fillBox(50, 2, bakerZ, 50, f1Hi, bakerZ, B.AIR);   // baker cell behind the counter
  fillBox(52, 2, counterZ, 52, 5, counterZ, B.AIR);  // re-affirm staff gap

  // ── WORKSHOP (工房) — z3..10 ──────────────────────────────────────────────
  // Three FURNACE oven stacks on back wall z=2
  stamp(46, 2, 2, B.FURNACE); stamp(46, 3, 2, B.FURNACE);
  stamp(49, 2, 2, B.FURNACE); stamp(49, 3, 2, B.FURNACE);
  stamp(52, 2, 2, B.FURNACE); stamp(52, 3, 2, B.FURNACE);
  // Flour sacks (HAY/WHITE_WOOL) in west corner of workshop
  stamp(45, 2, 2, B.HAY); stamp(45, 3, 2, B.HAY);
  stamp(45, 4, 2, B.WHITE_WOOL);
  stamp(45, 2, 3, B.WHITE_WOOL); stamp(45, 3, 3, B.HAY);
  // Prep/kneading table in centre of workshop (z=4..6)
  fillBox(47, 2, 4, 53, 2, 4, B.SPRUCE_PLANKS);
  stamp(48, 2, 5, B.CRAFTING_TABLE); stamp(50, 2, 5, B.CRAFTING_TABLE);
  // Fermentation jar shelf (SPRUCE shelf + GLASS jars + BLUE_WOOL lids) z=9
  fillBox(53, 3, 9, 55, 3, 9, B.SPRUCE_PLANKS); // shelf plank
  for (let jx = 53; jx <= 55; jx++) {
    stamp(jx, 4, 9, B.GLASS);
    stamp(jx, 5, 9, B.BLUE_WOOL);
  }
  // CALCITE + WATER sink in east corner of workshop
  stamp(55, 2, 2, B.CALCITE); stamp(55, 2, 3, B.WATER);

  // ==========================================================================
  // 8b) BAKERY CORRIDOR DOORWAY MARKER — so players spot the bakery entrance.
  //     Bakery doorway in z=20 wall: x49..50, y2..5 (AIR already opened above).
  //     Add a distinct teal 暖簾 lintel (BLUE_WOOL) at y=6 spanning x48..51,
  //     BREAD emblems flanking the doorway at y=2 (replaces HAY — now reads as
  //     "bread on display" not "hay"), and a LANTERN above.
  //     Corridor side (z=21) gets the decorative elements.
  // ==========================================================================
  // 暖簾 lintel: BLUE_WOOL row at y=6, x48..51, z=20 (top of doorway arch)
  fillBox(48, 6, 20, 51, 6, 20, B.BLUE_WOOL);
  // BREAD emblems flanking doorway at y=2, z=20 (corridor wall face).
  // These golden-bread blocks signal "パン屋" to approaching players.
  stamp(48, 2, 20, B.BREAD); // west emblem
  stamp(51, 2, 20, B.BREAD); // east emblem
  stamp(48, 3, 20, B.BREAD); // second tier west
  stamp(51, 3, 20, B.BREAD); // second tier east
  // LANTERN just inside/above corridor doorway, z=21 (corridor side)
  if (B.LANTERN != null) {
    stamp(49, 6, 21, B.LANTERN); // lantern above bakery doorway, corridor side
    stamp(50, 6, 21, B.LANTERN); // pair for width
  }
  // Teal pilaster stripes on wall beside bakery doorway (corridor face z=20)
  // west pilaster: x47, y2..5
  for (let py = 2; py <= 5; py++) {
    const col = (py % 2 === 0) ? B.BLUE_WOOL : B.WHITE_WOOL;
    stamp(47, py, 20, col); // west pilaster (overwrites wall)
    stamp(52, py, 20, col); // east pilaster
  }

  // ==========================================================================
  // 8c) WORKSHOP PARTITION DOOR MARKER — so players know z=11 is passable.
  //     Partition door opening: x50..51, y2..4, z=11 (AIR already opened above).
  //     Add a STONE_BRICKS lintel at y=5 + LANTERN above + WHITE_WOOL "→" arrow.
  // ==========================================================================
  // Lintel above partition door: y=5, x49..52, z=11 (STONE_BRICKS strip over door)
  fillBox(49, 5, 11, 52, 5, 11, B.STONE_BRICKS);
  // Keep door AIR (y2..4 at x50..51)
  fillBox(50, 2, 11, 51, 4, 11, B.AIR);
  // LANTERN over the door on the sales side (z=12): hangs from lintel
  if (B.LANTERN != null) {
    stamp(50, 5, 12, B.LANTERN);
    stamp(51, 5, 12, B.LANTERN);
  }
  // "→ 工房" arrow marker: WHITE_WOOL arrow on east face of teal partition wall (z=11)
  // place arrow at x=53, y=3..4, z=12 (workshop side, points east into workshop)
  // Arrow tip: single block
  stamp(53, 3, 12, B.WHITE_WOOL);
  stamp(53, 4, 12, B.WHITE_WOOL);
  // Arrow tail: two blocks forming a horizontal shaft
  stamp(54, 3, 12, B.WHITE_WOOL);
  stamp(55, 3, 12, B.WHITE_WOOL);

  // ==========================================================================
  // 9) WEST STAIR TOWER — x5..10, z3..19, y1..8+.
  //    Wide straight staircase (3 wide: x6..8) rising z19→z13 (7 steps).
  //    Landing at z=12: SMOOTH_STONE y1..deck (solid to 2F deck level).
  //    Stair SHAFT punched through deck at z=13..19 ONLY — z=12 landing
  //    stays solid at y=deck (OAK_PLANKS from 2F fill) so the player emerges
  //    at full 2F floor level and can walk south on the x=9..10 catwalk to
  //    the corridor. GF railing on x=9 (east side) alongside the shaft.
  //    2F railing caps the shaft opening on the east and north edges.
  // ==========================================================================
  const wsX0 = 5, wsX1 = 10; // west stair bay x
  // Stair treads: step s=0..6, z decreases from 19 toward 13, y increases 1→7
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;    // z of this tread (z=19 at s=0, z=13 at s=6)
    const ty = f1 + s;    // tread top y = 1,2,3,4,5,6,7
    fillBox(6, f1, sz, 8, ty, sz, B.SMOOTH_STONE); // solid tread column (3 wide: x6..8)
    fillBox(6, ty + 1, sz, 8, ty + 2, sz, B.AIR);  // headroom above tread
  }
  // Landing at the top (z=12): solid SMOOTH_STONE y1..deck (y=8).
  // The 2F deck fill in section 11 will lay OAK_PLANKS on top at y=8, making
  // the landing flush with the 2F deck — player emerges at 2F floor level.
  fillBox(6, f1, 12, 8, deck, 12, B.SMOOTH_STONE);
  // Punch the stair SHAFT through the deck at z=13..19 only (NOT z=12).
  // z=12 stays solid so the player has a walkable landing at 2F.
  fillBox(6, deck, 13, 8, deck + 2, 19, B.AIR);
  // Restore solid deck for the rest of the stair bay (z=2..11 stays solid).
  fillBox(wsX0, deck, 2, wsX1, deck, 11, B.OAK_PLANKS);
  // x=9..10 catwalk: deck stays solid at z=12..19 (not punched — only x=6..8 punched).
  // This 2-block-wide catwalk is the 2F walkway from landing → corridor:
  //   player steps from landing (z=12, x=6..8, 2F level) east to x=9 (same level),
  //   then walks south z=12→20 on the x=9..10 catwalk to the z=20 corridor doorway.
  // (No explicit fill needed here; the section-11 full-deck fill covers it.)

  // GF railings: x=9 (east side of shaft), 2 blocks tall alongside stair run
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;
    stamp(9, f1 + s + 1, sz, B.WHITE_WOOL); // railing lower post
    stamp(9, f1 + s + 2, sz, B.WHITE_WOOL); // railing upper post
  }
  fillBox(9, f1 + 1, 12, 9, f1 + 7, 19, B.WHITE_WOOL); // GF railing cap strip

  // ==========================================================================
  // 10) EAST STAIR TOWER — x80..82, z3..19, symmetric to west stair.
  //     Same fix: shaft punched z=13..19 only; z=12 landing solid at deck;
  //     x=79..80 catwalk provides 2F walkway from landing to corridor.
  // ==========================================================================
  const esX0 = 80, esX1 = 82; // east stair bay x
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;
    const ty = f1 + s;
    fillBox(80, f1, sz, 82, ty, sz, B.SMOOTH_STONE);
    fillBox(80, ty + 1, sz, 82, ty + 2, sz, B.AIR);
  }
  fillBox(80, f1, 12, 82, deck, 12, B.SMOOTH_STONE); // east landing solid to deck
  fillBox(80, deck, 13, 82, deck + 2, 19, B.AIR);     // shaft z=13..19 only
  fillBox(esX0, deck, 2, esX1, deck, 11, B.OAK_PLANKS);
  // x=79 catwalk (east bay west edge, adjacent to divider wall x=79) stays solid;
  // use railing on x=79 alongside shaft
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;
    stamp(79, f1 + s + 1, sz, B.WHITE_WOOL);
    stamp(79, f1 + s + 2, sz, B.WHITE_WOOL);
  }
  fillBox(79, f1 + 1, 12, 79, f1 + 7, 19, B.WHITE_WOOL);

  // ==========================================================================
  // 11) SECOND FLOOR — corridor z21..25 + 6 classrooms + stair access.
  //     Floor y=8 (OAK_PLANKS on deck). Interior y=9..14. Ceiling y=15 (roof).
  //
  //  BUG-1 FIX: hollow starts at z=3 (NOT z=2).
  //    The perimeter wall at z=2 was built by section 2 (wallRing, SANDSTONE y9..14)
  //    and section 3 (windowBand, GLASS y10..13).  Starting the hollow at z=3
  //    preserves that north face so the 2F is not open to the outside.
  //
  //  BUG-2 FIX: stair shafts re-punched at z=13..19 ONLY (matching sections 9/10).
  //    z=12 (the landing) stays solid at deck level, giving the player a 2F-level
  //    surface to stand on when they emerge from the stair.  The x=9 (west stair)
  //    and x=79 (east stair) columns are NEVER punched, forming a catwalk from
  //    the landing south to the z=20 corridor doorway.
  // ==========================================================================
  const g1 = deck + 1; // floor-2 interior bottom = y9
  const g2 = f2Hi;     // floor-2 interior top    = y14

  // Hollow out the 2F air space — start at z=3 to preserve the north perimeter wall.
  fillBox(5, g1, 3, 82, g2, 25, B.AIR);
  // Lay OAK_PLANKS floor overlay on entire deck (z=2..25 so z=2 north edge gets planks).
  fillBox(5, deck, 2, 82, deck, 25, B.OAK_PLANKS);

  // Re-open stair shafts at z=13..19 (NOT z=12 — landing stays at deck level).
  fillBox(6, deck, 13, 8, deck + 2, 19, B.AIR);  // west stair shaft
  fillBox(80, deck, 13, 82, deck + 2, 19, B.AIR); // east stair shaft

  // 2F RAILING along the catwalk side of each stair shaft — prevents accidental
  // falls into the open shaft from the x=9 (west) / x=79 (east) walkway.
  //   • East wall of west shaft  (x=8, z=13..19, y=g1..g1+1): single-block-wide rail
  //     standing on the shaft's east rim; player on x=9 catwalk cannot walk west
  //     into the open shaft.
  //   • West wall of east shaft  (x=80, z=13..19, y=g1..g1+1): same for east bay.
  // NOTE: no railing is placed at z=12 (the stair landing) — that would block the
  // player's exit from the stair.  The landing is openly accessible on all sides
  // so the player can step from the stair (z=12 x=6..8) east to the catwalk (x=9).
  fillBox(8,  g1, 13, 8,  g1 + 1, 19, B.WHITE_WOOL); // west shaft east-rim railing
  fillBox(80, g1, 13, 80, g1 + 1, 19, B.WHITE_WOOL); // east shaft west-rim railing

  // Floor-2 BAY DIVIDER WALLS (same x positions, z2..19, y9..14).
  // Starting at z=2 ensures dividers reach the (now preserved) north wall.
  for (const divX of [11, 22, 33, 44, 57, 68, 79]) {
    fillBox(divX, g1, 2, divX, g2, 19, B.SANDSTONE);
  }

  // Floor-2 CORRIDOR BACK WALL at z=20, y9..14
  fillBox(5, g1, 20, 82, g2, 20, B.SANDSTONE);
  // Doorways per bay on floor-2 (same positions as ground floor)
  fillBox(6, g1, 20, 9, g1 + 3, 20, B.AIR);
  for (const [bayX0, bayX1] of [[12,21],[23,32],[34,43],[45,56],[58,67],[69,78]]) {
    const doorCx = Math.floor((bayX0 + bayX1) / 2);
    fillBox(doorCx - 1, g1, 20, doorCx, g1 + 3, 20, B.AIR);
  }
  fillBox(80, g1, 20, 82, g1 + 3, 20, B.AIR);

  // ── Floor-2 classroom helper (FIX B: enriched furnishings) ───────────────
  // Each 2F classroom now has: blackboard + teacher desk, a 4×3 student desk
  // grid (more density than before), lockers along the side wall, coloured
  // wool "poster" panels on the back wall, and LANTERN ceiling lights — so
  // rooms feel lived-in rather than empty.
  const classroom_2f = (rx0, rx1) => {
    const rw = rx1 - rx0 + 1;
    const bbW = Math.min(rw - 2, 9);
    const bbX0 = rx0 + 1;
    const bbX1 = Math.min(rx1 - 1, bbX0 + bbW - 1);
    const tDx = Math.floor((rx0 + rx1) / 2) - 1;

    // BLACKBOARD on back wall z=2, y=g1+1..g2-1 (y10..13) — 緑黒板
    fillBox(bbX0, g1 + 1, 2, bbX1, g2 - 1, 2, (B.GREEN_BOARD != null ? B.GREEN_BOARD : B.BLACK_WOOL));

    // WALL POSTER left of blackboard (GREEN_WOOL panel, 2 wide × 2 tall, at y=g1+1..g2-2)
    // Only if there's room west of the blackboard
    if (bbX0 > rx0 + 1) {
      stamp(rx0 + 1, g1 + 2, 2, B.GREEN_WOOL);
      stamp(rx0 + 1, g1 + 3, 2, B.BLUE_WOOL);
    }

    // TEACHER DESK (CRAFTING_TABLE pair) at z=3, chair (SPRUCE_PLANKS) at z=4
    stamp(tDx,     g1, 3, B.CRAFTING_TABLE);
    stamp(tDx + 1, g1, 3, B.CRAFTING_TABLE);
    stamp(tDx,     g1, 4, B.SPRUCE_PLANKS);  // chair
    stamp(tDx + 1, g1, 4, B.SPRUCE_PLANKS);

    // STUDENT DESK GRID: 4 cols × 3 rows for a well-populated classroom.
    // Cols spread across bay width; rows at z=7, 10, 14.
    const cols4 = [
      rx0 + Math.floor(rw * 0.15),
      rx0 + Math.floor(rw * 0.38),
      rx0 + Math.floor(rw * 0.62),
      rx0 + Math.floor(rw * 0.85),
    ];
    for (const dz2 of [7, 11, 15]) {
      for (const dx of cols4) {
        stamp(dx, g1, dz2,     B.SPRUCE_PLANKS); // desk top
        stamp(dx, g1, dz2 + 1, B.BIRCH_PLANKS);  // chair behind desk
      }
    }

    // LOCKERS along the west interior wall (rx0, z=6..18, y=g1..g1+2): pairs of
    // SPRUCE_PLANKS columns with WHITE_WOOL "door" faces — evokes metal school lockers.
    for (let lz = 6; lz <= 17; lz += 3) {
      stamp(rx0, g1,     lz,     B.SPRUCE_PLANKS); // locker base
      stamp(rx0, g1 + 1, lz,     B.WHITE_WOOL);    // locker door
      stamp(rx0, g1 + 2, lz,     B.SPRUCE_PLANKS); // locker top
      stamp(rx0, g1,     lz + 1, B.SPRUCE_PLANKS);
      stamp(rx0, g1 + 1, lz + 1, B.WHITE_WOOL);
      stamp(rx0, g1 + 2, lz + 1, B.SPRUCE_PLANKS);
    }

    // LANTERNS: 2 ceiling lanterns per classroom (just under roof, above desk rows)
    if (B.LANTERN != null) {
      stamp(tDx,         g2 - 1, 8,  B.LANTERN); // front-of-class light
      stamp(tDx,         g2 - 1, 14, B.LANTERN); // back-of-class light
    }
  };

  // ==========================================================================
  // 11b) 音楽室 (music room) — 2F x23..32 (replaces 2F Classroom 2).
  //      Piano (BLACK_WOOL body + WHITE_WOOL keys) against z=2,
  //      music stands (SPRUCE_LOG post + SPRUCE_PLANKS top), chairs (BIRCH_PLANKS)
  //      in a semicircle facing the piano.
  // ==========================================================================
  const muX0 = 23, muX1 = 32; // music room bay x extents (2F)
  // Back wall z=2 stays as-is (SANDSTONE), piano sits against it
  // PIANO BODY: BLACK_WOOL, x24..27, y9..11, z2..3
  fillBox(muX0 + 1, g1, 2, muX0 + 4, g1 + 2, 3, B.BLACK_WOOL);
  // PIANO KEYS: WHITE_WOOL row across top of piano at y=g1+2 (y=11), z=2
  fillBox(muX0 + 1, g1 + 2, 2, muX0 + 4, g1 + 2, 2, B.WHITE_WOOL); // keys row
  // Piano lid: BLACK_WOOL at y=g1+3 above keys
  fillBox(muX0 + 1, g1 + 3, 2, muX0 + 4, g1 + 3, 2, B.BLACK_WOOL);
  // Piano bench: BIRCH_PLANKS in front of piano
  stamp(muX0 + 2, g1, 4, B.BIRCH_PLANKS);
  stamp(muX0 + 3, g1, 4, B.BIRCH_PLANKS);
  // MUSIC STANDS: SPRUCE_LOG post (y=g1) + SPRUCE_PLANKS lectern top (y=g1+1)
  // 4 stands arranged in a 2×2 arc facing the piano
  const standPos = [[muX0 + 2, 8], [muX0 + 4, 8], [muX0 + 6, 10], [muX0 + 8, 10]];
  for (const [sx, sz2] of standPos) {
    stamp(sx, g1,     sz2, B.SPRUCE_LOG);    // post
    stamp(sx, g1 + 1, sz2, B.SPRUCE_PLANKS); // lectern top
  }
  // CHAIRS (BIRCH_PLANKS) behind each stand
  for (const [sx, sz2] of standPos) {
    stamp(sx, g1, sz2 + 1, B.BIRCH_PLANKS);
  }
  // LANTERNS for music room
  if (B.LANTERN != null) {
    stamp(muX0 + 3, g2 - 1, 8,  B.LANTERN);
    stamp(muX0 + 6, g2 - 1, 14, B.LANTERN);
  }

  // Floor-2: remaining classrooms (音楽室 replaces 2F Classroom 2 at x23..32)
  classroom_2f(12, 21);  // 2F Classroom 1
  // 音楽室 at x23..32 (defined above)
  classroom_2f(34, 43);  // 2F Classroom 3
  classroom_2f(45, 56);  // 2F Classroom 4 (above bakery)
  classroom_2f(58, 67);  // 2F Classroom 5
  classroom_2f(69, 78);  // 2F Classroom 6

  // ==========================================================================
  // 11c) STAIR DOORWAY MARKERS — placed AFTER floor-2 hollowing so they survive.
  //      West stair: corridor doorway x6..9, z=20.
  //      East stair: corridor doorway x80..82, z=20.
  //      Each gets: BLUE_WOOL frame lintel at y=6, a LANTERN above (z=21 side),
  //      an UP-ARROW motif (WHITE_WOOL "↑") on the corridor z=20 wall above the
  //      doorway, and a "2F" two-block marker in BLUE_WOOL higher up.
  //      Also LANTERN at each stair LANDING (top of stairs, deck y=8).
  //      NOTE: floor-2 hollow clears y=9..14 at z=2..25, so markers at y≥9
  //      must go here; markers at y=6..8 survive the GF-shell range and are safe.
  // ==========================================================================
  // ── WEST STAIR MARKER ──────────────────────────────────────────────────────
  // Lintel: BLUE_WOOL span at y=6, x5..10, z=20 (top of west stair doorway)
  fillBox(5, 6, 20, 10, 6, 20, B.BLUE_WOOL);
  // LANTERN above west stair doorway, corridor side z=21
  if (B.LANTERN != null) {
    stamp(7, 6, 21, B.LANTERN);
    stamp(8, 6, 21, B.LANTERN);
  }
  // UP-ARROW motif on corridor back wall (z=20) above west stair doorway.
  // IMPORTANT: the 2F doorway is carved at y=g1..g1+3 (y=9..12), so markers
  // at y≥9 must NOT fill the doorway columns (x=6..9).  Only paint on the
  // SOLID wall portions: y=7..8 (below doorway), and y=13 (above doorway top).
  fillBox(6, 7, 20, 9, 7, 20, B.WHITE_WOOL);   // arrow base row at y=7 (GF ceiling)
  stamp(7, 8, 20, B.WHITE_WOOL);               // arrow mid at y=8 (deck level)
  stamp(8, 8, 20, B.WHITE_WOOL);
  // Arrow tip + "2F" badge placed ABOVE the doorway (y=13, solid wall above door arch)
  stamp(7, 13, 20, B.WHITE_WOOL);  // arrow tip above door
  stamp(7, 14, 20, B.BLUE_WOOL);   // "2F" badge upper cell (under ceiling)
  stamp(8, 14, 20, B.BLUE_WOOL);

  // ── EAST STAIR MARKER ──────────────────────────────────────────────────────
  // Lintel: BLUE_WOOL span at y=6, x79..82, z=20
  fillBox(79, 6, 20, 82, 6, 20, B.BLUE_WOOL);
  if (B.LANTERN != null) {
    stamp(80, 6, 21, B.LANTERN);
    stamp(81, 6, 21, B.LANTERN);
  }
  // UP-ARROW above east stair doorway (same pattern: base y=7..8, badge y=13..14)
  fillBox(80, 7, 20, 82, 7, 20, B.WHITE_WOOL); // arrow base row
  stamp(80, 8, 20, B.WHITE_WOOL);
  stamp(81, 8, 20, B.WHITE_WOOL);
  stamp(81, 13, 20, B.WHITE_WOOL);  // arrow tip above door
  stamp(80, 14, 20, B.BLUE_WOOL);   // "2F" badge
  stamp(81, 14, 20, B.BLUE_WOOL);

  // Landing LANTERNs at top of stairs (floor-2 deck y=8, z=12)
  if (B.LANTERN != null) {
    stamp(7,  deck, 12, B.LANTERN); // west stair landing local (7,8,12)
    stamp(81, deck, 12, B.LANTERN); // east stair landing local (81,8,12)
  }

  // ==========================================================================
  // 11d) S2 — 昇降口 (genkan) + 廊下 authenticity + facade identity.
  //      Placed AFTER all wall/doorway carving so nothing here is erased.
  // ==========================================================================
  // ── 廊下: bright SCHOOL_FLOOR down the full ground-floor corridor ──────────
  fillBox(5, 1, 21, 82, 1, 25, B.SCHOOL_FLOOR);

  // ── 昇降口 genkan: stone たたき just inside the entrance (x43..45 walkway
  //    stays clear — corridor walkable test at x=44 depends on it) ────────────
  fillBox(41, 1, 23, 47, 1, 25, B.SMOOTH_STONE); // たたき (replaces the mat)
  // 下駄箱 banks flanking the walkway on the room-side corridor wall (z=22)
  fillBox(40, 2, 22, 42, 3, 22, B.SHOE_CUBBY);
  fillBox(46, 2, 22, 48, 3, 22, B.SHOE_CUBBY);
  fillBox(40, 4, 22, 42, 4, 22, B.SPRUCE_PLANKS); // wood caps
  fillBox(46, 4, 22, 48, 4, 22, B.SPRUCE_PLANKS);
  // 下駄箱 banks against the facade glass (z=25), tight to the pillars
  fillBox(40, 2, 25, 41, 3, 25, B.SHOE_CUBBY);
  fillBox(47, 2, 25, 48, 3, 25, B.SHOE_CUBBY);
  // 掲示 (PTA notices) floating beside the walkway
  stamp(45, 4, 22, B.NOTICE_BOARD);

  // ── 廊下手洗い場: SINK_UNIT rows against the z=20 wall.
  //    Spec positions (25..28 / 60..63) sit in front of the 理科室 (x26..27)
  //    and Classroom-4 (x61..62) doorways — shifted to keep every door clear.
  fillBox(28, 2, 21, 31, 2, 21, B.SINK_UNIT);
  fillBox(64, 2, 21, 67, 2, 21, B.SINK_UNIT);

  // ── NOTICE_BOARD pairs on the plastered corridor wall (z=20, y3..4),
  //    clear of all doorway columns and the bakery pilasters x47..52 ─────────
  for (const nbx of [13, 24, 35, 59, 70]) {
    fillBox(nbx, 3, 20, nbx + 1, 4, 20, B.NOTICE_BOARD);
  }

  // ── トロフィーケース near the east stair (x76..78, z21): wood base, glass
  //    case with the 校章 displayed inside, wood cap ─────────────────────────
  fillBox(76, 2, 21, 78, 2, 21, B.SPRUCE_PLANKS);
  stamp(76, 3, 21, B.GLASS);
  stamp(77, 3, 21, B.SCHOOL_EMBLEM);
  stamp(78, 3, 21, B.GLASS);
  fillBox(76, 4, 21, 78, 4, 21, B.GLASS);
  fillBox(76, 5, 21, 78, 5, 21, B.SPRUCE_PLANKS);

  // ── FACADE IDENTITY: 校章 + 校舎時計 above the entrance (z=26 mullion col) ──
  stamp(cx, 13, dz, B.SCHOOL_CLOCK);  // (44,13,26)
  stamp(cx, 14, dz, B.SCHOOL_EMBLEM); // (44,14,26)
  // 国旗掲揚ポール west of the entrance steps
  fillBox(36, 1, 33, 36, 10, 33, B.SMOOTH_STONE); // pole
  stamp(36, 11, 33, B.FLAG); stamp(37, 11, 33, B.FLAG); // flying 日の丸
  // 二宮金次郎像 beside the entrance (礎石 + 体 + 頭 + 本 + 背負った薪)
  stamp(38, 1, 29, B.STONE_BRICKS);  // 礎石
  stamp(38, 2, 29, B.SMOOTH_STONE);  // 体
  stamp(38, 3, 29, B.CALCITE);       // 頭
  stamp(39, 2, 29, B.BIRCH_PLANKS);  // 読んでいる本
  stamp(37, 2, 29, B.HAY);           // 背負った薪
  // 自販機 east of the entrance (glows at night)
  stamp(49, 1, 28, B.SMOOTH_STONE);  // plinth
  fillBox(49, 2, 28, 49, 3, 28, B.VENDING);
  // 外ベンチ in front of the facade (常連さんの待ち場所)
  fillBox(39, 1, 28, 40, 1, 28, B.SPRUCE_PLANKS);

  // ==========================================================================
  // 12) FRONT YARD (local z>26) — deterministic props.
  //     Gravel apron, 2 trees, swing set, stacked tire ring, 防球ネット.
  // ==========================================================================
  // Gravel apron in front of facade z26..32
  fillBox(bx0, 0, 27, bx1, 0, 33, B.GRAVEL);
  // Grass lawn further out z34..55
  fillBox(bx0, 0, 34, bx1, 0, 55, B.GRASS);

  // OAK tree 1: west of entrance
  const t1x = 24, t1z = 35;
  fillBox(t1x, 1, t1z, t1x, 6, t1z, B.OAK_LOG);
  fillBox(t1x - 2, 5, t1z - 2, t1x + 2, 7, t1z + 2, B.OAK_LEAVES);
  fillBox(t1x - 1, 8, t1z - 1, t1x + 1, 8, t1z + 1, B.OAK_LEAVES);
  stamp(t1x, 9, t1z, B.OAK_LEAVES); stamp(t1x, 6, t1z, B.OAK_LOG); stamp(t1x, 7, t1z, B.OAK_LOG);

  // OAK tree 2: east of entrance (S2: moved from (62,38) to (56,34) so the
  // 体育館 footprint x64..84/z36..56 stays clear)
  const t2x = 56, t2z = 34;
  fillBox(t2x, 1, t2z, t2x, 5, t2z, B.OAK_LOG);
  fillBox(t2x - 2, 4, t2z - 2, t2x + 2, 6, t2z + 2, B.OAK_LEAVES);
  fillBox(t2x - 1, 7, t2z - 1, t2x + 1, 7, t2z + 1, B.OAK_LEAVES);
  stamp(t2x, 8, t2z, B.OAK_LEAVES); stamp(t2x, 5, t2z, B.OAK_LOG);

  // SWING SET: frame (OAK_LOG uprights + SANDSTONE crossbar) + hanging seats (OAK_PLANKS)
  const swX = 50, swZ = 40;
  stamp(swX, 1, swZ, B.OAK_LOG); stamp(swX, 2, swZ, B.OAK_LOG);
  stamp(swX, 3, swZ, B.OAK_LOG); stamp(swX, 4, swZ, B.OAK_LOG);
  stamp(swX + 4, 1, swZ, B.OAK_LOG); stamp(swX + 4, 2, swZ, B.OAK_LOG);
  stamp(swX + 4, 3, swZ, B.OAK_LOG); stamp(swX + 4, 4, swZ, B.OAK_LOG);
  fillBox(swX, 4, swZ, swX + 4, 4, swZ, B.SANDSTONE); // crossbar
  // Swing seats hanging down: BIRCH_PLANKS at y=2
  stamp(swX + 1, 2, swZ, B.BIRCH_PLANKS);
  stamp(swX + 3, 2, swZ, B.BIRCH_PLANKS);

  // STACKED TIRES (BLACK_WOOL rings) near entrance
  const tireRing = (px, pz, py) => {
    stamp(px - 1, py, pz, B.BLACK_WOOL);
    stamp(px + 1, py, pz, B.BLACK_WOOL);
    stamp(px, py, pz - 1, B.BLACK_WOOL);
    stamp(px, py, pz + 1, B.BLACK_WOOL);
  };
  tireRing(32, 30, 1); tireRing(32, 30, 2); tireRing(32, 30, 3);

  // 防球ネット (anti-ball net): tall GREEN_WOOL net panels along the EAST yard
  // boundary. S2: relocated from x=72 to x=86 so the 体育館 (x64..84) fits.
  const netX = 86;
  for (let nz = 28; nz <= 52; nz += 6) {
    stamp(netX, 1, nz, B.OAK_LOG); stamp(netX, 2, nz, B.OAK_LOG);
    stamp(netX, 3, nz, B.OAK_LOG); stamp(netX, 4, nz, B.OAK_LOG);
    stamp(netX, 5, nz, B.OAK_LOG);
  }
  for (let nz = 28; nz <= 52; nz++) {
    fillBox(netX, 3, nz, netX, 5, nz, B.GREEN_WOOL); // net panels at top
  }

  // ==========================================================================
  // 13) HARVEST FIELD — x28..36, z42..52 → world x-8..0, z-8..2.
  //     Tilled DIRT + alternating WHEAT_CROP/VEG_CROP rows.
  // ==========================================================================
  const fx0 = 28, fx1 = 36;
  const fz0 = 42, fz1 = 52;
  fillBox(fx0, 0, fz0, fx1, 0, fz1, B.DIRT); // tilled dirt base
  for (let fz = fz0; fz <= fz1; fz++) {
    if (((fz - fz0) % 2) !== 0) continue;
    const crop = (((fz - fz0) / 2) % 2 === 0) ? B.WHEAT_CROP : B.VEG_CROP;
    for (let fx = fx0; fx <= fx1; fx++) stamp(fx, 1, fz, crop);
  }
  // Grass border around field
  for (let fx = fx0 - 1; fx <= fx1 + 1; fx++) {
    stamp(fx, 0, fz0 - 1, B.GRASS); stamp(fx, 0, fz1 + 1, B.GRASS);
  }
  for (let fz = fz0; fz <= fz1; fz++) {
    stamp(fx0 - 1, 0, fz, B.GRASS); stamp(fx1 + 1, 0, fz, B.GRASS);
  }

  // ==========================================================================
  // 14) LANTERNS — warm interior lighting (uses the new block-light system).
  //     Hung just under each floor's ceiling so the bakery, corridor and every
  //     classroom stay cosy and readable day AND night (renovated-school vibe).
  // ==========================================================================
  if (B.LANTERN != null) {
    const bayCenters = [16, 27, 38, 50, 62, 73]; // classroom/bakery bay x-centres
    const roomZ = 11;        // mid-depth of the z3..19 room zone
    const corrZ = 23;        // corridor centre (z21..25)
    for (const [ly, name] of [[f1Hi - 1, 'f1'], [f2Hi - 1, 'f2']]) { // hang below each ceiling
      // one lantern per room (2 per big bay for even light)
      for (const bxC of bayCenters) {
        stamp(bxC, ly, roomZ - 3, B.LANTERN);
        stamp(bxC, ly, roomZ + 4, B.LANTERN);
      }
      // a row of lanterns down the corridor
      for (let lx = bx0 + 6; lx <= bx1 - 6; lx += 10) stamp(lx, ly, corrZ, B.LANTERN);
    }
  }

  // ==========================================================================
  // 15) S2 — 体育館 (gymnasium), local x64..84 z36..56.
  //     The 防球ネット was relocated to x=86 and the yard oak to (56,34)
  //     (section 12) so this footprint is clear. Stepped-arch roof profile:
  //     y7 eaves → y8 (x66..82) → y9 (x69..79) → y10 ridge (x72..76).
  // ==========================================================================
  {
    const gx0 = 64, gx1 = 84, gz0 = 36, gz1 = 56;
    // Foundation slab + interior clear (insurance against yard scatter)
    fillBox(gx0, 0, gz0, gx1, 0, gz1, B.SMOOTH_STONE);
    fillBox(gx0 + 1, 1, gz0 + 1, gx1 - 1, 6, gz1 - 1, B.AIR);
    // Court floor with painted lines
    fillBox(gx0 + 1, 1, gz0 + 1, gx1 - 1, 1, gz1 - 1, B.GYM_FLOOR);
    // PLASTER walls y1..6 (y1 plinth closes the gap beside the raised floor)
    wallRing(gx0, gz0, gx1, 1, 6, gz1, B.PLASTER);
    // SASH window band y4..5, every 3rd column on all four walls
    for (let x = gx0 + 2; x <= gx1 - 2; x += 3) {
      fillBox(x, 4, gz0, x, 5, gz0, SASH);
      fillBox(x, 4, gz1, x, 5, gz1, SASH);
    }
    for (let z = gz0 + 3; z <= gz1 - 3; z += 3) {
      fillBox(gx0, 4, z, gx0, 5, z, SASH);
      fillBox(gx1, 4, z, gx1, 5, z, SASH);
    }
    // SANDSTONE structural pillars (corners + side midpoints)
    for (const [px2, pz2] of [[gx0, gz0], [gx1, gz0], [gx0, gz1], [gx1, gz1], [gx0, 46], [gx1, 46]]) {
      fillBox(px2, 1, pz2, px2, 6, pz2, B.SANDSTONE);
    }
    // Stepped arch roof (full-depth slabs per band) + PLASTER gable fills
    fillBox(gx0, 7, gz0, gx0 + 1, 7, gz1, B.SMOOTH_STONE);  // west eave x64..65
    fillBox(gx1 - 1, 7, gz0, gx1, 7, gz1, B.SMOOTH_STONE);  // east eave x83..84
    fillBox(66, 8, gz0, 68, 8, gz1, B.SMOOTH_STONE);
    fillBox(80, 8, gz0, 82, 8, gz1, B.SMOOTH_STONE);
    fillBox(69, 9, gz0, 71, 9, gz1, B.SMOOTH_STONE);
    fillBox(77, 9, gz0, 79, 9, gz1, B.SMOOTH_STONE);
    fillBox(72, 10, gz0, 76, 10, gz1, B.SMOOTH_STONE);      // ridge
    for (const gz of [gz0, gz1]) { // gable faces (妻面)
      fillBox(66, 7, gz, 82, 7, gz, B.PLASTER);
      fillBox(69, 8, gz, 79, 8, gz, B.PLASTER);
      fillBox(72, 9, gz, 76, 9, gz, B.PLASTER);
    }
    // Entrance toward the schoolyard (north wall z=36): 3-wide walk-in + 庇
    fillBox(73, 2, gz0, 75, 4, gz0, B.AIR);
    fillBox(72, 5, 34, 76, 5, 35, B.SPRUCE_PLANKS); // canopy
    fillBox(72, 1, 34, 72, 4, 34, B.SPRUCE_LOG);    // canopy posts
    fillBox(76, 1, 34, 76, 4, 34, B.SPRUCE_LOG);
    fillBox(73, 1, 34, 75, 1, 35, B.SMOOTH_STONE);  // entrance stoop
    // Stage along the south wall
    fillBox(66, 2, 53, 82, 2, 55, B.SPRUCE_PLANKS);
    // 跳び箱 + 着地マット (mat flush with the court floor)
    fillBox(70, 2, 44, 70, 3, 44, B.VAULT_BOX);
    fillBox(71, 1, 44, 73, 1, 44, B.WHITE_WOOL);
    // Basketball hoops on both end walls (WHITE_WOOL board + HAY ring)
    fillBox(gx0 + 1, 4, 45, gx0 + 1, 5, 47, B.WHITE_WOOL);
    stamp(gx0 + 2, 4, 46, B.HAY);
    fillBox(gx1 - 1, 4, 45, gx1 - 1, 5, 47, B.WHITE_WOOL);
    stamp(gx1 - 2, 4, 46, B.HAY);
    // LANTERN row under the vault (y9 under the ridge, y7 under the y8 bands)
    if (B.LANTERN != null) {
      for (const lx of [68, 72, 76, 80]) {
        stamp(lx, (lx >= 72 && lx <= 76) ? 9 : 7, 46, B.LANTERN);
      }
      stamp(74, 6, 38, B.LANTERN); // entrance bay light
    }
    // 渡り廊下: gravel path linking the school apron to the gym
    fillBox(60, 0, 34, 64, 0, 40, B.GRAVEL);
  }

  // ==========================================================================
  // 16) S2 — 校庭 (schoolyard): playground set, 桜並木, picnic desk sets,
  //      ぐるぐるコンポスト, herb bed, parking cones.
  // ==========================================================================
  // ── 鉄棒 (3 heights, z=38): SPRUCE_LOG posts + SMOOTH_STONE bars ───────────
  fillBox(10, 2, 38, 12, 2, 38, B.SMOOTH_STONE); // low bar
  fillBox(12, 3, 38, 14, 3, 38, B.SMOOTH_STONE); // mid bar
  fillBox(14, 4, 38, 16, 4, 38, B.SMOOTH_STONE); // high bar
  fillBox(10, 1, 38, 10, 2, 38, B.SPRUCE_LOG);
  fillBox(12, 1, 38, 12, 3, 38, B.SPRUCE_LOG);
  fillBox(14, 1, 38, 14, 4, 38, B.SPRUCE_LOG);
  fillBox(16, 1, 38, 16, 4, 38, B.SPRUCE_LOG);
  // ── うんてい (monkey bars, z=44) ───────────────────────────────────────────
  fillBox(18, 1, 44, 18, 3, 44, B.SPRUCE_LOG);
  fillBox(24, 1, 44, 24, 3, 44, B.SPRUCE_LOG);
  fillBox(18, 4, 44, 24, 4, 44, B.BIRCH_PLANKS); // rung beam
  // ── すべり台 at (11,48): ladder + platform + slide + guard rails ──────────
  fillBox(11, 1, 48, 11, 3, 48, B.SPRUCE_LOG);  // ladder column
  stamp(12, 3, 48, B.BIRCH_PLANKS);             // platform / slide top
  stamp(13, 2, 48, B.BIRCH_PLANKS);             // slide mid
  stamp(14, 1, 48, B.BIRCH_PLANKS);             // slide run-out
  if (B.GUARD_RAIL != null) {
    stamp(12, 4, 47, B.GUARD_RAIL);
    stamp(12, 4, 49, B.GUARD_RAIL);
  }
  // ── 桜並木: south edge (z=54) + west edge (x=7) ───────────────────────────
  const sakura = (tx, tz) => {
    const leaf = (B.SAKURA_LEAVES != null ? B.SAKURA_LEAVES : B.OAK_LEAVES);
    fillBox(tx - 2, 3, tz - 2, tx + 2, 5, tz + 2, leaf); // r2 canopy y3..5
    stamp(tx, 6, tz, leaf);                              // crown tip
    fillBox(tx, 1, tz, tx, 3, tz, B.OAK_LOG);            // trunk pokes through
  };
  for (const tx of [8, 16, 24, 32, 40, 48, 56]) sakura(tx, 54);
  for (const tz of [32, 40, 48]) sakura(7, tz);
  // ── 校庭ランチ: SchoolDesk picnic sets ×3 (机+椅子2+パラソル) ─────────────
  for (const [yx, yz] of [[30, 36], [54, 46], [20, 30]]) {
    stamp(yx,     1, yz, B.SCHOOL_DESK);
    stamp(yx - 1, 1, yz, B.SCHOOL_CHAIR);
    stamp(yx + 1, 1, yz, B.SCHOOL_CHAIR);
    fillBox(yx, 2, yz, yx, 3, yz, B.SPRUCE_LOG);              // parasol pole
    fillBox(yx - 1, 4, yz - 1, yx + 1, 4, yz + 1, B.WHITE_WOOL); // parasol canopy
  }
  // ── ぐるぐるコンポスト (パン→堆肥→野菜の循環の要) near the field ─────────
  stamp(28, 1, 33, B.COMPOST);
  // ── ハーブ花壇 near the facade (raised DIRT bed + alternating herbs) ──────
  fillBox(46, 1, 32, 52, 1, 33, B.DIRT);
  for (let hx = 46; hx <= 52; hx++) {
    stamp(hx, 2, 32, (hx % 2 === 0) ? B.GREEN_WOOL : B.OAK_LEAVES);
    stamp(hx, 2, 33, (hx % 2 === 0) ? B.OAK_LEAVES : B.GREEN_WOOL);
  }
  // ── 駐車場コーン (グラウンドのコーン側が駐車場): CALCITE posts ────────────
  for (const px3 of [58, 60, 62]) stamp(px3, 1, 30, B.CALCITE);
}
