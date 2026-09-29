// 스프린트 A(신뢰와 첫 경험) 검사: 시연 모드 기본 꺼짐, 첫 퀘스트 목숨 3, 튜토리얼 위치, 딥링크, 공유 링크.
// 게임은 실제 HTML을 그대로 https://newbie.test/ 주소에 올려서 연다(localStorage가 정상 동작하도록).
// 실행: npm test  (PLAYWRIGHT_BROWSERS_PATH 가 없으면 /opt/pw-browsers 를 쓴다)
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
let pw;
try { pw = await import('playwright'); }
catch (e) { pw = await import('/home/claude/Newbie-Game/node_modules/playwright/index.mjs'); }
const chromium = (pw.chromium || pw.default.chromium);

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = fs.readFileSync(path.resolve(here, '../prototype/newbie-quest-demo.html'), 'utf8');
const ORIGIN = 'https://newbie.test/';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open(hash = '#nointro', { width = 390, height = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route(ORIGIN + '**', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: GAME }));
  await page.addInitScript(() => {
    window.__shared = null;
    Object.defineProperty(navigator, 'share', { value: (d) => { window.__shared = d; return Promise.resolve(); }, configurable: true });
  });
  await page.goto(ORIGIN + 'game.html' + hash);
  await page.waitForFunction(() => typeof S !== 'undefined' && S && typeof renderHome === 'function');
  return { ctx, page, errors };
}

