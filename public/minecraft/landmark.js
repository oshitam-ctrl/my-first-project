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
//   Baker NPC stands at world (14,31,-32) = local (50,2,18) — kept clear (behind counter).
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
  const windowBand = (yLo, yHi, zWall, xLo, xHi) => {
    for (let x = xLo; x <= xHi; x++) {
      if (((x - xLo) % 3) !== 2) fillBox(x, yLo, zWall, x, yHi, zWall, B.GLASS);
    }
  };
  // Floor-1 front (z=26) and back (z=2): y3..6 (mid-band, keep y2+y7 solid)
  windowBand(3, 6, bz1, bx0 + 2, bx1 - 2); // front
  windowBand(3, 6, bz0, bx0 + 2, bx1 - 2); // back
  // Floor-2 front and back: y10..13
  windowBand(deck + 2, f2Hi - 1, bz1, bx0 + 2, bx1 - 2); // front
  windowBand(deck + 2, f2Hi - 1, bz0, bx0 + 2, bx1 - 2); // back
  // End walls (west x=4, east x=83) — both floors
  for (let z = bz0 + 2; z <= bz1 - 2; z++) {
    if (((z - (bz0 + 2)) % 3) !== 2) {
      fillBox(bx0, 3, z, bx0, 6, z, B.GLASS);
      fillBox(bx1, 3, z, bx1, 6, z, B.GLASS);
      fillBox(bx0, deck + 2, z, bx0, f2Hi - 1, z, B.GLASS);
      fillBox(bx1, deck + 2, z, bx1, f2Hi - 1, z, B.GLASS);
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

  // Brick stoop (steps widening into yard)
  fillBox(cx - 2, f1, dz + 1, cx + 1, f1, dz + 2, B.BRICK); // landing
  for (let s = 1; s <= 3; s++) {
    fillBox(cx - 1 - s, f1, dz + 2 + s, cx + s, f1, dz + 2 + s, B.BRICK);
  }

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
    // Blackboard on back wall z=2, y3..6
    fillBox(bbX0, 3, 2, bbX1, 6, 2, B.BLACK_WOOL);
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

  // SERVING COUNTER along z=19 (SPRUCE_PLANKS bar, y2..3), x13..20
  fillBox(cfX0 + 1, 2, cfCounterZ, cfX1 - 1, 3, cfCounterZ, B.SPRUCE_PLANKS);
  // Keep barista cell clear: local (17,2,11) = mid-room
  // Coffee/cups on counter (HAY mugs at y=4)
  for (let bx2 = cfX0 + 1; bx2 <= cfX1 - 1; bx2 += 3) stamp(bx2, 4, cfCounterZ, B.HAY);

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
  // Blackboard (periodic table / 理科) on back wall z=2, y3..6
  fillBox(scX0 + 1, 3, 2, scX1 - 1, 6, 2, B.BLACK_WOOL);
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

  // Generic GF classrooms (3 and 4 remain standard)
  classroom_gf(34, 43);  // Classroom 3 (GF)
  // Classroom 2 (23-32) replaced by 理科室 above
  classroom_gf(58, 67);  // Classroom 4 (GF)

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
  // 8) BAKERY (パン屋) — ground floor, x45..56, z3..19.
  //    Baker NPC stands at local (50,2,18) = world (14,31,-32) — MUST stay AIR.
  //    Counter along z=19 (facing corridor at z=20). Baker behind counter at z=18.
  //    Partition wall at z=11: SALES front z12..19, WORKSHOP back z3..10.
  //    Teal accent wall (BLUE_WOOL) on sales-face of partition z=11.
  //    FIX C: genuine artisan bakery feel — glass display case, pendant lamps,
  //    proofing baskets, bread shelf, chalkboard menu, kraft tags.
  // ==========================================================================
  const bkX0 = 45, bkX1 = 56;           // bakery bay x extents
  const bkPartZ = 11;                    // partition wall between sales and workshop
  const bakerZ  = 18;                    // baker standing z (local)
  const counterZ = 19;                   // counter z (between baker and corridor)

  // ── PARTITION WALL (STONE_BRICKS base, teal face on sales side) ───────────
  fillBox(bkX0, 2, bkPartZ, bkX1, f1Hi, bkPartZ, B.STONE_BRICKS);
  // 2-wide × 3-tall passageway from sales to workshop (centred)
  fillBox(50, 2, bkPartZ, 51, 4, bkPartZ, B.AIR);
  // TEAL (BLUE_WOOL) sales-face of partition — covers stone face toward corridor
  fillBox(bkX0, 2, bkPartZ, bkX1, f1Hi, bkPartZ, B.BLUE_WOOL);
  fillBox(50, 2, bkPartZ, 51, 4, bkPartZ, B.AIR); // re-open passageway

  // ── CHALKBOARD MENU (BLACK_WOOL) west of doorway on teal wall, y=3..5 ─────
  // x=46..49 (leaves the doorway x=50..51 open, and x=45 is bay divider wall)
  fillBox(bkX0 + 1, 3, bkPartZ, 49, 5, bkPartZ, B.BLACK_WOOL);
  // Chalk-title row at y=6 (WHITE_WOOL strip: "MENU" header texture impression)
  fillBox(bkX0 + 1, 6, bkPartZ, 49, 6, bkPartZ, B.WHITE_WOOL);
  // Kraft/price tag accents east of doorway on teal wall: alternating CALCITE spots
  for (let kx = 52; kx <= 55; kx += 2) stamp(kx, 4, bkPartZ, B.CALCITE);

  // ── SALES COUNTER (SPRUCE_PLANKS bar) — x46..55, z=19, y2..3 ─────────────
  // Customer-facing side: z=20 corridor sees the warm wood front.
  // Baker side: z=18 (baker NPC stands here — kept AIR below y=5).
  fillBox(bkX0 + 1, 2, counterZ, bkX1 - 1, 3, counterZ, B.SPRUCE_PLANKS);
  // Keep baker NPC cell clear: x=50, y=2..f1Hi, z=18
  fillBox(50, 2, bakerZ, 50, f1Hi, bakerZ, B.AIR);

  // ── GLASS-FRONTED BREAD DISPLAY CASE (FIX C core feature) ────────────────
  // A 4-wide glass case built into the east end of the counter (x52..55, z=19)
  // replaces the plain hay-on-counter there.  Glass front at z=19 y2..4,
  // HAY loaves packed inside at z=18 (behind glass), SPRUCE_PLANKS case sides.
  fillBox(52, 2, counterZ, 55, 4, counterZ, B.GLASS);   // glass front panel
  fillBox(52, 2, counterZ, 52, 4, counterZ, B.SPRUCE_PLANKS); // west case wall
  // HAY loaves filling the case (at z=18 = counterZ-1, between east bay wall z=55
  // and the passageway area; baker cell x=50 is clear)
  for (let cx2 = 53; cx2 <= 55; cx2++) {
    stamp(cx2, 2, counterZ - 1, B.HAY);  // bottom row of loaves
    stamp(cx2, 3, counterZ - 1, B.HAY);  // upper row of loaves
  }
  // CALCITE case top (marble-effect display surface)
  fillBox(52, 4, counterZ, 55, 4, counterZ, B.CALCITE);

  // ── BREAD LOAVES on the open (west) counter top: HAY on SPRUCE top ────────
  // West section of counter x=46..51, tops at y=4 (above y=3 plank)
  for (let bx2 = bkX0 + 1; bx2 <= 51; bx2 += 2) stamp(bx2, 4, counterZ, B.HAY);

  // ── BREAD DISPLAY SHELF on east bay wall (x=56) — sales zone z=12..18 ─────
  // Two SPRUCE_PLANKS shelf planks at y=3 and y=5, lined with HAY loaves.
  // Kraft price tags: CALCITE spots between loaves.
  fillBox(bkX1, 3, 12, bkX1, 3, 18, B.SPRUCE_PLANKS); // lower shelf
  fillBox(bkX1, 5, 12, bkX1, 5, 18, B.SPRUCE_PLANKS); // upper shelf
  for (let sz = 12; sz <= 18; sz += 2) {
    stamp(bkX1, 4, sz, B.HAY);           // bread on lower shelf
    stamp(bkX1, 6, sz, B.HAY);           // bread on upper shelf
    if (sz < 18) stamp(bkX1, 4, sz + 1, B.CALCITE); // kraft tag between loaves
  }

  // ── PROOFING BASKETS on a low shelf at the back of the sales area z=12 ────
  // A short SPRUCE_PLANKS shelf on the west bay wall (x=45) at y=3, z=12..15.
  // Baskets = CALCITE bowl (base) + HAY (dough) stacked.
  fillBox(bkX0, 3, 12, bkX0, 3, 15, B.SPRUCE_PLANKS); // shelf plank on west wall
  for (let bz2 = 12; bz2 <= 15; bz2 += 2) {
    stamp(bkX0, 3, bz2,     B.CALCITE); // basket base (CALCITE "rattan" bowl)
    stamp(bkX0, 4, bz2,     B.HAY);     // rising dough in basket
    if (bz2 + 1 <= 15) stamp(bkX0, 3, bz2 + 1, B.CALCITE); // second basket
  }

  // ── PENDANT LAMPS over the sales counter (FIX C warm lighting) ───────────
  // Three lamps hanging over the counter row, each: CALCITE "shade" at y=f1Hi-1=6,
  // with a LANTERN below at y=5 casting warm amber glow.
  // Positions: x47, x50, x53 (spread across the counter width above z=19).
  if (B.LANTERN != null) {
    for (const lx of [47, 50, 53]) {
      stamp(lx, f1Hi - 1, counterZ - 1, B.CALCITE);  // lamp shade / housing
      stamp(lx, f1Hi - 2, counterZ - 1, B.LANTERN);  // pendant lantern below shade
    }
  }

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
  //     HAY "bread" emblems flanking the doorway at y=2, and a LANTERN above.
  //     Corridor side (z=21) gets the decorative elements.
  // ==========================================================================
  // 暖簾 lintel: BLUE_WOOL row at y=6, x48..51, z=20 (top of doorway arch)
  fillBox(48, 6, 20, 51, 6, 20, B.BLUE_WOOL);
  // HAY bread emblems flanking doorway at y=2, z=20 (corridor wall face)
  // placed on the SANDSTONE wall cells to either side of the doorway (x48, x51 still solid)
  stamp(48, 2, 20, B.HAY); // west emblem on wall (already solid here, so overwrites)
  stamp(51, 2, 20, B.HAY); // east emblem
  stamp(48, 3, 20, B.HAY); // second tier west
  stamp(51, 3, 20, B.HAY); // second tier east
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
  //    Wide straight staircase (3 wide: x6,7,8) rising y1→y8.
  //    Step run: z19→z12 (one step per z, rising from front to back).
  //    WHITE_WOOL railings, hole punched through deck y=8 for access.
  // ==========================================================================
  const wsX0 = 5, wsX1 = 10; // west stair bay x
  // Clear the stair bay (already cleared by room hollow)
  // Smooth stone stair treads: step s=0..6, z decreases (into building), y increases
  // tread s: z = 19-s*1, tread top y = 1+s
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;    // z of this tread (starts at z=19, moves toward z=13)
    const ty = f1 + s;    // tread top y = 1,2,3,4,5,6,7
    fillBox(6, f1, sz, 8, ty, sz, B.SMOOTH_STONE); // solid tread column (3 wide: x6..8)
    fillBox(6, ty + 1, sz, 8, ty + 2, sz, B.AIR);  // headroom above tread
  }
  // Landing at the top (z=12): solid SMOOTH_STONE up to deck y=8
  fillBox(6, f1, 12, 8, deck, 12, B.SMOOTH_STONE);
  // Punch opening through deck over stair run (z12..19) for floor-2 access
  fillBox(6, deck, 12, 8, deck + 2, 19, B.AIR);
  // Replace deck planks properly (keep solid under non-stair areas)
  fillBox(wsX0, deck, 2, wsX1, deck, 11, B.OAK_PLANKS); // rest of stair bay floor-2 deck
  // WHITE_WOOL railings on east side (x=9) along stair run
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;
    stamp(9, f1 + s + 1, sz, B.WHITE_WOOL);
    stamp(9, f1 + s + 2, sz, B.WHITE_WOOL);
  }
  // Railing cap (continuous WHITE_WOOL at railing top height)
  fillBox(9, f1 + 1, 12, 9, f1 + 7, 19, B.WHITE_WOOL);

  // ==========================================================================
  // 10) EAST STAIR TOWER — x80..82, z3..19, same stair design.
  // ==========================================================================
  const esX0 = 80, esX1 = 82; // east stair bay x
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;
    const ty = f1 + s;
    fillBox(80, f1, sz, 82, ty, sz, B.SMOOTH_STONE);
    fillBox(80, ty + 1, sz, 82, ty + 2, sz, B.AIR);
  }
  fillBox(80, f1, 12, 82, deck, 12, B.SMOOTH_STONE);
  fillBox(80, deck, 12, 82, deck + 2, 19, B.AIR);
  fillBox(esX0, deck, 2, esX1, deck, 11, B.OAK_PLANKS);
  // WHITE_WOOL railing on west side (x=79) is the divider wall; use east (end wall)
  // Actually use west face x=79 already exists as divider wall; add railing on x=79
  for (let s = 0; s <= 6; s++) {
    const sz = 19 - s;
    stamp(79, f1 + s + 1, sz, B.WHITE_WOOL);
    stamp(79, f1 + s + 2, sz, B.WHITE_WOOL);
  }
  fillBox(79, f1 + 1, 12, 79, f1 + 7, 19, B.WHITE_WOOL);

  // ==========================================================================
  // 11) SECOND FLOOR — corridor z21..25 + 6 classrooms + stair access.
  //     Floor y=8 (OAK_PLANKS on deck). Interior y=9..14. Ceiling y=15 (roof).
  // ==========================================================================
  const g1 = deck + 1; // floor-2 interior bottom = y9
  const g2 = f2Hi;     // floor-2 interior top    = y14

  // Hollow out the entire second floor air space
  fillBox(5, g1, 2, 82, g2, 25, B.AIR);
  // Lay OAK_PLANKS floor overlay on deck
  fillBox(5, deck, 2, 82, deck, 25, B.OAK_PLANKS);

  // Re-open stair shafts through floor-2 deck (z12..19 above each stair)
  fillBox(6, deck, 12, 8, deck + 2, 19, B.AIR);
  fillBox(80, deck, 12, 82, deck + 2, 19, B.AIR);

  // Floor-2 BAY DIVIDER WALLS (same x positions, z2..19, y9..14)
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

    // BLACKBOARD on back wall z=2, y=g1+1..g2-1 (y10..13)
    fillBox(bbX0, g1 + 1, 2, bbX1, g2 - 1, 2, B.BLACK_WOOL);

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
  // The floor-2 corridor back wall (SANDSTONE) at y=9..14 covers z=20 but
  // we can paint over it with the arrow after it's placed.
  // Base row: y=7 (floor-1 ceiling zone is y=7 = f1Hi; wall exists there already)
  fillBox(6, 7, 20, 9, 7, 20, B.WHITE_WOOL);   // arrow base row (y=7 is f1Hi)
  // Mid: x7, x8 at y=8 (deck level, floor is OAK_PLANKS but wall at x5/x10 is SANDSTONE;
  // at interior x6..9 the deck sits at y=8, but z=20 is wall — paint it)
  stamp(7, 8, 20, B.WHITE_WOOL);
  stamp(8, 8, 20, B.WHITE_WOOL);
  // Tip at y=9: floor-2 corridor back wall (SANDSTONE) already set above; paint it
  stamp(7, 9, 20, B.WHITE_WOOL);
  // "2F" marker at y=10: paint over the floor-2 corridor back wall
  stamp(7, 10, 20, B.BLUE_WOOL);
  stamp(8, 10, 20, B.BLUE_WOOL);

  // ── EAST STAIR MARKER ──────────────────────────────────────────────────────
  // Lintel: BLUE_WOOL span at y=6, x79..82, z=20
  fillBox(79, 6, 20, 82, 6, 20, B.BLUE_WOOL);
  if (B.LANTERN != null) {
    stamp(80, 6, 21, B.LANTERN);
    stamp(81, 6, 21, B.LANTERN);
  }
  // UP-ARROW above east stair doorway
  fillBox(80, 7, 20, 82, 7, 20, B.WHITE_WOOL); // arrow base row
  stamp(80, 8, 20, B.WHITE_WOOL);
  stamp(81, 8, 20, B.WHITE_WOOL);
  stamp(81, 9, 20, B.WHITE_WOOL); // arrow tip
  // "2F" marker
  stamp(80, 10, 20, B.BLUE_WOOL);
  stamp(81, 10, 20, B.BLUE_WOOL);

  // Landing LANTERNs at top of stairs (floor-2 deck y=8, z=12)
  if (B.LANTERN != null) {
    stamp(7,  deck, 12, B.LANTERN); // west stair landing local (7,8,12)
    stamp(81, deck, 12, B.LANTERN); // east stair landing local (81,8,12)
  }

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

  // OAK tree 2: east of entrance
  const t2x = 62, t2z = 38;
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

  // 防球ネット (anti-ball net): tall GREEN_WOOL net panels along east side of yard
  // Poles at x=72 and x=76, z=28..52, GREEN_WOOL net panels
  for (let nz = 28; nz <= 52; nz += 6) {
    stamp(72, 1, nz, B.OAK_LOG); stamp(72, 2, nz, B.OAK_LOG);
    stamp(72, 3, nz, B.OAK_LOG); stamp(72, 4, nz, B.OAK_LOG);
    stamp(72, 5, nz, B.OAK_LOG);
  }
  for (let nz = 28; nz <= 52; nz++) {
    fillBox(72, 3, nz, 72, 5, nz, B.GREEN_WOOL); // net panels at top
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
}
