// 스프린트 C3: QA 마무리. 보스전(승/패), 고속도로 왕복, 이사 정리 도중 새로고침, 콘솔 경고 0.
// 게임 HTML을 file:// 로 열고(#nointro) 실제 키 입력·버튼으로 확인한다.
// 실행: node --test tests/sprintC3.test.mjs   (PLAYWRIGHT_BROWSERS_PATH 가 없으면 /opt/pw-browsers 를 쓴다)
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { reloadSaved } from './storage.mjs';

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

/** 새 컨텍스트에서 게임을 열고, 온보딩을 마친 직장인 상태로 만든다. logs 에는 콘솔 오류·경고·페이지 오류를 모은다 */
async function open({ w = 390, h = 844, boot = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS && typeof window.showAd === 'function', null, { polling: 100 });
  if (boot) await page.evaluate((p) => {
    Object.assign(S, p);
    S.onboarded = true; S.demo = false; S.demoDone = 1;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.todayQ = pickDaily(); save(); render('home');
  }, PROFILE);
  return { ctx, page, logs };
}
const sleep = (page, ms) => page.waitForTimeout(ms);
/** file:// 저장소는 쓴 직후 바로 새로고침하면 못 읽는 일이 있어 잠깐 기다린다 */
async function reload(page) { await reloadSaved(page); await sleep(page, 1200); }
const snap = (page) => page.evaluate(() => ({ coin: S.coin, peak: S.peak, tier: S.tier, paid: S.paid, ju: S.stats.ju, bd: S.bossDone.slice(),
  scr: document.querySelector('.screen.on').id, map: ME.map, tx: ME.tx, ty: ME.ty, onFoot: S.onFoot, redec: S.redecorate }));

/** 은행 골목 보스 앞에 서서 스페이스로 붙는다. 보스 화면과 첫 대사가 뜰 때까지 기다린다 */
async function faceBoss(page) {
  await page.evaluate(() => { S.full = 100; S.energy = 100; enterMap('bank', 16, 6); ME.dir = 3; });
  await sleep(page, 300);
  await page.keyboard.press(' ');
  await page.waitForFunction(() => document.getElementById('boss').classList.contains('on'), null, { timeout: 8000, polling: 100 });
  await page.waitForFunction(() => !document.getElementById('bnext').hidden, null, { timeout: 8000, polling: 100 });
  await page.click('#bnext');
}
/** 실제 보기 버튼으로 싸운다. win 이면 정답만, 아니면 오답만 고른다. 결과 화면까지 간다 */
async function fight(page, win) {
  for (let i = 0; i < 12; i++) {
    await page.waitForSelector('#bchoices:not([hidden]) .choice:not([disabled])', { timeout: 8000 });
    const ok = await page.evaluate(() => FIGHT.b.qs[FIGHT.i].ok);
    const n = await page.evaluate(() => FIGHT.b.qs[FIGHT.i].a.length);
    await page.click(`#bchoices .choice[data-orig="${win ? ok : (ok + 1) % n}"]`);
    await sleep(page, 200);
    const label = await page.textContent('#bnext');
    await page.click('#bnext');
    if (label === '결과' || label === '마무리') break;
  }
  await page.waitForSelector('#bossend.on', { timeout: 5000 });
}

test('1. 보스전 승리: 화면, 체력, 보상, 거처 해금과 보증금은 한 번만', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.stats.ju = 40; S.peak = 3; S.tier = 3; S.paid = 3; S.lastTier = 3; S.coin = 500; S.lv = 5; save(); });
  const before = await snap(page);
  await faceBoss(page);
  const ui = await page.evaluate(() => ({ boss: document.getElementById('bbossname').textContent, me: document.getElementById('bmehp').textContent,
    hp: document.getElementById('bbosshp').textContent, full: S.full, en: S.energy }));
  assert.equal(ui.boss, '전세 먹튀 집주인');
  assert.match(ui.me, /^\d+ \/ \d+$/);
  assert.ok(ui.full < 100 && ui.en < 100, '보스에게 붙으면 포만감과 체력이 든다');
  await fight(page, true);
  assert.equal(await page.textContent('#bebig'), '보스 격파');
  const body = await page.innerText('#bebody');
  assert.match(body, /해금/);
  assert.match(body, /입주 보증금 ￦50을 내고 옮겼습니다/, '새 거처 보증금이 결과 화면에 보인다');
  const after = await snap(page);
  assert.deepEqual(after.bd, ['jeonse']);
  assert.equal(after.peak, before.peak + 1);
  assert.equal(after.tier, after.peak, '거처를 옮겼다');
  assert.equal(after.paid, after.peak);
  assert.equal(after.ju, before.ju + 15, '주 스탯 +15');
  assert.equal(after.coin, before.coin + 200 - 50, '상금 200, 보증금 50(140-90)만 낸다');
  await page.click('#beback');
  await page.waitForFunction(() => document.getElementById('home').classList.contains('on'), null, { polling: 100 });
  assert.deepEqual(logs, [], '콘솔 오류·경고 없음');
  await ctx.close();
});

