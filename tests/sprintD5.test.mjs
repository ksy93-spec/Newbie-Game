// 스프린트 D5: 여행 맵. 강릉·전주·부산·경주·대구가 도시마다 두세 맵이고, 전국 지도에서 경주·대구로 간다.
// 실행: node --test tests/sprintD5.test.mjs
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
    S.onboarded = true; S.demo = false; S.demoDone = 1; S.lv = 12; S.coin = 800; S.full = 100;
    S.tut = 1; S.tuts = ['intro', 'afterq', 'travel', 'check', 'needs', 'hungry', 'doors', 'room', 'gear', 'lv2', 'ep', 'pet', 'car', 'boss'];
    S.evDay = dayKey(); S.evN = 99;
    if (S.owned.indexOf('car') < 0) S.owned.push('car'); S.equip.mount = 'car'; S.onFoot = false; S.park = null;
    S.mq = { done: { job: 'good', lease: 'good', card: 'good', car: 'good', wedding: 'good' }, ann: {} };   // 경주·대구는 메인 5장 뒤에 열린다
    S.todayQ = pickDaily(); save(); render('home');
  });
  return { ctx, page, logs };
}
const sleep = (page, ms) => page.waitForTimeout(ms);
const CITIES = { gangneung: '강릉', jeonju: '전주', busan: '부산', gyeongju: '경주', daegu: '대구' };

