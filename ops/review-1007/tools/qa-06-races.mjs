// 뒤로가기(앱 브릿지 __nqBack)와 두 번 누르기 경합. 앱 브릿지를 주입해 실제 앱과 같은 뒤로가기 처리를 쓴다.
import { open, closeBrowser, shot, sleep, screen, seed, refill, clearOverlays, playQuest, walkToQuest, finishTalk } from './qa-lib.mjs';
import fs from 'node:fs';
const R = {};
const rec = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v).slice(0, 900)); };
const back = (page) => page.evaluate(() => { window.__rn.length = 0; window.__nqBackRequest(); const m = window.__rn.find((x) => x.type === 'back_result'); return m ? m.handled : null; });
const snap = (page) => page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, full: S.full, energy: S.energy, coin: S.coin, xp: S.xp, lv: S.lv, done: S.done.length, run: !!window.RUN && RUN.q.id, tip: !document.getElementById('itip').hidden, travel: !document.getElementById('htravel').hidden, tut: window.TUT && TUT.name, mqp: !!window.MQP, opening: !!document.getElementById('opening'), toast: document.getElementById('htoast').hidden ? null : document.getElementById('htoast').textContent }));
// 지도 칸의 화면 좌표
const tileXY = (page, tx, ty) => page.evaluate(([tx, ty]) => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(), m = curMap(), cam = camOf(m); return { x: r.left + ((tx * TS + TS / 2 - cam.x) * cam.z) * (r.width / SW), y: r.top + ((ty * TS + TS / 2 - cam.y) * cam.z) * (r.height / SH) }; }, [tx, ty]);

// 1. 뒤로가기: 화면마다
{
  const { ctx, page, logs } = await open({ view: 'm', bridge: true });
  await seed(page, '직장인', { lv: 5 });
  await clearOverlays(page);
  const out = {};
  // 1a 퀘스트 화면에서 뒤로 → 확인 없이 나가며 포만·체력만 쓴다
  const s0 = await snap(page);
  await page.evaluate(() => startQuest(QMAP[S.todayQ[0]]));
  await sleep(200);
  out.duringWipe = { handled: await back(page), after: await snap(page) };
  await sleep(1200);
  out.questScreen = await snap(page);
  await page.waitForFunction(() => !document.getElementById('qnext').hidden); await page.click('#qnext'); await page.evaluate(() => typeSkip()); await page.click('#qchoices .choice >> nth=0');
  out.questBack = { handled: await back(page), before: s0, after: await snap(page) };
  // 1b 보스 화면
  await refill(page);
  await page.evaluate(() => { S.stats.ju = 40; startBoss(bossById('jeonse')); });
  await sleep(1500);
  out.boss1 = { handled: await back(page), s: await snap(page) };
  out.boss2 = { handled: await back(page), s: await snap(page) };
  await page.evaluate(() => { FIGHT = null; render('home'); });
  await sleep(500); await clearOverlays(page);
  // 1c 이동 메뉴(작은 지도) 열린 채로
  await page.click('#hmini'); await sleep(200);
  out.travel = { handled: await back(page), s: await snap(page) };
  await page.evaluate(() => { document.getElementById('htravel').hidden = true; });
  // 1d 오늘 할 일 시트
  await page.click('#htoday'); await sleep(200);
  out.sheet = { handled: await back(page), s: await snap(page) };
  // 1e 첫 월급 계산기
  const pc = await page.evaluate(() => { if (typeof openPayCalc !== 'function') return null; openPayCalc('qa'); return !document.getElementById('paycalc').hidden; });
  if (pc) { out.paycalc = { open: pc, handled: await back(page), stillOpen: await page.evaluate(() => !document.getElementById('paycalc').hidden), scr: await screen(page) }; await page.evaluate(() => payClose()); }
  await page.evaluate(() => render('home')); await sleep(300);
  // 1f 대화 상자(할배 질문)에서 뒤로
  await page.evaluate(() => talkTo({ name: '귀인 할배', face: 'halbae', lines: ['테스트', { q: '고르기', a: ['지금 시작', '나중에'], choose: () => [] }] }));
  out.talk = { handled: await back(page), s: await snap(page) };
  // 1g 메인 컷신 중
  await page.evaluate(() => { S.done = ['ju1', 'sik1', 'stu1', 'ju2']; S.mq.done = {}; save(); mqStart('job'); });
  await sleep(400);
  const cineBacks = [];
  for (let i = 0; i < 40; i++) { const h = await back(page); const s = await page.evaluate(() => window.MQP ? (MQP.list()[MQP.cur()] || {}).type || (MQP.list()[MQP.cur()].choice ? 'choice' : 'line') : 'none'); cineBacks.push(h + ':' + s); if (s === 'none') break; await sleep(60); }
  out.cine = cineBacks.slice(0, 12).join(' ') + ' …(' + cineBacks.length + ')';
  await page.evaluate(() => { while (window.MQP) { const p = MQP.list()[MQP.cur()]; if (p && p.choice && MQP.picked === null) MQP.pick(0); else MQP.next({ type: 'test' }); } });
  await sleep(1500); await clearOverlays(page);
  // 1h 탭 화면, 수집 노트, 체크리스트, 온보딩, 오프닝
  for (const t of ['char', 'shop', 'wiki', 'codex']) { await page.evaluate((t) => render(t), t); await sleep(150); out['tab_' + t] = { handled: await back(page), scr: await screen(page) }; }
  await page.evaluate(() => openCheck(CHECKS[0].id)); await sleep(150); out.check = { handled: await back(page), scr: await screen(page) };
  // 1i 세간 놓는 중
  // 1j 프롤로그(컷신이지만 MQP가 아님)
  await page.evaluate(() => playPrologue(null, () => {})); await sleep(300);
  out.prologue = { handled: await back(page), opening: await page.evaluate(() => !!document.getElementById('opening')) };
  await page.evaluate(() => { const s = document.querySelector('#opening .cskip'); if (s) s.click(); }); await sleep(700);
  out.homeIdle = { handled: await back(page), scr: await screen(page) };
  rec('back', out); R.backLogs = logs.slice();
  await ctx.close();
}

