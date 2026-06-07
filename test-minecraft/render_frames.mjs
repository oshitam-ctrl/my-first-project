// OFFLINE deterministic render: move camera by a fixed increment per frame,
// fully render, screenshot → /tmp/frames/f_NNNNNN.png. Assembled at 30fps it is
// perfectly smooth (no real-time stutter). Camera path = eased scene moves.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const W=720,H=1280, FPS=30;
const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer(async(req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/minecraft'||p==='/minecraft/')p='/minecraft/index.html'; const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':(MIME[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'}); res.end(await readFile(f));});
await new Promise(r=>server.listen(0,r)); const port=server.address().port;
const OUT='/tmp/frames'; mkdirSync(OUT,{recursive:true});

// scene: [from(x,y,z,yaw,pit), to, durSec, time]
const SCENES = [
  [[8,33,-11,0,-0.05],   [8,31.6,-21,0,-0.06],     7, 0.5],
  [[14,31,-30,0.05,-0.10],[14,31,-34.7,-0.03,-0.12],7, 0.5],
  [[14.6,31,-35.6,0.16,-0.2],[13.5,31,-34.7,-0.04,-0.13],6.5,0.5],
  [[14,31,-42,0,-0.04],  [14,31,-46.6,0,-0.02],    6.5,0.5],
  [[13.4,31,-32,0,-0.05],[15.2,31,-34.3,0,-0.08],  6.5,0.5],
  [[-19,31,-25.5,0,-0.10],[-19,31,-30.4,0,-0.15],  6.5,0.5],
  [[-4,33.5,8,0,-0.18],  [-4,31.7,-3,0,-0.30],     6.5,0.5],
  [[-3,35,-17,0.32,-0.10],[32,35,-17,0.32,-0.10],  7.5,0.5],
  [[7,41,9,0,-0.42],     [7,37,-4,0,-0.33],        7.0,0.58],
  [[14.6,31,-34.6,0.1,-0.18],[14.0,31,-35.3,0,-0.16],6.0,0.5],
  [[14,31,-33,0,-0.06],  [14,31,-30.5,0.05,-0.10], 6.0,0.5],
  [[8,32,-18,0,-0.05],   [8,31.6,-21,0,-0.06],     7.0,0.64],
];
const ease=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

const browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--hide-scrollbars','--mute-audio']});
const ctx=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(`http://localhost:${port}/minecraft`,{waitUntil:'load'}); await page.waitForTimeout(1000);
await page.evaluate(()=>{ const c=document.createElement('style'); c.textContent='#hud,#topbar,#hotbar,#crosshair,.pp-hide{display:none!important}'; document.head.appendChild(c); });
await page.click('#overlay',{timeout:60000}).catch(()=>{});
await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
await page.evaluate(()=>{ setInterval(()=>{for(const el of document.querySelectorAll('div')){const x=el.textContent||'';if(/今日のしごと|パン屋|工房ボタン|右上の|店主に|こちら|本日のパン|規格外|店頭|いらっしゃ|ありがとう|ようこそ|どこ|集めよう|小麦/.test(x))el.classList.add('pp-hide');}},120); });
await page.waitForTimeout(1500);

let g=0;
for (let s=0;s<SCENES.length;s++){
  const [from,to,dur,tm]=SCENES[s];
  await page.evaluate(t=>window.__time&&window.__time(t), tm);
  await page.evaluate(a=>window.__view&&window.__view(...a), from);
  await page.waitForTimeout(1200);                 // chunk load at scene start
  const n=Math.round(dur*FPS);
  for (let f=0;f<n;f++){
    const e=ease(f/(n-1||1));
    const cam=from.map((v,i)=>v+(to[i]-v)*e);
    await page.evaluate(a=>window.__view&&window.__view(...a), cam);
    await page.waitForTimeout(60);                 // let swiftshader render the frame
    await page.screenshot({path:`${OUT}/f_${String(g).padStart(6,'0')}.png`});
    g++;
  }
  console.log(`scene ${s} done, frames=${g}`);
}
console.log('TOTAL frames:', g, 'pageerrors:', errs.length);
await browser.close(); await new Promise(r=>server.close(r));
