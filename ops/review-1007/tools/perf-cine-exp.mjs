// 컷신·오프닝 실험: 캔버스 배율(cineRes) 상한과 배경 보간 품질을 바꾸면 얼마나 빨라지는지.
// 게임 파일은 그대로 두고 페이지 안에서 함수만 바꿔 끼운다.
// 실행: node ops/review-1007/tools/perf-cine-exp.mjs [s390] [4] [변형,변형]
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, makeSave, metrics, pct, r1, ROOT } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); fs.mkdirSync(OUT, { recursive: true });
const dev = process.argv[2] || 's390', throttle = +(process.argv[3] || 4);
const browser = await launch();
const save = await makeSave(browser);

const VARIANTS = {
  base: () => {},
  cap4: () => { const o = window.cineRes; window.cineRes = (W, H) => Math.min(4, o(W, H)); },
  cap3: () => { const o = window.cineRes; window.cineRes = (W, H) => Math.min(3, o(W, H)); },
  bgLow: () => { window.mqBgArt = function (ctx, im, W, H, gy) { gy = gy == null ? H - 104 : gy;
    const dh = gy + 26, dw = im.width * dh / im.height, range = Math.max(0, dw - W); const x = -range / 2 - range / 2 * Math.sin(performance.now() / 9000);
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low'; ctx.drawImage(im, x, 0, dw, dh); ctx.imageSmoothingEnabled = sm;
    ctx.fillStyle = '#1B1733'; ctx.fillRect(0, dh, W, H - dh); }; },
  cap4bgLow: () => { VARIANTS_cap4(); VARIANTS_bgLow(); },
  cap5bgLow: () => { const o = window.cineRes; window.cineRes = (W, H) => Math.min(5, o(W, H)); VARIANTS_bgLow(); },
  cap6bgLow: () => { const o = window.cineRes; window.cineRes = (W, H) => Math.min(6, o(W, H)); VARIANTS_bgLow(); },
};
const ONLY = (process.argv[4] || '').split(',').filter(Boolean);

async function measure(page, cdp, ms) {
  await page.evaluate(() => { window.__perf.long.length = 0; window.__perf.startFrames(); });
  const m0 = await metrics(cdp); const t0 = Date.now(); await page.waitForTimeout(ms); const wall = Date.now() - t0; const m1 = await metrics(cdp);
  const fr = await page.evaluate(() => window.__perf.stopFrames()); const long = await page.evaluate(() => window.__perf.long.slice());
  return { fps: r1(fr.length / (wall / 1000)), p50: r1(pct(fr, 50)), p95: r1(pct(fr, 95)), busy: r1((m1.TaskDuration - m0.TaskDuration) * 1000 / wall * 100), longSum: long.reduce((a, x) => a + x[1], 0) };
}

const rows = [];
for (const [name, fn] of Object.entries(VARIANTS)) {
  if (ONLY.length && !ONLY.includes(name)) continue;
  for (const scene of ['mq', 'opening']) {
    const { ctx, page, cdp, url } = await newPage(browser, { dev, throttle, save: scene === 'mq' ? save : null, hash: scene === 'mq' ? '#nointro' : '' });
    await page.addInitScript(`window.__variant=${JSON.stringify(name)};`);
    if (scene === 'opening') {
      // 오프닝은 로드 중에 시작하므로 바꿔 끼우기는 스크립트 실행 전에 해야 한다 -> 다시 시작
      await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(1500);
      await page.evaluate(`(function(){ var VARIANTS_cap4=${VARIANTS.cap4.toString()}, VARIANTS_bgLow=${VARIANTS.bgLow.toString()}; (${fn.toString()})(); skipOpening(); openingStart(); })()`);
    } else {
      await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
      await page.evaluate(`(function(){ var VARIANTS_cap4=${VARIANTS.cap4.toString()}, VARIANTS_bgLow=${VARIANTS.bgLow.toString()}; (${fn.toString()})(); })()`);
      await page.evaluate(() => { S.mq.done = {}; mqStart('job'); }); await page.waitForTimeout(500);
      await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(500); await page.evaluate(() => MQP.next({ type: 'test' }));
    }
    await page.waitForTimeout(800);
    const cv = await page.evaluate(() => { const c = document.querySelector('#opening canvas'); return c ? c.width + 'x' + c.height : null; });
    const r = await measure(page, cdp, 6000);
    rows.push({ variant: name, scene, canvas: cv, ...r }); console.log(name, scene, cv, JSON.stringify(r));
    await ctx.close();
  }
}
fs.writeFileSync(path.join(OUT, `cine-exp-${dev}-${throttle}x${ONLY.length ? '-' + ONLY.join('_') : ''}.json`), JSON.stringify(rows, null, 1));
await browser.close();
