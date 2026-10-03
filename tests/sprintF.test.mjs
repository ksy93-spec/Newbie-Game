// 스프린트 F: 플레이 QA(에이전트 셋)에서 나온 막힘과 불편의 회귀 테스트.
// 실행: node --test tests/sprintF.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import { flushStorage } from './storage.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const BASE = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href;
const GAME = BASE + '#nointro';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open(url = GAME, { w = 360, h = 640 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(url);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  return { ctx, page, logs };
}

for (const status of ['대학생', '취준생', '직장인']) {
  test('1. ' + status + ': 첫 안내 칩을 누르면 창구까지 걸어가 첫 퀘스트가 열린다(동네에 갇히지 않는다)', async () => {
    const { ctx, page, logs } = await open();
    const t = await page.evaluate((st) => {
      S = fresh(); S.status = st; applyStarter();
      Object.assign(S, { years: 0, living: '자취', region: '수도권', age: 23, prep: '공채', company: '중소기업' });
      S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.todayQ = pickDaily(); save(); render('home');
      const g = guideTarget(); return g && { map: g.map, warp: !!g.warp };
    }, status);
    assert.ok(t && (t.map === 'town' || t.warp), '동네에서 닿는 창구: ' + JSON.stringify(t));
    await page.evaluate(() => document.getElementById('hguide').click());
    await page.waitForFunction(() => !!window.RUN, null, { timeout: 15000, polling: 200 });
    assert.equal(await page.evaluate(() => GUIDE_AUTO), 0);
    assert.deepEqual(logs, []);
    await ctx.close();
  });
}

test('2. 전세로 옮겨야 하는 거처 카드는 "전세 계약하러 가기"이고, 첫 퀘스트 전에는 생활 이벤트가 없다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
    S.onboarded = true; S.tut = 1; S.coin = 5000; S.tier = 6; S.peak = 7; S.paid = 6; S.leaseDone = {}; S.lease = null; save();
    render('char'); houseTip(7);
    const labels = [...document.querySelectorAll('#itip button')].map((b) => b.textContent);
    closeTip(); S.done = []; S.evN = 0; S.evDay = null; render('home');
    let fired = 0; const orig = window.talkTo; window.talkTo = function () { fired++; return orig.apply(this, arguments); };
    const rnd = Math.random; Math.random = () => 0;          // 확률을 늘 통과시켜도
    for (let i = 0; i < 30; i++) maybeLifeEvent();
    Math.random = rnd; window.talkTo = orig;
    return { labels, fired };
  });
  assert.ok(r.labels.includes('전세 계약하러 가기'), JSON.stringify(r.labels));
  assert.equal(r.fired, 0, '첫 퀘스트 전 생활 이벤트');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('3. 시작 메뉴: 기록이 있으면 이어하기·처음부터 하기가 있고, 처음부터 하기는 확인 뒤 기록을 지운다', async () => {
  const { ctx, page, logs } = await open(BASE);
  await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.prologue = 1; S.lv = 7; save(); });
  await flushStorage(page);                                   // 저장이 넘어간 뒤 새로고침(부하가 크면 빈 저장을 읽는 일이 있다)
  await page.reload();
  await page.waitForSelector('#opening .omb[data-k="cont"]', { timeout: 8000 });
  const keys = await page.$$eval('#opening .omb', (bs) => bs.map((b) => b.dataset.k));
  assert.deepEqual(keys, ['cont', 'new', 'pro', 'snd']);
  await page.click('#opening .omb[data-k="new"]');
  await page.waitForSelector('#opening .omb[data-k="wipe"]');
  await page.click('#opening .omb[data-k="back"]');
  assert.equal(await page.evaluate(() => S.lv), 7, '돌아가기는 기록을 지우지 않는다');
  await page.click('#opening .omb[data-k="new"]');
  await page.click('#opening .omb[data-k="wipe"]');
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => ({ lv: S.lv, on: S.onboarded })), { lv: 1, on: false });
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('4. 첫날 직장인: 열린 퀘스트와 오늘 목록이 지금 갈 수 있는 곳에서 셋 이상이고, 역 앞 잠금 이유는 메인 1장이다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    S = fresh(); S.status = '직장인'; applyStarter();
    Object.assign(S, { years: 2, company: '중소기업', region: '수도권', age: 29 });
    S.onboarded = true; S.tut = 1; S.drip = null; dripEnsure(); S.todayQ = pickDaily(); save();
    const open = S.drip.u.map((id) => QMAP[id]).filter((q) => q && qOpen(q));
    const near = open.filter(qReach).length, todayNear = S.todayQ.map((id) => QMAP[id]).filter(qReach).length;
    S.lv = 12; S.mq = { done: {}, ann: {}, gf: {} }; render('home'); openTravel();
    const st = [...document.querySelectorAll('#htravel button')].find((b) => /역 앞/.test(b.textContent));
    return { near, todayNear, today: S.todayQ.length, station: st && st.textContent };
  });
  assert.ok(r.near >= 3, '갈 수 있는 열린 퀘스트 ' + r.near);
  assert.equal(r.todayNear, r.today, '오늘 목록은 모두 갈 수 있는 곳');
  assert.match(r.station, /메인 1장/);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('5. 오늘 할 일 시트는 다른 시트를 덮지 않고, 닫힌 뒤에 뜬다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => {
    Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
    S.onboarded = true; S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.msNew = [{ d: 3, coin: 50 }]; S.tdAuto = null; save(); render('home');
    openTip('<div id="other">장 완료</div>', '#FFC53C', []);
  });
  await page.waitForTimeout(3500);
  assert.equal(await page.evaluate(() => !!document.getElementById('other')), true, '앞 시트가 그대로');
  await page.evaluate(() => closeTip());
  await page.waitForFunction(() => /오늘 할 일/.test(document.getElementById('itip').textContent) && !document.getElementById('itip').hidden, null, { timeout: 4000, polling: 100 });
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('6. 메인 2장: 칩만 눌러도 부동산→매물 집→부동산→매물 집→주민센터를 거쳐 장을 마친다', async () => {
  const { playCine } = await import('./cine.mjs');
  const { ctx, page, logs } = await open();
  await page.evaluate(() => {
    Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
    S.onboarded = true; S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.lv = 8; S.coin = 3000; S.done = ['ju1', 'sik1', 'stu1']; S.stats.ju = 45; S.tier = 6; S.peak = 7; S.paid = 6;
    S.mq = { done: { job: 'good' }, ann: {}, gf: {}, at: { job: '2020-01-01' } }; save(); render('home'); mqChip();
    document.getElementById('hmq').click();
  });
  await playCine(page, []);
  for (let k = 0; k < 8; k++) {
    if (await page.evaluate(() => !!(S.mq.done && S.mq.done.lease))) break;
    await page.evaluate(() => document.getElementById('hmq').click());
    await page.waitForTimeout(600);
    await playCine(page, Array(10).fill(0), { timeout: 15000 });
    await page.waitForTimeout(600);
    await page.evaluate(() => document.querySelectorAll('#epend button').forEach((b) => { if (/새 집으로/.test(b.textContent)) b.click(); }));
    await page.waitForTimeout(600);
    if (await page.evaluate(() => !!window.MQP)) await playCine(page, [], { timeout: 15000 });
  }
  const r = await page.evaluate(() => ({ done: S.mq.done.lease, tier: S.tier }));
  assert.ok(r.done, '2장 완료');
  assert.equal(r.tier, 7);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('7. 되돌린 일러스트 주인공 저장(h_seoyun 등)을 불러와도 오류 없이 예전 주인공으로 열린다', async () => {
  const { reloadSaved } = await import('./storage.mjs');
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.tut = 1; S.avatar = 'h_seoyun'; save(); });
  await reloadSaved(page);
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => { render('char'); render('home'); return { av: S.avatar, nm: document.getElementById('hnm').textContent }; });
  assert.equal(r.av, 'stuF');
  assert.match(r.nm, /Lv\./);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('8. 주인공 여덟 명: 고르기 화면에 여덟 장이 나오고, 고르면 지도 그림(머리 모양·안경·손에 든 것)이 바뀐다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    S = fresh(); S.status = '직장인'; applyStarter(); obStep = obSteps().length - 1; obRender();
    const cards = [...document.querySelectorAll('#obbody .hcard')].map((b) => b.textContent);
    const descs = HEROES.map((h) => { pickHero(h.id); const p = heroDesc(); return [h.id, S.avatar, p.hs, !!p.glasses, p.prop].join(','); });
    pickHero('spec'); renderChar();
    const picks = document.querySelectorAll('#pavatar .hcard').length;
    return { cards, descs, picks, line: document.getElementById('phline').textContent };
  });
  assert.equal(r.cards.length, 8);
  assert.ok(r.cards.includes('김뉴비') && r.cards.includes('윤칼퇴'), JSON.stringify(r.cards));
  assert.equal(new Set(r.descs.map((d) => d.split(',').slice(1).join(','))).size, 8, '여덟 명이 서로 다르게 그려진다');
  assert.equal(r.picks, 8);
  assert.match(r.line, /정스펙/);
  assert.deepEqual(logs, []);
  await ctx.close();
});
