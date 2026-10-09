// 갈림길 대본 검사: 문법, 줄 폭(14자), 배경·인물 열쇠. 저장소 루트에서 node ops/review-1009/tools/story-forks-check.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import fs from 'node:fs'; import vm from 'node:vm';
const src = fs.readFileSync('ops/review-1009/forks.js', 'utf8');
const ctx = {}; vm.createContext(ctx); vm.runInContext(src + ';this.F={LIFE_FORKS,LIFE_YEARS_FORK,LIFE_FORK_PATCH,MQ_SOLO,LIFE_SOLO_HOME,LIFE_NOCAR,LIFE_LEASE_LATE,LIFE_FORK_LINE,LIFE_JOB_ROLE,lifeAgeKo};', ctx);
const BG = new Set('apartment bank cafe carlot hometown livingroom meeting modelhouse night office phone road station town weddinghall'.split(' '));
const CAST = new Set(['hero', 'halbae', 'partner', 'peerf', 'peerm', 'deskf', 'officem']);
const bad = []; let n = 0;
// 채움 값의 대략 폭: {food} 6, {ageKo} 4
const w = t => t.replace(/\{food\}/g, '가나다라마바').replace(/\{ageKo\}/g, '서른여덟').length;
function walk(o, path) {
  if (Array.isArray(o)) return o.forEach((x, i) => walk(x, path + '[' + i + ']'));
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o.text)) { n++; o.text.forEach(t => { if (w(t) > 14) bad.push(path + ' 폭 ' + w(t) + ': ' + t); }); }
  if (o.bg && !BG.has(o.bg)) bad.push(path + ' 배경 ' + o.bg);
  if (Array.isArray(o.cast)) o.cast.forEach(c => { if (!CAST.has(c[0])) bad.push(path + ' 인물 ' + c[0]); });
  for (const k of Object.keys(o)) if (k !== 'text') walk(o[k], path + '.' + k);
}
walk(ctx.F.LIFE_FORKS, 'FORKS'); walk(ctx.F.LIFE_YEARS_FORK, 'YEARS'); walk(ctx.F.LIFE_FORK_PATCH, 'PATCH');
walk(ctx.F.MQ_SOLO.scenes, 'SOLO'); walk(ctx.F.LIFE_SOLO_HOME, 'SOLOHOME'); walk(ctx.F.LIFE_NOCAR.car, 'NOCAR'); walk(ctx.F.LIFE_LEASE_LATE.intro, 'LEASE');
for (const [k, o] of Object.entries(ctx.F.LIFE_FORK_LINE)) for (const [v, t] of Object.entries(o)) { const l = ('서른여덟 · ' + t.replace('{role}', '콘텐츠 기획')).length; if (l > 22) bad.push('LINE ' + k + '.' + v + ' ' + l); }
for (const [s, o] of Object.entries(ctx.F.LIFE_JOB_ROLE)) for (const [k, r] of Object.entries(o)) if (r.length > 6) bad.push('ROLE ' + s + '.' + k + ' ' + r);
console.log('장면', n, '· 나이 예', [20, 24, 31, 35, 38, 60].map(ctx.F.lifeAgeKo).join(' '));
console.log(bad.length ? bad.join('\n') : '문제 없음');
