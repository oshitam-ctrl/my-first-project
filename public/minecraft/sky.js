// Sky system for the voxel game: sun, moon, stars, drifting clouds and simple
// weather (rain/snow), all driven by the existing day/night cycle.
//
// Cheap by design: no lights, only MeshBasicMaterial / Points. Every object
// follows the camera each frame so the visible object count is fixed and there
// are no per-frame allocations in update().
//
// createSky({ THREE, scene, camera, renderDist }) -> {
//   update(dt, sun, dayTime), setWeather(type), weather(), setEnabled(on)
// }

export function createSky(opts) {
  const { THREE, scene, camera, renderDist = 8 } = opts;

  // How far away the sky dome sits: a touch inside the far plane so the discs
  // and stars render but terrain (drawn opaque) still occludes near geometry.
  const R = Math.max(64, renderDist * 16 * 0.8);

  // Scratch vectors reused every frame (no allocation in update()).
  const _dir = new THREE.Vector3();
  const _cam = new THREE.Vector3();

  // ---- Root group: everything lives under here so a single visible flag and
  // a single position copy moves the whole sky to follow the camera. ----
  const root = new THREE.Group();
  root.frustumCulled = false;
  scene.add(root);

  // ---------------------------------------------------------------- sun + moon
  // A "celestial" pivot we rotate by dayTime; sun and moon are children placed
  // on opposite sides at radius R, so rotating the pivot sweeps them across the
  // sky (sun rises east / sets west, moon opposite).
  const celestial = new THREE.Group();
  celestial.frustumCulled = false;
  root.add(celestial);

  const discGeo = new THREE.CircleGeometry(R * 0.06, 24);

  const sunMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xfff2c0), depthTest: false, depthWrite: false, fog: false,
  });
  const sunMesh = new THREE.Mesh(discGeo, sunMat);
  sunMesh.position.set(0, 0, -R); // one side of the dome
  sunMesh.frustumCulled = false;
  sunMesh.renderOrder = -10;
  celestial.add(sunMesh);

  const moonMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xdfe6f0), depthTest: false, depthWrite: false, fog: false,
  });
  const moonMesh = new THREE.Mesh(discGeo, moonMat);
  moonMesh.position.set(0, 0, R); // opposite side
  moonMesh.frustumCulled = false;
  moonMesh.renderOrder = -10;
  celestial.add(moonMesh);

  // -------------------------------------------------------------------- stars
  const STAR_COUNT = 600;
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    // Uniform-ish points on a sphere of radius R.
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    starPos[i * 3] = Math.cos(t) * r * R;
    starPos[i * 3 + 1] = u * R;
    starPos[i * 3 + 2] = Math.sin(t) * r * R;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xffffff),
    size: Math.max(1, R * 0.004),
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = -11;
  root.add(stars);

  // ------------------------------------------------------------------- clouds
  // A big flat plane high above the player, slowly scrolling. Uses a Plane via
  // BoxGeometry (thin) so the stub test only needs box/mesh; recentres on the
  // camera each frame to look infinite.
  const cloudSize = R * 2.2;
  const cloudGeo = new THREE.BoxGeometry(cloudSize, 1, cloudSize);
  const cloudMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    fog: false,
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.frustumCulled = false;
  clouds.renderOrder = -5;
  root.add(clouds);
  let cloudDrift = 0; // accumulated scroll offset

  // ------------------------------------------------------------------ weather
  // A single Points field, reconfigured between rain and snow. Particles fall
  // within a ~30 block box around the camera and recycle to the top.
  const WX = 30, WY = 30, WZ = 30; // box dimensions around camera
  const PART = 400;
  const wPos = new Float32Array(PART * 3);
  for (let i = 0; i < PART; i++) {
    wPos[i * 3] = (Math.random() - 0.5) * WX;
    wPos[i * 3 + 1] = (Math.random() - 0.5) * WY;
    wPos[i * 3 + 2] = (Math.random() - 0.5) * WZ;
  }
  const wGeo = new THREE.BufferGeometry();
  wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
  const wMat = new THREE.PointsMaterial({
    color: new THREE.Color(0x9fb4cc),
    size: 0.5,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    fog: false,
  });
  const weatherPts = new THREE.Points(wGeo, wMat);
  weatherPts.frustumCulled = false;
  weatherPts.visible = false;
  root.add(weatherPts);

  let weatherType = 'clear';
  let fallSpeed = 18;   // blocks/sec (rain fast, snow slow)
  let drift = 0;        // horizontal sway phase for snow

  function setWeather(type) {
    weatherType = (type === 'rain' || type === 'snow') ? type : 'clear';
    if (weatherType === 'rain') {
      wMat.color.setHex(0x9fb4cc);
      wMat.size = 0.5;
      wMat.opacity = 0.55;
      fallSpeed = 22;
      weatherPts.visible = enabled;
    } else if (weatherType === 'snow') {
      wMat.color.setHex(0xffffff);
      wMat.size = 0.7;
      wMat.opacity = 0.85;
      fallSpeed = 3.5;
      weatherPts.visible = enabled;
    } else {
      weatherPts.visible = false;
    }
  }

  // ---------------------------------------------------------------- lifecycle
  let enabled = true;
  function setEnabled(on) {
    enabled = !!on;
    root.visible = enabled;
    weatherPts.visible = enabled && weatherType !== 'clear';
  }

  function weather() { return weatherType; }

  // ------------------------------------------------------------------- update
  function update(dt, sun, dayTime) {
    if (!enabled) return;
    if (typeof dt !== 'number' || !isFinite(dt)) dt = 0;
    sun = (typeof sun === 'number' && isFinite(sun)) ? sun : 0;
    dayTime = (typeof dayTime === 'number' && isFinite(dayTime)) ? dayTime : 0;

    // Follow the camera so the dome stays "infinitely far".
    _cam.copy(camera.position);
    root.position.copy(_cam);

    // Rotate the celestial pivot so the sun arcs E->W with the day.
    // At dayTime 0.25 (sun=1, noon) the sun disc should be overhead.
    celestial.rotation.x = dayTime * Math.PI * 2 - Math.PI / 2;

    // Stars fade in at night (sun < ~0.3), out by day.
    const starOpacity = Math.min(1, Math.max(0, (0.3 - sun) / 0.3));
    starMat.opacity = starOpacity;
    stars.visible = starOpacity > 0.01;

    // Tint clouds with the sun: bright at noon, dusky/orange near the horizon.
    const warm = Math.max(0, Math.min(1, sun));
    const r = 0.35 + 0.65 * warm;
    const g = 0.35 + 0.6 * warm * warm;
    const b = 0.4 + 0.6 * warm * warm * warm;
    cloudMat.color.setRGB(r, g, b);
    cloudMat.opacity = 0.25 + 0.55 * warm;

    // Drift clouds horizontally and keep them centred on the player.
    cloudDrift = (cloudDrift + dt * 2) % cloudSize;
    clouds.position.set(cloudDrift - cloudSize * 0.5, 40, 0);

    // Animate weather: particles fall, wrap to the top of the box.
    if (weatherType !== 'clear') {
      const arr = wGeo.attributes.position.array;
      drift += dt;
      const swayX = weatherType === 'snow' ? Math.sin(drift * 1.5) * 1.2 * dt : 0;
      for (let i = 0; i < PART; i++) {
        const yi = i * 3 + 1;
        arr[yi] -= fallSpeed * dt;
        arr[i * 3] += swayX;
        if (arr[yi] < -WY * 0.5) {
          arr[yi] += WY;                              // recycle to the top
          arr[i * 3] = (Math.random() - 0.5) * WX;    // reseed x/z
          arr[i * 3 + 2] = (Math.random() - 0.5) * WZ;
        }
      }
      wGeo.attributes.position.needsUpdate = true;
      // weatherPts sits under root, which already follows the camera, so the
      // field stays boxed around the player automatically.
      weatherPts.position.set(0, 0, 0);
    }
  }

  // Initialise visibility/state.
  setWeather('clear');

  return { update, setWeather, weather, setEnabled };
}
