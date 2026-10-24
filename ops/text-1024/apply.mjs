// haiku 에이전트들이 낸 고친 문장(out/*.json)을 게임에 넣는다. 위험한 고침은 버리고 이유를 적는다.
// 실행: node ops/text-1024/apply.mjs [게임 html=prototype/newbie-quest-demo.html] [출력=같은 파일]
import fs from 'fs'; import * as acorn from 'acorn';
const IN = process.argv[2] || 'prototype/newbie-quest-demo.html', OUT = process.argv[3] || IN;
const html = fs.readFileSync(IN, 'utf8');
const S = JSON.parse(fs.readFileSync('ops/text-1024/strings.json', 'utf8')), byId = Object.fromEntries(S.map((o) => [o.id, o]));
const edits = {}; for (const f of fs.readdirSync('ops/text-1024/out').filter((f) => f.endsWith('.json'))) {
  try { Object.assign(edits, JSON.parse(fs.readFileSync('ops/text-1024/out/' + f, 'utf8'))); } catch (e) { console.log('깨진 파일', f, e.message); } }
const sig = (t, re) => (t.match(re) || []).join('|');
const checks = [
  ['숫자', /\d+([.,]\d+)*/g], ['자리표시', /\{[^}]*\}/g], ['태그', /<[^>]+>/g], ['엔티티', /&[a-z#0-9]+;/g], ['원화', /[￦₩]/g], ['영문', /[A-Za-z]{2,}/g]];
const ok = [], bad = [];
for (const id in edits) {
  const o = byId[id], nt = edits[id]; if (!o) { bad.push([id, '없는 id']); continue; }
  if (typeof nt !== 'string' || nt === o.t) continue;
  let why = null;
  for (const [nm, re] of checks) if (sig(o.t, re) !== sig(nt, re)) { why = nm + ' 바뀜'; break; }
  if (!why && /[—–]/.test(nt)) why = '대시';
  if (!why && [...o.t].length <= 14 && [...nt].length > 14) why = '14자 넘음';
  if (!why && [...nt].length > [...o.t].length * 1.35 + 6) why = '너무 길어짐';
  if (!why && !/[가-힣]/.test(nt)) why = '한글 없음';
  if (!why && html.slice(o.s, o.e)[0] !== o.q) why = '위치 어긋남';
  if (why) bad.push([id, why, o.t, nt]); else ok.push([o, nt]);
}
const enc = (t, q) => q === '"' ? JSON.stringify(t) : "'" + t.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
let out = html; ok.sort((a, b) => b[0].s - a[0].s).forEach(([o, nt]) => { out = out.slice(0, o.s) + enc(nt, o.q) + out.slice(o.e); });
// 문법 검사
const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m; while ((m = re.exec(out))) acorn.parse(m[1], { ecmaVersion: 2020 });
fs.writeFileSync(OUT, out);
fs.writeFileSync('ops/text-1024/report.json', JSON.stringify({ applied: ok.map(([o, nt]) => [o.id, o.t, nt]), rejected: bad }, null, 1));
console.log('넣음', ok.length, '버림', bad.length); const c = {}; bad.forEach((b) => { c[b[1]] = (c[b[1]] || 0) + 1; }); console.log(c);
