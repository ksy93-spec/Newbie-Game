// 중년 대본 검사: 문법, 배경·인물 열쇠(게임 파일에서 읽음), 줄 폭 14자, 문서 상자, 보기, 갈래 조합, 어림 길이.
// 저장소 루트에서: node ops/review-1014/tools/story-mid-check.mjs [게임 파일]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import fs from 'node:fs'; import vm from 'node:vm';
const GAME = process.argv[2] || 'prototype/newbie-quest-demo.html';
const FILE = 'ops/review-1014/story/midlife.js';
const html = fs.readFileSync(GAME, 'utf8'), src = fs.readFileSync(FILE, 'utf8');
const BG = new Set([...html.matchAll(/["']?bg_([a-z]+)["']?\s*:\s*\[/g)].map(m => m[1]));
const CAST = new Set(['hero', 'partner', ...[...html.matchAll(/["']?npc_([A-Za-z]+)["']?\s*:\s*[\[{]/g)].map(m => m[1])]);
const bad = [], warn = [];
if (/\u2014/.test(src)) bad.push('em dash(U+2014)가 있다');
const ctx = {}; vm.createContext(ctx);
try { vm.runInContext(src + ';this.M={LIFE_MID,LIFE_MID_YEARS,LIFE_MID_Y60,LIFE_MID_SLOTS,lifeMidScenes,lifeMidYearScenes,lifeMidSlot,lifeMidAgeKo};', ctx); }
catch (e) { console.log('문법 오류:', e.message); process.exit(1); }
const M = ctx.M;
const w = t => String(t).replace(/\{ageKo\}/g, '마흔여덟').length;
let nScene = 0;
function scene(p, path) {
  nScene++;
  if (!Array.isArray(p.text) || !p.text.length) bad.push(path + ' text 없음(lifeFill이 깨진다)');
  else p.text.forEach(t => { if (w(t) > 14) bad.push(path + ' 폭 ' + w(t) + ': ' + t); });
  if (p.bg && !BG.has(p.bg)) bad.push(path + ' 배경 ' + p.bg);
  (p.cast || []).forEach(c => { if (!CAST.has(c[0])) bad.push(path + ' 인물 ' + c[0]); if (!/^[LCR]$/.test(c[1])) bad.push(path + ' 위치 ' + c[1]); });
  if (p.doc) { if (p.doc.rows.length > 4) bad.push(path + ' 문서 4줄 넘음');
    p.doc.rows.forEach(r => { const l = (r[0] + r[1]).length; if (l > 20) bad.push(path + ' 문서 줄 ' + l + '자: ' + r.join(' | ')); }); }
  if (p.choice) { const o = p.choice.opts;
    if (o.length < 2 || o.length > 3) bad.push(path + ' 보기 수 ' + o.length);
    if (!o.some(x => x.ok)) bad.push(path + ' 맞는 보기 없음');
    o.forEach((x, i) => { if (!x.note) bad.push(path + ' 해설 없음 ' + i); if (x.a.length > 48) warn.push(path + ' 보기 김 ' + x.a.length); }); }
}
function walk(list, path) { list.forEach((p, i) => scene(p, path + '[' + i + ']')); }
for (const [k, y] of Object.entries(M.LIFE_MID_YEARS)) { walk(y.scenes, 'Y.' + k);
  for (const [f, pt] of Object.entries(y.patch || {})) for (const [i, v] of Object.entries(pt)) if (v) { if (v._after) walk(v._after, `Y.${k}.${f}.${i}+`); scene({ ...y.scenes[i], ...v }, `Y.${k}.${f}.${i}`); } }
walk(M.LIFE_MID_Y60.scenes, 'Y60');
for (const [k, e] of Object.entries(M.LIFE_MID)) {
  walk(e.scenes, k);
  for (const [f, pt] of Object.entries(e.patch || {})) for (const [i, v] of Object.entries(pt)) if (v) { if (v._after) walk(v._after, `${k}.${f}.${i}+`); scene({ ...e.scenes[i], ...v }, `${k}.${f}.${i}`); }
  for (const g of ['good', 'ok', 'bad']) (e.ends[g] || []).forEach(t => { if (w(t) > 14) bad.push(k + ' 결말 폭 ' + t); });
  if (!e.src || !e.src.length) bad.push(k + ' 출처 없음');
  if (e.y && !M.LIFE_MID_YEARS[e.y]) bad.push(k + ' 세월 열쇠 ' + e.y);
}
// 갈래 조합마다 실제 장면을 만들어 본다: 비혼에 배우자가 남는지, 길이
const combos = [];
for (const solo of [false, true]) for (const own of [false, true]) for (const tight of [false, true]) combos.push({ solo, own, tight, p_hs: false, p_jc: false });
const rows = [];
for (const [k, e] of Object.entries(M.LIFE_MID)) {
  let lo = 1e9, hi = 0, shown = 0;
  for (const fl of combos) {
    if (e.need && Object.entries(e.need).some(([a, b]) => !!fl[a] !== !!b)) continue; shown++;
    const sc = M.lifeMidScenes(k, fl, e.age);
    sc.forEach((p, i) => {
      if (fl.solo && ((p.cast || []).some(c => c[0] === 'partner') || p.who === '배우자')) bad.push(`${k} 비혼판 [${i}] 배우자 남음`);
      if (p.text.some(t => /\{\w+\}/.test(t))) bad.push(`${k} 안 채운 칸 [${i}]`); });
    // 어림: 글자 18자/초 + 장면당 2초 + 보기 하나에 고르기 6초·해설 읽기 8초
    const s = sc.reduce((a, p) => a + p.text.join('').length / 18 + 2 + (p.choice ? 6 + p.choice.opts[0].note.length / 18 : 0), 0) + 8;
    lo = Math.min(lo, s); hi = Math.max(hi, s);
  }
  if (!shown) bad.push(k + ' 어느 갈래에서도 안 뜬다');
  const ch = e.scenes.filter(p => p.choice).length + Object.values(e.patch || {}).flatMap(pt => Object.values(pt)).filter(v => v && v._after).flatMap(v => v._after).filter(p => p.choice).length;
  rows.push(`${k.padEnd(8)} ${String(e.age).padStart(2)}살 [${e.range.join('~')}] 세월 ${e.y || '-'} · 장면 ${e.scenes.length} · 보기 ${ch} · 어림 ${Math.round(lo)}~${Math.round(hi)}초`);
  if (hi > 200 || lo < 60) warn.push(k + ' 길이 ' + Math.round(lo) + '~' + Math.round(hi) + '초');
}
for (const s of M.LIFE_MID_SLOTS) for (const fl of combos) { const r = M.lifeMidSlot(s.age, fl); if (s.y.length && !r.y) bad.push('자리 ' + s.age + ' 세월 못 고름 ' + JSON.stringify(fl)); if (s.ev.length && !r.ev) bad.push('자리 ' + s.age + ' 사건 못 고름 ' + JSON.stringify(fl)); }
console.log('배경', [...BG].join(' '));
console.log('인물', [...CAST].join(' '));
console.log('장면', nScene, '· 나이 예', [22, 34, 43, 48, 53, 58].map(M.lifeMidAgeKo).join(' '));
console.log(rows.join('\n'));
if (warn.length) console.log('주의\n' + warn.join('\n'));
console.log(bad.length ? '문제\n' + bad.join('\n') : '문제 없음');
process.exit(bad.length ? 1 : 0);
