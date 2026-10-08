// 긴 플레이: 신분 하나로 여러 날을 산다. 하루마다 날짜를 하루 민다(Date 심).
// 퀘스트는 창구까지 걸어가 실제 버튼으로 푼다. 배고픔·체력은 하루 시작마다 채운다(편의점 왕복 생략).
// 메인 퀘스트는 칩을 눌러 컷신을 넘긴다. 보스·사건은 지도의 자리까지 걸어가 말을 건다. 상점에서 사고 캐릭터에서 낀다.
// 사용: node ops/review-1008/tools/qa-02-longplay.mjs 직장인 [days] [view]
import { open, closeBrowser, shot, sleep, screen, GAME, playQuest, clearOverlays, walkToQuest, walkToSpot, openQuests, refill, seed, installDateShim, playCine, finishTalk, VIEWS } from './qa-lib.mjs';
import fs from 'node:fs';

const status = process.argv[2] || '직장인';
const DAYS = +(process.argv[3] || 14);
const view = process.argv[4] || 'm';
const tag = { 대학생: 'stu', 취준생: 'job', 직장인: 'work' }[status];
const R = { status, days: [], issues: [], errors: [], mem: [] };
const issue = (s) => { R.issues.push(s); console.log('ISSUE', s); };
const log = (s) => console.log(tag, s);

const b = (await import('./qa-lib.mjs'));
const brw = await b.getBrowser();
const v = VIEWS[view];
const ctx = await brw.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.dsf, hasTouch: true, isMobile: true, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
const page = await ctx.newPage();
const logs = [];
page.on('pageerror', (e) => { logs.push('pageerror: ' + (e.stack || e).toString().split('\n').slice(0, 3).join(' | ')); console.log('PAGEERROR', e.message); });
page.on('console', (m) => { if (m.type() === 'error') { logs.push('console.error: ' + m.text()); console.log('CONSOLEERR', m.text()); } });
await installDateShim(page);
await page.goto(GAME);
await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
await seed(page, status);
const DAY = 86400000;

async function mem() {
  try { const c = await ctx.newCDPSession(page); await c.send('HeapProfiler.collectGarbage'); const r = await c.send('Runtime.getHeapUsage'); await c.detach(); return Math.round(r.usedSize / 1e6 * 10) / 10; } catch (e) { return null; }
}
async function counts() { return page.evaluate(() => ({ dom: document.getElementsByTagName('*').length, canv: document.getElementsByTagName('canvas').length, log: S.log.length, saveKB: Math.round(localStorage.getItem('nq.v8').length / 1024) })); }

async function handleAnnounce(pick = 0) {
  // 할배 알림이 떠 있으면 고른다
  const nm = await page.evaluate(() => window.TUT && TUT.name);
  if (!nm) return false;
  await finishTalk(page, pick);
  await sleep(300);
  if (await page.evaluate(() => !!window.MQP)) { await playMQ(); }
  return true;
}
async function playMQ() {
  const picks = Array.from({ length: 30 }, () => Math.floor(Math.random() * 3));
  try { await playCine(page, picks.map((p) => p % 3), { timeout: 30000 }); } catch (e) { issue('cine: ' + e.message); await page.evaluate(() => { while (window.MQP) { const p = MQP.list()[MQP.cur()]; if (p && p.choice && MQP.picked === null) MQP.pick(0); else MQP.next({ type: 'test' }); if (window.__g = (window.__g || 0) + 1, window.__g > 400) break; } }); }
  await sleep(1200);
}

