// npc.js — NPCの配置と佇まい。近づくとプレイヤーの方をゆっくり向く。

import { makeHumanoid, PALETTES } from './character.js';
import { heightAt } from './terrain.js';
import { NPCS, FLOOR_Y, SCHOOL, addCircle } from './layout.js';

const NAMES = {
  oshita: '大下さん', barista: 'カフェの店主', customer: 'お客さん',
  obaachan: 'おばあちゃん', kid: 'じてんしゃの子',
};

export function createNPCs(THREE, scene) {
  const list = [];
  for (const def of NPCS) {
    const npc = makeHumanoid(THREE, PALETTES[def.kind] || PALETTES.customer);
    const inSchool = def.x > SCHOOL.minX && def.x < SCHOOL.maxX && def.z > SCHOOL.minZ && def.z < SCHOOL.maxZ;
    const y = inSchool ? FLOOR_Y : heightAt(def.x, def.z);
    npc.group.position.set(def.x, y, def.z);
    npc.group.rotation.y = def.ry;
    scene.add(npc.group);
    addCircle(def.x, def.z, 0.45);
    list.push({ def, ...npc, baseRy: def.ry, name: NAMES[def.id] || def.id });
  }

  function update(dt, playerPos) {
    for (const n of list) {
      n.update(dt, 0);
      const dx = playerPos.x - n.group.position.x;
      const dz = playerPos.z - n.group.position.z;
      const d = Math.hypot(dx, dz);
      const want = d < 4.5 ? Math.atan2(dx, dz) : n.baseRy;
      let diff = want - n.group.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      n.group.rotation.y += diff * Math.min(1, dt * 5);
    }
  }

  return { list, update };
}
