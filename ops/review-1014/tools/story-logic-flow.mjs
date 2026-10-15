// 인생 모드 이야기 순서를 실제 컷신으로 넘기며 본다(리뷰 1014 story-logic).
// 실행(저장소 루트): node ops/review-1014/tools/story-logic-flow.mjs [html 경로]
// 카드 둘: 자취 4년제(학생 때 첫 월세), 기숙사 4년제(졸업·취업 때 기숙사를 나감). 저절로 뜬 컷신의 제목과 그때 나이·신분·거처를 적는다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
import { playCine } from '../../../tests/cine.mjs';
const { chromium } = await import('playwright');
const BASE = url.pathToFileURL(path.resolve(process.argv[2] || 'prototype/newbie-quest-demo.html')).href;
const browser = await chromium.launch();

async function run(name, want, setup, act) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
  const page = await ctx.newPage(); const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(([want, setup]) => {
    const ok = new Function('q', 'return ' + want);
    lifeNew(); let p; for (let i = 0; i < 5000; i++) { p = lifeGen(lifeSeedNew()); if (ok(p)) break; }
    S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.tut = 1; S.tuts = ['intro'];
    S.first = dayKey(); const C = csS(); C.seen.firstq = dayKey(); C.day = dayKey(); C.n = 1;   // 첫 단추는 오늘 봤다
    S.coin = 900; S.stats.ju = 40;
    for (let i = 0; i < 3; i++) { S.done.push('zz' + i); const g = tierGrow(); if (g && g.wasTop) tierMove(S.peak); }
    S.life.st = { m22: 1 }; S.life.anch = { age: 23, done: lifeActs() }; lifeTick();
    new Function(setup)(); save(); render('home'); if (TUT) endTalk(); closeTip();
  }, [want, setup]);
  console.log(name, 'setup', JSON.stringify(await page.evaluate(() => ({ rent: S.rent, peak: S.peak, tier: S.tier, paid: S.paid, coin: S.coin, idle: mqIdle(), rd: S.rentDone }))));
  if (act) await page.evaluate(act);
  await page.waitForTimeout(2500); console.log(name, 'dbg', JSON.stringify(await page.evaluate(() => ({ rent: S.rent, t: !!rentPlay.t, idle: mqIdle(), mqp: typeof MQP, wmqp: typeof window.MQP, tut: !!TUT, place: !!PLACE, move: !!MOVE, tip: document.getElementById('itip').hidden, scr: [...document.querySelectorAll('.on')].map((e) => e.id).join(',') }))));
  const seen = [];
  for (let n = 0; n < 6; n++) {
    try { await page.waitForFunction(() => { if (TUT && !window.MQP) endTalk(); const tp = document.getElementById('itip'); if (!window.MQP && tp && !tp.hidden) closeTip(); return !!window.MQP; }, null, { timeout: 9000, polling: 300 }); } catch (e) { break; }
    seen.push(await page.evaluate(() => ({ cine: MQP.o.title, age: S.life.age, status: S.status, tier: TIERS[S.tier].name })));
    await playCine(page, Array(20).fill(0), { timeout: 30000 });
  }
  const end = await page.evaluate(() => ({ age: S.life.age, status: S.status, tier: TIERS[S.tier].name, q: csS().q.map((e) => e.id), hud: document.getElementById('htier').textContent }));
  console.log(name, JSON.stringify({ seen, end, logs }));
  await ctx.close();
}
await run('자취4년제', "q.living==='자취'&&q.income!=='넉넉'&&q.path==='4년제'", '', "rentAuto()");
await run('기숙사4년제', "q.living==='기숙사'&&q.path==='4년제'", 'S.stats.ju=40; S.peak=6;',
  "lifeBeforeCh('job', function(){ S.mq.done.job='good'; lifeTick(); save(); render('home'); rentAuto(); })");
await browser.close();
