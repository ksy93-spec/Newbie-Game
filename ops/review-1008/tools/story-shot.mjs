// 이야기 컷신 한 장면 찍기: node ops/review-1008/tools/story-shot.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.tut = 1; S.tuts = ['intro','afterq','travel','check','needs','hungry','doors','room','gear','lv2','ep','pet','car','boss']; save(); render('home'); csPlay('firstq', null, true); });
for (const [i, name] of [[1, 'title'], [6, 'doc']]) {
  await page.evaluate((i) => { while (MQP && MQP.cur() < i) MQP.next({ type: 'test' }); }, i);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ROOT, 'ops/review-1008/img/story-' + name + '.png') });
}
console.log(JSON.stringify(errs)); await b.close();
