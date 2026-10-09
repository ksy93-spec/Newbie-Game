// 인생 모드(태어남 카드 → 나이 → 세월 컷신 → 예순 결산)의 회귀 테스트.
// 실행: node --test tests/sprintH.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import { playCine } from './cine.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const BASE = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href;

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  return { ctx, page, logs };
}

test('1. 약력 생성기: 같은 인생 번호는 같은 사람, 칸이 다 채워지고 수치 효과는 작다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    const a = lifeGen('v1-K7Q2MX'), b = lifeGen('v1-K7Q2MX'), out = [];
    for (let i = 0; i < 300; i++) { const p = lifeGen(lifeSeedNew()); const fx = lifeFx(p); out.push({ p, fx }); }
    const keys = ['name', 'birth', 'tti', 'zodiac', 'sido', 'sgg', 'dong', 'hs', 'mbti', 'blood', 'food', 'hobby', 'habit', 'phone', 'firstJob', 'say', 'intro', 'hero', 'living', 'income', 'path'];
    return { same: JSON.stringify(a) === JSON.stringify(b),
      missing: out.filter((o) => keys.some((k) => !o.p[k])).length,
      coin: [Math.min(...out.map((o) => o.fx.coin)), Math.max(...out.map((o) => o.fx.coin))],
      statMax: Math.max(...out.map((o) => Object.values(o.fx.stat).reduce((x, y) => x + y, 0))),
      cap: out.filter((o) => o.p.band === '수도권').length / 300, heroOk: out.every((o) => HEROMAP[o.p.hero]) };
  });
  assert.ok(r.same, '같은 번호 같은 사람');
  assert.equal(r.missing, 0);
  assert.ok(r.coin[0] >= 50 && r.coin[1] <= 400, JSON.stringify(r.coin));
  assert.ok(r.statMax <= 26, '스탯 머리 출발 ' + r.statMax);   // 지방 출신 집 +10 보정 포함
  assert.ok(r.cap > 0.35 && r.cap < 0.65, '수도권 비율 ' + r.cap);
  assert.ok(r.heroOk);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('2. 인생 모드 한 판: 카드 삼세판 → 태어남 → 나이 → 세월 → 예순 결산 → 앨범, 일반 저장은 그대로', async () => {
  const { ctx, page, logs } = await open();
  // 일반 모드 기록을 하나 만들어 둔다
  await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.lv = 7; save(); });
  await page.evaluate(() => { lifeNew(); obStep = 0; stopWalk(); obRender(); go('onboard'); });
  assert.match(await page.textContent('#obbody'), /인생 번호 v1-/);
  for (let i = 0; i < 2; i++) await page.click('#obbody button:has-text("다시 태어나기")');
  assert.equal(await page.evaluate(() => S.life.rolls), 3);
  assert.equal(await page.locator('#obbody button:has-text("마지막 카드")').isDisabled(), true);
  await page.click('#obnext');                        // 이 인생으로 살기 → 바로 시작(겉모습은 카드가 정한다)
  await playCine(page, [], { timeout: 30000 });       // 태어남 컷신
  const h = await page.evaluate(() => ({ hud: document.getElementById('hnm').textContent, mode: S.mode, coin: S.coin, slot: SLOT }));
  assert.match(h.hud, /20살/);
  assert.equal(h.mode, 'life');
  // 퀘스트 여섯 개면 두 살
  await page.evaluate(() => { S.done.push('x1', 'x2', 'x3', 'x4', 'x5', 'x6'); hudRefresh(); });
  assert.equal(await page.evaluate(() => S.life.age), 22);
  // 1장 앞 세월 컷신과 나이 24
  await page.evaluate(() => { lifeBeforeCh('job', function () { window.__goJob = 1; }); });
  await playCine(page, [], { timeout: 20000 });
  assert.equal(await page.evaluate(() => S.life.age), 24);
  // 하루 제한이 없다
  assert.equal(await page.evaluate(() => mqDay('lease') && upLeft() > 1), true);
  // 메인을 다 마쳤다고 치고 예순으로
  await page.evaluate(() => { MQ_LIST.forEach((c) => { S.mq.done[c.id] = 'good'; }); S.tier = S.peak = 9; save(); lifeEnd(); });
  await playCine(page, [], { timeout: 30000 });
  await page.waitForSelector('#itip:not([hidden]) .lcard');
  assert.match(await page.textContent('#itipbox'), /인생 결산/);
  await page.click('#itipbox button:has-text("계속")');
  await playCine(page, [], { timeout: 30000 });
  await page.waitForSelector('#itipbox button:has-text("다시 태어나기")');
  const end = await page.evaluate(() => ({ over: S.life.over, album: albumLoad().length, title: albumLoad()[0].titleName, normal: JSON.parse(localStorage.getItem('nq.v8')).lv }));
  assert.equal(end.over, true);
  assert.equal(end.album, 1);
  assert.ok(end.title);
  assert.equal(end.normal, 7, '일반 모드 기록은 그대로');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('3. 거처가 카드와 맞는다: 본가는 본가 방, 기숙사는 기숙사, 노숙·움막으로 저절로 옮기지 않는다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    const out = {};
    const find = (want) => { for (let i = 0; i < 3000; i++) { const p = lifeGen(lifeSeedNew()); if (want(p)) return p; } return null; };
    for (const [k, want] of [['home', (p) => p.living === '본가'], ['dorm', (p) => p.living === '기숙사'], ['solo', (p) => p.living === '자취' && p.income !== '넉넉']]) {
      lifeNew(); const p = find(want); S.life.prof = p; S.life.seed = p.seed; birthApply();
      S.onboarded = true; S.stats.ju = 30; const g = tierGrow(); render('home');
      out[k] = { tier: S.tier, peak: S.peak, name: TIERS[S.tier].name, moved: !!(g && g.wasTop), room: !!ROOMSPEC[S.tier], htier: document.getElementById('htier').textContent };
    }
    switchSlot('normal'); out.normal0 = TIERS[0].name;
    return out; });
  assert.equal(r.home.name, '본가 방'); assert.equal(r.home.tier, 0); assert.equal(r.home.moved, false); assert.ok(r.home.peak >= 4, '본가에서 다음 칸은 고시원부터(움막·텐트·찜질방 건너뜀) ' + r.home.peak);
  assert.ok(r.home.room); assert.match(r.home.htier, /본가 방/);
  assert.equal(r.dorm.name, '기숙사'); assert.equal(r.dorm.moved, false);
  assert.equal(r.solo.name, '고시원');
  assert.equal(r.normal0, '노숙', '일반 모드 이름은 그대로');
  assert.deepEqual(logs, []);
  await ctx.close();
});

