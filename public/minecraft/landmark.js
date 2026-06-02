// landmark.js — voxel recreation of "プチヘルメース" (Petit Hermès),
// a bakery inside a renovated old 2-story Japanese elementary school
// (北広島町立南方小学校). Self-contained ES module, stamped into a host world.
//
// Coordinate frame (LOCAL): origin (0,0,0) = south-west corner at GROUND level.
//   +x = building length (east), +z = toward the front yard / viewer, +y = up.
//   y=0 is the solid ground/platform layer; structures sit at y>=1.
// stamp(x, y, z, id) places a block; the host clamps out-of-range writes.
//
// World mapping: world = (LM_X+x, LM_Y+y, LM_Z+z) where LM_X=-12, LM_Y=29, LM_Z=-36.
//   Baker NPC stands at world (8,31,-29) = local (20,2,7) — kept clear (behind counter).
//   Player spawns at world (8.5,31,-12) = local (20.5,2,24) facing -z (toward building).
//   Front facade plane: local z=12 = world z=-24.
//
// FLOOR PLAN (corridor + classroom layout, matching the real school):
//   Building footprint: x 3..35 (33 wide), z 1..12 (12 deep)
//   Interior: x 4..34, z 2..11
//
//   GROUND FLOOR (y 1..6 interior):
//     CORRIDOR (廊下): z 9..11, full building width — runs along front facade.
//       Three doorways (2 wide, 3 tall) breach the corridor back wall (z=9) at:
//         west classroom x~6..7, bakery x~19..20, east classroom x~28..29.
//     BAY DIVIDER WALLS at x=14 (west|center) and x=26 (center|east) from z=2..11.
//       Each bay has a doorway from the corridor (z=9 wall).
//     West CLASSROOM (x 4..13, z 2..8): desks + chairs + blackboard (west wall face).
//     Center BAKERY (x 14..26, z 2..8):
//       Baker at local (20,2,7) stands BEHIND the counter (counter at z=8).
//       Teal accent wall on the back wall (z=2 inner face), pendant lamps above counter.
//       Partition wall with door at z=5 divides SALES (z 5..8) from WORKSHOP (z 2..4).
//     East CLASSROOM (x 27..34, z 2..8): desks + chairs + blackboard (east wall face).
//     STAIRCASE: x 32..33, z 2..7, east wall of building. Rises from y=1 to y=7.
//
//   SECOND FLOOR (y 8..12 interior):
//     CORRIDOR (廊下): z 9..11, full building width.
//     Three preserved CLASSROOMS (same bay x-splits):
//       West 2F classroom  (x 4..13,  z 2..8)
//       Center 2F classroom (x 14..26, z 2..8)
//       East 2F classroom  (x 27..34, z 2..8)
//       Each: blackboard, teacher desk, grid of student desks + chairs.

// Dimensions: 40 wide × 48 deep × 26 clearH
//   Building footprint: x 3..35, z 1..12
//   Floor 1: y1..6 interior (ceiling deck at y=7)
//   Floor 2: y8..12 interior (roof slab at y=13)
export const LANDMARK = { w: 40, d: 48, clearH: 26 };

