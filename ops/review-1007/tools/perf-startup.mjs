// 시작 비용: HTML 파싱, 스크립트 컴파일·실행, 그림 디코드, 첫 화면까지 걸린 시간.
// 실행: node ops/review-1007/tools/perf-startup.mjs  (결과: ops/review-1007/tools/out/startup.json)
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, makeSave, metrics, r1, ROOT } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); fs.mkdirSync(OUT, { recursive: true });
const browser = await launch();
const save = await makeSave(browser);
const runs = [];
const CATS = ['devtools.timeline', 'v8', 'v8.execute', 'disabled-by-default-devtools.timeline', 'blink', 'loading'];

async function one({ throttle, scenario, trace = false, rep = 0 }) {
  const sv = scenario === 'returning' || scenario === 'returning-opening' ? save : null;
  const hash = scenario === 'returning' ? '#nointro' : '';
  const { ctx, page, cdp, errors, url } = await newPage(browser, { throttle, save: sv, hash });
  if (trace) await browser.startTracing(page, { categories: CATS });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  const wallLoad = Date.now() - t0;
  // 첫 화면이 뜬 뒤 메인 스레드가 1초 동안 조용해질 때까지 기다린다
  await page.waitForFunction(() => document.querySelector('.screen.on'), null, { timeout: 60000 });
  await page.waitForTimeout(4000 * Math.max(1, throttle / 2));
  const r = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const P = window.__perf; const long = P.long;
    const dcl = n.domContentLoadedEventEnd;
    // TTI 근사: DCL 이후 마지막 긴 작업이 끝난 시각(그 뒤로 조용한 구간이 있다)
    let tti = dcl; for (const [s, d] of long) if (s + d > tti && s < dcl + 15000) tti = s + d;
    return {
      responseEnd: n.responseEnd, domInteractive: n.domInteractive, dcl, load: n.loadEventEnd, tti,
      longTasks: long.length, longSum: long.reduce((a, x) => a + x[1], 0), longTop: [...long].sort((a, b) => b[1] - a[1]).slice(0, 5),
      castLeft: typeof CASTLEFT !== 'undefined' ? CASTLEFT : null, screen: document.querySelector('.screen.on').id,
      opening: !!document.getElementById('opening'), lsWrites: P.ls.n, lsBytes: P.ls.bytes,
      heap: performance.memory ? performance.memory.usedJSHeapSize : null,
    };
  });
  const m = await metrics(cdp);
  const dom = await cdp.send('Memory.getDOMCounters').catch(() => ({}));
  let tr = null;
  if (trace) {
    const buf = await browser.stopTracing();
    const ev = JSON.parse(buf.toString()).traceEvents;
    const sum = {}; const evalByLine = {};
    for (const e of ev) {
      if (e.ph !== 'X' || !e.dur) continue;
      const k = e.name; sum[k] = (sum[k] || 0) + e.dur / 1000;
      if (k === 'EvaluateScript' || k === 'v8.compile' || k === 'v8.parseOnBackground' || k === 'v8.compileModule') {
        const ln = (e.args && e.args.data && (e.args.data.lineNumber ?? e.args.data.startLine)) ?? '?';
        evalByLine[k + '@' + ln] = (evalByLine[k + '@' + ln] || 0) + e.dur / 1000;
      }
    }
    const pick = ['ParseHTML', 'EvaluateScript', 'v8.compile', 'v8.parseOnBackground', 'V8.ScriptCompiler', 'v8.run', 'FunctionCall', 'TimerFire',
      'Decode Image', 'ImageDecodeTask', 'Decode LazyPixelRef', 'Layout', 'UpdateLayoutTree', 'Paint', 'MinorGC', 'MajorGC', 'V8.GC_SCAVENGER', 'V8.GC_MARK_COMPACTOR',
      'FireAnimationFrame', 'ParseAuthorStyleSheet', 'ResourceReceivedData', 'CommitLoad'];
    tr = {}; for (const k of pick) if (sum[k]) tr[k] = r1(sum[k]);
    tr.byScript = Object.fromEntries(Object.entries(evalByLine).map(([k, v]) => [k, r1(v)]));
  }
  await ctx.close();
  const row = { scenario, throttle, rep, wallLoad, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? r1(v) : v])),
    ScriptDuration: r1(m.ScriptDuration * 1000), TaskDuration: r1(m.TaskDuration * 1000), LayoutDuration: r1(m.LayoutDuration * 1000),
    JSHeapUsedMB: r1(m.JSHeapUsedSize / 1048576), nodes: dom.nodes, jsListeners: dom.jsEventListeners, trace: tr, errors };
  console.log(JSON.stringify({ scenario, throttle, dcl: row.dcl, tti: row.tti, longSum: row.longSum, heapMB: row.JSHeapUsedMB, trace: tr && { ParseHTML: tr.ParseHTML, EvaluateScript: tr.EvaluateScript, compile: tr['v8.compile'], decode: tr['Decode Image'] || tr['ImageDecodeTask'] } }));
  runs.push(row); return row;
}

