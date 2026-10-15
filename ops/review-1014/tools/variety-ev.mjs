// LIFE_EV를 뽑아 38~58살 조건(직장인, 자가 tier, 높은 레벨)에서 몇 개가 풀에 들어오는지 센다.
// 쓰는 법: node ops/review-1014/tools/variety-ev.mjs [html] [tier] [runs]
import fs from 'fs';
const f = process.argv[2] || 'prototype/newbie-quest-demo.html';
const tier = +(process.argv[3] || 9), runs = +(process.argv[4] || 2000);
const src = fs.readFileSync(f, 'utf8');
const a = src.indexOf('var LIFE_EV=['), b = src.indexOf('function lifeEvMonth');
const S = { lv: 20, status: '직장인', tier, evSeen: [] };
const LIFE_EV = new Function('S', src.slice(a, b) + '; return LIFE_EV;')(S);
const ok = (e, m) => (!e.when || e.when()) && (!e.months || e.months.includes(m));
const any = LIFE_EV.filter(e => [1,2,3,4,5,6,7,8,9,10,11,12].some(m => ok(e, m)));
console.log('전체', LIFE_EV.length, '· 38~58 조건에서 한 번이라도 뜰 수 있는 것', any.length);
console.log('뜰 수 있음:', any.map(e => e.id).join(' '));
console.log('막힘:', LIFE_EV.filter(e => !any.includes(e)).map(e => e.id + '(' + String(e.when).replace(/\s+/g,' ').slice(15,60) + ')').join(' '));
// 인생 모드 한 판 흉내: 20살부터 한 해 1개씩, 38~58살(21년) 구간에 뜨는 것과 되풀이
function pick(m) { let pool = LIFE_EV.filter(e => ok(e, m) && !S.evSeen.includes(e.id));
  if (!pool.length) { S.evSeen = []; pool = LIFE_EV.filter(e => ok(e, m)); }
  let tot = pool.reduce((s, e) => s + (e.months ? 3 : 1), 0), r = Math.random() * tot;
  for (const e of pool) { r -= e.months ? 3 : 1; if (r < 0) return e; } return pool.at(-1); }
let rep = 0, distinct = 0, seenEarly = 0, maxRep = 0;
for (let k = 0; k < runs; k++) { S.evSeen = []; const cnt = {}, early = new Set(); let evn = 0;
  for (let age = 20; age <= 58; age++) {
    // 20대 조건 흉내: 37살까지는 tier/lv가 낮다고 보지 않고 그대로 둔다(보수적: 실제보다 덜 겹침)
    const m = 1 + ((age * 5 + evn) % 12); const e = pick(m); S.evSeen.push(e.id); evn++;
    if (age < 38) early.add(e.id); else cnt[e.id] = (cnt[e.id] || 0) + 1; }
  const ids = Object.keys(cnt); distinct += ids.length;
  rep += ids.reduce((s, i) => s + cnt[i] - 1, 0) + ids.filter(i => early.has(i)).length;
  seenEarly += ids.filter(i => early.has(i)).length; maxRep = Math.max(maxRep, ...Object.values(cnt)); }
console.log(`38~58(21해) 평균: 서로 다른 사건 ${(distinct/runs).toFixed(1)}개, 이미 본 것 다시 ${(rep/runs).toFixed(1)}번, 그중 20~30대에 본 것 ${(seenEarly/runs).toFixed(1)}개, 한 판에서 같은 사건 최대 ${maxRep}번`);
// 나이에 어색한 것(20대 첫 경험·세입자 이야기)과 사기 계열이 38~58에서 차지하는 몫
const AWK = ['ev_payslip','ev_newhire','ev_subscription','ev_usedcar','ev_carins','ev_movein','ev_mover','ev_passport'];
const SCAM = ['ev_smish','ev_prosecutor','ev_used','ev_familysmish','ev_holidaysmish','ev_survey'];
let awk = 0, scam = 0, fresh = 0;
for (let k = 0; k < runs; k++) { S.evSeen = []; const seen = new Set(); let evn = 0;
  for (let age = 20; age <= 58; age++) { const m = 1 + ((age * 5 + evn) % 12); const e = pick(m); S.evSeen.push(e.id); evn++;
    if (age >= 38) { if (AWK.includes(e.id)) awk++; if (SCAM.includes(e.id)) scam++; if (!seen.has(e.id)) fresh++; }
    seen.add(e.id); } }
console.log(`38~58 21개 중 평균: 처음 보는 것 ${(fresh/runs).toFixed(1)}, 나이에 어색한 것 ${(awk/runs).toFixed(1)}, 사기·스미싱 계열 ${(scam/runs).toFixed(1)}`);