async function mainQuest() {
  for (let k = 0; k < 10; k++) {
    const st = await page.evaluate(() => { const c = mqNext(); const el = document.getElementById('hmq'); return { id: c && c.id, ready: c && mqReady(c), leasing: mqLeasing(), chip: el.hidden ? null : el.innerText.replace(/\n/g, ' '), done: Object.keys(S.mq.done) }; });
    if (!st.id || (!st.ready && !st.leasing)) return st;
    log('MQ ' + st.id + ' chip=' + st.chip);
    if (!st.chip) { issue('MQ ' + st.id + ' ready but chip hidden'); return st; }
    const scr0 = await screen(page);
    if (scr0 !== 'home') { await page.click('#tab-' + scr0 + ' .tab >> nth=0').catch(() => {}); }
    await page.click('#hmq');
    await sleep(700);
    if (await page.evaluate(() => !!window.MQP)) await playMQ();
    // 전세 계약(2장): 사건 화면들
    for (let j = 0; j < 30; j++) {
      const s = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, mqp: !!window.MQP, tut: !!window.TUT, tip: !document.getElementById('itip').hidden }));
      if (s.mqp) { await playMQ(); continue; }
      if (s.scr === 'ep') {
        const nx = await page.$('#epnext:not([hidden])');
        if (nx) { await nx.click(); await sleep(200); continue; }
        await page.evaluate(() => typeSkip());
        const ch = await page.$('#epchoices:not([hidden]) .choice:not([disabled])');
        if (ch) { const all = await page.$$('#epchoices .choice'); await all[0].click(); await sleep(200); continue; }
        await sleep(200); continue;
      }
      if (s.scr === 'epend') { await shot(page, '02-' + tag + '-lease-end'); await page.click('#eeback'); await sleep(1500); continue; }
      if (s.tut) { await finishTalk(page, 0); continue; }
      if (s.tip) { const tx = await page.evaluate(() => document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 120)); log('sheet ' + tx); await page.evaluate(() => closeTip()); await sleep(300); continue; }
      break;
    }
    const after = await page.evaluate(() => ({ done: Object.keys(S.mq.done), leasing: mqLeasing(), lease: S.lease && { ch: S.lease.ch, b: S.lease.b }, chip: document.getElementById('hmq').innerText.replace(/\n/g, ' '), map: ME.map }));
    log('MQ after ' + JSON.stringify(after));
    if (after.leasing) {
      // 칩을 다시 눌러 다음 장소로
      const where = after.chip;
      await page.click('#hmq'); await sleep(1500);
      const s2 = await page.evaluate(() => ({ map: ME.map, scr: document.querySelector('.screen.on').id, mqp: !!window.MQP, toast: document.getElementById('htoast').hidden ? '' : document.getElementById('htoast').textContent }));
      log('lease chip tap -> ' + JSON.stringify(s2) + ' (chip ' + where + ')');
      if (s2.mqp) { await playMQ(); await sleep(800); await clearOverlays(page); continue; }
      // 칩이 장소로 보내 주면, 그 자리까지 걷는다
      if (s2.scr === 'home' && !s2.mqp) {
        const sp = await page.evaluate(() => { const c = leaseCh(); if (!c) return null; const p = leasePlace(c.place); let hit = null; Object.keys(MAPS).forEach((k) => (MAPS[k].spots || []).forEach((s) => { if (s.kind === 'lease' && s.place === p && (!s.pick || s.pick === S.lease.pick) && !hit) hit = { k, x: s.x, y: s.y, place: p, pick: s.pick }; })); return hit; });
        if (!sp) { issue('lease: leaseCh 장소를 못 찾음 ' + JSON.stringify(after)); return after; }
        const r = await page.evaluate((sp) => { const m = curMap(); if (ME.map !== sp.k) return 'chip left us on ' + ME.map + ' but scene is at ' + sp.k; const s = (m.spots || []).find((x) => x.kind === 'lease' && x.place === sp.place && (!x.pick || x.pick === sp.pick)); const nr = Math.abs(s.x - ME.tx) + Math.abs(s.y - ME.ty) <= 1 ? { x: ME.tx, y: ME.ty } : adjacentTo(m, s); if (!nr) return 'no adj'; goTo(nr.x, nr.y, () => { faceSpot(s); triggerSpot(s); }); return 'go'; }, sp);
        if (r !== 'go') { log('lease walk: ' + r); }
        await sleep(2500);
      }
    }
    if (after.done.length === st.done.length && !after.leasing) { issue('MQ ' + st.id + ' did not complete: ' + JSON.stringify(after)); return after; }
  }
}