test('#nointro 로 열면 콘솔 에러가 없다', async () => {
  const { ctx, page, errors } = await open('#nointro');
  await page.waitForTimeout(600);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('처음 시작은 시연 모드가 아니다: Lv.1, 시작 코인, 거처 0단계, 이사 배너 없음', async () => {
  const { ctx, page } = await open('#nointro');
  const r = await page.evaluate(() => {
    S.onboarded = true; S.todayQ = pickDaily(); save(); renderHome();
    return { demo: demoOn(), lv: S.lv, coin: S.coin, tier: S.tier, banner: redecorateNeeded(), lab: document.getElementById('htodaylab').textContent };
  });
  assert.equal(r.demo, false);
  assert.equal(r.lv, 1);
  assert.ok(r.coin < 500, 'coin ' + r.coin);
  assert.equal(r.tier, 0);
  assert.equal(r.banner, false);
  assert.ok(!/이사했습니다/.test(r.lab));
  await ctx.close();
});

test('#demo 로 열면 시연 모드가 켜지고 이사 배너는 뜨지 않는다', async () => {
  const { ctx, page } = await open('#nointro&demo');
  const r = await page.evaluate(() => {
    S.onboarded = true; S.todayQ = pickDaily(); save(); renderHome();
    return { demo: demoOn(), lv: S.lv, coin: S.coin, banner: redecorateNeeded() };
  });
  assert.equal(r.demo, true);
  assert.ok(r.lv >= 5);
  assert.ok(r.coin >= 5000);
  assert.equal(r.banner, false);
  await ctx.close();
});

test('첫 퀘스트는 목숨 3개, 이후 퀘스트는 2개', async () => {
  const { ctx, page } = await open('#nointro');
  const first = await page.evaluate(() => {
    S.onboarded = true; save();
    startQuest(QUESTS.filter((q) => !q.keys && qOpen(q))[0]);
    return new Promise((res) => setTimeout(() => res({ hearts: RUN.hearts, drawn: document.querySelectorAll('#qhearts canvas').length }), 900));
  });
  assert.equal(first.hearts, 3);
  assert.equal(first.drawn, 3);
  const second = await page.evaluate(() => {
    S.done.push('x_done'); S.full = 100; go('home');
    startQuest(QUESTS.filter((q) => !q.keys && qOpen(q))[1]);
    return new Promise((res) => setTimeout(() => res({ hearts: RUN.hearts, drawn: document.querySelectorAll('#qhearts canvas').length }), 900));
  });
  assert.equal(second.hearts, 2);
  assert.equal(second.drawn, 2);
  await ctx.close();
});

test('결과 화면의 정답은 실제로 나온 문항 수 기준이다 (0 / 2)', async () => {
  const { ctx, page } = await open('#nointro');
  const txt = await page.evaluate(() => {
    S.onboarded = true; S.done.push('x_done'); save();
    const q = QUESTS.filter((x) => !x.keys && qOpen(x) && x.qs.length >= 3)[0];
    startQuest(q);
    return new Promise((res) => setTimeout(() => {
      RUN.mak = 0;
      for (let i = 0; i < 2; i++) { RUN.i = i; stepQuest(false); answer((q.qs[i].ok + 1) % q.qs[i].a.length, null); }
      finish(true);
      res({ n: q.qs.length, gains: document.getElementById('rgains').textContent });
    }, 900));
  });
  assert.ok(txt.n >= 3);
  assert.match(txt.gains, /정답0 \/ 2/);
  await ctx.close();
});

test('간파·막기 툴팁은 첫 진입에만 뜨고 저장된다', async () => {
  const { ctx, page } = await open('#nointro');
  const r = await page.evaluate(() => {
    S.onboarded = true; save();
    startQuest(QUESTS.filter((q) => !q.keys && qOpen(q))[0]);
    return new Promise((res) => setTimeout(() => {
      RUN.i = 0; stepQuest(false);
      const shown = !document.getElementById('qtip').hidden;
      res({ shown, saved: JSON.parse(localStorage.getItem(KEY)).tipTools });
    }, 900));
  });
  assert.equal(r.shown, true);
  assert.equal(r.saved, 1);
  const again = await page.evaluate(() => {
    go('home'); startQuest(QUESTS.filter((q) => !q.keys && qOpen(q))[1]);
    return new Promise((res) => setTimeout(() => { RUN.i = 0; stepQuest(false); res(!document.getElementById('qtip').hidden); }, 900));
  });
  assert.equal(again, false);
  await ctx.close();
});

test('튜토리얼은 그 장소(동네)에서만 이어진다', async () => {
  const { ctx, page } = await open('#nointro');
  const r = await page.evaluate(() => {
    S.onboarded = true; S.tuts = []; S.tut = 0; TUT_COOL = 0; TUT = null;
    go('home');
    ME.map = 'room';
    checkTutor();
    const inRoom = !!TUT;
    ME.map = 'town'; TUT_COOL = 0;
    checkTutor();
    return { inRoom, inTown: !!TUT };
  });
  assert.equal(r.inRoom, false);
  assert.equal(r.inTown, true);
  await ctx.close();
});

test('낮은 화면에서 대화창이 D-패드를 가리지 않는다', async () => {
  const { ctx, page } = await open('#nointro', { width: 360, height: 640 });
  const r = await page.evaluate(() => {
    S.onboarded = true; S.tuts = []; TUT_COOL = 0; TUT = null; render('home');
    talkTo({ name: '부동산 사장', face: 'gpa', lines: ['어, 새로 온 얼굴이네. 나는 이 동네에서 부동산 하는 사람이야. 건물마다 간판이 붙어 있지?'] });
    const t = document.getElementById('htutor').getBoundingClientRect();
    const d = document.querySelector('.dpad').getBoundingClientRect();
    return { tb: t.bottom, tt: t.top, dt: d.top, db: d.bottom, th: innerHeight };
  });
  assert.ok(r.tb <= r.dt, `대화창 bottom ${r.tb} > D-패드 top ${r.dt}`);
  await ctx.close();
});

test('#c=lease 로 열면 체크리스트가 바로 열린다', async () => {
  const { ctx, page } = await open('#c=lease');
  const r = await page.evaluate(() => ({
    on: document.getElementById('check').classList.contains('on'),
    title: document.getElementById('chktitle').textContent,
    opening: !!document.getElementById('opening'),
  }));
  assert.equal(r.on, true);
  assert.equal(r.title, '전세·월세 계약');
  assert.equal(r.opening, false);
  await ctx.close();
});

test('공유 문구는 #c=<id> 링크로 끝난다', async () => {
  const { ctx, page } = await open('#nointro');
  const shared = await page.evaluate(() => { shareCheck(CHECKS.filter((c) => c.id === 'lease')[0]); return window.__shared; });
  assert.ok(shared && shared.text);
  assert.ok(shared.text.trimEnd().endsWith('https://ksy93-spec.github.io/Newbie-Game/#c=lease'), shared.text.slice(-120));
  await ctx.close();
});

test('백과 탭에 체크리스트 주제가 두 번 나오지 않는다', async () => {
  const { ctx, page } = await open('#nointro');
  const r = await page.evaluate(() => {
    S.onboarded = true; render('wiki');
    const body = document.getElementById('wikibody');
    return { cards: body.querySelectorAll('.chkcard').length, accordion: [...body.querySelectorAll('.wtopic .wt')].map((e) => e.textContent), checks: CHECKS.length };
  });
  assert.equal(r.cards, r.checks);
  assert.ok(!r.accordion.some((t) => /전세|월세|첫 직장/.test(t)), r.accordion.join(','));
  await ctx.close();
});

test('콘텐츠 점검일과 정정 사항', async () => {
  const { ctx, page } = await open('#nointro');
  const r = await page.evaluate(() => {
    const all = JSON.stringify(QUESTS) + JSON.stringify(CHECKS);
    const bad = [];
    QUESTS.forEach((q) => q.qs.forEach((x, i) => { if (!(x.ok >= 0 && x.ok < x.a.length)) bad.push(q.id + ':' + i); }));
    return { asOf: CONTENT.asOf, note: CONTENT.note, bad, sangsi: /상시 사업|아무 때나/.test(all), trip: SRC_BY_ID.trip1 };
  });
  assert.equal(r.asOf, '2026-09-29');
  assert.ok(!/문항마다/.test(r.note));
  assert.deepEqual(r.bad, []);
  assert.equal(r.sangsi, false);
  assert.equal(r.trip[1], 'https://www.knto.or.kr');
  await ctx.close();
});
