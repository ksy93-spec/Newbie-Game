// 리뷰 1007 고친 뒤 화면: 360×640 홈, 퀘스트 첫 문제, 결과, 상점 확인
// 실행: node ops/review-1007/tools/after-shots.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const GAME = url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro';
const OUT = (n) => path.join(ROOT, 'ops/review-1007/img', 'after-' + n + '.png');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(GAME);
await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => {
  Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
  S.onboarded = true; S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
  S.coin = 900; save(); render('home');
});
await page.waitForTimeout(900);
await page.screenshot({ path: OUT('home-360') });
// 퀘스트 첫 문제(보기가 보이는지)
await page.evaluate(() => { S.tipTools = 0; const q = QUESTS.find((x) => x.theme === 'sik' && !x.keys && !x.trip); startQuest(q); });
await page.waitForTimeout(900);
for (let i = 0; i < 40; i++) {
  const ok = await page.evaluate(() => { const n = document.getElementById('qnext'), c = document.getElementById('qchoices');
    if (!c.hidden && c.children.length) return true; if (!n.hidden) n.click(); return false; });
  if (ok) break; await page.waitForTimeout(400);
}
await page.waitForTimeout(700);
await page.screenshot({ path: OUT('quest-360') });
// 상점 확인 창
await page.evaluate(() => { RUN = null; render('shop'); });
await page.waitForTimeout(400);
await page.evaluate(() => {
  const names = Object.keys(ITEMS).filter((id) => ITEMS[id].cost > 0 && ITEMS[id].cost <= S.coin && !ITEMS[id].special && !S.owned.includes(id)).map((id) => ITEMS[id].name);
  const row = [...document.querySelectorAll('#shopbody .item')].find((x) => !x.disabled && names.some((n) => x.textContent.includes(n)));
  row.click();
});
await page.waitForTimeout(400);
await page.screenshot({ path: OUT('shop-confirm-360') });
console.log(JSON.stringify(errs));
await b.close();
