// 지도마다 한 장면을 그려 픽셀 해시를 낸다. 고치기 전·후 결과를 비교하는 데 쓴다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS);
const r = await page.evaluate(() => {
  Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.tut = 1; S.lv = 20; S.peak = S.tier = 6;
  S.tuts = ['intro','afterq','travel','check','needs','hungry','doors','room','gear','lv2','ep','pet','car','boss']; save(); render('home'); stopWalk();
  const out = {}; const cv = document.getElementById('scene');
  for (const id of Object.keys(MAPS).concat(['room'])) {
    const m = id === 'room' ? roomMap() : MAPS[id]; if (!m) continue;
    try { enterMap(id, m.spawn ? m.spawn.x : 1, m.spawn ? m.spawn.y : 1); stopWalk(); } catch (e) { out[id] = 'err'; continue; }
    TICK = 0; PETW = null; drawScene();
    out[id] = Array.from(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.filter((_, i) => i % 7 === 0)).join(',').length + ':' + cv.toDataURL().length;
  }
  return out; });
const h = {}; for (const k in r) h[k] = crypto.createHash('md5').update(String(r[k])).digest('hex').slice(0, 8);
console.log(JSON.stringify(h)); console.log(JSON.stringify(errs)); await b.close();
