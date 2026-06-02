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
//     Classroom 1 (GF):  x12..21
//     Classroom 2 (GF):  x23..32
//     Classroom 3 (GF):  x34..43
//     BAKERY:            x45..56
//     Classroom 4 (GF):  x58..67
//     Classroom 5 (GF):  x69..78
//     East stair tower:  x80..82
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
  // Corridor back wall at z=20 (between corridor and room zone)
  fillBox(5, 2, 20, 82, f1Hi, 20, B.SANDSTONE); // corridor back wall, full width

  // Doorways per bay through the corridor back wall (z=20): 2-wide × 4-tall (y2..5)
  // Bay centres: Classroom1 cx=16, Class2 cx=27, Class3 cx=38, Bakery cx=50, Class4 cx=62, Class5 cx=73
  // Each doorway: 2 wide, centered in bay
  // West stair bay — single opening
  fillBox(6, 2, 20, 9, 5, 20, B.AIR); // west stair bay doorway
  // Classrooms 1-5 and Bakery
  for (const [bayX0, bayX1] of [[12,21],[23,32],[34,43],[45,56],[58,67],[69,78]]) {
    const doorCx = Math.floor((bayX0 + bayX1) / 2);
    fillBox(doorCx - 1, 2, 20, doorCx, 5, 20, B.AIR);
  }
  // East stair bay doorway
  fillBox(80, 2, 20, 82, 5, 20, B.AIR);

  // Corridor COIR mat just inside entrance
  fillBox(cx - 1, f1, 23, cx, f1, 25, B.DRY_GRASS);

  // ==========================================================================
  // 6) BAY DIVIDER WALLS — SANDSTONE, z2..19 (room depth), y2..7.
  //    Positions: x11, x22, x33, x44, x57, x68, x79.
  // ==========================================================================
  for (const divX of [11, 22, 33, 44, 57, 68, 79]) {
    fillBox(divX, 2, 2, divX, f1Hi, 19, B.SANDSTONE);
  }

  // ==========================================================================
  // 7) GROUND FLOOR INTERIORS — hollow room zones.
  //    Room zone: z3..19, y2..7 interior.
  // ==========================================================================
  // Hollow out all bays (the dividers + corridor back wall are already solid)
  fillBox(5, 2, 3, 82, f1Hi, 19, B.AIR);

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

  // Classrooms 1-5 (ground floor)
  classroom_gf(12, 21);  // Classroom 1 — west side
  classroom_gf(23, 32);  // Classroom 2
  classroom_gf(34, 43);  // Classroom 3
  classroom_gf(58, 67);  // Classroom 4
  classroom_gf(69, 78);  // Classroom 5 — east side

  // ==========================================================================
  // 8) BAKERY (パン屋) — ground floor, x45..56, z3..19.
  //    Baker NPC stands at local (50,2,18) = world (14,31,-32).
  //    Counter along z=19 (facing corridor at z=20). Baker behind counter at z=18.
  //    Partition wall at z=11: SALES front z12..19, WORKSHOP back z3..10.
  //    Teal accent wall (BLUE_WOOL) on z=11 sales-face.
  // ==========================================================================
  const bkX0 = 45, bkX1 = 56;           // bakery bay x extents
  const bkPartZ = 11;                    // partition wall between sales and workshop
  const bakerZ  = 18;                    // baker standing z (local)
  const counterZ = 19;                   // counter z (between baker and corridor)

  // Already hollowed by room hollow above. Add partition wall (STONE_BRICKS)
  fillBox(bkX0, 2, bkPartZ, bkX1, f1Hi, bkPartZ, B.STONE_BRICKS);
  // 2-wide × 3-tall door through partition at bay centre
  fillBox(50, 2, bkPartZ, 51, 4, bkPartZ, B.AIR);

  // TEAL ACCENT WALL: paint sales-face of partition (z=bkPartZ) BLUE_WOOL
  fillBox(bkX0, 2, bkPartZ, bkX1, f1Hi, bkPartZ, B.BLUE_WOOL);
  fillBox(50, 2, bkPartZ, 51, 4, bkPartZ, B.AIR); // re-open door

  // CHALKBOARD MENU on teal wall: BLACK_WOOL strip, mid-height
  // x=46..49 (stays west of door at x=50..51), y=3..5
  fillBox(bkX0 + 1, 3, bkPartZ, 49, 5, bkPartZ, B.BLACK_WOOL);

  // SALES COUNTER: SPRUCE_PLANKS bar along z=19 (x46..55), y2..3
  fillBox(bkX0 + 1, 2, counterZ, bkX1 - 1, 3, counterZ, B.SPRUCE_PLANKS);
  // Keep baker cell CLEAR: local x=50, y=2..7, z=18
  fillBox(50, 2, bakerZ, 50, f1Hi, bakerZ, B.AIR);
  // Bread loaves (HAY) on top of counter, y=4
  for (let bx2 = bkX0 + 1; bx2 <= bkX1 - 1; bx2 += 2) stamp(bx2, 4, counterZ, B.HAY);

  // GLASS bread display case on counter (east end): y2..4, z=19 face
  fillBox(bkX1 - 3, 2, counterZ, bkX1 - 1, 4, counterZ, B.GLASS);
  stamp(bkX1 - 3, 2, counterZ - 1, B.HAY); // bread inside case
  stamp(bkX1 - 2, 2, counterZ - 1, B.HAY);

  // PENDANT LAMPS over counter (sales zone): HAY shade + CALCITE bulb, y7 (ceiling)
  for (let lx = bkX0 + 2; lx <= bkX1 - 2; lx += 4) {
    stamp(lx, 6, counterZ - 1, B.HAY);    // warm shade
    stamp(lx, 7, counterZ - 1, B.CALCITE); // bulb at ceiling
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

  // ── Floor-2 classroom helper ───────────────────────────────────────────────
  const classroom_2f = (rx0, rx1) => {
    const rw = rx1 - rx0 + 1;
    const bbW = Math.min(rw - 2, 9);
    const bbX0 = rx0 + 1;
    const bbX1 = Math.min(rx1 - 1, bbX0 + bbW - 1);
    // Blackboard on back wall z=2, y10..13
    fillBox(bbX0, g1 + 1, 2, bbX1, g2 - 1, 2, B.BLACK_WOOL);
    // Teacher desk + chair at z=3..4
    const tDx = Math.floor((rx0 + rx1) / 2) - 1;
    stamp(tDx,     g1, 3, B.CRAFTING_TABLE);
    stamp(tDx + 1, g1, 3, B.CRAFTING_TABLE);
    stamp(tDx,     g1, 4, B.SPRUCE_PLANKS);
    stamp(tDx + 1, g1, 4, B.SPRUCE_PLANKS);
    // Student desk grid: 3 cols × 4 rows
    const cols3 = [
      rx0 + Math.floor(rw * 0.2),
      rx0 + Math.floor(rw * 0.5),
      rx0 + Math.floor(rw * 0.8),
    ];
    for (const dz2 of [7, 10, 13, 16]) {
      for (const dx of cols3) {
        stamp(dx, g1, dz2, B.SPRUCE_PLANKS);
        stamp(dx, g1, dz2 + 1, B.BIRCH_PLANKS);
      }
    }
  };

  // Floor-2: 6 classrooms (incl. above bakery = classroom)
  classroom_2f(12, 21);  // 2F Classroom 1
  classroom_2f(23, 32);  // 2F Classroom 2
  classroom_2f(34, 43);  // 2F Classroom 3
  classroom_2f(45, 56);  // 2F Classroom 4 (above bakery)
  classroom_2f(58, 67);  // 2F Classroom 5
  classroom_2f(69, 78);  // 2F Classroom 6

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
