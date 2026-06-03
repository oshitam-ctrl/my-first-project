// promo.mjs — records a ~90s vertical (9:16) intro video of プチヘルメース.
// Playwright records the whole page (3D + game UI + our injected telops). The
// "edit" is a choreographed camera + telop timeline driven from here. Silent.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const W = 720, H = 1280;                 // 9:16
const ROOT = path.resolve(import.meta.dirname, '../public');
const OUTDIR = '/tmp/promo-vid';
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png' };
const server = http.createServer(async (req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/minecraft'||p==='/minecraft/')p='/minecraft/index.html'; const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':(MIME[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'}); res.end(await readFile(f)); });
await new Promise(r=>server.listen(0,r));
const port = server.address().port;

const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--hide-scrollbars','--mute-audio'] });
const ctx = await browser.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:1, recordVideo:{ dir:OUTDIR, size:{width:W,height:H} } });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(`http://localhost:${port}/minecraft`,{waitUntil:'load'});
await page.waitForTimeout(1200);

// ── inject the "director": overlay DOM + camera tween + telop/card/fade ──────
await page.evaluate(() => {
  const css = document.createElement('style');
  css.textContent = `
    #hud{display:none!important;} /* hide FPS/XYZ debug line */
    #crosshair,.crosshair{display:none!important;}
    #pp{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:'Noto Sans JP','Hiragino Sans',sans-serif;}
    #pp .lt{position:absolute;left:6%;right:6%;bottom:13%;text-align:center;opacity:0;transform:translateY(14px);
      transition:opacity .5s ease,transform .5s ease;}
    #pp .lt .box{display:inline-block;background:rgba(43,111,106,.92);color:#f3efe6;padding:14px 20px;border-radius:16px;
      font-weight:800;font-size:30px;line-height:1.5;box-shadow:0 10px 30px rgba(0,0,0,.45);max-width:92%;
      border:2px solid rgba(255,255,255,.18);}
    #pp .lt .sub{display:block;font-size:20px;font-weight:600;opacity:.92;margin-top:6px;}
    #pp .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
      background:linear-gradient(160deg,#2f7870,#1e433f);color:#f6f1e7;opacity:0;transition:opacity .6s ease;text-align:center;padding:8%;}
    #pp .card h1{font-size:52px;font-weight:900;margin:0;letter-spacing:.02em;}
    #pp .card h2{font-size:30px;font-weight:700;margin:0;opacity:.95;}
    #pp .card p{font-size:24px;margin:0;opacity:.9;}
    #pp .card .pill{margin-top:8px;background:#f6f1e7;color:#1e433f;font-weight:800;font-size:24px;padding:12px 22px;border-radius:999px;}
    #pp .card .url{font-size:21px;opacity:.95;background:rgba(0,0,0,.22);padding:8px 14px;border-radius:10px;}
    #pp #blk{position:absolute;inset:0;background:#0c1413;opacity:0;transition:opacity .5s ease;}
    #pp .vig{position:absolute;inset:0;box-shadow:inset 0 0 160px 40px rgba(0,0,0,.45);pointer-events:none;}
  `;
  document.head.appendChild(css);
  const pp = document.createElement('div'); pp.id='pp';
  pp.innerHTML = `<div class="vig"></div><div id="blk"></div>
    <div class="lt"><span class="box"></span></div>
    <div class="card"></div>`;
  document.body.appendChild(pp);
  const ltEl = pp.querySelector('.lt'), boxEl = pp.querySelector('.lt .box');
  const cardEl = pp.querySelector('.card'), blk = pp.querySelector('#blk');
  const ease = t => t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  const P = {
    cur:[8,33,-14,0,-0.03],
    set(a){ this.cur=a.slice(); window.__view&&window.__view(...a); },
    moveTo(to,dur){ const from=this.cur.slice(); const t0=performance.now();
      const step=()=>{ const k=Math.min(1,(performance.now()-t0)/dur); const e=ease(k);
        const a=from.map((v,i)=>v+(to[i]-v)*e); this.cur=a; window.__view&&window.__view(...a);
        if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); },
    lower(html){ boxEl.innerHTML=html; ltEl.style.opacity='1'; ltEl.style.transform='translateY(0)'; },
    lowerClear(){ ltEl.style.opacity='0'; ltEl.style.transform='translateY(14px)'; },
    card(html){ cardEl.innerHTML=html; cardEl.style.opacity='1'; },
    cardOut(){ cardEl.style.opacity='0'; },
    black(v){ blk.style.opacity=String(v); },
    time(t){ window.__time&&window.__time(t); },
  };
  window.__pp = P;
});

// start the game hidden behind black, settle, then run the show
await page.evaluate(()=>{ window.__pp.black(1); });
await page.click('#overlay',{timeout:60000}).catch(()=>{});
await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
await page.waitForTimeout(2400); // settle: world built + game running before reveal
await page.evaluate(()=>{
  window.__time && window.__time(0.30);
  // make the bake panel look active later
  const g=window.__bakery; if(g){ g.give&&g.give('levain',3); g.give&&g.give('wheat',4); g.give&&g.give('flour',4); g.give&&g.give('surplus_veg',5); g.give&&g.give('ripe_fruit',2); g.give&&g.give('natural_yeast',1);}
  window.__pp.set([8,33,-14,0,-0.03]);
});

const wait = (ms)=>page.waitForTimeout(ms);
const ev = (fn,arg)=>page.evaluate(fn,arg);
const moveTo=(to,dur)=>ev((a)=>window.__pp.moveTo(a.to,a.dur),{to,dur});
const setCam=(a)=>ev((x)=>window.__pp.set(x),a);
const lower=(h)=>ev((x)=>window.__pp.lower(x),h);
const lowerClear=()=>ev(()=>window.__pp.lowerClear());
const card=(h)=>ev((x)=>window.__pp.card(x),h);
const cardOut=()=>ev(()=>window.__pp.cardOut());
const black=(v)=>ev((x)=>window.__pp.black(x),v);
const setTime=(t)=>ev((x)=>window.__time&&window.__time(x),t);
const clickBtn=(emoji)=>ev((e)=>{ const b=[...document.querySelectorAll('#topbar button')].find(x=>x.textContent.trim()===e); if(b) b.click(); },emoji);
const openShop=()=>ev(()=>window.__shop&&window.__shop.open());
const closePanel=()=>ev(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='✕'&&x.offsetParent!==null); if(b)b.click(); });

