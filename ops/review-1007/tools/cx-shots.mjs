// CX 점검: 화면마다 360×640, 390×844에서 찍고 요소 크기·글꼴·겹침을 잰다.
// 실행: node ops/review-1007/tools/cx-shots.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../..');
const BASE = url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.resolve(here, '../img');
const OUT = path.resolve(here, 'cx-metrics.json');
const VPS = [{ w: 360, h: 640, k: '360' }, { w: 390, h: 844, k: '390' }];

const browser = await chromium.launch();
const all = {};

// 화면 안에서 재는 것: 누를 수 있는 것의 크기, 글꼴 분포, 지도 위 겹침, 주요 띠 높이
function measure() {
  const vis = (e) => { if (!e || !e.getClientRects().length) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight; };
  const lab = (e) => (e.getAttribute('aria-label') || e.textContent || e.id || e.className || '').replace(/\s+/g, ' ').trim().slice(0, 28);
  const R = (r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
  const targets = [];
  document.querySelectorAll('button,a,input,select,[onclick],.tutor,.toast').forEach((e) => {
    if (!vis(e)) return; if (e.classList.contains('toast')) return;
    const r = e.getBoundingClientRect();
    targets.push({ t: lab(e), id: e.id, cls: (e.className || '').toString().slice(0, 30), ...R(r), small: r.width < 44 || r.height < 44, dis: !!e.disabled });
  });
  // 글꼴: 직접 글자를 가진 요소만
  const fonts = {}; const fontsEx = {};
  document.querySelectorAll('body *').forEach((e) => {
    if (!vis(e)) return;
    const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const cs = getComputedStyle(e); const fam = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    const k = fam + ' ' + cs.fontSize + ' w' + cs.fontWeight;
    fonts[k] = (fonts[k] || 0) + 1;
    if (!fontsEx[k]) fontsEx[k] = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 24);
  });
  // 홈 지도 위에 얹힌 것들
  let home = null;
  const hs = document.getElementById('home');
  if (hs && hs.classList.contains('on')) {
    const sb = hs.querySelector('.stagebox').getBoundingClientRect();
    const ov = {};
    ['hzone', 'hchk', 'hguide', 'hmq', 'hdpad', 'hmini', 'hnear', 'htutor', 'hplace', 'htravel', 'htoast'].forEach((id) => {
      const e = document.getElementById(id); if (vis(e)) ov[id] = R(e.getBoundingClientRect()); });
    const pairs = [];
    const ks = Object.keys(ov);
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
      const a = ov[ks[i]], b = ov[ks[j]];
      const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ix > 0 && iy > 0) pairs.push([ks[i], ks[j], ix * iy]);
    }
    // 주인공과 사람(스팟)의 화면 위치
    let me = null, spots = [], covered = [];
    try {
      const m = curMap(), cam = camOf(m), cv = document.getElementById('scene').getBoundingClientRect();
      const k = cv.width / SW;
      const toScr = (px, py) => ({ x: Math.round(cv.x + (px - cam.x) * cam.z * k), y: Math.round(cv.y + (py - cam.y) * cam.z * k) });
      const p = mePx(); const a = toScr(p.x, p.y - 16), b = toScr(p.x + TS, p.y + TS);
      me = { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
      (m.spots || []).forEach((s) => { const a2 = toScr(s.x * TS, s.y * TS - 16), b2 = toScr(s.x * TS + TS, s.y * TS + TS);
        const r = { x: a2.x, y: a2.y, w: b2.x - a2.x, h: b2.y - a2.y, n: s.name || s.kind };
        if (r.x + r.w > cv.x && r.x < cv.x + cv.width && r.y + r.h > cv.y && r.y < cv.y + cv.height) spots.push(r); });
      const hit = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0;
      Object.entries(ov).forEach(([id, r]) => {
        if (hit(r, me)) covered.push([id, '주인공']);
        spots.forEach((s) => { if (hit(r, s)) covered.push([id, s.n]); }); });
      home = { stage: R(sb), zoom: cam.z, scale: +(k).toFixed(2), tile: +(TS * cam.z * k).toFixed(1), SH, ov, pairs, me, spots: spots.length, covered };
    } catch (e) { home = { stage: R(sb), ov, pairs, err: String(e) }; }
  }
  // 띠 높이
  const band = {};
  [['hud', '#home .hud'], ['scene', '#home .stagebox'], ['sceneinfo', '#home .sceneinfo'], ['tabbar', '.screen.on .tabbar'], ['qhead', '.screen.on .qhead'],
   ['stage', '.screen.on .stage'], ['charstage', '.screen.on .charstage'], ['doll', '.screen.on .doll'], ['itip', '#itipbox'], ['hfoot', '#hfoot']].forEach(([k, s]) => {
    const e = document.querySelector(s); if (vis(e)) band[k] = R(e.getBoundingClientRect()); });
  const sc = document.querySelector('.screen.on .scroll');
  const scroll = sc ? { client: sc.clientHeight, full: sc.scrollHeight } : null;
  const screen = (document.querySelector('.screen.on') || {}).id;
  return { screen, vw: innerWidth, vh: innerHeight, targets, small: targets.filter((t) => t.small && !t.dis).length, fonts, fontsEx, home, band, scroll };
}

