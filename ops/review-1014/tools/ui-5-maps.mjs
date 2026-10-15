// 모든 맵에서 DOM 겹침(십자키·미니맵·안내 칩·메인 칩·메뉴 칩·존 태그)과, 캔버스에 그려진 간판·창구·문·안내판이
// 그 위로 가려지는지 잰다. 플레이어가 스폰에 선 첫 화면과, 각 대상 바로 옆에 선 최선의 경우를 본다.
const L = await import('./ui-lib.mjs');
const fs = await import('node:fs');
const browser = await L.chromium.launch();
const ONLY = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const SHOTS = new Set((process.argv[3] || '').split(',').filter(Boolean));
const all = {};
const PAGE_FN = `(() => {
  const home = document.getElementById('home'), sb = home.querySelector('.stagebox'), sr = sb.getBoundingClientRect();
  const cvs = document.getElementById('scene'), cr = cvs.getBoundingClientRect();
  const sc = cr.width / SW;                       // 논리 1px이 화면 몇 px인지
  const rel = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
  const vis = (e) => e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
  const ov = {}; for (const [k, id] of [['dpad', 'hdpad'], ['mini', 'hmini'], ['menu', 'hmenu'], ['zone', 'hzone'], ['guide', 'hguide'], ['mq', 'hmq'], ['chk', 'hchk'], ['near', 'hnear']]) { const e = document.getElementById(id); if (vis(e)) ov[k] = rel(e); }
  const m = curMap(), res = { map: ME.map, ov, items: [], mapPx: [m.w, m.h], cr: [cr.left, cr.top, cr.right, cr.bottom] };
  const proj = (cam, x, y, w, h) => { const z = cam.z; return [cr.left + (x - cam.x) * z * sc, cr.top + (y - cam.y) * z * sc, cr.left + (x + w - cam.x) * z * sc, cr.top + (y + h - cam.y) * z * sc]; };
  const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const items = [];
  (m.signs || []).forEach((g) => items.push({ kind: '간판', name: g.t, px: [g.x * TS + 2, g.y * TS + 2, g.w * TS - 4, 12], at: [g.x, g.y + 1] }));
  (m.spots || []).forEach((s) => { const lbl = s.name || s.label || s.id; items.push({ kind: s.look === 'sign' ? '안내판' : s.kind === 'desk' ? '창구' : '사람/물건', name: lbl, px: [s.x * TS, s.y * TS - (s.kind === 'desk' ? 0 : 6), TS, TS + (s.kind === 'desk' ? 0 : 6)], at: [s.x, s.y] }); });
  (m.warps || []).forEach((w) => items.push({ kind: '문', name: '→' + w.to, px: [w.x * TS, w.y * TS, TS, TS], at: [w.x, w.y] }));
  const walk = (x, y) => { try { return walkable(m, x, y); } catch (e) { return false; } };
  const saveME = { tx: ME.tx, ty: ME.ty };
  const camAt = (tx, ty) => { ME.tx = tx; ME.ty = ty; MOVE = null; return camOf(m); };
  const sp = m.spawn || { x: 1, y: 1 };
  const camSpawn = camAt(sp.x, sp.y);
  for (const it of items) {
    const area = it.px[2] * it.px[3] * sc * sc * camSpawn.z * camSpawn.z;
    const r0 = proj(camSpawn, ...it.px);
    const hit0 = {}; let cov0 = 0;
    for (const k of Object.keys(ov)) { const a = inter(r0, ov[k]); if (a > 0) hit0[k] = Math.round(a / area * 100); }
    // 가장 잘 보이는 자리: 대상 둘레 칸(맨해튼 1, 걸을 수 있는)에서 가려진 비율의 최솟값
    let best = null;
    const nb = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [0, -2]];
    for (const [dx, dy] of nb) { const x = it.at[0] + dx, y = it.at[1] + dy; if (x < 0 || y < 0 || x >= m.w || y >= m.h || !walk(x, y)) continue;
      const cam = camAt(x, y); const r = proj(cam, ...it.px); const hit = {}; let tot = 0;
      for (const k of Object.keys(ov)) { if (k === 'zone' || k === 'near') continue; const a = inter(r, ov[k]); if (a > 0) { hit[k] = Math.round(a / (it.px[2] * it.px[3] * sc * sc * cam.z * cam.z) * 100); tot = Math.max(tot, hit[k]); } }
      const onscr = r[0] >= cr.left - 1 && r[2] <= cr.right + 1 && r[1] >= cr.top - 1 && r[3] <= cr.bottom + 1;
      if (!best || (onscr ? 0 : 1000) + tot < best.score) best = { score: (onscr ? 0 : 1000) + tot, hit, at: [x, y], onscr }; }
    res.items.push({ kind: it.kind, name: it.name, at: it.at, spawnHit: hit0, best, scr: r0.map(Math.round) });
  }
  ME.tx = saveME.tx; ME.ty = saveME.ty;
  return res; })()`;