export function buildPetitHermes(stamp, B) {
  const { w, d, clearH } = LANDMARK;
  const cx = Math.floor(w / 2); // central axis of the facade / entrance = x=20

  // small helpers -----------------------------------------------------------
  const fillBox = (x0, y0, z0, x1, y1, z1, id) => {
    const [ax, bx] = x0 <= x1 ? [x0, x1] : [x1, x0];
    const [ay, by] = y0 <= y1 ? [y0, y1] : [y1, y0];
    const [az, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
    for (let x = ax; x <= bx; x++)
      for (let y = ay; y <= by; y++)
        for (let z = az; z <= bz; z++) stamp(x, y, z, id);
  };
  // hollow rectangular wall ring (4 vertical walls), no top/bottom
  const wallRing = (x0, z0, x1, y0, y1, z1, id) => {
    fillBox(x0, y0, z0, x1, y1, z0, id); // back wall (low z)
    fillBox(x0, y0, z1, x1, y1, z1, id); // front wall (high z)
    fillBox(x0, y0, z0, x0, y1, z1, id); // west wall
    fillBox(x1, y0, z0, x1, y1, z1, id); // east wall
  };

  // ==========================================================================
  // 1) SITE PREP — clear a clean column, lay a flat schoolyard ground.
  // ==========================================================================
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      // clear air above ground
      for (let y = 1; y <= clearH; y++) stamp(x, y, z, B.AIR);
      // ground at y=0: gravel yard, with a dirt/grass border strip
      const border = x === 0 || x === w - 1 || z === 0 || z === d - 1;
      const inner = x === 1 || x === w - 2 || z === 1 || z === d - 2;
      stamp(x, 0, z, border ? B.GRASS : inner ? B.DIRT : B.GRAVEL);
    }
  }

  // ==========================================================================
  // 2) SCHOOL BUILDING SHELL — two full floors, generously proportioned.
  //    Footprint: x 3..35 (33 blocks wide), z 1..12 (12 blocks deep).
  //    Floor 1 interior: y2..6 (5 blocks tall).
  //    Floor 2 interior: y8..12 (5 blocks tall).
  //    Floor-2 deck at y=7, roof slab at y=13.
  // ==========================================================================
  const bx0 = 3,  bx1 = w - 4;    // x 3..35
  const bz0 = 1,  bz1 = 12;       // z 1..12
  const f1  = 1,  f1Top = 7;      // floor-1 planks y=1, ceiling/deck at y=7
  const f2Top = 13;               // roof slab at y=13; floor-2 interior y=8..12

  fillBox(bx0, 0,    bz0, bx1, 0,    bz1, B.SANDSTONE);   // foundation pad
  fillBox(bx0, f1Top, bz0, bx1, f1Top, bz1, B.SANDSTONE); // floor-2 deck
  fillBox(bx0, f2Top, bz0, bx1, f2Top, bz1, B.SMOOTH_STONE); // flat roof slab

  // Perimeter walls for both floors (solid first; windows carved after).
  wallRing(bx0, bz0, bx1, f1, f1Top - 1, bz1, B.SANDSTONE);         // floor 1
  wallRing(bx0, bz0, bx1, f1Top + 1, f2Top - 1, bz1, B.SANDSTONE);  // floor 2

  // Long horizontal window bands (2-wide panes, 1-wide mullions).
  // Applied on the front (z=bz1) and back (z=bz0) walls of each floor.
  const windowBand = (yLo, yHi, zWall) => {
    for (let x = bx0 + 2; x <= bx1 - 2; x++) {
      if (((x - (bx0 + 2)) % 3) !== 2) fillBox(x, yLo, zWall, x, yHi, zWall, B.GLASS);
    }
  };
  // Floor-1 windows (front and back): y2..f1Top-2 = y2..5 (keep y6 solid under deck)
  windowBand(f1 + 1, f1Top - 2, bz1); // floor 1 front
  windowBand(f1 + 1, f1Top - 2, bz0); // floor 1 back
  // Floor-2 windows: y=f1Top+2..f2Top-2 = y9..11
  windowBand(f1Top + 2, f2Top - 2, bz1); // floor 2 front
  windowBand(f1Top + 2, f2Top - 2, bz0); // floor 2 back
  // Side windows (west/east walls) on both floors
  for (let z = bz0 + 2; z <= bz1 - 2; z++) {
    if (((z - (bz0 + 2)) % 3) !== 2) {
      fillBox(bx0, f1 + 1, z, bx0, f1Top - 2, z, B.GLASS);
      fillBox(bx1, f1 + 1, z, bx1, f1Top - 2, z, B.GLASS);
      fillBox(bx0, f1Top + 2, z, bx0, f2Top - 2, z, B.GLASS);
      fillBox(bx1, f1Top + 2, z, bx1, f2Top - 2, z, B.GLASS);
    }
  }

  // 2nd-floor OPEN WALKWAY (balcony) one block deep in front of the facade.
  const balZ = bz1 + 1; // z=13, just in front of the building
  fillBox(bx0, f1Top, balZ, bx1, f1Top, balZ, B.SMOOTH_STONE); // walkway deck
  for (let x = bx0; x <= bx1; x++) {
    if ((x - bx0) % 2 === 0) stamp(x, f1Top + 1, balZ, B.WHITE_WOOL);
    else stamp(x, f1Top + 1, balZ, B.GLASS);
  }
  fillBox(bx0, f1Top + 2, balZ, bx1, f1Top + 2, balZ, B.WHITE_WOOL); // handrail cap
  // Roof parapet edge
  wallRing(bx0, bz0, bx1, f2Top + 1, f2Top + 1, bz1, B.SMOOTH_STONE);

  // ==========================================================================
  // 3) ENTRANCE — central CALCITE pillars, lintel, glass doors, BRICK steps.
  //    The doorway is 2 wide × 4 tall so it feels generous, not cramped.
  //    Player spawn: world (8.5,31,-12) = local (20.5,2,24), faces -z → building.
  //    Front entrance centered on cx=20, at facade plane z=bz1=12.
  // ==========================================================================
  const dz = bz1; // doorway in the front facade plane (z=12)
  // Two light-stone pillars flanking a 2-wide opening centered on cx=20
  fillBox(cx - 2, f1, dz, cx - 2, f1Top, dz, B.CALCITE);
  fillBox(cx + 2, f1, dz, cx + 2, f1Top, dz, B.CALCITE);
  fillBox(cx - 2, f1, dz + 1, cx - 2, f1Top, dz + 1, B.CALCITE); // pillars project out
  fillBox(cx + 2, f1, dz + 1, cx + 2, f1Top, dz + 1, B.CALCITE);
  // Lintel across the top of the opening
  fillBox(cx - 2, f1Top, dz, cx + 2, f1Top, dz, B.SMOOTH_STONE);
  fillBox(cx - 2, f1Top, dz + 1, cx + 2, f1Top, dz + 1, B.SMOOTH_STONE);
  // Doorway opening: 2 wide (cx-1..cx) × full height — fully open so a player can walk in
  fillBox(cx - 1, f1, dz, cx, f1Top - 1, dz, B.AIR);
  // SHOPFRONT SIGNAGE — school entrance reading as a SHOP (パン屋).
  // School CREST + name plate above the door:
  fillBox(cx - 2, f1Top - 1, dz, cx + 2, f1Top - 1, dz, B.STONE_BRICKS); // name plate band
  fillBox(cx - 1, f1Top - 1, dz, cx + 1, f1Top - 1, dz, B.CALCITE);      // crest disc
  stamp(cx, f1Top, dz, B.CALCITE);                        // crest crown above the band
  // Teal/white accent pilasters framing the entrance (alternating stripe)
  for (let y = f1 + 1; y <= f1Top - 1; y++) {
    const stripe = (y % 2 === 0) ? B.BLUE_WOOL : B.WHITE_WOOL;
    stamp(cx - 3, y, dz, stripe);
    stamp(cx + 3, y, dz, stripe);
  }
  // HAY "bread" emblems at sign height beside the door
  stamp(cx - 3, f1, dz, B.HAY);
  stamp(cx + 3, f1, dz, B.HAY);
  // Teal 暖簾 (shop curtain) panels hanging in the top of the doorway
  stamp(cx - 1, f1Top - 1, dz, B.BLUE_WOOL);
  stamp(cx,     f1Top - 1, dz, B.BLUE_WOOL);

  // BRICK stoop — landing flush with the threshold then stepping DOWN into yard
  fillBox(cx - 2, 1, dz + 1, cx + 1, 1, dz + 2, B.BRICK); // landing
  for (let s = 1; s <= 3; s++) {
    const sz = dz + 2 + s;
    fillBox(cx - 1 - s, 1, sz, cx + s, 1, sz, B.BRICK); // widening brick treads
  }

  // ==========================================================================
  // 4) GROUND-FLOOR INTERIOR HOLLOWING + FLOOR
  //    Interior shell: ix0..ix1 (x=4..34), iz0..iz1 (z=2..11), y=1..f1Top-1.
  // ==========================================================================
  const ix0 = bx0 + 1, ix1 = bx1 - 1; // interior x 4..34
  const iz0 = bz0 + 1, iz1 = bz1 - 1; // interior z 2..11
  const fy0  = f1;                      // ground-floor y=1 (plank floor level)
  const fyTop = f1Top - 1;              // highest interior y on floor 1 (y=6)

  // Hollow out the whole ground floor and lay OAK_PLANKS floor
  fillBox(ix0, fy0 + 1, iz0, ix1, fyTop, iz1, B.AIR);
  fillBox(ix0, fy0,     iz0, ix1, fy0,   iz1, B.OAK_PLANKS); // warm wood floor

  // ==========================================================================
  // 5) CORRIDOR (廊下) — GROUND FLOOR
  //    z 9..11, full width x 4..34. The front wall (z=11) has windows inherited
  //    from the shell window band. A corridor back wall sits at z=9 (SANDSTONE),
  //    with doorways into each bay.
  //    The doorway at z=12 (facade) is already open from section 3.
  //    COIR DOORMAT just inside the entrance threshold.
  // ==========================================================================
  const corrZ0 = 9;   // corridor back wall z (between corridor and classroom bays)
  const corrZ1 = 11;  // corridor front z (against facade z=12)

  // Corridor back wall (SANDSTONE, full width, y1..y6) — classroom doors breach this
  fillBox(ix0, fy0, corrZ0, ix1, fyTop, corrZ0, B.SANDSTONE);
  // Re-open air at the corridor floor level (planks already laid above)
  fillBox(ix0, fy0 + 1, corrZ0, ix1, fyTop, corrZ0, B.SANDSTONE); // solid wall first
  // (floor fill already placed OAK_PLANKS at fy0 on this z too)

  // Three doorways through corridor back wall (z=corrZ0=9), 2 wide × 3 tall:
  //   West classroom doorway:  x=6..7
  //   Bakery doorway:          x=19..20 (centered on baker at x=20)
  //   East classroom doorway:  x=28..29
  fillBox(6,  fy0 + 1, corrZ0, 7,  fy0 + 3, corrZ0, B.AIR); // west classroom door
  fillBox(19, fy0 + 1, corrZ0, 20, fy0 + 3, corrZ0, B.AIR); // bakery door
  fillBox(28, fy0 + 1, corrZ0, 29, fy0 + 3, corrZ0, B.AIR); // east classroom door

  // COIR DOORMAT just inside the entrance threshold (in the corridor)
  fillBox(cx - 1, fy0, corrZ1 - 1, cx, fy0, corrZ1, B.DRY_GRASS);

  // ==========================================================================
  // 6) BAY DIVIDER WALLS — x=14 (west|bakery) and x=26 (bakery|east)
  //    Run z 2..11 (full interior depth including corridor), y=1..6.
  //    Each has a doorway from the corridor (z=9) side already open by the
  //    corridor wall cuts. The corridor portion is left open (corridor itself
  //    is open air between x=4..34, z=9..11).
  // ==========================================================================
  const divW = 14;   // west divider x (between west classroom and bakery)
  const divE = 26;   // east divider x (between bakery and east classroom)

  // West divider (x=14), z=2..corrZ0-1 (z=2..8) — solid classroom walls
  fillBox(divW, fy0, iz0, divW, fyTop, corrZ0 - 1, B.SANDSTONE); // z 2..8

  // East divider (x=26), z=2..corrZ0-1 (z=2..8)
  fillBox(divE, fy0, iz0, divE, fyTop, corrZ0 - 1, B.SANDSTONE); // z 2..8

  // ==========================================================================
  // 7) WEST CLASSROOM (教室) — ground floor, x 4..13, z 2..8
  //    Blackboard on BACK wall (z=iz0=2, facing +z into the room).
  //    Students face north (-z toward blackboard), walking in from corridor they
  //    see the blackboard straight ahead at the back of the room.
  // ==========================================================================
  // BLACKBOARD: large BLACK_WOOL slab on the back wall (z=2, inner face), y2..5, x5..12
  fillBox(ix0 + 1, fy0 + 2, iz0, ix0 + 8, fy0 + 5, iz0, B.BLACK_WOOL); // blackboard on back wall
  // Teacher desk (CRAFTING_TABLE) just in front of blackboard, centered in room width
  stamp(ix0 + 3, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE); // teacher desk
  stamp(ix0 + 5, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE); // teacher desk (wide)
  stamp(ix0 + 3, fy0 + 1, iz0 + 2, B.SPRUCE_PLANKS);  // teacher chair (+z behind desk from blackboard perspective)
  stamp(ix0 + 5, fy0 + 1, iz0 + 2, B.SPRUCE_PLANKS);
  // Student desks (2 columns × 3 rows): desk faces blackboard (at z=2).
  // Students sit at desk at z=deskZ, chair at z=deskZ+1 (behind).
  // Row positions: z=4, z=6, z=7 — row 3 at z=7 fits inside classroom (z<=8).
  // Columns: x=6, x=10
  for (const deskZ of [iz0 + 2, iz0 + 4, iz0 + 5]) { // z = 4, 6, 7
    for (const deskX of [ix0 + 2, ix0 + 6]) {          // x = 6, 10
      stamp(deskX, fy0 + 1, deskZ, B.SPRUCE_PLANKS);     // student desk top
      stamp(deskX, fy0 + 1, deskZ + 1, B.BIRCH_PLANKS);  // chair (+z from desk)
    }
  }

  // ==========================================================================
  // 8) CENTER BAY — BAKERY (パン屋) — ground floor, x 14..26, z 2..8
  //    Baker NPC stands at local (20,2,7) = world (8,31,-29) behind the counter.
  //    Counter at z=8 (front face of bakery facing corridor at z=9).
  //    Partition wall at z=5 splits SALES (z 5..8) from WORKSHOP (z 2..4).
  //    Teal accent wall on north face (z=2, the building back wall inner face).
  // ==========================================================================
  const bkX0 = divW + 1;  // x=15 (east of west divider)
  const bkX1 = divE - 1;  // x=25 (west of east divider)
  // bakery floor already laid; clear interior just in case dividers overwrote air
  fillBox(bkX0, fy0 + 1, iz0, bkX1, fyTop, corrZ0 - 1, B.AIR);

  // PARTITION WALL (STONE_BRICKS) at z=5 — splits sales from workshop
  // z=5 is between workshop (z 2..4) and sales (z 5..8)
  const bkPartZ = 5; // partition wall z
  fillBox(bkX0, fy0 + 1, bkPartZ, bkX1, fyTop, bkPartZ, B.STONE_BRICKS);
  // Door through partition: x=19..20, y=2..4 (2 wide, 3 tall), centered near baker
  fillBox(19, fy0 + 1, bkPartZ, 20, fy0 + 3, bkPartZ, B.AIR);

  // TEAL ACCENT WALL — paint ONLY the partition face (z=bkPartZ=5) teal.
  // The sales floor (z=6..8) is left open air so customers can see the counter,
  // and the baker at z=7 has clear sightlines to the corridor entrance.
  fillBox(bkX0, fy0 + 1, bkPartZ, bkX1, fyTop, bkPartZ, B.BLUE_WOOL);
  // Re-open partition door through the teal fill (x=19..20, 2-wide, 3-tall)
  fillBox(19, fy0 + 1, bkPartZ, 20, fy0 + 3, bkPartZ, B.AIR);

  // SALES COUNTER — SPRUCE_PLANKS, 2 blocks tall, runs along the front of the
  // bakery bay (z=8), between baker (z=7) and the corridor (z=9).
  // Baker at local x=20, z=7 stands BEHIND the counter.
  // Counter z=8 (front/customer-facing face toward corridor), x=15..25.
  const counterZ = corrZ0 - 1; // z=8 — counter line (between baker at z=7 and corridor at z=9)
  fillBox(bkX0 + 1, fy0 + 1, counterZ, bkX1 - 1, fy0 + 2, counterZ, B.SPRUCE_PLANKS); // counter body
  // Keep baker standing cell clear (x=20, y=2..fyTop, z=7)
  fillBox(bkX0, fy0 + 1, corrZ0 - 2, bkX1, fyTop, corrZ0 - 2, B.AIR); // clear z=7 (baker row)
  fillBox(bkX0, fy0 + 1, counterZ, bkX1, fyTop, counterZ, B.AIR);      // clear above counter top
  fillBox(bkX0 + 1, fy0 + 1, counterZ, bkX1 - 1, fy0 + 2, counterZ, B.SPRUCE_PLANKS); // re-place counter

  // GLASS BREAD DISPLAY CASE on top of east end of counter (x=22..24, z=8)
  fillBox(22, fy0 + 3, counterZ, 24, fy0 + 4, counterZ, B.SPRUCE_PLANKS); // case frame
  fillBox(22, fy0 + 3, counterZ, 24, fy0 + 4, counterZ, B.GLASS);         // glass front
  stamp(22, fy0 + 3, counterZ - 1, B.HAY);  // bread loaf inside
  stamp(23, fy0 + 3, counterZ - 1, B.HAY);

  // BREAD LOAVES displayed ON TOP of the counter (HAY blocks)
  for (let bx = bkX0 + 1; bx <= 21; bx += 2) {
    stamp(bx, fy0 + 3, counterZ, B.HAY); // loaves on customer-side counter top
  }

  // PENDANT LAMPS over the bakery — CALCITE "bulb" + HAY "warm shade"
  // Hang just below ceiling (fyTop=6), lamp at y=5, bulb at y=6.
  for (let lx = bkX0 + 2; lx <= bkX1 - 2; lx += 4) {
    stamp(lx, fyTop - 1, counterZ - 1, B.HAY);    // warm lamp shade (HAY = amber)
    stamp(lx, fyTop,     counterZ - 1, B.CALCITE); // bright bulb touching ceiling
  }

  // CHALKBOARD MENU on the teal back wall (z=bkPartZ), at eye height, sales side
  fillBox(17, fy0 + 2, bkPartZ, 23, fyTop - 1, bkPartZ, B.BLACK_WOOL);
  // Re-open partition door through chalkboard/teal
  fillBox(19, fy0 + 1, bkPartZ, 20, fy0 + 3, bkPartZ, B.AIR);

  // ==========================================================================
  // 9) BAKERY WORKSHOP (工房) — back of center bay, x 15..25, z 2..4
  //    Accessed through the partition door at x=19..20, z=5.
  //    Ovens on the back wall (z=2), prep tables, sink, fermentation jars.
  // ==========================================================================
  // Workshop is already hollowed. Back wall = z=iz0=2 (building back wall).
  // Three FURNACE "ovens" against the back wall (z=iz0=2)
  stamp(16, fy0 + 1, iz0, B.FURNACE);
  stamp(16, fy0 + 2, iz0, B.FURNACE); // 2-tall oven stack
  stamp(19, fy0 + 1, iz0, B.FURNACE);
  stamp(19, fy0 + 2, iz0, B.FURNACE);
  stamp(22, fy0 + 1, iz0, B.FURNACE);
  stamp(22, fy0 + 2, iz0, B.FURNACE);

  // Prep / kneading table in the middle of the workshop
  fillBox(17, fy0 + 1, iz0 + 1, 21, fy0 + 1, iz0 + 1, B.SPRUCE_PLANKS); // prep table
  stamp(18, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE); // kneading station
  stamp(19, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE);

  // Levain fermentation jars: GLASS body + BLUE_WOOL lids on a shelf (z=4, near partition)
  fillBox(23, fy0 + 2, bkPartZ - 1, 25, fy0 + 2, bkPartZ - 1, B.SPRUCE_PLANKS); // jar shelf
  for (let jx = 23; jx <= 25; jx++) {
    stamp(jx, fy0 + 3, bkPartZ - 1, B.GLASS);
    stamp(jx, fy0 + 4, bkPartZ - 1, B.BLUE_WOOL);
  }

  // Flour sacks (HAY/WHITE_WOOL) stacked in the back-west corner of workshop
  stamp(15, fy0 + 1, iz0, B.HAY);
  stamp(15, fy0 + 2, iz0, B.HAY);
  stamp(15, fy0 + 3, iz0, B.WHITE_WOOL);
  stamp(15, fy0 + 1, iz0 + 1, B.WHITE_WOOL);
  stamp(15, fy0 + 2, iz0 + 1, B.HAY);

  // Sink basin (CALCITE + WATER) in the east corner of the workshop
  stamp(24, fy0 + 1, iz0, B.CALCITE);
  stamp(24, fy0 + 1, iz0 + 1, B.WATER);

  // ==========================================================================
  // 10) EAST CLASSROOM (教室) — ground floor, x 27..34, z 2..8
  //     Blackboard on BACK wall (z=iz0=2, facing +z into the room).
  //     Staircase (x=32..33) occupies the back-east corner — desks avoid it.
  // ==========================================================================
  const ecX0 = divE + 1; // x=27
  const ecX1 = ix1;      // x=34
  fillBox(ecX0, fy0 + 1, iz0, ecX1, fyTop, corrZ0 - 1, B.AIR); // hollow (dividers may fill)

  // BLACKBOARD on the back wall (z=2), x=27..31 (avoid staircase at x=32..33)
  fillBox(ecX0, fy0 + 2, iz0, ecX0 + 4, fy0 + 5, iz0, B.BLACK_WOOL); // blackboard
  // Teacher desk in front of blackboard
  stamp(ecX0 + 1, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE);
  stamp(ecX0 + 3, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE);
  stamp(ecX0 + 1, fy0 + 1, iz0 + 2, B.SPRUCE_PLANKS);
  stamp(ecX0 + 3, fy0 + 1, iz0 + 2, B.SPRUCE_PLANKS);
  // Student desks (2 columns × 3 rows): x=28,30; z=4,6,7
  // Avoid staircase columns (x=32..33); keep well within x=27..31
  for (const deskZ of [iz0 + 2, iz0 + 4, iz0 + 5]) { // z = 4, 6, 7
    for (const deskX of [ecX0 + 1, ecX0 + 3]) {        // x = 28, 30
      stamp(deskX, fy0 + 1, deskZ, B.SPRUCE_PLANKS);
      stamp(deskX, fy0 + 1, deskZ + 1, B.BIRCH_PLANKS);
    }
  }

  // ==========================================================================
  // 11) WIDE INTERIOR STAIRCASE — east side of building (x=32..33), z=2..7.
  //     Rises from y=1 at z=2 to the 2nd-floor deck (y=7) landing at z=8.
  //     Located against the east wall, inside the east classroom bay.
  //     Steps are clear of all classroom furniture.
  // ==========================================================================
  const stX0 = ix1 - 2, stX1 = ix1 - 1; // x=32, x=33
  const stZ_base = iz0;                   // z=2, bottom of staircase
  const numSteps = f1Top - 1;             // 6 steps

  for (let s = 0; s < numSteps; s++) {
    const sz = stZ_base + s;   // z position of this tread: z=2,3,4,5,6,7
    const ty = fy0 + s;        // tread top at y = 1,2,3,4,5,6
    fillBox(stX0, fy0, sz, stX1, ty, sz, B.SMOOTH_STONE); // solid stair column
    fillBox(stX0, ty + 1, sz, stX1, ty + 2, sz, B.AIR);   // headroom above tread
  }
  // Landing platform at the top — connects to 2F classroom floor (y=f1Top=7)
  fillBox(stX0, fy0, stZ_base + numSteps, stX1, f1Top, stZ_base + numSteps, B.SMOOTH_STONE);

  // Punch a clear opening through the floor-2 deck (y=f1Top=7) over the step run
  fillBox(stX0, f1Top, stZ_base, stX1, f1Top + 2, stZ_base + numSteps - 1, B.AIR);

  // STAIR RAILING — WHITE_WOOL posts on west side (x=stX0-1=31)
  for (let s = 0; s < numSteps; s++) {
    stamp(stX0 - 1, fy0 + s + 1, stZ_base + s, B.WHITE_WOOL);
    stamp(stX0 - 1, fy0 + s + 2, stZ_base + s, B.WHITE_WOOL);
  }

  // ==========================================================================
  // 12) SECOND FLOOR — CORRIDOR (廊下) + THREE CLASSROOMS
  //     Floor at y=f1Top=7 (OAK_PLANKS on the sandstone deck), interior y=8..12.
  //     Corridor: z=9..11, full width. Classroom bays: z=2..8 (same x splits).
  // ==========================================================================
  const gy0 = f1Top + 1; // 2F interior floor y=8 (first air cell above deck)
  const gy1 = f2Top - 1; // 2F interior ceiling y=12

  // Hollow out the whole second floor and lay OAK_PLANKS floor on top of the deck
  fillBox(ix0, gy0, iz0, ix1, gy1, iz1, B.AIR);
  fillBox(ix0, f1Top, iz0, ix1, f1Top, iz1, B.OAK_PLANKS); // 2F classroom floor (on deck)

  // Re-open the stair shaft in the 2F floor layer (z=2..7, landing at z=8 stays solid)
  fillBox(stX0, f1Top, stZ_base, stX1, f1Top + 1, stZ_base + numSteps - 1, B.AIR);

  // ---- 2F CORRIDOR BACK WALL (z=corrZ0=9) with doorways ----
  fillBox(ix0, gy0, corrZ0, ix1, gy1, corrZ0, B.SANDSTONE); // corridor back wall
  // Three doorways (2 wide × 3 tall): same x as ground floor
  fillBox(6,  gy0, corrZ0, 7,  gy0 + 2, corrZ0, B.AIR); // west classroom door
  fillBox(19, gy0, corrZ0, 20, gy0 + 2, corrZ0, B.AIR); // center classroom door
  fillBox(28, gy0, corrZ0, 29, gy0 + 2, corrZ0, B.AIR); // east classroom door

  // ---- 2F BAY DIVIDER WALLS (x=14 and x=26, z=2..8) ----
  fillBox(divW, gy0, iz0, divW, gy1, corrZ0 - 1, B.SANDSTONE); // west|center divider
  fillBox(divE, gy0, iz0, divE, gy1, corrZ0 - 1, B.SANDSTONE); // center|east divider

  // ---- 2F WEST CLASSROOM (x=4..13, z=2..8) ----
  // Blackboard on BACK wall (z=iz0=2, facing +z into room). Students face -z toward it.
  fillBox(ix0, gy0, iz0, divW - 1, gy1, corrZ0 - 1, B.AIR); // hollow first
  // Blackboard: x=5..12, z=2, y=9..11
  fillBox(ix0 + 1, gy0 + 1, iz0, ix0 + 8, gy1 - 1, iz0, B.BLACK_WOOL);
  // Teacher desk + chair in front of blackboard (z=3..4)
  stamp(ix0 + 3, gy0, iz0 + 1, B.CRAFTING_TABLE);
  stamp(ix0 + 5, gy0, iz0 + 1, B.CRAFTING_TABLE);
  stamp(ix0 + 3, gy0, iz0 + 2, B.SPRUCE_PLANKS);
  stamp(ix0 + 5, gy0, iz0 + 2, B.SPRUCE_PLANKS);
  // Student desks — 2 columns × 3 rows at z=4,6,7
  for (const deskZ of [iz0 + 2, iz0 + 4, iz0 + 5]) { // z=4,6,7
    for (const deskX of [ix0 + 2, ix0 + 6]) {          // x=6,10
      stamp(deskX, gy0, deskZ, B.SPRUCE_PLANKS);
      stamp(deskX, gy0, deskZ + 1, B.BIRCH_PLANKS);
    }
  }

  // ---- 2F CENTER CLASSROOM (x=15..25, z=2..8) ----
  // Blackboard on BACK wall (z=iz0=2).
  fillBox(divW + 1, gy0, iz0, divE - 1, gy1, corrZ0 - 1, B.AIR);
  // Blackboard: x=15..25, z=2, y=9..11
  fillBox(bkX0, gy0 + 1, iz0, bkX1, gy1 - 1, iz0, B.BLACK_WOOL);
  // Teacher desk + chair in front of blackboard
  stamp(cx - 1, gy0, iz0 + 1, B.CRAFTING_TABLE);
  stamp(cx,     gy0, iz0 + 1, B.CRAFTING_TABLE);
  stamp(cx - 1, gy0, iz0 + 2, B.SPRUCE_PLANKS);
  stamp(cx,     gy0, iz0 + 2, B.SPRUCE_PLANKS);
  // Student desks — 2 columns × 3 rows
  for (const deskZ of [iz0 + 2, iz0 + 4, iz0 + 5]) { // z=4,6,7
    for (const deskX of [cx - 3, cx + 2]) {
      stamp(deskX, gy0, deskZ, B.SPRUCE_PLANKS);
      stamp(deskX, gy0, deskZ + 1, B.BIRCH_PLANKS);
    }
  }

  // ---- 2F EAST CLASSROOM (x=27..34, z=2..8) ----
  // Blackboard on BACK wall (z=iz0=2). Staircase at x=32..33 — desks avoid it.
  fillBox(divE + 1, gy0, iz0, ix1, gy1, corrZ0 - 1, B.AIR);
  // Blackboard: x=27..31, z=2 (avoid staircase shaft x=32..33)
  fillBox(ecX0, gy0 + 1, iz0, ecX0 + 4, gy1 - 1, iz0, B.BLACK_WOOL);
  // Teacher desk + chair
  stamp(ecX0 + 1, gy0, iz0 + 1, B.CRAFTING_TABLE);
  stamp(ecX0 + 3, gy0, iz0 + 1, B.CRAFTING_TABLE);
  stamp(ecX0 + 1, gy0, iz0 + 2, B.SPRUCE_PLANKS);
  stamp(ecX0 + 3, gy0, iz0 + 2, B.SPRUCE_PLANKS);
  // Student desks — 2 columns × 3 rows (x=28..30, avoid staircase at x=32..33)
  for (const deskZ of [iz0 + 2, iz0 + 4, iz0 + 5]) { // z=4,6,7
    for (const deskX of [ecX0 + 1, ecX0 + 3]) {        // x=28,30
      stamp(deskX, gy0, deskZ, B.SPRUCE_PLANKS);
      stamp(deskX, gy0, deskZ + 1, B.BIRCH_PLANKS);
    }
  }

  // Window ledge trim on 2F side walls
  fillBox(ix0, f1Top, iz0, ix0, f1Top, iz1, B.WHITE_WOOL); // west ledge
  fillBox(ix1, f1Top, iz0, ix1, f1Top, iz1, B.WHITE_WOOL); // east ledge

  // ==========================================================================
  // 13) YARD DETAILS — oak tree, stacked tires, farm field, river.
  // ==========================================================================
  // Single OAK tree near the building, off to one side
  const tx = bx0 + 4, tz = bz1 + 8;
  fillBox(tx, 1, tz, tx, 5, tz, B.OAK_LOG);
  fillBox(tx - 2, 5, tz - 2, tx + 2, 6, tz + 2, B.OAK_LEAVES);
  fillBox(tx - 1, 7, tz - 1, tx + 1, 7, tz + 1, B.OAK_LEAVES);
  stamp(tx, 8, tz, B.OAK_LEAVES);
  stamp(tx, 5, tz, B.OAK_LOG);
  stamp(tx, 6, tz, B.OAK_LOG);

  // 2-3 stacked tires (rings of BLACK_WOOL) in the yard
  const tireRing = (px, pz, py) => {
    stamp(px - 1, py, pz, B.BLACK_WOOL);
    stamp(px + 1, py, pz, B.BLACK_WOOL);
    stamp(px, py, pz - 1, B.BLACK_WOOL);
    stamp(px, py, pz + 1, B.BLACK_WOOL);
  };
  const pirX = cx + 6, pirZ = bz1 + 7;
  tireRing(pirX, pirZ, 1);
  tireRing(pirX, pirZ, 2);
  tireRing(pirX, pirZ, 3);

  // ==========================================================================
  // 14) FARM FIELD — tilled DIRT plot with alternating rows of wheat & veg.
  // ==========================================================================
  const fx0 = 4, fx1 = 11;
  const fz0 = 28, fz1 = 37;
  fillBox(fx0, 0, fz0, fx1, 0, fz1, B.DIRT);
  for (let z = fz0; z <= fz1; z++) {
    if ((z - fz0) % 2 !== 0) continue;
    const crop = (((z - fz0) / 2) % 2 === 0) ? B.WHEAT_CROP : B.VEG_CROP;
    for (let x = fx0; x <= fx1; x++) stamp(x, 1, z, crop);
  }
  for (let x = fx0 - 1; x <= fx1 + 1; x++) {
    stamp(x, 0, fz0 - 1, B.GRASS);
    stamp(x, 0, fz1 + 1, B.GRASS);
  }
  for (let z = fz0 - 1; z <= fz1 + 1; z++) {
    stamp(fx0 - 1, 0, z, B.GRASS);
    stamp(fx1 + 1, 0, z, B.GRASS);
  }

  // ==========================================================================
  // 15) RIVER — 3-wide WATER channel along the east edge of the lot.
  // ==========================================================================
  const rivX0 = 34, rivX1 = 36;
  const rivZ0 = 24, rivZ1 = 42;
  fillBox(rivX0, 0, rivZ0, rivX1, 0, rivZ1, B.WATER);
  for (let z = rivZ0; z <= rivZ1; z++) {
    stamp(rivX0 - 1, 0, z, B.DIRT);
    stamp(rivX1 + 1, 0, z, B.DIRT);
    stamp(rivX0 - 2, 0, z, B.GRASS);
    stamp(rivX1 + 2, 0, z, B.GRASS);
  }
  for (let x = rivX0 - 1; x <= rivX1 + 1; x++) {
    stamp(x, 0, rivZ0 - 1, B.GRASS);
    stamp(x, 0, rivZ1 + 1, B.GRASS);
  }

  // ==========================================================================
  // 16) BUSHES and FOREST EDGE
  // ==========================================================================
  const bush = (bx, bz) => {
    stamp(bx, 1, bz, B.OAK_LEAVES);
    stamp(bx + 1, 1, bz, B.OAK_LEAVES);
    stamp(bx, 1, bz + 1, B.OAK_LEAVES);
    stamp(bx, 2, bz, B.OAK_LEAVES);
  };
  bush(fx1 + 3, fz0 + 1);
  bush(fx1 + 3, fz1 - 2);

  const forestTree = (ftx, ftz, h) => {
    fillBox(ftx, 1, ftz, ftx, h, ftz, B.OAK_LOG);
    fillBox(ftx - 2, h - 1, ftz - 2, ftx + 2, h, ftz + 2, B.OAK_LEAVES);
    fillBox(ftx - 1, h + 1, ftz - 1, ftx + 1, h + 1, ftz + 1, B.OAK_LEAVES);
    stamp(ftx, h + 2, ftz, B.OAK_LEAVES);
    stamp(ftx, h - 1, ftz, B.OAK_LOG);
    stamp(ftx, h, ftz, B.OAK_LOG);
    stamp(ftx, 1, ftz + 2, B.GRASS);
  };
  forestTree(4, 44, 6);
  forestTree(9, 46, 5);
  forestTree(14, 45, 6);
  forestTree(2, 39, 4);

  // ==========================================================================
  // 17) SATOYAMA — 棚田 (terraced rice paddies).
  // ==========================================================================
  const ricePaddy = (x0, z0, x1, z1) => {
    wallRing(x0, z0, x1, 1, 1, z1, B.DIRT);
    for (let x = x0; x <= x1; x++) {
      stamp(x, 1, z0, B.GRASS);
      stamp(x, 1, z1, B.GRASS);
    }
    for (let z = z0; z <= z1; z++) {
      stamp(x0, 1, z, B.GRASS);
      stamp(x1, 1, z, B.GRASS);
    }
    fillBox(x0 + 1, 1, z0 + 1, x1 - 1, 1, z1 - 1, B.WATER);
    for (let z = z0 + 1; z <= z1 - 1; z++) {
      for (let x = x0 + 1; x <= x1 - 1; x++) {
        if ((z - (z0 + 1)) % 3 === 2) continue;
        stamp(x, 1, z, B.WHEAT_CROP);
      }
    }
  };
  ricePaddy(14, 18, 22, 24);
  ricePaddy(14, 26, 23, 33);
  ricePaddy(15, 35, 23, 41);

  // ==========================================================================
  // 18) FARMSTEAD EXTRAS
  // ==========================================================================
  fillBox(26, 0, 28, 30, 0, 32, B.DIRT);
  for (let z = 28; z <= 32; z++) {
    if ((z - 28) % 2 !== 0) continue;
    const crop = (((z - 28) / 2) % 2 === 0) ? B.VEG_CROP : B.WHEAT_CROP;
    for (let x = 26; x <= 30; x++) stamp(x, 1, z, crop);
  }
  fillBox(25, 0, 18, 28, 0, 21, B.DIRT);
  for (let x = 25; x <= 28; x++) {
    stamp(x, 1, 18, B.VEG_CROP);
    stamp(x, 1, 20, B.VEG_CROP);
  }
}
