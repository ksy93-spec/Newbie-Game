// 스프린트 B: 퀘스트 드립, 복습 퀴즈, 연속 출석, 보상형 광고, 거처 보증금.
// 게임 HTML을 file:// 로 열고(#nointro) 실제 화면 버튼을 눌러 확인한다. 광고는 window.showAd = cb => cb() 로 대신한다.
// 실행: node --test tests/sprintB.test.mjs   (PLAYWRIGHT_BROWSERS_PATH 가 없으면 /opt/pw-browsers 를 쓴다)
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

const DAY = 86400000;
const PROFILE = { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 };

/** 새 컨텍스트에서 게임을 열고, 온보딩을 마친 직장인 상태로 만든다. shiftDays 만큼 날짜를 민다. */
async function open({ ctx = null, shiftDays = 0, boot = true, profile = PROFILE, seed = null } = {}) {
  ctx ||= await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(([d, seed]) => {
    try { localStorage.setItem('nq_demo', '0'); if (seed) localStorage.setItem('nq.v8', seed); } catch (e) {}
    if (d) { const real = Date.now.bind(Date); Date.now = () => real() + d * 86400000; }
  }, [shiftDays, seed]);
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS && typeof window.showAd === 'function');
  await page.evaluate(() => { window.__ads = 0; window.showAd = (cb) => { window.__ads++; cb(); }; });
  if (boot) await bootState(page, profile);
  return { ctx, page, errors };
}
async function bootState(page, profile) {
  await page.evaluate((p) => {
    Object.assign(S, p);
    S.onboarded = true; S.demo = false; S.demoDone = 1;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.todayQ = pickDaily(); save(); render('home');
  }, profile);
}
const st = (page, fn, arg) => page.evaluate(fn, arg);

/** 퀘스트 하나를 실제 함수로 풀고 결과 화면까지 간다. wrong 은 틀릴 문항 번호들 */
async function playQuest(page, id, wrong = []) {
  await page.evaluate((id) => { S.full = fullMax(); S.energy = 100; S.mood = 100; S.clean = 100; startQuest(QMAP[id]); }, id);
  await page.waitForFunction(() => document.getElementById('quest').classList.contains('on'));
  return page.evaluate(([id, wrong]) => {
    const q = RUN.q;
    for (let i = 0; i < q.qs.length; i++) {
      RUN.i = i; const it = q.qs[i];
      answer(wrong.includes(i) ? (it.ok + 1) % it.a.length : it.ok, null);
      if (RUN.hearts <= 0) { finish(true); return 'failed'; }
    }
    finish(false); return 'ok';
  }, [id, wrong]);
}
const openSheet = async (page) => { await page.click('#htoday'); await page.waitForSelector('#itip:not([hidden])'); };
const sheetText = (page) => page.evaluate(() => document.getElementById('itipbox').innerText);
const sheetBtn = (page, txt) => page.locator('#itipbox .ibtns button', { hasText: txt });
const noErrors = (errors) => assert.deepEqual(errors, [], '콘솔 오류 없음');

test('1. 첫날에는 새 퀘스트가 5개 열리고 나머지는 "내일 열림"', async () => {
  const { ctx, page, errors } = await open();
  const r = await st(page, () => ({ u: S.drip.u.length, open: openLeft(), locked: dripLocked().length,
    today: S.todayQ.every((id) => S.drip.u.includes(id)), hasJu1: S.drip.u.includes('ju1') }));
  assert.equal(r.u, 5);
  assert.equal(r.open, 5);
  assert.ok(r.locked > 0);
  assert.ok(r.today, '오늘의 3개는 열린 퀘스트에서만 뽑는다');
  assert.ok(r.hasJu1, '첫 퀘스트 ju1은 첫날에 열려 있다');
  // 잠긴 퀘스트를 열려고 하면 "내일 열림" 안내와 광고 버튼이 뜬다
  await page.evaluate(() => startQuest(dripLocked()[0]));
  await page.waitForSelector('#itip:not([hidden])');
  const t = await sheetText(page);
  assert.match(t, /내일 열림/);
  assert.ok(await sheetBtn(page, '광고 보고 이 퀘스트 열기').count());
  // 지도의 창구/사람도 잠긴 것은 "내일 열림"으로 안내한다
  const hint = await st(page, () => {
    const q = dripLocked().find((x) => QPLACE[x.id]); if (!q) return null;
    const s = { kind: 'desk', id: QPLACE[q.id], label: 'x' };
    return { hint: spotHint(s), mark: spotMark(s), title: q.title };
  });
  if (hint) { assert.match(hint.hint, /내일 열림/); assert.equal(hint.mark, 'lock'); }
  noErrors(errors); await ctx.close();
});

