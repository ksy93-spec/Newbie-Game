// 스프린트 C2: 첫 3분(첫 상담 안내 · 첫 이사 연출), 하루의 끝 시트, 시즌 칩, 공유 문구·링크.
// 게임 HTML을 file:// 로 열고(#nointro) 실제 화면 버튼을 눌러 확인한다.
// 실행: node --test tests/sprintC2.test.mjs   (PLAYWRIGHT_BROWSERS_PATH 가 없으면 /opt/pw-browsers 를 쓴다)
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
const noErrors = (errors) => assert.deepEqual(errors, [], '콘솔 오류 없음');
const st = (page, fn, arg) => page.evaluate(fn, arg);

/** 새 컨텍스트에서 게임을 연다. fixedDate 가 있으면 그 시각(ISO)으로 Date.now 를 고정한다. */
async function open({ boot = false, profile = PROFILE, fixedDate = null, reduced = false, viewport = { width: 390, height: 844 } } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript((fixed) => {
    try { localStorage.clear(); } catch (e) {}
    if (fixed) { const t0 = Date.parse(fixed), p0 = performance.now(); Date.now = () => t0 + Math.round(performance.now() - p0); }
  }, fixedDate);
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS && typeof window.showAd === 'function');
  await page.evaluate(() => { window.showAd = (cb) => cb(); });
  if (boot) await bootState(page, profile);
  return { ctx, page, errors };
}
/** 온보딩과 튜토리얼을 마친 상태 (퀘스트는 0개) */
async function bootState(page, profile) {
  await page.evaluate((p) => {
    Object.assign(S, p);
    S.onboarded = true; S.demo = false; S.demoDone = 1;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.todayQ = pickDaily(); save(); render('home');
  }, profile);
}
/** 퀘스트 하나를 실제 함수로 풀고 결과 화면까지 간다. right 는 맞힐 문항 수(앞에서부터) */
async function playQuest(page, id, right = 3) {
  await page.evaluate((id) => { S.full = fullMax(); S.energy = 100; S.mood = 100; S.clean = 100; startQuest(QMAP[id]); }, id);
  await page.waitForFunction(() => document.getElementById('quest').classList.contains('on'));
  return page.evaluate((right) => {
    const q = RUN.q;
    for (let i = 0; i < q.qs.length; i++) {
      RUN.i = i; const it = q.qs[i];
      answer(i < right ? it.ok : (it.ok + 1) % it.a.length, null);
      if (RUN.hearts <= 0) { finish(true); return 'failed'; }
    }
    finish(false); return 'ok';
  }, right);
}
const sheetText = (page) => page.evaluate(() => document.getElementById('itipbox').innerText);
const sheetOpen = (page) => page.evaluate(() => !document.getElementById('itip').hidden);

