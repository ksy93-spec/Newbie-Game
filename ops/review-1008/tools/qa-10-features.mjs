// 리뷰 1007 새 기능 점검. node ops/review-1008/tools/qa-10-features.mjs [s|m]
import { open, closeBrowser, shot, sleep, screen, seed, clearOverlays, playQuest, walkToQuest, walkToSpot, openQuests, refill, installDateShim } from './qa-lib.mjs';
const view = process.argv[2] || 's';
const OUT = {};
const note = (k, v) => { OUT[k] = v; console.log(k, JSON.stringify(v)); };
async function step(name, fn) { try { await fn(); } catch (e) { note(name + '.EXC', String(e.message).split('\n')[0]); } }

// 1) 온보딩 자동 넘김
await step('onboard', async () => {
  const { page, logs } = await open({ url: (await import('./qa-lib.mjs')).BASE + '#nointro', view });
  await page.evaluate(() => { S = fresh(); save(); obStep = 0; obRender(); go('onboard'); });
  await sleep(300);
  const seq = [];
  for (let i = 0; i < 8; i++) {
    const st = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, step: obStep, key: obSteps()[obStep], q: (document.querySelector('#obbody .ob-q') || {}).textContent, nopt: document.querySelectorAll('#obbody .opt').length, next: document.getElementById('obnext').textContent }));
    seq.push(st);
    if (st.scr !== 'onboard') break;
    if (i === 0) await shot(page, `10-onboard-0-${view}`);
    if (st.nopt) { await page.locator('#obbody .opt').first().click(); await sleep(120); const mid = await page.evaluate(() => obStep); await sleep(400); const aft = await page.evaluate(() => ({ step: obStep, scr: document.querySelector('.screen.on').id })); seq.push({ pickedAt: st.step, at120: mid, at520: aft }); }
    else { await page.click('#obnext'); await sleep(400); }
  }
  note('onboard.seq', seq);
  // 빠르게 두 번(두 보기) 누르기: 한 단계 건너뛰는지
  await page.evaluate(() => { S = fresh(); save(); obStep = 0; obRender(); go('onboard'); });
  await sleep(200);
  await page.locator('#obbody .opt').nth(0).click(); await sleep(400);
  const s1 = await page.evaluate(() => obStep);
  await page.locator('#obbody .opt').nth(0).click(); await page.locator('#obbody .opt').nth(1).click().catch(() => {}); await sleep(600);
  note('onboard.doubletap', { before: s1, after: await page.evaluate(() => ({ step: obStep, key: obSteps()[obStep] })) });
  note('onboard.errors', logs);
  await page.context().close();
});

