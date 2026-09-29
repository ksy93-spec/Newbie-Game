// 안드로이드 셸이 웹뷰에 주입하는 브릿지 스크립트를 실제 게임 HTML 위에서 검사한다.
// 웹뷰와 같은 조건으로 https://newbie-quest.app/ 주소에 게임을 올리고(page.route),
// window.ReactNativeWebView 를 흉내 내서 네이티브로 가는 메시지를 모은다.
// 실행: npm test  (PLAYWRIGHT_BROWSERS_PATH 가 없으면 /opt/pw-browsers 를 쓴다)
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
const { buildBeforeScript, AFTER_SCRIPT, BASE_URL, SAVE_KEY } = await import('../src/bridge/injected.mjs');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = fs.readFileSync(path.resolve(here, '../prototype/newbie-quest-demo.html'), 'utf8');

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

/** 게임을 웹뷰처럼 열어 page 와 네이티브로 간 메시지 목록을 돌려준다 */
async function open({ mirror = null, seed = null, insets, clock = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route(BASE_URL + '**', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: GAME }));
  if (clock) await page.clock.install();
  await page.addInitScript(() => {
    window.__posts = [];
    window.ReactNativeWebView = { postMessage: (m) => window.__posts.push(JSON.parse(m)) };
  });
  if (seed != null) await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) {} }, [SAVE_KEY, seed]);
  await page.addInitScript(buildBeforeScript({ mirror, insets }));
  await page.goto(BASE_URL + '#nointro');
  await page.waitForFunction(() => typeof window.showAd === 'function' && window.S);
  await page.evaluate(AFTER_SCRIPT);   // 앱의 injectedJavaScript(로드 뒤)와 같은 문자열
  const posts = (type) => page.evaluate((t) => window.__posts.filter((m) => !t || m.type === t), type);
  return { ctx, page, errors, posts };
}

