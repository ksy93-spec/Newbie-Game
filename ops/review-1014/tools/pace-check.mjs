// 리뷰 1014 페이싱 제안이 실제 화면에서 도는지 본다(apply.mjs를 스크래치 복사본에 돌려 연다).
// 실행(저장소 루트): node ops/review-1014/tools/pace-check.mjs
// 확인: 해마다 활동 2개에 한 살, 중간 장 m22(장면 없을 때 알림만), 생활 이벤트 한 해 하나, 중간 장 m40(장면 있을 때 컷신+보상), 6장 뒤 바로 예순이 아님, 59살 몫을 채우면 예순 결산.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs'; import os from 'node:os'; import { execFileSync } from 'node:child_process';
import { playCine } from '../../../tests/cine.mjs';

const TMP = process.env.TMPDIR_PACE || fs.mkdtempSync(path.join(os.tmpdir(), 'pace-'));
const HTML = path.join(TMP, 'plan.html');
execFileSync('node', ['ops/review-1014/pacing/apply.mjs', HTML], { stdio: 'inherit' });
const IMG = 'ops/review-1014/img'; fs.mkdirSync(IMG, { recursive: true });
const b = await chromium.launch();
// 시작 안내(할배 말풍선)가 떠 있으면 탭으로 닫는다
async function shut(page) { for (let i = 0; i < 60; i++) { const v = await page.evaluate(() => { const e = document.getElementById('htutor'); return e && !e.hidden ? document.querySelectorAll('#htutorop:not([hidden]) .topt').length : -1; });
  if (v < 0) break; if (v) await page.locator('#htutorop .topt').last().click(); else await page.locator('#htutor').click({ position: { x: 20, y: 20 } }); await page.waitForTimeout(150); } }
const out = {};
for (const [w, h] of [[360, 640], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const logs = [];
  page.on('pageerror', e => logs.push('pageerror: ' + e)); page.on('console', m => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(url.pathToFileURL(HTML).href + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  const r = {};
  // 인생 시작(카드 하나, 컷신 없이)
  await page.evaluate(() => { lifeNew(true); const p = lifeGen(lifeSeedNew()); S.life.prof = p; S.life.seed = p.seed; S.life.rolls = 1; birthApply(); S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.prologue = 0; save(); go('home'); render('home'); hudRefresh(); });
  await page.waitForTimeout(1500); await shut(page);
  r.a20 = await page.evaluate(() => S.life.age);
  r.a21 = await page.evaluate(() => { S.done.push('stu1', 'stu2'); lifeTick(); return S.life.age; });
  r.a21cap = await page.evaluate(() => { S.done.push('job1', 'job3'); lifeTick(); return [S.life.age, lifeAgeRaw()]; });
  r.jobWait = await page.evaluate(() => mqWait(mqById('job')) || '');
  await page.evaluate(() => render('home')); await page.waitForTimeout(2500); await shut(page);
  r.m22 = await page.evaluate(() => [lifeStageDone('m22'), S.life.age, document.getElementById('hnm').textContent]);
  // 생활 이벤트: 한 해 하나
  r.ev = await page.evaluate(() => { maybeLifeEvent(); const e = document.getElementById('htutor'); return { open: !!(e && !e.hidden), evn: S.life.evn, evAge: S.life.evAge, age: S.life.age }; });
  await shut(page);
  r.ev2 = await page.evaluate(() => { const n = S.life.evn; maybeLifeEvent(); const e = document.getElementById('htutor'); return { open: !!(e && !e.hidden), same: S.life.evn === n }; });
  await shut(page);
  // 6장까지 끝, 30·34 중간 장 끝, 39살 → 40살 몫을 채우면 m40 컷신(장면은 임시로 y37을 빌린다)
  await page.evaluate(() => { MQ_LIST.forEach(c => { mqS().done[c.id] = 'good'; }); S.life.st = { m22: 1, m30: 1, m34: 1 }; S.status = '직장인'; S.life.anch = { age: 39, done: lifeActs() }; lifeTick();
    LIFE_YEARS.y40 = Object.assign({}, LIFE_YEARS.y37, { sub: '마흔(임시 장면)' }); render('home'); });
  await page.waitForTimeout(1500); await shut(page);
  r.after6 = await page.evaluate(() => ({ over: S.life.over, age: S.life.age, endReady: lifeEndReady() }));
  r.m40 = await page.evaluate(() => { S.life.evn = (S.life.evn || 0) + 2; lifeTick(); render('home'); return lifeAgeRaw(); });
  await page.waitForFunction(() => !!window.MQP, null, { timeout: 6000 }).catch(() => {});
  for (let i = 0; i < 40; i++) { const t = await page.evaluate(() => window.MQP ? (MQP.list()[MQP.cur()] || {}).type || 'scene' : null); if (!t) break; if (t === 'reward') { await page.waitForTimeout(1200); await page.screenshot({ path: `${IMG}/pacing-m40-reward-${w}.png` }); r.reward = true; }
    await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(250); }
  await page.waitForFunction(() => !document.getElementById('opening'), null, { timeout: 6000 }).catch(() => {});
  r.m40done = await page.evaluate(() => [lifeStageDone('m40'), S.life.age, S.lv]);
  // 59살 몫을 채우면 예순 결산
  await page.evaluate(() => { S.life.st = Object.assign(S.life.st, { m45: 1, m50: 1, m55: 1 }); S.life.anch = { age: 59, done: lifeActs() }; lifeTick(); S.life.evn += 2; render('home'); });
  await page.waitForTimeout(2000);
  await playCine(page, [], { timeout: 30000 }).catch(e => logs.push('cine ' + e));
  await page.waitForSelector('#itip:not([hidden]) .lcard', { timeout: 8000 }).catch(() => {});
  r.end = await page.evaluate(() => ({ over: S.life.over, age: S.life.age, card: !!document.querySelector('#itip:not([hidden]) .lcard') }));
  await page.screenshot({ path: `${IMG}/pacing-end-${w}.png` });
  r.logs = logs; out[w] = r; console.log(w + 'x' + h, JSON.stringify(r));
  await ctx.close();
}
await b.close();
