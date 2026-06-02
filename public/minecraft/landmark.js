// landmark.js — voxel recreation of "プチヘルメース" (Petit Hermès),
// a bakery inside a renovated old 2-story Japanese elementary school
// (北広島町立南方小学校). Self-contained ES module, stamped into a host world.
//
// Coordinate frame (LOCAL): origin (0,0,0) = south-west corner at GROUND level.
//   +x = building length (east), +z = toward the front yard / viewer, +y = up.
//   y=0 is the solid ground/platform layer; structures sit at y>=1.
// stamp(x, y, z, id) places a block; the host clamps out-of-range writes.

export const LANDMARK = { w: 40, d: 48, clearH: 26 };

export function buildPetitHermes(stamp, B) {
  const { w, d, clearH } = LANDMARK;
  const cx = Math.floor(w / 2); // central axis of the facade / entrance

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

  // Building footprint along the back of the lot.
  const bx0 = 3, bx1 = w - 4;       // x 3..35
  const bz0 = 2, bz1 = 12;          // z 2..12 (z=12 = front facade toward yard)
  const f1 = 1, f1Top = 5;          // floor 1: y1..5 (ceiling at y5)
  const f2Top = 9;                  // floor 2: y5..9 (roof slab at y9)

  // ==========================================================================
  // 2) SCHOOL BUILDING — cream concrete (SANDSTONE), two floors, window bands.
  // ==========================================================================
  // Solid interior floors / slabs first, then carve walls + windows.
  fillBox(bx0, 0, bz0, bx1, 0, bz1, B.SANDSTONE);          // foundation pad
  fillBox(bx0, f1Top, bz0, bx1, f1Top, bz1, B.SANDSTONE);  // floor-2 deck
  fillBox(bx0, f2Top, bz0, bx1, f2Top, bz1, B.SMOOTH_STONE); // flat roof slab

  // Perimeter walls for both floors (solid first; windows carved after).
  wallRing(bx0, bz0, bx1, f1, f1Top - 1, bz1, B.SANDSTONE);       // floor 1
  wallRing(bx0, bz0, bx1, f1Top + 1, f2Top - 1, bz1, B.SANDSTONE); // floor 2

  // Long horizontal window bands of GLASS (2-wide windows, 1-wide mullions).
  // Applied on the front (z=bz1) and back (z=bz0) walls of each floor.
  const windowBand = (yLo, yHi, zWall) => {
    for (let x = bx0 + 2; x <= bx1 - 2; x++) {
      // pattern: 2 glass, 1 mullion, repeating
      if (((x - (bx0 + 2)) % 3) !== 2) fillBox(x, yLo, zWall, x, yHi, zWall, B.GLASS);
    }
  };
  windowBand(f1 + 1, f1Top - 2, bz1); // floor 1 front
  windowBand(f1 + 1, f1Top - 2, bz0); // floor 1 back
  windowBand(f1Top + 2, f2Top - 2, bz1); // floor 2 front
  windowBand(f1Top + 2, f2Top - 2, bz0); // floor 2 back
  // side windows (west/east walls) on both floors
  for (let z = bz0 + 2; z <= bz1 - 2; z++) {
    if (((z - (bz0 + 2)) % 3) !== 2) {
      fillBox(bx0, f1 + 1, z, bx0, f1Top - 2, z, B.GLASS);
      fillBox(bx1, f1 + 1, z, bx1, f1Top - 2, z, B.GLASS);
      fillBox(bx0, f1Top + 2, z, bx0, f2Top - 2, z, B.GLASS);
      fillBox(bx1, f1Top + 2, z, bx1, f2Top - 2, z, B.GLASS);
    }
  }

  // 2nd-floor OPEN WALKWAY (balcony) one block deep in front of the facade,
  // with a clearly-read WHITE railing: WHITE_WOOL posts + WHITE_WOOL top rail,
  // GLASS infill between, exactly like the school's open corridor in the photo.
  const balZ = bz1 + 1; // z=13, just in front of the building
  fillBox(bx0, f1Top, balZ, bx1, f1Top, balZ, B.SMOOTH_STONE); // walkway deck
  for (let x = bx0; x <= bx1; x++) {
    // white posts every 2 blocks, glass infill between (mid-height)
    if ((x - bx0) % 2 === 0) stamp(x, f1Top + 1, balZ, B.WHITE_WOOL);
    else stamp(x, f1Top + 1, balZ, B.GLASS);
  }
  // continuous WHITE_WOOL hand-rail cap along the whole walkway
  fillBox(bx0, f1Top + 2, balZ, bx1, f1Top + 2, balZ, B.WHITE_WOOL);
  // roof parapet edge (thin lip around the flat roof)
  wallRing(bx0, bz0, bx1, f2Top + 1, f2Top + 1, bz1, B.SMOOTH_STONE);

  // ==========================================================================
  // 3) ENTRANCE — central CALCITE pillars, lintel, glass doors, BRICK steps.
  // ==========================================================================
  const dz = bz1; // doorway is in the front facade plane
  // two light-stone pillars flanking a 2-wide opening centered on cx
  fillBox(cx - 2, f1, dz, cx - 2, f1Top, dz, B.CALCITE);
  fillBox(cx + 2, f1, dz, cx + 2, f1Top, dz, B.CALCITE);
  fillBox(cx - 2, f1, dz + 1, cx - 2, f1Top, dz + 1, B.CALCITE); // pillars project out
  fillBox(cx + 2, f1, dz + 1, cx + 2, f1Top, dz + 1, B.CALCITE);
  // lintel across the top of the opening
  fillBox(cx - 2, f1Top, dz, cx + 2, f1Top, dz, B.SMOOTH_STONE);
  fillBox(cx - 2, f1Top, dz + 1, cx + 2, f1Top, dz + 1, B.SMOOTH_STONE);
  // doorway opening: 2 wide (cx-1..cx) x 3 tall — kept OPEN (air) so a player
  // can walk straight in; glass "doors" only across the very top so the bakery
  // room behind reads as enterable, not sealed.
  fillBox(cx - 1, f1, dz, cx, f1Top - 1, dz, B.AIR);   // clear the opening fully
  stamp(cx - 1, f1Top - 1, dz, B.GLASS);                // glass transom, left
  stamp(cx, f1Top - 1, dz, B.GLASS);                    // glass transom, right
  // school CREST + name plate above the door: a round CALCITE crest flanked by
  // a STONE_BRICKS name plate, set in the lintel band.
  fillBox(cx - 2, f1Top - 1, dz, cx + 2, f1Top - 1, dz, B.STONE_BRICKS); // name plate
  // round CALCITE crest centered above the door (3-wide center reads as a disc)
  fillBox(cx - 1, f1Top - 1, dz, cx + 1, f1Top - 1, dz, B.CALCITE);      // crest disc
  stamp(cx, f1Top, dz, B.CALCITE);                       // crest crown above the band
  // RED BRICK steps leading down into the yard (3 tiers, getting wider) — set
  // BELOW the threshold (y=1) and stepping DOWN/OUT so they read as a stoop a
  // player descends from the door into the gravel yard.
  fillBox(cx - 2, 1, dz + 1, cx + 1, 1, dz + 2, B.BRICK); // landing in front of door
  for (let s = 1; s <= 3; s++) {
    const sz = dz + 2 + s;
    fillBox(cx - 1 - s, 1, sz, cx + s, 1, sz, B.BRICK); // widening brick treads
  }

  // ==========================================================================
  // 4) PETIT HERMÈS INTERIOR — ground floor: 工房 (workshop) at the back and
  //    販売スペース (sales) at the front, split by a partition wall with a
  //    doorway. Second floor: a preserved 教室 (classroom). An interior stair
  //    links them. The building inner shell spans x ix0..ix1, z iz0..iz1.
  // ==========================================================================
  const ix0 = bx0 + 1, ix1 = bx1 - 1; // interior x 4..35
  const iz0 = bz0 + 1, iz1 = bz1 - 1; // interior z 3..11
  const fy0 = f1, fy1 = f1Top - 1;    // ground-floor interior y 1..4 (ceiling deck at f1Top)

  // Hollow out the whole ground floor (air) and lay a wood plank floor.
  fillBox(ix0, fy0 + 1, iz0, ix1, fy1, iz1, B.AIR);
  fillBox(ix0, fy0, iz0, ix1, fy0, iz1, B.OAK_PLANKS); // OAK_PLANKS floor

  // ---- partition wall (STONE_BRICKS) splitting workshop (low z) from sales
  //      (high z). Workshop z3..5, sales z7..11. The partition sits at zWall=6
  //      so the baker can stand in OPEN sales air at z=zPart=7, behind a counter
  //      that faces the entrance (+z). The host-placed baker NPC is at LOCAL
  //      (20,1,7); leaving that column clear is essential so it isn't walled in.
  const zPart = iz0 + 4;              // z=7 — baker line (kept OPEN, sales side)
  const zWall = zPart - 1;            // z=6 — partition plane between the rooms
  // Wall runs full width at zWall, full height, but we carve a 2-wide x 3-tall
  // doorway near the west end and another near the east so circulation is easy.
  fillBox(ix0, fy0 + 1, zWall, ix1, fy1, zWall, B.STONE_BRICKS);
  const dwW0 = ix0 + 2;               // west doorway x
  fillBox(dwW0, fy0 + 1, zWall, dwW0 + 1, fy0 + 3, zWall, B.AIR); // 2 wide, 3 tall
  const dwE0 = ix1 - 3;               // east doorway x
  fillBox(dwE0, fy0 + 1, zWall, dwE0 + 1, fy0 + 3, zWall, B.AIR);
  // make sure the baker's standing column (and the row just behind it) is clear
  fillBox(ix0 + 1, fy0 + 1, zPart, ix1 - 1, fy1, zPart, B.AIR);

  // ====================== 販売スペース (SALES) — front =======================
  // Teal (BLUE_WOOL) accent on the side walls of the sales half, leaving the
  // cream sandstone facade + its doorway intact.
  fillBox(ix0, fy0 + 1, zPart + 1, ix0, fy1, iz1, B.BLUE_WOOL); // west accent
  fillBox(ix1, fy0 + 1, zPart + 1, ix1, fy1, iz1, B.BLUE_WOOL); // east accent

  // COIR DOORMAT inside the threshold (DRY_GRASS patch).
  fillBox(cx - 1, fy0, iz1 - 1, cx, fy0, iz1, B.DRY_GRASS);

  // SALES COUNTER (SPRUCE_PLANKS, 2 tall, 2 deep). The baker NPC stands at
  // LOCAL (20,1,7) = z=zPart, BEHIND the counter, facing +z (toward entrance).
  // So the counter sits just in FRONT of the baker at z = zPart+1..zPart+2.
  const cZ0 = zPart + 1, cZ1 = zPart + 2;
  fillBox(ix0 + 2, fy0 + 1, cZ0, ix1 - 2, fy0 + 2, cZ1, B.SPRUCE_PLANKS); // counter body
  // BLACK_WOOL chalkboard menu hung on the customer-facing front of the counter
  fillBox(ix0 + 3, fy0 + 1, cZ1 + 1, cx - 2, fy0 + 2, cZ1 + 1, B.BLACK_WOOL);
  // BREAD LOAVES (HAY) lined along the counter top facing the customer
  for (let x = ix0 + 3; x <= ix1 - 3; x++) {
    if (x % 2 === 0) stamp(x, fy0 + 3, cZ1, B.HAY);
  }

  // GLASS BREAD DISPLAY CASE on the counter top, east end: SPRUCE frame + GLASS.
  const caX0 = ix1 - 6, caX1 = ix1 - 3;
  fillBox(caX0, fy0 + 3, cZ0, caX1, fy0 + 4, cZ1, B.SPRUCE_PLANKS);   // frame
  fillBox(caX0 + 1, fy0 + 3, cZ1, caX1 - 1, fy0 + 4, cZ1, B.GLASS);    // glazed front
  fillBox(caX0 + 1, fy0 + 3, cZ0, caX1 - 1, fy0 + 3, cZ0, B.HAY);      // loaves inside

  // SPRUCE_PLANKS SHELF on the front (facade) wall with CALCITE "kraft cups".
  const shZ = iz1;
  fillBox(ix0 + 1, fy0 + 3, shZ, ix0 + 4, fy0 + 3, shZ, B.SPRUCE_PLANKS); // shelf board
  for (let x = ix0 + 1; x <= ix0 + 4; x++) stamp(x, fy0 + 4, shZ, B.CALCITE); // kraft cups
  // a wall CHALKBOARD menu on the west sales wall
  fillBox(ix0, fy0 + 2, zPart + 2, ix0, fy1, zPart + 4, B.BLACK_WOOL);

  // BLACK_WOOL + GLASS DISPLAY FRIDGE against the east sales wall, full height.
  const frX = ix1 - 1, frZ = zPart + 2;
  fillBox(frX, fy0 + 1, frZ, frX, fy1, frZ + 1, B.BLACK_WOOL); // fridge body
  fillBox(frX, fy0 + 1, frZ, frX, fy0 + 3, frZ, B.GLASS);       // glass door front

  // ====================== 工房 (WORKSHOP) — back ============================
  // 2-3 FURNACE "ovens" in a row against the back (low-z) wall.
  const ovZ = iz0;                    // ovens flush to back wall
  for (let i = 0; i < 3; i++) {
    const ovX = ix0 + 2 + i * 3;
    fillBox(ovX, fy0 + 1, ovZ, ovX, fy0 + 2, ovZ, B.FURNACE); // 2-tall oven stack
  }
  // SPRUCE_PLANKS / CRAFTING_TABLE prep tables in the middle of the workshop.
  const pyTop = fy0 + 1;              // table height (sitting/working height)
  fillBox(ix0 + 2, pyTop, iz0 + 2, ix0 + 5, pyTop, iz0 + 2, B.SPRUCE_PLANKS);
  stamp(ix0 + 3, pyTop, iz0 + 2, B.CRAFTING_TABLE); // a kneading station
  stamp(ix0 + 4, pyTop, iz0 + 2, B.CRAFTING_TABLE);
  fillBox(ix1 - 5, pyTop, iz0 + 2, ix1 - 3, pyTop, iz0 + 2, B.SPRUCE_PLANKS);

  // FERMENTATION JARS of levain: GLASS columns topped with BLUE_WOOL, on a shelf.
  const jarShelfX0 = ix1 - 4, jarShelfZ = zWall - 1; // shelf inside workshop, off the partition
  fillBox(jarShelfX0, fy0 + 2, jarShelfZ, jarShelfX0 + 2, fy0 + 2, jarShelfZ, B.SPRUCE_PLANKS); // shelf
  for (let x = jarShelfX0; x <= jarShelfX0 + 2; x++) {
    stamp(x, fy0 + 3, jarShelfZ, B.GLASS);     // jar body
    stamp(x, fy0 + 4, jarShelfZ, B.BLUE_WOOL); // levain lid
  }
  // HAY / WHITE_WOOL FLOUR SACKS stacked in the back-west corner.
  fillBox(ix0 + 1, fy0 + 1, iz0 + 1, ix0 + 1, fy0 + 2, iz0 + 1, B.HAY);
  stamp(ix0 + 1, fy0 + 3, iz0 + 1, B.WHITE_WOOL);
  stamp(ix0 + 2, fy0 + 1, iz0 + 1, B.WHITE_WOOL);
  stamp(ix0 + 2, fy0 + 2, iz0 + 1, B.HAY);
  // CALCITE SINK with a WATER block, against the east wall of the workshop.
  const skX = ix1 - 1;
  fillBox(skX, fy0 + 1, iz0 + 1, skX, fy0 + 1, iz0 + 2, B.CALCITE); // sink basin sides
  stamp(skX, fy0 + 1, iz0 + 1, B.WATER);                            // water in the basin
  // wall shelves (SPRUCE_PLANKS) along the workshop west wall.
  fillBox(ix0, fy0 + 3, iz0 + 1, ix0, fy0 + 3, iz0 + 2, B.SPRUCE_PLANKS);

  // ==========================================================================
  // 4b) INTERIOR STAIRCASE — from the ground floor up through the floor-2 deck
  //     to the classroom. A run of SMOOTH_STONE steps in the back-east corner,
  //     each step +1 y and +1 x, with a hole punched through the deck + headroom.
  // ==========================================================================
  const stZ = iz0 + 1;                // stair run along the back wall, low z
  const stX0 = ix1 - 1;               // starts near east wall, climbs west
  // steps: 5 risers from y1 (tread top y1) to y5 (tread top level with the
  // floor-2 deck at f1Top). Each step is +1 x (westward) and +1 y.
  for (let s = 0; s <= 4; s++) {
    const sx = stX0 - s;
    fillBox(sx, fy0, stZ, sx, fy0 + s, stZ, B.SMOOTH_STONE); // solid riser up to tread top
  }
  const stTopX = stX0 - 4;            // x of the top tread (tread top at y5)
  // punch the stair well through the floor-2 deck WEST of the top tread so the
  // player walks off the top tread onto the classroom floor, with clear headroom
  // directly above the whole run.
  fillBox(stTopX - 1, f1Top, stZ, stX0, f1Top, stZ, B.AIR); // open deck over the run + landing
  fillBox(stTopX - 1, f1Top + 1, stZ, stX0, f1Top + 3, stZ, B.AIR); // headroom above the run

  // ==========================================================================
  // 4c) 教室 (CLASSROOM) — preserved second-floor room. OAK_PLANKS floor over
  //     the deck, a BLACK_WOOL blackboard on the back wall, a teacher's
  //     CRAFTING_TABLE desk, and a 3x3 grid of SPRUCE_PLANKS student desks.
  // ==========================================================================
  const gy0 = f1Top + 1, gy1 = f2Top - 1; // floor-2 interior y 6..8
  fillBox(ix0, gy0, iz0, ix1, gy1, iz1, B.AIR);           // hollow the room
  fillBox(ix0, f1Top, iz0, ix1, f1Top, iz1, B.OAK_PLANKS); // classroom floor (over deck)
  // re-open the stair well in the new floor so the stair still reaches up
  fillBox(stX0 - 4, f1Top, stZ, stX0 - 3, f1Top, stZ + 1, B.AIR);
  // BLACKBOARD covering the back (low-z) wall, head height.
  fillBox(ix0 + 2, gy0 + 1, iz0, ix1 - 2, gy0 + 2, iz0, B.BLACK_WOOL);
  // TEACHER'S DESK (CRAFTING_TABLE) centered in front of the blackboard.
  stamp(cx, gy0, iz0 + 1, B.CRAFTING_TABLE);
  stamp(cx + 1, gy0, iz0 + 1, B.SPRUCE_PLANKS);
  // 3x3-ish grid of STUDENT DESKS: a SPRUCE_PLANKS block at sitting height with
  // a 1-block gap (aisle) between each, facing the blackboard.
  for (let r = 0; r < 3; r++) {
    const dz = iz0 + 3 + r * 2;       // desk rows down the room
    for (let c = 0; c < 3; c++) {
      const dxx = ix0 + 4 + c * 4;    // desk columns across the room
      stamp(dxx, gy0, dz, B.SPRUCE_PLANKS); // desk top
    }
  }

  // ==========================================================================
  // 5) YARD DETAILS — a tree and stacked "tires" out on the gravel.
  // ==========================================================================
  // single OAK tree near the building, off to one side
  const tx = bx0 + 4, tz = bz1 + 8;
  fillBox(tx, 1, tz, tx, 5, tz, B.OAK_LOG); // trunk ~5 tall
  // small leaf canopy
  fillBox(tx - 2, 5, tz - 2, tx + 2, 6, tz + 2, B.OAK_LEAVES);
  fillBox(tx - 1, 7, tz - 1, tx + 1, 7, tz + 1, B.OAK_LEAVES);
  stamp(tx, 8, tz, B.OAK_LEAVES);
  // carve out the trunk column inside the canopy so leaves don't bury it
  stamp(tx, 5, tz, B.OAK_LOG);
  stamp(tx, 6, tz, B.OAK_LOG);

  // 2-3 stacked tires (rings of BLACK_WOOL) like in the photo
  const tireRing = (px, pz, py) => {
    stamp(px - 1, py, pz, B.BLACK_WOOL);
    stamp(px + 1, py, pz, B.BLACK_WOOL);
    stamp(px, py, pz - 1, B.BLACK_WOOL);
    stamp(px, py, pz + 1, B.BLACK_WOOL);
  };
  const px = cx + 6, pz = bz1 + 7;
  tireRing(px, pz, 1);
  tireRing(px, pz, 2);
  tireRing(px, pz, 3);

  // ==========================================================================
  // 6) FARM FIELD — tilled DIRT plot with alternating rows of wheat & veg.
  //    Placed in the open far schoolyard (high z), west side, clear of the
  //    building, entrance path, tree and tires.
  // ==========================================================================
  const fx0 = 4, fx1 = 11;   // 8 wide (x 4..11)
  const fz0 = 28, fz1 = 37;  // 10 deep (z 28..37)
  // tilled soil bed at ground level
  fillBox(fx0, 0, fz0, fx1, 0, fz1, B.DIRT);
  // crop rows along z, every other row a walking path (rows where z is odd
  // get crops; even-z rows stay as bare tilled-dirt paths).
  for (let z = fz0; z <= fz1; z++) {
    if ((z - fz0) % 2 !== 0) continue; // 1-wide path between crop rows
    // alternate strips of wheat and veg by row
    const crop = (((z - fz0) / 2) % 2 === 0) ? B.WHEAT_CROP : B.VEG_CROP;
    for (let x = fx0; x <= fx1; x++) stamp(x, 1, z, crop);
  }
  // low GRASS bank framing the field on its outer edges
  for (let x = fx0 - 1; x <= fx1 + 1; x++) {
    stamp(x, 0, fz0 - 1, B.GRASS);
    stamp(x, 0, fz1 + 1, B.GRASS);
  }
  for (let z = fz0 - 1; z <= fz1 + 1; z++) {
    stamp(fx0 - 1, 0, z, B.GRASS);
    stamp(fx1 + 1, 0, z, B.GRASS);
  }

  // ==========================================================================
  // 7) RIVER — a 3-wide WATER channel carved a block down, running along the
  //    east edge of the lot, a few blocks east of the field. Grass/dirt banks.
  // ==========================================================================
  const rivX0 = 34, rivX1 = 36;   // 3 wide
  const rivZ0 = 24, rivZ1 = 42;   // runs most of the lot length
  // carve the trench: water fills y=0 (ground level lowered to water)
  fillBox(rivX0, 0, rivZ0, rivX1, 0, rivZ1, B.WATER);
  // dirt banks one block in from each long side, grass capping the rim
  for (let z = rivZ0; z <= rivZ1; z++) {
    stamp(rivX0 - 1, 0, z, B.DIRT);
    stamp(rivX1 + 1, 0, z, B.DIRT);
    stamp(rivX0 - 2, 0, z, B.GRASS);
    stamp(rivX1 + 2, 0, z, B.GRASS);
  }
  // grass caps at the two ends of the channel
  for (let x = rivX0 - 1; x <= rivX1 + 1; x++) {
    stamp(x, 0, rivZ0 - 1, B.GRASS);
    stamp(x, 0, rivZ1 + 1, B.GRASS);
  }

  // ==========================================================================
  // 8) BUSHES — a couple of small OAK_LEAVES shrubs near the field.
  // ==========================================================================
  const bush = (bx, bz) => {
    stamp(bx, 1, bz, B.OAK_LEAVES);
    stamp(bx + 1, 1, bz, B.OAK_LEAVES);
    stamp(bx, 1, bz + 1, B.OAK_LEAVES);
    stamp(bx, 2, bz, B.OAK_LEAVES);
  };
  bush(fx1 + 3, fz0 + 1);
  bush(fx1 + 3, fz1 - 2);

  // ==========================================================================
  // 9) SATOYAMA — 棚田 (terraced rice paddies). A few small flooded basins set
  //    in the open central/front yard, away from the building, entrance path,
  //    tree, tires, vegetable field and river. Each paddy is a 1-block-high
  //    frame: an earthen bund (畦) ringing the plot at y=1, the interior at y=1
  //    flooded with WATER, and rows of WHEAT_CROP standing up out of the water
  //    to read as green/gold rice (稲). Laid in a gentle stepped arrangement.
  // ==========================================================================
  const ricePaddy = (x0, z0, x1, z1) => {
    // bund (畦): one-block-high earthen ring around the plot
    wallRing(x0, z0, x1, 1, 1, z1, B.DIRT);
    // grass crowning the outer rim of the bund so it reads as a green ridge
    for (let x = x0; x <= x1; x++) {
      stamp(x, 1, z0, B.GRASS);
      stamp(x, 1, z1, B.GRASS);
    }
    for (let z = z0; z <= z1; z++) {
      stamp(x0, 1, z, B.GRASS);
      stamp(x1, 1, z, B.GRASS);
    }
    // flooded interior: WATER sitting at y=1 inside the bund
    fillBox(x0 + 1, 1, z0 + 1, x1 - 1, 1, z1 - 1, B.WATER);
    // rice plants: WHEAT_CROP poking up out of the water, in tidy rows
    for (let z = z0 + 1; z <= z1 - 1; z++) {
      for (let x = x0 + 1; x <= x1 - 1; x++) {
        // skip every 3rd row to leave thin water lanes between rice clumps
        if ((z - (z0 + 1)) % 3 === 2) continue;
        stamp(x, 1, z, B.WHEAT_CROP);
      }
    }
  };
  // Three small paddies stepped down the open yard (中央 → 前庭, west of river).
  ricePaddy(14, 18, 22, 24); // upper paddy
  ricePaddy(14, 26, 23, 33); // middle paddy (largest)
  ricePaddy(15, 35, 23, 41); // lower paddy (toward the front)

  // ==========================================================================
  // 10) FOREST EDGE — a short stand of trees along the front (high-z) west
  //     corner, suggesting the cedar/broadleaf hillside ringing the hamlet.
  // ==========================================================================
  const forestTree = (tx, tz, h) => {
    fillBox(tx, 1, tz, tx, h, tz, B.OAK_LOG); // trunk
    // layered canopy
    fillBox(tx - 2, h - 1, tz - 2, tx + 2, h, tz + 2, B.OAK_LEAVES);
    fillBox(tx - 1, h + 1, tz - 1, tx + 1, h + 1, tz + 1, B.OAK_LEAVES);
    stamp(tx, h + 2, tz, B.OAK_LEAVES);
    // keep the upper trunk visible through the canopy
    stamp(tx, h - 1, tz, B.OAK_LOG);
    stamp(tx, h, tz, B.OAK_LOG);
    // a little leaf litter / undergrowth at the base
    stamp(tx, 1, tz + 2, B.GRASS);
  };
  forestTree(4, 44, 6);
  forestTree(9, 46, 5);
  forestTree(14, 45, 6);
  forestTree(2, 39, 4);

  // ==========================================================================
  // 11) FARMSTEAD EXTRAS — a couple more crop patches so the satoyama reads as
  //     lived-in, tucked between the paddies and the river bank.
  // ==========================================================================
  fillBox(26, 0, 28, 30, 0, 32, B.DIRT); // tilled bed by the river
  for (let z = 28; z <= 32; z++) {
    if ((z - 28) % 2 !== 0) continue;
    const crop = (((z - 28) / 2) % 2 === 0) ? B.VEG_CROP : B.WHEAT_CROP;
    for (let x = 26; x <= 30; x++) stamp(x, 1, z, crop);
  }
  // a small green vegetable strip near the upper paddy
  fillBox(25, 0, 18, 28, 0, 21, B.DIRT);
  for (let x = 25; x <= 28; x++) {
    stamp(x, 1, 18, B.VEG_CROP);
    stamp(x, 1, 20, B.VEG_CROP);
  }
}
