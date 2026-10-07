// 성능 측정 공통 도구 (리뷰 1007, 개발 역할). 게임 파일은 고치지 않고 페이지에 계측만 덧붙인다.
// 사용: 다른 perf-*.mjs 스크립트가 import 한다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../../..');
export const HTML = path.join(ROOT, 'prototype/newbie-quest-demo.html');
export const BASE = url.pathToFileURL(HTML).href;

export const DEVICES = {
  s360: { width: 360, height: 640, dpr: 2 },
  s390: { width: 390, height: 844, dpr: 3 },
  s412: { width: 412, height: 915, dpr: 2.625 },
};

export async function launch() {
  return chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
}

// 페이지가 뜨기 전에 심는 계측: 긴 작업, localStorage 쓰기, 타이머, 리스너, rAF
export const INSTRUMENT = () => {
  const W = window;
  const M = (W.__perf = {
    t0: performance.now(), long: [], ls: { n: 0, bytes: 0, byKey: {}, last: 0, times: [] },
    timers: { intervalsLive: 0, intervalsMade: 0, timeoutsMade: 0, live: new Set() },
    listeners: { add: 0, remove: 0, byType: {}, window: 0, document: 0 },
    raf: { n: 0 }, frames: [], recFrames: false,
  });
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) M.long.push([Math.round(e.startTime), Math.round(e.duration)]); })
      .observe({ type: 'longtask', buffered: true });
  } catch (e) {}
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    const s = String(v); M.ls.n++; M.ls.bytes += s.length * 2; M.ls.last = s.length;
    M.ls.byKey[k] = (M.ls.byKey[k] || 0) + 1; M.ls.times.push(Math.round(performance.now()));
    if (M.ls.times.length > 5000) M.ls.times.shift();
    const a = performance.now(); const r = setItem.call(this, k, v);
    M.ls.ms = (M.ls.ms || 0) + (performance.now() - a); return r;
  };
  const si = W.setInterval, ci = W.clearInterval, st = W.setTimeout;
  W.setInterval = function (f, ms, ...a) { const id = si.call(W, f, ms, ...a); M.timers.intervalsMade++; M.timers.live.add(id); return id; };
  W.clearInterval = function (id) { M.timers.live.delete(id); return ci.call(W, id); };
  W.setTimeout = function (...a) { M.timers.timeoutsMade++; return st.apply(W, a); };
  const ael = EventTarget.prototype.addEventListener, rel = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (t, ...a) {
    M.listeners.add++; M.listeners.byType[t] = (M.listeners.byType[t] || 0) + 1;
    if (this === W) M.listeners.window++; else if (this === document) M.listeners.document++;
    return ael.call(this, t, ...a);
  };
  EventTarget.prototype.removeEventListener = function (t, ...a) {
    M.listeners.remove++; if (this === W) M.listeners.window--; else if (this === document) M.listeners.document--;
    return rel.call(this, t, ...a);
  };
  const raf = W.requestAnimationFrame;
  W.requestAnimationFrame = function (cb) { M.raf.n++; return raf.call(W, cb); };
  // 프레임 간격 기록용 독립 rAF 루프(측정 중에만 돈다)
  M.startFrames = () => { M.frames = []; M.recFrames = true; let last = performance.now();
    const loop = (t) => { if (!M.recFrames) return; M.frames.push(t - last); last = t; raf.call(W, loop); }; raf.call(W, loop); };
  M.stopFrames = () => { M.recFrames = false; return M.frames.slice(1); };
};

// 함수 실행 시간을 감싼다(전역 함수 선언은 window 속성이라 덮어쓸 수 있다)
export const WRAP = (names) => {
  const P = window.__perf; P.fn = P.fn || {};
  for (const n of names) {
    const f = window[n]; if (typeof f !== 'function' || f.__w) continue;
    const rec = (P.fn[n] = { n: 0, ms: 0, max: 0, list: [] });
    const g = function () { const a = performance.now(); try { return f.apply(this, arguments); } finally {
      const d = performance.now() - a; rec.n++; rec.ms += d; if (d > rec.max) rec.max = d; if (rec.list.length < 20000) rec.list.push(d); } };
    g.__w = 1; window[n] = g;
  }
};

export const CACHE_STATS = () => {
  const names = ['TOPC', 'CVCACHE', 'LCACHE', 'PCACHE', 'OPAQ', 'NPCCACHE', 'BCACHE', 'CCACHE', 'RCACHE', 'HCACHE', 'INKC', 'ROOMC'];
  const out = {};
  for (const n of names) {
    let o; try { o = eval(n); } catch (e) { continue; }
    if (!o || typeof o !== 'object') continue;
    let px = 0, cv = 0; const ks = Object.keys(o);
    for (const k of ks) { const v = o[k]; if (v && v.width && v.height && v.getContext) { cv++; px += v.width * v.height; } }
    out[n] = { keys: ks.length, canvases: cv, MB: +(px * 4 / 1048576).toFixed(2) };
  }
  return out;
};

export async function newPage(browser, { dev = 's360', throttle = 1, save = null, hash = '#nointro', instrument = true } = {}) {
  const d = DEVICES[dev];
  const ctx = await browser.newContext({ viewport: { width: d.width, height: d.height }, deviceScaleFactor: d.dpr, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript((sv) => {
    try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {}
    if (sv) try { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('nq.v8', sv); sessionStorage.setItem('__seeded', '1'); } } catch (e) {}
  }, save);
  if (instrument) await page.addInitScript(INSTRUMENT);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  return { ctx, page, cdp, errors, url: BASE + (hash || '') };
}

// 돌아온 사용자(직장인, 레벨·장비·세간이 조금 있는) 저장을 만든다
export async function makeSave(browser) {
  const { ctx, page, url: u } = await newPage(browser, { instrument: false });
  await page.goto(u);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  const sv = await page.evaluate(() => {
    S = fresh(); S.status = '직장인'; applyStarter();
    Object.assign(S, { years: 2, living: '자취', region: '수도권', age: 27, company: '중소기업' });
    S.onboarded = true; S.tut = 1; S.tuts = ['intro', 'walk', 'talk', 'map']; S.lv = 6; S.coin = 9000; S.tier = 6; S.peak = 6; S.lastTier = 6;
    S.stats = { ju: 40, sik: 30, ui: 25, geum: 30, jik: 35 };
    S.done = QUESTS.slice(0, 25).map((q) => q.id);
    S.owned = Object.keys(ITEMS).concat(Object.keys(PETS), Object.keys(MOUNTS)).filter((id) => id !== 'bosssuit');
    S.equip.pet = Object.keys(PETS).find((k) => PETS[k].kind) || 'pnone';
    S.todayQ = pickDaily(); for (let i = 0; i < 200; i++) ev('pad', { i });
    save(); return localStorage.getItem('nq.v8');
  });
  await ctx.close();
  return sv;
}

export const pct = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; };
export const r1 = (x) => Math.round(x * 10) / 10;
export async function metrics(cdp) { const m = (await cdp.send('Performance.getMetrics')).metrics; const o = {}; for (const x of m) o[x.name] = x.value; return o; }
