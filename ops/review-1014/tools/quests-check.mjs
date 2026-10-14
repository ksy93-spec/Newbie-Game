// 새 퀘스트(ops/review-1014/quests/quests.js) 점검.
// 게임 파일에서 Q 도우미와 기존 QUESTS 부분을 그대로 꺼내 vm에서 돌린 뒤, 새 묶음을 같은 맥락에 얹어 검사한다.
// 사용: node ops/review-1014/tools/quests-check.mjs [게임파일] [quests.js]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import fs from 'node:fs';
import vm from 'node:vm';

const GAME = process.argv[2] || 'prototype/newbie-quest-demo.html';
const NEW = process.argv[3] || 'ops/review-1014/quests/quests.js';
const html = fs.readFileSync(GAME, 'utf8');
const src = fs.readFileSync(NEW, 'utf8');
const errs = [], warns = [];
const E = m => errs.push(m), W = m => warns.push(m);

function grab(re, what) { const m = html.match(re); if (!m) { console.error('못 찾음: ' + what); process.exit(2); } return m[0]; }
const npcSrc = grab(/var NPC_BY_NAME=\{[\s\S]*?\};/, 'NPC_BY_NAME');
const qplaceSrc = grab(/var QPLACE=\{[\s\S]*?\};/, 'QPLACE');
const themeSrc = grab(/var THEME_ORDER=\[[^\]]*\];/, 'THEME_ORDER');
const a = html.indexOf('var CONTENT='), b = html.indexOf('var QMAP={};');
if (a < 0 || b < 0 || b < a) { console.error('못 찾음: CONTENT ~ QMAP 구간'); process.exit(2); }
const questSrc = html.slice(a, b);

const ctx = vm.createContext({ console });
vm.runInContext(npcSrc + '\n' + themeSrc + '\n' + questSrc + '\n' + qplaceSrc +
  '\nthis.__get=function(){return {QUESTS:QUESTS,NPC_BY_NAME:NPC_BY_NAME,QPLACE:QPLACE,SRC_BY_ID:SRC_BY_ID,THEME_ORDER:THEME_ORDER};};', ctx);
const before = ctx.__get();
const oldIds = new Set(before.QUESTS.map(q => q.id));
const oldPlace = Object.assign({}, before.QPLACE);

// 새 묶음: @@MAIN 부분을 먼저, @@QPLACE 부분을 그 뒤에 (apply.mjs와 같은 순서)
const iM = src.indexOf('/* @@MAIN */'), iP = src.indexOf('/* @@QPLACE */');
if (iM < 0 || iP < 0) { console.error('quests.js에 @@MAIN/@@QPLACE 표시가 없음'); process.exit(2); }
const mainPart = src.slice(iM, iP), placePart = src.slice(iP);
const n0 = before.QUESTS.length;
vm.runInContext(mainPart + '\n' + placePart, ctx);
const after = ctx.__get();
const added = after.QUESTS.slice(n0);