test('1. 새 사용자: 온보딩 → 첫 상담 표시 → 첫 퀘스트 → 첫 보상과 첫 이사가 3분(약 40탭) 안에 온다', async () => {
  const { ctx, page, errors } = await open({ reduced: true });
  let taps = 0;
  const tap = async (loc) => { taps++; await loc.click(); };

  // 온보딩: 신분 · 연차 · 권역을 고르고 시작하기
  await page.waitForSelector('#onboard.on #obbody .opt');
  await tap(page.locator('#obbody .opt', { hasText: '일하는 중' }));
  await tap(page.locator('#obnext'));
  await tap(page.locator('#obbody .opt', { hasText: '1년 미만' }));
  await tap(page.locator('#obnext'));
  await tap(page.locator('#obbody .opt', { hasText: '수도권' }));
  await tap(page.locator('#obnext'));
  await page.waitForSelector('#obbody .opt canvas');                 // 아바타 고르기
  await tap(page.locator('#obnext'));
  assert.equal(await st(page, () => S.onboarded), true);

  // 부동산 사장의 첫 대사를 눌러 넘긴다
  await page.waitForSelector('#htutor:not([hidden])');
  while (await st(page, () => !document.getElementById('htutor').hidden)) await tap(page.locator('#htutor'));
  assert.ok(await st(page, () => S.tuts.includes('intro')));

  // 첫 상담 안내가 뜬다: 칩 + 동네 지도 위 표시
  await page.waitForSelector('#hguide:not([hidden])');
  const chip = await page.locator('#hguide').innerText();
  assert.match(chip, /여기서 첫 상담/);
  assert.match(chip, /부동산/);
  const g = await st(page, () => { const t = guideTarget(); return { q: t.q.id, map: t.map, door: t.warp && [t.warp.x, t.warp.y], here: ME.map }; });
  assert.equal(g.q, 'ju1');
  assert.equal(g.map, 'town_estate');
  assert.deepEqual(g.door, [19, 2]);
  assert.equal(g.here, 'town');
  // 칩이 십자키·지도 버튼을 가리지 않는다
  const box = async (sel) => page.locator(sel).boundingBox();
  const bg = await box('#hguide'), bd = await box('#hdpad'), bm = await box('#hmini');
  assert.ok(bg.x >= bd.x + bd.width, '십자키와 겹치지 않는다');
  assert.ok(bg.x + bg.width <= bm.x, '지도 버튼과 겹치지 않는다');
  // 문 앞 표시가 그려진다 (그리는 함수가 예외 없이 지나간다)
  await page.evaluate(() => { for (let i = 0; i < 8; i++) { TICK += 4; drawScene(); } });

  // 칩을 한 번 누르면 알아서 걷는다: 문 → 건물 → 창구 → 상담 시작
  await tap(page.locator('#hguide'));
  await page.waitForFunction(() => document.getElementById('quest').classList.contains('on') && !!window.RUN, null, { timeout: 40000 });
  assert.equal(await st(page, () => RUN.q.id), 'ju1');
  assert.equal(await st(page, () => ME.map), 'town_estate');

  // 퀘스트 풀이: 들어보기 → (정답 고르기 → 다음) × 3
  await page.waitForSelector('#qnext:not([hidden])');
  await tap(page.locator('#qnext'));
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector('#qchoices:not([hidden]) .choice:not([disabled])');
    const ok = await st(page, () => RUN.q.qs[RUN.i].ok);
    await tap(page.locator(`#qchoices .choice[data-orig="${ok}"]`));
    await page.waitForSelector('#qnext:not([hidden])');
    await tap(page.locator('#qnext'));
  }
  await page.waitForFunction(() => document.getElementById('result').classList.contains('on'));
  const firstRewardTaps = taps;

  const r = await st(page, () => ({ done: S.done.slice(), tier: S.tier, peak: S.peak, coin: S.coin, paid: S.paid, mv: S.mvSeen,
    banner: (document.getElementById('mvbanner') || {}).innerText || '' }));
  assert.deepEqual(r.done, ['ju1']);
  assert.equal(r.peak, 1);
  assert.equal(r.tier, 1, '첫 퀘스트를 끝내면 움막으로 옮겨져 있다');
  assert.ok(r.coin >= 0, '코인이 음수가 아니다');
  assert.equal(r.paid, 1);
  assert.ok(r.mv);
  await page.waitForSelector('#mvbanner');
  assert.match(await page.locator('#mvbanner').innerText(), /노숙 → 움막/);
  assert.match(await page.locator('#rupgrade').innerText(), /움막/);

  // 돌아가면 안내는 사라진다
  await tap(page.locator('#rback'));
  await page.waitForFunction(() => document.getElementById('home').classList.contains('on'));
  await page.waitForFunction(() => { const g = document.getElementById('hguide'); return g.hidden || /다음 퀘스트/.test(g.textContent); });   // 첫 상담 안내는 끝나고, 다음 퀘스트 안내로 바뀐다
  // 3분: 탭당 평균 4초로 잡아도 첫 보상까지 180초 안. 온보딩 7 + 대사 4 + 칩 1 + 퀘스트 7 + 결과 1
  console.log(`[C2] 첫 보상까지 ${firstRewardTaps}탭 (탭당 4초 가정 ${firstRewardTaps * 4}초), 돌아가기까지 ${taps}탭`);
  assert.ok(firstRewardTaps <= 40, `첫 보상까지 ${firstRewardTaps}탭`);
  assert.ok(firstRewardTaps * 4 <= 180);
  noErrors(errors); await ctx.close();
});

