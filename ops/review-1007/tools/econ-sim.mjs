// 경제·진행 시뮬레이션 (리뷰 1007 경제 담당)
// 게임을 열고 실제 함수(rollDay, pickDaily, dripEnsure, tierGrow, tierMove, autoClaim, msCheck, mqReady, quizAvail ...)를 부르면서
// "하루 10분" 플레이어를 날짜(TESTSHIFT)를 밀어 가며 돌린다. 화면이 필요한 보상(퀘스트 결과, 사건, 보스, 메인 퀘스트)은
// 게임 코드의 공식을 그대로 옮겨 계산한다. 실행: node ops/review-1007/tools/econ-sim.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs';
const GAME = url.pathToFileURL(path.resolve(process.cwd(), 'prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });

const PERSONAS = {
  worker: { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29, living: '자취' },
  student: { status: '대학생', living: '자취', region: '수도권', age: 23 },
  seeker: { status: '취준생', prep: 1, region: '광역시', age: 26, living: '본가' },
};
// 스타일: typical = 하루 10분, 결과 두 배 광고 하루 1회 + 출석 광고, 도장 찍기 하·중, 숨은 보상 하루 2개
//         noad = 광고 0회, 도장 찍기 안 함 / farm = typical + 남는 시간에 보스 반복
const STYLES = {
  typical: { min: 10, dbl: 1, att: 1, mg: 1, eggs: 2, farm: 0, acc: 0.85 },
  noad: { min: 10, dbl: 0, att: 0, mg: 0, eggs: 1, farm: 0, acc: 0.85 },
  farm: { min: 10, dbl: 1, att: 1, mg: 1, eggs: 2, farm: 1, acc: 0.85 },
  long: { min: 25, dbl: 3, att: 1, mg: 1, eggs: 3, farm: 0, acc: 0.85 },
};
// 활동별 분(추정): 글자 수 측정(econ-text.mjs) 기준. 퀘스트 평균 388자 + 걷기·대화 전환
const T = { overhead: 1.0, quest: 1.8, review: 1.0, quiz: 1.2, mq: 3.5, lease: 5.0, ep: 3.0, boss: 2.5, mg: 0.5, care: 0.3 };

const out = {};
for (const [pk, persona] of Object.entries(PERSONAS)) for (const [sk, style] of Object.entries(STYLES)) {
  if (pk !== 'worker' && sk !== 'typical' && sk !== 'noad') continue;
  out[pk + '/' + sk] = await page.evaluate(({ persona, style, T }) => {
    // 결정적 난수
    let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const toastO = window.toast; window.toast = () => {};
    S = fresh(); Object.assign(S, persona); applyStarter(); S.onboarded = true; S.tut = 1; S.tuts = ['intro'];
    S.first = null; S.day = null; TESTSHIFT = 0;
    const src = {}; const add = (k, v) => { src[k] = (src[k] || 0) + v; };
    let spent = { dep: 0, furni: 0, gear: 0, food: 0 }, rows = [], pendLease = null, leaseTier = null, clean = 100, mood = 100;
    const furniPlaced = id => hasFurni(id);
    const ownedItem = id => S.owned.indexOf(id) >= 0;
    const LT = {}; // 날짜별 이벤트
    const note = (d, s) => { (LT[d] = LT[d] || []).push(s); };
    const catalog = () => { // 지금 살 수 있는(잠금 풀린) 것 중 아직 안 산 것의 값 합, 잠긴 것 합
      let open = 0, openN = 0, locked = 0, cheapest = null;
      [ITEMS, PETS, MOUNTS].forEach(Tb => Object.keys(Tb).forEach(id => { const it = Tb[id]; if (it.special || !(it.cost > 0) || ownedItem(id)) return;
        if (it.mq && !mqOk(it.mq)) { locked += it.cost; return; } open += it.cost; openN++; if (!cheapest || it.cost < cheapest) cheapest = it.cost; }));
      Object.keys(FURNI).forEach(id => { const f = FURNI[id]; if (id === 'ramen' || hasFurni(id)) return;
        if ((f.mq && !mqOk(f.mq)) || S.tier < f.need) { locked += f.cost; return; } open += f.cost; openN++; if (!cheapest || f.cost < cheapest) cheapest = f.cost; });
      return { open, openN, locked, cheapest };
    };
    function questDo(q) {
      // finish() 공식: 코인·XP×(0.5+0.5×정답률)×perk×(청결<30 0.8 / 기분<30 0.8)
      if (!useFullSim(q.keys ? 'review' : 'quest')) return null;
      let ok = 0, wrong = 0; const marks = [];
      const kan = Math.min(4, 1 + Math.floor(totals().atk / 15)) + perkSum('kan');
      const mak = Math.min(3, Math.floor(totals().def / 30)) + perkSum('mak');
      const hearts = (!q.keys && !S.done.length) ? 3 : 2; let h = hearts, mk = mak, kn = kan, failed = false;
      q.qs.forEach((x, i) => { if (failed) return; let p = style.acc; if (kn > 0 && p < 1) { kn--; p = p + (1 - p) * 0.5; }
        const r = rnd() < p; marks.push(r); if (r) ok++; else { wrong++; if (mk > 0) mk--; else if (--h <= 0) failed = true; } });
      const ratio = ok / q.qs.length, dirty = clean < 30, blue = mood < 30;
      const xp = failed ? 0 : Math.round(q.xp * (0.5 + 0.5 * ratio) * (1 + perkSum('xp') / 100) * (blue ? 0.8 : 1));
      const coin = failed ? 0 : Math.round(q.coin * (0.5 + 0.5 * ratio) * (1 + perkSum('coin') / 100) * (dirty ? 0.8 : 1));
      if (!failed) mood = Math.min(100, mood + 4);
      clean = Math.max(0, clean - 2);
      grantSim(xp, coin, q.keys ? 'review' : 'quest');
      if (!failed) Object.keys(q.stat || {}).forEach(k => { S.stats[k] = Math.min(100, S.stats[k] + Math.round(q.stat[k] * ratio)); });
      if (q.keys) { q.keys.forEach((r, i) => { if (marks[i]) { r.box = Math.min(r.box + 1, BOXDUE.length - 1); r.due = addDays(dayKey(), BOXDUE[r.box]); if (r.box >= BOXDUE.length - 1) r.done = 1; } else { if (r.syn) reviewAdd(r.q, r.i); r.box = 0; r.due = addDays(dayKey(), 1); } });
        S.review = S.review.filter(r => !r.done); if (q.dq && !failed) S.quizDay = dayKey(); }
      else {
        q.qs.forEach((_, i) => { if (marks[i] === false) reviewAdd(q.id, i); });
        if (!failed && S.done.indexOf(q.id) < 0) { S.done.push(q.id); if (q.reward && S.owned.indexOf(q.reward) < 0) S.owned.push(q.reward); }
        if (!failed && S.todayQ.indexOf(q.id) >= 0 && S.todayDone.indexOf(q.id) < 0) S.todayDone.push(q.id);
        if (!failed && !S.bonus && S.todayQ.length && todayLeft() === 0) { S.bonus = true; const bo = 80 * dailyMult(); S.coin += bo; add('daily_complete', bo); }
      }
      if (!failed) growMove();
      return { coin, xp, failed };
    }
    function grantSim(xp, coin, k) { if (coin) { S.coin += coin; add(k, coin); } if (xp) { S.xp += xp; while (S.xp >= need(S.lv)) { S.xp -= need(S.lv); S.lv++; } } }
    function useFullSim(kind) { const c = fullCost(kind); if (S.full < c) { // 사 먹는다(편의점 도시락 40/45)
        const pr = foodPrice({ cost: 40 }); S.coin -= pr; spent.food += pr; S.full = Math.min(fullMax(), S.full + 45); }
      S.full -= c; return true; }
    function growMove() { const gr = tierGrow(); if (gr && gr.wasTop) { const mv = tierMove(S.peak); if (mv.ok && mv.cost) spent.dep += mv.cost; if (mv.lease) pendLease = mv.i; } }
    function tryMoveUp() { // 코인이 모자라 못 옮긴 거처로 옮긴다
      if (S.tier < S.peak && !pendLease) { const c = tierCost(S.peak); if (leaseGate(S.peak)) { pendLease = S.peak; return; } if (S.coin >= c) { tierMove(S.peak); spent.dep += c; } } }
    function doLease() { // leaseEnd 공식. 보통 플레이어는 첫 계약 '아슬아슬'(1), 두 번째는 '지켰다'(0)
      const tier = S.leaseBest && S.leaseBest.any != null ? 0 : 1, end = LEASE_ENDS[tier];
      const was = S.leaseBest ? S.leaseBest.any : null; if (!S.leaseBest) S.leaseBest = {};
      if (was == null || tier < was) { const prev = was == null ? { xp: 0, coin: 0, stat: 0 } : LEASE_ENDS[was];
        grantSim(end.xp - prev.xp, end.coin - prev.coin, 'lease'); S.stats.ju = Math.min(100, S.stats.ju + end.stat - prev.stat); S.leaseBest.any = tier; }
      if (!S.leaseDone) S.leaseDone = {}; S.leaseDone[pendLease] = 1; S.lease = null;
      const c = tierCost(pendLease); if (S.coin >= c) { tierMove(pendLease); spent.dep += c; }
      pendLease = null; }
    function doMQ(c) { const g = 'good'; // 선택 4개 안팎이라 보통 good~ok. good으로 계산(상한)
      mqPay(c, g); const R = MQ_REWARD[c.id]; add('mq', R.coin);
      if (c.id === 'home') { /* mqPay가 자가 첫 칸을 연다 */ }
      if (style.dbl && adLeft('mq') > 0) { adCount('mq'); S.coin += R.coin; add('ad_mq', R.coin); } }
    function doEp(e) { // 첫 시도는 '절반'(1), 두 번째 시도 없음
      const tier = 1, end = e.ends[tier]; S.epBest[e.id] = tier; grantSim(end.xp, end.coin, 'ep'); S.stats[e.stat] = Math.min(100, S.stats[e.stat] + end.stat); }
    function bossWin(bb) { const pl = bossPlan(bb); // 이길 확률: 필요한 정답 수와 버틸 수 있는 오답 수로 근사
      const n = bb.qs.length, needOk = pl.need, canMiss = pl.survive; let ok = 0, miss = 0, i = 0;
      for (; i < n && ok < needOk && miss <= canMiss; i++) { if (rnd() < style.acc) ok++; else miss++; }
      return ok >= needOk; }
    function doBoss(bb) { useFullSim('boss'); const w = bossWin(bb);
      if (w) { if (S.bossDone.indexOf(bb.id) < 0) S.bossDone.push(bb.id); S.coin += 200; add('boss', 200); S.stats[bb.stat] = Math.min(100, S.stats[bb.stat] + 15); growMove(); }
      else { S.peak = Math.max(0, S.peak - 1); if (S.tier > S.peak) S.tier = S.peak; }
      return w; }
    function shop() { // 보통 플레이어의 소비: 거처 이동 > 세간(싼 것부터, 다음 보증금 몫은 남김) > 장비 하루 1개(싼 것부터)
      tryMoveUp();
      const nextDep = S.peak < TIERS.length - 1 ? TIER_DEP[Math.min(S.peak + 1, 14)] - TIER_DEP[Math.max(S.paid || 0, S.tier)] : 0;
      const reserve = Math.max(0, nextDep);
      let bought = 0;
      FURNI_ORDER.slice().sort((a, b2) => FURNI[a].cost - FURNI[b2].cost).forEach(id => { const f = FURNI[id];
        if (id === 'ramen' || hasFurni(id) || S.tier < f.need || !ROOMSPEC[S.tier] || (f.mq && !mqOk(f.mq))) return;
        if (S.coin - f.cost < reserve) return; S.coin -= f.cost; spent.furni += f.cost; S.furni.push({ id, x: 1, y: 1 }); bought++; });
      const cand = []; [ITEMS, PETS, MOUNTS].forEach(Tb => Object.keys(Tb).forEach(id => { const it = Tb[id]; if (it.special || !(it.cost > 0) || ownedItem(id) || (it.mq && !mqOk(it.mq))) return; cand.push([id, it]); }));
      cand.sort((a, b2) => a[1].cost - b2[1].cost);
      for (const [id, it] of cand) { if (S.coin - it.cost < reserve + 100) break; S.coin -= it.cost; spent.gear += it.cost; S.owned.push(id);
        // 더 좋은 것을 낀다(능력 있는 것 우선, 같은 칸)
        const cur = allItems(S.equip[it.slot]); const v = x => (x.atk||0)*1.2 + (x.def||0); if (!cur || v(it) >= v(cur)) S.equip[it.slot] = id; break; }
      if (ownedItem('bird') && S.equip.pet === 'pnone') S.equip.pet = 'bird';
    }
    const eggsLeft = []; Object.keys(MAPS).forEach(k => (MAPS[k].eggs || []).forEach(e => eggsLeft.push({ map: k, e })));
    const DAYS = 45;
    let firstEmpty = null, tripOpen = false, contentEnd = null, allEnd = null; const lostAt = {};
    for (let d = 1; d <= DAYS; d++) {
      TESTSHIFT = (d - 1) * DAYMS;
      // 하루 사이 생활 욕구가 떨어진다(실제 시간 24시간): 청결 -96, 기분 -120(선풍기를 놓았으면 -60). 포만감·체력은 다 찬다
      if (d > 1) { clean = Math.max(0, clean - 96); mood = Math.max(0, mood - (hasFurni('fan') ? 60 : 120)); S.full = fullMax(); }
      const c0 = S.coin; const lv0 = S.lv, tier0 = S.tier;
      rollDay(); if (S.upNote && S.upNote.ok && S.upNote.cost) spent.dep += S.upNote.cost; if (S.upNote && S.upNote.lease) pendLease = S.upNote.i; S.upNote = null;
      (S.msNew || []).forEach(m => { add('streak_ms', m.coin); note(d, '연속 ' + m.d + '일 보상 ' + m.coin + (m.item ? ' + ' + m.item : '')); }); S.msNew = [];
      const cl = S.coin; autoClaim(); add('attend', S.coin - cl);
      if (style.att && adLeft('att') > 0) { const c = attBonus(); adCount('att'); S.coin += c; add('ad_att', c); }
      let t = style.min - T.overhead; const did = [];
      // 집안일: 세탁기·TV·선풍기·소파가 있으면 들러서 채운다
      if (hasFurni('wash') && clean < 60) { clean = Math.min(100, clean + 60); t -= T.care; }
      if (hasFurni('tv') && mood < 60) { mood = Math.min(100, mood + 35); t -= T.care; } else if (hasFurni('sofa') && mood < 60) { mood += 20; t -= T.care; } else if (hasFurni('fan') && mood < 30) { mood += 15; t -= T.care; }
      if (hasFurni('desk2') && !(S.fcd && S.fcd.desk2 === dayKey())) { grantSim(20, 0, 'furni'); t -= T.care; }
      if (hasFurni('shelf')) { grantSim(25, 0, 'furni'); t -= T.care; }
      if (S.equip.pet === 'dog' && petHome()) { S.coin += 15; add('dog', 15); }
      if (mqDone('card') && rnd() < 0.5) { S.coin += 20; add('cashback', 20); }
      // 1) 전세 계약(거처가 막혀 있으면 먼저)
      if (pendLease && t >= T.lease) { doLease(); t -= T.lease; did.push('전세계약'); note(d, '전세 계약 → ' + TIERS[S.tier].name); }
      // 2) 메인 퀘스트(하루 한 장)
      const nx = mqNext(); if (nx && mqReady(nx) && t >= T.mq && !(nx.id === 'lease' && !leaseDoneAny())) { doMQ(nx); t -= T.mq; did.push('MQ' + nx.no); note(d, '메인 ' + nx.no + '장'); }
      else if (nx && nx.id === 'lease' && mqReady(nx) && !leaseDoneAny()) { /* 2장은 전세 계약과 같이 한다 */ if (t >= T.lease) { pendLease = pendLease || 7; doLease(); doMQ(nx); t -= T.lease; did.push('MQ2+전세'); note(d, '메인 2장(전세 계약)'); } }
      // 3) 오늘 퀘스트 → 열린 다른 퀘스트
      let firstQ = true;
      const openQ = () => { const tl = todayList().filter(q => S.todayDone.indexOf(q.id) < 0 && S.done.indexOf(q.id) < 0);
        const rest = QUESTS.filter(q => fits(q) && S.done.indexOf(q.id) < 0 && (q.trip ? (tripOpen && qReach(q)) : (qOpen(q) && qReach(q))) && tl.indexOf(q) < 0);
        return tl.concat(rest); };
      tripOpen = mqOk('car') && (ownedItem('car') || ownedItem('sedan') || ownedItem('evcar'));
      while (t >= T.quest) { const q = openQ()[0]; if (!q) break; const r = questDo(q); t -= T.quest; did.push(q.id);
        if (firstQ && style.dbl && r && r.coin >= 30 && adLeft('dbl') > 0) { adCount('dbl'); S.coin += r.coin; add('ad_dbl', r.coin); }
        if (style.dbl > 1 && !firstQ && r && r.coin >= 30 && adLeft('dbl') > 0) { adCount('dbl'); S.coin += r.coin; add('ad_dbl', r.coin); }
        firstQ = false; }
      const openNow = openQ().length; if (contentEnd == null && openNow === 0 && dripLocked().length === 0) contentEnd = d; if (allEnd == null && contentEnd != null && QUESTS.filter(q => fits(q) && S.done.indexOf(q.id) < 0).length === 0) allEnd = d;
      if (openNow === 0 && firstEmpty == null && S.done.length > 5) firstEmpty = d;
      // 4) 복습 퀴즈, 틀린 문항 복습
      if (t >= T.quiz && quizAvail()) { const q = quizBuild(); questDo(q); t -= T.quiz; did.push('quiz'); }
      if (t >= T.review) { const rq = reviewQuest(); if (rq) { questDo(rq); t -= T.review; did.push('review'); } }
      // 5) 보스(조건 되고 아직 못 이긴 것), 사건(하루 하나)
      for (const bb of BOSSES) { if (t < T.boss) break; if (bossReady(bb) && !bossCleared(bb.id) && !((lostAt[bb.id]||-9) > d - 3)) { const w = doBoss(bb); if (!w) lostAt[bb.id] = d; t -= T.boss; did.push('boss:' + bb.id + (w ? '+' : '-')); note(d, '보스 ' + bb.name + (w ? ' 승' : ' 패')); } }
      const ep = EPISODES.find(e => epBestOf(e.id) === null); if (ep && t >= T.ep) { doEp(ep); t -= T.ep; did.push('ep:' + ep.id); }
      // 6) 도장 찍기 하·중
      if (style.mg) { [['하', 15, 10], ['중', 30, 20]].forEach(([k, c, x]) => { if (t >= T.mg && rnd() < (k === '하' ? 0.95 : 0.7)) { grantSim(x, c, 'minigame'); t -= T.mg; } }); }
      // 7) 숨은 보상
      for (let i = 0; i < style.eggs && eggsLeft.length; i++) { const k = eggsLeft.findIndex(x => mapOpen(x.map.split('_')[0]) || PARK_MAPS[x.map] && tripOpen);
        if (k < 0) break; const e = eggsLeft.splice(k, 1)[0].e; grantSim(e.xp || 0, e.coin || 0, 'egg'); }
      // 8) 생활 이벤트 하루 평균 1.5번, 대개 맞는 쪽을 고른다(+10~30, XP 25)
      if (S.done.length) { grantSim(30, 12, 'life'); }
      // 9) 남는 시간에 보스 반복(farm)
      if (style.farm) { while (t >= T.boss) { const bb = BOSSES.filter(x => bossReady(x)).sort((a, b2) => a.hp - b2.hp)[0]; if (!bb) break; doBoss(bb); t -= T.boss; did.push('farm:' + bb.id); } }
      shop();
      const cat = catalog();
      rows.push({ d, lv: S.lv, xp: S.xp, coin: S.coin, tier: S.tier, peak: S.peak, ju: S.stats.ju, stats: Object.assign({}, S.stats), done: S.done.length, openLeft: openNow,
        locked: dripLocked().length, mq: MQ_LIST.filter(c => mqDone(c.id)).length, streak: S.streak, gained: S.coin - c0, used: +(style.min - t).toFixed(1), slack: +t.toFixed(1),
        did: did.join(" "), ads: S.adN || 0, earned: Object.values(src).reduce((a, b2) => a + b2, 0), cat, clean, mood, atk: totals().atk, def: totals().def, bosses: S.bossDone.slice(), eps: Object.keys(S.epBest || {}).length, ending: endingReady() });
    }
    window.toast = toastO;
    const owned = S.owned.length, totalEarned = Object.values(src).reduce((a, b2) => a + b2, 0);
    return { rows, src, spent, LT, firstEmpty, contentEnd, allEnd, equip: Object.assign({}, S.equip), bossPlans: BOSSES.map(x => [x.id, bossPlan(x).need, x.qs.length, bossPlan(x).survive]), totalEarned, final: { lv: S.lv, tier: S.tier, peak: S.peak, coin: S.coin, owned, furni: S.furni.length } };
  }, { persona, style, T });
}
fs.writeFileSync(path.resolve(process.cwd(), 'ops/review-1007/tools/econ-sim.json'), JSON.stringify(out, null, 1));
for (const [k, r] of Object.entries(out)) {
  console.log('\n==', k, 'contentEnd', r.contentEnd, 'allEnd', r.allEnd, 'equip', JSON.stringify(r.equip), 'bossPlans', JSON.stringify(r.bossPlans), 'earned', r.totalEarned, 'spent', JSON.stringify(r.spent), 'final', JSON.stringify(r.final));
  console.log('src', JSON.stringify(r.src));
  for (const x of r.rows) if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 21, 25, 30, 35, 40, 45].includes(x.d))
    console.log(`d${x.d} lv${x.lv} tier${x.tier}/${x.peak} ju${x.ju} coin${x.coin} +${x.gained} done${x.done} open${x.openLeft} lock${x.locked} mq${x.mq} used${x.used} slack${x.slack} cl${x.clean} mo${x.mood} atk${x.atk} def${x.def} boss${x.bosses.length} ep${x.eps} catOpen${x.cat.open}/${x.cat.openN} cheap${x.cat.cheapest} lockedCat${x.cat.locked} end${x.ending} | ${x.did}`);
  console.log('events', JSON.stringify(r.LT));
}
console.log('errs', errs.slice(0, 5));
await b.close();