async function bossFight() {
  const ready = await page.evaluate(() => BOSSES.filter((b) => bossReady(b) && !bossCleared(b.id)).map((b) => b.id));
  for (const id of ready) {
    await refill(page);
    const r = await walkToSpot(page, 'boss', id);
    log('boss ' + id + ' -> ' + JSON.stringify(r));
    if (!r.ok || r.screen !== 'home' && r.screen !== 'boss') { /* wipe 중일 수 있다 */ }
    try { await page.waitForFunction(() => document.getElementById('boss').classList.contains('on'), null, { timeout: 4000 }); } catch (e) { issue('boss ' + id + ' not started: ' + JSON.stringify(r)); continue; }
    await page.waitForFunction(() => !document.getElementById('bnext').hidden, null, { timeout: 15000 });
    await shot(page, '02-' + tag + '-boss-' + id);
    await page.click('#bnext');
    for (let i = 0; i < 20; i++) {
      if (await screen(page) !== 'boss') break;
      await page.evaluate(() => typeSkip());
      await page.waitForFunction(() => !document.getElementById('bchoices').hidden || !document.getElementById('bnext').hidden, null, { timeout: 8000 });
      const ok = await page.evaluate(() => FIGHT.b.qs[FIGHT.i] && FIGHT.b.qs[FIGHT.i].ok);
      const ch = await page.$(`#bchoices:not([hidden]) .choice[data-orig="${ok}"]:not([disabled])`);
      if (ch) await (Math.random() < 0.85 ? ch : (await page.$$('#bchoices .choice:not([disabled])'))[0]).click();
      await page.waitForFunction(() => !document.getElementById('bnext').hidden, null, { timeout: 8000 });
      await page.click('#bnext'); await sleep(150);
    }
    const res = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, big: document.getElementById('bebig').textContent, body: document.getElementById('bebody').innerText.slice(0, 120) }));
    log('boss result ' + JSON.stringify(res));
    await shot(page, '02-' + tag + '-bossend-' + id);
    await page.click('#beback'); await sleep(1200); await clearOverlays(page);
  }
}

async function episodes() {
  const eps = await page.evaluate(() => EPISODES.filter((e) => epBestOf(e.id) === null).map((e) => e.id));
  for (const id of eps.slice(0, 1)) {
    await refill(page);
    const r = await walkToSpot(page, 'ep', id);
    log('ep ' + id + ' -> ' + JSON.stringify(r));
    if (await screen(page) !== 'ep') { if (r.why && /locked/.test(r.why)) continue; issue('ep ' + id + ' not started ' + JSON.stringify(r)); continue; }
    for (let i = 0; i < 40; i++) {
      const sc = await screen(page); if (sc !== 'ep') break;
      await page.evaluate(() => typeSkip());
      const nx = await page.$('#epnext:not([hidden])'); if (nx) { await nx.click(); await sleep(150); continue; }
      const chs = await page.$$('#epchoices:not([hidden]) .choice:not([disabled])');
      if (chs.length) { await chs[Math.floor(Math.random() * chs.length)].click(); await sleep(150); continue; }
      await sleep(150);
    }
    log('ep end ' + await page.evaluate(() => document.getElementById('eebig').textContent));
    await page.click('#eeback'); await sleep(1200); await clearOverlays(page);
  }
}

async function shopping() {
  // 상점 탭 → 살 수 있는 장비 하나(가장 싼 것) → 캐릭터 탭에서 확인
  await clearOverlays(page);
  await page.click('#tab-home .tab >> nth=3'); await sleep(400);
  const bought = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#shopbody .item:not([disabled])')].filter((b) => !/보유/.test(b.innerText));
    return rows.map((b) => b.querySelector('.inm') && b.querySelector('.inm').textContent).slice(0, 5);
  });
  if (bought.length) {
    const coin0 = await page.evaluate(() => S.coin);
    await page.locator('#shopbody .item:not([disabled])', { hasNotText: '보유' }).first().click();
    await sleep(300);
    const coin1 = await page.evaluate(() => S.coin);
    log('shop bought ' + bought[0] + ' ' + coin0 + '->' + coin1);
  }
  await page.click('#tab-shop .tab >> nth=2'); await sleep(400);
  // 몸 칸 하나 눌러 가방에서 첫 보유 물건 → 장착
  await page.click('#dollR .dslot >> nth=0');
  await sleep(200);
  const cells = await page.$$('#baggrid > *');
  if (cells.length > 1) { await cells[1].click(); await sleep(250); const eq = await page.$('#itipbox button:has-text("장착하기")'); if (eq) { await eq.click(); log('equipped weapon'); } else await page.evaluate(() => closeTip()); }
  await page.click('#tab-char .tab >> nth=0'); await sleep(600);
}

