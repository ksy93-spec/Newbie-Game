// 퀘스트에서 오답을 고른 직후 화면을 보통 눈과 적록 색각(제2색맹) 흉내로 찍는다. 저장소 루트에서 실행.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href + '#nointro';
const IMG = path.join(root, 'ops/review-1007/img');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(BASE);
await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => {
  S = fresh(); S.status = '직장인'; applyStarter();
  Object.assign(S, { years: 1, living: '자취', region: '수도권', age: 26, prep: '공채', company: '중소기업' });
  S.onboarded = true; S.tut = 1; S.tuts = ['intro', 'afterq', 'needs', 'hungry', 'travel', 'gear']; S.prologue = 1; S.tipTools = 1; S.todayQ = pickDaily(); save(); render('home');
  startQuest(QMAP.ju2);
});
await page.waitForTimeout(800);
// 들어보기 → 첫 문항
for (let i = 0; i < 4; i++) {
  const n = await page.$$('#qchoices .choice');
  if (n.length) break;
  await page.evaluate(() => { const b = document.getElementById('qnext'); if (b && !b.hidden) b.click(); try { typeSkip(); } catch (e) {} });
  await page.waitForTimeout(500);
}
// 오답 하나 고르기
await page.evaluate(() => { const item = RUN.q.qs[RUN.i]; const b = [...document.querySelectorAll('#qchoices .choice')].find((x) => +x.dataset.orig !== item.ok && !x.disabled); if (b) b.click(); });
await page.waitForTimeout(500);
await page.evaluate(() => document.getElementById('qchoices').scrollIntoView({ block: 'start' }));
await page.screenshot({ path: path.join(IMG, 'cs-answer-normal.png') });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'deuteranopia' });
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(IMG, 'cs-answer-deuteranopia.png') });
await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });

// 상점 세간 줄: 방(방어) 표기와 잠긴 줄의 흐린 글자
await page.evaluate(() => { S.coin = 40; save(); render('shop'); });
await page.waitForTimeout(300);
await page.evaluate(() => { const s = document.querySelector('#shop .scroll'); const t = [...document.querySelectorAll('#shopbody .sectlab')].find((x) => /세간/.test(x.textContent)); if (t) t.scrollIntoView({ block: 'start' }); });
await page.screenshot({ path: path.join(IMG, 'cs-shop-furni.png') });

// 백과 · 졸업하면 생기는 일 타임라인(시점 칩 글자)
await page.evaluate(() => { render('wiki'); wikiOpen = 'grad'; renderWiki(); });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(IMG, 'cs-wiki-grad.png') });
await browser.close();
console.log('done');
