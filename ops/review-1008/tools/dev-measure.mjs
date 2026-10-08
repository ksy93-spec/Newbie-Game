// 리뷰 1008 개발: 스탯 공급 합계, 걷기 그리기 횟수, 타일 캐시·로고 캐시·CAST Image 실험. 게임 파일은 고치지 않는다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import fs from 'node:fs';
import { launch, newPage, makeSave } from '../../review-1007/tools/perf-lib.mjs';
const TH = +(process.argv[2] || 4), DEV = process.argv[3] || 's390';
const browser = await launch();
const out = { throttle: TH, dev: DEV };
const sv = await makeSave(browser);

// A. 스탯 공급 (감속 없이)
{ const { page, ctx, url } = await newPage(browser, { instrument: false });
  await page.goto(url); await page.waitForFunction(() => window.S && window.QUESTS);
  out.econ = await page.evaluate(() => {
    const T = ['ju','sik','ui','geum','jik'], z = () => Object.fromEntries(T.map(k => [k, 0]));
    const q = z(); let qxp = 0; QUESTS.forEach(x => { Object.keys(x.stat || {}).forEach(k => q[k] += x.stat[k]); qxp += x.xp || 0; });
    const ep = z(); EPISODES.forEach(e => { ep[e.stat] += Math.max(...e.ends.map(n => n.stat)); });
    const boss = z(); BOSSES.forEach(b => boss[b.stat] += 15);
    const mq = z(); Object.values(MQ_REWARD).forEach(r => Object.keys(r.stat || {}).forEach(k => mq[k] += Math.round(r.stat[k] * MQ_GRADE.S || r.stat[k])));
    const lease = Math.max(...LEASE_ENDS.map(n => n.stat));
    let lv = 1, xp = qxp; while (xp >= need(lv)) { xp -= need(lv); lv++; }
    return { nQuest: QUESTS.length, quest: q, ep, boss, mq, leaseJu: lease, questXp: qxp, lvFromQuestXpOnly: lv,
      tiersNeed: TIERS.map(t => t.need), bossNeed: BOSSES.map(b => [b.id, b.stat, b.need]), grades: MQ_GRADE, nCast: Object.keys(CAST).length,
      castB64MB: Object.values(CAST).reduce((a, c) => a + (c.d || '').length, 0) / 1e6 };
  });
  await ctx.close(); }