test('2. 첫 퀘스트는 가장 나쁘게 통과해도(1/3) 코인이 0이어도 첫 이사가 된다', async () => {
  const { ctx, page, errors } = await open({ boot: true, profile: { ...PROFILE, years: 0 } });
  await page.evaluate(() => { S.coin = 0; save(); });
  const res = await playQuest(page, 'ju1', 1);
  assert.equal(res, 'ok');
  const r = await st(page, () => ({ tier: S.tier, coin: S.coin, ju: S.stats.ju }));
  assert.equal(r.tier, 1);
  assert.ok(r.coin >= 0 && r.coin < 47, '보상에서 보증금 20을 낸 나머지');
  await page.waitForSelector('#mvbanner');
  // 보증금이 모자라면 옮기지 않고 배너도 띄우지 않는다 (이미 본 사람 · 코인 없음)
  const { ctx: c2, page: p2, errors: e2 } = await open({ boot: true });
  await p2.evaluate(() => { S.coin = 0; save(); });
  assert.equal(await playQuest(p2, 'ju1', 0), 'failed');   // 전부 틀림: 실패, 보상 없음
  assert.equal(await st(p2, () => S.tier), 0);
  assert.equal(await p2.locator('#mvbanner').count(), 0);
  noErrors(errors); noErrors(e2); await ctx.close(); await c2.close();
});

test('3. 하루의 끝: 새 퀘스트를 다 풀면 "오늘 몫 끝"이 딱 한 번 뜬다', async () => {
  const { ctx, page, errors } = await open({ boot: true });
  const n = await st(page, () => openLeft());
  assert.equal(n, 5);
  for (let i = 0; i < n; i++) {
    const id = await st(page, () => QUESTS.find((q) => !q.trip && fits(q) && !S.done.includes(q.id) && qOpen(q)).id);
    assert.equal(await playQuest(page, id), 'ok');
    if (i < n - 1) assert.equal(await sheetOpen(page), false);
  }
  assert.equal(await st(page, () => openLeft()), 0);
  assert.equal(await sheetOpen(page), false, '결과 화면에서는 아직 안 뜬다');
  await page.click('#rback');
  await page.waitForSelector('#itip:not([hidden])');
  const t = await sheetText(page);
  assert.match(t, /오늘 몫 끝/);
  assert.match(t, /내일 새 퀘스트 3개가 열려요/);
  assert.match(t, /남은 일/);
  assert.match(t, /복습 퀴즈/);
  assert.match(t, /출석 광고/);
  assert.ok(await page.locator('#itipbox .ibtns button', { hasText: '오늘의 복습 퀴즈' }).count(), '복습 퀴즈 버튼');
  assert.ok(await page.locator('#itipbox .ibtns button', { hasText: '출석 보너스' }).count(), '출석 광고 버튼');
  // 한 번만: 닫고 홈을 다시 그려도, 다시 돌아가기를 눌러도 안 뜬다
  await page.evaluate(() => closeTip());
  await page.evaluate(() => { render('home'); render('home'); });
  await page.waitForTimeout(1600);
  assert.equal(await sheetOpen(page), false);
  assert.equal(await st(page, () => eodMaybe()), false);
  await page.evaluate(() => { go('result'); });
  await page.click('#rback');
  await page.waitForTimeout(1300);
  assert.equal(await sheetOpen(page), false, '같은 날 두 번 뜨지 않는다');
  // 다음 날 새 퀘스트가 열리면 조건이 아니다
  await page.evaluate(() => __shiftDay(1));
  assert.ok(await st(page, () => openLeft()) > 0);
  noErrors(errors); await ctx.close();
});

test('4. 하루의 끝: 아직 풀 퀘스트가 남았으면 안 뜬다', async () => {
  const { ctx, page, errors } = await open({ boot: true });
  await playQuest(page, 'ju1');
  await page.click('#rback');
  await page.waitForTimeout(1500);
  assert.equal(await sheetOpen(page), false);
  noErrors(errors); await ctx.close();
});

