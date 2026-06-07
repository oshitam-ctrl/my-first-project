// Record clean gameplay b-roll passes (no captions; HUD hidden). Slow camera +
// brief black dips = reliable. Two passes (interior / exterior) → webm each.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const W=720,H=1280;
const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer(async(req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/minecraft'||p==='/minecraft/')p='/minecraft/index.html'; const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':(MIME[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'}); res.end(await readFile(f));});
await new Promise(r=>server.listen(0,r)); const port=server.address().port;

// steps: [from,to,durMs]  (camera tour). time set once per pass.
const PASSES = [
  { dir:'/tmp/broll/A', time:0.5, steps:[
    [[8,33,-12,0,-0.05],[8,31.6,-21,0,-0.06],2800],
    [[14,31,-30,0.05,-0.10],[14,31,-34.6,-0.03,-0.12],2800],
    [[14.5,31,-35.6,0.16,-0.2],[13.6,31,-34.8,-0.04,-0.14],2700],
    [[14,31,-42,0,-0.04],[14,31,-46.5,0,-0.02],2700],
    [[13.5,31,-32,0,-0.05],[15,31,-34.2,0,-0.08],2700],
    [[-19,31,-26,0,-0.10],[-19,31,-30.3,0,-0.15],2800],
  ]},
  { dir:'/tmp/broll/B', time:0.5, steps:[
    [[-4,33,7,0,-0.18],[-4,31.8,-3,0,-0.30],2800],
    [[-2,35,-17,0.32,-0.10],[30,35,-17,0.32,-0.10],3200],
    [[7,40,8,0,-0.40],[7,37.5,-3,0,-0.33],3000],
    [[14.5,31,-34.5,0.1,-0.18],[14.1,31,-35.2,0,-0.16],2700],
    [[14,31,-33.3,0,-0.05],[14,31,-35,0,-0.08],2700],
    [[8,32,-18,0,-0.05],[8,31.6,-21,0,-0.06],2800],
  ]},
];

async function recPass(p){
  mkdirSync(p.dir,{recursive:true});
  const ctx=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,recordVideo:{dir:p.dir,size:{width:W,height:H}}});
  const page=await ctx.newPage();
  await page.goto(`http://localhost:${port}/minecraft`,{waitUntil:'load'}); await page.waitForTimeout(900);
  await page.evaluate(()=>{
    const c=document.createElement('style'); c.textContent='#hud,#topbar,#hotbar,#crosshair,.pp-hide{display:none!important}#blk{position:fixed;inset:0;background:#0c1413;z-index:2147483000;opacity:1;pointer-events:none;transition:opacity .14s}'; document.head.appendChild(c);
    const b=document.createElement('div'); b.id='blk'; document.body.appendChild(b);
    const ease=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    window.__pp={cur:[8,32,-18,0,-0.05],raf:0,
      set(a){this.cur=a.slice();window.__view&&window.__view(...a);},
      moveTo(to,d){cancelAnimationFrame(this.raf);const f=this.cur.slice(),t0=performance.now();const s=()=>{const k=Math.min(1,(performance.now()-t0)/d),e=ease(k);this.cur=f.map((v,i)=>v+(to[i]-v)*e);window.__view&&window.__view(...this.cur);if(k<1)this.raf=requestAnimationFrame(s);};this.raf=requestAnimationFrame(s);},
      black(v){document.getElementById('blk').style.opacity=v;}};
  });
  await page.click('#overlay',{timeout:60000}).catch(()=>{});
  await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
  await page.evaluate((t)=>{window.__time&&window.__time(t);
    setInterval(()=>{for(const el of document.querySelectorAll('div')){if(el.id==='blk')continue;const x=el.textContent||'';if(/今日のしごと|パン屋|工房ボタン|右上の|店主に|こちら|本日のパン|規格外|店頭|いらっしゃ|ありがとう|ようこそ|どこ|集めよう|小麦/.test(x))el.classList.add('pp-hide');}},80);},p.time);
  await page.evaluate(a=>window.__pp.set(a), p.steps[0][0]);
  await page.waitForTimeout(2500);            // settle under black
  for (let i=0;i<p.steps.length;i++){
    const [from,to,dur]=p.steps[i];
    if(i>0){ await page.evaluate(()=>window.__pp.black(1)); await page.waitForTimeout(150); await page.evaluate(a=>window.__pp.set(a),from); }
    await page.evaluate(()=>window.__pp.black(0));
    await page.evaluate(a=>window.__pp.moveTo(a.to,a.dur),{to,dur});
    await page.waitForTimeout(dur+120);
  }
  await page.evaluate(()=>window.__pp.black(1)); await page.waitForTimeout(400);
  await ctx.close();
  console.log('pass done:', p.dir);
}

const browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--hide-scrollbars','--mute-audio']});
for (const p of PASSES){ try{ await recPass(p);}catch(e){ console.log('pass ERR',p.dir,e.message);} }
await browser.close(); await new Promise(r=>server.close(r)); console.log('BROLL DONE');
