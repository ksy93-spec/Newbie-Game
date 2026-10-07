// 10분 플레이: 메모리, 캐시 크기, 타이머·리스너 수, localStorage 쓰기를 30초마다 기록한다.
// 실행: node ops/review-1007/tools/perf-soak.mjs [초=600] [감속=4] [기기=s390]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { launch, newPage, makeSave, metrics, r1, ROOT, CACHE_STATS } from './perf-lib.mjs';

const OUT = path.join(ROOT, 'ops/review-1007/tools/out'); fs.mkdirSync(OUT, { recursive: true });
const SECS = +(process.argv[2] || 600), throttle = +(process.argv[3] || 4), dev = process.argv[4] || 's390';
const browser = await launch();
const save = await makeSave(browser);
const { ctx, page, cdp, errors, url } = await newPage(browser, { dev, throttle, save, hash: '#nointro' });
await page.goto(url, { waitUntil: 'load', timeout: 180000 });
await page.waitForTimeout(3000);
await cdp.send('HeapProfiler.enable');

function rssMB() { // 크롬 프로세스들의 RSS 합(렌더러·GPU 따로)
  try { const out = execSync('ps -eo rss,args', { encoding: 'utf8' }); let ren = 0, gpu = 0, all = 0;
    for (const ln of out.split('\n')) { if (!/chrom|headless_shell/.test(ln)) continue; const kb = parseInt(ln.trim(), 10) || 0; all += kb;
      if (/--type=renderer/.test(ln)) ren += kb; else if (/--type=gpu-process/.test(ln)) gpu += kb; }
    return { rendererMB: Math.round(ren / 1024), gpuMB: Math.round(gpu / 1024), allMB: Math.round(all / 1024) }; } catch (e) { return {}; } }
async function detachedCanvases() {
  const chunks = []; const h = (e) => chunks.push(e.chunk); cdp.on('HeapProfiler.addHeapSnapshotChunk', h);
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false }); cdp.off('HeapProfiler.addHeapSnapshotChunk', h);
  const snap = JSON.parse(chunks.join('')); const f = snap.snapshot.meta.node_fields, n = f.length, ni = f.indexOf('name'), di = f.indexOf('detachedness');
  const strs = snap.strings, nodes = snap.nodes; let det = 0, all = 0, big = 0, detPx = 0; const detBig = []; const names = {};
  for (let i = 0; i < nodes.length; i += n) { const nm = strs[nodes[i + ni]]; if (!/canvas/i.test(nm) || nm.length > 60) continue; names[nm] = (names[nm] || 0) + 1;
    if (!/^(Detached )?<canvas/.test(nm)) continue; all++;
    const m = /width="(\d+)" height="(\d+)"/.exec(nm); const px = m ? (+m[1]) * (+m[2]) : 0; big += px;
    if ((di >= 0 && nodes[i + di] === 2) || /Detached/.test(nm)) { det++; detPx += px; if (px > 500000) detBig.push(m[1] + 'x' + m[2]); } }
  return { canvasesInHeap: all, canvasMB: Math.round(big * 4 / 1048576), detached: det, detachedMB: Math.round(detPx * 4 / 1048576), detachedBig: detBig, names: Object.fromEntries(Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 8)) }; }
async function sample(label, t) {
  await cdp.send('HeapProfiler.collectGarbage');
  const m = await metrics(cdp);
  const dom = await cdp.send('Memory.getDOMCounters');
  const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
  const wl = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
  const { result: dres } = await cdp.send('Runtime.evaluate', { expression: 'document' });
  const dl = await cdp.send('DOMDebugger.getEventListeners', { objectId: dres.objectId });
  const byType = {}; wl.listeners.forEach((l) => { byType[l.type] = (byType[l.type] || 0) + 1; });
  const dByType = {}; dl.listeners.forEach((l) => { dByType[l.type] = (dByType[l.type] || 0) + 1; });
  const g = await page.evaluate(`(function(){ var CACHE_STATS=${CACHE_STATS.toString()}; var P=window.__perf;
    var raw=localStorage.getItem('nq.v8')||'';
    var cv=document.querySelectorAll('canvas').length;
    return { caches: CACHE_STATS(), intervalsLive: P.timers.live.size, intervalsMade: P.timers.intervalsMade, timeoutsMade: P.timers.timeoutsMade,
      lsWrites: P.ls.n, lsMB: Math.round(P.ls.bytes/1048576*10)/10, lsMs: Math.round(P.ls.ms||0), saveKB: Math.round(raw.length/1024*10)/10,
      logN: (S.log||[]).length, domCanvases: cv, rafCalls: P.raf.n, listenersAdded: P.listeners.add, listenersRemoved: P.listeners.remove,
      screen: (document.querySelector('.screen.on')||{}).id, map: ME.map }; })()`);
  let cacheMB = 0; for (const k in g.caches) cacheMB += g.caches[k].MB;
  const rss = rssMB();
  const row = { label, t, ...rss, heapMB: r1(m.JSHeapUsedSize / 1048576), heapTotalMB: r1(m.JSHeapTotalSize / 1048576), nodes: dom.nodes, docs: dom.documents,
    jsListeners: dom.jsEventListeners, winListeners: wl.listeners.length, winByType: byType, docListeners: dl.listeners.length, docByType: dByType,
    cacheMB: r1(cacheMB), ...g };
  console.log(t + 's', label, 'rss', JSON.stringify(rss), 'heap', row.heapMB, 'nodes', row.nodes, 'jsL', row.jsListeners, 'winL', row.winListeners, JSON.stringify(byType), 'cacheMB', row.cacheMB,
    'int', g.intervalsLive, 'ls', g.lsWrites, g.lsMB + 'MB', 'save', g.saveKB + 'KB');
  return row;
}