test('5. 시즌 칩: 달에 맞는 체크리스트 하나만, 눌러서 열고 오늘은 숨길 수 있다', async () => {
  const cases = [
    { date: '2026-02-15T03:00:00Z', profile: PROFILE, label: '이사철', chip: '전세 체크리스트', title: '전세·월세 계약' },
    { date: '2026-01-20T03:00:00Z', profile: PROFILE, label: '연말정산', chip: '공제 체크리스트', title: '연말정산' },
    { date: '2026-03-10T03:00:00Z', profile: { status: '취준생', prep: 1, region: '수도권', age: 26, years: null }, label: '입사철', chip: '첫 출근 체크리스트', title: '첫 출근' },
    { date: '2026-09-29T03:00:00Z', profile: PROFILE, label: '이사철', chip: '전세 체크리스트', title: '전세·월세 계약' },
  ];
  for (const c of cases) {
    const { ctx, page, errors } = await open({ boot: true, profile: c.profile, fixedDate: c.date });
    await page.evaluate(() => { S.done = ['ju1']; save(); render('home'); });
    await page.waitForSelector('#hchk:not([hidden])');
    const tx = await page.locator('#hchk').innerText();
    assert.ok(tx.includes(c.label) && tx.includes(c.chip), `${c.date}: ${tx}`);
    assert.equal(await page.locator('#hchk:not([hidden])').count(), 1, '칩은 하나');
    await page.click('#hchk');
    await page.waitForFunction(() => document.getElementById('check').classList.contains('on'));
    assert.equal(await page.locator('#chktitle').innerText(), c.title);
    // 오늘은 숨기기
    await page.evaluate(() => render('home'));
    await page.waitForSelector('#hchk:not([hidden])');
    await page.click('#hchk .cx');
    assert.equal(await page.locator('#hchk').isHidden(), true);
    await page.evaluate(() => render('home'));
    assert.equal(await page.locator('#hchk').isHidden(), true, '같은 날 다시 그려도 숨김');
    await page.evaluate(() => __shiftDay(1)); await page.evaluate(() => render('home'));
    assert.equal(await page.locator('#hchk').isHidden(), false, '다음 날 다시 뜬다');
    noErrors(errors); await ctx.close();
  }
});

test('6. 시즌 칩: 철이 아니거나 목록을 다 마쳤거나 첫 퀘스트 전이면 없고, 내가 날짜를 넣은 D-day 칩이 먼저다', async () => {
  // 철이 아님 (5월)
  let o = await open({ boot: true, fixedDate: '2026-05-12T03:00:00Z' });
  await o.page.evaluate(() => { S.done = ['ju1']; save(); render('home'); });
  await o.page.waitForTimeout(200);
  assert.equal(await o.page.locator('#hchk').isHidden(), true);
  noErrors(o.errors); await o.ctx.close();
  // 이사철이지만 첫 퀘스트 전: 안내 칩이 먼저다
  o = await open({ boot: true, fixedDate: '2026-02-15T03:00:00Z' });
  assert.equal(await o.page.locator('#hchk').isHidden(), true);
  assert.equal(await o.page.locator('#hguide').isHidden(), false);
  // 목록을 다 마치면 뜨지 않는다
  await o.page.evaluate(() => { S.done = ['ju1']; const c = CHECKS.find((x) => x.id === 'lease'); const s = chkState('lease');
    c.stages.forEach((g, si) => g.items.forEach((it) => { s.done[si + ':' + it.id] = 1; })); save(); render('home'); });
  assert.equal(await o.page.locator('#hchk').isHidden(), true);
  // 날짜를 넣은 체크리스트가 있으면 그 칩이 시즌 칩을 대신한다
  await o.page.evaluate(() => { const s = chkState('lease'); s.done = {}; chkState('firstjob').date = addDays(dayKey(), 5); save(); render('home'); });
  const tx = await o.page.locator('#hchk').innerText();
  assert.match(tx, /D-5/);
  assert.match(tx, /첫 출근/);
  assert.equal(await o.page.locator('#hchk .cx').count(), 0);
  noErrors(o.errors); await o.ctx.close();
});

test('7. 시즌 표는 실제 체크리스트 id를 가리킨다', async () => {
  const { ctx, page, errors } = await open({ boot: true });
  const r = await st(page, () => SEASONS.map((s) => ({ id: s.id, ok: CHECKS.some((c) => c.id === s.check), months: s.months })));
  assert.equal(r.length, 3);
  assert.ok(r.every((x) => x.ok));
  assert.deepEqual(r.find((x) => x.id === 'move').months, [2, 3, 8, 9]);
  noErrors(errors); await ctx.close();
});

/** 공유 API를 가짜로 바꿔 무엇이 나가는지 잡는다 */
const stubShare = (page, mode) => page.evaluate((mode) => {
  window.__out = null;
  const def = (k, v) => Object.defineProperty(navigator, k, { value: v, configurable: true });
  if (mode === 'file') { def('canShare', () => true); def('share', (d) => { window.__out = { via: 'share', files: !!(d.files && d.files.length), text: d.text || '' }; return Promise.resolve(); }); }
  if (mode === 'text') { def('canShare', () => false); def('share', (d) => { window.__out = { via: 'share', files: false, text: d.text || '' }; return Promise.resolve(); }); }
  if (mode === 'copy') { def('canShare', () => false); def('share', undefined);
    def('clipboard', { writeText: (t) => { window.__out = { via: 'copy', files: false, text: t }; return Promise.resolve(); } }); }
}, mode);

