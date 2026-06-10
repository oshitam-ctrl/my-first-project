// 全ゲームのユニットテスト(*.test.mjs)を一括実行する統一ランナー。
// 依存ゼロ（npm install 不要）。Run: node tools/run-unit-tests.mjs
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
let pass = 0, fail = 0;
for (const dir of ['public/world', 'public/minecraft']) {
  const abs = path.join(ROOT, dir);
  for (const f of readdirSync(abs).filter((f) => f.endsWith('.test.mjs')).sort()) {
    try {
      execFileSync('node', [f], { cwd: abs, stdio: 'pipe' });
      pass++;
      console.log('PASS', `${dir}/${f}`);
    } catch (e) {
      fail++;
      console.log('FAIL', `${dir}/${f}`);
      console.log(String(e.stdout || e.message).slice(-800));
    }
  }
}
console.log(`\n${pass} files passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
