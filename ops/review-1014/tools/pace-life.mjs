// 리뷰 1014 페이싱 시뮬. ops/review-1009/tools/econ-life.mjs를 옮겨 나이 띠별 분·퀘스트를 재도록 고쳤다.
// 실행(저장소 루트):
//   node ops/review-1014/tools/pace-life.mjs            → 지금 게임(cur), 제안(plan), 제안+새 퀘스트 자리(plan+) 세 가지
//   MODES=plan PACE='[{"to":23,"n":2},...]' node ...   → 한 가지만, 해마다 활동 수를 바꿔 본다
//   SEEDS=8 로 판 수를 늘린다(기본 4). 결과: ops/review-1014/tools/pace-life.json
// 제안 모드는 ops/review-1014/pacing/apply.mjs를 스크래치 복사본에 돌려 그 파일을 연다(넣을 코드 그대로 잰다).
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs'; import os from 'node:os'; import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const TMP = process.env.TMPDIR_PACE || fs.mkdtempSync(path.join(os.tmpdir(), 'pace-'));
const PLAN_HTML = path.join(TMP, 'plan.html');
execFileSync('node', ['ops/review-1014/pacing/apply.mjs', PLAN_HTML], { stdio: 'inherit' });
const FILES = { cur: path.resolve(ROOT, 'prototype/newbie-quest-demo.html'), plan: PLAN_HTML };
const MODES = (process.env.MODES || 'cur,plan,plan+').split(',');
const PACE = process.env.PACE ? JSON.parse(process.env.PACE) : null;
const LV = process.env.LV ? process.env.LV.split(',').map(Number) : null;
const NSEED = +(process.env.SEEDS || 4);
const SEEDS = [777, 1301, 2203, 3407, 4409, 5501, 6607, 7703].slice(0, NSEED);
const CARDS = {
  A: { band: '수도권', path: '4년제', living: '본가', income: '보통' },
  B: { band: '그 외', path: '고졸', living: '자취', income: '빠듯' },
  C: { band: '광역시', path: '전문대', living: '기숙사', income: '넉넉' },
  D: { band: '수도권', path: '4년제', living: '자취', income: '넉넉' },
  E: { band: '그 외', path: '4년제', living: '기숙사', income: '빠듯' },
  F: { band: '광역시', path: '고졸', living: '본가', income: '빠듯' },
};
const ACCS = (process.env.ACCS || '0.85,0.75,0.65').split(',').map(Number);
// 활동별 분: 1009와 같고, 생활 이벤트 1분, 중간 장 2.5분을 더했다
const T = { quest: 1.8, walk: 0.4, mq: 3.5, lease: 5.0, ep: 3.0, boss: 2.5, mg: 0.6, cine: 1.0, birth: 2.5, end: 3.0, rest: 0.4, eat: 0.5, ev: 1.0, stage: 2.5 };