test('2. 다음 날에는 3개가 더 열린다 (하루를 밀어서, 그리고 날짜를 바꿔 다시 열어서)', async () => {
  const { ctx, page, errors } = await open();
  assert.equal(await st(page, () => S.drip.u.length), 5);
  await page.evaluate(() => __shiftDay(1));
  assert.equal(await st(page, () => S.drip.u.length), 8);
  assert.equal(await st(page, () => dayGap(S.drip.d0, dayKey())), 1);
  await page.evaluate(() => __shiftDay(1));
  assert.equal(await st(page, () => S.drip.u.length), 11);
  // 같은 날 다시 그려도 늘지 않는다
  await page.evaluate(() => { render('home'); render('home'); });
  assert.equal(await st(page, () => S.drip.u.length), 11);
  // 저장을 두고 하루 뒤 시각으로 다시 열면 8개
  const a = await open();
  assert.equal(await st(a.page, () => S.drip.u.length), 5);
  const raw = await st(a.page, () => localStorage.getItem('nq.v8'));   // 같은 저장을 새 창에 심어서 다시 연다
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const b = await open({ ctx: ctx2, shiftDays: 1, boot: false, seed: raw });
  assert.equal(await st(b.page, () => ({ n: S.drip.u.length, streak: S.streak })).then((x) => x.n), 8);
  noErrors(errors); noErrors(a.errors); noErrors(b.errors);
  await ctx.close(); await ctx2.close(); await a.ctx.close();
});

test('3. 광고로 하나 더 열기: 하루 2회까지', async () => {
  const { ctx, page, errors } = await open();
  const n0 = await st(page, () => S.drip.u.length);
  await openSheet(page);
  assert.ok(await sheetBtn(page, '광고 보고 하나 더 열기').count());
  await sheetBtn(page, '광고 보고 하나 더 열기').click();
  assert.equal(await st(page, () => S.drip.u.length), n0 + 1);
  assert.equal(await st(page, () => window.__ads), 1);
  await sheetBtn(page, '광고 보고 하나 더 열기').click();
  assert.equal(await st(page, () => S.drip.u.length), n0 + 2);
  assert.equal(await st(page, () => window.__ads), 2);
  // 세 번째는 버튼이 없고 안내 문구가 뜬다
  assert.equal(await sheetBtn(page, '광고 보고 하나 더 열기').count(), 0);
  assert.match(await sheetText(page), /오늘 광고 보상은 다 받았어요/);
  await page.evaluate(() => dripAdOpen(null, () => {}));
  assert.equal(await st(page, () => S.drip.u.length), n0 + 2, '억지로 불러도 3번째는 열리지 않는다');
  assert.equal(await st(page, () => window.__ads), 2);
  // 다음 날에는 다시 2회
  await page.evaluate(() => { closeTip(); __shiftDay(1); });
  assert.equal(await st(page, () => adLeft('unl')), 2);
  noErrors(errors); await ctx.close();
});

test('4. 광고는 하루 공동 8회 상한이고 9번째는 막힌다', async () => {
  const { ctx, page, errors } = await open();
  const r = await st(page, () => {
    const kinds = ['unl', 'unl', 'att', 'dbl', 'dbl', 'dbl', 'life', 'life'], done = [];
    kinds.forEach((k) => { adGo(k, () => done.push(k)); });
    const before = window.__ads;
    let ninth = 0; adGo('bed', () => { ninth++; });
    let tenth = 0; adGo('rst', () => { tenth++; });
    return { done: done.length, ads: before, adsAfter: window.__ads, ninth, tenth, n: S.adN, left: adLeft() };
  });
  assert.equal(r.done, 8);
  assert.equal(r.ads, 8);
  assert.equal(r.adsAfter, 8, '9번째부터는 showAd 자체를 부르지 않는다');
  assert.equal(r.ninth, 0); assert.equal(r.tenth, 0);
  assert.equal(r.n, 8); assert.equal(r.left, 0);
  // 화면에는 버튼 대신 안내가 뜬다
  await openSheet(page);
  assert.equal(await page.locator('#itipbox button', { hasText: '광고 보고' }).count(), 0);
  assert.match(await sheetText(page), /오늘 광고 보상은 다 받았어요/);
  // 침대 광고도 같은 상한을 쓴다
  const bed = await st(page, () => { S.energy = 10; S._energyAt = Date.now(); return actReady('bed1', FURNI_ACT.bed[1]); });
  assert.match(bed, /다 받았어요/);
  // 날이 바뀌면 다시 쓸 수 있다
  await page.evaluate(() => { closeTip(); __shiftDay(1); });
  assert.equal(await st(page, () => adLeft()), 8);
  noErrors(errors); await ctx.close();
});

