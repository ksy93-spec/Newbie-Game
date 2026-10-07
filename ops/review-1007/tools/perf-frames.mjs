// 프레임 비용: 홈 지도 대기·걷기, 컷신, 오프닝, 운전 로딩. CPU 4배·6배 감속.
// 실행: node ops/review-1007/tools/perf-frames.mjs  (결과: ops/review-1007/tools/out/frames.json)
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, makeSave, metrics, pct, r1, ROOT, WRAP } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); fs.mkdirSync(OUT, { recursive: true });
const browser = await launch();
const save = await makeSave(browser);
const rows = [];
const FNS = ['drawScene', 'drawMini', 'save', 'fitScene', 'guideSync', 'personTopCv', 'heroTop', 'castCv', 'renderChar', 'renderShop', 'renderWiki', 'renderQuests', 'renderHome', 'hudRefresh'];

async function phase(page, cdp, name, ms, act) {
  await page.evaluate(() => { const P = window.__perf; P.long.length = 0; P.ls.n = 0; P.ls.bytes = 0; P.ls.ms = 0; P.raf.n = 0;
    for (const k in P.fn || {}) Object.assign(P.fn[k], { n: 0, ms: 0, max: 0, list: [] }); P.startFrames(); });
  const m0 = await metrics(cdp); const t0 = Date.now();
  if (act) await act(); else await page.waitForTimeout(ms);
  const wall = Date.now() - t0; const m1 = await metrics(cdp);
  const r = await page.evaluate(() => { const P = window.__perf; const fr = P.stopFrames();
    const fn = {}; for (const k in P.fn || {}) { const f = P.fn[k]; if (!f.n) continue; const s = [...f.list].sort((a, b) => a - b);
      fn[k] = { n: f.n, avg: Math.round(f.ms / f.n * 100) / 100, p95: Math.round(s[Math.floor(s.length * 0.95)] * 100) / 100, max: Math.round(f.max * 10) / 10, totalMs: Math.round(f.ms) }; }
    return { frames: fr, long: P.long.slice(), ls: { n: P.ls.n, kb: Math.round(P.ls.bytes / 2048), ms: Math.round((P.ls.ms || 0) * 10) / 10 }, raf: P.raf.n, fn }; });
  const fr = r.frames;
  const row = { name, wallMs: wall,
    cpuBusyPct: r1((m1.TaskDuration - m0.TaskDuration) * 1000 / wall * 100),
    scriptMs: r1((m1.ScriptDuration - m0.ScriptDuration) * 1000), layoutMs: r1((m1.LayoutDuration - m0.LayoutDuration) * 1000), styleMs: r1((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000),
    frames: fr.length, fps: r1(fr.length / (wall / 1000)), frameP50: r1(pct(fr, 50)), frameP95: r1(pct(fr, 95)), frameMax: r1(Math.max(0, ...fr)),
    over33: fr.filter((x) => x > 33.4).length, over50: fr.filter((x) => x > 50).length,
    longN: r.long.length, longSum: r.long.reduce((a, x) => a + x[1], 0), longMax: Math.max(0, ...r.long.map((x) => x[1])),
    gameRafPerSec: r1(r.raf / (wall / 1000)), lsWrites: r.ls.n, lsWritesPerSec: r1(r.ls.n / (wall / 1000)), lsKB: r.ls.kb, lsMs: r.ls.ms, fn: r.fn };
  return row;
}

async function homeRun(dev, throttle) {
  const { ctx, page, cdp, errors, url } = await newPage(browser, { dev, throttle, save, hash: '#nointro' });
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => document.querySelector('#home.on'), null, { timeout: 60000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { try { TUT && endTalk(); } catch (e) {} document.querySelectorAll('#htravel').forEach((e) => (e.hidden = true)); });
  await page.evaluate(WRAP, FNS);
  const info = await page.evaluate(() => { const cv = document.getElementById('scene'); return { canvas: cv.width + 'x' + cv.height, RES, SH, map: ME.map }; });
  const out = { dev, throttle, info, phases: [] };
  out.phases.push(await phase(page, cdp, 'home-idle', 12000));
  // 키를 누르고 있는 걷기(한 칸마다 savePos)
  out.phases.push(await phase(page, cdp, 'home-walk-hold', 0, async () => {
    for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowLeft']) {
      await page.keyboard.down(k); await page.waitForTimeout(2000); await page.keyboard.up(k); }
  }));
  // 눌러서 멀리 걷기(goTo 경로)
  out.phases.push(await phase(page, cdp, 'home-walk-tap', 0, async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 12000) {
      await page.evaluate(() => { if (MOVE || TUT) return; const m = curMap(); for (let i = 0; i < 60; i++) {
        const x = 1 + Math.floor(Math.random() * (m.w - 2)), y = 1 + Math.floor(Math.random() * (m.h - 2));
        if ((Math.abs(x - ME.tx) + Math.abs(y - ME.ty)) > 6 && walkable(m, x, y) && pathTo(m, x, y)) { goTo(x, y, null); return; } } });
      await page.waitForTimeout(300);
    }
  }));
  // 방(펫이 돌아다님)
  await page.evaluate(() => { const r = roomMap(); if (r) enterMap('room', r.spawn.x, r.spawn.y); });
  out.phases.push(await phase(page, cdp, 'room-idle-pet', 8000));
  // 드로우 비용 쪼개기: 같은 장면을 50번 그려서 평균
  out.breakdown = await page.evaluate(() => {
    enterMap('town', 6, 6);
    const N = 40; const t = (f) => { const a = performance.now(); for (let i = 0; i < N; i++) f(); return Math.round((performance.now() - a) / N * 100) / 100; };
    const r = { full: t(drawScene) };
    const dt = window.drawTile; window.drawTile = function () {}; r.noTiles = t(drawScene); window.drawTile = dt;
    const dm = window.drawMini; window.drawMini = function () {}; r.noMini = t(drawScene); window.drawMini = dm;
    r.miniOnly = t(drawMini);
    const gs = window.guideSync; window.guideSync = function () {}; r.noGuideSync = t(drawScene); window.guideSync = gs;
    r.guideSyncOnly = t(guideSync);
    r.fitScene = t(fitScene);
    return r; });
  // 컷신(메인 퀘스트 1장). 대사가 다 찍힌 뒤 멈춘 화면
  await page.evaluate(() => { enterMap('town', 6, 6); render('home'); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { S.mq.done = {}; mqStart('job'); });
  await page.waitForFunction(() => !!window.MQP, null, { timeout: 10000 });
  await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(600);
  await page.evaluate(() => MQP.next({ type: 'test' }));
  out.cineInfo = await page.evaluate(() => { const c = document.querySelector('#opening canvas'); return c ? c.width + 'x' + c.height : null; });
  out.phases.push(await phase(page, cdp, 'cutscene-mq', 8000));
  await page.evaluate(() => { try { MQP.skip(); } catch (e) {} });
  await page.waitForTimeout(500);
  await page.evaluate(() => { const st = window.MQP; if (st) { for (let i = 0; i < 40 && window.MQP; i++) { try { if (MQP.picked === null) MQP.pick(0); MQP.next({ type: 'test' }); MQP.skip(); } catch (e) {} } } });
  await page.waitForTimeout(1500);
  // 운전 로딩(2.2초)
  await page.evaluate(() => { if (document.getElementById('opening')) document.getElementById('opening').remove(); window.MQP = null; render('home'); });
  await page.waitForTimeout(500);
  out.phases.push(await phase(page, cdp, 'drive-loading', 0, async () => {
    await page.evaluate(() => { S.equip.mount = 'car'; driveLoading('동네', '회사', () => {}); }); await page.waitForTimeout(2600); }));
  // 프롤로그 컷신(그림 대신 도트 인물을 매 프레임 personTopCv로 그린다)
  await page.evaluate(() => { const o = document.getElementById('opening'); if (o) o.remove(); playCinema(PROLOGUE, () => {}); });
  await page.waitForTimeout(500);
  out.phases.push(await phase(page, cdp, 'cutscene-prologue', 6000));
  out.errors = errors;
  await ctx.close();
  return out;
}

