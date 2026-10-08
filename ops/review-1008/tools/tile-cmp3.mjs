// campus 지도 캐시 켬/끔과 다른 칸 표시 그림(img/tile-diff-*.png)
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const id = process.argv[2] || 'campus';
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS);
const r = await page.evaluate((id) => {
  Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.tut = 1; S.lv = 20; S.peak = S.tier = 6;
  S.tuts = ['intro','afterq','travel','check','needs','hungry','doors','room','gear','lv2','ep','pet','car','boss']; save(); render('home'); stopWalk();
  const cv = document.getElementById('scene'); const m = MAPS[id]; enterMap(id, m.spawn.x, m.spawn.y); stopWalk();
  performance.now = () => 1000; Date.now = () => 1e12; TICK = 0;
  window.NOTC = 0; TCACHE = null; drawScene(); const A = cv.toDataURL(); const a = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  window.NOTC = 1; drawScene(); const B = cv.toDataURL(); const c = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  for (let i = 0; i < a.data.length; i += 4) { const d = a.data[i] !== c.data[i] || a.data[i + 1] !== c.data[i + 1] || a.data[i + 2] !== c.data[i + 2]; if (d) { a.data[i] = 255; a.data[i + 1] = 0; a.data[i + 2] = 255; } }
  cv.getContext('2d').putImageData(a, 0, 0); return [A, B, cv.toDataURL()]; }, id);
['on', 'off', 'mark'].forEach((n, i) => fs.writeFileSync(path.join(ROOT, 'ops/review-1008/img/tile-' + id + '-' + n + '.png'), Buffer.from(r[i].split(',')[1], 'base64')));
await b.close();
