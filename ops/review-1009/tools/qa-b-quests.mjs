// 이어하기 · 인생 → 첫 퀘스트 셋(나이 +1) → 오늘 할 일 안내로 계속. 사용: node ops/review-1009/tools/qa-b-quests.mjs 360 640 [퀘스트 수]
import { launch, BASE, shot, tag, st, wait, STATE, overflow, visButtons } from './lib.mjs';
import { goNext, playQuest, scr, settle } from './drive.mjs';
const vw = +process.argv[2] || 360, vh = +process.argv[3] || 640, N = +process.argv[4] || 4, T = tag(vw);
const { browser, ctx, page, logs } = await launch(vw, vh, STATE + '/after-birth-' + vw + '.json');
const R = { vw }, log = [];
await page.goto(BASE);
await page.waitForSelector('.omenu:not([hidden]) .omb', { timeout: 10000 });
R.menu = await page.$$eval('.omb', (bs) => bs.map((b) => b.innerText.replace(/\n/g, ' / ')));
await page.locator('.omb[data-k="lcont"]').click();
await page.waitForFunction(() => !document.getElementById('opening'), null, { timeout: 8000 });
await wait(page, 1500);
R.s0 = await st(page);
const ages = [];
for (let i = 0; i < N; i++) {
  const s = await scr(page);
  await settle(page, log, T + '-q' + i);
  const ok = await goNext(page, log);
  if (!ok) { await shot(page, T + '-noguide' + i); break; }
  await wait(page, 600);
  log.questDone = false;
  // 퀘스트 화면이 뜰 때까지 기다린다
  const t0 = Date.now(); let seenQuest = false;
  while (Date.now() - t0 < 20000) { const s2 = await scr(page); if (s2.on.includes('quest') || s2.cine || s2.tut || s2.tip) { seenQuest = s2.on.includes('quest'); break; } await wait(page, 300); }
  if (i === 0) await shot(page, T + '-07firstq');
  if (i === 0) R.questOverflow = await overflow(page, '#quest');
  await playQuest(page, log, T + '-q' + i);
  await wait(page, 1200);
  const s3 = await st(page);
  ages.push({ i, age: s3.age, done: s3.done, lv: s3.lv, hud: s3.hud, hsub: s3.hsub, tier: s3.tierName, scr: await scr(page) });
  if (s3.done === 3) await shot(page, T + '-08age21');
}
await wait(page, 1000);
R.ages = ages;
R.final = await st(page);
R.homeButtons = await visButtons(page);
R.log = log;
R.logs = logs;
await ctx.storageState({ path: STATE + '/after-quests-' + vw + '.json' });
console.log(JSON.stringify(R, null, 1));
await browser.close();
