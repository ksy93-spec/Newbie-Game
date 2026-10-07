// 숨김(앱이 뒤로 갔을 때) 상태에서 게임이 계속 일하는지: 홈 지도 타이머, drawScene 호출, 오디오 컨텍스트.
// 헤드리스에서는 다른 탭을 앞으로 가져와 이 탭을 숨긴다. 실행: node ops/review-1007/tools/perf-hidden.mjs
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, makeSave, metrics, r1, ROOT, WRAP } from './perf-lib.mjs';
const OUT = path.join(ROOT, 'ops/review-1007/tools/out');
const browser = await launch();
const save = await makeSave(browser);
const { ctx, page, cdp, url } = await newPage(browser, { dev: 's390', throttle: 4, save, hash: '#nointro' });
await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(3000);
await page.mouse.click(200, 400);               // 첫 입력: 오디오 컨텍스트가 열린다
await page.evaluate(() => { sfx('tap'); });
await page.evaluate(WRAP, ['drawScene']);
async function win(label, ms) {
  await page.evaluate(() => { window.__perf.fn.drawScene.n = 0; window.__perf.raf.n = 0; });
  const m0 = await metrics(cdp); const t0 = Date.now(); await new Promise((r) => setTimeout(r, ms)); const wall = Date.now() - t0; const m1 = await metrics(cdp);
  const r = await page.evaluate(() => ({ vis: document.visibilityState, draws: window.__perf.fn.drawScene.n, ac: typeof AC !== 'undefined' && AC ? AC.state : null }));
  const row = { label, ...r, drawsPerSec: r1(r.draws / (wall / 1000)), cpuBusyPct: r1((m1.TaskDuration - m0.TaskDuration) * 1000 / wall * 100) };
  console.log(JSON.stringify(row)); return row;
}
const rows = [];
rows.push(await win('visible-idle', 15000));
const other = await ctx.newPage(); await other.goto('about:blank'); await other.bringToFront();
await page.evaluate(() => document.visibilityState).then((v) => console.log('after bringToFront other:', v));
// 헤드리스에서 visibilityState가 안 바뀌면 CDP로 숨김을 흉내 낸다
if ((await page.evaluate(() => document.visibilityState)) === 'visible') {
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false }).catch(() => {});
  await cdp.send('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
}
rows.push(await win('hidden-idle', 15000));
fs.writeFileSync(path.join(OUT, 'hidden.json'), JSON.stringify(rows, null, 1));
await browser.close();
