// 플레이어가 걸을 수 있는 칸마다, 그 칸에 섰을 때 캐릭터(한 칸 폭, 8px 위까지)가 십자키·미니맵·안내 칩·메인 칩·메뉴 칩에 35% 이상 가려지는지 센다.
const L = await import('./ui-lib.mjs');
const fs = await import('node:fs');
const browser = await L.chromium.launch();
const ONLY = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const FN = `(() => {
  const cvs = document.getElementById('scene'), cr = cvs.getBoundingClientRect(), sc = cr.width / SW;
  const vis = (e) => e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
  const ov = {}; for (const [k, id] of [['dpad', 'hdpad'], ['mini', 'hmini'], ['menu', 'hmenu'], ['guide', 'hguide'], ['mq', 'hmq']]) { const e = document.getElementById(id); if (vis(e)) { const r = e.getBoundingClientRect(); ov[k] = [r.left, r.top, r.right, r.bottom]; } }
  const m = curMap(), out = { n: 0, bad: 0, byOv: {}, rows: {}, badTiles: [] };
  const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const sv = { tx: ME.tx, ty: ME.ty }; MOVE = null;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    let ok = false; try { ok = walkable(m, x, y); } catch (e) {} if (!ok) continue;
    ME.tx = x; ME.ty = y; const cam = camOf(m), z = cam.z;
    const r = [cr.left + (x * TS - cam.x) * z * sc, cr.top + (y * TS - 8 - cam.y) * z * sc, cr.left + ((x + 1) * TS - cam.x) * z * sc, cr.top + ((y + 1) * TS - cam.y) * z * sc];
    const area = (r[2] - r[0]) * (r[3] - r[1]); out.n++;
    let worst = 0, wk = '';
    for (const k of Object.keys(ov)) { const f = inter(r, ov[k]) / area; if (f > worst) { worst = f; wk = k; } }
    if (worst >= 0.35) { out.bad++; out.byOv[wk] = (out.byOv[wk] || 0) + 1; out.rows[y] = (out.rows[y] || 0) + 1; if (out.badTiles.length < 6) out.badTiles.push([x, y, wk, Math.round(worst * 100)]); }
  }
  ME.tx = sv.tx; ME.ty = sv.ty; return out; })()`;
const all = {};
for (const [w, h] of L.SIZES) {
  if (ONLY && !ONLY.includes(w)) continue;
  const { ctx, page } = await L.openPage(browser, w, h, '#nointro');
  await L.homeSetup(page, 'S.done=[QUESTS[0].id]; S.todayQ=[QUESTS[1].id,QUESTS[2].id]; S.peak=S.paid=S.lastTier=S.tier=7; S.lv=9;');
  const ids = await page.evaluate(() => Object.keys(MAPS).filter((k) => MAPS[k] && MAPS[k].rows));
  all[w] = {};
  console.log('=== ' + w + 'x' + h);
  for (const id of ids) {
    await page.evaluate((id) => { const m = MAPS[id], sp = m.spawn || { x: 1, y: 1 }; enterMap(id, sp.x, sp.y); guideSync(); mqChip(); drawScene(); }, id);
    await page.waitForTimeout(80);
    const r = await page.evaluate(FN); all[w][id] = r;
    if (r.bad) console.log(`${id}: 걸을 수 있는 ${r.n}칸 중 ${r.bad}칸(${Math.round(r.bad / r.n * 100)}%)에서 캐릭터가 가려짐 ${JSON.stringify(r.byOv)} 예 ${JSON.stringify(r.badTiles.slice(0, 3))}`);
  }
  await ctx.close();
}
fs.writeFileSync(L.TMP + '/ui-player.json', JSON.stringify(all));
await browser.close();