test('2. 보스전 패배: 거처가 한 칸 내려가도 보증금은 다시 걷지 않고, 되찾을 때도 무료', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.stats.ju = 40; S.peak = 3; S.tier = 3; S.paid = 3; S.lastTier = 3; S.coin = 500; S.lv = 5; save(); });
  const before = await snap(page);
  await faceBoss(page);
  await fight(page, false);
  assert.equal(await page.textContent('#bebig'), '당했다');
  assert.match(await page.innerText('#bebody'), /→/, '내려간 거처가 이전 → 이후로 표시된다');
  const lost = await snap(page);
  assert.equal(lost.peak, before.peak - 1);
  assert.equal(lost.tier, before.tier - 1, '사는 곳도 함께 내려간다');
  assert.equal(lost.coin, before.coin, '코인은 그대로');
  assert.equal(lost.paid, before.paid, '낸 보증금 기록은 그대로');
  assert.deepEqual(lost.bd, [], '졌으니 격파 기록 없음');
  await page.click('#beback');
  await page.waitForFunction(() => document.getElementById('home').classList.contains('on'), null, { polling: 100 });
  // 되찾을 때(스탯이 충분하면 다음 퀘스트·하루에 다시 열림) 이미 낸 곳은 무료다
  const regain = await page.evaluate(() => { const c = S.coin; const g = tierGrow(); const mv = g && g.wasTop ? tierMove(S.peak) : null;
    return { grew: !!g, cost: mv && mv.cost, ok: mv && mv.ok, coin: S.coin - c, tier: S.tier, peak: S.peak }; });
  assert.deepEqual(regain, { grew: true, cost: 0, ok: 1, coin: 0, tier: 3, peak: 3 });
  // 한 번 더 지면 (다시 3에서) 또 한 칸만 내려가고 코인은 그대로
  await page.evaluate(() => { S.bossDone = []; S.full = 100; S.energy = 100; save(); });
  await faceBoss(page);
  await fight(page, false);
  const again = await snap(page);
  assert.equal(again.peak, 2);
  assert.equal(again.coin, before.coin);
  assert.deepEqual(logs, [], '콘솔 오류·경고 없음');
  await ctx.close();
});

test('3. 보스전 도중 새로고침: 화면이 깨지지 않고 다시 붙을 수 있으며 안내가 뜬다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.stats.ju = 40; S.peak = 3; S.tier = 3; S.paid = 3; S.lastTier = 3; S.coin = 500; save(); });
  await faceBoss(page);
  await page.waitForSelector('#bchoices:not([hidden]) .choice');
  await page.click('#bchoices .choice');            // 한 문항 답하고
  await reload(page);
  const r = await snap(page);
  assert.equal(r.scr, 'home');
  assert.equal(r.peak, 3, '결과 없이 나가면 거처는 그대로');
  assert.equal(r.coin, 500);
  assert.match(await page.evaluate(() => document.getElementById('htoast').textContent), /싸우던 도중/);
  assert.equal(await page.evaluate(() => S.fightId), null);
  await faceBoss(page);                              // 다시 붙는다
  assert.equal(await page.evaluate(() => document.getElementById('boss').classList.contains('on')), true);
  assert.deepEqual(logs, []);
  await ctx.close();
});

