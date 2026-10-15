// 인생 모드 이야기 순서 점검(리뷰 1014 story-logic). 카드 종류별로 상태를 만들고 게임 함수를 직접 불러 모순을 잰다.
// 실행(저장소 루트): node ops/review-1014/tools/story-logic-check.mjs [html 경로] [결과 json]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
const { chromium } = await import('playwright');

const html = path.resolve(process.argv[2] || 'prototype/newbie-quest-demo.html');
const out = process.argv[3] || 'ops/review-1014/tools/out/story-logic.json';
const BASE = url.pathToFileURL(html).href;

const browser = await chromium.launch();
async function open(w = 390, h = 844) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  // 공용 도우미: 카드 찾기, 나이 맞추기, 퀘스트 하나 끝낸 것처럼 거처 올리기
  await page.evaluate(() => {
    window.__mk = (want) => {
      lifeNew(); let p = null;
      for (let i = 0; i < 5000; i++) { const q = lifeGen(lifeSeedNew()); if (want(q)) { p = q; break; } }
      S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.tut = 1; S.tuts = ['intro']; save(); return p; };
    window.__age = (n) => { S.life.st = S.life.st || {}; LIFE_STAGES.forEach((st) => { if (st.age <= n && st.id !== 'end') S.life.st[st.id] = 1; });
      S.life.anch = { age: n, done: lifeActs() }; lifeTick(); return S.life.age; };
    window.__q = () => { S.done.push('zz' + S.done.length); const gr = tierGrow(); const mv = gr && gr.wasTop ? tierMove(S.peak) : null; lifeTick(); return mv; };
    window.__st = () => ({ age: S.life.age, status: S.status, tier: TIERS[S.tier].name, peak: S.peak, paid: S.paid, lease: S.lease ? S.lease.to : null, rent: !!S.rent, nest: lifeNest() });
    window.__evs = () => { const ids = new Set(); for (let m = 1; m <= 12; m++) LIFE_EV.forEach((e) => { if (lifeEvOk(e, m)) ids.add(e.id); }); return [...ids]; };
  });
  return { ctx, page, logs };
}
const R = { html, cases: {} };