// 그림 전부 디코드 비용: CAST 전체를 새 Image로 만들어 decode() + 캔버스로 옮긴다(castCv와 같은 일)
async function decodeAll(throttle) {
  const { ctx, page, url } = await newPage(browser, { throttle, save, hash: '#nointro' });
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(async () => {
    const keys = Object.keys(CAST); let px = 0, b64 = 0, art = 0, artPx = 0; const per = [];
    const a = performance.now();
    for (const k of keys) {
      const c = CAST[k]; b64 += c.d.length; const im = new Image(); im.src = 'data:' + (c.m || 'image/png') + ';base64,' + c.d;
      const s = performance.now(); await im.decode();
      const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      cv.getContext('2d', { willReadFrequently: true }).drawImage(im, 0, 0);
      const d = performance.now() - s; px += im.naturalWidth * im.naturalHeight;
      if (c.hi) { art++; artPx += im.naturalWidth * im.naturalHeight; }
      per.push([k, im.naturalWidth + 'x' + im.naturalHeight, Math.round(d * 10) / 10]);
    }
    const total = performance.now() - a;
    // 이미 게임이 만든 castCv 캐시(PCACHE C*)
    const pc = Object.keys(PCACHE).filter((k) => k[0] === 'C');
    let pcpx = 0; pc.forEach((k) => { pcpx += PCACHE[k].width * PCACHE[k].height; });
    per.sort((x, y) => y[2] - x[2]);
    return { n: keys.length, art, totalMs: Math.round(total), decodedMB: +(px * 4 / 1048576).toFixed(1), artMB: +(artPx * 4 / 1048576).toFixed(1),
      base64MB: +(b64 / 1048576).toFixed(2), top: per.slice(0, 8), castCvCachedAtBoot: pc.length, castCvCachedMB: +(pcpx * 4 / 1048576).toFixed(1) };
  });
  // castCv 를 전부 부르는 데 드는 시간(게임 코드 그대로)
  const r2 = await page.evaluate(() => { Object.keys(PCACHE).forEach((k) => { if (k[0] === 'C') delete PCACHE[k]; });
    const a = performance.now(); let n = 0; Object.keys(CAST).forEach((k) => { if (castCv(k)) n++; }); return { n, ms: Math.round(performance.now() - a) }; });
  await ctx.close();
  console.log('decodeAll', throttle, JSON.stringify({ ...r, castCvAll: r2 }));
  return { throttle, ...r, castCvAll: r2 };
}

const decode = [];
for (const th of [1, 4, 6]) {
  await one({ throttle: th, scenario: 'returning', trace: true });
  await one({ throttle: th, scenario: 'returning', rep: 1 });
  await one({ throttle: th, scenario: 'first-opening', trace: true });
  await one({ throttle: th, scenario: 'returning-opening' });
  decode.push(await decodeAll(th));
}
fs.writeFileSync(path.join(OUT, 'startup.json'), JSON.stringify({ runs, decode }, null, 1));
await browser.close();
