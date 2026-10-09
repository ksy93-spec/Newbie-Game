// 개발 리뷰(dev.md) 확인용. 실행: node ops/review-1009/tools/dev-probe.mjs (저장소 루트에서)
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');
const { buildBeforeScript, AFTER_SCRIPT } = await import('../../../src/bridge/injected.mjs');

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(root, 'ops/review-1009/img');
const browser = await chromium.launch();
const out = {};
const errs = [];

async function open({ hash = '#nointro', seed = null, bridge = false, mirror = null, vp = [390, 844] } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(String(e)));
  if (seed) await page.addInitScript((kv) => { if (!sessionStorage.getItem('seeded')) { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, seed);
  if (bridge) {
    await page.addInitScript(() => { window.__posts = []; window.ReactNativeWebView = { postMessage: (m) => window.__posts.push(JSON.parse(m)) }; });
    await page.addInitScript(buildBeforeScript({ mirror }));
  }
  await page.goto(BASE + hash);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  if (bridge) await page.evaluate(AFTER_SCRIPT);
  return { ctx, page };
}
// 카드의 거처(본가·기숙사·자취)를 골라 인생을 시작한다
const MAKE = (living) => {
  lifeNew();
  let p = null; for (let i = 0; i < 5000 && !p; i++) { const q = lifeGen(lifeSeedNew()); if (q.living === living && q.income !== '넉넉') p = q; }
  S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; save(); render('home'); hudRefresh();
};
const dump = () => Object.fromEntries(['nq.v8', 'nq.life.v1', 'nq.album.v1', 'nq.slot'].map((k) => [k, localStorage.getItem(k)]).filter(([, v]) => v != null));

// 1. 앱 브릿지 미러: 인생 저장이 네이티브로 가는가
{
  const { ctx, page } = await open({ bridge: true });
  await page.evaluate(MAKE, '본가');
  await page.evaluate(() => { S.coin = 777; save(); window.__nqFlush && window.__nqFlush(); });
  await page.waitForTimeout(1300);
  const r = await page.evaluate(() => ({ posts: __posts.filter((m) => m.type === 'save').map((m) => Object.keys(JSON.parse(m.data)).includes('life') ? 'life' : 'normal-or-other'), keys: Object.keys(localStorage) }));
  const mirror = (await page.evaluate(() => __posts.filter((m) => m.type === 'save').pop()?.data)) ?? null;
  await ctx.close();
  // 재설치: 웹뷰 저장이 비고 네이티브 미러만 남는다
  const re = await open({ bridge: true, mirror });
  out.bridge = { savePosts: r.posts, lsKeys: r.keys, afterReinstall: await re.page.evaluate(() => ({ slot: SLOT, mode: S.mode, onboarded: S.onboarded, coin: S.coin, life: !!localStorage.getItem('nq.life.v1') })) };
  await re.ctx.close();
}

// 2. 전역 TIERS 덮어쓰기: 시작 메뉴의 "이어하기 · 일반" 줄, 앨범의 "멈춘 인생" 거처 이름
{
  const { ctx, page } = await open();
  await page.evaluate(() => { S.onboarded = true; S.status = '직장인'; S.tier = 0; S.lv = 3; save(); });
  await page.evaluate(MAKE, '본가');
  const seed = await page.evaluate(dump);
  await ctx.close();
  const m = await open({ hash: '', seed });
  await m.page.waitForSelector('#opening .omb[data-k="cont"]', { timeout: 10000 });
  out.menuNormalLine = await m.page.textContent('#opening .omb[data-k="cont"]');
  await m.page.screenshot({ path: path.join(IMG, 'dev-menu-tiername.png') });
  await m.ctx.close();
  // 일반 칸에서 인생 모드 → 새로 태어나기: 멈춘 인생(본가 방)이 앨범에 무엇으로 남나
  const a = await open({ seed: { ...seed, 'nq.slot': 'normal' } });
  out.albumStopped = await a.page.evaluate(() => { const before = SLOT; lifeNew(); return { before, tier: albumLoad()[0].tier, title: albumLoad()[0].titleName }; });
  await a.ctx.close();
}

// 3. 건너뛴 칸(움막·텐트·찜질방, 기숙사의 노숙)이 거처 목록에서 열려 있다
{
  const { ctx, page } = await open();
  out.skipped = await page.evaluate((mk) => {
    const r = {};
    for (const lv of ['본가', '기숙사']) {
      eval('(' + mk + ')')(lv); S.stats.ju = 30; S.coin = 500; tierGrow();
      r[lv] = { peak: S.peak, costs: [0, 1, 2, 3].map((i) => [TIERS[i].name, tierCost(i)]) };
      houseTip(lv === '본가' ? 1 : 0);
      r[lv].btn = [...document.querySelectorAll('#itipbox button')].map((b) => b.textContent).join(' | ');
      closeTip(); const mv = tierMove(lv === '본가' ? 1 : 0); r[lv].moved = mv.ok ? TIERS[S.tier].name : null;
    }
    return r;
  }, MAKE.toString());
  await ctx.close();
}

// 4. 2장(전세)을 이사부터 시작하면 스물여섯 세월 컷신과 나이가 빠진다
{
  const { ctx, page } = await open();
  await page.evaluate(MAKE, '자취');
  out.leaseViaMove = await page.evaluate(() => {
    S.mq.done.job = 'good'; S.life.yrs.job = 1; S.life.anch = { age: 24, done: S.done.length }; S.peak = 8; S.coin = 900; save();
    leaseGate(7); leaseShow();
    return { kicker: MQP && MQP.o.kicker, title: MQP && MQP.o.title, yrsLease: !!S.life.yrs.lease, age: S.life.age };
  });
  await ctx.close();
}

// 5. mqStart 재진입: 세월 컷신 → 같은 장이 이어서 열리나 (1장, 2장)
for (const id of ['job', 'lease']) {
  const { ctx, page } = await open();
  await page.evaluate(MAKE, '자취');
  await page.evaluate((id) => { if (id === 'lease') { S.mq.done.job = 'good'; S.life.yrs.job = 1; } mqStart(id); }, id);
  await page.waitForFunction(() => !!window.MQP, null, { timeout: 5000 });
  const first = await page.evaluate(() => MQP.o.kicker);
  const t0 = Date.now(); let second = null;
  while (Date.now() - t0 < 20000) {
    const s = await page.evaluate(() => window.MQP ? MQP.o.kicker || 'MQ' : null);
    if (s && s !== 'LIFE') { second = await page.evaluate(() => MQP.o.title); break; }
    await page.evaluate(() => window.MQP && MQP.next({ type: 'test' })); await page.waitForTimeout(40);
  }
  out['reentry_' + id] = { first, second, yrs: await page.evaluate(() => Object.keys(S.life.yrs)), age: await page.evaluate(() => S.life.age) };
  await ctx.close();
}

// 6. 6장을 깬 뒤 lifeEnd 전에 앱이 닫히면 / lifeEnd 컷신 중에 닫히면
{
  const { ctx, page } = await open();
  await page.evaluate(MAKE, '자취');
  await page.evaluate(() => { MQ_LIST.forEach((c) => { S.mq.done[c.id] = 'good'; S.life.yrs[c.id] = 1; }); S.tier = S.peak = 9; save(); });
  await page.reload(); await page.waitForFunction(() => window.S && window.QUESTS);
  await page.waitForTimeout(4000);
  out.closedBeforeEnd = await page.evaluate(() => ({ over: S.life.over, age: S.life.age, next: mqNext(), hud: document.getElementById('hnm').textContent }));
  await page.evaluate(() => lifeEnd());
  await page.waitForFunction(() => !!window.MQP);
  await page.reload(); await page.waitForFunction(() => window.S && window.QUESTS); await page.waitForTimeout(1500);
  out.closedMidEnd = await page.evaluate(() => ({ over: S.life.over, album: albumLoad().length, tipOpen: !document.getElementById('itip').hidden }));
  await ctx.close();
  const seed = await (async () => { const o = await open(); await o.page.evaluate(MAKE, '자취'); await o.page.evaluate(() => { S.life.over = true; S.life.age = 60; save(); }); const d = await o.page.evaluate(dump); await o.ctx.close(); return d; })();
  const m = await open({ hash: '', seed });
  await m.page.waitForSelector('#opening .omb', { timeout: 10000 });
  out.menuAfterOver = await m.page.$$eval('#opening .omb', (bs) => bs.map((b) => b.dataset.k));
  await m.ctx.close();
}

// 7. hudName이 읽기만 하지 않는다 / 세월 컷신 위에 나이 토스트
{
  const { ctx, page } = await open();
  await page.evaluate(MAKE, '자취');
  out.hudSide = await page.evaluate(() => { S.done.push('a1', 'a2', 'a3'); const b = localStorage.getItem('nq.life.v1'); const a0 = S.life.age; hudName(); return { ageBefore: a0, ageAfter: S.life.age, wrote: localStorage.getItem('nq.life.v1') !== b }; });
  await page.evaluate(() => lifeBeforeCh('job', () => {}));
  await page.waitForTimeout(900);
  out.toastOverCine = await page.evaluate(() => ({ mqp: !!MQP, toast: document.getElementById('htoast').hidden ? null : document.getElementById('htoast').textContent }));
  await page.screenshot({ path: path.join(IMG, 'dev-toast-over-cine.png') });
  await ctx.close();
}

// 8. dripEnsure 인생 분기 비용
{
  const { ctx, page } = await open();
  await page.evaluate(MAKE, '자취');
  const life = await page.evaluate(() => { let n = 0; const o = dripEnsure; dripEnsure = function () { n++; return o.apply(this, arguments); };
    const t = performance.now(); for (let i = 0; i < 20; i++) { openLeft(); dripLocked(); } const ms = performance.now() - t; dripEnsure = o; return { ms: Math.round(ms), calls: n, quests: QUESTS.length }; });
  await page.evaluate(() => { switchSlot('normal'); S.onboarded = true; S.status = '직장인'; save(); });
  const normal = await page.evaluate(() => { const t = performance.now(); for (let i = 0; i < 20; i++) { openLeft(); dripLocked(); } return Math.round(performance.now() - t); });
  out.drip = { life, normalMs: normal };
  await ctx.close();
}

// 9. 처음 켠 사람: 저장 없이 메뉴부터 인생 모드 (두 화면 크기)
for (const vp of [[360, 640], [390, 844]]) {
  const { ctx, page } = await open({ hash: '', vp });
  await page.waitForSelector('#opening .omb[data-k="life"]', { timeout: 10000 });
  await page.click('#opening .omb[data-k="life"]');
  await page.waitForFunction(() => document.getElementById('onboard').classList.contains('on') && !document.getElementById('opening'), null, { timeout: 8000 });
  await page.click('#obnext');
  await page.waitForFunction(() => S.onboarded && S.life.applied, null, { timeout: 5000 });
  out['first_' + vp.join('x')] = await page.evaluate(() => ({ slot: SLOT, keys: Object.keys(localStorage).filter((k) => k.startsWith('nq')) }));
  await page.screenshot({ path: path.join(IMG, `dev-first-${vp.join('x')}.png`) });
  await ctx.close();
}

out.pageErrors = errs;
console.log(JSON.stringify(out, null, 1));
await browser.close();
