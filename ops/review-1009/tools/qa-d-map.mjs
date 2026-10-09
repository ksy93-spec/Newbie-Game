// 동네 밖 퀘스트: 지도 열기로 가 본다. 사용: node ops/review-1009/tools/qa-d-map.mjs 390 844
import { launch, BASE, shot, tag, st, wait, STATE, visButtons, overflow } from './lib.mjs';
import { settle, scr } from './drive.mjs';
const vw = +process.argv[2] || 390, vh = +process.argv[3] || 844, T = tag(vw), log = [];
const { browser, ctx, page, logs } = await launch(vw, vh, STATE + '/after-quests-' + vw + '.json');
await page.goto(BASE);
await page.waitForSelector('.omenu:not([hidden]) .omb');
await page.locator('.omb[data-k="lcont"]').click();
await page.waitForFunction(() => !document.getElementById('opening'));
await settle(page, log);
const target = await page.evaluate(() => { const q = QUESTS.filter((q) => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q))[0]; const mk = guideMapOf(q); return { q: q.id, title: q.title, mk, name: MAPS[mk].name }; });
log.push('target ' + JSON.stringify(target));
await page.locator('#hmini').click();
await wait(page, 800);
log.push('after hmini: ' + JSON.stringify(await scr(page)) + ' ' + JSON.stringify(await visButtons(page)));
await shot(page, T + '-11map');
log.push('mapOverflow ' + JSON.stringify(await overflow(page)));
console.log(JSON.stringify({ log, logs }, null, 1));
await browser.close();
