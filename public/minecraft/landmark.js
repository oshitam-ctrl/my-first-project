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
  // 4) PETIT HERMÈS BAKERY — ground-floor room behind the entrance.
  // ==========================================================================
  // The room is a former classroom: it occupies the full depth of the
  // ground floor behind the facade so the player walks straight in from the
  // entrance. Interior spans the building's inner shell; the front wall is the
  // facade plane (bz1) where the open doorway already sits.
  const rx0 = cx - 6, rx1 = cx + 6;   // interior x span (wide classroom)
  const rz0 = bz0 + 1, rz1 = bz1;     // interior z3..12 (front = facade)
  const ry0 = f1, ry1 = f1Top - 1;    // interior y1..4 (waist..ceiling)
  // hollow out the room interior so it is fully enterable
  fillBox(rx0, ry0 + 1, rz0, rx1, ry1, rz1 - 1, B.AIR);
  // WOODEN PLANK FLOOR (OAK_PLANKS) across the whole room
  fillBox(rx0, ry0, rz0, rx1, ry0, rz1, B.OAK_PLANKS);
  // TEAL back + side walls (BLUE_WOOL) — accents the bakery room, leaving the
  // front (facade) wall as the cream sandstone exterior with its doorway.
  fillBox(rx0, ry0 + 1, rz0, rx1, ry1, rz0, B.BLUE_WOOL);       // back wall (teal)
  fillBox(rx0, ry0 + 1, rz0, rx0, ry1, rz1 - 1, B.BLUE_WOOL);   // west wall (teal)
  fillBox(rx1, ry0 + 1, rz0, rx1, ry1, rz1 - 1, B.BLUE_WOOL);   // east wall (teal)
  // COIR DOORMAT: a brown coir mat just inside the doorway threshold — a 2-wide
  // by 2-deep patch of DRY_GRASS framed by a DIRT lip so it reads as a woven mat.
  fillBox(cx - 1, ry0, rz1 - 2, cx, ry0, rz1 - 1, B.DRY_GRASS);

  // LONG RAW-WOOD COUNTER (SPRUCE_PLANKS, 2 tall, 2 deep) spanning the room, SET
  // BACK from the door so the player can step in and stand in front of it. The
  // photo's two-tone front is rendered with a SPRUCE upper body over a darker
  // lower band; a hung BLACK_WOOL chalkboard sits on the customer-facing face.
  const counterZ = rz0 + 3;           // a few blocks in from the back wall
  // counter body: 2 tall, 2 deep (counterZ .. counterZ+1) so it has heft
  fillBox(rx0 + 1, ry0 + 1, counterZ, rx1 - 1, ry0 + 2, counterZ + 1, B.SPRUCE_PLANKS);
  // BREAD LOAVES (HAY) lined densely along the counter top, facing the door
  for (let x = rx0 + 2; x <= rx1 - 3; x++) {
    if (x % 2 === 0) stamp(x, ry0 + 3, counterZ + 1, B.HAY);
  }
  // WOOD-FRAMED GLASS BREAD DISPLAY CASE sitting on the counter top at one end:
  // a SPRUCE_PLANKS frame (2 tall) around a GLASS box, raised above the counter.
  const cax0 = rx1 - 4, cax1 = rx1 - 1, cayB = ry0 + 3, cayT = ry0 + 4;
  fillBox(cax0, cayB, counterZ, cax1, cayT, counterZ + 1, B.SPRUCE_PLANKS); // frame
  fillBox(cax0 + 1, cayB, counterZ + 1, cax1 - 1, cayT, counterZ + 1, B.GLASS); // glazed front
  stamp(cax0 + 1, ry0 + 3, counterZ + 1, B.HAY); // a loaf visible inside the case
  // BLACKBOARD menu panel (今日の旬味…) hung on the COUNTER FRONT face (counterZ+1
  // is the counter body; the panel reads as a sign attached to its lower front).
  fillBox(rx0 + 2, ry0 + 1, counterZ + 2, rx1 - 5, ry0 + 2, counterZ + 2, B.BLACK_WOOL);
  // small CHALKBOARD on the LEFT (west) wall
  fillBox(rx0, ry0 + 2, rz0 + 1, rx0, ry1, rz0 + 3, B.BLACK_WOOL);

  // WALL SHELF (SPRUCE_PLANKS) on the back wall with stacked KRAFT CUPS/bowls
  // rendered as small CALCITE blocks.
  const shelfZ = rz0 + 1;
  fillBox(rx0 + 1, ry0 + 2, shelfZ, rx0 + 4, ry0 + 2, shelfZ, B.SPRUCE_PLANKS); // shelf board
  for (let x = rx0 + 1; x <= rx0 + 4; x++) stamp(x, ry0 + 3, shelfZ, B.CALCITE); // stacked kraft cups

  // TALL DARK DISPLAY FRIDGE / COFFEE MACHINE (BLACK_WOOL, full height) with a
  // GLASS front, standing against the RIGHT (east) wall near the back.
  const frX = rx1 - 1, frZ = rz0 + 1;
  fillBox(frX, ry0 + 1, frZ, frX, ry1, frZ + 1, B.BLACK_WOOL); // fridge body
  fillBox(frX, ry0 + 1, frZ, frX, ry0 + 3, frZ, B.GLASS);       // glass door front

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