test('5. 결과 화면 "광고 보고 코인 더 받기"는 한 번만, 딱 획득량만큼', async () => {
  const { ctx, page, errors } = await open();
  const pick = await st(page, () => S.todayQ.length ? dripOrder().find((q) => q.theme !== 'ju' && S.drip.u.includes(q.id) && !S.todayQ.includes(q.id)).id : null);
  assert.ok(pick);
  const coin0 = await st(page, () => S.coin);
  assert.equal(await playQuest(page, pick), 'ok');
  const coin1 = await st(page, () => S.coin), gain = coin1 - coin0;
  assert.ok(gain >= 30, '획득 ' + gain);
  const btn = page.locator('#rdbl button');
  await btn.waitFor();
  assert.match(await btn.innerText(), new RegExp('광고 보고 ￦' + gain + ' 더 받기'));
  await btn.click();
  assert.equal(await st(page, () => S.coin), coin1 + gain, '딱 한 번 두 배');
  assert.equal(await page.locator('#rdbl button').count(), 0, '버튼이 사라진다');
  assert.equal(await st(page, () => window.__ads), 1);
  assert.equal(await st(page, () => S.adK.dbl), 1);
  assert.match(await page.locator('#rxp').innerText(), new RegExp('광고 ￦' + gain));
  // 하루 3회. 세 번 채우고 나면 다음 결과에는 안내 문구
  await page.evaluate(() => { S.adK.dbl = 3; S.adN = 3; });
  const pick2 = await st(page, () => dripOrder().find((q) => q.theme !== 'ju' && S.drip.u.includes(q.id) && S.done.indexOf(q.id) < 0 && !S.todayQ.includes(q.id)).id);
  assert.equal(await playQuest(page, pick2), 'ok');
  assert.equal(await page.locator('#rdbl button').count(), 0);
  assert.match(await page.locator('#rdbl').innerText(), /오늘 광고 보상은 다 받았어요/);
  noErrors(errors); await ctx.close();
});

test('5-2. 목숨 0이면 "광고 보고 목숨 1개"로 이어 풀 수 있고 무료 선택지(결과 보기)는 남는다', async () => {
  const { ctx, page, errors } = await open();
  const id = await st(page, () => S.drip.u[0]);
  await page.evaluate((id) => { S.done.push("x_done"); S.full = fullMax(); S.energy = 100; startQuest(QMAP[id]); }, id);
  await page.waitForFunction(() => document.getElementById('quest').classList.contains('on'));
  await page.evaluate(() => {
    const q = RUN.q; RUN.mak = 0;
    for (let i = 0; i < 2; i++) { RUN.i = i; answer((q.qs[i].ok + 1) % q.qs[i].a.length, null); }
  });
  assert.equal(await st(page, () => RUN.hearts), 0);
  assert.equal(await page.locator('#qnext').innerText(), '결과 보기', '무료 선택지');
  const life = page.locator('#qlife');
  assert.equal(await life.isVisible(), true);
  assert.match(await life.innerText(), /광고 보고 목숨 1개 · 이어 풀기/);
  await life.click();
  assert.equal(await st(page, () => RUN.hearts), 1);
  assert.equal(await st(page, () => window.__ads), 1);
  assert.equal(await st(page, () => S.adK.life), 1);
  assert.equal(await page.locator('#qlife').isVisible(), false);
  assert.equal(await st(page, () => RUN.hearts > 0), true, '이어 풀 수 있는 상태');
  noErrors(errors); await ctx.close();
});

