// Render clean title + outro cards (720x1280) as PNGs for the promo bookends.
import { chromium } from 'playwright';
const html = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box;font-family:'Noto Sans JP','IPAGothic',sans-serif;}
  html,body{width:720px;height:1280px;overflow:hidden;}
  .card{width:720px;height:1280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
    background:linear-gradient(160deg,#2f7870,#173f3b);color:#f6f1e7;text-align:center;padding:9%;}
  .emoji{font-size:96px;}
  h1{font-size:60px;font-weight:900;letter-spacing:.02em;}
  h2{font-size:34px;font-weight:800;opacity:.96;line-height:1.5;}
  p{font-size:26px;opacity:.9;}
  .pill{margin-top:6px;background:#f6f1e7;color:#173f3b;font-weight:900;font-size:30px;padding:16px 30px;border-radius:999px;}
  .url{font-size:23px;background:rgba(0,0,0,.25);padding:12px 18px;border-radius:12px;letter-spacing:.01em;}
  .rule{width:120px;height:4px;background:#f6f1e7;opacity:.6;border-radius:2px;}
</style></head><body><div class="card">${inner}</div></body></html>`;

const cards = {
  '/tmp/title.png': `<div class="emoji">🥖</div><h1>プチヘルメース</h1><div class="rule"></div>
     <h2>ブラウザで遊べる、<br>パン屋さんの物語</h2>`,
  '/tmp/outro.png': `<div class="emoji">🥖</div><h2>毎日食べたい、<br>幸せ酵母を。</h2>
     <div class="pill">▶ いますぐプレイ</div>
     <div class="url">my-first-project-lyart-phi.vercel.app/minecraft</div>`,
  '/tmp/cta.png': `<div class="emoji">🥖</div><h1 style="font-size:50px">ブラウザで、無料。</h1>
     <div class="pill">▶ 今すぐプレイ</div>
     <p style="font-size:22px">🔖 保存して、あとで</p>
     <div class="url">my-first-project-lyart-phi.vercel.app/minecraft</div>`,
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:720,height:1280}, deviceScaleFactor:1 });
const page = await ctx.newPage();
for (const [out, inner] of Object.entries(cards)) {
  await page.setContent(html(inner), { waitUntil:'load' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  console.log('rendered', out);
}
await browser.close();
