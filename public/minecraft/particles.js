// Lightweight debris particles for block break/place "juice".
// A fixed-capacity pool of tiny cubes (one shared geometry); each burst grabs
// the next slots, colours them by the broken block, throws them with gravity,
// and shrinks them over a short lifetime. Cheap enough for mobile.
//
// createParticles(scene, THREE, capacity) -> { burst(x,y,z,colorHex,count,spread), update(dt) }

export function createParticles(scene, THREE, capacity = 140) {
  const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const pool = [];
  for (let i = 0; i < capacity; i++) {
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    pool.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, max: 1 });
  }
  let cursor = 0;

  function burst(x, y, z, colorHex, count = 14, spread = 3.2) {
    for (let i = 0; i < count; i++) {
      const p = pool[cursor];
      cursor = (cursor + 1) % capacity;
      p.mesh.material.color.setHex(colorHex);
      p.mesh.position.set(
        x + (Math.random() - 0.5) * 0.7,
        y + (Math.random() - 0.5) * 0.7,
        z + (Math.random() - 0.5) * 0.7
      );
      p.mesh.scale.setScalar(1);
      p.vx = (Math.random() - 0.5) * spread;
      p.vy = Math.random() * spread * 0.9 + 0.8;
      p.vz = (Math.random() - 0.5) * spread;
      p.max = 0.4 + Math.random() * 0.35;
      p.life = p.max;
      p.mesh.visible = true;
    }
  }

  function update(dt) {
    for (const p of pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.mesh.visible = false; continue; }
      p.vy -= 15 * dt; // gravity
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const s = Math.max(0.05, p.life / p.max);
      p.mesh.scale.setScalar(s);
    }
  }

  return { burst, update };
}
