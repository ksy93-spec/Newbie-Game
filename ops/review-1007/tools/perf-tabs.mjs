// 탭 전환 비용(render 함수가 DOM을 통째로 다시 만드는 비용)과 저장 크기 상한.
// 실행: node ops/review-1007/tools/perf-tabs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, makeSave, r1, ROOT } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); fs.mkdirSync(OUT, { recursive: true });
const browser = await launch();
const save = await makeSave(browser);
const res = [];
for (const th of [4, 6]) {
  const { ctx, page, cdp, url } = await newPage(browser, { dev: 's390', throttle: th, save, hash: '#nointro' });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(3000);
  const r = await page.evaluate(async () => {
    const out = {};
    const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    for (const id of ['char', 'shop', 'wiki', 'quests', 'home', 'char', 'shop', 'home']) {
      const n0 = document.getElementsByTagName('*').length;
      const a = performance.now(); render(id); const js = performance.now() - a;
      document.body.offsetHeight; const lay = performance.now() - a - js;           // 강제 레이아웃까지
      await frame(); const tot = performance.now() - a;
      const key = out[id] ? id + '(2)' : id;
      out[key] = { jsMs: Math.round(js), layoutMs: Math.round(lay), toFrameMs: Math.round(tot), nodes: document.getElementsByTagName('*').length, nodesDelta: document.getElementsByTagName('*').length - n0 };
      await new Promise((r) => setTimeout(r, 400));
    }
    return out;
  });
  // 저장 크기: 지금, 그리고 이벤트 기록이 꽉 찼을 때(EVMAX)
  const sz = await page.evaluate(() => {
    const now = JSON.stringify(S).length; const keep = S.log.slice();
    while (S.log.length < EVMAX) ev('quest_done', { id: 'q_rent_01', ok: 1, xp: 30, coin: 120 });
    const full = JSON.stringify(S); const parts = {}; Object.keys(S).forEach((k) => { parts[k] = JSON.stringify(S[k] || null).length; });
    const a = performance.now(); for (let i = 0; i < 50; i++) save(); const saveMs = (performance.now() - a) / 50;
    S.log = keep; save();
    return { nowKB: +(now / 1024).toFixed(1), fullKB: +(full.length / 1024).toFixed(1), EVMAX, saveMsFull: +saveMs.toFixed(2),
      biggest: Object.entries(parts).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => k + ' ' + (v / 1024).toFixed(1) + 'KB') };
  });
  console.log(th + 'x', JSON.stringify(r)); console.log(th + 'x save', JSON.stringify(sz));
  res.push({ throttle: th, tabs: r, save: sz });
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, 'tabs.json'), JSON.stringify(res, null, 1));
await browser.close();