async function open(vp, { intro = false, fresh = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + (intro ? '' : '#nointro'));
  if (!intro) await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  return { ctx, page, logs };
}
const base = (opt = {}) => {
  S = fresh(); S.status = '직장인'; applyStarter();
  Object.assign(S, { years: 2, living: '자취', region: '수도권', age: 27, company: '중소기업' });
  S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.prologue = 1; S.coin = 1240; S.lv = 4; S.xp = 120;
  if (opt.done) { S.done = QUESTS.slice(0, 6).map((q) => q.id); }
  S.todayQ = pickDaily(); save(); rollDay(); S.todayQ = pickDaily(); save();
};

async function shot(page, vp, name, logs) {
  await page.waitForTimeout(250);
  const file = `cx-${name}-${vp.k}.png`;
  await page.screenshot({ path: path.join(IMG, file) });
  const m = await page.evaluate(measure);
  m.logs = logs.slice();
  all[`${name}-${vp.k}`] = m;
  return m;
}

async function playThrough(page, sel, nextSel, endScreen, maxSteps = 40) {
  for (let i = 0; i < maxSteps; i++) {
    const on = await page.evaluate(() => (document.querySelector('.screen.on') || {}).id);
    if (on === endScreen) return true;
    await page.evaluate(() => typeof typeSkip === 'function' && typeSkip());
    const did = await page.evaluate(([sel, nextSel]) => {
      const n = document.querySelector(nextSel); if (n && !n.hidden && n.offsetParent) { n.click(); return 'next'; }
      const c = [...document.querySelectorAll(sel)].find((b) => !b.disabled && b.offsetParent); if (c) { c.click(); return 'pick'; }
      const d = document.querySelector('.screen.on .dlg'); if (d) d.click(); return 'dlg'; }, [sel, nextSel]);
    await page.waitForTimeout(did === 'next' ? 700 : 450);
  }
  return false;
}

