// 상점 확인 창 점검. node ops/review-1008/tools/qa-11-shop.mjs [s|m]
import { open, closeBrowser, shot, sleep, seed, clearOverlays } from './qa-lib.mjs';
const view = process.argv[2] || 's';
const { page, logs } = await open({ view });
await seed(page, '직장인', { coin: 900, lv: 5 });
await clearOverlays(page);
await page.evaluate(() => render('shop')); await sleep(500);
const dom = await page.evaluate(() => { const sh = document.getElementById('shop'); return { tip: !document.getElementById('itip').hidden, cls: [...new Set([...sh.querySelectorAll('button')].map((b) => b.className))].slice(0, 12), segs: [...sh.querySelectorAll('button')].slice(0, 10).map((b) => b.innerText.replace(/\s+/g, ' ').slice(0, 30) + (b.disabled ? '(off)' : '')) }; });
console.log('dom', JSON.stringify(dom));
await shot(page, `11-shop-${view}`);
// 장비 줄 아무거나: 보유가 아닌 첫 버튼
const r = await page.evaluate(() => { const bs = [...document.querySelectorAll('#shop button')].filter((b) => /￦\d/.test(b.innerText) && !/보유|입는 중/.test(b.innerText) && !b.disabled); if (!bs.length) return null; bs[0].id = 'qaitem'; return bs[0].innerText.replace(/\s+/g, ' ').slice(0, 50); });
console.log('item', r);
const c0 = await page.evaluate(() => S.coin);
await page.click('#qaitem'); await sleep(400);
const sheet = await page.evaluate(() => ({ open: !document.getElementById('itip').hidden, txt: document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 200), btns: [...document.querySelectorAll('#itipbox button')].map((b) => b.innerText), coin: S.coin }));
console.log('sheet', JSON.stringify(sheet), 'c0', c0);
await shot(page, `11-shop-confirm-${view}`);
const bx = await page.evaluate(() => { const b = document.getElementById('itipbox').getBoundingClientRect(); return [b.top, b.bottom, innerHeight].map(Math.round); });
console.log('sheetbox', bx);
await page.mouse.click(5, 5); await sleep(300);
console.log('afterBackdrop', JSON.stringify(await page.evaluate(() => ({ open: !document.getElementById('itip').hidden, coin: S.coin }))));
await page.click('#qaitem').catch(async () => { await page.evaluate(() => document.getElementById('qaitem') && qaitem.click()); }); await sleep(300);
const buy = page.locator('#itipbox button', { hasText: '사서' });
await buy.click(); await buy.click({ timeout: 400 }).catch(() => {}); await sleep(400);
console.log('afterBuy', JSON.stringify(await page.evaluate(() => ({ open: !document.getElementById('itip').hidden, coin: S.coin, toast: document.getElementById('htoast').hidden ? '' : document.getElementById('htoast').textContent }))));
// 세간·거처·탈것 등 다른 줄도 확인 창인지: 모든 사기 버튼 종류 첫 개씩
const kinds = await page.evaluate(async () => {
  const out = []; const tabs = [...document.querySelectorAll('#shop .seg button, #shop .stabs button, #shop [role=tab]')];
  for (const t of tabs) { t.click(); await new Promise((r) => setTimeout(r, 200)); const b = [...document.querySelectorAll('#shop button')].find((x) => /￦\d/.test(x.innerText) && !/보유|입는 중/.test(x.innerText) && !x.disabled); if (!b) { out.push([t.innerText, 'none']); continue; } const c = S.coin; b.click(); await new Promise((r) => setTimeout(r, 250)); out.push([t.innerText.trim(), b.innerText.replace(/\s+/g, ' ').slice(0, 24), 'sheet=' + !document.getElementById('itip').hidden, 'coinDelta=' + (S.coin - c)]); closeTip(); }
  return out; });
console.log('kinds', JSON.stringify(kinds));
await page.evaluate(() => { S.coin = 5; renderShop(); }); await sleep(200);
const poor = await page.evaluate(() => { const b = [...document.querySelectorAll('#shop button')].find((x) => /￦\d/.test(x.innerText) && !/보유|입는 중/.test(x.innerText)); if (!b) return 'none'; const d = b.disabled; b.click(); return { dis: d, txt: b.innerText.replace(/\s+/g, ' ').slice(0, 40), open: !document.getElementById('itip').hidden, sheet: document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 120), btns: [...document.querySelectorAll('#itipbox button')].map((x) => x.innerText + (x.disabled ? '(off)' : '')), toast: document.getElementById('htoast').hidden ? '' : document.getElementById('htoast').textContent }; });
console.log('poor', JSON.stringify(poor));
await shot(page, `11-shop-poor-${view}`);
console.log('ERRORS', logs);
await closeBrowser();
