// 시작 실험: 그림 데이터(ART)를 HTML에서 빼면 시작이 얼마나 빨라지는지.
// 원본은 건드리지 않고 tools/out/tmp/ 에 사본을 만들어 비교한 뒤 지운다.
// 실행: node ops/review-1007/tools/perf-startup-exp.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { launch, makeSave, metrics, r1, ROOT, HTML, INSTRUMENT } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); const TMP = path.join(OUT, 'tmp'); fs.mkdirSync(TMP, { recursive: true });
const src = fs.readFileSync(HTML, 'utf8');
const a = src.indexOf('/* ART_DATA_BEGIN */'), b = src.indexOf('/* ART_DATA_END */');
const noArt = src.slice(0, a) + '/* ART_DATA_BEGIN */\nvar ART={};\n' + src.slice(b);
// 그림은 그대로 두되 부팅 때 Image 149개를 만들지 않는 사본(지연 로딩 근사)
const lazy = src.replace("Object.keys(CAST).forEach(function(k){\n  var im=new Image(); CASTLEFT++;", "Object.keys(CAST).slice(0,0).forEach(function(k){\n  var im=new Image(); CASTLEFT++;");
const files = { original: HTML, noArt: path.join(TMP, 'noart.html'), lazyImg: path.join(TMP, 'lazy.html') };
fs.writeFileSync(files.noArt, noArt); fs.writeFileSync(files.lazyImg, lazy);
console.log('sizes KB', Object.fromEntries(Object.entries(files).map(([k, f]) => [k, Math.round(fs.statSync(f).size / 1024)])), 'lazy patched', lazy !== src);

const browser = await launch();
const save = await makeSave(browser);
const rows = [];
for (const th of [4, 6]) for (const [name, f] of Object.entries(files)) {
  const vals = [];
  for (let rep = 0; rep < 3; rep++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
    const page = await ctx.newPage();
    await page.addInitScript((sv) => { try { localStorage.setItem('nq_demo', '0'); if (!sessionStorage.getItem('s')) { localStorage.setItem('nq.v8', sv); sessionStorage.setItem('s', 1); } } catch (e) {} }, save);
    await page.addInitScript(INSTRUMENT);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: th });
    await page.goto(url.pathToFileURL(f).href + '#nointro', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: n.domContentLoadedEventEnd, longSum: window.__perf.long.reduce((a, x) => a + x[1], 0) }; });
    const m = await metrics(cdp);
    vals.push({ dcl: r.dcl, longSum: r.longSum, heapMB: m.JSHeapUsedSize / 1048576 });
    await ctx.close();
  }
  const med = (k) => { const s = vals.map((v) => v[k]).sort((x, y) => x - y); return r1(s[1]); };
  const row = { throttle: th, variant: name, dclMed: med('dcl'), longSumMed: med('longSum'), heapMB: med('heapMB') };
  rows.push(row); console.log(JSON.stringify(row));
}
fs.writeFileSync(path.join(OUT, 'startup-exp.json'), JSON.stringify(rows, null, 1));
fs.rmSync(TMP, { recursive: true, force: true });
await browser.close();
