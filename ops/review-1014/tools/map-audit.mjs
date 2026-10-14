// 맵 길막힘 점검. 저장소 루트에서 실행한다.
//   node ops/review-1014/tools/map-audit.mjs [html 경로] [그림 이름표]
//   기본: prototype/newbie-quest-demo.html, 이름표 'before'
// 결과: 표(콘솔), ops/review-1014/img/map-<이름표>-<맵>.png, ops/review-1014/tmp/audit-<이름표>.json
// 게임의 TILES, MAPS, drawTile, drawSpot을 그대로 쓴다. 걷기 판정은 walkable()의 '걸어서' 규칙을 따른다
// (타일 walk, 스팟 칸은 막힘, 문(warp)은 목적지일 때만 밟음, needCar 문은 걸어서 못 밟음).
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');

const html = path.resolve(process.argv[2] || 'prototype/newbie-quest-demo.html');
const tag = process.argv[3] || 'before';
const IMG = path.resolve('ops/review-1014/img');
const TMP = path.resolve('ops/review-1014/tmp');
fs.mkdirSync(IMG, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(url.pathToFileURL(html).href + '#nointro');
await page.waitForFunction(() => window.S && window.MAPS && window.TILES, null, { polling: 100 });

const res = await page.evaluate(() => {
  const out = {};
  const D4 = [[0, 1], [0, -1], [-1, 0], [1, 0]];
  const PROP = { t: '나무', b: '벤치', p: '기둥', A: '노점', P: '화분', w: '물' };
  for (const id of Object.keys(MAPS)) {
    const m = MAPS[id]; if (!m || !m.rows) continue;
    const W = m.w, H = m.h, ch = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : m.rows[y].charAt(x);
    const spotAtL = (x, y) => (m.spots || []).find((s) => s.x === x && s.y === y);
    const warpAtL = (x, y) => (m.warps || []).find((w) => w.x === x && w.y === y);
    // block: 추가로 막을 칸 집합(무엇을 치우면 얼마나 줄어드는지 볼 때 'unblock'을 쓴다)
    const pass = (x, y, unblock) => {
      const c = ch(x, y); if (c === null) return false;
      if (unblock && unblock(x, y)) return true;
      if (spotAtL(x, y)) return false;
      if (warpAtL(x, y)) return false;           // 지나가는 길로는 못 쓴다
      const t = TILES[c]; return !!(t && t.walk);
    };
    const bfs = (sx, sy, unblock) => {
      const d = new Int16Array(W * H).fill(-1); if (!pass(sx, sy, unblock)) return d;
      const q = [sx, sy]; d[sy * W + sx] = 0;
      for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1];
        for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || d[ny * W + nx] >= 0 || !pass(nx, ny, unblock)) continue;
          d[ny * W + nx] = d[y * W + x] + 1; q.push(nx, ny); } }
      return d;
    };
    const issues = [];
    // 1) 시작점: spawn, 그리고 다른 맵에서 들어오는 문 착지, 가장자리 착지
    const land = (x, y) => {        // enterMap의 옆으로 밀기
      x = Math.max(0, Math.min(W - 1, x)); y = Math.max(0, Math.min(H - 1, y));
      if (pass(x, y)) return { x, y, ok: 1 };
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1]]) if (pass(x + dx, y + dy)) return { x: x + dx, y: y + dy, ok: 1, pushed: 1 };
      return { x, y, ok: 0 };
    };
    const starts = [];
    if (m.spawn) { const l = land(m.spawn.x, m.spawn.y); starts.push({ ...l, from: 'spawn' });
      if (!pass(m.spawn.x, m.spawn.y)) issues.push({ k: '시작점막힘', x: m.spawn.x, y: m.spawn.y, note: l.ok ? '옆 칸으로 밀림' : '밀 칸 없음' }); }
    for (const oid of Object.keys(MAPS)) { const o = MAPS[oid]; if (!o || !o.rows) continue;
      (o.warps || []).forEach((w) => { if (w.to !== id || w.needCar || w.fuel || oid === 'korea' || id === 'korea') return; /* 차로 오는 문은 걸어서 보지 않는다 */ const l = land(w.tx, w.ty); starts.push({ ...l, from: oid + ' 문' });
        if (!l.ok) issues.push({ k: '문착지막힘', x: w.tx, y: w.ty, note: oid + '에서 들어옴' }); });
      const E = o.edges || {};
      for (const dir of Object.keys(E)) { if (E[dir] !== id) continue;
        for (let i = 0; i < (dir === 'east' || dir === 'west' ? o.h : o.w); i++) {
          const ex = dir === 'east' ? o.w - 1 : dir === 'west' ? 0 : i, ey = dir === 'south' ? o.h - 1 : dir === 'north' ? 0 : i;
          const oc = o.rows[ey].charAt(ex), ot = TILES[oc]; if (!(ot && ot.walk) || (o.spots || []).some((s) => s.x === ex && s.y === ey)) continue;
          let tx, ty; if (dir === 'west') { tx = W - 2; ty = Math.min(H - 2, ey); } else if (dir === 'east') { tx = 1; ty = Math.min(H - 2, ey); }
          else if (dir === 'north') { tx = Math.min(W - 2, ex); ty = H - 2; } else { tx = Math.min(W - 2, ex); ty = 1; }
          const l = land(tx, ty); starts.push({ ...l, from: oid + ' ' + dir });
          if (!l.ok) issues.push({ k: '가장자리착지막힘', x: tx, y: ty, note: oid + '의 ' + dir + ' 끝(' + ex + ',' + ey + ')에서 넘어옴' }); } } }
    const s0 = starts.find((s) => s.ok) || { x: 0, y: 0 };
    const D0 = bfs(s0.x, s0.y);
    const reach = (x, y) => D0[y * W + x] >= 0;
    starts.forEach((s) => { if (s.ok && !reach(s.x, s.y)) issues.push({ k: '고립착지', x: s.x, y: s.y, note: s.from + ' 착지가 본 길과 끊김' }); });
    // 2) 스팟·문: 이웃 칸 중 닿는 칸이 있나, 시작점에서 몇 걸음인가(맨해튼 대비)
    const nearest = (x, y, Dm) => { let b = -1, bx = 0, by = 0; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const v = Dm[ny * W + nx]; if (v >= 0 && (b < 0 || v < b)) { b = v; bx = nx; by = ny; } } return { d: b, x: bx, y: by }; };
    const targets = [];
    (m.spots || []).forEach((s) => targets.push({ kind: 'spot:' + s.kind, name: s.name || s.id || s.kind, x: s.x, y: s.y }));
    (m.warps || []).forEach((w) => { if (!w.needCar) targets.push({ kind: 'door', name: '문→' + w.to, x: w.x, y: w.y }); });
    (m.eggs || []).forEach((e) => targets.push({ kind: 'egg', name: e.id, x: e.x, y: e.y, onTile: 1 }));
    const tgt = [];
    targets.forEach((t) => {
      let d;
      if (t.onTile) d = { d: reach(t.x, t.y) ? D0[t.y * W + t.x] : -1 };
      else d = nearest(t.x, t.y, D0);
      const man = Math.abs(t.x - s0.x) + Math.abs(t.y - s0.y);
      tgt.push({ ...t, dist: d.d, man });
      if (d.d < 0) issues.push({ k: t.kind === 'egg' ? '숨은보물못감' : '스팟못감', x: t.x, y: t.y, note: t.kind + ' ' + t.name });
    });
    // 3) 길막는 소품: 스팟과 소품 타일 하나를 치웠을 때 근처(맨해튼 8 이하) 두 칸 사이 걸음이 얼마나 줄어드나
    const cells = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (reach(x, y)) cells.push([x, y]);
    const Dall = new Map(); cells.forEach(([x, y]) => Dall.set(y * W + x, bfs(x, y)));
    const detourOf = (Dm, ax, ay) => {}; // placeholder
    let worst = { ex: 0 }, sumEx = 0, nPairs = 0;
    for (const [ax, ay] of cells) { const da = Dall.get(ay * W + ax);
      for (const [bx, by] of cells) { const man = Math.abs(ax - bx) + Math.abs(ay - by); if (man === 0 || man > 8 || (by * W + bx) < (ay * W + ax)) continue;
        const ex = da[by * W + bx] - man; if (ex >= 6) { nPairs++; sumEx += ex; } if (ex > worst.ex) worst = { ex, a: [ax, ay], b: [bx, by] }; } }
    const props = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sp = spotAtL(x, y), c = ch(x, y); if (!sp && !PROP[c]) continue;
      const under = sp ? c : null;
      // 스팟이면 그 밑 타일이 걸을 수 있을 때만, 소품 타일이면 주변에 걸을 칸이 둘 이상일 때만 본다
      const nbWalk = D4.filter(([dx, dy]) => reach(x + dx, y + dy)).length; if (nbWalk < 2) continue;
      if (sp && !(TILES[c] && TILES[c].walk)) continue;
      const ub = (ux, uy) => ux === x && uy === y;
      let gain = 0, pairs = 0, maxg = 0;
      for (const [ax, ay] of cells) { const da = Dall.get(ay * W + ax); const dn = bfs(ax, ay, ub);
        for (const [bx, by] of cells) { const man = Math.abs(ax - bx) + Math.abs(ay - by); if (man === 0 || man > 8 || (by * W + bx) < (ay * W + ax)) continue;
          const g = da[by * W + bx] - dn[by * W + bx]; if (g > 0) { gain += g; if (g >= 4) pairs++; if (g > maxg) maxg = g; } } }
      const pave = D4.filter(([dx, dy]) => '_-:sQ=.,'.includes(ch(x + dx, y + dy) || '#')).length;
      if (maxg >= 4) props.push({ x, y, what: sp ? ((sp.look === 'sign' ? '표지판 ' : '') + (sp.name || sp.id || sp.kind)) : PROP[c] + "('" + c + "')", spot: !!sp, maxg, pairs, gain, pave });
    }
    // 섬 잇기: 치우면 끊긴 칸이 본 길에 붙는 소품
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sp = spotAtL(x, y), c = ch(x, y); if (!sp && !PROP[c]) continue; if (c === 'w') continue;
      if (sp && !(TILES[c] && TILES[c].walk)) continue;
      const nr = D4.some(([dx, dy]) => reach(x + dx, y + dy)), ni = D4.some(([dx, dy]) => pass(x + dx, y + dy) && !reach(x + dx, y + dy));
      if (!nr || !ni) continue;
      const dn = bfs(s0.x, s0.y, (ux, uy) => ux === x && uy === y); let joined = 0;
      for (let i = 0; i < W * H; i++) if (dn[i] >= 0 && D0[i] < 0) joined++;
      if (joined > 1) props.push({ x, y, what: (sp ? (sp.name || sp.id) : PROP[c] + "('" + c + "')"), spot: !!sp, maxg: 99, pairs: 0, gain: 0, joined });
    }
    props.sort((a, b) => b.gain - a.gain);
    props.forEach((p) => { if (p.maxg >= 6 || (p.spot && p.maxg >= 4)) issues.push(p.joined ? { k: '섬막는소품', x: p.x, y: p.y, note: p.what + ' · 치우면 끊긴 칸 ' + (p.joined - 1) + '개가 이어짐' } : { k: '길막소품', x: p.x, y: p.y, note: p.what + ' · 치우면 최대 ' + p.maxg + '걸음 줄어듦, 4걸음 이상 줄어드는 칸 쌍 ' + p.pairs }); });
    // 4) 한 칸 길목(끊으면 길이 나뉘는 칸)과 막다른 칸
    const art = [];
    for (const [x, y] of cells) { const nb = D4.filter(([dx, dy]) => reach(x + dx, y + dy)); if (nb.length !== 2) continue;
      const [a, b] = nb; if (a[0] + b[0] !== 0 || a[1] + b[1] !== 0) continue;   // 일자 통로만
      const ub = (ux, uy) => false; const dd = bfs(x + a[0], y + a[1], null);
      // 이 칸을 막고 반대편까지 걸음
      const blocked = (() => { const d = new Int16Array(W * H).fill(-1), q = [x + a[0], y + a[1]]; d[(y + a[1]) * W + x + a[0]] = 0;
        for (let i = 0; i < q.length; i += 2) { const qx = q[i], qy = q[i + 1]; for (const [dx, dy] of D4) { const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || (nx === x && ny === y) || d[ny * W + nx] >= 0 || !pass(nx, ny)) continue; d[ny * W + nx] = d[qy * W + qx] + 1; q.push(nx, ny); } }
        return d[(y + b[1]) * W + x + b[0]]; })();
      if (blocked < 0) art.push([x, y]); }
    const dead = [];
    for (const [x, y] of cells) { const nb = D4.filter(([dx, dy]) => reach(x + dx, y + dy)).length;
      const useful = (m.eggs || []).some((e) => e.x === x && e.y === y) || D4.some(([dx, dy]) => spotAtL(x + dx, y + dy) || warpAtL(x + dx, y + dy)) || x === 0 || y === 0 || x === W - 1 || y === H - 1;
      if (nb <= 1 && !useful) dead.push([x, y]); }
    // 5) 나가는 길(가장자리)
    const exits = {};
    for (const dir of Object.keys(m.edges || {})) {
      const list = []; for (let i = 0; i < (dir === 'east' || dir === 'west' ? H : W); i++) {
        const x = dir === 'east' ? W - 1 : dir === 'west' ? 0 : i, y = dir === 'south' ? H - 1 : dir === 'north' ? 0 : i; if (reach(x, y)) list.push(dir === 'east' || dir === 'west' ? y : x); }
      exits[dir] = list; if (!list.length) issues.push({ k: '출구막힘', x: -1, y: -1, note: dir + ' → ' + m.edges[dir] + ' 로 걸어 나갈 칸이 없음' }); }
    // 6) 맵 안에서 끊긴 걸을 수 있는 칸(섬)
    let island = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (pass(x, y) && !reach(x, y)) island++;
    out[id] = { w: W, h: H, interior: !!m.interior, s0: [s0.x, s0.y], walk: cells.length, island, worst, detourPairs: nPairs, detourSum: sumEx, props, art, dead, exits, tgt, issues };
  }
  return out;
});

