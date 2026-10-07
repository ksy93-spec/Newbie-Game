// 오프닝 화면에서 글자 그리기(fillText)가 차지하는 몫: fillText를 빈 함수로 바꿔 비교한다.
// 실행: node ops/review-1007/tools/perf-opening-text.mjs
import { launch, newPage, metrics, pct, r1 } from './perf-lib.mjs';
const b = await launch();
for (const v of ['base', 'noText', 'noTextCap4']) {
  const { ctx, page, cdp, url } = await newPage(b, { dev: 's390', throttle: 4, hash: '' });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  await page.evaluate((v) => { if (v !== 'base') { let n = 0; const ft = CanvasRenderingContext2D.prototype.fillText; window.__ftn = 0;
    CanvasRenderingContext2D.prototype.fillText = function () { window.__ftn++; }; }
    if (v === 'noTextCap4') { const o = window.cineRes; window.cineRes = (W, H) => Math.min(4, o(W, H)); }
    skipOpening(); openingStart(); }, v);
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.__perf.startFrames(); window.__ftn = 0; });
  const m0 = await metrics(cdp); await page.waitForTimeout(6000); const m1 = await metrics(cdp);
  const fr = await page.evaluate(() => window.__perf.stopFrames()); const ftn = await page.evaluate(() => window.__ftn);
  console.log(v, 'fps', r1(fr.length / 6), 'p50', r1(pct(fr, 50)), 'busy', r1((m1.TaskDuration - m0.TaskDuration) * 1000 / 6000 * 100), 'fillText/frame', ftn ? r1(ftn / fr.length) : '-');
  await ctx.close();
}
await b.close();
