// Inventory + crafting UI. Click/tap-to-move (Minecraft-style cursor stack),
// 9-slot hotbar + 27 storage, 2x2 inventory crafting and 3x3 crafting table.
// Self-contained (inline styles) so it needs no extra CSS.
import { ITEMS, itemDef, isBlockItem, blockToItem } from './items.js';
import { craftResult } from './crafting.js';
import { BLOCKS } from './blocks.js';

const MAIN = 36;        // 9 hotbar + 27 storage
const MAXSTACK = (id) => (itemDef(id)?.stack ?? 64);

export function createInventory(opts) {
  const { texture, cols, sfx } = opts;
  const creative = !!opts.creative;

  const main = new Array(MAIN).fill(null);   // each: { item, count } or null
  const craft = new Array(9).fill(null);     // crafting grid (3x3; 2x2 uses 0,1,3,4)
  let cursor = null;                         // held stack
  let selected = 0;                          // hotbar index 0..8
  let craftSize = 2;                         // 2 or 3
  let open = false;

  // creative: prefill the hotbar with a handy kit; full palette available in the screen
  const CREATIVE_LIST = Object.keys(ITEMS);
  if (creative) {
    const kit = ['grass', 'dirt', 'stone', 'cobblestone', 'oak_planks', 'oak_log', 'glass', 'sand', 'crafting_table'];
    kit.forEach((id, i) => { if (ITEMS[id]) main[i] = { item: id, count: 1 }; });
  }
  function creativePick(id) {
    // creative: one tap drops the item straight into the selected hotbar slot
    if (creative) { main[selected] = { item: id, count: 1 }; sfx && sfx.select(); renderAll(); return; }
    cursor = { item: id, count: MAXSTACK(id) }; sfx && sfx.select(); renderAll();
  }

  // --- icon drawing ------------------------------------------------------
  function drawIcon(ctx, id) {
    ctx.clearRect(0, 0, 32, 32);
    if (!id) return;
    const def = itemDef(id);
    if (def && def.block != null && BLOCKS[def.block]) {
      const tile = BLOCKS[def.block].faces[2];
      const tw = texture.image.width / cols;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(texture.image, (tile % cols) * tw, Math.floor(tile / cols) * tw, tw, tw, 2, 2, 28, 28);
    } else if (def) {
      const c = def.color ?? 0x888888;
      ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`;
      if (def.tool) { // draw a little handle+head so tools read as tools
        ctx.fillStyle = '#6b4a1e'; ctx.fillRect(14, 12, 4, 16);
        ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`; ctx.fillRect(8, 4, 16, 8);
      } else {
        ctx.beginPath(); ctx.arc(16, 16, 11, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // --- a single slot element ---------------------------------------------
  function makeSlot(onClick, big) {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'relative', width: '44px', height: '44px', borderRadius: '4px',
      background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.18)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      touchAction: 'none',
    });
    const cv = document.createElement('canvas'); cv.width = cv.height = 32;
    Object.assign(cv.style, { width: '34px', height: '34px', imageRendering: 'pixelated', pointerEvents: 'none' });
    el.appendChild(cv);
    const cnt = document.createElement('span');
    Object.assign(cnt.style, {
      position: 'absolute', right: '2px', bottom: '0px', fontSize: '12px', color: '#fff',
      fontWeight: '700', textShadow: '1px 1px 2px #000', pointerEvents: 'none', fontVariantNumeric: 'tabular-nums',
    });
    el.appendChild(cnt);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); onClick(e); });
    el._cv = cv.getContext('2d'); el._cnt = cnt;
    return el;
  }
  function paintSlot(el, cell) {
    drawIcon(el._cv, cell && cell.item);
    el._cnt.textContent = cell && cell.count > 1 ? cell.count : '';
  }

  // --- stack logic -------------------------------------------------------
  function cellGet(store, i) { return store === 'main' ? main[i] : craft[i]; }
  function cellSet(store, i, v) { if (store === 'main') main[i] = v; else craft[i] = v; }

  function clickSlot(store, i) {
    const cell = cellGet(store, i);
    if (cursor == null) {
      if (cell) { cursor = cell; cellSet(store, i, null); }
    } else if (cell == null) {
      cellSet(store, i, cursor); cursor = null;
    } else if (cell.item === cursor.item) {
      const max = MAXSTACK(cell.item);
      const move = Math.min(cursor.count, max - cell.count);
      cell.count += move; cursor.count -= move;
      if (cursor.count <= 0) cursor = null;
    } else {
      cellSet(store, i, cursor); cursor = cell; // swap
    }
    sfx && sfx.select();
    refreshCraftResult();
    renderAll();
  }

  function takeResult() {
    const r = craftResult(craft.map((c) => (c ? c.item : null)));
    if (!r) return;
    if (cursor && (cursor.item !== r.id || cursor.count + r.count > MAXSTACK(r.id))) return;
    // consume one of each ingredient
    for (let i = 0; i < 9; i++) if (craft[i]) { craft[i].count--; if (craft[i].count <= 0) craft[i] = null; }
    if (cursor) cursor.count += r.count; else cursor = { item: r.id, count: r.count };
    sfx && sfx.break(0);
    refreshCraftResult();
    renderAll();
  }

  // --- public inventory ops ---------------------------------------------
  // add to inventory: fill existing stacks first, then empty slots. returns leftover.
  function add(itemId, count = 1) {
    if (creative) return 0;
    let left = count;
    const max = MAXSTACK(itemId);
    for (let i = 0; i < MAIN && left > 0; i++) {
      const c = main[i];
      if (c && c.item === itemId && c.count < max) { const m = Math.min(left, max - c.count); c.count += m; left -= m; }
    }
    for (let i = 0; i < MAIN && left > 0; i++) {
      if (!main[i]) { const m = Math.min(left, max); main[i] = { item: itemId, count: m }; left -= m; }
    }
    renderHotbar(); if (open) renderScreen();
    return left;
  }

  function selectedCell() { return main[selected]; }
  function selectedItem() { return main[selected] ? main[selected].item : null; }

  function consumeSelected(n = 1) {
    if (creative) return true;
    const c = main[selected];
    if (!c || c.count < n) return false;
    c.count -= n; if (c.count <= 0) main[selected] = null;
    renderHotbar();
    return true;
  }

  // tool currently held in the selected hotbar slot (or null)
  function heldTool() {
    const c = main[selected];
    const d = c && itemDef(c.item);
    return d && d.tool ? { id: c.item, ...d.tool } : null;
  }

  function damageHeldTool(amount = 1) {
    if (creative) return;
    const c = main[selected];
    const d = c && itemDef(c.item);
    if (!d || !d.tool) return;
    c.dur = (c.dur ?? d.tool.durability) - amount;
    if (c.dur <= 0) { main[selected] = null; sfx && sfx.break(0); }
    renderHotbar();
  }

  // --- hotbar rendering --------------------------------------------------
  let hotbarEl = null, hotbarSlots = [];
  function mountHotbar(el) {
    hotbarEl = el; hotbarEl.innerHTML = ''; hotbarSlots = [];
    for (let i = 0; i < 9; i++) {
      const s = makeSlot(() => { setSelected(i); }, false);
      s.style.width = s.style.height = '46px';
      const num = document.createElement('span');
      Object.assign(num.style, { position: 'absolute', top: '0', left: '3px', fontSize: '10px', color: '#fff', textShadow: '1px 1px 2px #000', pointerEvents: 'none' });
      num.textContent = i + 1; s.appendChild(num);
      hotbarEl.appendChild(s); hotbarSlots.push(s);
    }
    renderHotbar();
  }
  function renderHotbar() {
    hotbarSlots.forEach((s, i) => {
      paintSlot(s, main[i]);
      s.style.borderColor = i === selected ? '#fff' : 'rgba(255,255,255,.18)';
      s.style.background = i === selected ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.08)';
    });
  }
  function setSelected(i) { selected = (i + 9) % 9; renderHotbar(); sfx && sfx.select(); opts.onSelect && opts.onSelect(); }
  function scroll(dir) { setSelected(selected + (dir > 0 ? 1 : -1)); }

  // --- inventory screen --------------------------------------------------
  let screen = null, storageSlots = [], craftSlots = [], resultSlot = null, cursorEl = null, paletteSlots = [], hotRowSlots = [];
  function filterPalette(q) {
    q = (q || '').trim().toLowerCase();
    for (const [id, s] of paletteSlots) {
      const d = itemDef(id);
      const hay = (id + ' ' + (d && d.name || '')).toLowerCase();
      s.style.display = (!q || hay.includes(q)) ? 'flex' : 'none';
    }
  }
  function buildScreen() {
    screen = document.createElement('div');
    screen.id = 'inv-screen';
    Object.assign(screen.style, {
      position: 'fixed', inset: '0', zIndex: '20', display: 'none', alignItems: 'center',
      justifyContent: 'center', background: 'rgba(0,0,0,.55)', touchAction: 'none',
    });
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: 'rgba(30,30,36,.98)', border: '2px solid rgba(255,255,255,.2)', borderRadius: '12px',
      padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '96vw',
      boxShadow: '0 20px 60px rgba(0,0,0,.5)',
    });
    // crafting row
    const craftRow = document.createElement('div');
    Object.assign(craftRow.style, { display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'center', marginBottom: '4px' });
    const grid = document.createElement('div');
    grid.style.display = 'grid'; grid.style.gap = '3px';
    craftSlots = [];
    for (let i = 0; i < 9; i++) {
      const s = makeSlot(() => clickSlot('craft', i));
      craftSlots.push(s); grid.appendChild(s);
    }
    craftRow.appendChild(grid);
    const arrow = document.createElement('div'); arrow.textContent = '➜';
    Object.assign(arrow.style, { color: '#fff', fontSize: '22px' }); craftRow.appendChild(arrow);
    resultSlot = makeSlot(() => takeResult());
    resultSlot.style.borderColor = 'rgba(255,220,120,.6)';
    craftRow.appendChild(resultSlot);
    panel.appendChild(craftRow);
    grid._el = grid; screen._grid = grid; screen._craftRow = craftRow;

    // creative: search box + full item palette. One tap on an item fills the
    // currently selected hotbar slot (tap a hotbar slot below to choose which).
    const search = document.createElement('input');
    search.type = 'search'; search.placeholder = '🔍 アイテム検索（例: 木 / 鉱石 / ツルハシ / 羊毛）';
    Object.assign(search.style, {
      display: 'none', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.25)',
      background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: '14px', outline: 'none',
    });
    search.addEventListener('input', () => filterPalette(search.value));
    search.addEventListener('pointerdown', (e) => e.stopPropagation());
    panel.appendChild(search); screen._search = search;

    const palette = document.createElement('div');
    Object.assign(palette.style, { display: 'none', gridTemplateColumns: 'repeat(9, 44px)', gap: '3px', maxHeight: '46vh', overflowY: 'auto', padding: '2px' });
    paletteSlots = [];
    CREATIVE_LIST.forEach((id) => {
      const s = makeSlot(() => creativePick(id));
      s.title = (itemDef(id) && itemDef(id).name) || id; // hover tooltip
      paintSlot(s, { item: id, count: 1 });
      palette.appendChild(s); paletteSlots.push([id, s]);
    });
    panel.appendChild(palette); screen._palette = palette;

    // storage (rows 9..35) then hotbar (0..8)
    const store = document.createElement('div');
    store.style.display = 'grid'; store.style.gridTemplateColumns = 'repeat(9, 1fr)'; store.style.gap = '3px';
    storageSlots = [];
    for (let i = 9; i < MAIN; i++) { const s = makeSlot(() => clickSlot('main', i)); storageSlots.push([i, s]); store.appendChild(s); }
    panel.appendChild(store); screen._store = store;
    const hotRow = document.createElement('div');
    hotRow.style.display = 'grid'; hotRow.style.gridTemplateColumns = 'repeat(9, 1fr)'; hotRow.style.gap = '3px'; hotRow.style.marginTop = '6px';
    hotRowSlots = [];
    for (let i = 0; i < 9; i++) {
      // creative: tap a hotbar slot to SELECT it; survival: normal move
      const s = makeSlot(() => { if (creative) { selected = i; renderAll(); sfx && sfx.select(); } else clickSlot('main', i); });
      storageSlots.push([i, s]); hotRowSlots.push([i, s]); hotRow.appendChild(s);
    }
    panel.appendChild(hotRow);

    const hint = document.createElement('div');
    Object.assign(hint.style, { color: 'rgba(255,255,255,.6)', fontSize: '11px', textAlign: 'center', marginTop: '4px' });
    hint.textContent = creative
      ? '下の枠をタップで選択 → アイテムをタップで装填 ／ 検索で絞り込み ／ E・✕ で閉じる'
      : 'タップでアイテム移動 ／ E か ✕ で閉じる';
    panel.appendChild(hint);
    const close = document.createElement('div');
    Object.assign(close.style, { position: 'absolute', top: '14px', right: '18px', color: '#fff', fontSize: '22px', cursor: 'pointer' });
    close.textContent = '✕'; close.addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleScreen(); });
    screen.appendChild(panel); screen.appendChild(close);

    cursorEl = document.createElement('canvas'); cursorEl.width = cursorEl.height = 32;
    Object.assign(cursorEl.style, { position: 'fixed', width: '38px', height: '38px', imageRendering: 'pixelated', pointerEvents: 'none', zIndex: '22', display: 'none' });
    document.body.appendChild(cursorEl);
    screen.addEventListener('pointermove', (e) => moveCursor(e));
    document.body.appendChild(screen);
  }
  function moveCursor(e) {
    if (!cursor) { cursorEl.style.display = 'none'; return; }
    cursorEl.style.display = 'block';
    cursorEl.style.left = (e.clientX - 19) + 'px';
    cursorEl.style.top = (e.clientY - 19) + 'px';
    drawIcon(cursorEl.getContext('2d'), cursor.item);
  }
  function refreshCraftResult() {
    if (!resultSlot) return;
    const r = craftResult(craft.map((c) => (c ? c.item : null)));
    paintSlot(resultSlot, r ? { item: r.id, count: r.count } : null);
  }
  function renderScreen() {
    // creative shows the full item palette instead of crafting + storage
    screen._palette.style.display = creative ? 'grid' : 'none';
    screen._search.style.display = creative ? 'block' : 'none';
    screen._craftRow.style.display = creative ? 'none' : 'flex';
    screen._store.style.display = creative ? 'none' : 'grid';
    // crafting grid layout for size
    const grid = screen._grid;
    grid.style.gridTemplateColumns = `repeat(${craftSize}, 44px)`;
    craftSlots.forEach((s, i) => {
      const r = Math.floor(i / 3), c = i % 3;
      s.style.display = (r < craftSize && c < craftSize) ? 'flex' : 'none';
      paintSlot(s, craft[i]);
    });
    storageSlots.forEach(([idx, s]) => paintSlot(s, main[idx]));
    if (creative) hotRowSlots.forEach(([i, s]) => {
      s.style.borderColor = i === selected ? '#fff' : 'rgba(255,255,255,.18)';
      s.style.background = i === selected ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.08)';
    });
    refreshCraftResult();
    if (cursorEl) { if (!cursor) cursorEl.style.display = 'none'; }
  }
  function renderAll() { renderHotbar(); if (open) renderScreen(); }

  function toggleScreen(size = 2) {
    if (!screen) buildScreen();
    if (screenVisible()) {
      // close: return crafting-grid items + held cursor stack to the inventory
      for (let i = 0; i < 9; i++) if (craft[i]) { add(craft[i].item, craft[i].count); craft[i] = null; }
      if (cursor) { add(cursor.item, cursor.count); cursor = null; cursorEl.style.display = 'none'; }
      screen.style.display = 'none';
      open = false;
    } else {
      craftSize = size;
      screen.style.display = 'flex';
      open = true;
      renderScreen();
    }
  }
  function screenVisible() { return !!screen && screen.style.display === 'flex'; }

  return {
    mountHotbar, add, selectedItem, selectedCell, consumeSelected, heldTool, damageHeldTool,
    setSelected, scroll, get selected() { return selected; },
    toggleScreen, isOpen: () => screenVisible(),
    give(itemId, count) { add(itemId, count); },
    selectedDef() { const c = main[selected]; return c ? itemDef(c.item) : null; },
    holdingShield() { const d = this.selectedDef(); return !!(d && d.shield); },
    armorPoints() {
      let head = 0, chest = 0;
      for (const c of main) {
        if (!c) continue;
        const d = itemDef(c.item);
        if (d && d.armor) { if (d.slot === 'chest') chest = Math.max(chest, d.armor); else head = Math.max(head, d.armor); }
      }
      return head + chest;
    },
    // test-only hooks
    _debug: { main, craft, takeResult, clickSlot, getCursor: () => cursor },
  };
}
