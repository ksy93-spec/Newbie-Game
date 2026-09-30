// 스프린트 E: 메인 퀘스트. 할배 안내 → 컷신 → 보상·잠금 해제. 대본 검사, 이어 보기, 다시 보기, 잠금.
// 실행: node --test tests/sprintE.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import { reloadSaved } from './storage.mjs';
import { playCine } from './cine.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href + '#nointro';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open({ w = 390, h = 844, mq = null, done = [] } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(([mq, done]) => {
    Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
    S.onboarded = true; S.demo = false; S.demoDone = 1; S.lv = 12; S.coin = 500; S.full = 100;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.evDay = dayKey(); S.evN = 99; S.done = done.slice();
    S.mq = mq || { done: {}, ann: {} };
    S.todayQ = pickDaily(); save(); render('home');
  }, [mq, done]);
  return { ctx, page, logs };
}
const sleep = (page, ms) => page.waitForTimeout(ms);
const ALLDONE = (upTo) => { const ids = ['job', 'lease', 'card', 'car', 'wedding', 'home'], d = {}; for (const id of ids) { if (id === upTo) break; d[id] = 'good'; } return { done: d, ann: {} }; };
/** 대본의 모든 선택에서 맞는 보기(ok)를 고르는 번호 목록 */
const rightPicks = (page, key) => page.evaluate((key) => window[key].scenes.filter((s) => s.choice).map((s) => s.choice.opts.findIndex((o) => o.ok)), key);

test('1. 대본 검사: 여섯 장 모두 있고, 배경·출연자·선택 형식이 맞다', async () => {
  const { ctx, page } = await open();
  const r = await page.evaluate(() => {
    const bad = [], info = {};
    const CAST = ['hero', 'gpa', 'partner'].concat(Object.keys(NPC_TOP));
    MQ_LIST.forEach((c) => {
      if (c.id === 'lease') { const W = window.MQ_LEASE_WRAP; if (!W || !W.intro || !W.outro) bad.push('lease wrap 없음'); return; }
      const d = window[c.key]; if (!d) { bad.push(c.id + ' 대본 없음'); return; }
      const ch = d.scenes.filter((s) => s.choice).length; info[c.id] = [d.scenes.length, ch];
      if (d.scenes.length < 10 || d.scenes.length > 22) bad.push(c.id + ' 장면 ' + d.scenes.length);
      if (ch < 3 || ch > 4) bad.push(c.id + ' 선택 ' + ch);
      if (!d.ends || !d.ends.good || !d.ends.ok || !d.ends.bad) bad.push(c.id + ' 결말 없음');
      if (!(d.src || []).length) bad.push(c.id + ' 출처 없음');
      d.scenes.forEach((s, i) => {
        if (s.bg && !MQ_BG[s.bg]) bad.push(c.id + '#' + i + ' 배경 ' + s.bg);
        (s.cast || []).forEach((k) => { if (CAST.indexOf(k[0]) < 0) bad.push(c.id + '#' + i + ' 출연 ' + k[0]); });
        if (s.choice) { const oks = s.choice.opts.filter((o) => o.ok).length; if (oks < 1) bad.push(c.id + '#' + i + ' 정답 없음');
          s.choice.opts.forEach((o) => { if (!o.note) bad.push(c.id + '#' + i + ' 해설 없음'); }); }
        if (s.doc && (s.doc.rows || []).length > 4) bad.push(c.id + '#' + i + ' 서류 줄 ' + s.doc.rows.length);
      });
    });
    return { bad, info };
  });
  assert.deepEqual(r.bad, [], JSON.stringify(r.info));
  await ctx.close();
});

