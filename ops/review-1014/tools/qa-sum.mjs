// qa-play.mjs 결과(JSON)를 나이별 표로 줄인다. 실행: node ops/review-1014/tools/qa-sum.mjs <qa-*.json>
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const E = j.EV; const rows = {};
let prev = { t: 0, age: 20 };
for (const e of E) {
  const age = prev.age || 20, dt = e.t - prev.t;
  const r = rows[age] = rows[age] || { age, total: 0, wait: 0, rest: 0, q: 0, cine: 0, cineS: 0, main: [], short: 0, life: [], openMin: 99, notes: [] };
  let w = 0; if (e.kind === 'WAIT') { const m = /→ (\d+)분/.exec(e.note); w = m ? +m[1] * 60 : 0; }
  r.total += dt; r.wait += w; if (e.kind === 'REST') r.rest += 40; if (e.kind === 'QUEST') r.q++;
  if (e.kind === 'SHORTCUT') r.short++;
  if (e.kind === 'CINE') { r.cine++; const t = /「(.+?)」/.exec(e.note); if (/^LIFE/.test(e.note)) r.life.push(e.note.replace(/^LIFE /, '').slice(0, 30)); else r.main.push(t ? t[1] : e.note.slice(0, 20)); }
  r.openMin = Math.min(r.openMin, e.open ?? 99);
  prev = e;
}
const fm = (s) => (s / 60).toFixed(1);
console.log('| 나이 | 전체(분) | 기다림(분) | 실제 플레이(분) | 퀘스트 | 컷신 | 지름길 |');
console.log('|---|---|---|---|---|---|---|');
for (const r of Object.values(rows).sort((a, b) => a.age - b.age)) console.log(`| ${r.age} | ${fm(r.total)} | ${fm(r.wait)} | ${fm(r.total - r.wait)} | ${r.q} | ${[...new Set(r.main.concat(r.life))].join(', ')} | ${r.short} |`);
const tot = E[E.length - 1].t, wt = Object.values(rows).reduce((a, r) => a + r.wait, 0);
console.log(`\n합계 ${fm(tot)}분, 기다림 ${fm(wt)}분, 실제 ${fm(tot - wt)}분, 퀘스트 ${E.filter((e) => e.kind === 'QUEST').length}, 지름길 ${j.SHORT.length}, 오류 ${j.BUGS.length}, 게임 안 시간(ms) ${fm((E[E.length - 1].ms || 0) / 1000)}분, 실제 벽시계 ${fm(j.real)}분`);
console.log('컷신:'); for (const c of j.CINES) console.log(`  ${c.kicker || '메인'} ${c.title} ${c.scenes}장면 선택${c.choices}(맞음${c.ok}) ${Math.round((c.t1 || c.t0) - c.t0)}초 @${fm(c.t0)}분 ${c.age0}살`);
console.log('버그:', JSON.stringify(j.BUGS.slice(0, 10)));
const toasts = [...new Set((j.toasts || []).map((t) => t[1]))]; console.log('토스트 종류', toasts.length, toasts.slice(0, 60).join(' | ').slice(0, 3000));