// 그림: 게임 타일로 맵을 그리고 문제 칸을 표시한다
const draws = await page.evaluate((data) => {
  const imgs = {};
  for (const id of Object.keys(data)) {
    const m = MAPS[id], r = data[id], Z = 2;
    const cv = document.createElement('canvas'); cv.width = m.w * TS * Z; cv.height = m.h * TS * Z + 0;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.setTransform(Z, 0, 0, Z, 0, 0);
    try { for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) drawTile(c, m, m.rows[y].charAt(x), x * TS, y * TS, x, y); } catch (e) {}
    try { (m.spots || []).forEach((s) => drawSpot(c, s, s.x * TS, s.y * TS)); } catch (e) {}
    const box = (x, y, col, lw) => { c.strokeStyle = col; c.lineWidth = lw || 1.5; c.strokeRect(x * TS + 1, y * TS + 1, TS - 2, TS - 2); };
    const dot = (x, y, col) => { c.fillStyle = col; c.globalAlpha = .35; c.fillRect(x * TS, y * TS, TS, TS); c.globalAlpha = 1; };
    (m.warps || []).forEach((w) => box(w.x, w.y, '#2E7DFF'));
    r.art.forEach(([x, y]) => dot(x, y, '#FFB000'));
    r.dead.forEach(([x, y]) => dot(x, y, '#B000FF'));
    r.props.forEach((p) => { box(p.x, p.y, p.spot ? '#FF2020' : '#FF8A00', 2); });
    r.issues.forEach((i) => { if (i.x < 0) return; c.strokeStyle = '#FF0000'; c.lineWidth = 2; c.beginPath(); c.moveTo(i.x * TS + 3, i.y * TS + 3); c.lineTo(i.x * TS + TS - 3, i.y * TS + TS - 3); c.moveTo(i.x * TS + TS - 3, i.y * TS + 3); c.lineTo(i.x * TS + 3, i.y * TS + TS - 3); c.stroke(); });
    c.fillStyle = '#00E0FF'; c.beginPath(); c.arc(r.s0[0] * TS + 8, r.s0[1] * TS + 8, 3, 0, 7); c.fill();
    imgs[id] = cv.toDataURL('image/png').split(',')[1];
  }
  return imgs;
}, res);
for (const [id, b64] of Object.entries(draws)) fs.writeFileSync(path.join(IMG, `map-${tag}-${id}.png`), Buffer.from(b64, 'base64'));
fs.writeFileSync(path.join(TMP, `audit-${tag}.json`), JSON.stringify(res, null, 1));
await browser.close();

