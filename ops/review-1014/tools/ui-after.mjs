// UI 고친 뒤 홈 지도를 360×640에서 찍는다. 실행: node ops/review-1014/tools/ui-after.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch();
for (const [w, h] of [[360, 640], [390, 844]]) {
  const page = await b.newPage({ viewport: { width: w, height: h } }); page.on('pageerror', (e) => console.log('ERR', e.message));
  await page.goto(BASE + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS);
  await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29, onboarded: true, tut: 1, tuts: ['intro', 'room', 'town'] });
    S.done.push('ju1', 'ju2', 'stu1'); S.lv = 5; save(); render('home'); });
  await page.waitForTimeout(1500); await page.evaluate(() => { if (TUT) endTalk(); hudRefresh(); mqChip(); guideSync(); });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const box = (id) => { const e = document.getElementById(id); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
    return { zone: box('hzone') || (document.querySelector('.zonetag') && [...Object.values(document.querySelector('.zonetag').getBoundingClientRect().toJSON())].slice(0, 4).map(Math.round)), mq: box('hmq'), chk: box('hchk'), guide: box('hguide'), mini: box('hmini') }; });
  console.log(w, JSON.stringify(r));
  await page.screenshot({ path: `ops/review-1014/img/ui-after-home-${w}.png` }); await page.close(); }
await b.close();
