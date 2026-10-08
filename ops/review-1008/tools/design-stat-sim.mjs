// 리뷰 1008 설계: 스탯이 무엇을 여는지, 스탯 출처, 레벨업 포인트(안 B) 모의 계산.
// 실행: node ops/review-1008/tools/design-stat-sim.mjs  (리뷰 1007 econ-sim.json의 하루별 레벨·스탯 곡선을 다시 쓴다)
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs';
const root = process.cwd();
const GAME = url.pathToFileURL(path.resolve(root, 'prototype/newbie-quest-demo.html')).href + '#nointro';
const SIM = JSON.parse(fs.readFileSync(path.resolve(root, 'ops/review-1007/tools/econ-sim.json'), 'utf8'));
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
const PERSONAS = {
  worker: { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29, living: '자취' },
  student: { status: '대학생', living: '자취', region: '수도권', age: 23 },
  seeker: { status: '취준생', prep: 1, region: '광역시', age: 26, living: '본가' },
};
const src = {};
for (const [pk, p] of Object.entries(PERSONAS)) src[pk] = await page.evaluate(p => {
  S = fresh(); Object.assign(S, p); S.onboarded = true;
  const th = ['ju','sik','ui','geum','jik'], z = () => Object.fromEntries(th.map(k => [k, 0]));
  const q = z(), trip = z(), qn = z(), mq = z(), ep = z(), boss = z();
  QUESTS.filter(fits).forEach(x => Object.entries(x.stat || {}).forEach(([k, v]) => { (x.trip ? trip : q)[k] += v; if (!x.trip) qn[x.theme]++; }));
  Object.values(MQ_REWARD).forEach(r => Object.entries(r.stat || {}).forEach(([k, v]) => mq[k] += v));
  EPISODES.forEach(e => ep[e.stat] += e.ends[0].stat);
  BOSSES.forEach(x => boss[x.stat] += 15);
  return { q, trip, qn, mq, ep, lease: LEASE_ENDS[0].stat, boss, xpNeed: Array.from({ length: 20 }, (_, i) => need(i + 1)),
    tiers: TIERS.map(t => t.need), bosses: BOSSES.map(x => [x.id, x.stat, x.need]), mapLv: MAP_LV };
}, p);
await b.close();
const out = [];
const log = s => { out.push(s); console.log(s); };
log('# 스탯 출처(만점 기준, 신분별)');
for (const [pk, s] of Object.entries(src)) {
  log(`== ${pk} 퀘스트수 ${JSON.stringify(s.qn)}`);
  for (const k of ['ju','sik','ui','geum','jik']) {
    const tot = 5 + s.q[k] + s.trip[k] + s.mq[k] + s.ep[k] + (k === 'ju' ? s.lease : 0) + s.boss[k];
    log(`${k}: 시작5 퀘스트${s.q[k]} 여행${s.trip[k]} 메인${s.mq[k]} 사건${s.ep[k]} 계약${k==='ju'?s.lease:0} 보스${s.boss[k]} = ${tot}`);
  }
}
const T = src.worker.tiers;
const tierFor = ju => { let t = 0; T.forEach((n, i) => { if (ju >= n) t = i; }); return t; };
log('\n# 하루별: 지금 구조에서 열린 거처(peak)와 그 거처의 need, 지금 집 스탯, 집 스탯이 막은 날(ju<다음 need이고 오늘 몫 남음)');
for (const pk of ['worker','student','seeker']) {
  const rows = SIM[pk + '/typical'].rows.filter(r => r.d <= 16);
  log(`== ${pk}`);
  log(rows.map(r => `d${r.d} lv${r.lv} peak${r.peak}(need${T[r.peak]}) ju${r.stats.ju} 스탯으로가능${tierFor(r.stats.ju)}`).join('\n'));
}
log('\n# 안 B 모의: 레벨업마다 P포인트, 집 퀘스트를 하나도 안 풀고 전부 집에 몰아 준 사람(퀘스트 스탯 0)');
log('조건: 하루 한 칸 상한(upLeft)과 자가 잠금(tierCap)은 그대로. 레벨 곡선은 1007 시뮬 typical 그대로(집 퀘스트를 안 풀면 실제로는 조금 느리다).');
for (const pk of ['worker','student','seeker']) {
  const rows = SIM[pk + '/typical'].rows.filter(r => r.d <= 16);
  for (const P of [2, 3, 4, 5]) {
    let lag = 0, first = null; const line = [];
    rows.forEach(r => { const ju = Math.min(100, 5 + P * (r.lv - 1)); const ok = ju >= T[r.peak];
      if (!ok) { lag++; if (first === null) first = r.d; } line.push(`d${r.d}:${ju}${ok ? '' : '!'}`); });
    log(`${pk} P=${P}: 뒤처진 날 ${lag}/${rows.length}${first ? ' (첫날 d' + first + ')' : ''} | ${line.join(' ')}`);
  }
}
log('\n# 안 B 변형: 퀘스트가 원래의 절반을 주고(r=0.5) 레벨업 P=2를 전부 집에, 집 퀘스트는 안 품');
log('(다른 주제 퀘스트는 풀어도 집 스탯에 안 들어간다. 메인·계약·보스의 집 스탯 절반은 받는다고 친다)');
for (const pk of ['worker','student','seeker']) {
  const rows = SIM[pk + '/typical'].rows.filter(r => r.d <= 16); let lag = 0; const line = [];
  rows.forEach(r => { const extra = r.mq >= 2 ? 3 : 0; const ju = Math.min(100, 5 + 2 * (r.lv - 1) + extra); const ok = ju >= T[r.peak]; if (!ok) lag++; line.push(`d${r.d}:${ju}${ok ? '' : '!'}`); });
  log(`${pk}: 뒤처진 날 ${lag}/${rows.length} | ${line.join(' ')}`);
}
log('\n# 레벨업 횟수(하루별) — 안 B에서 배분 화면이 몇 번 뜨나');
for (const pk of ['worker','student','seeker']) { const rows = SIM[pk + '/typical'].rows; let prev = 1; const l = [];
  rows.filter(r => r.d <= 21).forEach(r => { l.push(`d${r.d}:+${r.lv - prev}`); prev = r.lv; }); log(`${pk}: ${l.join(' ')} | 45일 최종 Lv.${rows[rows.length - 1].lv}`); }
fs.writeFileSync(path.resolve(root, 'ops/review-1008/tools/design-stat-sim.out.txt'), out.join('\n'));
