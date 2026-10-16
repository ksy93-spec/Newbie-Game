// 인연 트랙 검사. 저장소 루트에서: node ops/review-1014/tools/romance-check.mjs [게임 html]
// 1) 정적: romance.js 장면의 배경·인물 열쇠(게임 파일에서 읽음), 줄 폭 14자, 문서 상자, 보기 모양, em dash
// 2) 브라우저: apply.mjs로 ops/review-1014/tmp/romance.html을 만들고, 360×640에서 네 갈래를 실제 컷신으로 넘긴다
//    (대학생→서른 결혼·아이 둘, 30대 소개팅→결혼, 결정사→결혼·난임 뒤 아이, 비혼). 어느 나이에 무엇이 떴는지와 콘솔 오류를 적는다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import url from 'node:url'; import { execFileSync } from 'node:child_process';

const GAME = process.argv[2] || 'prototype/newbie-quest-demo.html';
const SRC = 'ops/review-1014/romance/romance.js';
const TMP = 'ops/review-1014/tmp/romance.html';
const OUTJ = 'ops/review-1014/tools/out/romance-check.json';
const html = fs.readFileSync(GAME, 'utf8'), src = fs.readFileSync(SRC, 'utf8');
const BG = new Set([...html.matchAll(/["']?bg_([a-z]+)["']?\s*:\s*\[/g)].map(m => m[1]));
const CAST = new Set(['hero', 'partner', ...[...html.matchAll(/["']?npc_([A-Za-z]+)["']?\s*:\s*[\[{]/g)].map(m => m[1])]);
const TOK = new Set(['@c', '@p', '@f', '@m', '@m2', '@s', '@k', '@k2']);
const bad = [], warn = [];

/* ── 1. 정적 ── */
if (/\u2014/.test(src)) bad.push('em dash(U+2014)가 있다');
const ctx = { LIFE_MID_FLAGS: [], console }; vm.createContext(ctx);
try { vm.runInContext(src + ';this.R={LOVE_CAST,LOVE_EVENTS,LOVE_ORDER,LOVE_REPLY,LOVE_SOLO_CH,LOVE_Y32,LOVE_SOLO_LINES,LOVE_KID_LINES,LOVE_END0,LOVE_MID_PATCH,LOVE_PEOPLE,loveJ};', ctx); }
catch (e) { console.log('문법 오류:', e.message); process.exit(1); }
const R = ctx.R;
const longest = (j) => Math.max(...['한결', '윤아'].map(n => R.loveJ(n, j).length));
const W = { ageKo: 4, name: 3, yrs: 2, cpar: 2, m: 4, s: 4, partner: 2 };
const width = (t) => String(t).replace(/\{(\w+)(?:\.([^}]+))?\}/g, (m, k, j) => 'x'.repeat(j ? longest(j) : (W[k] || 2))).length;
let nScene = 0, nChoice = 0;
function scene(p, at) {
  nScene++;
  const lines = [].concat(p.text || [], ...Object.values(p.textBy || {}));
  if (!p.text || !p.text.length) bad.push(at + ' text 없음');
  lines.forEach(t => { if (width(t) > 14) bad.push(`${at} 폭 ${width(t)}: ${t}`); if (/[{}]/.test(t.replace(/\{\w+(\.[^}]+)?\}/g, ''))) bad.push(at + ' 괄호 짝: ' + t); });
  if (p.bg && !BG.has(p.bg)) bad.push(at + ' 배경 ' + p.bg);
  (p.cast || []).forEach(c => { if (!CAST.has(c[0]) && !TOK.has(c[0])) bad.push(at + ' 인물 ' + c[0]); if (!/^[LCR]$/.test(c[1])) bad.push(at + ' 위치 ' + c[1]); });
  if (p.doc) { if (p.doc.rows.length > 4) bad.push(at + ' 문서 4줄 넘음');
    p.doc.rows.forEach(r => { const l = width(r[0]) + width(r[1]); if (l > 20) warn.push(`${at} 문서 줄 ${l}자: ${r.join(' | ')}`); }); }
  if (p.choice) { nChoice++; const o = p.choice.opts;
    if (o.length < 2 || o.length > 3) bad.push(at + ' 보기 수 ' + o.length);
    const graded = o.filter(x => x.ok === 1 || x.ok === 0);
    if (graded.length && !o.some(x => x.ok === 1)) bad.push(at + ' 등급 보기인데 맞는 보기 없음');
    o.forEach((x, i) => {
      if (!(x.ok === null || x.ok === 0 || x.ok === 1)) bad.push(`${at} 보기 ${i} ok 값 ${x.ok}`);
      if (!x.a) bad.push(`${at} 보기 ${i} a 없음`);
      if (!x.note && !['confess', 'engage', 'engage2', 'late2wed', 'join'].includes(x.go)) bad.push(`${at} 보기 ${i} 해설 없음`);
      if (x.a && width(x.a) > 40) warn.push(`${at} 보기 김 ${width(x.a)}: ${x.a}`);
      if (x.then) x.then.forEach((q, k) => scene(q, `${at}.then${i}.${k}`)); }); }
}
const walk = (list, at) => list.forEach((p, i) => scene(p, `${at}[${i}]`));
for (const [k, e] of Object.entries(R.LOVE_EVENTS)) {
  if (!R.LOVE_ORDER.includes(k)) bad.push(k + ' LOVE_ORDER에 없음');
  if (!Array.isArray(e.age) || typeof e.need !== 'function') bad.push(k + ' age/need 모양');
  if (typeof e.c === 'string' && e.c !== '@p' && !R.LOVE_CAST[e.c]) bad.push(k + ' 상대 ' + e.c);
  walk(e.scenes, k);
}
R.LOVE_ORDER.forEach(k => { if (!R.LOVE_EVENTS[k]) bad.push('LOVE_ORDER 없는 사건 ' + k); });
for (const [k, l] of Object.entries(R.LOVE_REPLY)) walk(l, 'REPLY.' + k);
walk(R.LOVE_SOLO_CH.scenes, 'SOLO_CH');
for (const [k, y] of Object.entries(R.LOVE_Y32)) walk(y.scenes, 'Y32.' + k);
for (const [k, v] of Object.entries(R.LOVE_SOLO_LINES)) scene({ text: v.text || [k], doc: v.rows ? { rows: v.rows } : null }, 'SOLO_LINES.' + k);
for (const [k, f] of Object.entries(R.LOVE_KID_LINES)) [5, 10, 15].forEach(a => { const t = f(a); if (t) scene({ text: t }, `KID_LINES.${k}.${a}`); });
for (const [k, t] of Object.entries(R.LOVE_END0)) scene({ text: t }, 'END0.' + k);
for (const [k, c] of Object.entries(R.LOVE_CAST)) { scene({ text: c.yes }, 'CAST.' + k + '.yes');
  ['F', 'M'].forEach(s => { if (!CAST.has(c.art[s])) bad.push(`CAST.${k}.art.${s} 그림 열쇠 ${c.art[s]}`); }); }
for (const p of Object.values(R.LOVE_PEOPLE)) [p.key, p.F && p.F.key, p.M && p.M.key].filter(Boolean).forEach(k => { if (!CAST.has(k)) bad.push('PEOPLE 그림 ' + k); });
/* 함수 안에 적은 장면(loveGo의 join·yes)의 줄도 본다 */
for (const m of src.matchAll(/text: \[([^\]]*)\]/g)) [...m[1].matchAll(/'([^']*)'/g)].forEach(x => { if (width(x[1]) > 14) bad.push('src 폭 ' + width(x[1]) + ': ' + x[1]); });
const evN = Object.keys(R.LOVE_EVENTS).length;
console.log(`정적: 사건 ${evN}개, 장면 ${nScene}개, 선택 ${nChoice}개, 문제 ${bad.length}, 주의 ${warn.length}`);
bad.forEach(b => console.log('  ✗ ' + b)); warn.slice(0, 12).forEach(w => console.log('  · ' + w));

/* ── 2. 브라우저 ── */
execFileSync('node', ['ops/review-1014/romance/apply.mjs', GAME, TMP], { stdio: 'pipe' });
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const BASE = url.pathToFileURL(path.resolve(TMP)).href;

const LUKE = ['인사만', '괜히 말했다가', '오늘은 피곤', '사내 연애는', '오늘은 제가 낼게', '남는 걸 저축'];
const MARRY = ['빚까지', '종이로 남기자', '결혼하자고', '같은 말로', '부모님 손님', '달마다 갚을 돈', '계약하고 이삿날', '취소 조항', '제도마다', '모임통장', '여행 적금',
  '한 번에 신청', '미리 말하고', '목록대로'];
const ROUTES = [
  { id: 'A 대학생→서른 결혼·아이 둘', sex: 'M', path: '4년제', to: 47,
    prefer: ['정산 맡을게', '끝까지 같이 걸게', '좋아한다고', '멀어도 만나자', ...MARRY, '곧 낳자', '둘째를 낳자'],
    expect: { stage: 'married', partner: 'seo', marriedAt: 30, kids: 2, mid43: 'kidedu' } },
  { id: 'B 30대 소개팅→결혼', sex: 'F', path: '전문대', to: 45,
    prefer: [...LUKE, '열어 둔다', '아직 이르다고', '^좋아요', '고맙지만 조건은', '사귀자고', ...MARRY, '곧 낳자', '하나로 충분'],
    expect: { stage: 'married', partner: 'yoon', kidsMin: 1, mid43: 'kidedu' } },
  { id: 'C 결정사→결혼·기다림 뒤 아이', sex: 'M', path: '4년제', to: 45,
    prefer: [...LUKE, '결혼정보회사 상담', '환불 기준과', '예물은 둘이 정한', '사귀자고', ...MARRY, '몇 해 뒤에', '둘이 정한 만큼만', '하나로 충분'],
    expect: { stage: 'married', partner: 'min', kids: 1, ivf: true, mid43: 'selfedu' } },
  { id: 'D 비혼', sex: 'F', path: '고졸', to: 45,
    prefer: [...LUKE, '혼자 사는 삶을 내 방식', '혼자가 편한 사람'],
    expect: { stage: 'solo', kids: 0, mid43: 'selfedu' } }
];

async function open() {
  const c = await browser.newContext({ viewport: { width: 360, height: 640 } });
  const page = await c.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS && window.LOVE_EVENTS, null, { polling: 100 });
  return { c, page, errs };
}
/* 떠 있는 컷신을 다 넘긴다. 보기는 prefer 순서로, 없으면 첫째 */
async function drive(page, prefer, rec, maxMs = 90000) {
  const t0 = Date.now(); let idle = 0, seenId = null;
  while (Date.now() - t0 < maxMs) {
    const s = await page.evaluate(() => { if (!window.MQP) return null; const p = MQP.list()[MQP.cur()] || {};
      return { id: MQP.o.kicker + '|' + MQP.o.title + '|' + MQP.o.sub, title: MQP.o.title, kicker: MQP.o.kicker || 'MQ', type: p.type || '', choice: !!p.choice, picked: MQP.picked,
        opts: p.choice ? p.choice.opts.map(o => o.a) : [],
        scenes: MQP.o.scenes.map(q => ({ who: q.who || '', text: (q.text || []).join(' '), cast: (q.cast || []).map(c => c[0]).join(','), doc: q.doc ? q.doc.rows.map(r => r.join(':')).join(' / ') : '' })) }; });
    if (!s) { if (!idle) idle = Date.now(); if (Date.now() - idle > 1400) return; await page.waitForTimeout(80); continue; }
    idle = 0;
    if (s.id !== seenId) { seenId = s.id; rec.cines.push({ kicker: s.kicker, title: s.title, scenes: s.scenes, picks: [] }); }
    if (s.choice && s.picked === null) {
      let j = -1; for (const w of prefer) { j = s.opts.findIndex(a => new RegExp(w).test(a)); if (j >= 0) break; }
      if (j < 0) j = 0;
      rec.cines[rec.cines.length - 1].picks.push(s.opts[j]);
      await page.evaluate(k => MQP.pick(k), j);
    } else await page.evaluate(() => MQP && MQP.next({ type: 'test' }));
    await page.waitForTimeout(20);
  }
  throw new Error('컷신이 끝나지 않는다');
}

const results = [];
for (const RT of ROUTES) {
  const { c, page, errs } = await open();
  const rec = { route: RT.id, cines: [], played: [], notes: [] };
  await page.evaluate(({ sex, pth }) => {
    LOVE_AUTO = false; lifeNew();
    let p = null; for (let i = 0; i < 5000 && !p; i++) { const q = lifeGen(lifeSeedNew()); if (q.sex === sex && q.path === pth && q.living !== '기숙사') p = q; }
    S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.prologue = 0; render('home');
  }, { sex: RT.sex, pth: RT.path });
  /* 저절로 틀기(홈 → lifeStageCheck → loveCheck)를 한 번 본다 */
  if (RT.id.startsWith('A')) {
    const auto = await page.evaluate(async () => { LOVE_AUTO = true; try { closeTip(); } catch (e) {} try { S.tut = 1; if (TUT) endTalk(); TUT_COOL = Date.now() + 600000; } catch (e) {} render('home'); await new Promise(r => setTimeout(r, 2800));
      const k = window.MQP ? MQP.o.kicker + ' ' + MQP.o.title : null; const hs = document.getElementById('home'), tp = document.getElementById('itip'); return { k, idle: mqIdle(), due: (loveDue() || {}).id || null, why: JSON.stringify({ home: !!(hs && hs.classList.contains('on')), TUT: !!TUT, PLACE: !!PLACE, MOVE: !!MOVE, DRIVE: !!DRIVE, opening: !!document.getElementById('opening'), tip: !!(tp && !tp.hidden) }) }; });
    rec.notes.push('홈에서 저절로: ' + (auto.k || '안 뜸') + ' (mqIdle ' + auto.idle + ', 차례 ' + auto.due + ', ' + auto.why + ')');
    if (auto.k) { await drive(page, RT.prefer, rec); rec.played.push({ age: 20, id: 'club(auto)' }); }
    await page.evaluate(() => { LOVE_AUTO = false; });
  }
  for (let a = 20; a <= RT.to; a++) {
    const st = await page.evaluate((a) => {
      S.life.age = a; S.life.anch = { age: a, done: lifeActs() };
      const M = mqS(), p = S.life.prof;
      if (S.status === '대학생' && ((p.path === '전문대' && a >= 22) || a >= 24)) S.status = '취준생';
      if (a >= 24 && !M.done.job) { M.done.job = 'good'; S.status = '직장인'; S.company = '중소기업'; }
      if (a >= 26) M.done.lease = 'good'; if (a >= 27) M.done.card = 'good'; if (a >= 29) M.done.car = 'good';
      loveSync(); save();
      return { wedAge: LIFE_AGES.wedding, wedDone: mqDone('wedding') };
    }, a);
    if (a === st.wedAge && !st.wedDone) {
      await page.evaluate(() => mqStart('wedding')); await drive(page, RT.prefer, rec);
      const w = await page.evaluate(() => { loveSync(); return { done: mqDone('wedding'), ch5: loveS().ch5, stage: loveS().stage, title: mqById('wedding').title }; });
      rec.played.push({ age: a, id: '5장 ' + w.title + ' (' + w.ch5 + ')' });
    }
    if (a === 37) { await page.evaluate(() => { S.paid = Math.max(S.paid || 0, 8); mqStart('home'); }); await drive(page, RT.prefer, rec); rec.played.push({ age: a, id: '6장 첫 내 집 마련' }); }
    if (a === 40) { await page.evaluate(() => lifeMidPlay('checkup', { age: 40 })); await drive(page, RT.prefer, rec); rec.played.push({ age: a, id: 'mid checkup' }); }
    if (a === 43) { const ev = await page.evaluate(() => { const s = lifeMidSlot(43); if (s && s.ev) lifeMidPlay(s.ev, { age: 43 }); return s && s.ev; });
      rec.mid43 = ev; await drive(page, RT.prefer, rec); rec.played.push({ age: a, id: 'mid ' + ev }); }
    for (let k = 0; k < 4; k++) {
      const id = await page.evaluate(() => { const d = loveDue(); if (!d) return null; lovePlay(d.id); return d.id; });
      if (!id) break; await drive(page, RT.prefer, rec); rec.played.push({ age: a, id });
    }
  }
  /* 예순 */
  await page.evaluate(() => { S.life.age = 59; MQ_LIST.forEach(c => { S.mq.done[c.id] = S.mq.done[c.id] || 'good'; }); S.tier = S.peak = 9; save(); lifeEnd(); });
  await drive(page, RT.prefer, rec);
  const fin = await page.evaluate(() => { const L = loveS(), box = document.getElementById('itipbox');
    return { stage: L.stage, partner: L.partner && L.partner.id, partnerName: L.partner && L.partner.name, married: L.married || null, kids: L.kids, kidAges: L.kidAges,
      ivf: !!L.ivf, log: L.log, title: S.life.title, card: box ? box.textContent.replace(/\s+/g, ' ').slice(0, 400) : '' }; });
  Object.assign(rec, { fin, errs });
  /* 기대값 */
  const E = RT.expect, fail = [];
  if (E.stage && fin.stage !== E.stage) fail.push('stage ' + fin.stage);
  if (E.partner && fin.partner !== E.partner) fail.push('partner ' + fin.partner);
  if (E.marriedAt && fin.married !== E.marriedAt) fail.push('married ' + fin.married);
  if (E.kids != null && fin.kids !== E.kids) fail.push('kids ' + fin.kids);
  if (E.kidsMin && fin.kids < E.kidsMin) fail.push('kids ' + fin.kids);
  if (E.ivf && !fin.ivf) fail.push('ivf 안 거침');
  if (E.mid43 !== undefined && E.mid43 !== null && rec.mid43 !== E.mid43) fail.push('43살 ' + rec.mid43);
  const all = rec.cines.flatMap(ci => ci.scenes.map(s => s.who + ' ' + s.text + ' ' + s.doc));
  const left = all.filter(t => /\{\w+(\.[^}]+)?\}/.test(t)); if (left.length) fail.push('안 채운 자리표: ' + left.slice(0, 3).join(' || '));
  const end = rec.cines.filter(ci => ci.kicker === 'LIFE' && ci.scenes.some(s => /예순 번째 생일/.test(s.text))).pop();
  rec.endPart1 = end ? end.scenes.filter(s => /예순 번째|서랍|종이/.test(s.text + s.doc)).map(s => (s.who ? s.who + ': ' : '') + s.text + (s.doc ? ' [' + s.doc + ']' : '')) : [];
  const chk = rec.cines.find(ci => ci.title === '건강검진');
  rec.checkupLine = chk ? (chk.scenes.find(s => /데리러/.test(s.text)) || {}) : null;
  if (fin.stage === 'married' && rec.checkupLine && rec.checkupLine.who !== fin.partnerName) fail.push('검진 배우자 이름 ' + rec.checkupLine.who);
  if (fin.stage === 'solo' && rec.checkupLine && !/동기/.test(rec.checkupLine.who)) fail.push('비혼 검진 ' + rec.checkupLine.who);
  if (/\{a_/.test(JSON.stringify(rec.endPart1))) fail.push('서랍 나이 안 채움');
  if (errs.length) fail.push('콘솔 오류 ' + errs.length);
  rec.fail = fail; results.push(rec);
  console.log(`\n■ ${RT.id}  ${fail.length ? '✗ ' + fail.join(' · ') : '통과'}`);
  console.log('  ' + rec.played.map(x => x.age + ' ' + x.id).join(' → '));
  rec.notes.forEach(n => console.log('  ' + n));
  console.log(`  끝: ${fin.stage}${fin.partnerName ? ' · ' + fin.partnerName : ''}${fin.married ? ' · 결혼 ' + fin.married : ''} · 아이 ${fin.kids}${fin.kidAges.length ? ' (' + fin.kidAges.join(',') + '살에)' : ''} · 칭호 ${fin.title}`);
  console.log('  검진: ' + (rec.checkupLine ? rec.checkupLine.who + ' "' + rec.checkupLine.text + '"' : '-'));
  rec.endPart1.forEach(t => console.log('  예순: ' + t));
  console.log('  결산 카드: ' + (fin.card.match(/함께 · [^인]*|혼자, 내 방식으로|혼자 · [^인]*/) || ['(없음)'])[0].trim());
  errs.forEach(e => console.log('  ! ' + e));
  await c.close();
}
await browser.close();
fs.mkdirSync(path.dirname(OUTJ), { recursive: true });
fs.writeFileSync(OUTJ, JSON.stringify({ static: { events: evN, scenes: nScene, choices: nChoice, bad, warn }, routes: results }, null, 1));
const nf = results.filter(r => r.fail.length).length;
console.log(`\n정적 문제 ${bad.length} · 갈래 ${results.length - nf}/${results.length} 통과 · 결과 ${OUTJ}`);
process.exit(bad.length || nf ? 1 : 0);