// 2) ☰ 메뉴, 3) 처음부터 다시 확인, 4) 맵 페이드, 5) 상점 확인
await step('home', async () => {
  const { page, logs } = await open({ view });
  await seed(page, '직장인', { coin: 900, lv: 5 });
  await clearOverlays(page);
  await shot(page, `10-home-${view}`);
  // 겹침: HUD 요소 상자
  const boxes = await page.evaluate(() => {
    const ids = ['hmenu', 'hmini', 'hmq', 'htoday', 'hpad', 'scene', 'tab-home'];
    const r = {}; ids.forEach((id) => { const e = document.getElementById(id); if (e && !e.hidden && e.offsetParent !== null) { const b = e.getBoundingClientRect(); r[id] = [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; } });
    // 지도 위 단추들 모두
    const btns = [...document.querySelectorAll('#home button')].filter((b) => b.offsetParent && b.getBoundingClientRect().width > 0).map((b) => { const x = b.getBoundingClientRect(); return { id: b.id || b.className.slice(0, 20), t: (b.innerText || b.getAttribute('aria-label') || '').slice(0, 12), r: [x.left, x.top, x.right, x.bottom].map(Math.round) }; });
    const ov = [];
    for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) { const a = btns[i].r, c = btns[j].r; const w = Math.min(a[2], c[2]) - Math.max(a[0], c[0]), h = Math.min(a[3], c[3]) - Math.max(a[1], c[1]); if (w > 2 && h > 2) ov.push([btns[i].id + '/' + btns[i].t, btns[j].id + '/' + btns[j].t, w, h]); }
    const off = btns.filter((b) => b.r[0] < 0 || b.r[2] > innerWidth + 1 || b.r[1] < 0 || b.r[3] > innerHeight + 1).map((b) => b.id + '/' + b.t + ' ' + b.r);
    return { r, ov, off, sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  note('home.layout', boxes);
  // ☰
  await page.click('#hmenu'); await sleep(500);
  const m1 = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, tabs: [...document.querySelectorAll('.screen.on .tab')].map((t) => t.innerText.trim()).join('|') }));
  await shot(page, `10-menu-${view}`);
  note('menu.open', m1);
  // 뒤로 가기(브라우저/안드로이드 back)
  await page.keyboard.press('Escape'); await sleep(400);
  note('menu.afterBack', { scr: await screen(page), url: page.url().split('#')[1] });
  if ((await screen(page)) !== 'home') await page.evaluate(() => render('home'));
  await sleep(300);
  // 처음부터 다시: 돌아가기 / 바탕 누르기 / 진짜 지우기
  await page.click('#hmenu'); await sleep(400);
  const rv = await page.$('#reset');
  note('reset.visible', rv ? await rv.isVisible() : 'no #reset');
  if (rv) {
    await rv.scrollIntoViewIfNeeded(); await rv.click(); await sleep(300);
    await shot(page, `10-reset-confirm-${view}`);
    const btns = await page.$$eval('#itipbox button', (bs) => bs.map((b) => b.innerText));
    await page.mouse.click(5, 5); await sleep(300);
    const afterBackdrop = await page.evaluate(() => ({ tipHidden: document.getElementById('itip').hidden, coin: S.coin, lv: S.lv }));
    await rv.click(); await sleep(300);
    await page.locator('#itipbox button', { hasText: '돌아가기' }).click(); await sleep(300);
    const afterCancel = await page.evaluate(() => ({ tipHidden: document.getElementById('itip').hidden, coin: S.coin, lv: S.lv, scr: document.querySelector('.screen.on').id }));
    note('reset.confirm', { btns, afterBackdrop, afterCancel });
  }
  await page.evaluate(() => render('home')); await sleep(400);
  // 맵 페이드: 지역 이동 때 hfade on 이 잠깐 켜지는지
  const fade = await page.evaluate(async () => {
    const f = document.getElementById('hfade'); const seen = []; const mo = new MutationObserver(() => seen.push(f.className));
    mo.observe(f, { attributes: true });
    const tgt = MAP_ORDER.find((id) => id !== ME.map.split('_')[0] && mapById(id) && mapOpen(id));
    enterMap(tgt, MAPS[tgt].spawn.x, MAPS[tgt].spawn.y);
    await new Promise((r) => setTimeout(r, 500)); mo.disconnect();
    const cs = getComputedStyle(f); return { tgt, seen, opacity: cs.opacity, pe: cs.pointerEvents, z: cs.zIndex };
  });
  note('mapfade', fade);
  // 상점 확인 창
  await page.evaluate(() => render('shop')); await sleep(500);
  await shot(page, `10-shop-${view}`);
  const c0 = await page.evaluate(() => S.coin);
  const item = page.locator('#shopbody .item:not([disabled])', { hasNotText: '보유' }).first();
  const itemName = await item.innerText().catch(() => '');
  await item.click(); await sleep(400);
  const sheet = await page.evaluate(() => ({ open: !document.getElementById('itip').hidden, txt: document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 160), btns: [...document.querySelectorAll('#itipbox button')].map((b) => b.innerText), coin: S.coin }));
  await shot(page, `10-shop-confirm-${view}`);
  // 바탕 누르면 닫히고 돈은 그대로
  await page.mouse.click(5, 5); await sleep(300);
  const afterClose = await page.evaluate(() => ({ open: !document.getElementById('itip').hidden, coin: S.coin }));
  // 다시 열고 사기 두 번 빨리
  await item.click(); await sleep(300);
  const buy = page.locator('#itipbox button').last();
  await buy.click(); await buy.click({ timeout: 500 }).catch(() => {}); await sleep(400);
  const afterBuy = await page.evaluate(() => ({ open: !document.getElementById('itip').hidden, coin: S.coin, toast: document.getElementById('htoast').hidden ? '' : document.getElementById('htoast').textContent }));
  // 세간·거처 탭 등 다른 줄도 확인 창이 있는지: 모든 탭
  const tabs = await page.$$eval('#shop .seg button, #shop [role=tab]', (bs) => bs.map((b) => b.innerText.trim())).catch(() => []);
  note('shop', { itemName: itemName.replace(/\s+/g, ' ').slice(0, 40), c0, sheet, afterClose, afterBuy, tabs });
  // 가난할 때 확인 창
  await page.evaluate(() => { S.coin = 5; renderShop(); });
  await sleep(200);
  const poor = await page.evaluate(() => { const b = [...document.querySelectorAll('#shopbody .item')].find((x) => !/보유/.test(x.innerText)); if (!b) return 'none'; b.click(); return { dis: b.disabled, open: !document.getElementById('itip').hidden, txt: document.getElementById('itipbox').innerText.replace(/\s+/g, ' ').slice(0, 120), btns: [...document.querySelectorAll('#itipbox button')].map((x) => x.innerText + (x.disabled ? '(off)' : '')) }; });
  note('shop.poor', poor);
  await shot(page, `10-shop-poor-${view}`);
  await page.evaluate(() => closeTip());
  note('home.errors', logs);
  await page.context().close();
});

