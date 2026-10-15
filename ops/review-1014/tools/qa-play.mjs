// 리뷰 1014 QA: 인생 모드를 처음 켠 사람처럼 한 판 끝까지 한다.
// 실행(저장소 루트): node ops/review-1014/tools/qa-play.mjs [폭] [높이] [최대 시뮬 분] [출력 접두]
// 시간 모델: 플레이어가 실제로 쓰는 시간(sim 초)을 센다. 글 상자 2.5초, 선택 6초, 문항 7초+해설 3초, 걷기는 실제 걸린 시간.
// 게임 시계(Date)는 sim 시간에 맞춰 흐르게 해서 체력·포만감 회복이 실제 플레이와 같게 한다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
const { chromium } = await import('playwright');

const W = +(process.argv[2] || 390), H = +(process.argv[3] || 844), MAXMIN = +(process.argv[4] || 400), TAG = process.argv[5] || 'main';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(process.env.QA_HTML || path.join(ROOT, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(ROOT, 'ops/review-1014/img');
const OUT = process.env.QA_OUT || path.join(ROOT, 'ops/review-1014/tools/out');
fs.mkdirSync(IMG, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });

let SIM = 0; const T0 = Date.now();
const EV = []; const SHORT = []; const CINES = []; const BUGS = [];
let rnd = 12345; const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648; };
const ACC = 0.75;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: false });
const page = await ctx.newPage();
page.on('pageerror', (e) => BUGS.push({ sim: SIM, kind: 'pageerror', msg: String(e).slice(0, 300) }));
page.on('console', (m) => { if (m.type() === 'error') BUGS.push({ sim: SIM, kind: 'console', msg: m.text().slice(0, 300) }); });
await page.addInitScript(() => {
  const RD = Date; window.__off = 0;
  class D extends RD { constructor(...a) { if (a.length === 0) super(RD.now() + window.__off); else super(...a); } static now() { return RD.now() + window.__off; } }
  window.Date = D;
});
const syncClock = () => page.evaluate((o) => { window.__off = o; }, Math.max(0, SIM * 1000 - (Date.now() - T0))).catch(() => {});
const add = async (s) => { SIM += s; await syncClock(); };

async function st() {
  return page.evaluate(() => {
    if (!window.S) return {};
    const nx = typeof mqNext === 'function' ? mqNext() : null;
    return { age: S.life && S.life.age, lv: S.lv, coin: S.coin, en: S.energy, full: S.full, clean: S.clean, mood: S.mood, done: (S.done || []).length,
      open: typeof openLeft === 'function' && S.onboarded ? openLeft() : 0, tier: S.tier, peak: S.peak, tname: S.onboarded ? tierNameOf(S, S.tier) : '',
      ch: Object.keys((S.mq && S.mq.done) || {}).join(','), next: nx ? nx.id : 'end', ready: nx ? mqReady(nx) : false, wait: nx ? mqWait(nx) : '',
      leasing: !!(S.lease && typeof leaseCh === 'function' && leaseCh() && !(S.leaseDone && S.leaseDone[S.lease.to])), leaseRaw: !!S.lease, status: S.status, over: !!(S.life && S.life.over), stats: S.stats ? Object.values(S.stats).join('/') : '', ms: S.life ? S.life.ms : 0,
      scr: (document.querySelector('.screen.on') || {}).id, map: window.ME ? ME.map : '', fits: QUESTS.filter((q) => !q.trip && fits(q)).length,
      boss: typeof BOSSES !== 'undefined' ? BOSSES.filter((b) => !bossCleared(b.id) && (S.stats[b.stat] || 0) >= b.need).map((b) => b.id).join(',') : '' };
  });
}
async function log(kind, note, extra = {}) {
  const s = await st().catch(() => ({}));
  const e = Object.assign({ t: Math.round(SIM), real: Math.round((Date.now() - T0) / 1000), kind, note }, s, extra);
  EV.push(e); console.log(`[${(SIM / 60).toFixed(1)}m] ${s.age}살 Lv${s.lv} ￦${s.coin} 체${s.en} 포${s.full} done${s.done} open${s.open} ch[${s.ch}] next ${s.next}${s.ready ? '!' : ''} | ${kind}: ${note}`);
}
const shot = async (name) => { try { await page.screenshot({ path: path.join(IMG, `qa-${TAG === 'main' ? '' : TAG + '-'}${name}.png`) }); } catch (e) {} };
async function short(why, fn, arg) { SHORT.push({ t: Math.round(SIM), why }); await log('SHORTCUT', why); return page.evaluate(fn, arg); }