test('2. 퀘스트 셋을 끝내면 할배가 1장을 알리고, 지금 시작을 누르면 컷신이 열린다', async () => {
  const { ctx, page, logs } = await open({ done: ['ju1', 'sik1', 'stu1'] });
  // 설치 첫날 첫 3분은 알리지 않는다. 그 규칙부터 본다
  assert.equal(await page.evaluate(() => { S.first = dayKey(); MQ_T0 = Date.now(); return mqAnnounce(); }), false, '첫날 첫 3분에는 조용히');
  await page.evaluate(() => { S.first = '2020-01-01'; save(); render('home'); });
  await page.waitForSelector('#htutor:not([hidden])', { timeout: 8000 });
  assert.equal(await page.textContent('#htutornm'), '귀인 할배');
  for (let i = 0; i < 6 && !(await page.isVisible('#htutorop .topt')); i++) { await page.click('#htutor'); await sleep(page, 250); }
  await page.locator('#htutorop .topt', { hasText: '지금 시작' }).click();
  await page.waitForFunction(() => !!window.MQP, null, { timeout: 5000 });
  assert.equal(await page.evaluate(() => MQP.o.title), '첫 취업');
  const chip = await page.evaluate(() => !document.getElementById('hmq').hidden && document.getElementById('hmq').textContent);
  assert.match(chip, /메인 1장/);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('3. 3장을 모두 맞게 끝내면 최고 등급, 보상, 다음 장 표시. 다시 보면 보상이 없다', async () => {
  const { ctx, page, logs } = await open({ mq: ALLDONE('card') });
  const c0 = await page.evaluate(() => S.coin);
  const picks = await rightPicks(page, 'MQ_CARD');
  await page.evaluate(() => mqStart('card'));
  await playCine(page, picks);
  const st = await page.evaluate(() => ({ g: S.mq.done.card, coin: S.coin, cur: S.mq.cur, chip: document.getElementById('hmq').textContent }));
  assert.equal(st.g, 'good');
  assert.equal(st.coin, c0 + (await page.evaluate(() => MQ_REWARD.card.coin)));
  assert.equal(st.cur, null);
  assert.match(st.chip, /메인 4장/);
  await page.evaluate(() => mqStart('card'));
  await playCine(page, picks);
  assert.equal(await page.evaluate(() => S.coin), st.coin, '같은 등급으로 다시 보면 보상 없음');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('4. 보다가 나가도 그 장면부터 이어 본다', async () => {
  const { ctx, page } = await open({ mq: ALLDONE('wedding') });
  const picks = await rightPicks(page, 'MQ_WEDDING');
  await page.evaluate(() => mqStart('wedding'));
  await page.waitForFunction(() => !!window.MQP);
  // 첫 선택까지 넘기고 고른 뒤 닫는다
  for (let g = 0; g < 80; g++) {
    const s = await page.evaluate(() => { const p = MQP.list()[MQP.cur()] || {}; return { c: !!p.choice, picked: MQP.picked }; });
    if (s.c && s.picked === null) { await page.evaluate((j) => MQP.pick(j), picks[0]); break; }
    await page.evaluate(() => MQP.next({ type: 'test' })); await sleep(page, 30);
  }
  const mid = await page.evaluate(() => ({ cur: S.mq.cur, i: S.mq.i, ok: S.mq.ok, n: S.mq.n }));
  assert.equal(mid.cur, 'wedding'); assert.ok(mid.i > 0); assert.deepEqual([mid.ok, mid.n], [1, 1]);
  await reloadSaved(page);
  await page.waitForFunction(() => document.getElementById('home').classList.contains('on'), null, { polling: 100 });
  await page.evaluate(() => mqStart('wedding'));
  await page.waitForFunction(() => !!window.MQP);
  assert.equal(await page.evaluate(() => MQP.o.from), mid.i, '고른 다음 장면부터');
  await playCine(page, picks.slice(1));
  assert.equal(await page.evaluate(() => S.mq.done.wedding), 'good', '앞에서 맞힌 것도 세어 최고 등급');
  await ctx.close();
});

test('5. 잠금: 차는 4장 전엔 못 사고, 경주·대구는 5장 전엔 못 가고, 자가는 6장 전엔 안 열린다', async () => {
  const { ctx, page, logs } = await open({ mq: ALLDONE('car') });
  const shop = await page.evaluate(() => { render('shop'); const rows = [...document.querySelectorAll('#shopbody .item')].filter((b) => /중고 경차|중형 세단/.test(b.textContent));
    return rows.map((b) => ({ dis: b.disabled, t: b.textContent })); });
  assert.equal(shop.length, 2);
  assert.ok(shop.every((r) => r.dis && /메인 4장/.test(r.t)), JSON.stringify(shop));
  const st = await page.evaluate(() => { S.mq.done.job = null; const a = mapOpen('station'); S.mq.done.job = 'good'; return [a, mapOpen('station')]; });
  assert.deepEqual(st, [false, true], '역 앞은 메인 1장 뒤에');
  const tier = await page.evaluate(() => { S.stats.ju = 90; S.peak = 8; S.tier = 8; S.paid = 8; S.upDay = null; S.upN = 0; S.first = '2020-01-01'; return { g: tierGrow(), peak: S.peak }; });
  assert.equal(tier.g, null); assert.equal(tier.peak, 8, '자가는 메인 6장 뒤에');
  await page.evaluate(() => { if (S.owned.indexOf('car') < 0) S.owned.push('car'); S.equip.mount = 'car'; S.onFoot = false; S.park = null; render('home'); enterMap('korea', 12, 21);
    window.__t = []; const t0 = window.toast; window.toast = (m) => { window.__t.push(m); return t0(m); }; goTo(12, 19, null); });
  await sleep(page, 2500);
  const r = await page.evaluate(() => ({ map: ME.map, t: window.__t.join('/') }));
  assert.equal(r.map, 'korea'); assert.match(r.t, /메인 5장/);
  // 4장을 마치면 상점 잠금이 풀린다(차는 보상 코인으로 산다)
  const picks = await rightPicks(page, 'MQ_CAR');
  await page.evaluate(() => { S.owned = S.owned.filter((x) => x !== 'car'); S.equip.mount = 'mnone'; render('home'); mqStart('car'); });
  await playCine(page, picks);
  const after = await page.evaluate(() => ({ car: mqShopLock('mount', 'car'), sedan: mqShopLock('mount', 'sedan'), item: S.owned.indexOf('mq_shades') >= 0, hw: mqOk('car') }));
  assert.equal(after.car, null); assert.equal(after.sedan, null);
  assert.equal(after.item, true, '4장 특별 보상(초보운전 선글라스)');
  assert.equal(after.hw, true, '고속도로가 열렸다');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('6. 360x640에서도 선택지가 화면 안에 들어오고 눌러서 고를 수 있다', async () => {
  const { ctx, page, logs } = await open({ w: 360, h: 640, mq: ALLDONE('card') });
  await page.evaluate(() => mqStart('card'));
  await page.waitForFunction(() => !!window.MQP);
  for (let g = 0; g < 80; g++) {
    const s = await page.evaluate(() => { const p = MQP.list()[MQP.cur()] || {}; return { c: !!p.choice, n: MQP.opts.length }; });
    if (s.c && s.n) break;
    await page.evaluate(() => MQP.next({ type: 'test' })); await sleep(page, 60);
  }
  await sleep(page, 200);
  const box = await page.evaluate(() => { const cv = document.querySelector('#opening canvas'), r = cv.getBoundingClientRect(), H = cv.height / RES;
    return { rects: MQP.opts.map((b) => ({ x: r.left + (b.x + b.w / 2) * r.width / 160, y: r.top + (b.y + b.h / 2) * r.height / H, top: b.y })), vw: innerWidth, vh: innerHeight }; });
  assert.ok(box.rects.length >= 2);
  assert.ok(box.rects.every((b) => b.top >= 0 && b.y < box.vh && b.x < box.vw), JSON.stringify(box));
  await page.mouse.click(box.rects[0].x, box.rects[0].y);
  await sleep(page, 200);
  assert.equal(await page.evaluate(() => (MQP.list()[MQP.cur()] || {}).type), 'note', '눌러서 골랐다(해설로 넘어감)');
  assert.deepEqual(logs, []);
  await ctx.close();
});
