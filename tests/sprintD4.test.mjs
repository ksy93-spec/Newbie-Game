// 스프린트 D4: 생활권 맵. 찻길로 다섯 맵을 잇고, 주택가·전통시장·역 앞을 남북으로 붙이고, 건물·실내마다 스타일.
// 실행: node --test tests/sprintD4.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import url from 'node:url';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = url.pathToFileURL(path.resolve(here, '../prototype/newbie-quest-demo.html')).href + '#nointro';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(GAME);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(() => {
    Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
    S.onboarded = true; S.demo = false; S.demoDone = 1; S.lv = 10; S.coin = 500; S.full = 100;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.evDay = dayKey(); S.evN = 99;                       // 생활 이벤트 대화가 끼어들지 않게
    S.todayQ = pickDaily(); save(); render('home');
  });
  return { ctx, page, logs };
}
const sleep = (page, ms) => page.waitForTimeout(ms);
async function drive(page, map, x, y) {
  await page.evaluate(([map, x, y]) => { if (S.owned.indexOf('car') < 0) S.owned.push('car');
    S.equip.mount = 'car'; S.onFoot = false; S.park = null; save(); enterMap(map, x, y); drawScene(); }, [map, x, y]);
  await sleep(page, 200);
}
/** 키를 누르고 있는 것처럼 한 방향으로 계속 간다. 조건이 맞으면 멈춘다. 차를 탄 칸을 모두 돌려준다 */
async function hold(page, key, until, max = 120) {
  const seen = [];
  const rec = () => page.evaluate(() => ({ map: ME.map, x: ME.tx, y: ME.ty, c: tileAt(curMap(), ME.tx, ME.ty), car: carOn(), drive: !!DRIVE }));
  for (let i = 0; i < max; i++) {
    const r = await rec(); seen.push(r);
    if (await page.evaluate(until)) break;
    if (!r.drive) await page.keyboard.press(key);
    await sleep(page, 90);
  }
  return seen;
}

