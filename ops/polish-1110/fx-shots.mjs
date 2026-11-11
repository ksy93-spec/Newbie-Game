// 주요 화면을 390×844에서 찍는다. 실행: node ops/polish-1110/shots.mjs [tag=before]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const TAG = process.argv[2] || 'before';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage(); page.on('pageerror', (e) => console.log('ERR', e.message));
const shot = (n) => page.screenshot({ path: `/tmp/claude-0/-home-user-Newbie-Game/887117d1-4617-5cc3-8513-2fb8b844491c/scratchpad/f-${n}.png` });
await page.goto(BASE); await page.waitForSelector('#opening .omb', { timeout: 15000 }); await page.waitForTimeout(1200); await shot('01-opening');
await page.click('#opening .omb[data-k="life"]'); await page.waitForFunction(() => !document.getElementById('opening') && document.getElementById('onboard').classList.contains('on')); await page.waitForTimeout(800); await shot('02-birth');
await page.click('#obnext'); await page.waitForFunction(() => window.MQP, null, { timeout: 8000 }); await page.waitForTimeout(600); await shot('03-cine-title');
for (let i = 0; i < 3; i++) { await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(900); } await shot('04-cine-scene');
await page.evaluate(async () => { for (let i = 0; i < 200 && window.MQP; i++) { MQP.next({ type: 'test' }); await new Promise((r) => setTimeout(r, 30)); } });
await page.waitForTimeout(1500); await page.evaluate(() => { for (let i = 0; i < 20 && TUT; i++) endTalk(); }); await page.waitForTimeout(600); await shot('05-home');
// 퀘스트 한 판: 정답 두 번(콤보), 결과 화면의 별
await page.evaluate(() => { S.tut = 1; S.tuts = ['intro', 'room', 'town']; const q = QUESTS.find((x) => qOpen(x) && x.qs.length >= 3); S.full = 100; S.energy = 100; startQuest(q); });
await page.waitForSelector('#quest.on', { timeout: 8000 }); await page.waitForTimeout(600);
await page.click('#qnext'); await page.waitForSelector('#qchoices .choice', { timeout: 8000 }); await page.waitForTimeout(900);
for (let i = 0; i < 3; i++) {
  await page.waitForFunction(() => { const b = document.querySelector('#qchoices .choice'); return b && !b.disabled && !document.getElementById('qchoices').hidden; }, null, { timeout: 8000 });
  await page.evaluate(() => { const ok = RUN.q.qs[RUN.i].ok; document.querySelector('#qchoices .choice[data-orig="' + ok + '"]').click(); });
  await page.waitForTimeout(260); await shot('q-answer' + i);
  await page.waitForTimeout(500); const more = await page.evaluate(() => RUN.i + 1 < RUN.q.qs.length); await page.click('#qnext'); if (!more) break; await page.waitForTimeout(300);
}
await page.waitForSelector('#result.on', { timeout: 8000 }); await page.waitForTimeout(1500); await shot('result-stars'); await page.waitForTimeout(700); await shot('result-confetti');
await page.click('#rback'); await page.waitForTimeout(450); await shot('home-coins');
await b.close();
