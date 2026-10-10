// 첫 월세 계약 장면을 360×640에서 찍는다. 실행: node ops/rent-1010/shots.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 360, height: 640 } });
await page.goto(BASE + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => { Object.assign(S, { status: '대학생', living: '자취', region: '수도권', age: 24, onboarded: true, tut: 1 });
  S.tier = S.peak = S.paid = 5; S.stats.ju = 36; S.coin = 1000; save(); render('home'); tierGrow(); tierMove(6); rentPlay(); });
let shot = 0; const want = new Set([2, 4, 8, 9]);
for (let i = 0; i < 40 && shot < 12; i++) {
  const s = await page.evaluate(() => { if (!window.MQP) return null; const p = MQP.list()[MQP.cur()] || {}; return { i: MQP.cur(), type: p.type || '', choice: !!p.choice, picked: MQP.picked }; });
  if (!s) break;
  await page.waitForTimeout(1600);
  if (want.has(s.i) || s.type === 'reward') { await page.screenshot({ path: `ops/rent-1010/img/rent-${String(s.i).padStart(2, '0')}.png` }); shot++; }
  if (s.choice && s.picked === null) await page.evaluate(() => MQP.pick(0)); else await page.evaluate(() => MQP && MQP.next({ type: 'test' }));
}
await b.close();