for (const [w, h] of [[390, 844], [360, 640]]) {
  test(`4. 고속도로 왕복 (${w}x${h}): 입구 표지판이 길을 가리지 않고, 휴게소에서 차에 다시 타 돌아온다`, async () => {
    const { ctx, page, logs } = await open({ w, h });
    await page.evaluate(() => { S.lv = 10; S.coin = 500; if (S.owned.indexOf('car') < 0) S.owned.push('car');
      S.equip.mount = 'car'; S.onFoot = false; S.park = null; S.full = 100; S.mq.gf.car = 1;   // 고속도로는 메인 4장이 연다
      save(); enterMap('town', 5, 13); drawScene(); });
    await sleep(page, 400);
    // 표지판은 차 탄 주인공이 지나는 줄(입구 행과 그 위 한 행)보다 위에 서야 한다
    const sign = await page.evaluate(() => {
      const m = curMap(), ws = m.warps.filter((x) => x.needCar), w = ws[0];
      const rects = []; const ctx = { font: '', textBaseline: '', fillStyle: '', measureText: (t) => ({ width: t.length * 8 }), fillText() {} };
      const real = window.rcx; window.rcx = (c, col, x, y, ww, hh) => rects.push([x, y, ww, hh]);
      try { drawHighwaySigns(ctx, m); } finally { window.rcx = real; }
      const bottom = Math.max(...rects.map((r) => r[1] + r[3]));
      return { warpY: w.y, TS, signBoard: Math.min(...rects.map((r) => r[1])), poleBottom: bottom };
    });
    assert.ok(sign.signBoard + 14 <= (sign.warpY - 2) * sign.TS, `표지판(${sign.signBoard}~)이 입구 두 칸 위에 있어야 한다`);
    // 차가 한 칸 가는 동안 누른 키는 무시되니, 입구에 닿을 때까지 계속 누른다(부하가 커도 흔들리지 않게)
    for (let i = 0; i < 30; i++) {
      if (await page.evaluate(() => ME.map !== 'town' || !!DRIVE)) break;
      await page.keyboard.press('ArrowLeft'); await sleep(page, 160);
    }
    await page.waitForFunction(() => ME.map === 'rest', null, { timeout: 9000, polling: 100 });   // 달리는 화면을 지나 휴게소로
    await sleep(page, 700);
    const rest = await snap(page);
    assert.equal(rest.onFoot, true, '휴게소에서는 차를 세우고 걷는다');
    assert.equal(await page.evaluate(() => !!S.park && S.park.map === 'rest'), true);
    // 차에 말을 걸어(옆으로 밀기) 다시 타고 동네로 돌아간다
    await page.keyboard.press('ArrowLeft');
    await page.waitForSelector('#htutorop .topt', { timeout: 4000 });
    const opts = await page.$$eval('#htutorop .topt', (b) => b.map((x) => x.textContent));
    assert.ok(opts.some((t) => /동네 쪽으로 출발/.test(t)), '동네 쪽 출발 선택지가 있다');
    await page.locator('#htutorop .topt', { hasText: '동네 쪽으로 출발' }).click();
    await page.waitForFunction(() => ME.map === 'town', null, { timeout: 9000, polling: 100 });
    await sleep(page, 500);
    const back = await snap(page);
    assert.equal(back.map, 'town');
    assert.equal(back.onFoot, false, '다시 차에 탄 채로 도착');
    assert.equal(await page.evaluate(() => carOn()), true);
    assert.deepEqual(logs, [], '콘솔 오류·경고 없음');
    await ctx.close();
  });
}