let FINISHED = false; let curCine = null;
// 화면을 막는 것(컷신, 대화, 시트, 결과)을 플레이어처럼 넘긴다
async function drain(idleN = 9) {
  let idle = 0;
  for (let guard = 0; guard < 2000; guard++) {
    const o = await page.evaluate(() => {
      const tp = document.getElementById('itip'), tv = tp && !tp.hidden;
      let mq = null;
      if (window.MQP && MQP.list) { const p = MQP.list()[MQP.cur()] || {};
        mq = { type: p.type || '', opts: p.choice ? p.choice.opts.map((x) => x.ok) : null, picked: MQP.picked, lines: (p.text || []).length, doc: !!p.doc,
          title: MQP.o.title, kicker: MQP.o.kicker || '', sub: MQP.o.sub || '', i: MQP.cur(), n: MQP.list().length, text: (p.text || []).join(' ').slice(0, 80) }; }
      let tut = null;
      if (TUT) { const ln = TUT.lines[TUT.i]; tut = { name: (document.querySelector('#htutor .tnm, #htutor .tname') || {}).textContent || '', obj: !!(ln && typeof ln === 'object'),
        q: (typeof ln === 'string' ? ln : (ln && ln.q) || '').slice(0, 90), a: ln && ln.a ? ln.a : null, btns: [...document.querySelectorAll('#htutorop button')].map((b) => b.textContent) }; }
      const ep = [...document.querySelectorAll('#epend button')].filter((b) => b.offsetParent && /새 집으로/.test(b.textContent)).length;
      return { scr: (document.querySelector('.screen.on') || {}).id, mq, tut, tip: tv ? tp.innerText.replace(/\s+/g, ' ').slice(0, 220) : null,
        tipBtns: tv ? [...tp.querySelectorAll('button')].map((b) => b.textContent.trim()) : [], ep, opening: !!document.getElementById('opening') };
    });
    if (o.mq) {
      idle = 0; const m = o.mq;
      if (!curCine || curCine.title !== m.title + '|' + m.sub) { curCine = { title: m.title + '|' + m.sub, kicker: m.kicker, t0: SIM, scenes: 0, choices: 0, ok: 0, age0: (await st()).age }; CINES.push(curCine);
        await log('CINE', `${m.kicker || '메인'} 「${m.title}」 ${m.sub} (${m.n - 1}장면)`); }
      if (m.i !== curCine.lastI) { curCine.lastI = m.i; curCine.scenes++;
        if (m.type === 'title') await add(2); else if (m.type === 'reward') await add(5); else await add(2.5 + (m.doc ? 3 : 0) + (m.lines > 3 ? 1 : 0));
        curCine.t1 = SIM; if (curCine.scenes === 3) await shot(('cine-' + (m.kicker === 'LIFE' ? 'life-' + m.sub : m.title)).replace(/[^\w가-힣-]/g, '_')); }
      if (m.opts && m.picked === null) {
        const okIdx = m.opts.map((x, j) => (x ? j : -1)).filter((j) => j >= 0), bad = m.opts.map((x, j) => (!x ? j : -1)).filter((j) => j >= 0);
        let j = 0; if (okIdx.length && (rand() < ACC || !bad.length)) j = okIdx[Math.floor(rand() * okIdx.length)]; else if (bad.length) j = bad[Math.floor(rand() * bad.length)];
        curCine.choices++; if (m.opts[j]) curCine.ok++;
        await add(6); curCine.t1 = SIM; await page.evaluate((j) => MQP.pick(j), j); await page.waitForTimeout(60); continue;
      }
      await page.evaluate(() => MQP && MQP.next({ type: 'test' })); await page.waitForTimeout(50); continue;
    }
    if (curCine) { curCine.age1 = (await st()).age; curCine = null; }
    if (o.tut) {
      idle = 0;
      if (o.tut.obj) {
        if (!o.tut.btns.length) { await page.click('#htutortx').catch(() => {}); await page.waitForTimeout(300); continue; }
        let k = o.tut.btns.findIndex((b) => /지금 시작|이어서 보기|지금 보기|좋아|네|간다/.test(b)); if (k < 0) k = Math.floor(rand() * o.tut.btns.length);
        await log('TALK-CHOICE', `${o.tut.q} → [${o.tut.btns[k]}] (보기 ${o.tut.btns.join(' / ')})`);
        await add(6); await page.locator('#htutorop button').nth(k).click({ timeout: 3000 }).catch(async () => { BUGS.push({ sim: SIM, kind: 'click', msg: '대화 선택 버튼을 못 눌렀다 ' + o.tut.btns[k] }); await page.evaluate(() => endTalk()); });
        await page.waitForTimeout(250); continue;
      }
      if (o.tut.q !== drain.lastQ) { drain.lastQ = o.tut.q; await log('TALK', o.tut.q); await add(2.5); } await page.evaluate(() => stepTutor()); await page.waitForTimeout(120); continue;
    }
    if (o.tip) {
      idle = 0; await log('SHEET', o.tip.slice(0, 160) + ' {' + o.tipBtns.join('|') + '}');
      if (o.tipBtns.some((b) => /다시 태어나기/.test(b))) { await add(8); await shot('end-card'); FINISHED = true; return; }
      if (/인생 결산/.test(o.tip)) await shot('end-card1');
      await add(4 + Math.min(8, o.tip.length / 60));
      let k = o.tipBtns.findIndex((b) => /^계속|닫기|확인|알겠|좋아|그만|괜찮|나중|홈으로|돌아가/.test(b) && !/광고/.test(b));
      if (k < 0) k = o.tipBtns.findIndex((b) => !/광고|공유/.test(b));
      if (k >= 0) await page.locator('#itipbox button').nth(k).click({ timeout: 3000 }).catch(() => page.evaluate(() => closeTip()));
      else await page.evaluate(() => closeTip());
      await page.waitForTimeout(250); continue;
    }
    if (o.ep) { idle = 0; await add(3); await page.evaluate(() => document.querySelectorAll('#epend button').forEach((b) => { if (/새 집으로/.test(b.textContent)) b.click(); })); await page.waitForTimeout(400); continue; }
    if (o.scr === 'result') { idle = 0; await add(5); await page.click('#rback').catch(() => page.evaluate(() => go('home'))); await page.waitForTimeout(300); continue; }
    if (++idle >= idleN) return;
    await page.waitForTimeout(400);
  }
}

