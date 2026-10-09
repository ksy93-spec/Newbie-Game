process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'node:path'; import url from 'node:url';
const b = await chromium.launch(); const page = await (await b.newContext()).newPage();
await page.goto(url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS);
console.log(await page.evaluate(() => { const out = [];
  for (const st of ['대학생', '취준생', '직장인']) for (const rg of ['수도권', '광역시', '그 외']) for (const age of [24, 29]) {
    S.status = st; S.region = rg; S.age = age; const f = QUESTS.filter(q => !q.trip && fits(q)); const ju = f.filter(q => q.theme === 'ju');
    out.push(`${st} ${rg} ${age}: 전체 ${f.length} 집퀘 ${ju.length} 집합 ${ju.reduce((a, q) => a + ((q.stat || {}).ju || 0), 0)} 첫5집 ${dripOrder().slice(0, 8).filter(q => q.theme === 'ju').length}/8`); }
  return out.join('\n'); }));
await b.close();
