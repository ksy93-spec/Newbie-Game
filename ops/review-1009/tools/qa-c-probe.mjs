// 퀘스트 두 개 뒤 안내가 사라지는 까닭을 본다. 사용: node ops/review-1009/tools/qa-c-probe.mjs 390 844
import { launch, BASE, shot, tag, st, wait, STATE, visButtons, hitTest } from './lib.mjs';
import { settle } from './drive.mjs';
const vw = +process.argv[2] || 390, vh = +process.argv[3] || 844, T = tag(vw), log = [];
const { browser, ctx, page, logs } = await launch(vw, vh, STATE + '/after-quests-' + vw + '.json');
await page.goto(BASE);
await page.waitForSelector('.omenu:not([hidden]) .omb');
await page.locator('.omb[data-k="lcont"]').click();
await page.waitForFunction(() => !document.getElementById('opening'));
await settle(page, log);
const P = await page.evaluate(() => ({ openLeft: openLeft(), gq: guideQuest() && guideQuest().id, gt: !!guideTarget(), drip: S.drip.u.length, dripOpen: QUESTS.filter((q) => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && S.drip.u.indexOf(q.id) >= 0).map((q) => q.id + '@' + (QPLACE[q.id] || '?')), full: S.full, energy: S.energy, hmq: document.getElementById('hmq') && document.getElementById('hmq').textContent }));
await shot(page, T + '-09after2');
log.push('hmq hit ' + await hitTest(page, '#hmq'));
await page.locator('#hmq').click().catch((e) => log.push('hmq click fail'));
await wait(page, 800);
log.push('after hmq: ' + JSON.stringify(await page.evaluate(() => ({ tip: !document.getElementById('itip').hidden && document.getElementById('itipbox').textContent.slice(0, 200), map: ME.map, toast: (document.querySelector('.toast') || {}).textContent }))));
await shot(page, T + '-10hmq');
console.log(JSON.stringify({ P, log, logs }, null, 1));
await browser.close();
