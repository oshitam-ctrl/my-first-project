// render_reel.mjs — timeline-driven OFFLINE renderer for the 神実況リール v2.
// Reads /tmp/voice2/timings.json; each line's [start,end] maps to a scene with a
// camera path. Frames are rendered ONE BY ONE (set camera → settle → screenshot)
// so the final 30fps assembly is perfectly smooth AND perfectly synced to the
// voice. Resumable: existing frames are skipped.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';

const FPS = 30, GAP = 0.14, W = 540, H = 960; // low-res render (ffmpeg upscales)
const OUT = '/tmp/frames2';
fs.mkdirSync(OUT, { recursive: true });
const T = JSON.parse(fs.readFileSync('/tmp/voice2/timings.json', 'utf8'));

const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png' };
const server = http.createServer(async (req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/minecraft'||p==='/minecraft/')p='/minecraft/index.html'; const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':(MIME[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'}); res.end(await readFile(f)); });
await new Promise(r=>server.listen(0,r));
const port = server.address().port;

// Scene table: scene key → { from, to: [x,y,z,yaw,pitch], time, action? }
// yaw: 0 = -z, π = +z, negative ≈ toward +x, positive ≈ toward -x (calibrated).
const SC = {
  hook:    { from:[8,33.2,-8,0,-0.04],      to:[8,32.2,-14,0,-0.06],     time:0.5 },
  facade:  { from:[8,32.2,-14,0,-0.06],     to:[8,31.9,-19.5,0,-0.08],   time:0.5 },
  clock:   { from:[8,40.5,-15,0,0.10],      to:[8,41.5,-17.5,0,0.10],    time:0.5 },
  genkan:  { from:[8,31.9,-23.4,0,-0.12],   to:[8,31.9,-26.2,0,-0.10],   time:0.5 },
  corridor:{ from:[6,32,-27,-1.30,-0.05],   to:[12.5,32,-27,-1.30,-0.05],time:0.5 },
  hero:    { from:[14,32,-31.2,0,-0.06],    to:[14,31.8,-34.4,0,-0.10],  time:0.5 },
  hero2:   { from:[12.6,31.8,-34.7,0.22,-0.12], to:[15.4,31.8,-34.7,-0.22,-0.12], time:0.5 },
  yeast:   { from:[12.2,33.4,-33,1.25,0.0], to:[10.8,33.8,-33,1.25,0.06],time:0.5 },
  yeast2:  { from:[11.4,33.8,-31.5,1.1,0.02], to:[10.6,33.6,-34,1.35,0.04], time:0.5 },
  buy:     { from:[14,31.9,-34,0,-0.08],    to:[14,31.9,-34.6,0,-0.08],  time:0.5, action:'shopOpen', endAction:'panelClose' },
  field:   { from:[-4,33.6,4,0,-0.35],      to:[-4,32.4,-2,0,-0.30],     time:0.5 },
  field2:  { from:[-4,32.2,-1,0,-0.45],     to:[-3,31.9,-4,0,-0.32],     time:0.5 },
  ferment: { from:[15.6,32.6,-38,0.45,-0.12], to:[17.6,32.5,-39.4,0.40,-0.08], time:0.5 },
  oven:    { from:[14,32,-43.5,0,-0.05],    to:[14,31.9,-46.4,0,-0.02],  time:0.5 },
  deliver: { from:[14,31.9,-33.2,0,-0.08],  to:[14,31.9,-35,0,-0.10],    time:0.5 },
  open:    { from:[14,31.9,-35,0,-0.10],    to:[13.6,31.9,-34.2,0.15,-0.10], time:0.5, action:'questComplete' },
  queue:   { from:[8,32.6,-13.5,0,-0.10],   to:[8,32.1,-17,0,-0.12],     time:0.5 },
  queue2:  { from:[6.5,32.2,-16,0.35,-0.12],to:[9.5,32.2,-17.5,-0.35,-0.12], time:0.5 },
  cafe:    { from:[-19.5,32,-28,0,-0.10],   to:[-19.5,31.9,-30.6,0,-0.12], time:0.5 },
  lunch:   { from:[18,32.3,-8,3.14,-0.10],  to:[18,31.9,-5.6,3.14,-0.14], time:0.5 },
  lunch2:  { from:[14.5,33,-1,2.55,-0.20],  to:[16.2,32.4,-2.6,2.85,-0.18], time:0.5 },
  gym:     { from:[38,32.8,-11.5,3.14,-0.05], to:[38,32.4,-6,3.14,-0.08], time:0.5 },
  valley:  { from:[8,48,22,0,-0.50],        to:[-6,46,27,0.35,-0.44],    time:0.5 },
  cta:     { from:[8,32.6,-12.5,0,-0.05],   to:[8,31.8,-19.2,0,-0.08],   time:0.66 },
};
const ease = t => (t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2);

const browser = await chromium.launch({ args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--hide-scrollbars','--mute-audio'] });
const ctx = await browser.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:1 });
const page = await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.addInitScript(()=>{ try{ localStorage.setItem('mc_settings', JSON.stringify({dist:5})); }catch(e){} });
await page.goto(`http://localhost:${port}/minecraft`,{waitUntil:'load'});
await page.waitForTimeout(1200);
await page.evaluate(()=>{
  const c=document.createElement('style');
  c.textContent='#hud,#topbar,#hotbar,#crosshair,.pp-hide{display:none!important}';
  document.head.appendChild(c);
});
await page.click('#overlay',{timeout:60000}).catch(()=>{});
await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
await page.evaluate(()=>{
  // hide quest/guide/speech/pricecard/sanpo chips persistently (toasts stay visible)
  setInterval(()=>{ for (const el of document.querySelectorAll('div')) {
    const t=el.textContent||'';
    if (/今日のしごと|南方さんぽ|パン屋はこちら|工房ボタン|右上の|店主に|本日のパン|こちら（校舎内）/.test(t) && el.style) el.classList.add('pp-hide');
  } }, 100);
});
await page.waitForTimeout(2200);

async function doAction(a){
  if (a==='shopOpen') await page.evaluate(()=>{ window.__view&&window.__view(14,31,-34,0,-0.08); window.__shop&&window.__shop.open(); });
  if (a==='panelClose') await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='✕'&&x.offsetParent!==null); if(b)b.click(); });
  if (a==='questComplete') await page.evaluate(()=>{
    const B=window.__bakery; if(!B) return;
    B.give('wheat',1); B.give('surplus_veg',1); B.give('levain',1); B.give('bread',1);
    window.__view&&window.__view(14,31,-35,0,-0.1); // stand near baker
    window.__quest&&window.__quest();
  });
}

let g = 0, rendered = 0, skipped = 0;
const t0 = Date.now();
const START_LINE = parseInt(process.env.START_LINE||'0',10);
for (const line of T) {
  const sc = SC[line.scene];
  if (!sc) { console.log('NO SCENE for', line.scene); continue; }
  if (line.i < START_LINE) {  // another worker owns earlier lines; just advance g
    g += Math.round(((line.end + GAP) - line.start) * FPS);
    continue;
  }
  const span = (line.end + GAP) - line.start;
  const n = Math.round(span * FPS);
  // does this scene need rendering at all?
  let need = false;
  for (let f=0; f<n; f++) if (!fs.existsSync(`${OUT}/f_${String(g+f).padStart(6,'0')}.jpg`)) { need = true; break; }
  if (need) {
    await page.evaluate(a=>{ window.__time&&window.__time(a.t); window.__view&&window.__view(...a.cam); }, {t:sc.time, cam:sc.from});
    await page.waitForTimeout(1100);                       // chunk settle at scene start
    if (sc.action) { await doAction(sc.action); await page.waitForTimeout(350); }
  }
  for (let f=0; f<n; f++) {
    const fn = `${OUT}/f_${String(g+f).padStart(6,'0')}.jpg`;
    if (fs.existsSync(fn)) { skipped++; continue; }
    const k = ease(f/(n-1||1));
    const cam = sc.from.map((v,i)=>v+(sc.to[i]-v)*k);
    await page.evaluate(a=>{ window.__time&&window.__time(a.t); window.__view&&window.__view(...a.cam); }, {t:sc.time, cam});
    await page.waitForTimeout(40);
    try { await page.screenshot({ path: fn, type:'jpeg', quality: 88, timeout: 20000 }); }
    catch(e){ console.log('retry frame', g+f); await page.waitForTimeout(500); await page.screenshot({ path: fn, type:'jpeg', quality: 88, timeout: 20000 }); }
    rendered++;
  }
  if (sc.endAction) await doAction(sc.endAction);
  g += n;
  console.log(`scene ${line.scene} done (line ${line.i}) frames=${g} elapsed=${((Date.now()-t0)/1000)|0}s`);
}
console.log(`DONE total=${g} rendered=${rendered} skipped=${skipped} pageerrors=${errs.length}`);
await browser.close(); await new Promise(r=>server.close(r));
