// 스프린트 C1: 생활 이벤트 확장(30개 이상)과 계절 필터.
// 게임 HTML을 file:// 로 열고(#nointro) 실제 함수(lifeEvPick, maybeLifeEvent)를 부른다.
// 실행: node --test tests/sprintC1.test.mjs   (PLAYWRIGHT_BROWSERS_PATH 가 없으면 /opt/pw-browsers 를 쓴다)
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('/home/claude/Newbie-Game/node_modules/playwright/index.mjs')); }

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href + '#nointro';
assert.ok(fs.existsSync(path.resolve(here, '../prototype/newbie-quest-demo.html')));

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

const PROFILE = { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 };

async function open(profile = PROFILE) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.LIFE_EV && typeof window.lifeEvPick === 'function');
  await page.evaluate((p) => {
    Object.assign(S, p);
    S.onboarded = true; S.demo = false; S.demoDone = 1;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.todayQ = pickDaily(); save(); render('home');
  }, profile);
  return { ctx, page, errors };
}

test('1. 이벤트는 30개 이상, id는 겹치지 않고 모든 선택지에 결과 문장이 있다', async () => {
  const { ctx, page, errors } = await open();
  const r = await page.evaluate(() => {
    const ids = LIFE_EV.map((e) => e.id);
    const bad = [];
    LIFE_EV.forEach((e) => {
      if (!e.who || !e.text || !e.tip) bad.push(e.id + ': who/text/tip 누락');
      if (!Array.isArray(e.choices) || e.choices.length < 2 || e.choices.length > 3) bad.push(e.id + ': 선택지 수');
      (e.choices || []).forEach((c, i) => {
        if (!c.t) bad.push(e.id + '#' + i + ': 선택지 문구 없음');
        if (!c.msg || !String(c.msg).trim()) bad.push(e.id + '#' + i + ': msg 없음');
        if (!c.d || typeof c.d !== 'object') bad.push(e.id + '#' + i + ': d 없음');
      });
      if (e.months && !(Array.isArray(e.months) && e.months.every((m) => Number.isInteger(m) && m >= 1 && m <= 12))) bad.push(e.id + ': months 형식');
      // 이모지 금지
      const all = [e.who, e.text, e.tip].concat((e.choices || []).flatMap((c) => [c.t, c.msg])).join('');
      if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all)) bad.push(e.id + ': 이모지');
    });
    return { n: LIFE_EV.length, uniq: new Set(ids).size, bad, seasonal: LIFE_EV.filter((e) => e.months).length };
  });
  assert.ok(r.n >= 30, '이벤트 수 ' + r.n);
  assert.equal(r.uniq, r.n, 'id 중복 없음');
  assert.deepEqual(r.bad, []);
  assert.ok(r.seasonal >= 6, '계절 이벤트 ' + r.seasonal + '개');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('2. 월 필터: 철이 아닌 계절 이벤트는 절대 안 나오고, 제철 이벤트는 더 자주 나온다', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => { S.tier = 7; S.lv = 5; });  // 거처·레벨 조건이 있는 이벤트도 풀에 들어오게
  const r = await page.evaluate(() => {
    const out = {};
    for (let m = 1; m <= 12; m++) {
      const seen = {}; let inSeason = 0, total = 0, leaked = [];
      for (let i = 0; i < 400; i++) {
        S.evSeen = [];
        const e = lifeEvPick(m);
        if (!e) continue;
        total++;
        seen[e.id] = 1;
        if (e.months) { if (e.months.indexOf(m) < 0) leaked.push(e.id); else inSeason++; }
      }
      out[m] = { leaked, inSeason, total, seasonalPool: LIFE_EV.filter((e) => e.months && e.months.indexOf(m) >= 0 && (!e.when || e.when())).length };
    }
    // 이번 달 인자를 안 주면 게임 시계의 월을 쓴다
    out.auto = { month: lifeEvMonth(), now: +dayKey().slice(5, 7) };
    // 다 본 뒤 초기화돼도 필터가 유지된다
    S.evSeen = LIFE_EV.map((e) => e.id);
    const e7 = lifeEvPick(7);
    out.reset = { id: e7 && e7.id, ok: !!e7 && (!e7.months || e7.months.indexOf(7) >= 0) };
    return out;
  });
  for (let m = 1; m <= 12; m++) {
    assert.deepEqual(r[m].leaked, [], m + '월에 철 아닌 이벤트가 나왔다');
    assert.ok(r[m].total > 300, m + '월 뽑기 성공');
  }
  // 8월: 에어컨/이사 이벤트가 나오고, 12월엔 나오지 않는다
  const only = await page.evaluate(() => ({
    aug: (() => { const s = {}; for (let i = 0; i < 600; i++) { S.evSeen = []; const e = lifeEvPick(8); s[e.id] = 1; } return Object.keys(s); })(),
    dec: (() => { const s = {}; for (let i = 0; i < 600; i++) { S.evSeen = []; const e = lifeEvPick(12); s[e.id] = 1; } return Object.keys(s); })(),
    jan: (() => { const s = {}; for (let i = 0; i < 600; i++) { S.evSeen = []; const e = lifeEvPick(1); s[e.id] = 1; } return Object.keys(s); })(),
  }));
  assert.ok(only.aug.includes('ev_aircon'), '8월 에어컨 전기료');
  assert.ok(only.aug.includes('ev_mover'), '8월 이사철');
  assert.ok(!only.dec.includes('ev_aircon') && !only.dec.includes('ev_yearend') && !only.dec.includes('ev_gym'), '12월엔 철 지난 이벤트 없음');
  assert.ok(only.jan.includes('ev_yearend') && only.jan.includes('ev_holidaysmish'), '1월 연말정산과 명절 스미싱');
  assert.ok(!only.jan.includes('ev_aircon'), '1월엔 에어컨 없음');
  // 7월에는 제철 풀이 있으니 가중치로 비율이 균등 추첨보다 높아야 한다
  const m7 = r[7];
  const base = m7.seasonalPool / (await page.evaluate(() => LIFE_EV.filter((e) => (!e.months || e.months.indexOf(7) >= 0) && (!e.when || e.when())).length));
  assert.ok(m7.inSeason / m7.total > base, '제철 이벤트 비율 ' + (m7.inSeason / m7.total).toFixed(2) + ' > 균등 ' + base.toFixed(2));
  assert.equal(r.auto.month, r.auto.now);
  assert.ok(r.reset.ok, '전부 본 뒤 초기화돼도 월 필터 유지');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('3. maybeLifeEvent(true)는 대화창을 열고, 선택하면 결과와 할배 설명이 나온다', async () => {
  const { ctx, page, errors } = await open();
  const r = await page.evaluate(() => {
    ME.map = 'town'; S.evN = 0; S.evDay = dayKey();
    maybeLifeEvent(true, 8);
    const opened = !!TUT && /^생활 이벤트 · /.test(TUT.name);
    const q = TUT && TUT.lines.find((l) => l && typeof l === 'object' && l.choose);
    let res = null;
    if (q) res = q.choose(0);
    return { opened, hasQ: !!q, res, seenLen: S.evSeen.length, evN: S.evN };
  });
  assert.ok(r.opened, '생활 이벤트 대화가 열림');
  assert.ok(r.hasQ, '선택지 질문이 있음');
  assert.ok(Array.isArray(r.res) && r.res.length === 2 && /^귀인 할배: "/.test(r.res[1]), '결과 문장과 할배 팁');
  assert.equal(r.evN, 1);
  assert.ok(r.seenLen >= 1);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('4. 30개 이상 이벤트의 모든 선택지를 실제로 눌러도 오류가 없다', async () => {
  const { ctx, page, errors } = await open();
  const r = await page.evaluate(() => {
    let n = 0;
    LIFE_EV.forEach((e) => {
      e.choices.forEach((c, k) => {
        ME.map = 'town'; TUT = null; S.evN = 0; S.evDay = dayKey(); S.evSeen = LIFE_EV.filter((x) => x.id !== e.id).map((x) => x.id);
        S.tier = 7; S.lv = 5; S.status = e.id === 'ev_noinsalba' || e.id === 'ev_trainee' ? '대학생' : '직장인';
        const month = e.months ? e.months[0] : 5;
        maybeLifeEvent(true, month);
        if (!TUT || TUT.name.indexOf(e.who) < 0) throw new Error(e.id + ' 이벤트가 열리지 않음');
        const q = TUT.lines.find((l) => l && typeof l === 'object' && l.choose);
        const res = q.choose(k);
        if (!res[0] || !res[1]) throw new Error(e.id + ' 결과 없음');
        TUT = null; n++;
      });
    });
    return n;
  });
  assert.ok(r >= 60, '선택지 ' + r + '개 실행');
  assert.deepEqual(errors, []);
  await ctx.close();
});