for (const [w, h] of L.SIZES) {
  if (ONLY && !ONLY.includes(w)) continue;
  const { ctx, page, logs } = await L.openPage(browser, w, h, '#nointro');
  await L.homeSetup(page, 'S.done=[QUESTS[0].id]; S.todayQ=[QUESTS[1].id,QUESTS[2].id]; S.peak=S.paid=S.lastTier=S.tier=7; S.lv=9;');
  const ids = await page.evaluate(() => Object.keys(MAPS).filter((k) => MAPS[k] && MAPS[k].rows));
  all[w] = {};
  for (const id of ids) {
    await page.evaluate((id) => { const m = MAPS[id]; const sp = m.spawn || { x: 1, y: 1 }; enterMap(id, sp.x, sp.y); guideSync(); mqChip(); drawScene(); }, id);
    await page.waitForTimeout(120);
    const r = await page.evaluate(PAGE_FN);
    all[w][id] = r;
    if (SHOTS.has(id) || SHOTS.has('all')) await L.shot(page, `s5-${id}-${w}`);
  }
  await ctx.close();
}
fs.writeFileSync(L.TMP + '/ui-maps.json', JSON.stringify(all));
// 요약
for (const w of Object.keys(all)) {
  console.log('=== ' + w);
  for (const [id, r] of Object.entries(all[w])) {
    const ov = r.ov, ks = Object.keys(ov);
    const pairs = [];
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
      const a = ov[ks[i]], b = ov[ks[j]];
      const ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ix > 0 && iy > 0) pairs.push(`${ks[i]}x${ks[j]} ${Math.round(ix)}x${Math.round(iy)}`); }
    const bad = r.items.filter((it) => Object.values(it.spawnHit).some((v) => v >= 25));
    const bestBad = r.items.filter((it) => it.best && it.best.score >= 25 && it.best.score < 1000);
    const off = r.items.filter((it) => it.best && it.best.score >= 1000);
    console.log(`${id} 미니맵 ${ov.mini ? Math.round(ov.mini[2] - ov.mini[0]) + 'x' + Math.round(ov.mini[3] - ov.mini[1]) : '-'} 안내칩 ${ov.guide ? Math.round(ov.guide[2] - ov.guide[0]) + 'x' + Math.round(ov.guide[3] - ov.guide[1]) : '-'}` + (pairs.length ? ' DOM겹침: ' + pairs.join(', ') : '') +
      (bad.length ? '\n   첫화면 가림: ' + bad.map((it) => `${it.kind}「${it.name}」${JSON.stringify(it.spawnHit)}`).join(' / ') : '') +
      (bestBad.length ? '\n   바로옆에서도 가림: ' + bestBad.map((it) => `${it.kind}「${it.name}」@${it.at} ${JSON.stringify(it.best.hit)}`).join(' / ') : ''));
  }
}
await browser.close();