async function openingRun(dev, throttle) {
  const { ctx, page, cdp, url } = await newPage(browser, { dev, throttle, save: null, hash: '' });
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(2500);
  await page.evaluate(WRAP, FNS.concat(['personTopCv']));
  const info = await page.evaluate(() => { const c = document.querySelector('#opening canvas'); return c ? c.width + 'x' + c.height : null; });
  const p = await phase(page, cdp, 'opening-title', 8000);
  await ctx.close();
  return { dev, throttle, info, phases: [p] };
}

for (const th of [4, 6]) {
  for (const dev of ['s360', 's390']) {
    const h = await homeRun(dev, th); rows.push(h);
    console.log(dev, th, JSON.stringify(h.info), h.cineInfo, JSON.stringify(h.breakdown));
    for (const p of h.phases) console.log('  ', p.name, 'busy%', p.cpuBusyPct, 'fps', p.fps, 'p50', p.frameP50, 'p95', p.frameP95, 'max', p.frameMax, '>33', p.over33, 'long', p.longN, p.longSum, p.longMax, 'ls/s', p.lsWritesPerSec, p.lsKB + 'KB', 'drawScene', JSON.stringify(p.fn.drawScene || {}), 'save', JSON.stringify(p.fn.save || {}));
    const o = await openingRun(dev, th); rows.push(o);
    for (const p of o.phases) console.log('  ', p.name, o.info, 'busy%', p.cpuBusyPct, 'fps', p.fps, 'p50', p.frameP50, 'p95', p.frameP95, '>33', p.over33, 'long', p.longN, p.longSum, 'personTopCv', JSON.stringify(p.fn.personTopCv || {}), 'drawScene', JSON.stringify(p.fn.drawScene || {}));
  }
}
fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify(rows, null, 1));
await browser.close();