// 2. 두 번 누르기
{
  const { ctx, page, logs } = await open({ view: 'm', bridge: false });
  await seed(page, '직장인');
  await clearOverlays(page);
  const out = {};
  // 2a 창구 사람을 빠르게 두 번 탭 → 퀘스트가 두 번 시작되며 포만을 두 번 쓰는가
  const tgt = await page.evaluate(() => { const id = S.todayQ[0], did = QPLACE[id]; let mk = null, sp = null; Object.keys(MAPS).forEach((k) => (MAPS[k].spots || []).forEach((s) => { if (s.kind === 'desk' && s.id === did) { mk = k; sp = s; } })); enterMap(mk, sp.x, sp.y + 1); ME.dir = 3; drawScene(); return { mk, x: sp.x, y: sp.y, id }; });
  await sleep(600);
  const p = await tileXY(page, tgt.x, tgt.y);
  const f0 = await snap(page);
  await page.touchscreen.tap(p.x, p.y); await sleep(60); await page.touchscreen.tap(p.x, p.y);
  await sleep(1500);
  const f1 = await snap(page);
  out.deskDoubleTap = { fullBefore: f0.full, fullAfter: f1.full, energyBefore: f0.energy, energyAfter: f1.energy, scr: f1.scr, startEvents: await page.evaluate(() => S.log.filter((e) => e.n === 'quest_start').length) };
  await shot(page, '06-double-desk');
  // 2b '결과 보기' 를 두 번(같은 자리) → 결과 화면의 버튼(광고 두 배)을 누르는가
  await page.waitForFunction(() => !document.getElementById('qnext').hidden); await page.click('#qnext');
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => typeSkip()); await page.waitForSelector('#qchoices:not([hidden]) .choice');
    await page.evaluate(() => { const ok = RUN.q.qs[RUN.i].ok; document.querySelector(`#qchoices .choice[data-orig="${ok}"]`).click(); });
    await page.waitForFunction(() => !document.getElementById('qnext').hidden);
    const lab = await page.textContent('#qnext');
    if (/결과/.test(lab)) break;
    await page.click('#qnext');
  }
  const bb = await page.$eval('#qnext', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const c0 = await page.evaluate(() => S.coin);
  await page.touchscreen.tap(bb.x, bb.y); await sleep(90); await page.touchscreen.tap(bb.x, bb.y);
  await sleep(400);
  const under = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className) + ':' + (e.textContent || '').slice(0, 30) : null; }, [bb.x, bb.y]);
  out.resultDoubleTap = { scr: await screen(page), elementUnderFinger: under, adOverlay: await page.evaluate(() => !!document.querySelector('.adwrap')), coinDelta: (await page.evaluate(() => S.coin)) - c0 };
  await shot(page, '06-double-result');
  await sleep(5600);
  out.resultDoubleTap.coinAfterAd = (await page.evaluate(() => S.coin)) - c0;
  if (await screen(page) !== 'result') { out.resultDoubleTap.note = 'not on result: ' + JSON.stringify(await snap(page)); console.log('DBG', JSON.stringify(out)); await shot(page, '06-double-stuck'); await page.evaluate(() => render('home')); } else await page.click('#rback');
  await sleep(1500); await clearOverlays(page);
  // 2c 오늘 할 일 → 광고 버튼 두 번
  // 2d 메인 칩 두 번
  await refill(page);
  await page.evaluate(() => { S.done = S.done.concat(['ju1', 'sik1', 'stu1']).filter((v, i, a) => a.indexOf(v) === i); save(); mqChip(); });
  const chipBox = await page.$eval('#hmq', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + 20, y: r.top + 10, hidden: e.hidden }; });
  if (!chipBox.hidden) { await page.touchscreen.tap(chipBox.x, chipBox.y); await sleep(50); await page.touchscreen.tap(chipBox.x, chipBox.y); await sleep(400); out.chipDouble = await page.evaluate(() => ({ hosts: document.querySelectorAll('#opening').length, mqp: !!window.MQP })); await page.evaluate(() => { while (window.MQP) { const p = MQP.list()[MQP.cur()]; if (p && p.choice && MQP.picked === null) MQP.pick(0); else MQP.next({ type: 'test' }); } }); await sleep(1500); await clearOverlays(page); }
  // 2e 시작 메뉴 이어하기 두 번 / 온보딩 시작하기 두 번은 01·03에서 확인
  // 2f 상점: 같은 물건 두 번
  await page.evaluate(() => { S.coin = 1000; save(); render('shop'); }); await sleep(300);
  const row = await page.$('#shopbody .item:not([disabled]):not(.locked)');
  const nm = await row.$eval('.inm', (e) => e.textContent);
  const box = await row.boundingBox();
  const k0 = await page.evaluate(() => S.coin);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await sleep(70); await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(300);
  out.shopDouble = { item: nm, coinSpent: k0 - (await page.evaluate(() => S.coin)), owned: await page.evaluate(() => S.owned.length) };
  await page.evaluate(() => render('home')); await sleep(800); await clearOverlays(page);
  // 2g 보스 '마무리'/'결과' 두 번
  await refill(page);
  await page.evaluate(() => { S.stats.ju = 40; startBoss(bossById('jeonse')); });
  await page.waitForFunction(() => !document.getElementById('bnext').hidden, null, { timeout: 15000 }); await page.click('#bnext');
  for (let i = 0; i < 12; i++) {
    if (await screen(page) !== 'boss') break;
    await page.evaluate(() => typeSkip()); await page.waitForSelector('#bchoices:not([hidden]) .choice');
    await page.evaluate(() => { const ok = FIGHT.b.qs[FIGHT.i].ok; document.querySelector(`#bchoices .choice[data-orig="${ok}"]`).click(); });
    await page.waitForFunction(() => !document.getElementById('bnext').hidden);
    const lab = await page.textContent('#bnext');
    const bx = await page.$eval('#bnext', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    if (/마무리|결과/.test(lab)) { const c1 = await page.evaluate(() => S.coin); await page.touchscreen.tap(bx.x, bx.y); await sleep(60); await page.touchscreen.tap(bx.x, bx.y); await sleep(300); out.bossEndDouble = { lab, coinDelta: (await page.evaluate(() => S.coin)) - c1, scr: await screen(page), wins: await page.evaluate(() => S.log.filter((e) => e.n === 'boss_win').length) }; break; }
    await page.click('#bnext');
  }
  await page.evaluate(() => render('home')); await sleep(600); await clearOverlays(page);
  // 2h 사건 '결말 보기' 두 번
  await refill(page);
  await page.evaluate(() => epStart(epById('jeonse-day')));
  for (let i = 0; i < 20; i++) {
    if (await screen(page) !== 'ep') break;
    await page.evaluate(() => typeSkip());
    const nx = await page.$('#epnext:not([hidden])');
    if (nx) { const lab = await nx.textContent(); const b2 = await nx.boundingBox(); if (/결말/.test(lab)) { const x0 = await page.evaluate(() => S.xp + S.lv * 1e6); await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2); await sleep(60); await page.touchscreen.tap(b2.x + b2.width / 2, b2.y + b2.height / 2); await sleep(300); out.epEndDouble = { scr: await screen(page), ends: await page.evaluate(() => S.log.filter((e) => e.n === 'ep_end').length) }; break; } await nx.click(); continue; }
    await page.click('#epchoices .choice >> nth=0');
  }
  await page.evaluate(() => render('home')); await sleep(500);
  // 2i 탭바를 빠르게 연타(홈↔상점↔캐릭터) 하면서 퀘스트 시작 와이프 중에 탭
  await refill(page);
  await clearOverlays(page);
  const qid = await page.evaluate(() => QUESTS.filter((q) => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q))[0]?.id);
  if (qid) {
    await page.evaluate((id) => startQuest(QMAP[id]), qid); await sleep(150);
    await page.click('#tab-home .tab >> nth=2'); await sleep(900);
    out.tabDuringWipe = { scr: await screen(page), walkTimer: await page.evaluate(() => !!MAPT) };
    await shot(page, '06-tab-during-wipe');
  }
  rec('double', out); R.doubleLogs = logs.slice();
  await ctx.close();
}
fs.writeFileSync(new URL('./out/06-races.json', import.meta.url), JSON.stringify(R, null, 1));
await closeBrowser();