// 6) 결과 count-up, 광고 버튼 경합, 7) 보스 반복 보상, 8) 욕구 하한 40
await step('play', async () => {
  const { page, logs } = await open({ view });
  await installDateShim(page);
  await page.reload(); await page.waitForFunction(() => window.S && window.QUESTS);
  await seed(page, '취준생', { done: [] });
  await clearOverlays(page);
  await refill(page);
  // 결과 화면: S.done > 3 이어야 광고가 나온다 → 가짜로 4개 넣고 퀘스트 하나
  await page.evaluate(() => { const f = QUESTS.filter((q) => fits(q) && !q.trip).slice(-4).map((q) => q.id); S.done = S.done.concat(f); save(); });
  const ids = await openQuests(page);
  const wr = await walkToQuest(page, ids[0]);
  note('play.walk', { id: ids[0], wr });
  if (wr === 'ok') {
    const samples = [];
    await page.waitForFunction(() => !document.getElementById('qnext').hidden, null, { timeout: 15000 });
    // playQuest 끝나는 순간부터 표본
    const end = await playQuest(page, { acc: 1 });
    for (let i = 0; i < 6; i++) { samples.push(await page.evaluate(() => document.getElementById('rxp').textContent)); await sleep(120); }
    await shot(page, `10-result-${view}`);
    note('countup', { end, samples });
    // 광고 버튼을 count-up 도중 누르기
    const rd = await page.$('#rdbl button');
    note('result.adbtn', rd ? await rd.innerText() : 'none');
    const rlay = await page.evaluate(() => { const r = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return [b.top, b.bottom].map(Math.round); }; return { rback: r('rback'), rdbl: r('rdbl'), ih: innerHeight, sh: document.querySelector('#result .scroll') ? document.querySelector('#result .scroll').scrollHeight : null }; });
    note('result.layout', rlay);
    await page.click('#rback'); await sleep(900); await clearOverlays(page);
  }
  // 욕구 하한: 깨끗함 100에서 이틀 지나기
  const decay = await page.evaluate(() => { S.clean = 100; S.mood = 100; S._cleanAt = Date.now(); S._moodAt = Date.now(); window.__shift(2 * 86400000); needTick(); const a = { clean: S.clean, mood: S.mood }; S.clean = 35; S._cleanAt = Date.now() - 3 * 86400000; needTick(); a.from35 = S.clean; S.clean = 41; S._cleanAt = Date.now() - 86400000; needTick(); a.from41 = S.clean; return a; });
  note('decay', decay);
  // 퀘스트로 깨끗함이 40 아래로 내려가는지(행동 감소)
  const act = await page.evaluate(() => { S.clean = 40; S.full = 100; S.energy = 100; S._cleanAt = Date.now(); for (let i = 0; i < 5; i++) useFull('quest'); return S.clean; });
  note('decay.byAction', act);
  // 보스 반복 보상: 첫 보스를 이미 이긴 상태로, 같은 날 두 번 이기기
  const bid = await page.evaluate(() => { const b = BOSSES[0]; S.bossDone = [b.id]; S.stats[b.stat] = Math.max(S.stats[b.stat], b.need); S.lv = Math.max(S.lv, 8); save(); return { id: b.id, ready: bossReady(b) }; });
  note('boss.seed', bid);
  const coins = [];
  for (let k = 0; k < 2; k++) {
    await refill(page);
    const c0 = await page.evaluate(() => S.coin);
    if (k === 0) { const r = await walkToSpot(page, 'boss', bid.id); note('boss.walk', r); }
    else await page.evaluate((id) => startBoss(BOSSES.find((b) => b.id === id)), bid.id);
    try { await page.waitForFunction(() => document.getElementById('boss').classList.contains('on'), null, { timeout: 5000 }); } catch (e) { note('boss.notstarted' + k, await page.evaluate(() => document.getElementById('itipbox').innerText.slice(0, 120))); break; }
    await page.waitForFunction(() => !document.getElementById('bnext').hidden, null, { timeout: 15000 });
    await page.click('#bnext');
    for (let i = 0; i < 25; i++) {
      if ((await screen(page)) !== 'boss') break;
      await page.evaluate(() => typeSkip());
      await page.waitForFunction(() => !document.getElementById('bchoices').hidden || !document.getElementById('bnext').hidden, null, { timeout: 8000 });
      const ok = await page.evaluate(() => FIGHT && FIGHT.b.qs[FIGHT.i] && FIGHT.b.qs[FIGHT.i].ok);
      const ch = await page.$(`#bchoices:not([hidden]) .choice[data-orig="${ok}"]:not([disabled])`);
      if (ch) await ch.click();
      await page.waitForFunction(() => !document.getElementById('bnext').hidden, null, { timeout: 8000 });
      await page.click('#bnext'); await sleep(150);
    }
    const res = await page.evaluate(() => ({ scr: document.querySelector('.screen.on').id, big: document.getElementById('bebig').textContent, body: document.getElementById('bebody').innerText.replace(/\s+/g, ' ').slice(0, 160), coin: S.coin }));
    coins.push({ c0, ...res });
    await shot(page, `10-bossend-${k}-${view}`);
    await page.click('#beback'); await sleep(1200); await clearOverlays(page);
  }
  // 다음 날 한 번 더(￦30 다시 나오는지)
  await page.evaluate(() => { window.__shift(3 * 86400000); __shiftDay(0); });
  await refill(page);
  const c0 = await page.evaluate(() => S.coin);
  await page.evaluate((id) => startBoss(BOSSES.find((b) => b.id === id)), bid.id);
  note('boss.coins', coins);
  note('play.errors', logs);
  await page.context().close();
});
await closeBrowser();
