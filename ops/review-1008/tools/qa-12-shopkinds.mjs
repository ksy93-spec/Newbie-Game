// 상점 각 탭·각 줄 첫 물건을 한 번 눌러 확인 창이 뜨는지, 코인이 바로 빠지는지. node ops/review-1008/tools/qa-12-shopkinds.mjs
import { open, closeBrowser, shot, sleep, seed, clearOverlays } from './qa-lib.mjs';
const { page, logs } = await open({ view: 's' });
await seed(page, '직장인', { coin: 3000, lv: 12 });
await clearOverlays(page);
await page.evaluate(() => render('shop')); await sleep(500);
const tabs = await page.$$eval('#shop .tab', (t) => t.map((x) => x.innerText.trim()));
console.log('tabs', tabs);
const out = [];
for (let ti = 0; ti < tabs.length; ti++) {
  await page.evaluate((i) => { const t = document.querySelectorAll('#shop .tab')[i]; if (t.closest('#shop .tabs, #shop .seg') || !/홈|백과|캐릭터/.test(t.innerText)) t.click(); }, ti);
  await sleep(250);
  const r = await page.evaluate(() => {
    const seen = new Set(); const res = [];
    const bs = [...document.querySelectorAll('#shop .item')].filter((b) => /￦\d/.test(b.innerText) && !b.disabled && !/보유|입는 중|있음/.test(b.innerText));
    for (const b of bs) { const grp = (b.closest('section,.grp,.sec') || {}).className || ''; const key = (b.previousElementSibling && b.previousElementSibling.className) + grp; if (seen.size > 6) break; const c = S.coin; b.click(); res.push({ n: b.innerText.replace(/\s+/g, ' ').slice(0, 18), sheet: !document.getElementById('itip').hidden, btn: [...document.querySelectorAll('#itipbox button')].map((x) => x.innerText).join('/'), d: S.coin - c }); closeTip(); seen.add(res.length); }
    return res; });
  out.push({ tab: tabs[ti], r });
}
console.log(JSON.stringify(out, null, 0));
console.log('ERRORS', logs);
await closeBrowser();
