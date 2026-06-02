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
//   Baker NPC stands at world (8,31,-29) = local (20,2,7) — kept clear.
//   Player spawns at world (8.5,31,-12) = local (20.5,2,24) facing -z (toward building).
//   Front facade plane: local z=12 = world z=-24.

// Dimensions: 40 wide × 48 deep × 26 clearH
//   Building footprint: x 3..35, z 1..12 (extended back wall from z=2→z=1 for extra depth)
//   Floor 1: y1..6 interior (ceiling deck at y=7) — 5 blocks tall, no longer cramped
//   Floor 2: y8..12 interior (roof slab at y=13)  — 5 blocks tall classroom
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
  //    Floor 1 interior: y2..6 (5 blocks tall — no longer cramped).
  //    Floor 2 interior: y8..12 (5 blocks tall).
  //    Floor-2 deck at y=7, roof slab at y=13.
  // ==========================================================================
  const bx0 = 3,  bx1 = w - 4;    // x 3..35
  const bz0 = 1,  bz1 = 12;       // z 1..12  (back wall pushed to z=1 for depth)
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
  // Doorway opening: 2 wide (cx-1..cx) × 4 tall (y1..y4) — fully open so a player
  // can walk straight in; glass transom sits above in the lintel band.
  fillBox(cx - 1, f1, dz, cx, f1Top - 1, dz, B.AIR);  // clear full height of opening
  // SHOPFRONT SIGNAGE — keep school entrance reading as a SHOP (パン屋).
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
  // 4) PETIT HERMÈS INTERIOR — ground floor.
  //    Interior shell: ix0..ix1 (x=4..34), iz0..iz1 (z=2..11), y=1..f1Top-1.
  //    Layout (back→front, low-z→high-z):
  //      Workshop 工房: z=2..4  (low z = back wall of building)
  //      Partition wall:  z=5   (STONE_BRICKS, with two doorways)
  //      Sales 販売:    z=6..11 (high z = toward entrance / customer)
  //    Baker NPC stands at local (20,2,7) — in sales zone, behind the counter.
  // ==========================================================================
  const ix0 = bx0 + 1, ix1 = bx1 - 1; // interior x 4..34
  const iz0 = bz0 + 1, iz1 = bz1 - 1; // interior z 2..11
  const fy0  = f1;                     // ground-floor y=1 (plank floor level)
  const fyTop = f1Top - 1;             // highest interior y on floor 1 (y=6)

  // Hollow out the whole ground floor and lay OAK_PLANKS floor
  fillBox(ix0, fy0 + 1, iz0, ix1, fyTop, iz1, B.AIR);
  fillBox(ix0, fy0,     iz0, ix1, fy0,   iz1, B.OAK_PLANKS); // warm wood floor

  // ---- Partition wall splitting 工房 (back) from 販売 (front) ----
  // zWall=5: between workshop (z2..4) and sales (z6..11)
  // Baker at local z=7 is in the sales zone, well clear of the partition.
  const zWall = iz0 + 3;   // z=5
  const zSales = zWall + 1; // z=6 (first sales column, behind counter)
  fillBox(ix0, fy0 + 1, zWall, ix1, fyTop, zWall, B.STONE_BRICKS);
  // West doorway through partition (2 wide, 3 tall): x=ix0+2..ix0+3
  fillBox(ix0 + 2, fy0 + 1, zWall, ix0 + 3, fy0 + 3, zWall, B.AIR);
  // East doorway through partition (2 wide, 3 tall): x=ix1-3..ix1-2
  fillBox(ix1 - 3, fy0 + 1, zWall, ix1 - 2, fy0 + 3, zWall, B.AIR);
  // Ensure the baker's standing position (x=20, z=7) and its neighbours are clear
  fillBox(ix0, fy0 + 1, zSales, ix1, fyTop, zSales, B.AIR); // clear z=6 row
  fillBox(ix0, fy0 + 1, zSales + 1, ix1, fyTop, zSales + 1, B.AIR); // z=7 (baker row)

  // ====================== 販売スペース (SALES FLOOR) — front half ===============
  // Teal (BLUE_WOOL) accent WALL on the back of the counter (the baker-facing wall),
  // i.e., the partition face on the sales side (z=zWall) is already stone; we paint
  // the full sales-zone side wall on west and east teal for ambiance.
  fillBox(ix0, fy0 + 1, zSales, ix0, fyTop, iz1, B.BLUE_WOOL); // west accent wall
  fillBox(ix1, fy0 + 1, zSales, ix1, fyTop, iz1, B.BLUE_WOOL); // east accent wall
  // Teal accent strip behind the counter on the partition wall (the wall customers see)
  fillBox(ix0 + 1, fy0 + 1, zWall, ix1 - 1, fyTop, zWall, B.BLUE_WOOL); // teal back wall

  // Re-open the partition doorways that the teal fill may have covered
  fillBox(ix0 + 2, fy0 + 1, zWall, ix0 + 3, fy0 + 3, zWall, B.AIR);
  fillBox(ix1 - 3, fy0 + 1, zWall, ix1 - 2, fy0 + 3, zWall, B.AIR);

  // COIR DOORMAT just inside the entrance threshold
  fillBox(cx - 1, fy0, iz1 - 1, cx, fy0, iz1, B.DRY_GRASS);

  // LONG SALES COUNTER — SPRUCE_PLANKS, 2 blocks tall, running most of the sales
  // width. Baker stands at local (20,2,7) BEHIND the counter (z=7); counter sits
  // at z=8..9 (between baker and customers). Local baker z=7 must stay clear.
  const cZ0 = zSales + 2; // z=8 (counter back face, toward baker)
  const cZ1 = zSales + 3; // z=9 (counter front face, customer side)
  const cX0 = ix0 + 2;    // x=6
  const cX1 = ix1 - 2;    // x=32
  fillBox(cX0, fy0 + 1, cZ0, cX1, fy0 + 2, cZ1, B.SPRUCE_PLANKS); // counter body (2 tall)
  // Clear the baker row (z=7) and behind to ensure NPC is not walled in
  fillBox(ix0, fy0 + 1, zSales + 1, ix1, fyTop, zSales + 1, B.AIR);

  // PENDANT LAMPS over the sales counter — CALCITE "bulb" + HAY "warm shade"
  // Hang just below the ceiling (y=fyTop=6 is ceiling), lamp body at y=fyTop-1=5,
  // shade block at y=fyTop=6 so it looks like a ceiling-mounted pendant.
  // Place every 4 blocks along the counter length.
  for (let lx = cX0 + 1; lx <= cX1 - 1; lx += 4) {
    stamp(lx, fyTop - 1, cZ0 + 1, B.HAY);     // warm lamp shade (HAY = amber)
    stamp(lx, fyTop,     cZ0 + 1, B.CALCITE);  // bright bulb touching ceiling
  }

  // GLASS BREAD DISPLAY CASE on the counter top, EAST end.
  // A SPRUCE_PLANKS frame 4 wide × 2 tall, glazed front face, HAY loaves inside.
  const caX0 = cX1 - 5, caX1 = cX1 - 1; // x=27..31
  fillBox(caX0, fy0 + 3, cZ0, caX1, fy0 + 4, cZ1, B.SPRUCE_PLANKS); // glass-case frame
  fillBox(caX0 + 1, fy0 + 3, cZ1, caX1 - 1, fy0 + 4, cZ1, B.GLASS); // glazed front
  fillBox(caX0 + 1, fy0 + 3, cZ0 + 1, caX1 - 1, fy0 + 3, cZ0 + 1, B.HAY); // bread loaves inside

  // BREAD LOAVES displayed ON TOP of the counter (HAY blocks, alternating positions)
  for (let x = cX0 + 1; x <= caX0 - 2; x += 2) {
    stamp(x, fy0 + 3, cZ1, B.HAY); // loaves on the customer-side counter top
  }

  // CHALKBOARD MENU — large BLACK_WOOL board on the teal back wall (z=zWall),
  // center of the sales zone, at eye height. This is the first thing customers
  // see when they walk in and look toward the back.
  const mbX0 = cx - 5, mbX1 = cx + 5; // centered on cx=20
  fillBox(mbX0, fy0 + 2, zWall, mbX1, fyTop - 1, zWall, B.BLACK_WOOL); // chalkboard slab

  // SHELF on the west sales wall (x=ix0) with CALCITE "kraft-bag" props
  fillBox(ix0, fy0 + 3, cZ0 + 1, ix0, fy0 + 3, cZ1, B.SPRUCE_PLANKS); // shelf board
  for (let z = cZ0 + 1; z <= cZ1; z++) stamp(ix0, fy0 + 4, z, B.CALCITE); // props

  // SMALL DISPLAY FRIDGE against the east sales wall (BLACK_WOOL body + GLASS front)
  const frZ0 = cZ0, frZ1 = cZ1;
  fillBox(ix1 - 1, fy0 + 1, frZ0, ix1 - 1, fyTop - 1, frZ1, B.BLACK_WOOL);
  fillBox(ix1 - 1, fy0 + 1, frZ0, ix1 - 1, fy0 + 3, frZ0, B.GLASS); // glass door

  // ====================== 工房 (WORKSHOP) — back half (z=2..4) =================
  // Three FURNACE "ovens" against the back wall (low z = iz0=2)
  for (let i = 0; i < 3; i++) {
    const ovX = ix0 + 2 + i * 4;
    fillBox(ovX, fy0 + 1, iz0, ovX, fy0 + 2, iz0, B.FURNACE); // 2-tall oven stacks
  }
  // Prep tables (SPRUCE_PLANKS + CRAFTING_TABLE) in the middle of the workshop
  fillBox(ix0 + 2, fy0 + 1, iz0 + 1, ix0 + 6, fy0 + 1, iz0 + 1, B.SPRUCE_PLANKS);
  stamp(ix0 + 3, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE); // kneading station
  stamp(ix0 + 4, fy0 + 1, iz0 + 1, B.CRAFTING_TABLE);
  fillBox(ix1 - 6, fy0 + 1, iz0 + 1, ix1 - 3, fy0 + 1, iz0 + 1, B.SPRUCE_PLANKS);
  // Levain fermentation jars: GLASS body + BLUE_WOOL lids, on a shelf
  const jarShelfX0 = ix1 - 5, jarShelfZ = zWall - 1; // z=4 (back side of partition)
  fillBox(jarShelfX0, fy0 + 2, jarShelfZ, jarShelfX0 + 3, fy0 + 2, jarShelfZ, B.SPRUCE_PLANKS);
  for (let x = jarShelfX0; x <= jarShelfX0 + 3; x++) {
    stamp(x, fy0 + 3, jarShelfZ, B.GLASS);
    stamp(x, fy0 + 4, jarShelfZ, B.BLUE_WOOL);
  }
  // Flour sacks (HAY/WHITE_WOOL) stacked in the back-west corner
  fillBox(ix0 + 1, fy0 + 1, iz0, ix0 + 1, fy0 + 3, iz0, B.HAY);
  stamp(ix0 + 1, fy0 + 4, iz0, B.WHITE_WOOL);
  stamp(ix0 + 2, fy0 + 1, iz0, B.WHITE_WOOL);
  stamp(ix0 + 2, fy0 + 2, iz0, B.HAY);
  // Sink basin (CALCITE) + WATER, east wall of workshop
  const skX = ix1 - 1;
  fillBox(skX, fy0 + 1, iz0, skX, fy0 + 1, iz0 + 1, B.CALCITE);
  stamp(skX, fy0 + 1, iz0, B.WATER);
  // Wall shelves along workshop west wall
  fillBox(ix0, fy0 + 3, iz0, ix0, fy0 + 3, iz0 + 1, B.SPRUCE_PLANKS);

  // ==========================================================================
  // 5) WIDE INTERIOR STAIRCASE — east side of building, rises from ground floor
  //    up to the 2nd-floor classroom.
  //
  //    Layout (verified for climbability):
  //      • 2 blocks wide: x = stX0..stX1 = ix1-2..ix1-1 = 32..33
  //      • Runs +z direction (back wall toward front): z = iz0 .. iz0+numSteps-1
  //      • 6 steps, each +1y (tread top y = fy0+s) and +1z
  //        step 0: z=2, tread-top y=1; step 5: z=7, tread-top y=6
  //      • Landing at z=8, y=f1Top=7 (classroom floor)
  //      • Hole punched through the floor-2 deck (y=f1Top=7) above the whole run
  //        + extra air headroom above, so each tread has >=2 clear blocks above it.
  //
  //    Player headroom check (player height ≈1.8 blocks):
  //      steps 0-3: the next step's tread + interior air easily provides 2+ clear y
  //      steps 4-5: ceiling is at f1Top=7; deck hole opens y=7 above those steps ✓
  //
  //    No x-overlap with baker (x=20), workshop furnaces, or sales counter.
  // ==========================================================================
  const stX0 = ix1 - 2, stX1 = ix1 - 1; // x=32, x=33
  const stZ_base = iz0;                   // z=2, bottom of staircase
  const numSteps = f1Top - 1;             // 6 steps (y1→y6, then land at y7)

  for (let s = 0; s < numSteps; s++) {
    const sz = stZ_base + s;     // z position of this tread
    const ty = fy0 + s;          // tread top at y = 1, 2, 3, 4, 5, 6
    // Fill from y=fy0 up to ty (solid riser column supporting the tread)
    fillBox(stX0, fy0, sz, stX1, ty, sz, B.SMOOTH_STONE);
    // Clear the two blocks of headroom above each tread
    fillBox(stX0, ty + 1, sz, stX1, ty + 2, sz, B.AIR);
  }
  // Landing platform at the top — connects to classroom floor (y=f1Top=7)
  fillBox(stX0, fy0, stZ_base + numSteps, stX1, f1Top, stZ_base + numSteps, B.SMOOTH_STONE);

  // Punch a clear opening through the floor-2 deck (y=f1Top=7) ONLY above the step run
  // (z=stZ_base..stZ_base+numSteps-1 = z=2..7), NOT over the landing (z=8) which stays
  // solid as the classroom floor.  Clear y=f1Top and the two cells above for full headroom
  // while cresting the stairs.
  fillBox(stX0, f1Top, stZ_base, stX1, f1Top + 2, stZ_base + numSteps - 1, B.AIR);

  // STAIR RAILING — WHITE_WOOL posts on the west side of the staircase (x=stX0-1)
  // to make it visually obvious and guide the player upward.
  for (let s = 0; s < numSteps; s++) {
    stamp(stX0 - 1, fy0 + s + 1, stZ_base + s, B.WHITE_WOOL); // post level with tread top
    stamp(stX0 - 1, fy0 + s + 2, stZ_base + s, B.WHITE_WOOL); // post top rail height
  }

  // ==========================================================================
  // 6) 教室 (CLASSROOM) — second floor, accessed from the staircase landing.
  //    y=8..12 interior, spanning the full building width (ix0..ix1) and depth.
  //    Features: big blackboard, teacher desk + chair, grid of student desks + chairs.
  //
  //    Stair landing at (x=32..33, y=7, z=iz0+6=8) — player steps onto classroom
  //    floor at y=7 (OAK_PLANKS over the deck) and can walk the full room.
  //    Windows are inherited from the building shell window bands (y9..11).
  // ==========================================================================
  const gy0 = f1Top + 1; // classroom interior floor y=8 (first air cell above deck)
  const gy1 = f2Top - 1; // classroom interior ceiling y=12

  // Hollow out the classroom and lay OAK_PLANKS floor on top of the deck
  fillBox(ix0, gy0, iz0, ix1, gy1, iz1, B.AIR);
  fillBox(ix0, f1Top, iz0, ix1, f1Top, iz1, B.OAK_PLANKS); // classroom floor (on deck)

  // Re-open the stair shaft in the classroom floor layer (z=2..7, NOT the landing at z=8).
  // The landing at z=stZ_base+numSteps=8 keeps its OAK_PLANKS from the floor fill above,
  // so the player lands on a solid floor block when cresting the stairs.
  fillBox(stX0, f1Top, stZ_base, stX1, f1Top + 1, stZ_base + numSteps - 1, B.AIR);

  // BLACKBOARD — big BLACK_WOOL slab covering most of the back (low-z) wall,
  // from mid-height to near-ceiling: ix0+2..ix1-2, y=gy0+1..gy1-1, z=iz0.
  fillBox(ix0 + 2, gy0 + 1, iz0, ix1 - 2, gy1 - 1, iz0, B.BLACK_WOOL);

  // TEACHER'S DESK — CRAFTING_TABLE in front of the blackboard, centered on cx=20.
  // Teacher chair = SPRUCE_PLANKS one block south (+z) from the desk.
  stamp(cx - 1, gy0, iz0 + 1, B.CRAFTING_TABLE);  // teacher desk left
  stamp(cx,     gy0, iz0 + 1, B.CRAFTING_TABLE);  // teacher desk right
  stamp(cx - 1, gy0, iz0 + 2, B.SPRUCE_PLANKS);   // teacher chair (behind desk)
  stamp(cx,     gy0, iz0 + 2, B.SPRUCE_PLANKS);

  // STUDENT DESKS — a tidy 4-column × 3-row grid.
  //   Each desk: SPRUCE_PLANKS at (dx, gy0, dz).
  //   Each chair: BIRCH_PLANKS one block behind the desk at (dx, gy0, dz+1).
  //   The two blocks differ in colour so they read as desk + stool.
  //
  //   Room interior: z = iz0..iz1 = 2..11.
  //   Teacher area:  z = iz0+1..iz0+2 = 3..4 (desk at z=3, chair at z=4).
  //   Student rows:  z = iz0+3, iz0+5, iz0+7 = 5, 7, 9 (step=2).
  //   Chair behind:  z = dz+1 = 6, 8, 10 — all ≤ iz1-1=10 ✓
  //   Columns: 4 seats spaced every 6 x: x = ix0+3, +9, +15, +21 = 7,13,19,25.
  const deskCols = [ix0 + 3, ix0 + 9, ix0 + 15, ix0 + 21]; // x = 7, 13, 19, 25
  const deskRowsSafe = [iz0 + 3, iz0 + 5, iz0 + 7];         // z = 5, 7, 9 (step 2)
  for (const dr of deskRowsSafe) {
    for (const dc of deskCols) {
      if (dc > ix1 - 2) continue; // guard east wall
      stamp(dc, gy0, dr,     B.SPRUCE_PLANKS); // desk top
      stamp(dc, gy0, dr + 1, B.BIRCH_PLANKS);  // chair (lighter shade behind desk)
    }
  }

  // Extra classroom windows on the side walls (fill top band so room feels bright)
  // Side-wall windows are already placed in the building window band above.
  // Add a WHITE_WOOL window ledge to make them pop.
  fillBox(ix0, f1Top, iz0, ix0, f1Top, iz1, B.WHITE_WOOL); // west ledge
  fillBox(ix1, f1Top, iz0, ix1, f1Top, iz1, B.WHITE_WOOL); // east ledge

  // ==========================================================================
  // 7) YARD DETAILS — oak tree, stacked tires, farm field, river.
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
  // 8) FARM FIELD — tilled DIRT plot with alternating rows of wheat & veg.
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
  // 9) RIVER — 3-wide WATER channel along the east edge of the lot.
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
  // 10) BUSHES and FOREST EDGE
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
  // 11) SATOYAMA — 棚田 (terraced rice paddies).
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
  // 12) FARMSTEAD EXTRAS
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