test('6. 체력이 가득이면 침대 광고 선택지를 숨긴다', async () => {
  const { ctx, page, errors } = await open();
  const tap = async () => {
    await page.waitForFunction(() => { const o = document.getElementById('htutorop'); return o && !o.hidden && o.children.length > 0; });
    return page.evaluate(() => Array.from(document.querySelectorAll('#htutorop button')).map((b) => b.textContent));
  };
  await page.evaluate(() => { S.energy = 100; S._energyAt = Date.now(); openFurni('bed'); });
  const full = await tap();
  assert.ok(full.some((t) => t.includes('잠자기')));
  assert.ok(!full.some((t) => t.includes('광고')), '체력 가득: ' + full.join('|'));
  await page.evaluate(() => { endTalk(); S.energy = 40; S._energyAt = Date.now(); openFurni('bed'); });
  const low = await tap();
  assert.ok(low.some((t) => t.includes('광고 보고 푹 자기')), '체력 부족: ' + low.join('|'));
  // 실제로 눌러서 채워지고 공동 카운터에 잡힌다
  await page.locator('#htutorop button', { hasText: '광고 보고 푹 자기' }).click();
  await page.waitForFunction(() => S.energy >= 100);
  assert.equal(await st(page, () => S.adN), 1);
  assert.equal(await st(page, () => S.adK.bed), 1);
  noErrors(errors); await ctx.close();
});

test('7. 열린 퀘스트를 다 풀면 오답 우선 3문항 복습 퀴즈가 열린다', async () => {
  const { ctx, page, errors } = await open();
  const ids = await st(page, () => S.drip.u.slice());
  assert.equal(await st(page, () => quizAvail()), false, '풀 퀘스트가 남아 있을 때는 퀴즈가 없다');
  for (let i = 0; i < ids.length; i++) assert.equal(await playQuest(page, ids[i], i === 0 ? [1] : []), 'ok');
  await page.evaluate(() => render('home'));
  const s = await st(page, () => ({ left: openLeft(), avail: quizAvail(), bonus: S.bonus, dot: document.getElementById('htoday').textContent }));
  assert.equal(s.left, 0);
  assert.ok(s.avail);
  assert.match(s.dot, /오늘 할 일\s*1/);
  await openSheet(page);
  const coin0 = await st(page, () => S.coin);
  await sheetBtn(page, '오늘의 복습 퀴즈').click();
  await page.waitForFunction(() => document.getElementById('quest').classList.contains('on'));
  const run = await st(page, () => ({ dq: !!RUN.q.dq, n: RUN.q.qs.length, first: RUN.q.keys[0].q + '#' + RUN.q.keys[0].i, wrongFirst: S.review.map((r) => r.q + '#' + r.i) }));
  assert.ok(run.dq);
  assert.equal(run.n, 3);
  assert.ok(run.wrongFirst.includes(run.first), '틀린 문항이 맨 앞: ' + JSON.stringify(run));
  assert.equal(run.first, ids[0] + '#1');
  await page.evaluate(() => {
    const q = RUN.q;
    for (let i = 0; i < 3; i++) { RUN.i = i; answer(q.qs[i].ok, null); }
    finish(false);
  });
  const after = await st(page, () => ({ coin: S.coin, quizDay: S.quizDay, day: dayKey(), inDone: S.done.includes('dquiz'), avail: quizAvail() }));
  assert.equal(after.quizDay, after.day, '오늘 퀴즈 완료로 기록');
  assert.ok(after.coin > coin0, '작은 코인 보상');
  assert.ok(after.coin - coin0 <= 60);
  assert.equal(after.inDone, false, '퀘스트 완료 목록에는 들어가지 않는다');
  assert.equal(after.avail, false, '하루 한 번');
  noErrors(errors); await ctx.close();
});

test('7-2. 오늘 퀘스트를 완주하면(일일 보너스) 퀴즈가 열리고, 완료한 게 없으면 안 열린다', async () => {
  const { ctx, page, errors } = await open();
  assert.equal(await st(page, () => quizAvail()), false);
  const today = await st(page, () => S.todayQ.slice());
  for (const id of today) assert.equal(await playQuest(page, id, [0]), 'ok');
  const r = await st(page, () => ({ bonus: S.bonus, left: openLeft(), avail: quizAvail() }));
  assert.ok(r.bonus);
  assert.ok(r.left > 0, '아직 안 푼 열린 퀘스트가 있어도');
  assert.ok(r.avail, '일일 완주 뒤에는 퀴즈가 보너스로 열린다');
  noErrors(errors); await ctx.close();
});