for (const vp of VPS) {
  // 1. 오프닝
  {
    const { ctx, page, logs } = await open(vp, { intro: true });
    await page.waitForTimeout(2500); await shot(page, vp, 'opening-a', logs);
    await page.waitForTimeout(7000); await shot(page, vp, 'opening-b', logs);
    await ctx.close();
  }
  // 2. 온보딩
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(() => { S = fresh(); obStep = 0; render('onboard'); go('onboard'); obRender(); });
    await shot(page, vp, 'onboard-1', logs);
    await page.evaluate(() => { document.querySelector('#obbody .opt').click(); });
    await shot(page, vp, 'onboard-1sel', logs);
    await page.evaluate(() => { obStep = obSteps().length - 1; obRender(); });
    await shot(page, vp, 'onboard-hero', logs);
    await ctx.close();
  }
  // 3. 홈: 처음 들어온 사람(안내 대화)
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(() => { S = fresh(); S.status = '대학생'; applyStarter(); Object.assign(S, { living: '자취', region: '수도권' });
      S.onboarded = true; S.prologue = 1; S.todayQ = pickDaily(); save(); rollDay(); render('home'); });
    await page.waitForTimeout(2500);
    await shot(page, vp, 'home-first', logs);
    await ctx.close();
  }
  // 4. 홈: 중간 진행
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => render('home'));
    await page.waitForTimeout(2200);
    await page.evaluate(() => { closeTip(); if (window.TUT) endTalk(); });
    await shot(page, vp, 'home-mid', logs);
    // 토스트
    await page.evaluate(() => toast('새 퀘스트가 열렸어요 · 월세 계약서 읽기'));
    await shot(page, vp, 'home-toast', logs);
    // 대화
    await page.evaluate(() => talkTo({ name: '동네 어르신', face: 'gpa', lines: ['요즘 젊은이들은 보증금 돌려받는 법을 잘 몰라. 계약서에 특약 한 줄이 얼마나 큰지 알아야 해.', '둘'] }));
    await page.waitForTimeout(2200);
    await shot(page, vp, 'home-talk', logs);
    await page.evaluate(() => { TUT = null; document.getElementById('htutor').hidden = true; });
    // 이동 목록
    await page.evaluate(() => openTravel());
    await shot(page, vp, 'home-travel', logs);
    await page.evaluate(() => { document.getElementById('htravel').hidden = true; });
    // 오늘 할 일 시트
    await page.evaluate(() => todaySheet());
    await shot(page, vp, 'home-today', logs);
    await page.evaluate(() => closeTip());
    // 잠긴 퀘스트 시트(쌓인 버튼)
    await page.evaluate(() => { const q = QUESTS.find((q) => !qOpen(q)) || QUESTS[QUESTS.length - 1]; lockedDialog(q); });
    await shot(page, vp, 'home-locked', logs);
    await page.evaluate(() => closeTip());
    // 거처 아래 줄(이사 뒤)
    await page.evaluate(() => { S.tier = Math.min(S.tier + 1, 9); S.peak = Math.max(S.peak, S.tier); S.furni = S.furni || []; render('home'); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { closeTip(); if (window.TUT) endTalk(); });
    await shot(page, vp, 'home-moved', logs);
    await ctx.close();
  }
  // 5. 퀘스트 목록(탭에서 못 가는 화면)
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => render('quests'));
    await shot(page, vp, 'quests', logs);
    await ctx.close();
  }
  // 6. 퀘스트 → 결과
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, {});
    const t0 = Date.now();
    await page.evaluate(() => { const q = todayList()[0] || QUESTS.find(qOpen); startQuest(q); });
    await page.waitForFunction(() => document.getElementById('quest').classList.contains('on'), null, { timeout: 8000 });
    const tWipe = Date.now() - t0;
    await page.waitForTimeout(300);
    await shot(page, vp, 'quest-intro', logs);
    await page.waitForFunction(() => !document.getElementById('qnext').hidden, null, { timeout: 15000 });
    const tIntro = Date.now() - t0;
    await page.click('#qnext');
    await page.waitForFunction(() => !document.getElementById('qchoices').hidden && document.querySelectorAll('#qchoices .choice').length, null, { timeout: 15000 });
    const tChoice = Date.now() - t0;
    await shot(page, vp, 'quest-q', logs);
    await page.evaluate(() => document.querySelector('#qchoices .choice').click());
    await page.waitForTimeout(900);
    await shot(page, vp, 'quest-ans', logs);
    all[`timing-${vp.k}`] = { wipeMs: tWipe, introDoneMs: tIntro, firstChoiceMs: tChoice };
    await playThrough(page, '#qchoices .choice', '#qnext', 'result');
    await page.waitForTimeout(900);
    await shot(page, vp, 'result', logs);
    await page.evaluate(() => { const s = document.querySelector('#result .scroll'); s.scrollTop = s.scrollHeight; });
    await shot(page, vp, 'result-end', logs);
    await ctx.close();
  }
  // 7. 보스 → 끝
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => { S.stats.ju = 60; startBoss(BOSSES[0]); });
    await page.waitForFunction(() => document.getElementById('boss').classList.contains('on'), null, { timeout: 8000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => typeSkip());
    await page.waitForTimeout(400);
    await shot(page, vp, 'boss', logs);
    await page.evaluate(() => { const c = document.querySelector('#bchoices .choice'); if (c) c.click(); });
    await page.waitForTimeout(1200);
    await shot(page, vp, 'boss-hit', logs);
    await playThrough(page, '#bchoices .choice', '#bnext', 'bossend', 60);
    await page.waitForTimeout(900);
    await shot(page, vp, 'bossend', logs);
    await ctx.close();
  }
  // 8. 사건 → 결말
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => epStart(EPISODES[0]));
    await page.waitForTimeout(1800);
    await page.evaluate(() => typeSkip());
    await shot(page, vp, 'ep', logs);
    await playThrough(page, '#epchoices .choice, #epchoices button', '#epnext', 'epend', 60);
    await page.waitForTimeout(900);
    await shot(page, vp, 'epend', logs);
    await ctx.close();
  }
  // 9. 캐릭터, 장비 시트, 거처 시트
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => render('char'));
    await shot(page, vp, 'char', logs);
    await page.evaluate(() => { const s = document.querySelector('#char .scroll'); s.scrollTop = s.scrollHeight; });
    await shot(page, vp, 'char-bottom', logs);
    await page.evaluate(() => { const s = document.querySelector('#char .scroll'); s.scrollTop = 0; document.querySelector('#char .dslot').click(); });
    await shot(page, vp, 'char-tip', logs);
    await page.evaluate(() => { closeTip(); houseTip(7); });
    await shot(page, vp, 'char-house', logs);
    await ctx.close();
  }
  // 10. 상점
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => render('shop'));
    await shot(page, vp, 'shop', logs);
    await page.evaluate(() => { const s = document.querySelector('#shop .scroll'); s.scrollTop = 900; });
    await shot(page, vp, 'shop-mid', logs);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#shopbody .item')].find((b) => !b.classList.contains('locked')); if (b) b.click(); });
    await page.waitForTimeout(300);
    await shot(page, vp, 'shop-tip', logs);
    await ctx.close();
  }
  // 11. 백과, 검색, 체크리스트
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => render('wiki'));
    await shot(page, vp, 'wiki', logs);
    await page.fill('#wikiq', '전세');
    await page.waitForTimeout(300);
    await shot(page, vp, 'wiki-search', logs);
    await page.fill('#wikiq', 'ㅁㄴㅇㄹ없는말');
    await page.waitForTimeout(300);
    await shot(page, vp, 'wiki-empty', logs);
    await page.evaluate(() => openCheck(CHECKS[0].id));
    await shot(page, vp, 'check', logs);
    await ctx.close();
  }
  // 12. 수집 노트(설정 포함)
  {
    const { ctx, page, logs } = await open(vp);
    await page.evaluate(base, { done: true });
    await page.evaluate(() => render('codex'));
    await shot(page, vp, 'codex', logs);
    await page.evaluate(() => { const s = document.querySelector('#codex .scroll'); s.scrollTop = s.scrollHeight * 0.55; });
    await shot(page, vp, 'codex-mid', logs);
    all[`codex-len-${vp.k}`] = await page.evaluate(() => { const s = document.querySelector('#codex .scroll'); return { full: s.scrollHeight, client: s.clientHeight }; });
    await ctx.close();
  }
}

// Galmuri 글꼴이 크기마다 얼마나 선명한지(반투명 가장자리 비율)
{
  const { ctx, page } = await open(VPS[0]);
  all.crisp = await page.evaluate(async () => {
    await document.fonts.ready;
    const out = {};
    for (const fam of ['Galmuri14', 'Galmuri11', 'Galmuri9']) {
      for (const w of [400, 700]) {
        for (let px = 8; px <= 30; px++) {
          const cv = document.createElement('canvas'); cv.width = 400; cv.height = 60;
          const c = cv.getContext('2d'); c.font = `${w} ${px}px ${fam}`; c.textBaseline = 'top'; c.fillStyle = '#000';
          c.fillText('가나다 월세 보증금 123 XP', 2, 4);
          const d = c.getImageData(0, 0, 400, 60).data; let on = 0, part = 0;
          for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { on++; if (d[i] < 250) part++; } }
          out[`${fam} ${w} ${px}`] = on ? +(part / on).toFixed(3) : null;
        }
      }
    }
    return out;
  });
  await ctx.close();
}

fs.writeFileSync(OUT, JSON.stringify(all, null, 1));
await browser.close();
console.log('ok', Object.keys(all).length);
