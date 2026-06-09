// Visual QA stills of the overhauled world (S1-S5 merged).
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
await page.click('#overlay',{timeout:60000}).catch(()=>{});
await page.waitForSelector('#overlay',{state:'hidden',timeout:15000}).catch(()=>{});
await page.evaluate(()=>{ window.__time&&window.__time(0.5); });
await page.waitForTimeout(2500);
const SHOTS = {
  qa_facade:   [8, 33, -8, 0, -0.04],        // 校舎正面 (時計・校章・桜)
  qa_genkan:   [8, 32, -30.5, Math.PI, -0.1],// 昇降口（下駄箱）
  qa_hero:     [14, 32, -33, 0, -0.10],      // パン屋 面陳列ヒーローウォール
  qa_cafe:     [-19.5, 32, -28.5, 0, -0.10], // South in North v2
  qa_kitchen:  [26, 32, -30.5, 0, -0.08],    // 旧給食室
  qa_gym:      [38, 33, -12.5, 0, -0.06],    // 体育館内部
  qa_yard:     [8, 48, 22, 0, -0.55],        // 校庭空撮（桜・遊具・体育館）
  qa_valley:   [-30, 42, 30, -0.7, -0.3],    // 杉里山・田んぼ・道路
};
for (const [name,[x,y,z,yaw,pit]] of Object.entries(SHOTS)){
  try{
    await page.evaluate(a=>window.__view&&window.__view(...a),[x,y,z,yaw,pit]);
    await page.waitForTimeout(2800);
    await page.screenshot({path:`/tmp/${name}.png`,timeout:120000});
    console.log('shot',name);
  }catch(e){ console.log('FAIL',name,e.message); }
}
console.log('pageerrors:',errs.length, errs.slice(0,2).join('|'));
await browser.close(); await new Promise(r=>server.close(r));