test('5. 이사 정리 도중 새로고침: 배너가 다시 뜨지 않고 세간은 알아서 놓인다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.lv = 8; S.coin = 900; S.peak = 5; S.tier = 5; S.paid = 5; S.lastTier = 5;
    [['mat', 1, 1], ['fan', 4, 4], ['desk2', 3, 1]].forEach((a) => furniList().push({ id: a[0], x: a[1], y: a[2] }));
    save(); render('home'); });
  await page.evaluate(() => { S.tier = 4; S.peak = 4; render('home'); });    // 한 칸 내려앉아 방 모양이 바뀐다
  const banner = () => page.evaluate(() => !document.getElementById('hfoot').hidden && /이사했/.test(document.getElementById('htodaylab').innerText));
  assert.equal(await banner(), true, '이사 직후에는 배너가 뜬다');
  await page.locator('#htodaylab .btn').click();
  await page.waitForFunction(() => !!PLACE, null, { polling: 100 });
  assert.equal(await banner(), false, '배치 중에는 배너를 감춘다');
  await reload(page);
  assert.equal(await banner(), false, '새로고침 뒤에 배너가 다시 뜨지 않는다');
  const st = await page.evaluate(() => ({ redec: S.redecorate, placing: S.redecPlacing, place: !!PLACE,
    furni: furniList().map((o) => [o.id, o.x, o.y]) }));
  assert.equal(st.redec, 0);
  assert.equal(st.place, false);
  assert.equal(st.furni.length, 3);
  assert.ok(st.furni.every((f) => f[1] != null && f[2] != null), '세간이 창고로 사라지지 않고 자리를 받았다: ' + JSON.stringify(st.furni));
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('6. 출석 토스트는 홈의 거처 줄·배너·탭을 덮지 않는다 (360x640)', async () => {
  const { ctx, page } = await open({ w: 360, h: 640 });
  await page.evaluate(() => { S.claimed = null; S.day = null; save(); render('home'); toast('출석 1일째 · ￦30'); });
  await sleep(page, 200);
  const r = await page.evaluate(() => {
    const b = (s) => document.querySelector(s).getBoundingClientRect();
    return { toast: b('#htoast'), info: b('#home .sceneinfo'), stage: b('#home .stagebox'), tab: b('#tab-home') };
  });
  assert.ok(r.toast.bottom <= r.stage.bottom + 1, '토스트는 지도 안쪽에 뜬다');
  assert.ok(r.toast.bottom <= r.info.top + 1, '거처 줄과 겹치지 않는다');
  assert.ok(r.toast.bottom <= r.tab.top, '탭바와 겹치지 않는다');
  await ctx.close();
});

test('7. 360x640 홈: 지도가 340px 이상이고 이사 배너가 한 줄', async () => {
  const { ctx, page } = await open({ w: 360, h: 640 });
  await page.evaluate(() => { S.lv = 8; S.peak = 5; S.tier = 5; S.paid = 5; S.lastTier = 5; furniList().push({ id: 'mat', x: 1, y: 1 }); save(); render('home'); });
  await page.evaluate(() => { S.tier = 4; S.peak = 4; render('home'); });
  await sleep(page, 500);
  const r = await page.evaluate(() => {
    const b = (s) => document.querySelector(s).getBoundingClientRect();
    const lab = document.getElementById('htodaylab');
    return { scene: b('#scene'), foot: b('#hfoot'), lab: lab.getBoundingClientRect(), btn: b('#htodaylab .btn'), info: b('#home .sceneinfo'),
      doc: document.documentElement.scrollWidth, win: innerWidth };
  });
  assert.ok(r.scene.height >= 340, '지도 높이 ' + r.scene.height);
  assert.ok(r.btn.height < 50 && r.lab.height < 50, '배너가 여러 줄로 깨지지 않는다: 라벨 ' + r.lab.height);
  assert.ok(r.info.height < 46, '거처 줄이 한 줄: ' + r.info.height);
  assert.ok(r.doc <= r.win, '가로 스크롤 없음');
  await ctx.close();
});

for (const [w, h] of [[360, 640], [390, 844]]) {
  test(`8. 첫 로드에 콘솔 경고·오류가 없다 (${w}x${h})`, async () => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const logs = [];
    page.on('pageerror', (e) => logs.push('pageerror: ' + e));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
    await page.goto(GAME);                                   // 신규 유저: 온보딩 화면
    await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
    await sleep(page, 1500);
    // 온보딩을 눌러 끝까지 가고 홈에서 몇 초 둔다
    for (let i = 0; i < 12; i++) {
      if ((await page.evaluate(() => document.querySelector('.screen.on').id)) !== 'onboard') break;
      if (await page.locator('#obnext').isDisabled()) await page.locator('#obbody .opt').first().click();
      await page.locator('#obnext').click(); await sleep(page, 250);
    }
    await sleep(page, 2500);
    for (const id of ['wiki', 'char', 'shop', 'home']) { await page.evaluate((n) => render(n), id); await sleep(page, 400); }
    assert.deepEqual(logs, [], '콘솔 경고·오류 없음');
    await ctx.close();
  });
}
