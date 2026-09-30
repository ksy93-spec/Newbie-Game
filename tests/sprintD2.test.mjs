// 스프린트 D2: 전세 계약 사건. 매물 고르기 → 가계약 → 삼자대면 본계약 → 이사 당일.
// 실행: node --test tests/sprintD2.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import { reloadSaved } from './storage.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href + '#nointro';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

const PROFILE = { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 };

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate((p) => {
    Object.assign(S, p);
    S.onboarded = true; S.demo = false; S.demoDone = 1; S.lv = 12; S.coin = 2000; S.full = 100;
    S.stats.ju = 45; S.peak = 7; S.tier = 6; S.paid = 6; S.lastTier = 6;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.todayQ = pickDaily(); save(); render('home');
  }, PROFILE);
  return { ctx, page, logs };
}
const sleep = (page, ms) => page.waitForTimeout(ms);
const stateOf = (page) => page.evaluate(() => ({ tier: S.tier, coin: S.coin, lease: S.lease && { ch: S.lease.ch, b: S.lease.b, pick: S.lease.pick, voided: S.lease.voided || 0 },
  done: S.leaseDone || {}, scr: document.querySelector('.screen.on').id }));

/** 지금 장면이 벌어지는 곳의 계약 상대 앞에 서서 스페이스로 말을 건다 */
async function approach(page) {
  await page.evaluate(() => {
    const p = leasePlace(leaseCh().place);
    let map = null, sp = null;
    Object.keys(MAPS).forEach((k) => (MAPS[k].spots || []).forEach((s) => { if (s.kind === 'lease' && s.place === p) { map = k; sp = s; } }));
    const m = MAPS[map], n = [[0, 1], [0, -1], [-1, 0], [1, 0]].map((d) => [sp.x + d[0], sp.y + d[1]]).find(([x, y]) => walkable(m, x, y, 1, 'foot') && !warpAt(m, x, y));
    S.onFoot = true; enterMap(map, n[0], n[1]); ME.dir = n[1] > sp.y ? 3 : n[1] < sp.y ? 0 : n[0] > sp.x ? 1 : 2; drawScene();
  });
  await sleep(page, 200);
  await page.keyboard.press(' ');
  await page.waitForFunction(() => document.getElementById('ep').classList.contains('on'), null, { timeout: 5000, polling: 100 });
}
/** 한 장을 고른 보기 번호대로 끝낸다 */
async function playChapter(page, picks) {
  for (const k of picks) {
    await page.waitForSelector('#epchoices:not([hidden]) .choice:not([disabled])', { timeout: 8000 });
    await page.locator('#epchoices .choice').nth(k).click();
    await page.waitForSelector('#epnext:not([hidden])');
    await page.click('#epnext');
    await sleep(page, 150);
  }
}

