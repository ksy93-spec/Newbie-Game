// 인생 모드 경제·진행 시뮬레이션 (리뷰 1009 경제 담당). ops/review-1007/tools/econ-sim.mjs를 인생 모드에 맞게 고쳤다.
// 게임을 열고 진짜 함수(lifeGen, lifeFx, birthApply, applyLifeTiers, lifeTick, lifeAgeCalc, dripEnsure, qOpen, qReach, fits,
// tierGrow, tierMove, leaseGate, mqReady, mqPay, bossPlan, statPct)를 부른다. 화면이 필요한 것(퀘스트 풀이, 전세 계약, 보스, 사건)은
// 게임 공식을 그대로 옮겨 계산한다. 시간은 분 단위 시계로 따로 센다(체력 6분에 1, 포만감 4분에 1 회복).
// 실행: node ops/review-1009/tools/econ-life.mjs  → ops/review-1009/tools/econ-life.json, 표는 표준 출력
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs';
const GAME = url.pathToFileURL(path.resolve(process.cwd(), 'prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });

const ONLY = process.env.CARD; const CARDS0 = {
  A: { band: '수도권', path: '4년제', living: '본가', income: '보통' },
  B: { band: '그 외', path: '고졸', living: '자취', income: '빠듯' },
  C: { band: '광역시', path: '전문대', living: '기숙사', income: '넉넉' },
  D: { band: '수도권', path: '4년제', living: '자취', income: '넉넉' },
  E: { band: '그 외', path: '4년제', living: '기숙사', income: '빠듯' },
  F: { band: '광역시', path: '고졸', living: '본가', income: '빠듯' },
};
const CARDS = ONLY ? { [ONLY]: CARDS0[ONLY] } : CARDS0;
// 활동별 분(1007 econ-text.mjs 글자 수 기준) + 인생 모드 컷신
const T = { quest: 1.8, walk: 0.4, mq: 3.5, lease: 5.0, ep: 3.0, boss: 2.5, mg: 0.6, cine: 1.0, birth: 2.5, end: 3.0, rest: 0.4, eat: 0.5 };
const PROP = process.env.PROP === '1'; const RUNS = []; const MULTI = process.argv.includes('--seeds');
const SEEDS = MULTI ? [777, 1301, 2203, 3407, 4409, 5501, 6607, 7703] : [777];
for (const [ck, card] of Object.entries(CARDS)) for (const acc of (MULTI ? [0.85, 0.75, 0.65] : [0.85, 0.7])) for (const trait of (MULTI ? ['성실'] : ['성실', '살림'])) for (const rs of SEEDS) {
  if (trait === '살림' && acc !== 0.85) continue;
    const r = await page.evaluate(({ card, acc, trait, T, rs, PROP }) => {
    let seed = rs;
    // 제안값(PROP=1): 출신 집 스탯, 장 사이 최소 퀘스트(mqDay), 2장 막힘 풀기(MQ_LIST lease.open)
    if (!window.__orig) window.__orig = { path: JSON.parse(JSON.stringify(LIFE_FX.path)), band: JSON.parse(JSON.stringify(LIFE_FX.band)), mqDay: window.mqDay, leaseOpen: MQ_LIST[1].open, homeOpen: MQ_LIST[5].open };
    LIFE_FX.band = JSON.parse(JSON.stringify(window.__orig.band)); LIFE_FX.path = JSON.parse(JSON.stringify(window.__orig.path)); window.mqDay = window.__orig.mqDay; MQ_LIST[1].open = window.__orig.leaseOpen; MQ_LIST[5].open = window.__orig.homeOpen;
    if (PROP) {
      LIFE_FX.band['수도권'].stat = { jik: 3, ju: 4 }; LIFE_FX.band['광역시'].stat = { sik: 3, ju: 4 }; LIFE_FX.band['그 외'].stat = { ju: 10 }; LIFE_FX.path.find(x => x.v === '고졸').stat = { jik: 3, ju: 3 };
      const NEXT = { job: 'lease', lease: 'card', card: 'car', car: 'wedding', wedding: 'home' };
      window.mqDay = id => { if (!lifeOn()) return window.__orig.mqDay(id); const nx = NEXT[id]; if (!nx) return true;
        const needQ = Math.min(6, 3 * (LIFE_AGES[nx] - LIFE_AGES[id] - 1)); return S.done.length - ((S.life.chq || {})[id] || 0) >= needQ || !QUESTS.some(q => !q.trip && fits(q) && S.done.indexOf(q.id) < 0); };
      const dryQ = () => lifeOn() && !QUESTS.some(q => !q.trip && fits(q) && S.done.indexOf(q.id) < 0);
      MQ_LIST[1].open = () => window.__orig.leaseOpen() || (mqDone('job') && dryQ());
      MQ_LIST[5].open = () => window.__orig.homeOpen() || (mqDone('wedding') && mqDay('wedding') && dryQ());
    } const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    ['toast', 'sfx', 'csWant', 'playMQ', 'lifeEnd', 'ev', 'hudRefresh'].forEach(k => { try { window[k] = () => {}; } catch (e) {} });
    // 카드 찾기: 실제 생성기에서 band·path·living·income이 맞는 인생 번호
    let p = null; for (let i = 0; i < 40000 && !p; i++) { const q = lifeGen(lifeSeedNew()); if (q.band === card.band && q.path === card.path && q.living === card.living && q.income === card.income) p = q; }
    if (!p) return { err: 'no card' };
    p.trait = trait; if (p.majorSt) p.majorSt = 'jik';                // 성향·전공은 비교를 위해 고정
    setSlot('life'); S = fresh(); S.mode = 'life'; S.life = lifeFresh(); S.life.prof = p; S.life.seed = p.seed; S.life.rolls = 1;
    birthApply(); S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.first = dayKey(); S.day = dayKey(); S.todayQ = []; S.prologue = 0;
    const fx = lifeFx(p), start = { coin: S.coin, tier: TIERS[S.tier].name, ju: S.stats.ju, stats: Object.assign({}, S.stats) };
    let t = T.birth, en = 100, full = 100, waitMin = 0, waitEn = 0, waitFull = 0, food = 0, gifts = 0, giftLog = [], dep = 0, gear = 0;
    const cd = { mat: -99, bed: -99, bench: -99 }; let mat = false, bed = false; const rows = [], marks = [], stall = {};
    const pendLease = { i: null }; const stallAge = {}; let lostAt = {}, nq = 0, mg = 0, dry = 0;
    const regen = dt => { en = Math.min(100, en + dt / 6); full = Math.min(fullMax(), full + dt / 4); };
    const tick = dt => { t += dt; regen(dt); };
    // 체력·포만감: 모자라면 쉬거나 사 먹고, 그래도 안 되면 기다린다
    function need(kind) {
      const ec = ENERGY_COST[kind] || 0, fc = fullCost(kind);
      let guard = 0;
      while (en < ec && guard++ < 50) {
        if (bed && t - cd.bed >= 30) { en = Math.min(100, en + 60); cd.bed = t; tick(T.rest); continue; }
        if (mat && t - cd.mat >= 20) { en = Math.min(100, en + 30); cd.mat = t; tick(T.rest); continue; }
        if (t - cd.bench >= 20) { en = Math.min(100, en + 12); cd.bench = t; tick(T.rest + T.walk); continue; }
        const w = Math.min(20 - (t - cd.bench), (ec - en) * 6) + 0.01; waitMin += w; waitEn += w; tick(w);
      }
      guard = 0;
      while (full < fc && guard++ < 50) {
        const pr = foodPrice({ cost: 40 });
        if (S.coin >= pr) { S.coin -= pr; food += pr; full = Math.min(fullMax(), full + 45); tick(T.eat); continue; }
        const w = (fc - full) * 4 + 0.01; waitMin += w; waitFull += w; tick(w);
      }
      en -= ec; full -= fc;
    }
    function grantX(xp, coin) { S.coin += coin; S.xp += xp; while (S.xp >= window.need(S.lv)) { S.xp -= window.need(S.lv); S.lv++; } }
    function growMove() { const gr = tierGrow(); if (gr && gr.wasTop) { const mv = tierMove(S.peak); if (mv.ok && mv.cost) dep += mv.cost; if (mv.lease) pendLease.i = mv.i; } }
    function questDo(q) {
      need('quest'); nq++;
      const tt = totals(); let ok = 0, h = (!S.done.length) ? 3 : 2, mk = Math.min(3, Math.floor(tt.def / 30)) + perkSum('mak'), kn = Math.min(4, 1 + Math.floor(tt.atk / 15)) + perkSum('kan'), failed = false;
      q.qs.forEach(() => { if (failed) return; let pp = acc; if (kn > 0) { kn--; pp += (1 - pp) * 0.5; } if (rnd() < pp) ok++; else if (mk > 0) mk--; else if (--h <= 0) failed = true; });
      tick(T.quest + T.walk);
      if (failed) return false;
      const ratio = ok / q.qs.length;
      grantX(Math.round(q.xp * (0.5 + 0.5 * ratio) * (1 + (perkSum('xp') + statPct('jik')) / 100)), Math.round(q.coin * (0.5 + 0.5 * ratio) * (1 + perkSum('coin') / 100)));
      Object.keys(q.stat || {}).forEach(k => { S.stats[k] = Math.min(100, S.stats[k] + Math.round(q.stat[k] * ratio)); });
      { const a0 = S.life.age; S.done.push(q.id); lifeTick(); if (S.life.age === a0) stallAge[a0] = (stallAge[a0] || 0) + 1; S.done.pop(); }
      S.done.push(q.id); if (q.reward && S.owned.indexOf(q.reward) < 0) S.owned.push(q.reward);
      // 생활 이벤트: 퀘스트 셋에 한 번 꼴(실제는 하루 두 번 상한이라 더 적다), 보통 맞는 쪽
      if (nq % 3 === 0) grantX(30, 12);
      growMove(); return true;
    }
    function doLease() {
      tick(T.lease); const tier = S.leaseBest && S.leaseBest.any != null ? 0 : (acc >= 0.8 ? 1 : 2), end = LEASE_ENDS[tier];
      const was = S.leaseBest ? S.leaseBest.any : null; if (!S.leaseBest) S.leaseBest = {};
      if (was == null || tier < was) { const prev = was == null ? { xp: 0, coin: 0, stat: 0 } : LEASE_ENDS[was]; grantX(end.xp - prev.xp, end.coin - prev.coin); S.stats.ju = Math.min(100, S.stats.ju + end.stat - prev.stat); S.leaseBest.any = tier; }
      if (!S.leaseDone) S.leaseDone = {}; S.leaseDone[pendLease.i] = 1; S.lease = null;
      const c = tierCost(pendLease.i); const okMove = S.coin >= c; if (okMove) { tierMove(pendLease.i); dep += c; }
      marks.push({ ev: 'lease' + pendLease.i, t, nq, coin: S.coin, cost: c, moved: okMove }); if (okMove) pendLease.i = null;
    }
    function bossWin(bb) { const pl = bossPlan(bb); let ok = 0, miss = 0; for (let i = 0; i < bb.qs.length && ok < pl.need && miss <= pl.survive; i++) { if (rnd() < acc) ok++; else miss++; } return ok >= pl.need; }
    function shop() {
      if (!mat && S.coin >= 90 + 60) { S.coin -= 90; mat = true; }
      if (!bed && furnTier() >= 5 && S.coin >= 340 + 150) { S.coin -= 340; bed = true; }
      if (S.tier < S.peak && pendLease.i == null && !lifeNest()) { const c = tierCost(S.peak); if (leaseGate(S.peak)) pendLease.i = S.peak; else if (S.coin >= c) { tierMove(S.peak); dep += c; } }
      const cand = []; [ITEMS, PETS, MOUNTS].forEach(Tb => Object.keys(Tb).forEach(id => { const it = Tb[id]; if (it.special || !(it.cost > 0) || S.owned.indexOf(id) >= 0 || (it.mq && !mqOk(it.mq))) return; if ((it.atk || 0) + (it.def || 0) > 0) cand.push([id, it]); }));
      cand.sort((a, c) => a[1].cost - c[1].cost);
      const reserve = 300;
      for (const [id, it] of cand) { if (S.coin - it.cost < reserve) break; S.coin -= it.cost; gear += it.cost; S.owned.push(id); const cur = allItems(S.equip[it.slot]); const v = x => (x.atk || 0) * 1.2 + (x.def || 0); if (!cur || v(it) >= v(cur)) S.equip[it.slot] = id; break; }
    }
    const fitCount = () => QUESTS.filter(q => !q.trip && fits(q)).length;
    const left = () => QUESTS.filter(q => !q.trip && fits(q) && S.done.indexOf(q.id) < 0).length;
    const pool0 = fitCount();
    let ended = null, guard = 0, stallWhy = null;
    while (!ended && guard++ < 2000 && t < 600) {
      lifeTick(); dripEnsure(); shop();
      if (pendLease.i != null) {
        const c = tierCost(pendLease.i);
        // 계약은 하고, 이사 보증금은 모일 때까지 기다린다
        if (!(S.leaseDone && S.leaseDone[pendLease.i])) { doLease(); continue; }
        if (S.coin >= c) { tierMove(pendLease.i); dep += c; pendLease.i = null; continue; }
      }
      const nx = mqNext();
      // 본가·기숙사 플레이어: 원룸 전세(7)가 열리면 직접 계약하러 간다(2장 조건)
      if (nx && nx.id === 'lease' && mqDone('job') && S.peak >= 7 && !leaseDoneAny() && pendLease.i == null) { if (leaseGate(7)) pendLease.i = 7; continue; }
      if (nx && nx.id === 'home' && mqDone('wedding') && S.peak >= 8 && !(S.leaseDone && S.leaseDone[8]) && (S.paid || 0) < 8 && (pendLease.i == null || (S.leaseDone && S.leaseDone[pendLease.i]))) { S.lease = null; if (leaseGate(8)) { pendLease.i = 8; doLease(); } continue; }
      if (nx && mqReady(nx)) {
        // lifeBeforeCh 그대로: 그 장의 나이로 맞추고 선물을 준다
        const age = lifeChAge(nx.id), pr = S.life.prof; S.life.yrs[nx.id] = 1;
        const ageBefore = S.life.age;
        if (age && S.life.anch.age < age) S.life.anch = { age, done: S.done.length };
        const g = (lifeNest() && pr.living === '본가' ? 40 : 0) + (pr.income === '넉넉' ? 60 : 0); if (g) { S.coin += g; gifts += g; giftLog.push(nx.id + ':' + g); }
        tick(T.cine); lifeTick();
        rows.push({ ch: nx.no, id: nx.id, nq, t: Math.round(t), lv: S.lv, ju: S.stats.ju, coin: S.coin, ageBefore, age: S.life.age, fit: fitCount(), left: left(), wait: Math.round(waitMin) });
        if (nx.id === 'lease' && S.peak < 7) { S.peak = 7; marks.push({ ev: 'lease-fallback', nq }); }
        if (nx.id === 'home' && (S.paid || 0) < 8 && !(S.leaseDone && S.leaseDone[8])) { S.peak = Math.max(S.peak, 8); marks.push({ ev: 'home-fallback', nq }); }
        tick(T.mq); mqPay(nx, acc >= 0.8 ? 'good' : 'ok'); S.life.chq = S.life.chq || {}; S.life.chq[nx.id] = S.done.length;
        if (nx.id === 'home') { tick(T.end); ended = { t: Math.round(t), nq, title: lifeTitleId(), tier: TIERS[S.tier].name, coin: S.coin, lv: S.lv, stats: Object.assign({}, S.stats), boss: (S.bossDone || []).length }; }
        continue;
      }
      // 보스(조건 되면, 진 뒤엔 퀘스트 다섯 개 뒤 다시)
      let did = false;
      for (const bb of BOSSES) { if (bossReady(bb) && !bossCleared(bb.id) && !((lostAt[bb.id] ?? -99) > nq - 5)) { need('boss'); tick(T.boss); const w = bossWin(bb); marks.push({ ev: 'boss:' + bb.id + (w ? '+' : '-'), t: Math.round(t), nq });
          if (w) { S.bossDone.push(bb.id); S.coin += 200; S.stats[bb.stat] = Math.min(100, S.stats[bb.stat] + 15); growMove(); } else { lostAt[bb.id] = nq; S.peak = Math.max(S.tier, S.peak - 1); } did = true; break; } }
      if (did) continue;
      const ep = (S.done.length >= 4 && nq % 4 === 0) ? EPISODES.find(e => epBestOf(e.id) === null && (!e.when || e.when())) : null;
      if (ep) { need('ep'); tick(T.ep); const tier = acc >= 0.8 ? 1 : 2, end = ep.ends[Math.min(tier, ep.ends.length - 1)]; S.epBest = S.epBest || {}; S.epBest[ep.id] = tier; grantX(end.xp || 0, end.coin || 0); if (end.stat) S.stats[ep.stat] = Math.min(100, S.stats[ep.stat] + end.stat); growMove(); nq++; continue; }
      const q = QUESTS.find(q => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q) && qReach(q))
        || (mqOk('car') ? QUESTS.find(q => q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qReach(q)) : null);
      if (q) { questDo(q); continue; }
      // 할 퀘스트가 없다: 막힌 이유를 적고 도장 찍기(중, 경험치 20·코인 30)로 버틴다
      const why = !nx ? 'end' : nx.id === 'lease' ? '집' + S.stats.ju + '/42' : nx.id === 'home' ? '집' + S.stats.ju + '/48·투룸' : 'Lv' + S.lv;
      if (!stallWhy) { stallWhy = { why, t: Math.round(t), nq, ch: nx && nx.no, left: left() }; }
      need('game'); tick(T.mg); grantX(20, rnd() < 0.7 ? 30 : 0); mg++; growMove();
      stall[nx ? nx.id : 'x'] = (stall[nx ? nx.id : 'x'] || 0) + 1;
    }
    return { stallAge, seed: p.seed, card, trait, acc, fx, start, pool0, rows, ended, marks, stallWhy, stall, mg, wait: Math.round(waitMin), waitEn: Math.round(waitEn), waitFull: Math.round(waitFull), food, gifts, giftLog, dep, gear, t: Math.round(t), nq, coinEnd: S.coin };
  }, { card, acc, trait, T, rs, PROP });
  RUNS.push({ ck, ...r });
  const e = r.ended; if (MULTI) continue;
  console.log(`${ck} ${Object.values(card).join(' ')} ${trait} acc${acc} | start ￦${r.start?.coin} ${r.start?.tier} 집${r.start?.ju} pool${r.pool0} | ` +
    (r.rows || []).map(x => `${x.ch}장 q${x.nq}/${x.t}m Lv${x.lv} 집${x.ju} 나이${x.ageBefore}→${x.age}`).join(' · ') +
    ` | ${e ? `60살 ${e.t}m q${e.nq} ${e.tier} ${e.title} Lv${e.lv}` : `미완 ${r.t}m q${r.nq}`} | 막힘 ${JSON.stringify(r.stallWhy)} 도장${r.mg} ${JSON.stringify(r.stall)} | 대기 ${r.wait}m(체력${r.waitEn}/배${r.waitFull}) 밥￦${r.food} 선물￦${r.gifts} 보증금￦${r.dep}` +
    ` | ${(r.marks || []).map(m => m.ev + '@q' + m.nq + (m.moved === false ? '(이사못함￦' + m.cost + ')' : '')).join(' ')}`);
}
if (MULTI) { const g = {}; for (const r of RUNS) { const k = r.ck + ' ' + r.acc; (g[k] = g[k] || []).push(r); }
  const avg = a => Math.round(a.reduce((x, y) => x + y, 0) / a.length), mx = a => Math.max(...a);
  const summ = {};
  for (const [k, a] of Object.entries(g)) { const ch = n => a.map(r => (r.rows.find(x => x.ch === n) || {}).t ?? 999), cq = n => a.map(r => (r.rows.find(x => x.ch === n) || {}).nq ?? 999);
    summ[k] = { card: Object.values(a[0].card).join(' '), end: avg(a.map(r => r.ended ? r.ended.t : 600)), endMax: mx(a.map(r => r.ended ? r.ended.t : 600)), q: avg(a.map(r => r.nq)), ch2: avg(ch2 = ch(2)), ch2q: avg(cq(2)), ch5gap: avg(a.map((r, i) => cq(5)[i] - cq(4)[i])), wait: avg(a.map(r => r.wait)), food: avg(a.map(r => r.food)), dep: avg(a.map(r => r.dep)), coinEnd: avg(a.map(r => r.ended ? r.ended.coin : 0)), unfinished: a.filter(r => !r.ended).length, ch: [1,2,3,4,5,6].map(n => avg(ch(n).filter(x => x < 999)) + 'm/q' + avg(cq(n).filter(x => x < 999))).join(' '), age25: avg(a.map(r => r.stallAge[25] || 0)), age31: avg(a.map(r => r.stallAge[31] || 0)) };
    console.log(k, JSON.stringify(summ[k])); a.filter(r => !r.ended || r.stallWhy).forEach(r => console.log('   stall', JSON.stringify(r.stallWhy), JSON.stringify(r.stall), 'ju', r.rows.length, JSON.stringify(r.rows.map(x => x.ch + '@' + x.nq)))); }
  fs.writeFileSync('ops/review-1009/tools/econ-life-seeds' + (PROP ? '-prop' : '') + '.json', JSON.stringify(summ, null, 1)); var ch2; }
else fs.writeFileSync('ops/review-1009/tools/econ-life.json', JSON.stringify(RUNS, null, 1));
console.log('errors', errs.slice(0, 5));
await b.close();