for (const [w, h] of [[360, 640], [390, 844]]) {
  test(`4. 처음 켠 사람(${w}x${h}): 인생 모드를 고르면 "이 인생으로 살기" 버튼이 화면 안에 있고 눌린다`, async () => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage(); const logs = [];
    page.on('pageerror', (e) => logs.push('pageerror: ' + e));
    await page.goto(BASE);
    await page.waitForSelector('#opening .omb[data-k="life"]', { timeout: 10000 });
    await page.click('#opening .omb[data-k="life"]');
    await page.waitForFunction(() => !document.getElementById('opening') && document.getElementById('onboard').classList.contains('on'), null, { timeout: 8000 });
    const hit = await page.evaluate(() => { const b = document.getElementById('obnext').getBoundingClientRect();
      const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return { inView: b.bottom <= innerHeight && b.top >= 0, top: e && e.id }; });
    assert.ok(hit.inView, '버튼이 화면 안');
    assert.equal(hit.top, 'obnext', '버튼 위를 덮은 것이 없다');
    await page.click('#obnext');
    await page.waitForFunction(() => S.onboarded && S.life.applied, null, { timeout: 5000 });
    assert.deepEqual(logs, []);
    await ctx.close();
  });
}

test('5. 깨진·옛 인생 저장이 남아 있어도 시작 화면이 비지 않고 다음 버튼이 눌린다', async () => {
  const cases = [
    { 'nq.slot': 'life', 'nq.life.v1': JSON.stringify({ mode: 'life', onboarded: false, life: { v: 1, rolls: 3, prof: null, prev: [], anch: { age: 20, done: 0 }, yrs: {} } }) },
    { 'nq.slot': 'life', 'nq.life.v1': JSON.stringify({ mode: 'life', onboarded: false, life: null }) },
    { 'nq.slot': 'life', 'nq.life.v1': JSON.stringify({ mode: 'normal', onboarded: false }) },
  ];
  for (const ls of cases) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const page = await ctx.newPage(); const logs = [];
    page.on('pageerror', (e) => logs.push('pageerror: ' + e));
    await page.addInitScript((ls) => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); for (const k in ls) localStorage.setItem(k, ls[k]); } }, ls);
    await page.goto(BASE + '#nointro');
    await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
    const r = await page.evaluate(() => ({ body: document.getElementById('obbody').textContent, dis: document.getElementById('obnext').disabled }));
    assert.match(r.body, /카드 한 장/);
    assert.equal(r.dis, false);
    await page.click('#obnext');
    await page.waitForFunction(() => S.onboarded, null, { timeout: 5000 });
    assert.deepEqual(logs, []);
    await ctx.close();
  }
});

test('6. 리뷰 1009 개발: 건너뛴 거처는 못 고르고, HUD 글자는 상태를 안 바꾸고, 6장 뒤 닫혀도 결산이 온다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    lifeNew(); let p; for (let i = 0; i < 3000; i++) { p = lifeGen(lifeSeedNew()); if (p.living === '본가') break; }
    S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.stats.ju = 30; S.coin = 500; tierGrow(); save();
    const skip = [0, 1, 2, 3].filter(lifeSkip), mv = tierMove(1).ok;
    S.done.push('a', 'b', 'c'); const before = localStorage.getItem('nq.life.v1'); hudName(); const same = before === localStorage.getItem('nq.life.v1');
    MQ_LIST.forEach((c) => { S.mq.done[c.id] = 'good'; }); save();
    return { skip, mv, same, normalName: tierNameOf({ mode: 'normal' }, 0), homeName: tierNameOf(S, 0) }; });
  assert.deepEqual(r.skip, [1, 2, 3]);
  assert.equal(r.mv, 0);
  assert.ok(r.same, 'hudName은 저장을 안 바꾼다');
  assert.equal(r.normalName, '노숙'); assert.equal(r.homeName, '본가 방');
  await page.reload(); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.waitForFunction(() => { if (TUT) endTalk(); return window.MQP || (S.life && S.life.over); }, null, { timeout: 20000, polling: 200 });
  assert.equal(await page.evaluate(() => S.life.over), true);
  assert.deepEqual(logs, []);
  await ctx.close();
});
