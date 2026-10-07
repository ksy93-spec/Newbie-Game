// 마케팅·첫인상: 스토어 스크린샷 후보를 1080×1920(360×640, 배율 3)으로 찍는다.
// 실행: node ops/review-1007/tools/mk-store.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(root, 'ops/review-1007/img');
const browser = await chromium.launch();
const errs = [];

async function open(hash = '#nointro') {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + hash);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  return { ctx, page };
}
// 중반 상태: 원룸 전세, Lv.9, 메인 1~2장 끝
const MID = () => {
  S = fresh(); S.status = '직장인'; applyStarter();
  Object.assign(S, { years: 0, company: '중소기업', region: '수도권', age: 27, living: '자취' });
  S.onboarded = true; S.tut = 1; S.tuts = TUT_STEPS.map((t) => t.id); S.prologue = 1;
  S.lv = 9; S.xp = 40; S.coin = 2480; S.tier = 8; S.peak = 8; S.paid = 8; S.streak = 6; S.best = 6;
  S.stats = { ju: 48, sik: 30, ui: 26, geum: 41, jik: 35 };
  S.hero = 'jachwi'; pickHero('jachwi');
  S.done = QUESTS.filter((q) => !q.keys).slice(0, 18).map((q) => q.id);
  S.mq.done = { job: 'S', lease: 'A' }; S.claimed = dayKey(); S.todayQ = pickDaily();
  ['bed2', 'sofa', 'bigtv', 'plant', 'table2', 'shelf', 'fridge2', 'aircon', 'wash', 'purifier'].forEach((id) => { if (S.owned.indexOf(id) < 0) S.owned.push(id); });
  save();
};
async function shot(page, name) { await page.screenshot({ path: path.join(IMG, 'mk-store-' + name + '.png') }); }

// 1. 타이틀
{ const { ctx, page } = await open('');
  await page.waitForSelector('.omenu:not([hidden])'); await page.waitForTimeout(500); await shot(page, '1-title'); await ctx.close(); }
// 2. 프롤로그 할배 등장
{ const { ctx, page } = await open();
  await page.evaluate(() => { S.onboarded = true; S.status = '대학생'; save(); playPrologue(null, () => {}); });
  const box = await page.locator('#opening canvas').boundingBox();
  for (let i = 0; i < 10; i++) { await page.mouse.click(box.x + 100, box.y + 100); await page.waitForTimeout(120); }
  await page.waitForTimeout(1600); await shot(page, '2-prologue-halbae'); await ctx.close(); }
// 3. 지도: 여러 곳
for (const [id, x, y] of [['town', 8, 6], ['market', 10, 6], ['busan', 8, 6], ['gyeongju', 8, 6], ['jeonju', 8, 6], ['station', 8, 6], ['villa', 8, 6]]) {
  const { ctx, page } = await open();
  await page.evaluate(MID);
  await page.evaluate(() => render('home'));
  await page.waitForTimeout(300);
  const ok = await page.evaluate(([id, x, y]) => { if (!MAPS[id]) return false; enterMap(id, x, y); return true; }, [id, x, y]);
  if (ok) { await page.waitForTimeout(2600); await page.evaluate(() => { const t = document.getElementById('htoast'); if (t) t.hidden = true; if (TUT) endTalk(); }); await page.waitForTimeout(300); await shot(page, '3-map-' + id); }
  await ctx.close();
}
// 4. 방(투룸 전세 + 세간)
{ const { ctx, page } = await open();
  await page.evaluate(MID);
  await page.evaluate(() => { render('home'); PLACE = { id: 'bed2', queue: ['sofa', 'bigtv', 'plant', 'table2', 'shelf', 'fridge2', 'aircon', 'wash', 'purifier'] }; autoPlaceRest(); const sp = roomMap().spawn; enterMap('room', sp.x, sp.y); });
  await page.waitForTimeout(2600); await page.evaluate(() => { document.getElementById('htoast').hidden = true; if (TUT) endTalk(); });
  await page.waitForTimeout(300); await shot(page, '4-room'); await ctx.close(); }
// 5. 퀘스트 문항(사기 관련)
{ const { ctx, page } = await open();
  await page.evaluate(MID);
  await page.evaluate(() => { S.tipTools = 1; save(); const q = QUESTS.find((q) => /사기|스미싱|피싱/.test(q.title)) || QUESTS[0]; RUN = null; S.done = S.done.filter((d) => d !== q.id); window.__q = q.id; startQuest(q); });
  await page.waitForSelector('#qnext:not([hidden])', { timeout: 10000 }); await page.click('#qnext');
  await page.waitForSelector('#qchoices:not([hidden]) .choice'); await page.waitForTimeout(400);
  await shot(page, '5-quest-q');
  await page.evaluate(() => { const ok = RUN.q.qs[RUN.i].ok; const bs = [...document.querySelectorAll('#qchoices .choice')]; bs.find((b) => +b.dataset.orig !== ok).click(); });
  await page.waitForTimeout(500); await shot(page, '5-quest-wrong');
  await ctx.close(); }
// 6. 보스전
{ const { ctx, page } = await open();
  await page.evaluate(MID);
  await page.evaluate(() => { S.full = 100; save(); startBoss(BOSSES[0]); });
  await page.waitForSelector('#bnext:not([hidden])', { timeout: 10000 }); await page.click('#bnext');
  await page.waitForTimeout(1200); await shot(page, '6-boss'); await ctx.close(); }
// 7. 캐릭터
{ const { ctx, page } = await open();
  await page.evaluate(MID); await page.evaluate(() => { S.equip.pet = Object.keys(PETS).find((k) => PETS[k].kind) || 'pnone'; save(); render('char'); });
  await page.waitForTimeout(600); await shot(page, '7-char'); await ctx.close(); }
// 8. 생활 이벤트(스미싱)
{ const { ctx, page } = await open();
  await page.evaluate(MID);
  await page.evaluate(() => { render('home'); S.evSeen = []; const all = typeof LIFE_EVS !== 'undefined' ? LIFE_EVS : null; Math.random = ((r) => () => 0.0)(Math.random); maybeLifeEvent(true); });
  await page.waitForTimeout(2500); await shot(page, '8-life-event'); await ctx.close(); }
// 9. 메인 퀘스트 컷신(첫 신용카드)
{ const { ctx, page } = await open();
  await page.evaluate(MID);
  await page.evaluate(() => { render('home'); S.mq.done = { job: 'S', lease: 'A' }; save(); mqStart('card'); });
  await page.waitForTimeout(2500); await shot(page, '9-mq-cine');
  const box = await page.locator('#opening canvas').boundingBox().catch(() => null);
  if (box) { for (let i = 0; i < 4; i++) { await page.mouse.click(box.x + 100, box.y + 100); await page.waitForTimeout(200); } await page.waitForTimeout(1500); await shot(page, '9-mq-cine-2'); }
  await ctx.close(); }
console.log('errors', errs);
await browser.close();