// B. 걷기: 누르고 있는 3초 동안 drawScene 횟수와 시간, 그중 타일 몫
{ const { page, ctx, cdp, url } = await newPage(browser, { dev: DEV, throttle: 1, save: sv, instrument: false });
  await page.goto(url); await page.waitForFunction(() => document.querySelector('#home.on'), null, { timeout: 60000 });
  await page.evaluate(() => { enterMap('town', 2, 6); render('home'); });
  await page.waitForTimeout(800);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: TH });
  await page.evaluate(() => { const o = drawScene, ot = drawTile; window.__d = { n: 0, ms: 0, tile: 0, inDraw: 0 };
    window.drawScene = function () { const t = performance.now(); __d.inDraw = 1; const r = o.apply(this, arguments); __d.inDraw = 0; __d.n++; __d.ms += performance.now() - t; return r; };
    window.drawTile = function () { const t = performance.now(); const r = ot.apply(this, arguments); if (__d.inDraw) __d.tile += performance.now() - t; return r; }; });
  await page.evaluate(() => { __d.n = 0; __d.ms = 0; __d.tile = 0; });
  await page.evaluate(() => { const m = curMap(); let best = null; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const d = Math.abs(x - ME.tx) + Math.abs(y - ME.ty); if (d > 14 && walkable(m, x, y)) { const p = pathTo(m, x, y); if (p && (!best || p.length > best.len)) best = { x, y, len: p.length }; } } window.__goal = best; if (best) goTo(best.x, best.y, null); });
  await page.waitForTimeout(3000);
  out.walk = await page.evaluate(() => ({ drawsPerSec: __d.n / 3, msPerDraw: __d.ms / Math.max(1, __d.n), tileShare: __d.tile / Math.max(1e-9, __d.ms), RES, SW, SH, pos: [ME.map, ME.tx, ME.ty], goal: window.__goal, moving: !!MOVE }));
  await page.evaluate(() => { __d.n = 0; __d.ms = 0; }); await page.waitForTimeout(3000);
  out.idle = await page.evaluate(() => ({ drawsPerSec: __d.n / 3, msPerDraw: __d.ms / Math.max(1, __d.n) }));
  // C. 타일 캐시 실험: 보이는 칸을 칠하는 것 vs 미리 칠한 지도 한 장을 drawImage
  out.tileCache = await page.evaluate(() => {
    const m = curMap(), cv = document.getElementById('scene'), c = cv.getContext('2d'), cam = camOf(m);
    const t0 = performance.now(); const big = document.createElement('canvas'); big.width = m.w * TS; big.height = m.h * TS;
    const bx = big.getContext('2d'); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) drawTile(bx, m, tileAt(m, x, y), x * TS, y * TS, x, y);
    const build = performance.now() - t0;
    const N = 30; let a = performance.now();
    for (let i = 0; i < N; i++) { c.setTransform(RES, 0, 0, RES, 0, 0); c.save(); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
      const x0 = Math.max(0, Math.floor(cam.x / TS)), x1 = Math.min(m.w - 1, Math.ceil((cam.x + SW / cam.z) / TS)), y0 = Math.max(0, Math.floor(cam.y / TS)), y1 = Math.min(m.h - 1, Math.ceil((cam.y + SH / cam.z) / TS));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) drawTile(c, m, tileAt(m, x, y), x * TS, y * TS, x, y); c.restore(); }
    c.getImageData(0, 0, 1, 1); const loop = (performance.now() - a) / N;
    a = performance.now();
    for (let i = 0; i < N; i++) { c.setTransform(RES, 0, 0, RES, 0, 0); c.save(); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y); c.drawImage(big, 0, 0); c.restore(); }
    c.getImageData(0, 0, 1, 1); const img = (performance.now() - a) / N;
    return { map: ME.map, w: m.w, h: m.h, buildMs: build, loopMs: loop, cachedMs: img, water: m.rows.join('').split('w').length - 1 };
  });
  // D. 오프닝 로고: 지금 방식(fillText 70번) vs 캐시 drawImage
  out.logo = await page.evaluate(() => {
    const W = 160, H = 346, R = cineRes(W, H), cv = document.createElement('canvas'); cv.width = W * R; cv.height = H * R; const ctx = cv.getContext('2d');
    function logo(c, y) { c.font = 'bold 26px Galmuri14,Galmuri11,monospace'; c.textBaseline = 'top'; const s = '뉴비 퀘스트', w = c.measureText(s).width, x = Math.round(W / 2 - w / 2);
      c.fillStyle = '#1B1826'; for (let d = -3; d <= 3; d++) for (let e = -2; e <= 3; e++) c.fillText(s, x + d, y + e);
      c.fillStyle = '#F4705A'; for (let d = -2; d <= 2; d++) for (let e = -1; e <= 2; e++) c.fillText(s, x + d, y + e);
      c.save(); c.beginPath(); c.rect(0, y, W, 14); c.clip(); c.fillStyle = '#FFE79B'; c.fillText(s, x, y); c.fillText(s, x + 1, y); c.restore();
      c.save(); c.beginPath(); c.rect(0, y + 14, W, 20); c.clip(); c.fillStyle = '#FFC53C'; c.fillText(s, x, y); c.fillText(s, x + 1, y); c.restore(); }
    const N = 20; ctx.setTransform(R, 0, 0, R, 0, 0); let a = performance.now(); for (let i = 0; i < N; i++) logo(ctx, 60); ctx.getImageData(0, 0, 1, 1); const live = (performance.now() - a) / N;
    a = performance.now(); const lc = document.createElement('canvas'); lc.width = W * R; lc.height = 40 * R; const lx = lc.getContext('2d'); lx.setTransform(R, 0, 0, R, 0, 0); logo(lx, 3); const build = performance.now() - a;
    a = performance.now(); for (let i = 0; i < N; i++) ctx.drawImage(lc, 0, 57, W, 40); ctx.getImageData(0, 0, 1, 1); const cached = (performance.now() - a) / N;
    return { R, liveMs: live, buildMs: build, cachedMs: cached };
  });
  // E. 부팅 때 Image 149개 만드는 비용(같은 일을 한 번 더 해 본다)
  out.castImg = await page.evaluate(() => { const a = performance.now(); const keep = []; Object.keys(CAST).forEach(k => { const im = new Image(); im.src = 'data:' + (CAST[k].m || 'image/png') + ';base64,' + CAST[k].d; keep.push(im); }); return { n: keep.length, ms: performance.now() - a }; });
  await ctx.close(); }
await browser.close();
fs.writeFileSync(new URL('./out/dev-measure-' + DEV + '-' + TH + '.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
