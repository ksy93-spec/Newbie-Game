// 안내 칩이 여러 맵을 건너 창구까지 걸어가는지 본다. 실행: node ops/review-1014/tools/guide-check.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(BASE + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS);
const r = await page.evaluate(() => {
  Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29, onboarded: true, tut: 1, tuts: ['intro', 'room', 'town'] });
  S.lv = 12; S.mq = S.mq || { done: {} }; ['job', 'lease', 'card', 'car'].forEach((k) => { S.mq.done[k] = 'good'; }); save(); render('home');
  const maps = {}; QUESTS.forEach((q) => { const mk = guideMapOf(q); if (mk) maps[mk] = (maps[mk] || 0) + 1; });
  const reach = Object.keys(maps).map((k) => [k, maps[k], !!guideRoute(k, 'town'), (guideRoute(k, 'town') || []).length]);
  const all = QUESTS.filter((q) => guideMapOf(q)).length, ok = QUESTS.filter((q) => guideMapOf(q) && guideRoute(guideMapOf(q), 'town')).length;
  return { reach, all, ok }; });
console.log('퀘스트 창구', r.all, '동네에서 걸어서 닿음', r.ok); r.reach.forEach((x) => console.log(' ', x.join(' ')));
// 가장 먼 맵의 퀘스트 하나로 실제 걷기
const far = r.reach.filter((x) => x[2]).sort((a, b) => b[3] - a[3])[0];
const walked = await page.evaluate(async (mk) => {
  const q = QUESTS.find((x) => guideMapOf(x) === mk); window.guideQuest = () => q;
  if (ME.map !== 'town') enterMap('town', MAPS.town.spawn.x, MAPS.town.spawn.y);
  const t0 = performance.now(); guideGo(); const seen = [ME.map];
  for (let i = 0; i < 600; i++) { await new Promise((r) => setTimeout(r, 100)); if (TUT) endTalk(); if (seen[seen.length - 1] !== ME.map) seen.push(ME.map); if (document.querySelector('#quest.on') || window.TALK || ME.map === mk && !MOVE && !GUIDE_AUTO) break; }
  return { target: mk, seen, ms: Math.round(performance.now() - t0), quest: !!document.querySelector('#quest.on') }; }, far[0]);
console.log('걷기', JSON.stringify(walked));
// 매 프레임 비용
const cost = await page.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 60; i++) guideTarget(); return Math.round((performance.now() - t0) / 60 * 100) / 100; });
console.log('guideTarget 한 번', cost, 'ms');
await b.close();
