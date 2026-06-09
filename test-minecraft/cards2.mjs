// CTA card v2 — brand beige × deep-green with the stamp-motif badge. 720x1280 PNG.
import { chromium } from 'playwright';
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box;font-family:'Noto Sans JP','IPAGothic',sans-serif;}
  html,body{width:720px;height:1280px;overflow:hidden;}
  .card{width:720px;height:1280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;
    background:radial-gradient(circle at 50% 35%, #faf5ec, #F5EDE4 60%, #E8D5B7);color:#3A4A2F;text-align:center;padding:8%;}
  .stamp{width:150px;height:150px;border-radius:18px;background:#F5EDE4;border:4px dashed #5C6B4A;
    box-shadow:0 0 0 8px #F5EDE4, 0 0 0 10px #5C6B4A33, 0 14px 30px rgba(60,74,47,.25);
    display:flex;align-items:center;justify-content:center;}
  .stamp .inner{width:96px;height:96px;border-radius:50%;background:#5C6B4A;display:flex;align-items:center;justify-content:center;font-size:52px;}
  h1{font-size:54px;font-weight:900;color:#5C6B4A;letter-spacing:.02em;}
  h2{font-size:28px;font-weight:700;color:#6b6253;}
  .pill{margin-top:8px;background:#5C6B4A;color:#F5EDE4;font-weight:900;font-size:34px;padding:18px 34px;border-radius:999px;box-shadow:0 6px 0 #3A4A2F;}
  .save{font-size:24px;font-weight:700;color:#6b6253;}
  .url{font-size:20px;background:#3A4A2F;color:#F5EDE4;padding:10px 16px;border-radius:10px;letter-spacing:.01em;}
</style></head><body><div class="card">
  <div class="stamp"><div class="inner">🥖</div></div>
  <h1>プチヘルメース</h1>
  <h2>旧南方小学校のパン屋さん、まるごと擬似体験</h2>
  <div class="pill">▶ 今すぐ無料でプレイ</div>
  <div class="save">🔖 保存して、あとでゆっくり</div>
  <div class="url">プロフィールのリンクから</div>
</div></body></html>`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:720,height:1280} })).newPage();
await page.setContent(html, { waitUntil:'load' });
await page.waitForTimeout(300);
await page.screenshot({ path:'/tmp/cta2.png' });
console.log('cta2.png rendered');
await browser.close();