async function cut(toCam){ await black(1); await wait(300); await setCam(toCam); await wait(120); await black(0); }

try {
  // ── Scene 1: TITLE (push toward facade, dawn) ─────────────────────────────
  await setCam([8,33,-14,0,-0.02]);
  await black(0);
  await card(`<h1>🥖 プチヘルメース</h1><h2>ブラウザで遊べる、パン屋さんの物語</h2>`);
  moveTo([8,32,-19,0,-0.04], 5200);
  await wait(3600); await cardOut(); await wait(1500);

  // ── Scene 2: STOREFRONT ───────────────────────────────────────────────────
  await lower(`天然酵母のパン屋<span class="sub">旧・南方小学校が、ゲームの世界に。</span>`);
  moveTo([8,31.7,-21.3,0,-0.06], 7000);
  await wait(7000); await lowerClear();

  // ── Scene 3: INTO THE SHOP — fly down the aisle of cases ──────────────────
  await cut([14.2,31,-31,0.10,-0.10]);
  await lower(`ショーケースには、<span class="sub">バゲット・カンパーニュ・クロワッサン。</span>`);
  moveTo([13.8,31,-34.4,-0.10,-0.13], 6800);
  await wait(6900); await lowerClear();

  // ── Scene 4: HERO CAMPAGNE + counter ──────────────────────────────────────
  await lower(`看板は、天然酵母のカンパーニュ。`);
  moveTo([14.4,31,-35,0.14,-0.22], 6000);
  await wait(6100); await lowerClear();

  // ── Scene 5: WORKSHOP + one-tap bake panel ────────────────────────────────
  await cut([14,31,-43,0,-0.04]);
  await lower(`畑の“規格外野菜”から酵母をおこして焼く<span class="sub">— もったいないを、おいしいに。</span>`);
  moveTo([14,31,-46,0,-0.02], 7500);
  await wait(1800);
  await clickBtn('🥖'); await wait(3600); await closePanel(); // open then close bake panel
  await wait(1500); await lowerClear();

  // ── Scene 6: CUSTOMERS + counter (baker greet + price card) + buy panel ───
  await cut([14,31,-33.6,0,-0.05]);
  await lower(`お客さんで賑わう、対面販売。<span class="sub">「いらっしゃいませ！」</span>`);
  moveTo([14,31,-34.6,0,-0.08], 8000);
  await wait(2400); await openShop(); await wait(3600); await closePanel();
  await wait(1300); await lowerClear();

  // ── Scene 7: CAFE South in North ──────────────────────────────────────────
  await cut([-19,31,-27.5,0,-0.10]);
  await lower(`姉妹カフェ「South in North」も。`);
  moveTo([-19,31,-30,0,-0.16], 7000);
  await wait(7100); await lowerClear();

  // ── Scene 8: SCHOOLYARD — aerial, day → evening timelapse ─────────────────
  await cut([8,45,20,0,-0.5]);
  await lower(`広い校庭で、夕暮れまでのんびり。`);
  moveTo([8,42,6,0,-0.42], 8000);
  for (let i=0;i<=7;i++){ await setTime(0.30+i*0.024); await wait(900); }
  await lowerClear();

  // ── Closing aerial pull-up → black (the OUTRO card is appended via ffmpeg) ─
  moveTo([8,48,12,0,-0.5], 4500);
  await wait(2400);
  await black(1); await wait(1700); // tail black (auto-detected for trimming)
} catch(e){ console.log('director error:', e.message); }

console.log('pageerrors:', errs.length, errs.slice(0,3).join(' | '));
await page.waitForTimeout(300);
const video = page.video();
await ctx.close(); // finalizes the webm
const vpath = video ? await video.path() : null;
console.log('VIDEO:', vpath);
await browser.close();
await new Promise(r=>server.close(r));
