// 같은 페이지에서 타일 캐시 켬(기본)·끔(window.NOTC) 그림을 비교한다. 다른 칸 수를 지도별로 낸다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS);
const r = await page.evaluate(() => {
  Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.tut = 1; S.lv = 20; S.peak = S.tier = 6;
  S.tuts = ['intro','afterq','travel','check','needs','hungry','doors','room','gear','lv2','ep','pet','car','boss']; save(); render('home'); stopWalk();
  const out = {}, cv = document.getElementById('scene'), g = () => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  const now0 = performance.now.bind(performance), dn0 = Date.now;
  for (const id of ['town', 'campus', 'villa', 'market', 'station', 'korea', 'gangneung']) {
    const m = MAPS[id]; enterMap(id, m.spawn.x, m.spawn.y); stopWalk();
    performance.now = () => 1000; Date.now = () => 1e12; TICK = 0;
    window.NOTC = 0; TCACHE = null; drawScene(); const a = g();
    window.NOTC = 1; drawScene(); const c = g(); window.NOTC = 0;
    performance.now = now0; Date.now = dn0;
    let d = 0, fx = -1, fy = -1; for (let i = 0; i < a.length; i += 4) if (a[i] !== c[i] || a[i + 1] !== c[i + 1] || a[i + 2] !== c[i + 2]) { d++; if (fx < 0) { fx = (i / 4) % cv.width; fy = Math.floor(i / 4 / cv.width); } }
    out[id] = d + (d ? ' @' + fx + ',' + fy : '');
  }
  return out; });
console.log(JSON.stringify(r)); await b.close();