// 퀘스트 하나를 푼다(문항을 실제로 누른다)
async function playQuest(label) {
  const t0 = SIM;
  await page.waitForFunction(() => document.querySelector('.screen.on') && document.querySelector('.screen.on').id === 'quest', null, { timeout: 8000 });
  const info = await page.evaluate(() => ({ id: RUN.q.id, title: RUN.q.title, theme: RUN.q.theme, n: RUN.q.qs.length, npc: RUN.q.npc }));
  for (let g = 0; g < 60; g++) {
    await page.click('#qtext').catch(() => {});
    const s = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, next: !document.getElementById('qnext').hidden, nt: document.getElementById('qnext').textContent,
      ch: !document.getElementById('qchoices').hidden && document.querySelectorAll('#qchoices .choice:not([disabled])').length, ok: RUN && RUN.q.qs[RUN.i] ? RUN.q.qs[RUN.i].ok : -1 }));
    if (s.scr !== 'quest') break;
    if (s.ch) { const right = rand() < ACC; const opts = await page.$$eval('#qchoices .choice', (bs) => bs.map((b) => +b.dataset.orig));
      const pick = right ? s.ok : opts.filter((x) => x !== s.ok)[Math.floor(rand() * (opts.length - 1))];
      await add(7); await page.click(`#qchoices .choice[data-orig="${pick}"]`); await page.waitForTimeout(200); continue; }
    if (s.next) { await add(/들어보기/.test(s.nt) ? 4 : 3); if (g < 2 && EV.filter((e) => e.kind === 'QUEST').length === 0) await shot('first-quest'); await page.click('#qnext'); await page.waitForTimeout(250); continue; }
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(() => document.querySelector('.screen.on').id === 'result', null, { timeout: 8000 }).catch(() => {});
  const res = await page.evaluate(() => (document.getElementById('result').innerText || '').replace(/\s+/g, ' ').slice(0, 160));
  if (EV.filter((e) => e.kind === 'QUEST').length === 0) await shot('first-result');
  await add(5);
  await log('QUEST', `${label} ${info.id} 「${info.title}」(${info.theme}, ${info.n}문항, ${Math.round(SIM - t0 + 5)}초) → ${res.slice(0, 90)}`);
  await page.click('#rback').catch(() => page.evaluate(() => go('home')));
  await page.waitForTimeout(300);
}

