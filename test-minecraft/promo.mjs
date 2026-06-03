// promo.mjs — records a ~15s vertical Instagram REEL of プチヘルメース.
// The whole choreography (camera + kinetic captions) runs PAGE-SIDE on one clock
// so visuals and text are always in sync. Hook-first, hard jump cuts, big text,
// loop seam. Silent (add trending audio in IG). ffmpeg trims to ~15s.
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
    #blk{position:absolute;inset:0;background:#0c1413;opacity:0;transition:opacity .22s linear;}
    #fl{position:absolute;inset:0;background:#fff;opacity:0;}
    #kx{position:absolute;left:5%;right:5%;top:12%;text-align:center;opacity:0;transform:scale(1.22);}
    #kx .t{display:inline-block;color:#fff;font-weight:900;font-size:50px;line-height:1.26;
      text-shadow:0 0 2px #0e2e2a,3px 3px 0 #0e2e2a,-2px 2px 0 #0e2e2a,2px -2px 0 #0e2e2a,-2px -2px 0 #0e2e2a,0 8px 22px rgba(0,0,0,.6);}
    #kx.big .t{font-size:62px;}
    #kx .hl{color:#ffd24a;}
    #cta{position:absolute;left:8%;right:8%;bottom:14%;text-align:center;opacity:0;transform:translateY(16px);transition:opacity .25s,transform .25s;}
    #cta .pill{display:inline-block;background:#ffd24a;color:#143b37;font-weight:900;font-size:40px;padding:14px 26px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.45);}
    #cta .s{display:block;color:#fff;font-weight:800;font-size:26px;margin-top:12px;text-shadow:0 2px 8px rgba(0,0,0,.7);}
  `;
  document.head.appendChild(css);
  const pp = document.createElement('div'); pp.id='pp';
  pp.innerHTML = `<div class="vig"></div><div id="blk"></div><div id="fl"></div><div id="kx"><span class="t"></span></div><div id="cta"></div>`;
  document.body.appendChild(pp);
  const kx=pp.querySelector('#kx'), kt=pp.querySelector('#kx .t'), blk=pp.querySelector('#blk'), fl=pp.querySelector('#fl'), cta=pp.querySelector('#cta');
  const ease=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const P={ cur:[8,32,-18,0,-0.05],
    set(a){ this.cur=a.slice(); window.__view&&window.__view(...a); },
    moveTo(to,dur){ const from=this.cur.slice(),t0=performance.now();
      const st=()=>{ const k=Math.min(1,(performance.now()-t0)/dur),e=ease(k); this.cur=from.map((v,i)=>v+(to[i]-v)*e); window.__view&&window.__view(...this.cur); if(k<1)requestAnimationFrame(st); }; requestAnimationFrame(st); },
    kick(html,big){ kx.classList.toggle('big',!!big); kt.innerHTML=html; kx.style.transition='none'; kx.style.opacity='0'; kx.style.transform='scale(1.22)'; void kx.offsetWidth; kx.style.transition='opacity .14s ease, transform .16s cubic-bezier(.2,1.5,.3,1)'; kx.style.opacity=html?'1':'0'; kx.style.transform='scale(1)'; },
    flash(){ fl.style.transition='none'; fl.style.opacity='.82'; void fl.offsetWidth; fl.style.transition='opacity .16s linear'; fl.style.opacity='0'; },
    cta(html){ cta.innerHTML=html; cta.style.opacity='1'; cta.style.transform='translateY(0)'; },
    black(v){ blk.style.opacity=String(v); }, time(t){ window.__time&&window.__time(t); },
    timeRamp(a,b,dur){ const s=performance.now(); const st=()=>{ const k=Math.min(1,(performance.now()-s)/dur); window.__time&&window.__time(a+(b-a)*k); if(k<1)requestAnimationFrame(st); }; requestAnimationFrame(st); },
  };
  window.__pp=P;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  // The full reel on ONE page-side clock → camera & captions always coincide.
  // Recorded SLOW & flash-free (reliable under swiftshader); ffmpeg speeds it up
  // ~1.5x afterwards for the snappy reel. Bakery-focused (no far jumps / no
  // day-night relight → no render stalls). CTA card is appended in post.
  // Quick black-dip cuts between beats (≈0.35s): read as punchy jump cuts AND
  // give the screencast encoder a low-entropy breath each beat (prevents the
  // ~10s continuous-motion stall). Recorded medium-paced; ffmpeg snaps it up.
  window.__reel = async function(){
    const cut = async (cam,text,big,to,dur,hold)=>{ P.black(1); await sleep(170); P.set(cam); P.kick(text,big); P.black(0); if(to)P.moveTo(to,dur); await sleep(hold); };
    P.black(0);
    P.set([8,32,-18,0,-0.05]); P.kick(`実在のパン屋が、<br><span class="hl">まるごとゲームに</span>🥖`,true); P.moveTo([8,31.6,-20.6,0,-0.06],1800); await sleep(2000);
    await cut([14.2,31,-31,0.10,-0.10], `<span class="hl">ブラウザで、無料。</span>`, false, [13.9,31,-33.8,-0.05,-0.12],1500, 1500);
    await cut([14.3,31,-35.4,0.15,-0.17], `焼きたてが<span class="hl">ずらり</span>🍞`, false, [13.8,31,-34.8,-0.02,-0.13],1400, 1400);
    await cut([14,31,-44,0,-0.03], `畑の野菜から<br><span class="hl">パンを焼ける</span>🔥`, false, [14,31,-46.3,0,-0.02],1400, 1450);
    await cut([14,31,-33.5,0,-0.05], `お店で<span class="hl">売れる</span>🛍️`, false, [14,31,-34.8,0,-0.08],1400, 1450);
    await cut([14.4,31,-35.6,0.16,-0.2], `看板は<span class="hl">カンパーニュ</span>`, false, [13.8,31,-35,-0.03,-0.15],1400, 1400);
    await cut([14,31,-34.4,0,-0.06], `スマホで、<span class="hl">すぐ遊べる</span>`, false, [14,31,-35.6,0,-0.09],1400, 1450);
    await cut([8,32,-18,0,-0.05], `ぜんぶ、<span class="hl">ブラウザで。</span>`, true, [8,31.6,-20.6,0,-0.06],1800, 2000);
  };
});

await page.evaluate(()=>window.__pp.black(1));
await page.click('#overlay',{timeout:60000}).catch(()=>{});
await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
await page.evaluate(()=>{
  window.__time&&window.__time(0.5);
  window.__pp.set([8,32,-18,0,-0.05]); // park at the hook framing so chunks preload
  setInterval(()=>{ for (const el of document.querySelectorAll('div')) {
    if (el.id==='pp'||el.closest('#pp')) continue; const t=el.textContent||'';
    if (/今日のしごと|パン屋|工房ボタン|右上の|店主に|こちら|本日のパン|規格外|店頭|いらっしゃ|ありがとう|ようこそ|どこ|集めよう|小麦/.test(t)) el.classList.add('pp-hide');
  } }, 80);
});
// preload chunks along the reel path so jumps don't stall the recording
for (const c of [[14,31,-44,0,-0.05],[8,32,-18,0,-0.05]]) {
  await page.evaluate(a=>window.__pp.set(a), c); await page.waitForTimeout(1300);
}
await page.waitForTimeout(2000); // settle on the hook framing

try {
  await page.evaluate(()=>window.__reel());   // runs the whole reel, resolves when done
  await page.evaluate(()=>window.__pp.black(1));
  await page.waitForTimeout(600);
} catch(e){ console.log('reel error:', e.message); }

console.log('pageerrors:', errs.length, errs.slice(0,3).join(' | '));
await page.waitForTimeout(200);
const video = page.video();
await ctx.close();
console.log('VIDEO:', video ? await video.path() : null);
await browser.close();
await new Promise(r=>server.close(r));
