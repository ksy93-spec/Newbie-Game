// 마케팅·첫인상: 캐릭터 화면과 깨끗한 지도 한 장 다시 찍기
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(root, 'ops/review-1007/img');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(BASE + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
await page.evaluate(() => {
  S = fresh(); S.status = '직장인'; applyStarter();
  Object.assign(S, { years: 0, company: '중소기업', region: '수도권', age: 27, living: '자취' });
  S.onboarded = true; S.tut = 1; S.tuts = TUT_STEPS.map((t) => t.id); S.prologue = 1;
  S.lv = 9; S.xp = 40; S.coin = 2480; S.tier = 8; S.peak = 8; S.paid = 8; S.streak = 6;
  S.stats = { ju: 48, sik: 30, ui: 26, geum: 41, jik: 35 }; pickHero('jachwi');
  S.mq.done = { job: 'S', lease: 'A' }; rollDay(); S.claimed = dayKey(); S.todayQ = pickDaily();
  const pet = Object.keys(PETS).find((k) => PETS[k].kind); if (pet) { S.owned.push(pet); S.equip.pet = pet; }
  save(); render('home'); render('char');
});
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(IMG, 'mk-store-7-char.png') });
await page.evaluate(() => { render('home'); enterMap('busan', 8, 7); });
await page.waitForTimeout(2600);
await page.evaluate(() => { document.getElementById('htoast').hidden = true; if (TUT) endTalk(); });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(IMG, 'mk-store-3-map-busan.png') });
await browser.close();