test('1. 전국 지도에서 경주·대구로 달려가 도착하면 주차장에 차를 세운다', async () => {
  const { ctx, page, logs } = await open();
  for (const city of ['daegu', 'gyeongju']) {
    await page.evaluate(() => { S.onFoot = false; S.park = null; enterMap('korea', 8, 11); });
    const w = await page.evaluate((c) => MAPS.korea.warps.find((x) => x.to === c), city);
    assert.ok(w, city + ' 로 가는 길이 전국 지도에 있다');
    const reach = await page.evaluate((w) => !!pathTo(curMap(), w.x, w.y, 'car'), w);
    assert.ok(reach, city + ' 까지 고속도로가 이어져 있다');
    const coin0 = await page.evaluate(() => S.coin);
    await page.evaluate((w) => goTo(w.x, w.y, null), w);
    await page.waitForFunction((c) => ME.map === c, city, { timeout: 15000, polling: 100 });
    await sleep(page, 300);
    const st = await page.evaluate(() => ({ onFoot: S.onFoot, lot: S.park && tileAt(curMap(), S.park.x, S.park.y), coin: S.coin }));
    assert.equal(st.onFoot, true);
    assert.equal(st.lot, 'Q', '차는 주차장에');
    assert.ok(st.coin < coin0, '기름값을 냈다');
  }
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('2. 도시마다 맵이 두세 개이고, 모두 이어져 있으며 사람·볼거리·숨은 것이 있다', async () => {
  const { ctx, page } = await open();
  const r = await page.evaluate((CITIES) => {
    const out = {};
    Object.keys(CITIES).forEach((c) => {
      const ids = Object.keys(MAPS).filter((k) => k === c || k.indexOf(c + '_') === 0);
      // 첫 맵에서 문·가장자리로 닿는 맵
      const seen = new Set([c]), q = [c];
      while (q.length) { const k = q.shift(), m = MAPS[k];
        (m.warps || []).forEach((w) => { if (ids.includes(w.to) && !seen.has(w.to)) { seen.add(w.to); q.push(w.to); } });
        Object.values(m.edges || {}).forEach((t) => { if (!seen.has(t)) { seen.add(t); q.push(t); } }); }
      const talk = ids.some((k) => (MAPS[k].spots || []).some((s) => s.kind === 'talk' || s.kind === 'desk'));
      const thing = ids.some((k) => (MAPS[k].spots || []).some((s) => s.kind === 'thing'));
      const eggs = ids.reduce((n, k) => n + (MAPS[k].eggs || []).length, 0);
      const style = ids.filter((k) => !MAPS[k].interior).every((k) => MAPS[k].rows.join('').replace(/[^RHWD]/g, '').length === 0 || (MAPS[k].blds || []).length > 0);
      out[c] = { n: ids.length, linked: ids.every((k) => seen.has(k)), talk, thing, eggs, park: !!PARK_MAPS[c] && ids.every((k) => PARK_MAPS[k]), style };
    });
    return out;
  }, CITIES);
  for (const [c, v] of Object.entries(r)) {
    assert.ok(v.n >= 2 && v.n <= 3, `${c}: 맵 ${v.n}개`);
    assert.ok(v.linked, `${c}: 첫 맵에서 모두 닿는다`);
    assert.ok(v.talk && v.thing && v.eggs >= 2, `${c}: 사람·볼거리·숨은 것`);
    assert.ok(v.park, `${c}: 차는 세워 두고 걷는 곳`);
    assert.ok(v.style, `${c}: 건물 외관 스타일`);
  }
  await ctx.close();
});

test('3. 부산에서 걸어서 감천문화마을(북)과 자갈치시장(동)을 오간다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.onFoot = true; S.park = { map: 'busan', x: 0, y: 5, kind: 'car', id: 'car', dir: 2 }; enterMap('busan', 10, 3); });
  for (let i = 0; i < 8 && (await page.evaluate(() => ME.map)) === 'busan'; i++) { await page.keyboard.press('ArrowUp'); await sleep(page, 300); }
  assert.equal(await page.evaluate(() => ME.map), 'busan_gamcheon');
  for (let i = 0; i < 8 && (await page.evaluate(() => ME.map)) !== 'busan'; i++) { await page.keyboard.press('ArrowDown'); await sleep(page, 300); }
  assert.equal(await page.evaluate(() => ME.map), 'busan');
  await page.evaluate(() => enterMap('busan', 19, 4));
  for (let i = 0; i < 8 && (await page.evaluate(() => ME.map)) === 'busan'; i++) { await page.keyboard.press('ArrowRight'); await sleep(page, 300); }
  assert.equal(await page.evaluate(() => ME.map), 'busan_jagalchi');
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('4. 경주에서 세워 둔 차에 말을 걸면 전국 고속도로로 떠날 수 있다', async () => {
  const { ctx, page, logs } = await open();
  await page.evaluate(() => { S.onFoot = false; S.park = null; enterMap('korea', 18, 22); });
  await page.evaluate(() => { const w = MAPS.korea.warps.find((x) => x.to === 'gyeongju'); goTo(w.x, w.y, null); });
  await page.waitForFunction(() => ME.map === 'gyeongju', null, { timeout: 15000, polling: 100 });
  await sleep(page, 300);
  await page.evaluate(() => { const n = adjacentTo(curMap(), { x: S.park.x, y: S.park.y }); goTo(n.x, n.y, () => openCarTalk()); });
  await page.waitForSelector('#htutorop .topt', { timeout: 6000 });
  const opts = await page.$$eval('#htutorop .topt', (b) => b.map((x) => x.textContent));
  assert.ok(opts.some((t) => /전국 고속도로/.test(t)), opts.join('/'));
  await page.locator('#htutorop .topt', { hasText: '전국 고속도로' }).click();
  await page.waitForFunction(() => ME.map === 'korea', null, { timeout: 9000, polling: 100 });
  assert.equal(await page.evaluate(() => carOn()), true);
  assert.deepEqual(logs, []);
  await ctx.close();
});

test('5. 야시장·야경 맵은 밤빛이 덮여 낮 맵보다 어둡다', async () => {
  const { ctx, page } = await open();
  const lum = async (map) => page.evaluate((map) => { S.onFoot = true; S.park = null; const m = MAPS[map]; enterMap(map, m.spawn.x, m.spawn.y); drawScene();
    const cv = document.getElementById('scene'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let s = 0;
    for (let i = 0; i < d.length; i += 16) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 16); }, map);
  const day = await lum('jeonju'), night = await lum('jeonju_market'), night2 = await lum('gyeongju_tomb'), night3 = await lum('daegu_market');
  assert.ok(night < day * 0.85, `야시장 ${night.toFixed(0)} < 낮 ${day.toFixed(0)}`);
  assert.ok(night2 < day * 0.85 && night3 < day * 0.85);
  await ctx.close();
});

test('6. 새 여행지의 대화·볼거리·먹거리 데이터가 빠짐없이 있고, 도감에 경주·대구가 있다', async () => {
  const { ctx, page } = await open();
  const r = await page.evaluate((CITIES) => {
    const bad = [];
    Object.keys(MAPS).forEach((k) => { if (!Object.keys(CITIES).some((c) => k === c || k.indexOf(c + '_') === 0)) return;
      (MAPS[k].spots || []).forEach((s) => {
        if (s.kind === 'talk') { const T = TALKS[s.id]; if (!T) bad.push(k + ' talk ' + s.id); else if (T.food && !FOODS[T.food]) bad.push(k + ' food ' + T.food); }
        if (s.kind === 'thing' && !THINGS[s.id]) bad.push(k + ' thing ' + s.id); }); });
    return { bad, areas: EGG_AREAS.map((a) => a[1]) };
  }, CITIES);
  assert.deepEqual(r.bad, []);
  assert.ok(r.areas.includes('경주') && r.areas.includes('대구'));
  await ctx.close();
});
