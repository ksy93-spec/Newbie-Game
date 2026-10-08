// 리뷰 1008 설계: 거처 need를 올리면 집 스탯이 실제로 거처를 막는 날이 생기는지(학습 고리가 살아나는지) 추정.
// 1007 econ-sim.json의 하루별 집 스탯과 열린 거처(peak)를 그대로 쓰고, peak(d) = min(지금 peak(d), tierFor_new(ju(d)), 전날+하루몫).
// 거처가 늦어지면 메인 2장·6장도 늦어지는 되먹임은 빠져 있다(추정치). 실행: node ops/review-1008/tools/design-need-tune.mjs
import fs from 'node:fs';
const SIM = JSON.parse(fs.readFileSync('ops/review-1007/tools/econ-sim.json', 'utf8'));
const NEED = [0,6,12,18,24,30,36,42,48,54,60,66,70,74,78];
const variants = { now: NEED, x115: NEED.map(n => Math.min(95, Math.round(n * 1.15))), x125: NEED.map(n => Math.min(97, Math.round(n * 1.25))) };
const out = [];
for (const [vk, N] of Object.entries(variants)) {
  out.push(`== ${vk} need ${N.join(',')}`);
  for (const pk of ['worker', 'student', 'seeker']) for (const sk of ['typical', 'noad']) {
    const key = pk + '/' + sk; if (!SIM[key]) continue;
    const rows = SIM[key].rows; let prev = 0, bind = 0, line = [], simPrev = 0;
    const tierFor = ju => { let t = 0; N.forEach((n, i) => { if (ju >= n) t = i; }); return t; };
    rows.filter(r => r.d <= 30).forEach(r => {
      const cap = r.peak;                                   // 지금 구조의 하루 몫·자가 잠금이 허락한 최대
      const step = prev + Math.max(r.d === 1 ? 2 : 1, r.peak - simPrev); simPrev = r.peak;   // 메인 6장·전세 계약처럼 한 번에 여는 칸은 그대로 인정
      const np = Math.max(prev, Math.min(cap, step, Math.max(tierFor(r.stats.ju), r.peak >= 9 && simPrev >= 9 ? 9 : 0)));
      if (np < r.peak) bind++;   // 지금보다 거처가 늦은 날
      prev = np; line.push(`d${r.d}:${np}${np < r.peak ? '<' + r.peak : ''}`);
    });
    out.push(`${key}: 집 스탯이 막은 날 ${bind} | ${line.slice(0, 18).join(' ')}`);
  }
}
console.log(out.join('\n')); fs.writeFileSync('ops/review-1008/tools/design-need-tune.out.txt', out.join('\n'));