const t0 = Date.now();
for (let d = 0; d < DAYS; d++) {
  const D = { d, quests: 0, notes: [] };
  if (d > 0) {
    await page.evaluate((ms) => window.__shift(ms), d * DAY);
    // 탭을 눌러 새 하루를 연다(render → rollDay)
    await clearOverlays(page);
    const scr = await screen(page);
    await page.click(`#tab-${scr === 'home' ? 'home' : scr} .tab >> nth=0`).catch(async () => { await page.evaluate(() => render('home')); });
    await sleep(2500);
  }
  await refill(page);
  // 아침: 시트·할배 알림
  for (let i = 0; i < 6; i++) {
    const s = await page.evaluate(() => ({ tut: window.TUT && TUT.name, tip: !document.getElementById('itip').hidden && document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 80) }));
    if (s.tut === '귀인 할배') { D.notes.push('halbae'); await handleAnnounce(0); continue; }
    if (s.tut) { await finishTalk(page, 0); continue; }
    if (s.tip) { D.notes.push('sheet:' + s.tip); await page.evaluate(() => closeTip()); await sleep(400); continue; }
    await sleep(500);
  }
  // 퀘스트
  for (let round = 0; round < 10; round++) {
    const ids = await openQuests(page);
    if (!ids.length) break;
    await refill(page);
    if (await page.evaluate(() => !!window.MQP)) { D.notes.push('autocine'); await playMQ(); }
    await clearOverlays(page);
    const res = await walkToQuest(page, ids[0]);
    if (res !== 'ok') { D.notes.push('walk ' + ids[0] + ' ' + res); issue('day' + d + ' walk ' + ids[0] + ' -> ' + res); await clearOverlays(page); break; }
    const end = await playQuest(page, { acc: 0.8 });
    D.quests++;
    if (end !== 'result') issue('quest end screen ' + end);
    await page.click('#rback'); await sleep(900);
    for (let i = 0; i < 4; i++) { const s = await page.evaluate(() => window.TUT && TUT.name); if (s === '귀인 할배') await handleAnnounce(0); else if (s) await finishTalk(page, 0); else break; }
    await clearOverlays(page);
  }
  // 복습 퀴즈
  const qa = await page.evaluate(() => quizAvail());
  if (qa) { await refill(page); await page.click('#htoday'); await sleep(300); const qb = await page.$('#itipbox button:has-text("복습 퀴즈")'); if (qb) { await qb.click(); await sleep(400); await playQuest(page, { acc: 0.9 }); await page.click('#rback'); await sleep(900); D.notes.push('quiz'); } await clearOverlays(page); }
  // 메인
  await refill(page);
  const mq = await mainQuest();
  await clearOverlays(page);
  if (d % 3 === 1) await shopping();
  await bossFight();
  if (d % 2 === 0) await episodes();
  const st = await page.evaluate(() => ({ lv: S.lv, coin: S.coin, tier: S.tier, peak: S.peak, ju: S.stats.ju, done: S.done.length, mq: Object.keys(S.mq.done).join(','), boss: S.bossDone.join(','), eps: Object.keys(S.epBest).length, streak: S.streak, open: openLeft(), locked: dripLocked().length, map: ME.map, chip: document.getElementById('hmq').hidden ? null : document.getElementById('hmq').innerText.replace(/\n/g, ' ') }));
  D.state = st; D.mem = await mem(); D.counts = await counts();
  R.days.push(D);
  log('day ' + d + ' ' + JSON.stringify(st) + ' heap ' + D.mem + 'MB ' + JSON.stringify(D.counts) + ' notes ' + D.notes.join(' | '));
  if (d % 4 === 3 || d === DAYS - 1) { await clearOverlays(page); await page.evaluate(() => render('home')); await sleep(800); await shot(page, `02-${tag}-day${d}`); }
}
R.errors = logs;
R.secs = Math.round((Date.now() - t0) / 1000);
fs.writeFileSync(new URL(`./out/02-longplay-${tag}.json`, import.meta.url), JSON.stringify(R, null, 1));
console.log('ERRORS', logs);
await closeBrowser();
