// 퀘스트 셋 → 21살 → 1장(세월 y24 + 본편) → 이사(본가 방 → 원룸) → 캐릭터·상점 → 2장 → 3장 → 새로고침.
// 사용: node ops/review-1009/tools/qa-e-chapters.mjs 390 844
import { launch, BASE, shot, tag, st, wait, STATE, visButtons, overflow, hitTest, tapCine } from './lib.mjs';
import { settle, scr } from './drive.mjs';
const vw = +process.argv[2] || 390, vh = +process.argv[3] || 844, T = tag(vw), log = [], R = {};
const { browser, ctx, page, logs } = await launch(vw, vh, STATE + '/after-quests-' + vw + '.json');
const L = (k, v) => { log.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v))); };
const cont = async () => { await page.goto(BASE); await page.waitForSelector('.omenu:not([hidden]) .omb'); await page.locator('.omb[data-k="lcont"]').click(); await page.waitForFunction(() => !document.getElementById('opening')); await settle(page, log); };
const chip = async () => page.evaluate(() => { const e = document.getElementById('hmq'); return e && !e.hidden ? e.textContent : null; });
const toastTxt = () => page.evaluate(() => [...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' | '));
// 장 하나를 칩으로 시작해 세월 컷신과 본편을 탭으로 본다
async function chapter(no, picks) {
  L('ch' + no + ' chip before', await chip());
  L('ch' + no + ' chip hit', await hitTest(page, '#hmq'));
  await page.locator('#hmq').click();
  await wait(page, 700);
  if (!(await scr(page)).cine) { L('ch' + no + ' no cine after chip, toast', await toastTxt()); return false; }
  const y = await tapCine(page, { onScene: async (s, i) => { if (i === 2) await shot(page, T + '-ch' + no + 'a'); } });
  L('ch' + no + ' cine1', y.scenes.join(' / ').slice(0, 400));
  L('ch' + no + ' after cine1', await st(page));
  await wait(page, 900);
  const s = await scr(page);
  if (s.cine) { const m = await tapCine(page, { picks, max: 600, onScene: async (x, i) => { if (i === 4) await shot(page, T + '-ch' + no + 'b'); } }); L('ch' + no + ' cine2 (picks ' + m.picks.length + ')', m.scenes.slice(0, 4).join(' / ').slice(0, 300) + ' … ' + m.scenes.slice(-2).join(' / ')); }
  else L('ch' + no + ' main chapter did not auto-start', s);
  await settle(page, log, T + '-ch' + no);
  await shot(page, T + '-ch' + no + 'c');
  L('ch' + no + ' end', await st(page));
  return true;
}
process.on('unhandledRejection', (e) => { console.log(JSON.stringify({ CRASH: String(e).slice(0, 300), log, logs }, null, 1)); process.exit(1); });
try {
await cont();
R.s0 = await st(page);
// 퀘스트 하나 더(학교 앞 퀘스트 id로 done을 채운다 — 지도 이동 탭은 qa-d에서 확인)
await page.evaluate(() => { const q = QUESTS.filter((q) => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q))[0]; S.done.push(q.id); save(); hudRefresh(); });
await wait(page, 1500);
L('after 3rd quest', { st: await st(page), toast: await toastTxt(), chip: await chip() });
await settle(page, log);
await shot(page, T + '-12age21');
await chapter(1, []);
// 이사: 집 스탯을 올려 원룸 전세(7)까지 열고 캐릭터 탭에서 옮겨 본다
await page.evaluate(() => { S.stats.ju = 90; S.coin = 3000; for (let i = 0; i < 4; i++) { const g = tierGrow(); if (!g) break; } save(); hudRefresh(); renderHome && renderHome(); });
await wait(page, 600); await settle(page, log);
L('after grow', await st(page));
await page.locator('.tabbar:visible button', { hasText: '캐릭터' }).first().click();
await wait(page, 700);
await shot(page, T + '-13char');
R.charOverflow = await overflow(page, '#char');
R.charButtons = await visButtons(page);
R.charText = (await page.textContent('#char')).replace(/\s+/g, ' ').slice(0, 900);
const mv = page.locator('#char button:visible', { hasText: /이사|옮기|입주/ });
L('move buttons', await mv.allTextContents());
if (await mv.count()) { await mv.first().click(); await wait(page, 700); await settle(page, log, T + '-move'); L('after move', await st(page)); }
await page.locator('.tabbar:visible button', { hasText: '상점' }).first().click();
await wait(page, 700);
await shot(page, T + '-14shop');
R.shopOverflow = await overflow(page, '#shop');
R.shopText = (await page.textContent('#shop')).replace(/\s+/g, ' ').slice(0, 700);
await page.locator('.tabbar:visible button', { hasText: '홈' }).first().click();
await wait(page, 800); await settle(page, log);
await shot(page, T + '-15homeMoved');
L('home after move', await st(page));
// 2장
const ok2 = await chapter(2, []);
L('lease state', await page.evaluate(() => ({ lease: S.lease, chip: document.getElementById('hmq').textContent, mqcur: S.mq && S.mq.cur })));
// 계약 흐름은 칩을 따라 탭으로 몇 번 가 본다
for (let i = 0; i < 8 && !(await page.evaluate(() => mqDone('lease'))); i++) {
  const c = await chip(); L('lease chip ' + i, c); L('lease probe ' + i, await page.evaluate(() => ({ ch: S.lease && S.lease.ch, leaseCh: (typeof leaseCh==='function' && leaseCh()) ? leaseCh().place : null, move: !!MOVE, drive: !!DRIVE, map: ME.map, tier: S.tier })));
  await page.locator('#hmq').click().catch(() => {});
  await wait(page, 600); L('lease toast ' + i, await toastTxt()); if (i === 4) await shot(page, T + '-leaseStuck');
  await wait(page, 1900);
  await settle(page, log, T + '-lease' + i, 1500);
}
if (!(await page.evaluate(() => mqDone('lease')))) { L('lease not finished by taps; fast-forward', await st(page)); await page.evaluate(() => { S.mq.done.lease = 'good'; S.lease = null; save(); hudRefresh(); mqChip(); }); }
// 3장: Lv.6 · 은행 골목
await page.evaluate(() => { if (S.lv < 6) { S.lv = 6; } save(); hudRefresh(); mqChip(); });
await wait(page, 800); await settle(page, log);
L('ch3 wait', { chip: await chip(), bank: await page.evaluate(() => mapOpen('bank')) });
await chapter(3, []);
// 새로고침
const before = await st(page);
await page.reload();
await page.waitForSelector('.omenu:not([hidden]) .omb');
R.menuAfterReload = await page.$$eval('.omb', (bs) => bs.map((b) => b.innerText.replace(/\n/g, ' / ')));
await page.locator('.omb[data-k="lcont"]').click();
await page.waitForFunction(() => !document.getElementById('opening'));
await settle(page, log);
const after = await st(page);
R.reloadDiff = Object.keys(before).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])).map((k) => k + ': ' + JSON.stringify(before[k]) + ' -> ' + JSON.stringify(after[k]));
await shot(page, T + '-16reload');
await ctx.storageState({ path: STATE + '/after-ch3-' + vw + '.json' });
} catch (e) { log.push('CRASH ' + String(e).slice(0, 300)); await shot(page, T + '-crash'); }
await ctx.storageState({ path: STATE + '/after-ch3-' + vw + '.json' }).catch(() => {});
R.log = log; R.logs = logs;
console.log(JSON.stringify(R, null, 1));
await browser.close();
