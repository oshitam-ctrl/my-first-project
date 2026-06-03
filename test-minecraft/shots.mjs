// shots.mjs — capture clean STILLS (one per reel beat) with baked kinetic
// captions. Stills are 100% reliable (no recording stalls); ffmpeg adds the
// motion (zoom) + cuts afterwards. 720x1280 PNGs → /tmp/beat_NN.png
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
const W=720,H=1280;
const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer(async(req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/minecraft'||p==='/minecraft/')p='/minecraft/index.html'; const f=path.join(ROOT,p); if(!f.startsWith(ROOT)||!existsSync(f)){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':(MIME[path.extname(f)]||'application/octet-stream')+'; charset=utf-8'}); res.end(await readFile(f));});
await new Promise(r=>server.listen(0,r)); const port=server.address().port;
const browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--hide-scrollbars','--mute-audio']});
const ctx=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
await page.goto(`http://localhost:${port}/minecraft`,{waitUntil:'load'}); await page.waitForTimeout(1200);
await page.evaluate(()=>{
  const css=document.createElement('style'); css.textContent=`
    #hud,#topbar,#hotbar,#crosshair,.pp-hide{display:none!important;}
    #pp{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:'Noto Sans JP','IPAGothic',sans-serif;}
    #pp .vig{position:absolute;inset:0;box-shadow:inset 0 0 180px 50px rgba(0,0,0,.5);}
    #kx{position:absolute;left:5%;right:5%;top:12%;text-align:center;}
    #kx .t{display:inline-block;color:#fff;font-weight:900;font-size:52px;line-height:1.26;
      text-shadow:0 0 2px #0e2e2a,3px 3px 0 #0e2e2a,-2px 2px 0 #0e2e2a,2px -2px 0 #0e2e2a,-2px -2px 0 #0e2e2a,0 8px 22px rgba(0,0,0,.6);}
    #kx.big .t{font-size:64px;} #kx .hl{color:#ffd24a;}`;
  document.head.appendChild(css);
  const pp=document.createElement('div'); pp.id='pp'; pp.innerHTML=`<div class="vig"></div><div id="kx"><span class="t"></span></div>`; document.body.appendChild(pp);
  window.__kx=(html,big)=>{ const k=pp.querySelector('#kx'); k.classList.toggle('big',!!big); pp.querySelector('#kx .t').innerHTML=html; };
});
await page.evaluate(()=>window.__view&&window.__view(8,32,-18,0,-0.05));
await page.click('#overlay',{timeout:60000}).catch(()=>{});
await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
await page.evaluate(()=>{ window.__time&&window.__time(0.5);
  setInterval(()=>{ for(const el of document.querySelectorAll('div')){ if(el.id==='pp'||el.closest('#pp'))continue; const t=el.textContent||''; if(/今日のしごと|パン屋|工房ボタン|右上の|店主に|こちら|本日のパン|規格外|店頭|いらっしゃ|ありがとう|ようこそ|どこ|集めよう|小麦/.test(t)) el.classList.add('pp-hide'); } },80);
});
await page.waitForTimeout(2500);

// beat: [x,y,z,yaw,pitch], caption, big?, time?
const BEATS = [
  [[8,32,-19,0,-0.05],     `実在のパン屋が、<br><span class="hl">まるごとゲームに</span>🥖`, true],
  [[14,31,-32.5,0.05,-0.11], `<span class="hl">ブラウザで、無料。</span>`, false],
  [[13.9,31,-34.6,-0.02,-0.13], `焼きたてが<span class="hl">ずらり</span>🍞`, false],
  [[14,31,-45.5,0,-0.03],  `畑の野菜から<br><span class="hl">パンを焼ける</span>🔥`, false],
  [[14,31,-34.2,0,-0.07],  `お店で<span class="hl">売れる</span>🛍️`, false],
  [[14.2,31,-35.3,0.12,-0.18], `看板は<span class="hl">カンパーニュ</span>`, false],
  [[-19,31,-29.3,0,-0.13], `カフェも<span class="hl">併設</span>☕`, false],
  [[8,42,3,0,-0.42],       `校庭で、のんびり`, false, 0.5],
  [[8,40,1,0,-0.36],       `夕方まで<span class="hl">遊べる</span>`, false, 0.72],
];
let i=0;
for (const [cam,cap,big,tm] of BEATS) {
  if (tm!=null) await page.evaluate(t=>window.__time&&window.__time(t), tm);
  await page.evaluate(a=>window.__view&&window.__view(...a), cam);
  await page.evaluate(a=>window.__kx(a.h,a.big), {h:cap,big});
  await page.waitForTimeout(1700); // let chunks/lighting settle for a clean still
  const f=`/tmp/beat_${String(i).padStart(2,'0')}.png`;
  await page.screenshot({path:f}); console.log('shot', f); i++;
}
console.log('pageerrors:', errs.length);
await browser.close(); await new Promise(r=>server.close(r));
