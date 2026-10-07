// 컷신 캔버스 누수 확인: 운전 로딩 컷신을 N번 띄웠다 닫은 뒤 메모리를 잰다.
// base: 게임 그대로 / fix: cinemaHost가 단 resize 리스너를 컷신이 끝날 때 떼는 것을 흉내 낸다.
// 실행: node ops/review-1007/tools/perf-leak.mjs [N=10]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { launch, newPage, makeSave, metrics, r1, ROOT } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); fs.mkdirSync(OUT, { recursive: true });
const N = +(process.argv[2] || 10);
const rss = () => { const o = execSync('ps -eo rss,args', { encoding: 'utf8' }); let ren = 0, gpu = 0;
  for (const l of o.split('\n')) { const kb = parseInt(l.trim(), 10) || 0; if (/--type=renderer/.test(l)) ren += kb; if (/--type=gpu-process/.test(l)) gpu += kb; }
  return { rendererMB: Math.round(ren / 1024), gpuMB: Math.round(gpu / 1024) }; };
const browser = await launch();
const save = await makeSave(browser);
const rows = [];
for (const variant of ['base', 'fix']) {
  const { ctx, page, cdp, url } = await newPage(browser, { dev: 's390', throttle: 1, save, hash: '#nointro' });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  if (variant === 'fix') await page.evaluate(() => {
    // cinemaHost 가 만든 wrap 이 문서에서 빠지면 그 fit 리스너도 뗀다(고칠 때 넣을 코드와 같은 효과)
    const orig = window.cinemaHost; window.cinemaHost = function () { const h = orig.apply(this, arguments);
      const mo = new MutationObserver(() => { if (!h.wrap.isConnected) { removeEventListener('resize', h.fit); mo.disconnect(); } });
      mo.observe(document.body, { childList: true }); return h; }; });
  await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.collectGarbage');
  const before = rss();
  for (let i = 0; i < N; i++) {
    await page.evaluate(() => { S.equip.mount = 'car'; driveLoading('동네', '회사', () => {}); });
    await page.waitForTimeout(3200);
  }
  await cdp.send('HeapProfiler.collectGarbage'); await page.waitForTimeout(1500); await cdp.send('HeapProfiler.collectGarbage');
  const after = rss(); const m = await metrics(cdp);
  const row = { variant, N, before, after, deltaRenderer: after.rendererMB - before.rendererMB, deltaGpu: after.gpuMB - before.gpuMB, heapMB: r1(m.JSHeapUsedSize / 1048576) };
  rows.push(row); console.log(JSON.stringify(row));
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, 'leak.json'), JSON.stringify(rows, null, 1));
await browser.close();
