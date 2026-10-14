// 리뷰 1014 새 아이템(ops/review-1014/items/items.js)을 게임 파일에 비춰 검사한다.
// 실행(저장소 루트에서):
//   node ops/review-1014/tools/items-check.mjs                  검사만
//   node ops/review-1014/tools/items-check.mjs --apply [출력]   블록 A·B·C를 붙인 사본을 쓴다(기본 prototype/newbie-quest-demo.html)
//   node ops/review-1014/tools/items-check.mjs --shot [폴더]    사본을 임시로 만들어 새 아이템 썸네일을 360×640, 390×844로 찍는다
// 검사: id 중복(기존 ITEMS·PETS·MOUNTS·FURNI·그림 이름과), 필수 필드, need가 TIERS 범위 안인지, mq가 MQ_LIST에 있는지,
//       perk 키가 PERK_TEXT에 있는지, 장비 모양(gear·ts·bs·kind·pal)이 게임 그림 코드에 있는지, 쓰기 동작 키,
//       FURNI_ORDER가 모든 세간을 한 번씩 담는지, 도트 그림이 칸 밖으로 안 나가는지, 방에 들어가는 크기인지.
// 찾을 글자를 못 찾거나 오류가 하나라도 있으면 아무것도 쓰지 않고 1로 끝난다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const root = process.cwd();
const GAME = path.join(root, 'prototype/newbie-quest-demo.html');
const DATA = path.join(root, 'ops/review-1014/items/items.js');
const args = process.argv.slice(2);
const src = fs.readFileSync(GAME, 'utf8');
const data = fs.readFileSync(DATA, 'utf8');
const errs = [], warns = [];
const err = (m) => errs.push(m), warn = (m) => warns.push(m);

function cut(re, what) { const m = src.match(re); if (!m) { console.error('게임 파일에서 못 찾음: ' + what); process.exit(1); } return m[0]; }
function between(a, b, what) {
  const i = src.indexOf(a), j = src.indexOf(b, i);
  if (i < 0 || j < 0) { console.error('게임 파일에서 못 찾음: ' + what); process.exit(1); }
  return src.slice(i, j);
}
function block(name) {
  const a = '==== 블록 ' + name + ' ====', b = '==== 블록 ' + name + ' 끝 ====';
  const i = data.indexOf(a), j = data.indexOf(b);
  if (i < 0 || j < 0) { console.error('items.js에서 블록 ' + name + '을 못 찾음'); process.exit(1); }
  return data.slice(data.indexOf('\n', i) + 1, j).replace(/\n?\/\*\s*$/, '').replace(/\s+$/, '') + '\n';
}

