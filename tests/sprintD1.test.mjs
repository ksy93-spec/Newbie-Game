// 스프린트 D1: 맵 엔진. 차는 찻길·주차장에서만 달린다, 남북 연결, 건물 외관·실내 스타일.
// 실행: node --test tests/sprintD1.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';
import { reloadSaved } from './storage.mjs';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href + '#nointro';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

const PROFILE = { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 };

async function open({ w = 390, h = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate((p) => {
    Object.assign(S, p);
    S.onboarded = true; S.demo = false; S.demoDone = 1; S.lv = 10; S.coin = 500; S.full = 100;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.todayQ = pickDaily(); save(); render('home');
  }, PROFILE);
  return { ctx, page, logs };
}
const sleep = (page, ms) => page.waitForTimeout(ms);
/** 자동차를 타고 동네 찻길 위에 선다 */
async function drive(page, map = 'town', x = 5, y = 13) {
  await page.evaluate(([map, x, y]) => { if (S.owned.indexOf('car') < 0) S.owned.push('car');
    S.equip.mount = 'car'; S.onFoot = false; S.park = null; save(); enterMap(map, x, y); drawScene(); }, [map, x, y]);
  await sleep(page, 200);
}
/** 움직이는 동안 차를 탄 칸을 모두 모은다 */
async function trackUntilStill(page) {
  return page.evaluate(() => new Promise((res) => {
    const seen = []; const t0 = Date.now();
    const iv = setInterval(() => {
      if (carOn()) seen.push([ME.tx, ME.ty, tileAt(curMap(), ME.tx, ME.ty)]);
      if ((!MOVE && Date.now() - t0 > 300) || Date.now() - t0 > 15000) { clearInterval(iv); res(seen); }
    }, 20);
  }));
}

test('1. 차를 탄 채 보도 쪽으로 가려 하면 막히고 안내가 뜬다', async () => {
  const { ctx, page, logs } = await open();
  await drive(page);
  await page.evaluate(() => { window.__t = []; const t0 = window.toast; window.toast = (m) => { window.__t.push(m); return t0(m); }; });
  await page.keyboard.press('ArrowUp');                 // (5,12)는 풀밭
  await sleep(page, 400);
  const st = await page.evaluate(() => ({ x: ME.tx, y: ME.ty, car: carOn(), toast: window.__t.join(' / ') }));
  assert.deepEqual([st.x, st.y], [5, 13], '찻길에 그대로 있다');
  assert.equal(st.car, true);
  assert.match(st.toast, /찻길과 주차장/);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('2. 찻길 밖을 누르면 주차장에 세우고 걸어간다. 차는 찻길·주차장만 지난다', async () => {
  const { ctx, page, logs } = await open();
  await drive(page);
  const track = trackUntilStill(page);
  await page.evaluate(() => goTo(8, 5, null));         // 동네 광장 보도
  const seen = await track;
  assert.ok(seen.length > 3, '차로 몇 칸은 달린다');
  const bad = seen.filter((s) => !'r-Q'.includes(s[2]));
  assert.deepEqual(bad, [], '차가 보도·풀밭에 올라간 칸이 없다');
  const st = await page.evaluate(() => ({ x: ME.tx, y: ME.ty, onFoot: S.onFoot, park: S.park, lot: S.park && tileAt(MAPS.town, S.park.x, S.park.y) }));
  assert.deepEqual([st.x, st.y], [8, 5], '목적지까지 걸어갔다');
  assert.equal(st.onFoot, true);
  assert.equal(st.lot, 'Q', '차는 주차장 칸에 서 있다');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('3. 세워 둔 차에 다시 타면 차 자리로 옮겨 앉고, 주차장 칸에서는 한 발 내디뎌 내린다', async () => {
  const { ctx, page, logs } = await open();
  await drive(page);
  await page.evaluate(() => goTo(15, 10, null));
  await page.waitForFunction(() => !MOVE && S.onFoot && ME.tx === 15 && ME.ty === 10, null, { timeout: 12000, polling: 100 });
  const pk = await page.evaluate(() => ({ x: S.park.x, y: S.park.y }));
  // 차 옆으로 가서 말을 건다
  await page.evaluate(({ x, y }) => { const n = adjacentTo(curMap(), { x, y }); goTo(n.x, n.y, () => openCarTalk()); }, pk);
  await page.waitForSelector('#htutorop .topt', { timeout: 6000 });
  await page.locator('#htutorop .topt').first().click();
  await sleep(page, 300);
  await page.evaluate(() => { while (TUT) endTalk(); });
  const on = await page.evaluate(() => ({ x: ME.tx, y: ME.ty, car: carOn(), park: S.park }));
  assert.deepEqual([on.x, on.y], [pk.x, pk.y], '차가 있던 칸에 앉았다');
  assert.equal(on.car, true);
  assert.equal(on.park, null);
  // 주차장 칸에서 보도 쪽으로 한 발: 내려서 걷는다
  const dir = await page.evaluate(() => { const m = curMap();
    const D = [[0, -1, 'ArrowUp'], [1, 0, 'ArrowRight'], [-1, 0, 'ArrowLeft'], [0, 1, 'ArrowDown']];
    for (const d of D) { const x = ME.tx + d[0], y = ME.ty + d[1]; if (walkable(m, x, y, 1, 'foot') && !walkable(m, x, y, 1, 'car')) return d[2]; }
    return null; });
  if (dir) {
    await page.keyboard.press(dir); await sleep(page, 500);
    const off = await page.evaluate(() => ({ onFoot: S.onFoot, lot: S.park && tileAt(curMap(), S.park.x, S.park.y) }));
    assert.equal(off.onFoot, true);
    assert.equal(off.lot, 'Q');
  }
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('4. 차를 탄 채 보도 위에 저장돼 있던 사람은 불러올 때 주차장에 차를 세우고 걷는다', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { if (S.owned.indexOf('car') < 0) S.owned.push('car'); S.equip.mount = 'car'; S.onFoot = false; S.park = null;
    S.pos = { map: 'town', tx: 4, ty: 4, dir: 0 }; save(); });
  await reloadSaved(page);
  await page.waitForFunction(() => window.S && window.QUESTS && document.getElementById('home').classList.contains('on'), null, { polling: 100 });
  await sleep(page, 600);
  const st = await page.evaluate(() => ({ car: carOn(), onFoot: S.onFoot, lot: S.park && tileAt(MAPS[S.park.map], S.park.x, S.park.y), map: ME.map }));
  assert.equal(st.car, false);
  assert.equal(st.onFoot, true);
  assert.equal(st.lot, 'Q');
  await ctx.close();
});

test('5. 찻길이 있는 바깥 맵에는 차로 닿는 주차장이 있다', async () => {
  const { ctx, page } = await open();
  const miss = await page.evaluate(() => {
    const out = [];
    Object.keys(MAPS).forEach((k) => { const m = MAPS[k]; if (m.interior || k === 'korea') return;
      const rows = m.rows.join(''); if (rows.indexOf('r') < 0 && rows.indexOf('Q') < 0) return;
      if (rows.indexOf('Q') < 0) out.push(k + ': 주차장 없음'); });
    return out; });
  assert.deepEqual(miss, []);
  await ctx.close();
});

test('6. 남북으로 이어진 맵을 오간다. 잠긴 맵은 막는다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => {
    const row = (c) => c.repeat(8);
    MAPS.t_n = { name: '북쪽', sub: '시험', w: 8, h: 6, rows: [row('g'), row('_'), row('_'), row('_'), row('_'), 'ggg__ggg'], edges: { south: 't_s' }, spots: [], warps: [] };
    MAPS.t_s = { name: '남쪽', sub: '시험', w: 8, h: 6, rows: ['ggg__ggg', row('_'), row('_'), row('_'), row('_'), row('g')], edges: { north: 't_n' }, spots: [], warps: [] };
    S.onFoot = true; enterMap('t_n', 3, 4);
  });
  await page.keyboard.press('ArrowDown'); await sleep(page, 500);     // 맨 아래 줄을 밟으면 넘어간다
  let st = await page.evaluate(() => ({ map: ME.map, x: ME.tx, y: ME.ty }));
  assert.deepEqual(st, { map: 't_s', x: 3, y: 1 }, '남쪽 맵 맨 위 줄, 같은 칸으로');
  await page.keyboard.press('ArrowUp'); await sleep(page, 500);
  st = await page.evaluate(() => ({ map: ME.map, x: ME.tx, y: ME.ty }));
  assert.deepEqual(st, { map: 't_n', x: 3, y: 4 }, '북쪽 맵 맨 아래 한 줄 위로');
  await page.evaluate(() => { MAP_LV.t_s = 99; window.__t = []; const t0 = window.toast; window.toast = (m) => { window.__t.push(m); return t0(m); }; });
  await page.keyboard.press('ArrowDown'); await sleep(page, 500);
  st = await page.evaluate(() => ({ map: ME.map, toast: window.__t.join(' / ') }));
  assert.equal(st.map, 't_n');
  assert.equal(await page.evaluate(() => ME.ty), 4, '잠긴 맵 앞에서 한 칸 물러선다');
  assert.match(st.toast, /Lv\.99/);
  await page.evaluate(() => { delete MAP_LV.t_s; delete MAPS.t_n; delete MAPS.t_s; enterMap('town', 4, 4); });
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('7. 건물 외관 스타일과 실내 스타일은 서로 다른 그림으로 칠해진다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    const styles = Object.keys(BSTYLE);
    const rows = ['R'.repeat(styles.length * 3), 'H'.repeat(styles.length * 3).split('').map((c, i) => i % 3 === 1 ? 'W' : c).join(''),
      'H'.repeat(styles.length * 3).split('').map((c, i) => i % 3 === 1 ? 'D' : c).join('')];
    const m = { w: styles.length * 3, h: 3, rows, blds: styles.map((s, i) => ({ x: i * 3, y: 0, w: 3, h: 3, s })) };
    const cv = document.createElement('canvas'); cv.width = m.w * TS; cv.height = m.h * TS;
    const c = cv.getContext('2d', { willReadFrequently: true });
    for (let y = 0; y < 3; y++) for (let x = 0; x < m.w; x++) drawTile(c, m, tileAt(m, x, y), x * TS, y * TS, x, y);
    const sig = (x0, y0) => { const d = c.getImageData(x0, y0, TS, TS).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7) >>> 0; return h; };
    const walls = styles.map((s, i) => sig(i * 3 * TS, 1 * TS));
    const roofs = styles.map((s, i) => sig(i * 3 * TS, 0));
    // 실내
    const fl = Object.keys(FLOOR_S).concat(['wood', 'tile']);
    const fsig = fl.map((f) => { const im = { w: 3, h: 3, rows: ['###', '...', '...'], interior: 1, floor: f, tint: { fl: '#C9A97A', fl2: '#A98A5E', wl: '#F7EBD6', wl2: '#E3D2B4' } };
      const cv2 = document.createElement('canvas'); cv2.width = 48; cv2.height = 48; const c2 = cv2.getContext('2d', { willReadFrequently: true });
      drawTile(c2, im, '.', 16, 16, 1, 1); const d = c2.getImageData(16, 16, 16, 16).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 5) >>> 0; return h; });
    const wl = ['paper', 'wains', 'brick', 'wood', 'hanji', 'tile', 'glass'];
    const wsig = wl.map((w) => { const im = { w: 3, h: 3, rows: ['###', '...', '...'], interior: 1, wall: w, tint: { fl: '#C9A97A', fl2: '#A98A5E', wl: '#F7EBD6', wl2: '#E3D2B4' } };
      const cv2 = document.createElement('canvas'); cv2.width = 48; cv2.height = 48; const c2 = cv2.getContext('2d', { willReadFrequently: true });
      drawTile(c2, im, '#', 16, 0, 1, 0); const d = c2.getImageData(16, 0, 16, 16).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 5) >>> 0; return h; });
    return { n: styles.length, walls: new Set(walls).size, roofs: new Set(roofs).size, floors: [fl.length, new Set(fsig).size], wallsIn: [wl.length, new Set(wsig).size],
      town: bstyle(MAPS.town, 8, 1) && bstyle(MAPS.town, 8, 1).wall };
  });
  assert.equal(r.walls, r.n, '스타일마다 벽이 다르다');
  assert.ok(r.roofs >= 4, '지붕도 여러 가지(기와·평지붕·한옥 기와·너와): ' + r.roofs);
  assert.equal(r.floors[1], r.floors[0], '실내 바닥 무늬가 다 다르다');
  assert.equal(r.wallsIn[1], r.wallsIn[0], '실내 벽 무늬가 다 다르다');
  assert.equal(r.town, 'paint', '동네 편의점은 가게 스타일');
  assert.deepEqual(logs, []);
  await ctx.close();
});
