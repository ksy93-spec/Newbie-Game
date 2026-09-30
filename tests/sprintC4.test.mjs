// 스프린트 C4: 첫 월급 계산기 + 영수증 카드.
// 게임 HTML을 file:// 로 열고(#nointro) 계산 함수는 page.evaluate 로, 화면은 실제 버튼을 눌러 확인한다.
// 검증 근거와 요율표는 ops/meeting-0929/c4-salary.md
// 실행: node --test tests/sprintC4.test.mjs   (PLAYWRIGHT_BROWSERS_PATH 가 없으면 /opt/pw-browsers 를 쓴다)
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

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && typeof window.calcFirstSalary === 'function');
  await page.evaluate((p) => {
    Object.assign(S, p);
    S.onboarded = true; S.demo = false; S.demoDone = 1;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    save(); render('home');
  }, PROFILE);
  return { ctx, page, errors };
}
const calc = (page, g, m = 200000, f = 1) => page.evaluate(([g, m, f]) => calcFirstSalary(g, m, f), [g, m, f]);
const noErrors = (errors) => assert.deepEqual(errors, [], '콘솔 오류 없음');

/* 공개된 2026년 실수령액표(비과세 식대·부양가족 1명 기준으로 명시된 것)에서 옮긴 값.
   출처: job.cosmosfarm.com 월급 실수령액표, silsu.kr 연봉표, work.calculate.co.kr 실수령액표 (c4-salary.md 참조) */
const EXAMPLES = [
  { name: 'cosmosfarm 월 250만 · 식대 20만', g: 2500000, m: 200000, np: 109250, hi: 82680, ltc: 10860, ei: 20700, it: 28760, lt: 2870 },
  { name: 'cosmosfarm 월 400만 · 식대 20만', g: 4000000, m: 200000, np: 180500, hi: 136610, ltc: 17950, ei: 34200, it: 166500, lt: 16650 },
  { name: 'silsu.kr 연봉 3000만(월 250만) · 식대 20만', g: 2500000, m: 200000, total: 255575 },
  { name: 'silsu.kr 연봉 5000만(월 416만6666) · 식대 20만', g: 4166666, m: 200000, total: 595135 },
  { name: 'calculate.co.kr 월 250만 · 식대 0', g: 2500000, m: 0, np: 118750, hi: 89870, ltc: 11800, ei: 22500, it: 35600, lt: 3560 },
  { name: 'calculate.co.kr 월 300만 · 식대 0', g: 3000000, m: 0, np: 142500, hi: 107850, ltc: 14170, ei: 26999, it: 74350, lt: 7430 },
];
for (const e of EXAMPLES) {
  test('1. 공개 예시와 공제 합계 오차 1% 또는 3,000원 이내 · ' + e.name, async () => {
    const { ctx, page, errors } = await open();
    const r = await calc(page, e.g, e.m, 1);
    const pub = e.total ?? (e.np + e.hi + e.ltc + e.ei + e.it + e.lt);
    const diff = Math.abs(r.total - pub);
    assert.ok(diff <= Math.max(3000, pub * 0.01), `${e.name}: 계산 ${r.total} / 공개 ${pub} / 차이 ${diff}`);
    if (e.np != null) { // 4대보험은 고시 요율 그대로라 10원 단위까지 맞아야 한다 (고용보험은 사이트마다 1원 절사 차이)
      assert.equal(r.np, e.np); assert.equal(r.hi, e.hi); assert.equal(r.ltc, e.ltc); assert.ok(Math.abs(r.ei - e.ei) <= 10);
    }
    assert.equal(r.net, r.gross - r.total);
    noErrors(errors); await ctx.close();
  });
}

test('2. 경계: 최저임금 월 2,156,880원', async () => {
  const { ctx, page, errors } = await open();
  const r = await calc(page, 2156880, 200000, 1);
  assert.equal(r.base, 1956880);
  assert.equal(r.np, 92910);           // 기준소득월액 1,956,000 x 4.75%
  assert.equal(r.hi, 70340);           // 1,956,880 x 7.19% = 140,690 의 절반
  assert.equal(r.ei, 17610);
  assert.ok(r.it >= 0 && r.it < 60000, '소득세는 작아야 한다: ' + r.it);
  assert.equal(r.lt, Math.floor(r.it * 0.1 / 10) * 10);
  assert.ok(r.total / r.gross > 0.08 && r.total / r.gross < 0.12, '공제율 8~12%: ' + r.total / r.gross);
  noErrors(errors); await ctx.close();
});

test('3. 경계: 월 1,000만원은 국민연금 상한 659만원이 적용된다', async () => {
  const { ctx, page, errors } = await open();
  const r = await calc(page, 10000000, 200000, 1);
  assert.equal(r.np, 313020);          // 기준소득월액이 6,590,000 으로 묶임 x 4.75%
  const r2 = await calc(page, 12000000, 200000, 1);
  assert.equal(r2.np, 313020, '더 벌어도 국민연금은 같다');
  assert.ok(r.hi > 340000 && r.ltc > 40000, '건강보험은 상한이 없는 수준');
  assert.ok(r.it > 1000000 && r.it < 2000000, '소득세 범위: ' + r.it);
  assert.ok(r2.net > r.net, '월급이 늘면 실수령도 는다');
  noErrors(errors); await ctx.close();
});