const rows = [];
const t0 = Date.now(); const el = () => Math.round((Date.now() - t0) / 1000);
rows.push(await sample('start', 0));
let nextSample = 30, cycle = 0;
const tops = await page.evaluate(() => { const o = {}; Object.keys(ITEMS).forEach((k) => { const it = ITEMS[k]; if (!it || k === 'bosssuit') return; (o[it.slot] = o[it.slot] || []).push(k); }); return o; });
const maps = await page.evaluate(() => MAP_ORDER.filter((id) => mapOpen(id)));
console.log('slots', Object.fromEntries(Object.entries(tops).map(([k, v]) => [k, v.length])), 'maps', maps.join(','));

while (el() < SECS) {
  cycle++;
  // 1) 지도 바꾸고 걷기
  await page.evaluate((mp) => { const id = mp[Math.floor(Math.random() * mp.length)]; const m = id === 'room' ? roomMap() : MAPS[id]; if (!m) return; render('home'); const sp = m.spawn || { x: 1, y: 1 }; enterMap(id, sp.x, sp.y); }, maps);
  const tw = Date.now();
  while (Date.now() - tw < 9000) {
    await page.evaluate(() => { if (MOVE || TUT || MQP) { if (TUT) try { endTalk(); } catch (e) {} return; } const m = curMap(); for (let i = 0; i < 60; i++) {
      const x = 1 + Math.floor(Math.random() * (m.w - 2)), y = 1 + Math.floor(Math.random() * (m.h - 2));
      if (walkable(m, x, y) && pathTo(m, x, y)) { goTo(x, y, null); return; } } });
    await page.waitForTimeout(400);
  }
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowRight');
  // 2) 탭 돌기 + 장비 바꾸기(캐시 키가 바뀐다)
  await page.evaluate((tp) => { for (const s of ['top', 'bottom', 'head', 'weapon']) { const l = tp[s] || []; if (l.length) S.equip[s] = l[Math.floor(Math.random() * l.length)]; }
    S.look.haircol = Math.floor(Math.random() * 5); save(); }, tops);
  for (const id of ['char', 'shop', 'wiki', 'quests', 'home']) { await page.evaluate((i) => render(i), id); await page.waitForTimeout(500); }
  // 3) 두 바퀴마다 컷신 하나를 처음부터 끝까지, 세 바퀴마다 운전 로딩
  if (cycle % 2 === 0) {
    await page.evaluate(() => { const l = ['job', 'card', 'wedding', 'car']; S.mq.done = {}; S.mq.cur = null; mqStart(l[Math.floor(Math.random() * l.length)]); });
    const tc = Date.now();
    while (Date.now() - tc < 20000) {
      const on = await page.evaluate(() => { if (!window.MQP) return false; const p = MQP.list()[MQP.cur()] || {}; if (p.choice && MQP.picked === null) MQP.pick(0); else MQP.next({ type: 'test' }); return true; });
      if (!on) break; await page.waitForTimeout(250);
    }
    await page.waitForTimeout(800);
  }
  if (cycle % 3 === 0) { await page.evaluate(() => { if (!DRIVE) driveLoading('동네', '회사', () => {}); }); await page.waitForTimeout(3000); }
  if (el() >= nextSample) { rows.push(await sample('c' + cycle, el())); nextSample += 30; }
}
rows.push(await sample('end', el()));
const det = await detachedCanvases(); console.log('heap snapshot canvases', JSON.stringify(det));
// 마지막: 홈에서 가만히 30초(대기 중 CPU)
const m0 = await metrics(cdp); const ti = Date.now(); await page.evaluate(() => render('home')); await page.waitForTimeout(30000);
const m1 = await metrics(cdp); const idleBusy = r1((m1.TaskDuration - m0.TaskDuration) * 1000 / (Date.now() - ti) * 100);
console.log('idle busy% after soak', idleBusy, 'errors', errors.length);
fs.writeFileSync(path.join(OUT, `soak-${dev}-${throttle}x-${SECS}s.json`), JSON.stringify({ rows, det, idleBusy, errors: errors.slice(0, 20) }, null, 1));
await browser.close();