test('전제: 게임의 showAd/save/toast 는 전역 함수 선언이라 window 로 덮어쓸 수 있다', async () => {
  const { ctx, page, errors } = await open();
  const r = await page.evaluate(() => ({
    showAdWrapped: window.showAd.__nq === 1,
    saveWrapped: window.save.__nq === 1,
    toastIsFn: typeof toast === 'function',
  }));
  assert.deepEqual(r, { showAdWrapped: true, saveWrapped: true, toastIsFn: true });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('(a) 광고: doAct 가 showAd 를 부르면 ad_request 가 가고, 보상 true 일 때만 콜백이 돈다', async () => {
  const { ctx, page, posts } = await open();
  await page.evaluate(() => { window.__cb = 0; });
  const act = () => page.evaluate(() => {
    doAct('t' + Math.random(), { ad: true, d: { energy: 5 }, msg: '보상' }, () => { window.__cb++; });
  });
  // 보상 받음
  await act();
  let reqs = await posts('ad_request');
  assert.equal(reqs.length, 1);
  assert.match(reqs[0].id, /^ad/);
  assert.equal(await page.evaluate(() => document.querySelector('.adwrap')), null, '가짜 광고 화면이 뜨면 안 된다');
  await page.evaluate((id) => window.__nqAdResult(id, true), reqs[0].id);
  assert.equal(await page.evaluate(() => window.__cb), 1);
  assert.equal(await page.evaluate(() => S.adN), 1);
  // 보상 없음: 콜백도 광고 횟수(쿨다운)도 소모하지 않고 토스트만
  await act();
  reqs = await posts('ad_request');
  assert.equal(reqs.length, 2);
  await page.evaluate((id) => window.__nqAdResult(id, false), reqs[1].id);
  assert.equal(await page.evaluate(() => window.__cb), 1);
  assert.equal(await page.evaluate(() => S.adN), 1);
  assert.equal(await page.evaluate(() => document.getElementById('htoast').textContent), '지금은 광고가 없어요');
  // 늦게 온 결과·엉뚱한 id 는 무시
  await page.evaluate((id) => { window.__nqAdResult(id, true); window.__nqAdResult('nope', true); }, reqs[1].id);
  assert.equal(await page.evaluate(() => window.__cb), 1);
  await ctx.close();
});

test('(a2) 광고: 네이티브가 응답이 없어도 9초면 보상 없이 끝나고, 뜬 뒤에는 8초가 지나도 결과를 기다린다', async () => {
  const { ctx, page, posts } = await open({ clock: true });
  await page.evaluate(() => { window.__cb = 0; });
  const act = () => page.evaluate(() => {
    doAct('t' + Math.random(), { ad: true, d: {}, msg: 'x' }, () => { window.__cb++; });
  });
  await act();
  await page.clock.fastForward(9100);
  assert.equal(await page.evaluate(() => window.__cb), 0);
  assert.equal(await page.evaluate(() => S.adN || 0), 0);
  assert.equal(await page.evaluate(() => document.getElementById('htoast').textContent), '지금은 광고가 없어요');
  // 뜬 경우
  await act();
  const reqs = await posts('ad_request');
  assert.equal(reqs.length, 2);
  await page.evaluate((id) => window.__nqAdShown(id), reqs[1].id);
  await page.clock.fastForward(60000);          // 광고를 보는 중
  assert.equal(await page.evaluate(() => window.__cb), 0);
  await page.evaluate((id) => window.__nqAdResult(id, true), reqs[1].id);
  assert.equal(await page.evaluate(() => window.__cb), 1);
  await ctx.close();
});

test('(a3) 광고: 요청 중에 또 누르면 두 번째 요청은 만들지 않는다', async () => {
  const { ctx, page, posts } = await open();
  await page.evaluate(() => { showAd(() => {}); showAd(() => {}); });
  assert.equal((await posts('ad_request')).length, 1);
  await ctx.close();
});

test('(b) save() 를 부르면 저장 JSON 이 네이티브로 가고, 연속 호출은 묶인다', async () => {
  const { ctx, page, posts } = await open();
  await page.waitForTimeout(1200);              // 시작 때 밀린 미러 정리
  const before = (await posts('save')).length;
  await page.evaluate(() => { S.coin = 4242; for (let i = 0; i < 20; i++) save(); });
  await page.waitForFunction((n) => window.__posts.filter((m) => m.type === 'save').length > n, before, { timeout: 3000 });
  const saves = await posts('save');
  const last = saves[saves.length - 1];
  assert.equal(typeof last.data, 'string');
  assert.equal(JSON.parse(last.data).coin, 4242);
  assert.equal(saves.length - before, 1, '20번 불러도 1초 안에는 한 번만 보낸다');
  // 미러 크기 참고: AsyncStorage 는 한 항목 2MB 안쪽이어야 안전하다
  console.log('  저장 JSON 크기', last.data.length, '바이트');
  assert.ok(last.data.length < 500_000);
  await ctx.close();
});

test('(c) 미러 복원: 저장이 비어 있으면 복원하고, 이미 있으면 덮어쓰지 않는다', async () => {
  const make = async (coin) => {
    const { ctx, page } = await open();
    const raw = await page.evaluate((c) => { S.coin = c; save(); return localStorage.getItem('nq.v8'); }, coin);
    await ctx.close();
    return raw;
  };
  const rawA = await make(12345);
  const rawB = await make(777);
  // 비어 있음 -> 복원
  let t = await open({ mirror: rawA });
  assert.equal(await t.page.evaluate(() => S.coin), 12345);
  await t.ctx.close();
  // 이미 있음 -> 그대로
  t = await open({ mirror: rawA, seed: rawB });
  assert.equal(await t.page.evaluate(() => S.coin), 777);
  await t.ctx.close();
  // 미러도 없음 -> 새로 시작
  t = await open({ mirror: null });
  assert.equal(await t.page.evaluate(() => S.coin), 150);
  await t.ctx.close();
});

test('(d) 뒤로가기: 위에 뜬 것부터 닫고, 닫을 게 없으면 false', async () => {
  const { ctx, page, posts } = await open();
  const back = () => page.evaluate(() => window.__nqBack());
  const hidden = (id) => page.evaluate((i) => document.getElementById(i).hidden, id);
  // 처음: 온보딩 화면 -> 닫을 것 없음
  assert.equal(await back(), false);
  // 자세히 보기 창
  await page.evaluate(() => openTip('<span class="inm">시험</span>', null, [{ t: '닫기', f: closeTip }]));
  assert.equal(await hidden('itip'), false);
  assert.equal(await back(), true);
  assert.equal(await hidden('itip'), true);
  // 대화 상자
  await page.evaluate(() => { go('home'); talkTo({ name: '시험', face: null, lines: ['하나', '둘'] }); });
  assert.equal(await hidden('htutor'), false);
  assert.equal(await back(), true);
  assert.equal(await hidden('htutor'), true);
  // 백과 화면 -> 홈으로
  await page.evaluate(() => go('wiki'));
  assert.equal(await back(), true);
  assert.equal(await page.evaluate(() => document.querySelector('.screen.on').id), 'home');
  // 퀘스트 화면 -> 나가기 버튼과 같은 동작
  await page.evaluate(() => go('quest'));
  assert.equal(await back(), true);
  assert.equal(await page.evaluate(() => document.querySelector('.screen.on').id), 'home');
  // 홈에서는 처리 안 함 -> 네이티브가 "한 번 더 누르면 종료"
  assert.equal(await back(), false);
  // 네이티브가 부르는 요청 함수는 결과 메시지로 답한다
  await page.evaluate(() => window.__nqBackRequest());
  assert.deepEqual((await posts('back_result')).pop(), { type: 'back_result', handled: false });
  await ctx.close();
});

test('(e) 외부 링크: target=_blank 클릭과 window.open 은 네이티브로 넘기고 페이지는 그대로', async () => {
  const { ctx, page, posts } = await open();
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.id = 'xl'; a.href = 'https://www.gov.kr/portal/main'; a.target = '_blank'; a.textContent = '정부24';
    a.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;width:80px;height:40px;background:#fff';
    document.body.appendChild(a);
  });
  await page.click('#xl');
  const r = await page.evaluate(() => window.open('https://example.com/x?y=1'));
  assert.equal(r, null);
  await page.evaluate(() => window.open('/local/path'));   // 같은 origin 은 넘기지 않는다
  const opens = await posts('open_url');
  assert.deepEqual(opens.map((m) => m.url), ['https://www.gov.kr/portal/main', 'https://example.com/x?y=1']);
  assert.equal(page.url(), BASE_URL + '#nointro');
  await ctx.close();
});

