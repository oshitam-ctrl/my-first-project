// promo.mjs — records REAL gameplay footage (moving camera, live NPCs, day→night)
// as a hook-first reel. Recorded at a safe pace with a brief black dip between
// beats (jump-cut feel + lets the screencast encoder breathe → no stall); ffmpeg
// then speeds it up ~1.3x for the snappy reel. Silent (add trending audio in IG).
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const W = 720, H = 1280;
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

await page.evaluate(() => {
  const css = document.createElement('style');
  css.textContent = `
    #hud,#topbar,#hotbar,#crosshair,.pp-hide{display:none!important;}
    #pp{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:'Noto Sans JP','IPAGothic',sans-serif;}
    #pp .vig{position:absolute;inset:0;box-shadow:inset 0 0 180px 50px rgba(0,0,0,.5);}
    #blk{position:absolute;inset:0;background:#0c1413;opacity:0;transition:opacity .12s linear;}
    #kx{position:absolute;left:5%;right:5%;top:12%;text-align:center;opacity:0;transform:scale(1.2);}
    #kx .t{display:inline-block;color:#fff;font-weight:900;font-size:52px;line-height:1.26;
      text-shadow:0 0 2px #0e2e2a,3px 3px 0 #0e2e2a,-2px 2px 0 #0e2e2a,2px -2px 0 #0e2e2a,-2px -2px 0 #0e2e2a,0 8px 22px rgba(0,0,0,.6);}
    #kx.big .t{font-size:64px;} #kx .hl{color:#ffd24a;}`;
  document.head.appendChild(css);
  const pp = document.createElement('div'); pp.id='pp';
  pp.innerHTML = `<div class="vig"></div><div id="blk"></div><div id="kx"><span class="t"></span></div>`;
  document.body.appendChild(pp);
  const kx=pp.querySelector('#kx'), kt=pp.querySelector('#kx .t'), blk=pp.querySelector('#blk');
  const ease=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  window.__pp={ cur:[8,32,-18,0,-0.05], raf:0,
    set(a){ this.cur=a.slice(); window.__view&&window.__view(...a); },
    moveTo(to,dur){ cancelAnimationFrame(this.raf); const from=this.cur.slice(),t0=performance.now();
      const st=()=>{ const k=Math.min(1,(performance.now()-t0)/dur),e=ease(k); this.cur=from.map((v,i)=>v+(to[i]-v)*e); window.__view&&window.__view(...this.cur); if(k<1)this.raf=requestAnimationFrame(st); }; this.raf=requestAnimationFrame(st); },
    kick(html,big){ kx.classList.toggle('big',!!big); kt.innerHTML=html; kx.style.transition='none'; kx.style.opacity='0'; kx.style.transform='scale(1.2)'; void kx.offsetWidth; kx.style.transition='opacity .13s ease, transform .15s cubic-bezier(.2,1.5,.3,1)'; kx.style.opacity=html?'1':'0'; kx.style.transform='scale(1)'; },
    black(v){ blk.style.opacity=String(v); }, time(t){ window.__time&&window.__time(t); },
    timeRamp(a,b,dur){ const s=performance.now(); const st=()=>{ const k=Math.min(1,(performance.now()-s)/dur); window.__time&&window.__time(a+(b-a)*k); if(k<1)requestAnimationFrame(st); }; requestAnimationFrame(st); },
  };
});

await page.evaluate(()=>window.__pp.black(1));
await page.click('#overlay',{timeout:60000}).catch(()=>{});
await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
await page.evaluate(()=>{ window.__time&&window.__time(0.5);
  setInterval(()=>{ for(const el of document.querySelectorAll('div')){ if(el.id==='pp'||el.closest('#pp'))continue; const t=el.textContent||''; if(/今日のしごと|パン屋|工房ボタン|右上の|店主に|こちら|本日のパン|規格外|店頭|いらっしゃ|ありがとう|ようこそ|どこ|集めよう|小麦/.test(t)) el.classList.add('pp-hide'); } },80);
});
// preload chunks along the path so jumps render cleanly
for (const c of [[14,31,-40,0,-0.05],[14,31,-33,0,-0.1],[8,32,-18,0,-0.05]]) { await page.evaluate(a=>window.__pp.set(a),c); await page.waitForTimeout(1100); }
await page.waitForTimeout(1800);

const wait=(ms)=>page.waitForTimeout(ms);
// real-gameplay beat: brief black dip (breathe + jump cut) → reveal new shot with
// caption while the camera keeps MOVING (real footage).
async function beat(cam,to,dur,text,big,hold){
  await page.evaluate(()=>window.__pp.black(1)); await wait(120);
  await page.evaluate(a=>{ window.__pp.set(a.cam); window.__pp.kick(a.text,a.big); window.__pp.black(0); window.__pp.moveTo(a.to,a.dur); }, {cam,to,text,big,dur});
  await wait(hold);
}

try {
  // Recorded SLOW (reliable — fast recording stalls ~10s); ffmpeg speeds ×2.
  // HOOK (no dip): storefront push-in
  await page.evaluate(a=>{ window.__pp.black(0); window.__pp.set(a.cam); window.__pp.kick(a.text,true); window.__pp.moveTo(a.to,a.dur); },
    {cam:[8,32,-18,0,-0.05], to:[8,31.4,-21.2,0,-0.06], dur:3600, text:`実在のパン屋が、<br><span class="hl">まるごとゲームに</span>🥖`});
  await wait(3800);
  await beat([14.2,31,-30.5,0.10,-0.10],[13.8,31,-34.2,-0.05,-0.12],3600,`<span class="hl">ブラウザで、無料。</span>`,false,3500);
  await beat([14.3,31,-35.5,0.16,-0.18],[13.8,31,-34.7,-0.02,-0.13],3400,`焼きたてが<span class="hl">ずらり</span>🍞`,false,3300);
  await beat([14,31,-44,0,-0.03],[14,31,-46.6,0,-0.02],3400,`畑の野菜から<br><span class="hl">パンを焼ける</span>🔥`,false,3300);
  await beat([14,31,-33.3,0,-0.05],[14,31,-35,0,-0.08],3400,`お店で<span class="hl">売れる</span>🛍️`,false,3300);
  await beat([-19,31,-27.5,0,-0.10],[-19,31,-30.2,0,-0.15],3600,`カフェも<span class="hl">併設</span>☕`,false,3500);
  await beat([7,40,6,0,-0.40],[7,37.5,-4,0,-0.33],4200,`校庭で、のんびり`,false,4100);
  // CTA loop seam: storefront again
  await beat([8,32,-18,0,-0.05],[8,31.4,-21.2,0,-0.06],3600,`ぜんぶ、<span class="hl">ブラウザで。</span>`,true,3600);
  await page.evaluate(()=>window.__pp.black(1)); await wait(700);
} catch(e){ console.log('reel error:', e.message); }

console.log('pageerrors:', errs.length, errs.slice(0,3).join(' | '));
await page.waitForTimeout(200);
const video = page.video();
await ctx.close();
console.log('VIDEO:', video ? await video.path() : null);
await browser.close();
await new Promise(r=>server.close(r));