test('4. 입력 방어: 식대 상한 20만, 식대가 월급보다 큰 경우, 0원, 부양가족 늘리면 소득세 감소', async () => {
  const { ctx, page, errors } = await open();
  const a = await calc(page, 3000000, 500000, 1);
  assert.equal(a.meal, 200000, '식대 비과세는 20만원까지');
  const b = await calc(page, 150000, 200000, 1);
  assert.equal(b.meal, 150000); assert.equal(b.total, 0); assert.equal(b.net, 150000);
  const z = await calc(page, 0, 0, 1);
  assert.equal(z.net, 0);
  const f1 = await calc(page, 3000000, 200000, 1), f2 = await calc(page, 3000000, 200000, 2), f3 = await calc(page, 3000000, 200000, 3);
  assert.ok(f1.it > f2.it && f2.it > f3.it, `부양가족이 많을수록 소득세가 줄어든다: ${f1.it} > ${f2.it} > ${f3.it}`);
  assert.equal(f1.np, f3.np);
  // 모든 항목이 10원 단위
  for (const k of ['np', 'hi', 'ltc', 'ei', 'it', 'lt']) assert.equal(f1[k] % 10, 0, k + ' 10원 단위');
  noErrors(errors); await ctx.close();
});

test('5. 첫 출근 체크리스트에서 계산기가 열리고 영수증이 나온다, 첫 보상 30원은 한 번만', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => { openCheck('firstjob'); });
  await page.waitForSelector('#check.on');
  const btn = page.locator('#chkbody .payentry', { hasText: '첫 월급 계산해 보기' });
  await btn.click();
  await page.waitForSelector('#paycalc:not([hidden])');
  const dlg = page.locator('#paycalc [role=dialog]');
  assert.ok(await dlg.isVisible());
  // 숫자 키패드 힌트
  assert.equal(await page.getAttribute('#pay-g', 'inputmode'), 'numeric');
  assert.equal(await page.getAttribute('#pay-m', 'inputmode'), 'numeric');
  assert.equal(await page.inputValue('#pay-m'), '200,000', '식대 기본값 20만');
  const coin0 = await page.evaluate(() => S.coin);
  await page.fill('#pay-g', '3000000');
  assert.match(await page.textContent('#pay-gh'), /300만원/, '만원 단위 힌트');
  await page.click('#pay-go');
  await page.waitForSelector('#pay-rc');
  const txt = await page.innerText('#pay-rc');
  for (const w of ['국민연금', '건강보험', '장기요양보험', '고용보험', '소득세', '지방소득세', '공제 합계', '실수령액', '2026년 요율 기준 · 추정', '간이세액표 기준 추정, 실제와 다를 수 있음']) {
    assert.ok(txt.includes(w), '영수증에 ' + w);
  }
  const exp = await calc(page, 3000000, 200000, 1);
  assert.ok(txt.includes(exp.net.toLocaleString('en-US') + '원'), '실수령액 표시 ' + exp.net);
  assert.equal(await page.evaluate(() => S.coin), coin0 + 30, '첫 보상 +30');
  await page.click('#pay-go');                       // 다시 뽑아도 보상은 없다
  assert.equal(await page.evaluate(() => S.coin), coin0 + 30);
  // 부양가족 늘리기 -> 영수증이 바로 갱신
  const before = await page.innerText('#pay-rc');
  await page.click('#pay-fp');
  const after = await page.innerText('#pay-rc');
  assert.notEqual(before, after);
  assert.equal(await page.textContent('#pay-fv'), '2');
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#paycalc').isHidden());
  // 저장: 다시 열면 지난 입력이 그대로
  await page.evaluate(() => openPayCalc());
  assert.equal(await page.inputValue('#pay-g'), '3,000,000');
  assert.equal(await page.textContent('#pay-fv'), '2');
  noErrors(errors); await ctx.close();
});

test('6. 백과 탭에도 계산기 진입점이 있다', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => render('wiki'));
  const card = page.locator('#wikibody [data-tool=salary]');
  await card.waitFor();
  await card.click();
  await page.waitForSelector('#paycalc:not([hidden])');
  assert.ok(await page.locator('#pay-go').isVisible());
  noErrors(errors); await ctx.close();
});

test('7. 공유 문구에 결과와 링크가 들어 있다', async () => {
  const { ctx, page, errors } = await open();
  await page.evaluate(() => { window.__shared = null; navigator.share = (d) => { window.__shared = d; return Promise.resolve(); }; });
  await page.evaluate(() => { openCheck('firstjob'); });
  await page.click('#chkbody .payentry');
  await page.fill('#pay-g', '2500000');
  await page.click('#pay-go');
  await page.click('#pay-sh');
  const d = await page.evaluate(() => window.__shared);
  assert.ok(d && d.text, '공유가 호출됨');
  const base = await page.evaluate(() => SHARE_BASE);
  assert.ok(d.text.includes(base), '공유 링크');
  const exp = await calc(page, 2500000, 200000, 1);
  assert.ok(d.text.includes('실수령액 ' + exp.net.toLocaleString('en-US') + '원'));
  assert.ok(d.text.includes('국민연금') && d.text.includes('지방소득세') && d.text.includes('추정'));
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(d.text), '이모지 없음');
  noErrors(errors); await ctx.close();
});