// 게임에 있는 값들
const themes = new Set(after.THEME_ORDER);
const faces = new Set([...html.matchAll(/["']npc_([a-z]+)["']/g)].map(m => m[1]));
const desks = new Set([...html.matchAll(/kind:'desk',id:'([a-z_0-9]+)'/g)].map(m => m[1]));
const deskMap = {}; for (const m of html.matchAll(/MAPS\.([a-z_]+)=\{[^\n]*name:'([^']+)'/g)) deskMap[m[1]] = m[2];
const items = new Set([...html.matchAll(/ITEMS\.([a-z_0-9]+)=/g)].map(m => m[1]).concat([...html.matchAll(/^ ?([a-z_0-9]+): ?\{slot:/gm)].map(m => m[1])));
const STATUSES = ['대학생', '취준생', '직장인'];
const FIT_KEYS = new Set(['status', 'ageMax', 'ageMin', 'regions']);
const REGIONS = ['수도권', '광역시', '그 외'];

const seen = new Set();
for (const q of added) {
  const id = q.id, t = `[${id}]`;
  if (!/^[a-z][a-z0-9_]*$/.test(id)) E(`${t} id 형식`);
  if (oldIds.has(id)) E(`${t} 기존 퀘스트와 id가 겹침`);
  if (seen.has(id)) E(`${t} 새 묶음 안에서 id가 겹침`); seen.add(id);
  if (new RegExp(`['"]${id}['"]`).test(html)) W(`${t} 게임 파일 어딘가에 같은 글자가 이미 있음`);
  if (!themes.has(q.theme)) E(`${t} 테마 ${q.theme} 없음`);
  if (typeof q.title !== 'string' || !q.title) E(`${t} 제목 없음`);
  if (!(q.xp > 0 && q.coin > 0)) E(`${t} xp/coin`);
  if (q.xp > 120 || q.coin > 100) W(`${t} 보상이 기존 범위(xp 50~100, coin 40~80)보다 큼`);
  const f = q.fit || {};
  for (const k of Object.keys(f)) if (!FIT_KEYS.has(k)) E(`${t} fit 필드 ${k}는 fits()가 모름`);
  if (f.status) for (const s of f.status) if (!STATUSES.includes(s)) E(`${t} status ${s}`);
  if (f.regions) for (const r of f.regions) if (!REGIONS.includes(r)) E(`${t} region ${r}`);
  if (f.ageMin != null && !(f.ageMin >= 20 && f.ageMin <= 59)) E(`${t} ageMin 범위`);
  const face = after.NPC_BY_NAME[q.npc];
  if (!face) E(`${t} 인물 "${q.npc}"가 NPC_BY_NAME에 없음(해시로 아무 얼굴이나 나옴)`);
  else if (!faces.has(face)) E(`${t} 얼굴 ${face} 그림 없음`);
  if (q.reward != null && !items.has(q.reward)) E(`${t} 보상 아이템 ${q.reward} 없음`);
  if (!q.intro) E(`${t} 첫마디 없음`);
  if (!Array.isArray(q.qs) || q.qs.length !== 3) E(`${t} 문항 3개가 아님`);
  (q.qs || []).forEach((x, i) => {
    const u = `${t} Q${i + 1}`;
    if (!x.q) E(`${u} 질문 없음`);
    if (!Array.isArray(x.a) || x.a.length !== 3) E(`${u} 보기 3개가 아님`);
    if (!(Number.isInteger(x.ok) && x.ok >= 0 && x.ok < (x.a || []).length)) E(`${u} ok 인덱스`);
    if (new Set(x.a).size !== (x.a || []).length) E(`${u} 보기 중복`);
    if (!x.why || x.why.length < 20) E(`${u} 해설이 짧음`);
  });
  if (!q.stat || typeof q.stat !== 'object') E(`${t} stat 없음(결과 화면이 Object.keys(q.stat)를 씀)`);
  else for (const [k, v] of Object.entries(q.stat)) { if (!themes.has(k)) E(`${t} stat 키 ${k}`); if (!(v > 0 && v <= 20)) E(`${t} stat 값 ${v}`); if (k !== q.theme) W(`${t} stat 키가 테마와 다름`); }
  if (!after.SRC_BY_ID[id]) W(`${t} SRC_BY_ID 출처 없음(테마 기본 출처로 나감)`);
  const place = after.QPLACE[id];
  if (!place) W(`${t} QPLACE 없음(어디서나 받음)`); else if (!desks.has(place)) E(`${t} 창구 ${place} 없음`);
  const text = JSON.stringify([q.title, q.intro, q.qs]);
  if (/[—–]/.test(text)) E(`${t} 긴 줄표(—, –)가 있음`);
}
for (const k of Object.keys(oldPlace)) if (after.QPLACE[k] !== oldPlace[k]) E(`기존 QPLACE ${k}를 덮어씀`);
if (/[—–]/.test(src)) W('quests.js 주석 등 어딘가에 긴 줄표가 있음');

// 나이대·테마 집계
const band = q => { const m = (q.fit || {}).ageMin; return m >= 50 ? '50대' : m >= 40 ? '40대' : m >= 30 ? '30대' : '20대'; };
const tab = {};
for (const q of added) { const k = band(q); tab[k] ||= { 합: 0 }; tab[k].합++; tab[k][q.theme] = (tab[k][q.theme] || 0) + 1; }
console.log(`새 퀘스트 ${added.length}개 (기존 ${n0}개 → ${after.QUESTS.length}개)`);
for (const k of ['20대', '30대', '40대', '50대']) if (tab[k]) console.log(' ', k, JSON.stringify(tab[k]));
const th = {}; added.forEach(q => th[q.theme] = (th[q.theme] || 0) + 1); console.log('  테마별', JSON.stringify(th));
const ju = added.filter(q => q.theme === 'ju').reduce((s, q) => s + (q.stat.ju || 0), 0);
console.log(`  새 집(ju) 스탯 공급 합 ${ju}`);

// 직장인 인생에서 나이별로 맞는(fit) 퀘스트 수. fits() 패치 후 기준(ageMin은 진짜 나이, ageMax는 24/29/34/40 구간)
const bucket = a => a <= 24 ? 24 : a <= 29 ? 29 : a <= 34 ? 34 : 40;
const fitAt = (q, age) => { const f = q.fit || {}; if (q.trip) return false;
  if (f.status && !f.status.includes('직장인')) return false;
  if (f.ageMax != null && bucket(age) > f.ageMax) return false;
  if (f.regions && !f.regions.includes('수도권')) return false;
  if (f.ageMin != null && age < f.ageMin) return false; return true; };
const oldQ = after.QUESTS.slice(0, n0);
console.log('  직장인·수도권 기준, 그 나이에 맞는 퀘스트 수 (기존 / 기존+새)');
for (const age of [24, 29, 30, 35, 40, 45, 50, 55, 59])
  console.log(`    ${age}살: ${oldQ.filter(q => fitAt(q, age)).length} / ${after.QUESTS.filter(q => fitAt(q, age)).length}`);

if (warns.length) { console.log(`\n경고 ${warns.length}`); warns.forEach(w => console.log('  - ' + w)); }
if (errs.length) { console.log(`\n오류 ${errs.length}`); errs.forEach(e => console.log('  x ' + e)); process.exit(1); }
console.log('\n오류 없음');