// 1. 자취 4년제(넉넉 아님): 학생 때 첫 월세 계약, 첫 월세 방 이야기 대기, 취업 전 전세
{
  const { ctx, page, logs } = await open();
  R.cases.solo = await page.evaluate(() => {
    const p = __mk((q) => q.living === '자취' && q.income !== '넉넉' && q.path === '4년제');
    const o = { card: [p.living, p.path, p.band, p.income], start: __st() };
    __age(23); S.stats.ju = 40; S.coin = 800; S.lv = 5;
    const mvs = []; for (let i = 0; i < 3 && !S.rent; i++) mvs.push(__q()); o.at23 = Object.assign(__st(), { mvs });
    const sc = typeof rentScenesFit === 'function' ? rentScenesFit() : rentScenes(); o.rentLast = sc[sc.length - 1].text.join(' / ');
    o.rentLastOk = sc[sc.length - 1].choice.opts[0].a;
    // 첫 단추를 오늘 이미 봤다고 친다(실제 판과 같음)
    S.first = dayKey(); S.cs = S.cs || { seen: {}, q: [], pay: {} }; csS().seen.firstq = dayKey(); csS().day = dayKey(); csS().n = 1;
    if (window.MQP) MQP = null; rentEnd(7, 7); o.afterRent = __st(); o.queue = csS().q.map((e) => e.id);
    o.home6Scene3 = csFill('home6')[3].text.join(' / ');
    render('home'); if (TUT) endTalk(); closeTip(); o.idle = [mqIdle(), !!TUT, typeof MQP !== 'undefined' && !!MQP, document.getElementById('itip').hidden]; o.csTick = csTick(); o.playing = window.MQP ? MQP.o.title : null;
    if (window.MQP) { try { MQP = null; } catch (e) {} }
    o.evs23 = __evs().filter((x) => /revolving|annualfee|carins|usedcar|payslip|newhire|subscription|movein/.test(x));
    S.stats.ju = 46; S.coin = 3000; const mv2 = [__q(), __q(), __q()]; o.preJobLease = Object.assign(__st(), { mv: mv2 });
    S.status = '직장인'; S.mq.done.job = 'good'; __age(24); o.cari1At24 = fits(QUESTS.filter((q) => q.id === 'cari1')[0]);
    return o; });
  R.cases.solo.logs = logs; await ctx.close();
}
// 2. 기숙사 4년제와 기숙사 전문대: 졸업·취업 뒤에도 기숙사
for (const pathK of ['4년제', '전문대']) {
  const { ctx, page, logs } = await open();
  R.cases['dorm_' + pathK] = await page.evaluate((pathK) => {
    const p = __mk((q) => q.living === '기숙사' && q.path === pathK); S.coin = 600; S.stats.ju = 38;
    const o = { card: [p.living, p.path, p.band, p.income] }; __q(); __q();
    __age(pathK === '전문대' ? 22 : 23); o.grad = __st();
    __age(24); o.at24 = __st();
    S.mq.done.job = 'good'; lifeTick(); o.afterJob = __st();
    __age(25); o.at25 = __st();
    return o; }, pathK);
  R.cases['dorm_' + pathK].logs = logs; await ctx.close();
}
// 3. 고졸 본가: 스물둘·스물넷 글과 신분
{
  const { ctx, page, logs } = await open();
  R.cases.hs = await page.evaluate(() => {
    const p = __mk((q) => q.path === '고졸' && q.living === '본가');
    const o = { card: [p.living, p.path, p.band, p.income] };
    __age(22); o.at22 = __st(); o.y22 = lifeMidYearScenes('y22', lifeMidFlags(), 22).map((s) => s.text.join(' ')).slice(0, 2);
    __age(23); lifeBeforeCh('job', () => {}); o.y24 = window.MQP && MQP.o ? MQP.o.scenes.slice(0, 2).map((s) => s.text.join(' ')) : null; o.at24 = __st();
    return o; });
  R.cases.hs.logs = logs; await ctx.close();
}
// 4. 스물여섯 세월: 고시원에 사는데 "월세 계약이 석 달 남았다"
{
  const { ctx, page, logs } = await open();
  R.cases.y26 = await page.evaluate(() => {
    const p = __mk((q) => q.living === '자취' && q.income !== '넉넉'); S.mq.done.job = 'good'; S.status = '직장인';
    __age(25); lifeBeforeCh('lease', () => {});
    return { card: [p.living, p.path], st: __st(), sc0: window.MQP && MQP.o ? MQP.o.scenes[0].text.join(' ') : null }; });
  R.cases.y26.logs = logs; await ctx.close();
}
// 5. 늦게 깬 장, 6장 뒤 자가 아님, 퇴직 뒤 회사 사건, 결산 서랍
{
  const { ctx, page, logs } = await open();
  R.cases.late = await page.evaluate(() => {
    const p = __mk((q) => q.living === '본가');
    const o = {};
    ['job', 'lease', 'card', 'car', 'wedding', 'home'].forEach((id) => { S.mq.done[id] = 'good'; });
    S.life.yrs = { job: 24, lease: 28, card: 29, car: 31, wedding: 34, home: 39 }; S.tier = 8; S.peak = 9; S.paid = 8; S.status = '직장인';
    __age(48); o.flags48 = lifeMidFlags(); o.slot48 = lifeMidSlot(48, lifeMidFlags());
    o.drawer = lifeEndScenes('part1', p, 'light')[2].doc.rows.map((r) => r.join(' '));
    __age(57); o.evs57 = __evs().filter((x) => /nopay|overtime|annualleave|newhire|payslip|yearend/.test(x));
    return o; });
  R.cases.late.logs = logs; await ctx.close();
}
// 6. 정적 글: 퀘스트 첫마디
{
  const { ctx, page } = await open();
  R.cases.text = await page.evaluate(() => Object.fromEntries(['care1', 'ju16', 'cari1'].map((id) => { const q = QUESTS.filter((x) => x.id === id)[0]; return [id, [q.fit, q.who || q.npc || '', JSON.stringify(q).slice(0, 160)]]; })));
  await ctx.close();
}
await browser.close();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R, null, 1));
