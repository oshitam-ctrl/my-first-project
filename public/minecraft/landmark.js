// landmark.js — voxel recreation of "プチヘルメース" (Petit Hermès),
// a bakery inside a renovated old 2-story Japanese elementary school
// (北広島町立南方小学校). Self-contained ES module, stamped into a host world.
//
// Coordinate frame (LOCAL): origin (0,0,0) = south-west corner at GROUND level.
//   +x = building length (east), +z = toward the front yard / viewer, +y = up.
//   y=0 is the solid ground/platform layer; structures sit at y>=1.
// stamp(x, y, z, id) places a block; the host clamps out-of-range writes.

export const LANDMARK = { w: 40, d: 44, clearH: 26 };

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
  // with a low railing of SMOOTH_STONE posts + GLASS infill.
  const balZ = bz1 + 1; // z=13, just in front of the building
  fillBox(bx0, f1Top, balZ, bx1, f1Top, balZ, B.SMOOTH_STONE); // walkway deck
  for (let x = bx0; x <= bx1; x++) {
    // posts every 3 blocks, glass between
    if ((x - bx0) % 3 === 0) stamp(x, f1Top + 1, balZ, B.SMOOTH_STONE);
    else stamp(x, f1Top + 1, balZ, B.GLASS);
  }
  fillBox(bx0, f1Top + 2, balZ, bx1, f1Top + 2, balZ, B.SMOOTH_STONE); // hand-rail cap
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
  // doorway opening: 2 wide (cx-1..cx) x 3 tall, with GLASS doors
  fillBox(cx - 1, f1, dz, cx, f1Top - 2, dz, B.AIR);   // clear the opening
  fillBox(cx - 1, f1, dz, cx, f1Top - 2, dz, B.GLASS); // glass doors fill it
  // STONE_BRICKS emblem above the door
  fillBox(cx - 1, f1Top - 1, dz, cx, f1Top - 1, dz, B.STONE_BRICKS);
  // RED BRICK steps leading down into the yard (3 tiers, getting wider/lower)
  for (let s = 1; s <= 3; s++) {
    const sz = dz + 1 + s;
    fillBox(cx - 1 - s, 1, sz, cx + s, 1, sz, B.BRICK); // step tread at y=1
    // lay them slightly stepped down toward the yard by raising inner ones
  }
  fillBox(cx - 1, 1, dz + 1, cx, 1, dz + 2, B.BRICK); // landing in front of door

  // ==========================================================================
  // 4) PETIT HERMÈS BAKERY — ground-floor room behind the entrance.
  // ==========================================================================
  const rx0 = cx - 5, rx1 = cx + 5; // interior x span
  const rz0 = bz0 + 1, rz1 = bz1 - 1; // interior z span (z3..11)
  const ry0 = f1, ry1 = f1Top - 1;    // interior y1..4
  // wood plank floor
  fillBox(rx0, ry0, rz0, rx1, ry0, rz1, B.OAK_PLANKS);
  // teal walls (BLUE_WOOL) lining the interior perimeter
  wallRing(rx0, rz0, rx1, ry0 + 1, ry1, rz1, B.BLUE_WOOL);
  // re-open the doorway (it sits in the front wall) so the room is enterable
  fillBox(cx - 1, ry0 + 1, rz1, cx, ry1 - 1, rz1, B.AIR);

  // long dark-wood counter (SPRUCE_PLANKS, 2 tall) across the back of the room
  const counterZ = rz0 + 2;
  fillBox(rx0 + 1, ry0 + 1, counterZ, rx1 - 1, ry0 + 2, counterZ, B.SPRUCE_PLANKS);
  // loaves of bread (HAY) lined along the counter top
  for (let x = rx0 + 2; x <= rx1 - 2; x += 2) stamp(x, ry0 + 3, counterZ, B.HAY);
  // GLASS display case on one end of the counter
  fillBox(rx0 + 1, ry0 + 3, counterZ, rx0 + 3, ry0 + 3, counterZ, B.GLASS);
  // BLACK_WOOL chalkboard on the counter front face (faces the door)
  fillBox(rx0 + 1, ry0 + 1, counterZ + 1, rx0 + 4, ry0 + 2, counterZ + 1, B.BLACK_WOOL);
  // BLACK_WOOL chalkboard menu on a side wall (just inside the west wall)
  fillBox(rx0 + 1, ry0 + 2, rz0 + 1, rx0 + 1, ry1, rz0 + 4, B.BLACK_WOOL);

  // SPRUCE_PLANKS wall shelf on the back wall with CALCITE "cups"
  const shelfZ = rz0;
  fillBox(rx1 - 4, ry0 + 3, shelfZ, rx1 - 1, ry0 + 3, shelfZ, B.SPRUCE_PLANKS);
  for (let x = rx1 - 4; x <= rx1 - 1; x++) stamp(x, ry0 + 4, shelfZ, B.CALCITE);

  // BLACK_WOOL "display fridge / coffee machine" box with a GLASS front
  fillBox(rx1 - 2, ry0 + 1, rz1 - 2, rx1 - 1, ry0 + 3, rz1 - 1, B.BLACK_WOOL);
  fillBox(rx1 - 2, ry0 + 1, rz1 - 2, rx1 - 1, ry0 + 2, rz1 - 2, B.GLASS); // glass front

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
}