// 체력·포만감: 쉬고 먹는다. 안 되면 기다린다(기다린 시간도 sim으로 센다)
async function needs() {
  for (let g = 0; g < 20; g++) {
    const s = await page.evaluate(() => { needTick(); return { en: S.energy, full: S.full, coin: S.coin, fc: fullCost('quest') }; });
    if (s.en >= 10 && s.full >= s.fc) return;
    if (s.full < s.fc) {
      if (s.coin >= 45) { const r = await page.evaluate(() => { const out = []; for (let i = 0; i < 3 && S.full < 70; i++) out.push(eatFood(FOODS.mart[2])); return out.join(' / '); });
        await add(25); await log('EAT', '편의점 도시락(걸어가서 사 먹음, evaluate로 eatFood): ' + r); continue; }
      const m = (s.fc - s.full) * 4; await add(m * 60); await log('WAIT', `포만감 ${s.full}, 돈 ￦${s.coin}으로 못 사 먹음 → ${m}분 기다림`); continue;
    }
    const r = await page.evaluate(() => { for (const k of Object.keys(FURNI_ACT)) { if (!hasPlaced(k)) continue; const acts = FURNI_ACT[k];
      for (let i = 0; i < acts.length; i++) { const a = acts[i]; if (a.ad || !a.d || !(a.d.energy > 0)) continue; if (actReady(k + i, a)) continue;
        doAct(k + i, a, function () {}); return FURNI[k].name + ' · ' + a.t; } } return null; });
    const bench = r ? null : await page.evaluate(() => { const a = { t: '벤치', cd: 20, d: { energy: 12, mood: 4 } }; for (const m of ['town', 'park']) { const k = 'bench_' + m; if (actReady(k, a)) continue; doAct(k, a, function () {}); return k; } return null; });
    if (bench) { await add(40); await log('REST', '공원·동네 벤치에서 쉼(+12, 20분 대기 시간 있음): ' + bench); continue; }
    if (r) { await add(15); await log('REST', '집 세간으로 쉼: ' + r); continue; }
    const m = (10 - s.en) * 6; await add(m * 60); await log('WAIT', `체력 ${s.en}, 쓸 수 있는 침대·매트 없음(또는 대기) → ${m}분 기다림`);
  }
}

// ── 시작: 저장 없이 처음 켠다 ──
await page.goto(BASE);
const tOpen = Date.now();
await page.waitForSelector('#opening .omb[data-k="life"]', { timeout: 15000 });
SIM += (Date.now() - tOpen) / 1000; await syncClock();
await page.evaluate(() => { const t = window.toast; window.toast = function (m) { (window.__toasts = window.__toasts || []).push([Math.round((Date.now()) / 1000), String(m)]); return t.apply(this, arguments); }; });
await add(5); await shot('opening'); await log('START', '오프닝 메뉴: ' + (await page.evaluate(() => document.getElementById('opening').innerText.replace(/\s+/g, ' ').slice(0, 120))));
await page.click('#opening .omb[data-k="life"]');
await page.waitForFunction(() => !document.getElementById('opening') && document.getElementById('onboard').classList.contains('on'), null, { timeout: 8000 });
await add(12); await shot('card'); await log('CARD', (await page.textContent('#obbody')).replace(/\s+/g, ' ').slice(0, 200));
await page.click('#obbody button:has-text("다시 태어나기")'); await add(10);
await log('CARD', '한 번 다시 태어남: ' + (await page.textContent('#obbody')).replace(/\s+/g, ' ').slice(0, 160));
const vis = await page.evaluate(() => { const b = document.getElementById('obnext').getBoundingClientRect(); return b.bottom <= innerHeight; });
if (!vis) BUGS.push({ sim: SIM, kind: 'ui', msg: '"이 인생으로 살기" 버튼이 화면 밖' });
await page.click('#obnext'); await add(2);
await drain();
await shot('home-first'); await log('HOME', '첫 홈 화면');