// 표
const rows = [];
let tot = { issues: 0, blockProps: 0, spotNo: 0, art: 0, dead: 0, detour: 0 };
for (const [id, r] of Object.entries(res)) {
  const bp = r.issues.filter((i) => /소품/.test(i.k)).length, sn = r.issues.filter((i) => /못감|막힘|고립/.test(i.k)).length;
  tot.issues += r.issues.length; tot.blockProps += bp; tot.spotNo += sn; tot.art += r.art.length; tot.dead += r.dead.length; tot.detour += r.detourPairs;
  rows.push([id.padEnd(16), String(r.walk).padStart(4), String(r.island).padStart(3), String(bp).padStart(4), String(sn).padStart(4), String(r.art.length).padStart(4), String(r.dead.length).padStart(4), String(r.detourPairs).padStart(5), String(r.worst.ex).padStart(4)].join(' | '));
}
console.log('맵               | 걷칸 |섬 |길막 |못감 |길목 |막끝 |돌길쌍|최대돌');
console.log(rows.join('\n'));
console.log('합계', JSON.stringify(tot));
for (const [id, r] of Object.entries(res)) for (const i of r.issues) console.log(`  [${id}] ${i.k} (${i.x},${i.y}) ${i.note}`);
if (errs.length) console.log('페이지 오류:', errs.slice(0, 3));