test('1. 차로 동네에서 은행 골목까지 찻길만 따라 동쪽으로 달린다', async () => {
  const { ctx, page, logs } = await open();
  await drive(page, 'town', 2, 13);
  const seen = await hold(page, 'ArrowRight', () => ME.map === 'bank' && ME.tx >= 12, 200);
  const maps = [...new Set(seen.map((s) => s.map))];
  assert.deepEqual(maps, ['town', 'campus', 'center', 'office', 'bank'], '다섯 맵을 차례로 지난다');
  const off = seen.filter((s) => !s.car || !'r-Q'.includes(s.c));
  assert.deepEqual(off, [], '끝까지 차에 탄 채 찻길 위에 있다');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('2. 차로 동네 남쪽 주택가로 내려가고, 걸어서도 옆 보도로 내려간다', async () => {
  const { ctx, page, logs } = await open();
  await drive(page, 'town', 18, 13);
  let seen = await hold(page, 'ArrowDown', () => ME.map === 'villa' && ME.ty >= 4, 60);
  assert.ok(seen.some((s) => s.map === 'villa'), '주택가로 넘어갔다');
  assert.deepEqual(seen.filter((s) => !s.car || !'r-Q'.includes(s.c)), [], '찻길로만');
  // 걸어서: 동네 보도 x=17로 내려간다
  await page.evaluate(() => { S.onFoot = true; S.park = null; S.equip.mount = null; enterMap('town', 17, 15); });
  seen = await hold(page, 'ArrowDown', () => ME.map === 'villa', 30);
  const st = await page.evaluate(() => ({ map: ME.map, x: ME.tx, y: ME.ty, c: tileAt(curMap(), ME.tx, ME.ty) }));
  assert.equal(st.map, 'villa'); assert.equal(st.c, '_', '보도에 도착');
  // 북쪽으로 다시 올라간다
  await hold(page, 'ArrowUp', () => ME.map === 'town', 30);
  assert.equal(await page.evaluate(() => ME.map), 'town');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('3. 전통시장·역 앞은 걸어서 남북으로 이어지고, 레벨이 모자라면 막힌다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.onFoot = true; enterMap('center', 17, 16); });
  await hold(page, 'ArrowDown', () => ME.map === 'market', 20);
  assert.equal(await page.evaluate(() => ME.map), 'market');
  await page.evaluate(() => { enterMap('office', 20, 4); });
  await hold(page, 'ArrowUp', () => ME.map === 'station', 20);
  assert.equal(await page.evaluate(() => ME.map), 'station');
  await page.evaluate(() => { S.lv = 2; enterMap('office', 20, 4); window.__t = []; const t0 = window.toast; window.toast = (m) => { window.__t.push(m); return t0(m); }; });
  await hold(page, 'ArrowUp', () => window.__t.length > 0, 20);
  const r = await page.evaluate(() => ({ map: ME.map, t: window.__t.join('/') }));
  assert.equal(r.map, 'office');
  assert.match(r.t, /역 앞은 Lv\.3/);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('4. 생활권 바깥 맵의 건물 칸은 모두 외관 스타일이 정해져 있고, 건물 안은 모두 실내 스타일이 있다', async () => {
  const { ctx, page } = await open();
  const r = await page.evaluate(() => {
    const miss = [], plain = [];
    ['town', 'villa', 'campus', 'center', 'market', 'office', 'station', 'bank'].forEach((k) => { const m = MAPS[k];
      m.rows.forEach((row, y) => [...row].forEach((c, x) => { if ('RHWD'.includes(c) && !bldAt(m, x, y)) miss.push(k + ' ' + x + ',' + y); })); });
    Object.keys(MAPS).forEach((k) => { const m = MAPS[k]; if (m.interior && (!m.floor || !m.wall)) plain.push(k); });
    const styles = new Set(); ['town', 'villa', 'campus', 'center', 'market', 'office', 'station', 'bank'].forEach((k) => (MAPS[k].blds || []).forEach((b) => styles.add(b.s)));
    return { miss, plain, styles: [...styles] };
  });
  assert.deepEqual(r.miss, [], '스타일 없는 건물 칸');
  assert.deepEqual(r.plain, [], '스타일 없는 실내');
  assert.ok(r.styles.length >= 7, '생활권에 쓰인 외관 스타일 ' + r.styles.join(','));
  await ctx.close();
});

test('5. 지도 이동 목록에 새 맵이 있고, 새 맵의 사람·물건·숨은 것에 모두 닿는다', async () => {
  const { ctx, page, logs } = await open();
  const r = await page.evaluate(() => {
    openTravel(); const names = [...document.querySelectorAll('#htravel button span')].map((e) => e.textContent);
    document.getElementById('htravel').hidden = true;
    const bad = [];
    ['villa', 'villa_new', 'villa_old', 'market', 'market_fish', 'market_food', 'station', 'station_hall'].forEach((k) => {
      const m = MAPS[k]; ME.map = k; S.onFoot = true; S.park = null;
      const sp = m.spawn, seen = new Set([sp.x + ',' + sp.y]), q = [[sp.x, sp.y]];
      while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, key = nx + ',' + ny;
        if (seen.has(key) || !walkable(m, nx, ny, 1, 'foot')) continue; seen.add(key); if (!warpAt(m, nx, ny)) q.push([nx, ny]); } }
      (m.spots || []).forEach((s) => { if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((s.x + dx) + ',' + (s.y + dy)))) bad.push(k + ' spot ' + (s.id || s.kind)); });
      (m.eggs || []).forEach((e) => { if (!seen.has(e.x + ',' + e.y)) bad.push(k + ' egg ' + e.id); });
      (m.spots || []).forEach((s) => { if (s.kind === 'talk' && !TALKS[s.id]) bad.push(k + ' talk ' + s.id); if (s.kind === 'thing' && !THINGS[s.id]) bad.push(k + ' thing ' + s.id); });
    });
    ME.map = 'town'; enterMap('town', 4, 4);
    return { names, bad };
  });
  for (const n of ['주택가', '전통시장', '역 앞']) assert.ok(r.names.includes(n), n + ' 이 목록에 있다');
  assert.deepEqual(r.bad, []);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('6. 시장 칼국숫집에서 사 먹을 수 있다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.onFoot = true; S.full = 40; enterMap('market_food', 2, 2); ME.dir = 3; });
  await page.keyboard.press(' ');
  await page.waitForSelector('#htutorop .topt', { timeout: 6000 });
  await page.locator('#htutorop .topt', { hasText: '먹을 것 사기' }).click();
  await page.waitForSelector('#htutorop .topt >> text=손칼국수', { timeout: 6000 });
  const opts = await page.$$eval('#htutorop .topt', (b) => b.map((x) => x.textContent));
  assert.ok(opts.some((t) => /손칼국수/.test(t)));
  await page.locator('#htutorop .topt', { hasText: '손칼국수' }).click();
  await sleep(page, 300);
  assert.ok(await page.evaluate(() => S.full > 40), '포만감이 찼다');
  assert.deepEqual(logs, []);
  await ctx.close();
});
