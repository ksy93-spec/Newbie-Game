// 마케팅·첫인상: 손맛(걷기 속도, 프레임, 전환, 소리 횟수, 화면 밖 버튼)을 잰다.
// 실행: node ops/review-1007/tools/mk-feel.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
const { chromium } = await import('playwright');
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(root, 'ops/review-1007/img');
const out = {};
const browser = await chromium.launch();

async function open(w, h, dpr = 2) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(() => {
    S = fresh(); S.status = '대학생'; applyStarter();
    Object.assign(S, { living: '자취', region: '수도권', age: 23 });
    S.onboarded = true; S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'doors', 'gear', 'needs', 'hungry', 'lv2', 'room', 'ep', 'check'];
    S.todayQ = pickDaily(); S.claimed = dayKey(); save(); render('home');
    // 소리·그리기 횟수 세기
    window.__sfx = []; const o = window.sfx; window.sfx = function (n) { window.__sfx.push([Math.round(performance.now()), n]); return o.apply(this, arguments); };
    window.__draw = 0; const d = window.drawScene; window.drawScene = function () { window.__draw++; return d.apply(this, arguments); };
  });
  await page.waitForTimeout(500);
  return { ctx, page };
}

// 1. 지도: 가만히 있을 때와 걸을 때의 다시 그리기 빈도, 걷기 속도
{
  const { ctx, page } = await open(390, 844);
  const idle = await page.evaluate(async () => { window.__draw = 0; await new Promise((r) => setTimeout(r, 2000)); return window.__draw / 2; });
  const geo = await page.evaluate(() => { const cv = document.getElementById('scene'); const r = cv.getBoundingClientRect(); return { cssW: r.width, cssH: r.height, SW, SH, TS, scale: r.width / SW, res: RES }; });
  // 오른쪽으로 6칸 걷기(빈 칸을 찾아)
  const walk = await page.evaluate(async () => {
    const m = curMap(); let best = null;
    for (let dx = 8; dx >= 3; dx--) { const p = pathTo(m, ME.tx + dx, ME.ty); if (p && p.length) { best = { x: ME.tx + dx, y: ME.ty, n: p.length }; break; } }
    if (!best) for (let dy = 6; dy >= 2; dy--) { const p = pathTo(m, ME.tx, ME.ty + dy); if (p && p.length) { best = { x: ME.tx, y: ME.ty + dy, n: p.length }; break; } }
    window.__draw = 0; const t0 = performance.now();
    await new Promise((res) => { goTo(best.x, best.y, () => res()); setTimeout(res, 8000); });
    const ms = performance.now() - t0; return { tiles: best.n, ms: Math.round(ms), draws: window.__draw, fps: +(window.__draw / (ms / 1000)).toFixed(1) };
  });
  walk.msPerTile = Math.round(walk.ms / walk.tiles);
  walk.screenPxPerSec = Math.round(16 * geo.scale * 1000 / walk.msPerTile);
  // 탭에서 첫 발까지
  const lat = await page.evaluate(async () => {
    const t0 = performance.now(); const m = curMap();
    let tgt = null; for (const [dx, dy] of [[-3, 0], [0, 3], [3, 0], [0, -3], [-2, 0], [2, 0]]) { const p = pathTo(m, ME.tx + dx, ME.ty + dy); if (p && p.length) { tgt = [ME.tx + dx, ME.ty + dy]; break; } }
    goTo(tgt[0], tgt[1], null);
    const sx = ME.tx; let moved = -1;
    while (performance.now() - t0 < 1000) { await new Promise((r) => requestAnimationFrame(r)); const p = mePx(); if (MOVE && MOVE.t > 0) { moved = performance.now() - t0; break; } }
    return { firstMoveMs: Math.round(moved) };
  });
  // 맵 이동 전환
  const mapSwitch = await page.evaluate(async () => {
    const t0 = performance.now(); enterMap('school', 1, 5); const t1 = performance.now();
    return { enterMapMs: Math.round(t1 - t0), fade: !!document.querySelector('#wipe.on') }; });
  const css = await page.evaluate(() => {
    const g = (sel, p) => { const e = document.querySelector(sel); return e ? getComputedStyle(e)[p] : null; };
    return { hxpTransition: g('#hxp', 'transition'), screenTransition: g('.screen', 'transition'), btnActiveRule: [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter((r) => r.selectorText && /:active/.test(r.selectorText)).length };
  });
  out.map = { idleDrawsPerSec: idle, geo, walk, lat, mapSwitch, css };
  await ctx.close();
}

// 2. 퀘스트 한 판: 전환 시간, 타자 속도, 소리 횟수, 첫 문항의 보기가 화면 안인지
for (const [w, h] of [[360, 640], [390, 844], [412, 915]]) {
  const { ctx, page } = await open(w, h);
  const r = await page.evaluate(async () => {
    window.__sfx = [];
    const q = QUESTS.filter((x) => qOpen(x) && fits(x) && !x.keys)[0];
    const t0 = performance.now();
    startQuest(q);
    await new Promise((res) => { const iv = setInterval(() => { if (document.getElementById('quest').classList.contains('on')) { clearInterval(iv); res(); } }, 10); });
    const tScreen = performance.now() - t0;
    await new Promise((res) => { const iv = setInterval(() => { if (!document.getElementById('qnext').hidden) { clearInterval(iv); res(); } }, 10); });
    const tIntroTyped = performance.now() - t0;
    return { q: q.id, introChars: q.intro.length, tScreen: Math.round(tScreen), tIntroTyped: Math.round(tIntroTyped) };
  });
  await page.click('#qnext');
  await page.waitForSelector('#qchoices:not([hidden]) .choice');
  await page.waitForTimeout(300);
  const fold = await page.evaluate(() => {
    const vh = innerHeight; const cs = [...document.querySelectorAll('#qchoices .choice')];
    const tip = document.getElementById('qtip');
    return { vh, firstChoiceTop: Math.round(cs[0].getBoundingClientRect().top), lastChoiceBottom: Math.round(cs[cs.length - 1].getBoundingClientRect().bottom), tipShown: tip && !tip.hidden, tipH: tip && !tip.hidden ? Math.round(tip.getBoundingClientRect().height) : 0 };
  });
  fold.choicesVisible = fold.lastChoiceBottom <= fold.vh;
  fold.firstChoiceVisible = fold.firstChoiceTop + 40 <= fold.vh;
  if (w === 360) await page.screenshot({ path: path.join(IMG, 'mk-feel-quest-fold-360.png') });
  // 결과까지 정답으로
  const fin = await page.evaluate(async () => {
    const n = RUN.q.qs.length;
    for (let i = 0; i < n; i++) {
      await new Promise((res) => { const iv = setInterval(() => { if (!document.getElementById('qchoices').hidden && document.querySelector('#qchoices .choice')) { clearInterval(iv); res(); } }, 10); });
      document.querySelector(`#qchoices .choice[data-orig="${RUN.q.qs[RUN.i].ok}"]`).click();
      await new Promise((r) => setTimeout(r, 50));
      document.getElementById('qnext').click();
    }
    await new Promise((r) => setTimeout(r, 100));
    return { onResult: document.getElementById('result').classList.contains('on'), sfx: window.__sfx.map((x) => x[1]) };
  });
  const resFold = await page.evaluate(() => { const b = document.getElementById('rback').getBoundingClientRect(); const a = document.querySelector('#rdbl button'); return { backBottom: Math.round(b.bottom), adBtn: a ? Math.round(a.getBoundingClientRect().top) : null, vh: innerHeight }; });
  out['quest_' + w] = { ...r, fold, fin, resFold };
  await ctx.close();
}

// 3. 오프닝 첫 프레임까지, 메뉴가 뜨는 시간, 프롤로그 SKIP 크기
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(BASE);
  const tDom = Date.now() - t0;
  await page.waitForSelector('#opening canvas');
  const tOpen = Date.now() - t0;
  await page.waitForSelector('.omenu:not([hidden])');
  const tMenu = Date.now() - t0;
  await page.click('.omb.main');
  await page.waitForSelector('#opening.cine .cskip');
  const skip = await page.evaluate(() => { const r = document.querySelector('.cskip').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  const menuBtn = { note: 'menu shown after 1400ms timer' };
  out.opening = { tDomMs: tDom, tCanvasMs: tOpen, tMenuMs: tMenu, skip, menuBtn };
  await ctx.close();
}

// 4. 공유 카드 그림
{
  const { ctx, page } = await open(390, 844);
  const dataUrl = await page.evaluate(() => {
    S.lv = 7; S.tier = 6; S.peak = 6; S.streak = 5; S.stats = { ju: 42, sik: 18, ui: 25, geum: 33, jik: 21 }; save();
    return shareCard().toDataURL('image/png'); });
  fs.writeFileSync(path.join(IMG, 'mk-share-card.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));
  const d2 = await page.evaluate(() => { S = fresh(); S.status = '직장인'; applyStarter(); S.onboarded = true; S.years = 0; S.region = '수도권'; save(); return shareCard().toDataURL('image/png'); });
  fs.writeFileSync(path.join(IMG, 'mk-share-card-new.png'), Buffer.from(d2.split(',')[1], 'base64'));
  await ctx.close();
}

fs.writeFileSync(path.join(root, 'ops/review-1007/tools/mk-feel.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