test('공유: navigator.share 는 네이티브 공유로, 파일 공유는 거부하고 canShare 는 false', async () => {
  const { ctx, page, posts } = await open();
  await page.evaluate(() => navigator.share({ title: 't', text: '체크리스트 본문' }));
  const s = await posts('share');
  assert.equal(s.length, 1);
  assert.equal(s[0].text, '체크리스트 본문');
  const r = await page.evaluate(async () => {
    const f = new File(['x'], 'a.png', { type: 'image/png' });
    let rejected = false;
    try { await navigator.share({ files: [f] }); } catch (e) { rejected = true; }
    return { can: navigator.canShare({ files: [f] }), rejected };
  });
  assert.deepEqual(r, { can: false, rejected: true });
  assert.equal((await posts('share')).length, 1);
  await ctx.close();
});

test('알림: 설정에 "출석 알림" 줄이 없다(효과음·진동은 남는다)', async () => {
  const { ctx, page } = await open();
  const txt = await page.evaluate(() => { renderSettings(); return document.getElementById('csettings').textContent; });
  assert.ok(!txt.includes('출석 알림'), txt);
  assert.ok(txt.includes('효과음'));
  await ctx.close();
});

test('안전 영역: 변수가 들어가고 #app 에 여백이 생기며, 나중에 바꿀 수 있다', async () => {
  const { ctx, page } = await open({ insets: { top: 30, bottom: 20, left: 0, right: 0 } });
  const pad = () => page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('app'));
    return [cs.paddingTop, cs.paddingBottom];
  });
  assert.deepEqual(await pad(), ['30px', '20px']);
  await page.evaluate(() => window.__nqSetInsets({ top: 48, bottom: 0, left: 0, right: 0 }));
  assert.deepEqual(await pad(), ['48px', '0px']);
  await ctx.close();
});

test('설치는 여러 번 불러도 이중으로 감싸지 않는다', async () => {
  const { ctx, page, posts } = await open();
  await page.evaluate((s) => { window.eval(s); window.eval(s); window.__nqInstall(); }, AFTER_SCRIPT);
  await page.waitForTimeout(1200);
  const before = (await posts('save')).length;
  await page.evaluate(() => { S.coin += 1; save(); });
  await page.waitForTimeout(1300);
  assert.equal((await posts('save')).length - before, 1);
  await ctx.close();
});