const b = await chromium.launch();
const OUT = { T, runs: [], summary: {} };
for (const mode of MODES) {
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(url.pathToFileURL(FILES[mode === 'cur' ? 'cur' : 'plan']).href + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  for (const [ck, card] of Object.entries(CARDS)) for (const acc of ACCS) for (const rs of SEEDS) {
    const r = await page.evaluate(({ card, acc, T, rs, mode, PACE, LV }) => {
      const PLAN = mode !== 'cur';
      if (PLAN && PACE) window.LIFE_PACE = PACE;
      // LV=a,b,c: 인생 모드 3·4·5장 레벨 조건을 바꿔 본다(제안 검토용)
      if (PLAN && LV && !window.__lv) { window.__lv = 1; const [l3, l4, l5] = LV; const C = id => MQ_LIST.find(c => c.id === id);
        const o3 = C('card').open, o4 = C('car').open, o5 = C('wedding').open, lv0 = () => { const v = S.lv; return v; };
        C('card').open = () => mqDone('lease') && S.lv >= l3 && mapOpen('bank') && lifeAgeOk('card');
        C('car').open = () => mqDone('card') && S.lv >= l4 && lifeAgeOk('car');
        C('wedding').open = () => mqDone('car') && S.lv >= l5 && lifeAgeOk('wedding'); }
      // 제안+: 퀘스트 담당이 쓸 자리를 LIFE_QUEST_BANDS.need만큼 가짜 퀘스트로 채운다(한 번만)
      if (mode === 'plan+' && !window.__stub) { window.__stub = 1; const base = QUESTS.find(q => q.id === 'geum3'); const th = ['geum', 'ui', 'ju', 'sik', 'jik']; let k = 0;
        LIFE_QUEST_BANDS.forEach(bd => { for (let i = 0; i < bd.need; i++) { const t = th[k++ % th.length]; QUESTS.push(Object.assign({}, base, { id: 'stub_' + bd.band + '_' + i, theme: t, fit: bd.fit, stat: { [t]: 8 }, reward: null })); } }); }
      let seed = rs; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      ['toast', 'sfx', 'csWant', 'playMQ', 'lifeEnd', 'ev', 'hudRefresh'].forEach(k => { try { window[k] = () => {}; } catch (e) {} });
      let p = null; for (let i = 0; i < 40000 && !p; i++) { const q = lifeGen(lifeSeedNew()); if (q.band === card.band && q.path === card.path && q.living === card.living && q.income === card.income) p = q; }
      if (!p) return { err: 'no card' };
      p.trait = '성실'; if (p.majorSt) p.majorSt = 'jik';
      setSlot('life'); S = fresh(); S.mode = 'life'; S.life = lifeFresh(); S.life.prof = p; S.life.seed = p.seed; S.life.rolls = 1;
      birthApply(); S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.first = dayKey(); S.day = dayKey(); S.todayQ = []; S.prologue = 0;
      let t = T.birth, en = 100, full = 100, waitMin = 0; const cd = { mat: -99, bed: -99, bench: -99 }; let mat = false, bed = false;
      const pendLease = { i: null }; const lostAt = {}; let nq = 0, nev = 0, evRep = 0, dry = 0, mg = 0; const evIds = new Set();
      const ages = { 20: { t: Math.round(t), nq: 0 } }, band = {}, stallAge = {}, stages = [], chs = [];
      const bandOf = a => a < 30 ? '20s' : a < 40 ? '30s' : a < 50 ? '40s' : '50s';
      const bump = (k, f, v = 1) => { const bd = bandOf(S.life.age); band[bd] = band[bd] || { q: 0, ev: 0, dry: 0, rep: 0, ep: 0, boss: 0 }; band[bd][f] += v; };
      const regen = dt => { en = Math.min(100, en + dt / 6); full = Math.min(fullMax(), full + dt / 4); };
      const tick = dt => { t += dt; regen(dt); };
      const mark = () => { const a = S.life.age; if (!ages[a]) ages[a] = { t: Math.round(t), nq }; };
      function needE(kind) {
        const ec = ENERGY_COST[kind] || 0, fc = fullCost(kind); let g = 0;
        while (en < ec && g++ < 50) {
          if (bed && t - cd.bed >= 30) { en = Math.min(100, en + 60); cd.bed = t; tick(T.rest); continue; }
          if (mat && t - cd.mat >= 20) { en = Math.min(100, en + 30); cd.mat = t; tick(T.rest); continue; }
          if (t - cd.bench >= 20) { en = Math.min(100, en + 12); cd.bench = t; tick(T.rest + T.walk); continue; }
          const w = Math.min(20 - (t - cd.bench), (ec - en) * 6) + 0.01; waitMin += w; tick(w); }
        g = 0;
        while (full < fc && g++ < 50) { const pr = foodPrice({ cost: 40 }); if (S.coin >= pr) { S.coin -= pr; full = Math.min(fullMax(), full + 45); tick(T.eat); continue; }
          const w = (fc - full) * 4 + 0.01; waitMin += w; tick(w); }
        en -= ec; full -= fc; }
      function grantX(xp, coin) { S.coin += coin; S.xp += xp; while (S.xp >= window.need(S.lv)) { S.xp -= window.need(S.lv); S.lv++; } }
      function growMove() { const gr = tierGrow(); if (gr && gr.wasTop) { const mv = tierMove(S.peak); if (mv.lease) pendLease.i = mv.i; } }
      function questDo(q) {
        needE('quest'); nq++;
        const tt = totals(); let ok = 0, h = (!S.done.length) ? 3 : 2, mk = Math.min(3, Math.floor(tt.def / 30)) + perkSum('mak'), kn = Math.min(4, 1 + Math.floor(tt.atk / 15)) + perkSum('kan'), failed = false;
        q.qs.forEach(() => { if (failed) return; let pp = acc; if (kn > 0) { kn--; pp += (1 - pp) * 0.5; } if (rnd() < pp) ok++; else if (mk > 0) mk--; else if (--h <= 0) failed = true; });
        tick(T.quest + T.walk); if (failed) return false;
        const ratio = ok / q.qs.length;
        grantX(Math.round(q.xp * (0.5 + 0.5 * ratio) * (1 + (perkSum('xp') + statPct('jik')) / 100)), Math.round(q.coin * (0.5 + 0.5 * ratio) * (1 + perkSum('coin') / 100)));
        Object.keys(q.stat || {}).forEach(k => { S.stats[k] = Math.min(100, S.stats[k] + Math.round(q.stat[k] * ratio)); });
        bump(0, 'q'); const a0 = S.life.age; S.done.push(q.id); if (q.reward && S.owned.indexOf(q.reward) < 0) S.owned.push(q.reward);
        lifeTick(); if (S.life.age === a0) stallAge[a0] = (stallAge[a0] || 0) + 1;
        if (!PLAN && nq % 3 === 0) grantX(30, 12);             // 지금 게임: 생활 이벤트는 날짜 제한이라 1009처럼 시간 없이 보상만
        growMove(); return true; }
      function doEvent(extra) {
        const e = lifeEvPick(lifeEvMonth()); if (!e) return false;
        if (evIds.has(e.id)) { evRep++; bump(0, 'rep'); } evIds.add(e.id);
        S.evSeen.push(e.id); S.life.evAge = S.life.age; S.life.evn = (S.life.evn || 0) + 1; nev++; bump(0, 'ev'); if (extra) { dry++; bump(0, 'dry'); }
        const ch = e.choices.slice().sort((x, y) => ((y.d || {}).xp || 0) - ((x.d || {}).xp || 0)); const c = rnd() < acc ? ch[0] : ch[ch.length - 1], d = c.d || {};
        grantX(d.xp || 0, d.coin > 0 ? d.coin : 0); if (d.coin < 0) S.coin = Math.max(0, S.coin + d.coin);
        tick(T.ev); lifeTick(); growMove(); return true; }
      function doLease() {
        tick(T.lease); const tier = S.leaseBest && S.leaseBest.any != null ? 0 : (acc >= 0.8 ? 1 : 2), end = LEASE_ENDS[tier];
        const was = S.leaseBest ? S.leaseBest.any : null; if (!S.leaseBest) S.leaseBest = {};
        if (was == null || tier < was) { const prev = was == null ? { xp: 0, coin: 0, stat: 0 } : LEASE_ENDS[was]; grantX(end.xp - prev.xp, end.coin - prev.coin); S.stats.ju = Math.min(100, S.stats.ju + end.stat - prev.stat); S.leaseBest.any = tier; }
        if (!S.leaseDone) S.leaseDone = {}; S.leaseDone[pendLease.i] = 1; S.lease = null;
        const c = tierCost(pendLease.i); if (S.coin >= c) { tierMove(pendLease.i); pendLease.i = null; } }
      function bossWin(bb) { const pl = bossPlan(bb); let ok = 0, miss = 0; for (let i = 0; i < bb.qs.length && ok < pl.need && miss <= pl.survive; i++) { if (rnd() < acc) ok++; else miss++; } return ok >= pl.need; }
      function shop() {
        if (!mat && S.coin >= 150) { S.coin -= 90; mat = true; }
        if (!bed && furnTier() >= 5 && S.coin >= 490) { S.coin -= 340; bed = true; }
        if (S.tier < S.peak && pendLease.i == null && !lifeNest()) { const c = tierCost(S.peak); if (leaseGate(S.peak)) pendLease.i = S.peak; else if (S.coin >= c) tierMove(S.peak); }
        const cand = []; [ITEMS, PETS, MOUNTS].forEach(Tb => Object.keys(Tb).forEach(id => { const it = Tb[id]; if (it.special || !(it.cost > 0) || S.owned.indexOf(id) >= 0 || (it.mq && !mqOk(it.mq))) return; if ((it.atk || 0) + (it.def || 0) > 0) cand.push([id, it]); }));
        cand.sort((a, c) => a[1].cost - c[1].cost);
        for (const [id, it] of cand) { if (S.coin - it.cost < 300) break; S.coin -= it.cost; S.owned.push(id); const cur = allItems(S.equip[it.slot]); const v = x => (x.atk || 0) * 1.2 + (x.def || 0); if (!cur || v(it) >= v(cur)) S.equip[it.slot] = id; break; } }
      let ended = null, guard = 0;
      while (!ended && guard++ < 3000 && t < 900) {
        lifeTick(); mark(); dripEnsure(); shop();
        if (pendLease.i != null) { const c = tierCost(pendLease.i);
          if (!(S.leaseDone && S.leaseDone[pendLease.i])) { doLease(); continue; }
          if (S.coin >= c) { tierMove(pendLease.i); pendLease.i = null; continue; } }
        // 제안: 한 해에 생활 이벤트 하나(첫 퀘스트 뒤부터, 지도를 옮길 때 뜬다)
        if (PLAN && S.done.length && S.life.evAge !== S.life.age && doEvent(false)) { mark(); continue; }
        const nx = mqNext();
        if (nx && nx.id === 'lease' && mqDone('job') && S.peak >= 7 && !leaseDoneAny() && pendLease.i == null) { if (leaseGate(7)) { pendLease.i = 7; continue; } }
        if (nx && nx.id === 'home' && mqDone('wedding') && S.peak >= 8 && !(S.leaseDone && S.leaseDone[8]) && (S.paid || 0) < 8 && (pendLease.i == null || (S.leaseDone && S.leaseDone[pendLease.i]))) { S.lease = null; if (leaseGate(8)) { pendLease.i = 8; doLease(); continue; } }
        if (nx && mqReady(nx)) {
          const age = lifeChAge(nx.id), pr = S.life.prof, a0 = S.life.age; S.life.yrs[nx.id] = 1;
          if (age && S.life.anch.age < age) S.life.anch = { age, done: PLAN ? lifeActs() : S.done.length };
          const g = (lifeNest() && pr.living === '본가' ? (nx.id === 'lease' ? 140 : 40) : 0) + (pr.income === '넉넉' ? (nx.id === 'lease' || nx.id === 'home' ? 120 : 30) : 0); S.coin += g;
          tick(T.cine); lifeTick(); mark();
          if (nx.id === 'lease' && S.peak < 7) S.peak = 7;
          if (nx.id === 'home' && (S.paid || 0) < 8 && !(S.leaseDone && S.leaseDone[8])) S.peak = Math.max(S.peak, 8);
          tick(T.mq); mqPay(nx, acc >= 0.8 ? 'good' : 'ok'); chs.push({ id: nx.id, t: Math.round(t), nq, from: a0, to: S.life.age, lv: S.lv });
          if (!PLAN && nx.id === 'home') { tick(T.end); ended = { t: Math.round(t), nq }; }
          continue; }
        if (PLAN) { const st = lifeStageNext(); if (lifeStageReady(st)) { const a0 = S.life.age;
            if (st.id === 'end') { S.life.st = S.life.st || {}; S.life.st.end = 1; tick(T.cine + T.end); ended = { t: Math.round(t), nq }; break; }
            lifeStagePlay(st); tick(T.stage); mark(); stages.push({ id: st.id, t: Math.round(t), nq, from: a0, to: S.life.age }); growMove(); continue; } }
        let did = false;
        for (const bb of BOSSES) { if (bossReady(bb) && !bossCleared(bb.id) && !((lostAt[bb.id] ?? -99) > nq - 5)) { needE('boss'); tick(T.boss); if (bossWin(bb)) { S.bossDone.push(bb.id); S.coin += 200; S.stats[bb.stat] = Math.min(100, S.stats[bb.stat] + 15); bump(0, 'boss'); lifeTick(); growMove(); } else { lostAt[bb.id] = nq; } did = true; break; } }
        if (did) continue;
        const ep = (S.done.length >= 4 && nq % 4 === 0) ? EPISODES.find(e => epBestOf(e.id) === null && (!e.when || e.when())) : null;
        if (ep) { needE('ep'); tick(T.ep); const tier = acc >= 0.8 ? 1 : 2, end = ep.ends[Math.min(tier, ep.ends.length - 1)]; S.epBest = S.epBest || {}; S.epBest[ep.id] = tier; grantX(end.xp || 0, end.coin || 0); if (end.stat) S.stats[ep.stat] = Math.min(100, S.stats[ep.stat] + end.stat); bump(0, 'ep'); lifeTick(); growMove(); nq++; continue; }
        const q = QUESTS.find(q => !q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qOpen(q) && qReach(q))
          || (mqOk('car') ? QUESTS.find(q => q.trip && fits(q) && S.done.indexOf(q.id) < 0 && qReach(q)) : null);
        if (q) { questDo(q); continue; }
        // 할 것이 없다. 제안: 생활 이벤트를 하나 더(게임도 lifeNoQuests면 더 띄운다). 지금: 도장 찍기로 버틴다
        if (PLAN && doEvent(true)) continue;
        needE('game'); tick(T.mg); grantX(20, rnd() < 0.7 ? 30 : 0); mg++; growMove();
      }
      const at = a => (ages[a] || {}).t;
      return { seed: p.seed, ended, t: Math.round(t), nq, nev, evRep, dry, mg, wait: Math.round(waitMin), band, stages, chs, stallMax: Math.max(0, ...Object.values(stallAge)), stallAge,
        ages: Object.fromEntries(Object.entries(ages).map(([k, v]) => [k, v.t])), t30: at(30), t40: at(40), t50: at(50), maxJump: (() => { const ks = Object.keys(ages).map(Number).sort((x, y) => x - y); let m = 0; for (let i = 1; i < ks.length; i++) m = Math.max(m, ks[i] - ks[i - 1]); return m; })(),
        title: lifeTitleId(), lv: S.lv, tier: TIERS[S.tier].name };
    }, { card, acc, T, rs, mode, PACE, LV });
    OUT.runs.push({ mode, ck, acc, ...r });
  }
  if (errs.length) console.log(mode, 'errors', errs.slice(0, 3));
  await page.close();
}
await b.close();
// 요약: 모드 × 정답률, 카드 여섯 장 × 판 평균
const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
for (const mode of MODES) for (const acc of ACCS) {
  const rs = OUT.runs.filter(r => r.mode === mode && r.acc === acc), fin = rs.filter(r => r.ended);
  const end = fin.map(r => r.ended.t), b20 = rs.map(r => r.t30).filter(x => x != null), b30 = rs.map(r => r.t40 - r.t30).filter(x => !isNaN(x)), b40 = rs.map(r => r.t50 - r.t40).filter(x => !isNaN(x)), b50 = fin.map(r => r.ended.t - r.t50).filter(x => !isNaN(x));
  const bq = k => avg(rs.map(r => (r.band[k] || {}).q || 0)), be = k => avg(rs.map(r => (r.band[k] || {}).ev || 0)), bd = k => avg(rs.map(r => (r.band[k] || {}).dry || 0));
  const s = { runs: rs.length, unfinished: rs.length - fin.length, end: avg(end), endMin: Math.min(...end), endMax: Math.max(...end), quests: avg(rs.map(r => r.nq)), events: avg(rs.map(r => r.nev)), evRepeat: avg(rs.map(r => r.evRep)), dry: avg(rs.map(r => r.dry)), wait: avg(rs.map(r => r.wait)),
    min: { '20s': avg(b20), '30s': avg(b30), '40s': avg(b40), '50s': avg(b50) },
    q: { '20s': bq('20s'), '30s': bq('30s'), '40s': bq('40s'), '50s': bq('50s') }, ev: { '20s': be('20s'), '30s': be('30s'), '40s': be('40s'), '50s': be('50s') }, dryBand: { '20s': bd('20s'), '30s': bd('30s'), '40s': bd('40s'), '50s': bd('50s') },
    stallMax: Math.max(...rs.map(r => r.stallMax)), maxJump: Math.max(...rs.map(r => r.maxJump)), titles: [...new Set(fin.map(r => r.title))].join(','),
    byCard: Object.fromEntries(Object.keys(CARDS).map(c => [c, avg(rs.filter(r => r.ck === c && r.ended).map(r => r.ended.t))])) };
  OUT.summary[mode + ' ' + acc] = s;
  console.log(mode.padEnd(5), acc, JSON.stringify(s));
}
// 대표 한 판(카드 A, 0.75, 첫 시드): 나이별 도달 분
for (const mode of MODES) { const r = OUT.runs.find(r => r.mode === mode && r.ck === 'A' && r.acc === 0.75); if (r) console.log(mode, 'A 0.75 나이→분', JSON.stringify(r.ages), '장', JSON.stringify(r.chs.map(c => c.id + '@' + c.t + 'm ' + c.from + '→' + c.to)), '중간', JSON.stringify(r.stages.map(c => c.id + '@' + c.t + 'm'))); }
fs.writeFileSync(path.join(ROOT, 'ops/review-1014/tools/pace-life' + (process.env.TAG ? '-' + process.env.TAG : '') + '.json'), JSON.stringify(OUT, null, 1));