test('8. 딱 하루 걸렀을 때만 "광고 보고 연속 출석 지키기"를 한 번 권한다', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => { S.streak = 4; S.best = 4; S.ms = [3]; save(); });
  const coin0 = await st(page, () => S.coin);
  await page.evaluate(() => __shiftDay(2));
  const s = await st(page, () => ({ streak: S.streak, restore: S.restore }));
  assert.equal(s.streak, 1, '걸렀으니 1로 돌아간다');
  assert.deepEqual({ prev: s.restore.prev }, { prev: 4 });
  await page.evaluate(() => closeTip());
  await openSheet(page);
  assert.match(await sheetText(page), /하루를 걸렀어요/);
  assert.ok(await sheetBtn(page, '광고 보고 연속 출석 지키기').count());
  await sheetBtn(page, '광고 보고 연속 출석 지키기').click();
  const r = await st(page, () => ({ streak: S.streak, used: S.restore.used, ads: window.__ads, k: S.adK.rst }));
  assert.equal(r.streak, 5);
  assert.ok(r.used);
  assert.equal(r.ads, 1); assert.equal(r.k, 1);
  assert.equal(await sheetBtn(page, '연속 출석 지키기').count(), 0, '한 번만');
  assert.equal(await st(page, () => restoreOffer()), false);
  // 이틀 이상 걸렀으면(gap 3) 권하지 않는다
  await page.evaluate(() => { closeTip(); S.streak = 4; save(); __shiftDay(3); });
  assert.equal(await st(page, () => S.restore), null);
  assert.equal(await st(page, () => S.streak), 1);
  noErrors(errors); await ctx.close();
});

test('8-2. 연속 3/7/14일 한정 보상은 한 번만 준다', async () => {
  const { ctx, page, errors } = await open();
  const c0 = await st(page, () => S.coin);
  await page.evaluate(() => { __shiftDay(1); });
  assert.deepEqual(await st(page, () => S.ms), []);
  await page.evaluate(() => { closeTip(); __shiftDay(1); });
  const r = await st(page, () => ({ streak: S.streak, ms: S.ms.slice(), coin: S.coin, own: S.owned.includes('beanie2'), att: S.claimC }));
  assert.equal(r.streak, 3);
  assert.deepEqual(r.ms, [3]);
  assert.ok(r.own, '주황 비니');
  await page.evaluate(() => { closeTip(); S.streak = 2; S.day = addDays(dayKey(), -1); save(); __shiftDay(0); });
  // 다시 3일이 돼도 두 번 주지 않는다
  const before = await st(page, () => S.coin);
  await page.evaluate(() => { S.streak = 2; S.day = addDays(dayKey(), -1); rollDay(); });
  assert.equal(await st(page, () => S.ms.filter((d) => d === 3).length), 1);
  assert.ok((await st(page, () => S.coin)) - before < 100, '100코인 보상이 다시 붙지 않는다');
  noErrors(errors); await ctx.close();
});

test('8-3. 출석 카드의 "광고 보고 출석 보너스"는 하루 1회, 그날 출석 코인의 절반', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => { autoClaim(); });
  const claimC = await st(page, () => S.claimC);
  assert.ok(claimC > 0);
  const coin0 = await st(page, () => S.coin);
  await openSheet(page);
  const b = sheetBtn(page, '광고 보고 출석 보너스');
  await b.click();
  const add = Math.max(10, Math.round(claimC * 0.5));
  assert.equal((await st(page, () => S.coin)) - coin0, add);
  assert.equal(await sheetBtn(page, '광고 보고 출석 보너스').count(), 0);
  assert.equal(await st(page, () => S.adK.att), 1);
  noErrors(errors); await ctx.close();
});

test('9. 더 높은 거처로 옮기면 보증금이 빠지고, 이미 살아 본 곳은 무료다', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => { S.peak = 6; S.tier = 3; S.paid = 0; S.coin = 1000; save(); render('char'); });
  const want = await st(page, () => TIER_DEP[5] - TIER_DEP[3]);
  assert.equal(want, 110);
  await page.evaluate(() => houseTip(5));
  await page.waitForSelector('#itip:not([hidden])');
  assert.match(await sheetText(page), new RegExp('입주 보증금 ￦' + want));
  await sheetBtn(page, '내고 여기서 살기').click();
  const r = await st(page, () => ({ tier: S.tier, coin: S.coin, paid: S.paid }));
  assert.equal(r.tier, 5);
  assert.equal(r.coin, 1000 - want);
  assert.equal(r.paid, 5);
  // 아래로는 무료, 다시 올라와도 무료
  await page.evaluate(() => { closeTip(); houseTip(3); });
  await sheetBtn(page, '여기서 살기').click();
  assert.equal(await st(page, () => S.tier), 3);
  assert.equal(await st(page, () => S.coin), 1000 - want);
  await page.evaluate(() => { closeTip(); houseTip(5); });
  assert.match(await sheetText(page), /보증금 없이/);
  await sheetBtn(page, '여기서 살기').click();
  assert.equal(await st(page, () => S.coin), 1000 - want);
  // 코인이 모자라면 버튼이 꺼지고 얼마나 모자란지 알려 준다
  await page.evaluate(() => { closeTip(); S.coin = 10; houseTip(6); });
  assert.match(await sheetText(page), /모자라요/);
  assert.equal(await page.locator('#itipbox .ibtns button[disabled]').count(), 1);
  const denied = await st(page, () => { const m = tierMove(6); return { ok: m.ok, tier: S.tier, coin: S.coin }; });
  assert.equal(denied.ok, 0); assert.equal(denied.tier, 5); assert.equal(denied.coin, 10);
  noErrors(errors); await ctx.close();
});

