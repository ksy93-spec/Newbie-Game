process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(BASE + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29, onboarded: true, tut: 1, tuts: ['intro', 'room', 'town'] });
  S.lv = 12; ['job', 'lease', 'card', 'car'].forEach((k) => { S.mq.done[k] = 'good'; }); save(); render('home');
  const q = QUESTS.find((x) => guideMapOf(x) === 'bank_branch'); window.guideQuest = () => q; enterMap('town', MAPS.town.spawn.x, MAPS.town.spawn.y); });
for (let i = 0; i < 14; i++) { console.log(await page.evaluate(() => { const t = guideTarget(); return JSON.stringify({ map: ME.map, at: [ME.tx, ME.ty], hop: t && t.warp, route: (guideRoute(t.map) || []).map((r) => r.from + ':' + (r.via.edge || r.via.warp.to)), w: curMap().w, h: curMap().h, MOVE: !!MOVE, auto: !!GUIDE_AUTO, tut: !!TUT, talk: !!window.TALK, tip: !document.getElementById('itip').hidden }); })); if (i === 0) await page.evaluate(() => guideGo()); await page.waitForTimeout(1500); }
await b.close();
