// CPU 프로파일: 어느 함수가 시간을 쓰는지(자기 시간 기준 상위). 컷신·오프닝·홈 걷기.
// 실행: node ops/review-1007/tools/perf-profile.mjs [s390] [4]
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, makeSave, ROOT } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); fs.mkdirSync(OUT, { recursive: true });
const dev = process.argv[2] || 's390', throttle = +(process.argv[3] || 4);
const browser = await launch();
const save = await makeSave(browser);

function top(profile, n = 18) {
  const self = {}, byId = {}; for (const nd of profile.nodes) byId[nd.id] = nd;
  const dt = profile.timeDeltas; let total = 0;
  profile.samples.forEach((id, i) => { const nd = byId[id]; const cf = nd.callFrame; const d = (dt[i] || 0) / 1000; total += d;
    const k = (cf.functionName || '(anon)') + ':' + (cf.lineNumber + 1); self[k] = (self[k] || 0) + d; });
  return { totalMs: Math.round(total), top: Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, Math.round(v), Math.round(v / total * 100) + '%']) };
}
async function prof(cdp, ms, act) {
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
  if (act) await act(); else await new Promise((r) => setTimeout(r, ms));
  const { profile } = await cdp.send('Profiler.stop'); return top(profile);
}
const res = {};
{
  const { ctx, page, cdp, url } = await newPage(browser, { dev, throttle, save, hash: '#nointro' });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(3000);
  res.walk = await prof(cdp, 0, async () => { for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) { await page.keyboard.down(k); await page.waitForTimeout(2000); await page.keyboard.up(k); } });
  await page.evaluate(() => { S.mq.done = {}; mqStart('job'); }); await page.waitForTimeout(500);
  await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(500); await page.evaluate(() => MQP.next({ type: 'test' }));
  res.cutscene = await prof(cdp, 6000);
  await ctx.close();
}
{
  const { ctx, page, cdp, url } = await newPage(browser, { dev, throttle, save: null, hash: '' });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  res.opening = await prof(cdp, 6000);
  await ctx.close();
}
for (const k in res) { console.log('==', k, res[k].totalMs + 'ms'); for (const t of res[k].top) console.log('  ', t.join('  ')); }
fs.writeFileSync(path.join(OUT, `profile-${dev}-${throttle}x.json`), JSON.stringify(res, null, 1));
await browser.close();