let moveFail = {}; let lastAge = 0, stuckN = 0, qn = 0, mainRep = 0, lastSig = '';
const ageShot = new Set();
for (let it = 0; it < 900 && !FINISHED && SIM < MAXMIN * 60; it++) {
  await drain();
  if (FINISHED) break;
  const s = await st();
  if (s.age !== lastAge) { await log('AGE', `${lastAge} → ${s.age}`); lastAge = s.age; if (!ageShot.has(s.age)) { ageShot.add(s.age); await shot('age-' + s.age); } }
  if (s.scr !== 'home') { await page.evaluate(() => go('home')); await log('NAV', '홈이 아닌 화면 ' + s.scr + ' → 홈'); continue; }
  // 1) 메인 장이 열렸거나 전세 계약 중이면 메인 칩을 누른다
  const sig = [s.ready, s.leasing, s.done, s.ch, s.tier, s.lv].join('|'); mainRep = (sig === lastSig) ? mainRep + 1 : 0; lastSig = sig;
  if ((s.ready || s.leasing) && mainRep < 6) {
    const chip = await page.evaluate(() => { const b = document.getElementById('hmq'); return b && !b.hidden ? b.textContent : null; });
    await log('MAIN', `메인 칩 누름: ${chip} (전세 진행 ${s.leasing})`); await add(2);
    if (chip) await page.click('#hmq').catch(() => page.evaluate(() => document.getElementById('hmq').click())); else await short('메인 칩이 안 보여 mqStart 직접 호출', (id) => mqStart(id), s.next);
    await page.waitForTimeout(900); stuckN = 0; continue;
  }
  // 2) 더 좋은 거처가 열렸고 돈이 되면 옮긴다(캐릭터 탭 → 거처 → 옮기기 와 같음)
  const mv = await page.evaluate((bad) => { let best = null; for (let i = S.peak; i > S.tier; i--) { if (lifeSkip(i) || bad.includes(i)) continue; if (S.coin >= tierCost(i) + 60) { best = i; break; } } if (best == null) return null;
    const from = S.tier, r = tierMove(best); if (r.ok) { save(); render('home'); } return { from: tierNameOf(S, from), to: tierNameOf(S, best), r }; }, Object.keys(moveFail).filter((k) => moveFail[k] >= 2).map(Number));
  if (mv) { await add(20); await log('MOVE', `거처 옮기기 시도(evaluate tierMove, UI의 '옮기기'와 같은 함수) ${mv.from} → ${mv.to}: ${JSON.stringify(mv.r)}`);
    if (!mv.r.ok) moveFail[mv.r.i] = (moveFail[mv.r.i] || 0) + 1; else moveFail = {};
    if (mv.r.rent) await page.evaluate(() => rentPlay());
    if (mv.r.lease && !s.next.match(/lease/)) { await page.evaluate(() => leaseGoNext()); }
    await page.waitForTimeout(600); continue; }
  // 3) 길잡이가 가리키는 퀘스트로 걸어간다
  const gq = await page.evaluate(() => { const b = document.getElementById('hguide'); return b && !b.hidden ? b.textContent : null; });
  if (gq) {
    await needs();
    const r0 = Date.now(); await page.click('#hguide').catch(() => {});
    const ok = await page.waitForFunction(() => document.querySelector('.screen.on').id === 'quest' || (window.TUT && 1), null, { timeout: 25000, polling: 200 }).then(() => true).catch(() => false);
    const walk = (Date.now() - r0) / 1000; await add(walk);
    const inQ = await page.evaluate(() => document.querySelector('.screen.on').id === 'quest');
    if (!inQ) { await drain(4); if (await page.evaluate(() => { const b = document.getElementById('hguide'); return b && !b.hidden; })) { const r1 = Date.now(); await page.click('#hguide').catch(() => {});
        await page.waitForFunction(() => document.querySelector('.screen.on').id === 'quest', null, { timeout: 25000, polling: 200 }).catch(() => {}); const w2 = (Date.now() - r1) / 1000; await add(w2);
        if (await page.evaluate(() => document.querySelector('.screen.on').id === 'quest')) { await log('WALK', `대화가 끼어들어 길잡이를 한 번 더 누름, 걷기 ${w2.toFixed(1)}초`); qn++; await playQuest(`#${qn} 길잡이(두 번째 누름)`); stuckN = 0; continue; } } }
    if (!inQ) { const tt = await page.evaluate(() => (window.__toasts || []).slice(-1)[0]); await log('WALK-FAIL', `길잡이 "${gq}" 눌렀는데 ${walk.toFixed(1)}초 뒤 퀘스트가 안 열림 (토스트 ${JSON.stringify(tt)})`); await drain(3);
      const still = await page.evaluate(() => document.querySelector('.screen.on').id === 'quest'); if (!still) { const q = await page.evaluate(() => { const t = guideTarget(); return t && t.q.id; });
        if (q) await short('길잡이로 못 감 → startQuest 직접 ' + q, (id) => startQuest(QMAP[id]), q); else continue; } }
    qn++; await playQuest(`#${qn} 길잡이 "${gq.replace(/\s+/g, ' ')}" 걷기 ${walk.toFixed(1)}초`); stuckN = 0; continue;
  }
  // 4) 길잡이가 없는데 열린 퀘스트가 있으면(다른 맵) 지도로 찾아간다
  const oq = await page.evaluate(() => { const q = QUESTS.filter((q) => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q))[0]; return q ? { id: q.id, place: QPLACE[q.id], map: guideMapOf(q) } : null; });
  if (oq) { await needs(); await add(30); await short(`길잡이 없음. 열린 퀘스트 ${oq.id}(창구 ${oq.place}, 맵 ${oq.map})는 지도로 찾아가야 함 → 30초 걷기로 치고 startQuest`, (id) => startQuest(QMAP[id]), oq.id);
    qn++; await playQuest(`#${qn} 지도로 찾아감`); continue; }
  // 5) 할 게 없다
  stuckN++;
  const rv = await page.evaluate(() => { const r = reviewQuest(); return r ? r.qs.length : 0; });
  if (rv) { await needs(); await log('REVIEW', '오늘 할 일 → 복습'); await page.evaluate(() => startQuest(reviewQuest())); await playQuest('복습'); continue; }
  await log('STUCK', `퀘스트 0 · 다음 메인 ${s.next} 대기 사유 "${s.wait}" · 도전 가능 보스 [${s.boss}]`);
  await shot('stuck-' + s.next);
  if (stuckN > 30) break;
  const need = await page.evaluate(() => { const nx = mqNext(); const m = /Lv\.(\d+)/.exec(mqWait(nx) || ''); return m ? +m[1] : null; });
  if (need) { await short(`레벨 ${need} 대기에 막힘 → 경험치를 Lv.${need}까지 넣음`, (n) => { while (S.lv < n) { S.xp = need(S.lv); S.xp -= need(S.lv); S.lv++; } save(); hudRefresh(); render('home'); }, need); await add(0); continue; }
  await add(60); await log('IDLE', '할 게 없어 1분 둘러봄');
  if (stuckN > 3) { await short('진행 불가 → 다음 장 open 조건을 강제로 맞춤(lifeNoQuests 경로 확인)', () => { S.peak = Math.max(S.peak, 8); save(); render('home'); }); }
}
await log('END', FINISHED ? '결산 카드까지 봄' : '중단');
const toasts = await page.evaluate(() => window.__toasts || []);
fs.writeFileSync(path.join(OUT, `qa-${TAG}.json`), JSON.stringify({ W, H, SIM, real: (Date.now() - T0) / 1000, EV, SHORT, CINES, BUGS, toasts }, null, 1));
console.log('SIM min', (SIM / 60).toFixed(1), 'shortcuts', SHORT.length, 'bugs', BUGS.length);
await browser.close();