test('1. 전세 거처로 옮기려 하면 이사 대신 계약 사건이 열리고, 부동산에 표시가 뜬다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => { const mv = tierMove(7); save();
    return { mv, tier: S.tier, lease: S.lease, mark: spotMark(MAPS.town_estate.spots.find((s) => s.kind === 'lease')), door: marksIn('town_estate').n,
      hall: spotMark(MAPS.town_hall.spots.find((s) => s.kind === 'lease')), six: (S.lease = null, tierMove(6)) }; });
  assert.equal(r.mv.ok, 0); assert.equal(r.mv.lease, 1);
  assert.equal(r.tier, 6, '아직 이사하지 않았다');
  assert.equal(r.lease.to, 7);
  assert.equal(r.mark, '!');
  assert.ok(r.door >= 1, '부동산 문 위에 느낌표');
  assert.equal(r.hall, null, '주민센터는 아직');
  assert.equal(r.six.ok, 1, '월세 거처는 그대로 옮긴다');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('2. 안전한 구축을 고르고 순서대로 확인하면: 네 장면 끝에 이사하고 최고 결말', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { tierMove(7); save(); });
  const c0 = await page.evaluate(() => S.coin);
  const cost = await page.evaluate(() => tierCost(7));
  await approach(page);
  assert.match(await page.textContent('#epname'), /1장 · 매물 고르기/);
  assert.equal(await page.isVisible('#epdoc'), true, '매물 안내 서류가 보인다');
  await playChapter(page, [0, 0, 0]);
  let st = await stateOf(page);
  assert.equal(st.lease.ch, 1); assert.equal(st.lease.pick, 'B'); assert.equal(st.scr, 'home');
  await approach(page);
  assert.match(await page.textContent('#epname'), /2장 · 가계약/);
  assert.match(await page.textContent('#epdoc'), /예금주/);
  await playChapter(page, [0, 0]);
  await approach(page);
  assert.match(await page.textContent('#epname'), /3장 · 삼자대면 본계약/);
  await playChapter(page, [0, 0, 0, 0]);
  await approach(page);
  assert.match(await page.textContent('#epname'), /4장 · 이사 당일 \(오전\)/);
  await playChapter(page, [0, 0]);
  st = await stateOf(page);
  assert.equal(st.tier, 6, '전입신고 전에는 아직 옛집');
  await approach(page);
  assert.match(await page.textContent('#epname'), /4장 · 이사 당일 \(오후\)/);
  assert.equal(await page.evaluate(() => ME.map), 'town_hall', '마지막 장면은 주민센터');
  await playChapter(page, [0, 0]);
  await page.waitForSelector('#epend.on');
  assert.equal(await page.textContent('#eebig'), '보증금을 지켰다');
  st = await stateOf(page);
  assert.equal(st.tier, 7, '원룸 전세로 이사');
  assert.equal(st.lease, null);
  assert.equal(st.done[7], 1);
  assert.equal(st.coin, c0 - cost + 200, '보증금을 내고 보상을 받았다');
  assert.match(await page.textContent('#eebody'), /iros\.go\.kr|인터넷등기소/);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('3. 깡통전세(A)를 골라도 보증보험 특약을 걸었으면 이사 전에 계약을 되돌린다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { tierMove(7); save(); });
  await approach(page); await playChapter(page, [0, 1, 1]);
  assert.equal((await stateOf(page)).lease.pick, 'A');
  await approach(page); await playChapter(page, [0, 0]);
  await approach(page); await playChapter(page, [0, 0, 0, 0]);
  await page.waitForSelector('#epend.on');
  assert.equal(await page.textContent('#eebig'), '계약을 되돌렸다');
  assert.match(await page.textContent('#eebody'), /2,400만 원/);
  const st = await stateOf(page);
  assert.equal(st.tier, 6);
  assert.deepEqual(st.lease, { ch: 0, b: 0, pick: null, voided: 1 }, '매물 고르기부터 다시');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('4. 깡통전세(A)에 특약 없이 들어가면 이사는 하지만 보증금이 묶이는 결말과 계산을 본다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { tierMove(7); save(); });
  await approach(page); await playChapter(page, [0, 1, 1]);
  await approach(page); await playChapter(page, [0, 1]);
  await approach(page); await playChapter(page, [0, 0, 1, 0]);
  await approach(page); await playChapter(page, [0, 0]);
  await approach(page);
  await playChapter(page, [0]);                            // 전입신고·확정일자
  await page.waitForSelector('#epchoices:not([hidden]) .choice:not([disabled])', { timeout: 8000 });
  const opts = await page.$$eval('#epchoices .choice', (b) => b.map((x) => x.textContent));
  assert.equal(opts.length, 1, 'A는 보증보험 가입이 안 돼 선택지가 하나');
  await playChapter(page, [0]);
  await page.waitForSelector('#epend.on');
  assert.equal(await page.textContent('#eebig'), '보증금이 묶였다');
  assert.match(await page.textContent('#eebody'), /1억 7,600만 원/);
  assert.equal((await stateOf(page)).tier, 7);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('5. 중간에 나가고 새로고침해도 그 장면부터 이어진다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { tierMove(7); save(); });
  await approach(page); await playChapter(page, [0, 0, 0]);
  await approach(page);
  await page.waitForSelector('#epchoices:not([hidden]) .choice');
  await page.locator('#epchoices .choice').first().click();
  await page.click('#epback');                             // 가계약 첫 장면을 고르고 나간다
  await reloadSaved(page);
  await page.waitForFunction(() => window.S && window.QUESTS && document.getElementById('home').classList.contains('on'), null, { polling: 100 });
  const st = await stateOf(page);
  assert.deepEqual([st.lease.ch, st.lease.b, st.lease.pick], [1, 1, 'B']);
  await approach(page);
  await page.waitForSelector('#epchoices:not([hidden]) .choice');
  assert.match(await page.textContent('#eptext'), /답장/, '두 번째 장면부터');
  await ctx.close();
});

test('6. 잔금(입주 보증금)이 모자라면 이사 당일 장면을 열지 않는다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { tierMove(7); S.lease.ch = 3; S.lease.b = 0; S.lease.pick = 'B'; S.coin = 5; save();
    window.__t = []; const t0 = window.toast; window.toast = (m) => { window.__t.push(m); return t0(m); }; });
  await page.evaluate(() => { const s = MAPS.town_estate.spots.find((x) => x.kind === 'lease'); S.onFoot = true; enterMap('town_estate', s.x, s.y + 1); ME.dir = 3; });
  await page.keyboard.press(' '); await sleep(page, 300);
  const r = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, t: window.__t.join('/') }));
  assert.equal(r.scr, 'home');
  assert.match(r.t, /잔금/);
  await ctx.close();
});
