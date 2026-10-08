// 리뷰 1007(여섯 명 전수 점검)에서 고친 것들의 회귀 테스트.
// 실행: node --test tests/sprintG.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href + '#nointro';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open({ w = 360, h = 640 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(() => {
    Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
    S.onboarded = true; S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    save(); render('home');
  });
  return { ctx, page, logs };
}

test('1. 지도 위 메뉴 단추로 수집 노트에 들어가고, 처음부터 다시는 확인을 거친다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.lv = 7; save(); });
  await page.click('#hmenu');
  await page.waitForFunction(() => document.getElementById('codex').classList.contains('on'));
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('#codex .devonly')].every((e) => e.hidden)), true, '개발용 칸은 숨김');
  await page.evaluate(() => document.getElementById('reset').click());
  assert.match(await page.textContent('#itipbox'), /되돌릴 수 없어요/);
  assert.equal(await page.evaluate(() => S.lv), 7, '확인 전에는 지우지 않는다');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('2. 상점 장비는 확인 창에서 사기를 눌러야 산다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    S.coin = 5000; save(); render('shop');
    const names = Object.keys(ITEMS).filter((id) => ITEMS[id].cost > 0 && !ITEMS[id].special && !S.owned.includes(id)).map((id) => ITEMS[id].name);
    const row = [...document.querySelectorAll('#shopbody .item')].find((b) => !b.disabled && names.some((n) => b.textContent.includes(n)));
    const c0 = S.coin; row.click();
    const mid = S.coin, open = !document.getElementById('itip').hidden;
    const buy = [...document.querySelectorAll('#itip button')].find((b) => /에 사서 입기/.test(b.textContent)); buy.click();
    return { c0, mid, open, after: S.coin };
  });
  assert.equal(r.mid, r.c0, '누르기만 해서는 사지 않는다');
  assert.ok(r.open);
  assert.ok(r.after < r.c0, '확인 뒤에 산다');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('3. 연속 출석 21일·30일 보상, 시간이 지나도 청결·기분은 40 아래로 안 떨어진다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    S.ms = [3, 7, 14]; S.msNew = []; S.streak = 30; const c0 = S.coin; msCheck();
    const got = S.coin - c0;
    S.clean = 90; S.mood = 90; S._cleanAt = Date.now() - 48 * 3600000; S._moodAt = Date.now() - 48 * 3600000; needTick();
    return { got, ms: S.ms.slice(), clean: S.clean, mood: S.mood };
  });
  assert.equal(r.got, 800);
  assert.ok(r.ms.includes(21) && r.ms.includes(30));
  assert.equal(r.clean, 40); assert.equal(r.mood, 40);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('4. 대학생도 첫 안내는 집 퀘스트다', async () => {
  const { ctx, page, logs } = await open();
  const t = await page.evaluate(() => {
    S = fresh(); S.status = '대학생'; applyStarter();
    Object.assign(S, { years: 0, living: '자취', region: '수도권', age: 22 });
    S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.todayQ = pickDaily(); save();
    const g = guideTarget(); return g && { theme: g.q.theme, open: qOpen(g.q) };
  });
  assert.deepEqual(t, { theme: 'ju', open: true });
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('6. 짧은 이야기 컷신: 계기에서 큐에 들고, 한가할 때 틀고, 끝나면 수집 노트에서 다시 본다', async () => {
  const { playCine } = await import('./cine.mjs');
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.first = '2020-01-01'; S.cs = { seen: {}, q: [], pay: {}, day: '', n: 0 }; });
  for (const id of ['firstq', 'home6', 'boss1', 'memory', 'back']) {
    await page.evaluate((id) => { S.cs.n = 0; csWant(id, id === 'boss1' ? 'mlm' : 4); }, id);
    assert.equal(await page.evaluate(() => csTick()), true, id + ' 재생');
    await playCine(page, [], { timeout: 20000 });
    assert.ok(await page.evaluate((id) => !!S.cs.seen[id], id));
  }
  const coin = await page.evaluate(() => S.coin);
  await page.evaluate(() => { S.cs.n = 0; csWant('firstq'); });
  assert.equal(await page.evaluate(() => S.cs.q.length), 0, '본 이야기는 다시 큐에 들지 않는다');
  await page.evaluate(() => render('codex'));
  assert.match(await page.textContent('#cmq'), /이야기 조각 5\/5/);
  assert.ok(coin > 0);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('5. 걷는 동안 저장은 멈춘 뒤 한 번만 쓴다', async () => {
  const { ctx, page, logs } = await open();
  const n = await page.evaluate(async () => {
    let k = 0; const orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (a, b) { if (a === 'nq.v8') k++; return orig(a, b); };
    for (let i = 0; i < 8; i++) { ME.tx += (i % 2 ? 1 : -1); savePos(); }
    const during = k; await new Promise((r) => setTimeout(r, 1700));
    return { during, after: k };
  });
  assert.equal(n.during, 0);
  assert.equal(n.after, 1);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('7. 밥·옷·일 스탯의 쓸모: 음식값 할인, 청결 천천히, 경험치 보너스. 캐릭터 탭에 다섯 스탯이 보인다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    S.stats.sik = 0; const p0 = foodPrice({ cost: 100 }); S.stats.sik = 100; const p1 = foodPrice({ cost: 100 });
    S.stats.ui = 100; S.stats.jik = 55;
    renderChar();
    return { p0, p1, ui: statPct('ui'), jik: statPct('jik'), rows: document.querySelectorAll('#pstats .pst').length, txt: document.getElementById('pstats').textContent };
  });
  assert.equal(r.p0, 100); assert.equal(r.p1, 80);
  assert.equal(r.ui, 30); assert.equal(r.jik, 10);
  assert.equal(r.rows, 5);
  assert.match(r.txt, /음식값 20% 할인/);
  assert.deepEqual(logs, []);
  await ctx.close();
});