test('8. 캐릭터 카드 공유: 문구에 한 줄 소개와 링크가 들어가고, 이미지가 안 되면 문구 공유·복사로 바뀐다', async () => {
  const { ctx, page, errors } = await open({ boot: true });
  const base = await st(page, () => SHARE_BASE), pitch = await st(page, () => SHARE_PITCH);
  assert.match(base, /^https:\/\//);
  assert.equal(pitch, '사회초년생 생활 RPG, 뉴비 퀘스트');
  await page.evaluate(() => render('char'));
  for (const mode of ['file', 'text', 'copy']) {
    await stubShare(page, mode);
    assert.equal(await page.locator('#sharebtn').isVisible(), true, `${mode}: 버튼이 보인다`);
    await page.click('#sharebtn');
    await page.waitForFunction(() => window.__out);
    const o = await st(page, () => window.__out);
    assert.equal(o.via, mode === 'copy' ? 'copy' : 'share', mode);
    assert.equal(o.files, mode === 'file', mode);
    assert.ok(o.text.includes(base), `${mode}: 링크가 있다 · ${o.text}`);
    assert.ok(o.text.includes(pitch), `${mode}: 한 줄 소개가 있다`);
    assert.match(o.text, /^뉴비 퀘스트 · /);
    if (mode === 'copy') assert.match(await page.locator('#sharenote').innerText(), /복사/);
  }
  // 카드 그림에도 소개와 주소 자리가 있다 (예외 없이 그려진다)
  const dim = await st(page, () => { const c = shareCard(); return [c.width, c.height]; });
  assert.deepEqual(dim, [640, 840]);
  noErrors(errors); await ctx.close();
});

test('9. 엔딩 공유: 엔딩이 끝나면 시트가 뜨고, 링크와 한 줄 소개가 나간다', async () => {
  const { ctx, page, errors } = await open({ boot: true });
  const base = await st(page, () => SHARE_BASE), pitch = await st(page, () => SHARE_PITCH);
  await page.evaluate(() => endingShareSheet());
  await page.waitForSelector('#itip:not([hidden])');
  assert.match(await sheetText(page), /엔딩을 봤어요/);
  for (const mode of ['text', 'copy']) {
    await stubShare(page, mode);
    await page.evaluate(() => { window.__out = null; });
    await page.click('#itipbox .ibtns button:has-text("친구에게 링크 보내기")');
    await page.waitForFunction(() => window.__out);
    const o = await st(page, () => window.__out);
    assert.equal(o.via, mode === 'copy' ? 'copy' : 'share');
    assert.ok(o.text.includes(base) && o.text.includes(pitch), o.text);
    assert.match(o.text, /귀인/);
  }
  // 엔딩 컷신이 끝나면 (건너뛰기) 이 시트가 뜬다
  await page.evaluate(() => { closeTip(); playCinema(ENDING, () => endingShareSheet()); });
  await page.waitForSelector('#opening .cskip');
  await page.click('#opening .cskip');
  await page.waitForSelector('#itip:not([hidden])');
  assert.match(await sheetText(page), /친구에게 링크 보내기/);
  noErrors(errors); await ctx.close();
});

test('10. 작은 화면(360×640)에서도 첫 상담 칩이 십자키·지도와 겹치지 않고 가로 넘침이 없다', async () => {
  const { ctx, page, errors } = await open({ boot: true, viewport: { width: 360, height: 640 } });
  await page.evaluate(() => { S.done = []; S.tut = 1; save(); render('home'); });
  await page.waitForSelector('#hguide:not([hidden])');
  const bg = await page.locator('#hguide').boundingBox(), bd = await page.locator('#hdpad').boundingBox(), bm = await page.locator('#hmini').boundingBox();
  assert.ok(bg.x >= bd.x + bd.width - 1 && bg.x + bg.width <= bm.x + 1, JSON.stringify({ bg, bd, bm }));
  assert.ok(bg.width >= 120, '글이 들어갈 폭');
  assert.equal(await st(page, () => document.documentElement.scrollWidth <= innerWidth), true);
  noErrors(errors); await ctx.close();
});