/* ── 게임 데이터 읽기 ── */
const ctx = vm.createContext({});
vm.runInContext(cut(/var P=\{[\s\S]*?\};/, 'P'), ctx);
vm.runInContext(between('var TIERS=[', 'function allItems(id){', 'TIERS~ITEMS~MOUNTS'), ctx);
vm.runInContext(cut(/ITEMS\.bosssuit=\{[^\n]*\};/, 'bosssuit'), ctx);
vm.runInContext(cut(/var PERK_TEXT=\{[\s\S]*?\};/, 'PERK_TEXT'), ctx);
vm.runInContext(between('var FURNI={', 'function actReady', 'FURNI~FURNI_ACT'), ctx);
vm.runInContext(cut(/var ROOMSPEC=\[[\s\S]*?\];/, 'ROOMSPEC'), ctx);
vm.runInContext(cut(/var NEED_KEYS=\[[^\]]*\];/, 'NEED_KEYS'), ctx);
const mqIds = [...between('var MQ_LIST=[', 'function mqOk', 'MQ_LIST').matchAll(/\{id:'(\w+)'/g)].map((m) => m[1]);
const petKinds = new Set([...between('function petG(', 'function mountG(', 'petG').matchAll(/kind==='(\w+)'/g)].map((m) => m[1]));
for (const m of src.matchAll(/^ pet_(\w+):\{/gm)) petKinds.add(m[1]);        /* CAST 그림 펫(dog) */
const mountKinds = new Set([...between('function mountG(', '\n}\n', 'mountG').matchAll(/kind==='(\w+)'/g)].map((m) => m[1]));
const weaponGears = new Set([...between('function drawWeapon(', '\n}\n', 'drawWeapon').matchAll(/t==='(\w+)'/g)].map((m) => m[1]));
const headGears = new Set([...src.matchAll(/hd\.gear==='(\w+)'/g)].map((m) => m[1]));
const topTs = new Set([...src.matchAll(/o\.ts==='(\w+)'/g)].map((m) => m[1]));
const botBs = new Set([...src.matchAll(/o\.bs==='(\w+)'/g)].map((m) => m[1]));
const artKeys = new Set([...src.matchAll(/^ "([a-z]+_[A-Za-z0-9_]+)":\[/gm)].map((m) => m[1]));
const G = (k) => vm.runInContext(k, ctx);
const TIERS = G('TIERS'), P = G('P'), PERK = G('PERK_TEXT'), ROOMSPEC = G('ROOMSPEC');
const ACT_KEYS = new Set([...G('NEED_KEYS'), 'full', 'xp', 'coin']);

const before = { ITEMS: Object.keys(G('ITEMS')), PETS: Object.keys(G('PETS')), MOUNTS: Object.keys(G('MOUNTS')), FURNI: Object.keys(G('FURNI')) };
const oldAll = new Set([...before.ITEMS, ...before.PETS, ...before.MOUNTS, ...before.FURNI]);
const oldMax = {};
for (const pool of ['ITEMS', 'PETS', 'MOUNTS']) for (const id of before[pool]) {
  const it = G(pool)[id]; const k = it.slot; oldMax[k] ||= { atk: 0, def: 0, cost: 0 };
  oldMax[k].atk = Math.max(oldMax[k].atk, it.atk || 0); oldMax[k].def = Math.max(oldMax[k].def, it.def || 0); oldMax[k].cost = Math.max(oldMax[k].cost, it.cost || 0);
}

/* ── 새 데이터 넣기 ── */
const blockA = block('A'), blockB = block('B'), blockC = block('C');
for (const [n, b] of [['A', blockA], ['B', blockB]]) {
  const ids = [...b.matchAll(/^(ITEMS|PETS|MOUNTS|FURNI)\.(\w+)\s*=\s*\{/gm)].map((m) => m[1] + '.' + m[2]);
  const seen = new Set(); for (const x of ids) { if (seen.has(x)) err('블록 ' + n + ' 안에서 두 번 정의: ' + x); seen.add(x); }
}
vm.runInContext(blockA, ctx);
vm.runInContext(blockB, ctx);
const after = { ITEMS: Object.keys(G('ITEMS')), PETS: Object.keys(G('PETS')), MOUNTS: Object.keys(G('MOUNTS')), FURNI: Object.keys(G('FURNI')) };
const added = {}; for (const k in after) added[k] = after[k].filter((id) => !before[k].includes(id));
const newGear = [...added.ITEMS.map((id) => ['ITEMS', id]), ...added.PETS.map((id) => ['PETS', id]), ...added.MOUNTS.map((id) => ['MOUNTS', id])];
const declared = [...(blockA + blockB).matchAll(/^(ITEMS|PETS|MOUNTS|FURNI)\.(\w+)\s*=/gm)].map((m) => m[2]);
for (const id of declared) if (oldAll.has(id)) err('기존 id와 겹침: ' + id);
const allNew = [...newGear.map((x) => x[1]), ...added.FURNI];
{ const s = new Set(); for (const id of allNew) { if (s.has(id)) err('풀 사이에서 id 겹침: ' + id); s.add(id); } }
for (const [, id] of newGear) if (artKeys.has('it_' + id)) err('그림 이름 it_' + id + '이 이미 있음');
for (const id of added.FURNI) if (artKeys.has('fu_' + id)) err('그림 이름 fu_' + id + '이 이미 있음');

const hex = (c) => /^#[0-9A-Fa-f]{6}$/.test(c);
const color = (c) => hex(c) || /^rgba\(\d+,\d+,\d+,\.?\d+\)$/.test(c);
function perkCheck(id, pk) { for (const k of Object.keys(pk || {})) { if (!PERK[k]) err(id + ': perk 키 ' + k + '가 PERK_TEXT에 없음'); if (typeof pk[k] !== 'number') err(id + ': perk ' + k + ' 값이 숫자가 아님'); } }
function mqCheck(id, mq) { if (mq != null && !mqIds.includes(mq)) err(id + ': mq ' + mq + '가 MQ_LIST에 없음(' + mqIds.join(',') + ')'); }

/* ── 장비·펫·탈것 ── */
for (const [pool, id] of newGear) {
  const it = G(pool)[id];
  for (const f of ['slot', 'name', 'cost', 'desc']) if (it[f] == null || it[f] === '') err(id + ': ' + f + ' 없음');
  if (!Number.isInteger(it.cost) || it.cost < 0) err(id + ': cost가 0 이상 정수가 아님');
  if (!it.atk && !it.def) err(id + ': atk·def 둘 다 없음');
  if (/—/.test(it.desc + it.name)) err(id + ': 줄표(—)가 있음');
  perkCheck(id, it.perk); mqCheck(id, it.mq);
  const want = { ITEMS: ['weapon', 'top', 'head', 'bottom'], PETS: ['pet'], MOUNTS: ['mount'] }[pool];
  if (!want.includes(it.slot)) err(id + ': slot ' + it.slot + '이 ' + pool + '에 맞지 않음');
  if (it.slot === 'weapon' && !weaponGears.has(it.gear)) err(id + ': 무기 모양 gear ' + it.gear + '가 drawWeapon에 없음');
  if (it.slot === 'head' && !headGears.has(it.gear)) err(id + ': 머리 모양 gear ' + it.gear + '가 없음');
  if (it.slot === 'top' || it.slot === 'bottom') { if (!hex(it.color)) err(id + ': color가 #RRGGBB가 아님'); if (it.accent && !hex(it.accent)) err(id + ': accent 색 오류'); }
  if (it.slot === 'top' && it.ts && !topTs.has(it.ts)) err(id + ': 윗옷 모양 ts ' + it.ts + '가 없음');
  if (it.slot === 'bottom' && it.bs && !botBs.has(it.bs)) err(id + ': 바지 모양 bs ' + it.bs + '가 없음');
  if (it.gear === 'beanie' && it.color && !(hex(it.color) && hex(it.color2))) err(id + ': 비니 color·color2 오류');
  if (it.slot === 'pet' && !petKinds.has(it.kind)) err(id + ': 펫 kind ' + it.kind + ' 그림이 없음(petG·CAST pet_)');
  if (it.slot === 'mount') {
    if (!mountKinds.has(it.kind)) err(id + ': 탈것 kind ' + it.kind + '가 mountG에 없음');
    for (const [k, v] of Object.entries(it.pal || {})) { if (!P[k]) err(id + ': pal 키 ' + k + ' 없음'); if (!P[v]) err(id + ': pal 값 ' + v + '가 P에 없음'); }
    for (const v of Object.values(it.top || {})) if (!hex(v)) err(id + ': top 색 ' + v + ' 오류');
    if (!(it.perk && it.perk.speed)) warn(id + ': 탈것인데 speed perk가 없음');
  }
  const om = oldMax[it.slot];
  if (om && ((it.atk || 0) > om.atk + 4 || (it.def || 0) > om.def + 6)) warn(id + ': 기존 같은 칸 최고치(공 ' + om.atk + ' · 방 ' + om.def + ')를 크게 넘음');
}

/* ── 세간 ── */
const FURNI = G('FURNI'), ACT = G('FURNI_ACT'), ORDER = G('FURNI_ORDER');
let DRAW = {}; try { DRAW = G('FURNI_DRAW'); } catch (e) { err('FURNI_DRAW가 없음'); }
for (const id of added.FURNI) {
  const it = FURNI[id];
  for (const f of ['name', 'cost', 'need', 'desc']) if (it[f] == null || it[f] === '') err(id + ': ' + f + ' 없음');
  if (!Number.isInteger(it.need) || it.need < 0 || it.need >= TIERS.length) err(id + ': need ' + it.need + '가 TIERS 0~' + (TIERS.length - 1) + ' 밖');
  if (!Number.isInteger(it.cost) || it.cost <= 0) err(id + ': cost 오류');
  if (!(it.w >= 1 && it.h >= 1)) err(id + ': w·h 없음(방에 못 놓음)');
  if (!it.atk && !it.def) err(id + ': atk·def 둘 다 없음');
  if (/—/.test(it.desc + it.name)) err(id + ': 줄표(—)가 있음');
  perkCheck(id, it.perk); mqCheck(id, it.mq);
  const rs = ROOMSPEC[it.need];
  if (!rs) err(id + ': need ' + it.need + ' 거처에는 방이 없음');
  else if (Math.max(it.w, it.h) > Math.max(rs.w, rs.h) - 2 || Math.min(it.w, it.h) > Math.min(rs.w, rs.h) - 2) err(id + ': ' + TIERS[it.need].name + ' 방(' + rs.w + '×' + rs.h + ')에 안 들어감');
  const acts = ACT[id];
  if (!Array.isArray(acts) || !acts.length) warn(id + ': 쓰기 동작(FURNI_ACT)이 없음');
  else for (const a of acts) {
    if (!a.t || !a.msg) err(id + ': 동작에 t·msg 없음');
    if (!a.cd && !a.daily && !a.ad) err(id + ': 동작에 cd·daily·ad 중 하나가 없음');
    for (const k of Object.keys(a.d || {})) if (!ACT_KEYS.has(k)) err(id + ': 동작 효과 키 ' + k + '는 addNeeds가 모름');
  }
  if (typeof DRAW[id] !== 'function') err(id + ': 도트 그림(FURNI_DRAW)이 없음');
  else {
    const W = it.w * 16, H = it.h * 16, rects = [];
    const R = (c, x, y, w, h) => rects.push([c, x, y, w, h]);
    const shadow = () => R('rgba(30,26,48,.22)', 1, H - 3, W - 2, 3);
    try { DRAW[id](R, shadow, W, H); } catch (e) { err(id + ': 그림 함수 오류 ' + e.message); }
    if (rects.length < 5) warn(id + ': 그림이 너무 단순함(' + rects.length + '개 사각형)');
    for (const [c, x, y, w, h] of rects) {
      if (!color(c)) err(id + ': 색 ' + c + ' 오류');
      if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > W || y + h > H) err(id + ': 사각형 (' + [x, y, w, h] + ')가 ' + W + '×' + H + ' 칸 밖');
    }
  }
}
for (const id of Object.keys(DRAW)) if (!FURNI[id]) err('FURNI_DRAW.' + id + '에 맞는 세간이 없음');
for (const id of Object.keys(DRAW)) if (before.FURNI.includes(id)) err('FURNI_DRAW.' + id + '는 기존 세간(drawObj에 이미 그림 있음)');
{ const all = Object.keys(FURNI), s = new Set(ORDER);
  if (s.size !== ORDER.length) err('FURNI_ORDER에 같은 id가 두 번');
  for (const id of all) if (!s.has(id)) err('FURNI_ORDER에 빠짐: ' + id);
  for (const id of ORDER) if (!FURNI[id]) err('FURNI_ORDER에 없는 세간: ' + id); }
if (!/FURNI_DRAW\[o\.id\]\(R,shadow,W,H\);\s*break;/.test(blockC)) err('블록 C가 예상한 한 줄이 아님');

/* ── 요약 ── */
const rows = [];
for (const [pool, id] of newGear) { const it = G(pool)[id]; rows.push([it.slot, id, it.name, it.atk || 0, it.def || 0, it.cost, it.mq || '-', '-', Object.keys(it.perk || {}).join('+')]); }
for (const id of added.FURNI) { const it = FURNI[id]; rows.push(['furni', id, it.name, it.atk || 0, it.def || 0, it.cost, it.mq || '-', it.need + ' ' + TIERS[it.need].name, Object.keys(it.perk || {}).join('+')]); }
console.log('새 아이템 ' + rows.length + '개 (장비·펫·탈것 ' + newGear.length + ', 세간 ' + added.FURNI.length + ')');
console.log(['칸', 'id', '이름', '공', '방', '값', 'mq', 'need', 'perk'].join('\t'));
for (const r of rows) console.log(r.join('\t'));
const sum = (f) => rows.filter(f).reduce((a, r) => a + r[5], 0);
console.log('값 합계: 장비 ￦' + sum((r) => r[0] !== 'furni') + ' · 세간 ￦' + sum((r) => r[0] === 'furni') + ' · 전체 ￦' + sum(() => true));
console.log('mq별: ' + ['-', ...mqIds].map((m) => m + ' ' + rows.filter((r) => r[6] === m).length).join(' · '));
for (const w of warns) console.log('주의: ' + w);
if (errs.length) { for (const e of errs) console.log('오류: ' + e); console.log('오류 ' + errs.length + '개. 아무것도 쓰지 않았다.'); process.exit(1); }
console.log('검사 통과');

/* ── 붙이기 ── */
function applied() {
  const A1 = 'function allItems(id){', B1 = 'FURNI_ACT.bed2=FURNI_ACT.bed;\n', C1 = "    default:\n      shadow(); R('#8A7A64',1,1,W-2,H-2);";
  for (const a of [A1, B1, C1]) { const n = src.split(a).length - 1; if (n !== 1) { console.error('붙일 자리 "' + a.split('\n')[0] + '"가 ' + n + '번 나옴. 멈춘다.'); process.exit(1); } }
  if (/FURNI_DRAW/.test(src)) { console.error('이미 붙인 파일 같다(FURNI_DRAW가 있음). 멈춘다.'); process.exit(1); }
  return src.replace(A1, () => blockA + A1).replace(B1, () => B1 + blockB)
    .replace(C1, () => "    default:\n" + blockC + "      shadow(); R('#8A7A64',1,1,W-2,H-2);");
}
const ai = args.indexOf('--apply');
if (ai >= 0) {
  const out = path.resolve(root, args[ai + 1] && !args[ai + 1].startsWith('--') ? args[ai + 1] : GAME);
  fs.writeFileSync(out, applied()); console.log('붙여 씀: ' + out);
}
const si = args.indexOf('--shot');
if (si >= 0) {
  const dir = path.resolve(root, args[si + 1] && !args[si + 1].startsWith('--') ? args[si + 1] : 'ops/review-1014/items/shots');
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, '.items-shot.html');                         /* prototype/에는 아무것도 쓰지 않는다 */
  fs.writeFileSync(tmp, applied());
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    for (const [w, h] of [[360, 640], [390, 844]]) {
      const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
      const logs = []; page.on('pageerror', (e) => logs.push(String(e)));
      await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
      await page.goto(url.pathToFileURL(tmp).href + '#nointro');
      await page.waitForFunction(() => window.S && window.FURNI && window.FURNI_DRAW, null, { polling: 100 });
      await page.evaluate(({ furni, gear }) => {
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#FFF8EC;overflow:auto;padding:8px;display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start;font:10px sans-serif';
        const cell = (cv, label, big) => { const d = document.createElement('div'); d.style.cssText = 'width:' + (big ? 100 : 64) + 'px;text-align:center';
          cv.style.width = cv.style.width || '52px'; cv.style.imageRendering = 'pixelated'; d.appendChild(cv);
          const t = document.createElement('div'); t.textContent = label; d.appendChild(t); box.appendChild(d); };
        for (const id of furni) { const it = FURNI[id], cv = document.createElement('canvas'); cv.width = it.w * 16; cv.height = it.h * 16;
          const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; drawObj(x, { id }, 0, 0); cv.style.width = it.w * 32 + 'px'; cell(cv, FURNI[id].name, it.w > 1); }
        for (const [slot, id] of gear) cell(thumbFor(slot, id), allItems(id).name);
        document.body.appendChild(box);
      }, { furni: added.FURNI, gear: newGear.map(([pool, id]) => [G(pool)[id].slot, id]) });
      const f = path.join(dir, 'items-' + w + 'x' + h + '.png');
      await page.screenshot({ path: f }); console.log('찍음: ' + f + (logs.length ? ' · 페이지 오류 ' + logs.join(' | ') : ''));
    }
  } finally { await browser.close(); fs.rmSync(tmp, { force: true }); }
}
