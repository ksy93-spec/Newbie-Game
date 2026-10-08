// 보스 안내가 잠긴 은행 골목을 가리키는지. node ops/review-1008/tools/qa-13-bosslock.mjs
import { open, closeBrowser, shot, sleep, seed, clearOverlays } from './qa-lib.mjs';
const { page, logs } = await open({ view: 's' });
await seed(page, '직장인', { lv: 3 });
await clearOverlays(page);
const r = await page.evaluate(() => { const b = BOSSES.find((x) => x.id === 'jeonse'); S.stats[b.stat] = b.need; S.tuts = S.tuts.filter((t) => t !== 'boss'); save(); return { need: b.need, stat: b.stat, ready: bossReady(b), bankOpen: mapOpen('bank'), lv: S.lv, codex: null }; });
await page.evaluate(() => { render('home'); checkTutor(); });
await sleep(1500);
const t = await page.evaluate(() => ({ tut: window.TUT && TUT.name, line: window.TUT && String(TUT.lines[0]).slice(0, 80) }));
await shot(page, '13-boss-tutor-locked');
await page.evaluate(() => { TUT = null; document.getElementById('htutor') && (document.getElementById('htutor').hidden = true); });
await page.evaluate(() => render('codex')); await sleep(300);
const cx = await page.evaluate(() => [...document.querySelectorAll('#codex b')].map((b) => b.nextElementSibling && b.nextElementSibling.textContent).filter((x) => /보스|사기|설계|다단계|·/.test(x || '')).slice(-4));
await page.evaluate(() => render('home')); await sleep(300);
await page.click('#hmini'); await sleep(300);
const tr = await page.$$eval('#htravel button', (bs) => bs.map((b) => b.innerText.replace(/\s+/g, ' ') + (b.disabled ? '(off)' : '')));
await shot(page, '13-travel-locked');
console.log(JSON.stringify({ r, t, cx, tr }, null, 1), 'ERRORS', logs);
await closeBrowser();