test('9-2. 새 거처가 열릴 때 보증금을 내고 옮기고, 모자라면 그대로 머문다. 하루 한 칸만 열린다', async () => {
  const { ctx, page, errors } = await open();
  const r = await st(page, () => {
    S.stats.ju = 100; S.peak = 0; S.tier = 0; S.paid = 0; S.coin = 15; S.first = addDays(dayKey(), -3); S.upDay = null; S.upN = 0;
    const g1 = tierGrow(); const m1 = g1 && g1.wasTop ? tierMove(S.peak) : null;
    const left = upLeft();
    return { peak: S.peak, ok: m1 && m1.ok, cost: m1 && m1.cost, tier: S.tier, left, grow2: tierGrow() };
  });
  assert.equal(r.peak, 1);
  assert.equal(r.ok, 0, '코인 15로는 보증금 20을 못 낸다');
  assert.equal(r.cost, 20);
  assert.equal(r.tier, 0);
  assert.equal(r.left, 0);
  assert.equal(r.grow2, null, '같은 날 두 번째는 안 열린다');
  await page.evaluate(() => { S.coin = 500; __shiftDay(1); });
  const r2 = await st(page, () => ({ peak: S.peak, tier: S.tier, coin: S.coin }));
  assert.equal(r2.peak, 2);
  noErrors(errors); await ctx.close();
});

test('10. 예전 저장을 열면 푼 것·시작한 것은 그대로 열려 있고 오늘 몫이 더해진다', async () => {
  const a = await open();
  const raw = await a.page.evaluate(() => {
    S.done = ['ju1', 'jik1']; S.todayQ = []; S.review = [{ q: 'ju2', i: 0, box: 0, due: dayKey() }];
    S.first = addDays(dayKey(), -6); delete S.drip; save();
    return localStorage.getItem('nq.v8');
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const b = await open({ ctx, boot: false, seed: raw });
  const r = await st(b.page, () => ({ u: S.drip.u.slice(), n: S.drip.u.length, open: openLeft(), doneOpen: ['ju1', 'jik1', 'ju2'].every((id) => qOpen(QMAP[id])) }));
  assert.ok(r.doneOpen);
  assert.ok(['ju1', 'jik1', 'ju2'].every((id) => r.u.includes(id)));
  assert.equal(r.n, 3 + 3, '이미 가진 3개 + 오늘 몫 3개');
  noErrors(a.errors); noErrors(b.errors);
  await ctx.close(); await a.ctx.close();
});

test('11. 신축까지 닿을 수 있다: 가장 불리한 신분도 주 스탯 합계가 신축 조건을 넘는다', async () => {
  const { ctx, page, errors } = await open({ profile: { status: '직장인', years: 2, company: '중소기업', region: '그 외', age: 29 } });
  const r = await st(page, () => {
    const juQ = QUESTS.filter((q) => fits(q) && !q.trip && q.stat && q.stat.ju).reduce((a, q) => a + q.stat.ju, 0);
    const ep = 12, boss = 15;   // 사건 최고 결말 12, 보스 격파 15
    const max = 5 + juQ + ep + boss;
    return { max, top: TIERS[TIERS.length - 1].need, need90: Math.round(5 + 0.9 * (juQ + ep + boss)), dep: TIER_DEP[TIERS.length - 1], sorted: TIERS.every((t, i) => !i || t.need > TIERS[i - 1].need) };
  });
  assert.ok(r.sorted);
  assert.ok(r.top <= r.need90, `신축 ${r.top} <= 90% 지점 ${r.need90}`);
  assert.ok(r.max >= r.top);
  noErrors(errors); await ctx.close();
});
