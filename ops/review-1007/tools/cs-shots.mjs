// CS 검수용 화면 캡처 + 글자 대비·크기 측정. 저장소 루트에서: node ops/review-1007/tools/cs-shots.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { PNG } = createRequire(import.meta.url)('pngjs');

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const IMG = path.join(root, 'ops/review-1007/img');
const OUT = path.join(root, 'ops/review-1007/tools/cs-audit.json');
fs.mkdirSync(IMG, { recursive: true });

const browser = await chromium.launch();
const audit = {};
const errors = [];

async function open({ w = 360, h = 640, dsf = 2, hash = '#nointro', reduce = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + hash);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  return { ctx, page };
}

async function setup(page, extra = {}) {
  await page.evaluate((x) => {
    S = fresh(); S.status = x.status || '직장인'; applyStarter();
    Object.assign(S, { years: 1, living: '자취', region: '수도권', age: 26, prep: '공채', company: '중소기업' });
    S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.prologue = 1; S.todayQ = pickDaily();
    Object.assign(S, x.s || {});
    save(); render('home');
  }, extra);
  await page.waitForTimeout(400);
}

// 보이는 글자마다 글자색과 실제 뒤 배경(조상 배경을 겹쳐 합성)의 대비, 글자 크기를 잰다.
async function measure(page, label) {
  const r = await page.evaluate(() => {
    function parse(c) { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(',').map((s) => parseFloat(s)); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
    function lum([r, g, b]) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
    function over(top, bot) { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; }
    function bgOf(el) {
      const stack = []; let e = el; let img = false;
      while (e && e.nodeType === 1) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (cs.backgroundImage && cs.backgroundImage !== 'none') img = true; if (c[3] > 0) stack.push(c); if (c[3] >= 1) break; e = e.parentElement; }
      let col = [255, 255, 255, 1]; if (!stack.length || stack[stack.length - 1][3] < 1) col = parse(getComputedStyle(document.body).backgroundColor);
      for (let i = stack.length - 1; i >= 0; i--) col = over(stack[i], col);
      return { col, img };
    }
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; const seen = new Set();
    while ((n = walker.nextNode())) {
      const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!t) continue;
      const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      const rect = el.getBoundingClientRect(); if (rect.width < 1 || rect.height < 1) continue;
      if (rect.bottom < 0 || rect.top > innerHeight) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      let op = 1, e2 = el; while (e2) { op *= parseFloat(getComputedStyle(e2).opacity); e2 = e2.parentElement; } if (op < 0.05) continue;
      if (el.closest('[hidden]')) continue;
      const fg = parse(cs.color); const { col, img } = bgOf(el); const f = over([fg[0], fg[1], fg[2], fg[3] * op], col);
      const L1 = lum(f), L2 = lum(col); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
      out.push({ x: rect.left, y: rect.top, w: rect.width, h: rect.height, t: t.slice(0, 40), fs: parseFloat(cs.fontSize), fw: cs.fontWeight, fg: hex(f), bg: hex(col), ratio: Math.round(ratio * 100) / 100, img, cls: el.className && String(el.className).slice(0, 30), shadow: cs.textShadow !== 'none' });
    }
    return out;
  });
  audit[label] = r;
  return r;
}

function lumHex(h) { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
function cr(a, b) { const A = lumHex(a), B = lumHex(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); }
async function shot(page, name, label) {
  await page.waitForTimeout(250);
  const buf = await page.screenshot({ path: path.join(IMG, 'cs-' + name + '.png') });
  if (label === false) return;
  const items = await measure(page, label || name);
  const png = PNG.sync.read(buf); const k = png.width / page.viewportSize().width;
  for (const e of items) {
    // 글자 상자 안 픽셀에서 가장 흔한 색을 배경으로 본다(도트 글꼴이라 글자 픽셀은 소수)
    const x0 = Math.max(0, Math.floor(e.x * k)), y0 = Math.max(0, Math.floor(e.y * k)), x1 = Math.min(png.width, Math.ceil((e.x + e.w) * k)), y1 = Math.min(png.height, Math.ceil((e.y + e.h) * k));
    const hist = new Map(); let tot = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * png.width + x) * 4; const hx = '#' + [png.data[i], png.data[i + 1], png.data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase(); hist.set(hx, (hist.get(hx) || 0) + 1); tot++; }
    if (!tot) continue;
    const top = [...hist.entries()].sort((a, b) => b[1] - a[1]);
    e.pbg = top[0][0];
    e.pratio = Math.round(cr(e.fg, e.pbg) * 100) / 100;
    // 화면에 실제로 찍힌 글자색: 배경 다음으로 흔한 색 가운데 계산한 글자색과 가장 가까운 것
    const near = top.slice(1, 8).map(([c]) => c).sort((a, b) => Math.abs(lumHex(a) - lumHex(e.fg)) - Math.abs(lumHex(b) - lumHex(e.fg)))[0];
    if (near) { e.pfg = near; e.pratio2 = Math.round(cr(near, e.pbg) * 100) / 100; }
  }
}

async function step(name, fn) { try { await fn(); console.log('ok', name); } catch (e) { console.log('FAIL', name, String(e).slice(0, 300)); } }

// 1. 시작 메뉴와 "처음부터 하기" 확인
await step('opening', async () => {
  const { ctx, page } = await open({ hash: '' });
  await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.prologue = 1; S.lv = 7; save(); });
  await page.reload();
  await page.waitForSelector('#opening .omb[data-k="cont"]', { timeout: 8000 });
  await shot(page, 'opening-menu');
  await page.click('#opening .omb[data-k="new"]');
  await page.waitForSelector('#opening .omb[data-k="wipe"]');
  await shot(page, 'opening-wipe-confirm');
  await ctx.close();
});

// 2. 온보딩
await step('onboard', async () => {
  const { ctx, page } = await open();
  await page.evaluate(() => { S = fresh(); save(); obStep = 0; obRender(); go('onboard'); });
  await shot(page, 'onboard-1');
  await ctx.close();
});

// 3. 홈과 탭들
await step('home+tabs', async () => {
  const { ctx, page } = await open();
  await setup(page);
  await page.evaluate(() => { try { endTalk(); } catch (e) {} });
  await shot(page, 'home');
  await page.evaluate(() => todaySheet()); await shot(page, 'today-sheet');
  await page.evaluate(() => closeTip());
  await page.evaluate(() => render('quests')); await shot(page, 'quests');
  await page.evaluate(() => render('char')); await shot(page, 'char');
  await page.evaluate(() => render('shop')); await shot(page, 'shop');
  await page.evaluate(() => render('wiki')); await shot(page, 'wiki');
  await page.evaluate(() => openCheck('lease')); await shot(page, 'check-lease');
  await page.evaluate(() => render('codex'));
  await page.evaluate(() => { const el = document.getElementById('csettings'); el.scrollIntoView({ block: 'start' }); });
  await shot(page, 'codex-settings');
  await page.evaluate(() => { document.getElementById('reset').scrollIntoView({ block: 'center' }); });
  await shot(page, 'codex-reset');
  // 처음부터 다시를 누르면 바로 지워지는지
  const before = await page.evaluate(() => ({ lv: S.lv, on: S.onboarded }));
  await page.evaluate(() => { S.lv = 9; save(); });
  await page.click('#reset');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ lv: S.lv, on: S.onboarded, screen: document.querySelector('.screen.on').id, tip: !document.getElementById('itip').hidden }));
  audit._resetTest = { before, after };
  await shot(page, 'codex-reset-after', false);
  await ctx.close();
});

// 4. 퀘스트 한 문항, 해설, 결과
await step('quest', async () => {
  const { ctx, page } = await open();
  await setup(page);
  await page.evaluate(() => { startQuest(QMAP.ju2); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { typeSkip(); } catch (e) {} });
  await page.waitForTimeout(500);
  await shot(page, 'quest-q');
  const btns = await page.$$('#qchoices .choice');
  if (btns.length) { await btns[btns.length - 1].click(); }
  await page.waitForTimeout(900);
  await shot(page, 'quest-explain');
  await ctx.close();
});

// 5. 보스 잠김 카드, 피로 토스트, 지도 잠김 토스트
await step('locks', async () => {
  const { ctx, page } = await open();
  await setup(page, { s: { energy: 3, full: 100 } });
  await page.evaluate(() => { try { endTalk(); } catch (e) {} render('quests'); document.getElementById('bosscards').scrollIntoView(); });
  await shot(page, 'boss-locked');
  await page.evaluate(() => { render('home'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { useFull('quest'); });
  await shot(page, 'toast-tired');
  await page.evaluate(() => { toast('아직 들어갈 방이 없어요. 주 스탯을 올려 거처를 해금하세요.'); });
  await shot(page, 'toast-nohouse', false);
  await ctx.close();
});

// 6. 생활 이벤트(￦와 원이 같이 나오는 자리)
await step('lifeevent', async () => {
  const { ctx, page } = await open();
  await setup(page, { s: { done: ['stu1'] } });
  await page.evaluate(() => { try { endTalk(); } catch (e) {}
    const e = LIFE_EV.find((x) => x.id === 'ev_trial');
    talkTo({ name: '생활 이벤트 · ' + e.who, face: null, lines: [e.text, { q: '어떻게 할까?', a: e.choices.map((c) => c.t), choose: function (k) { const c = e.choices[k]; return [c.msg + ' (−￦14)', '귀인 할배: "' + e.tip + '"']; } }] }); });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { try { typeSkip(); } catch (e) {} });
  await shot(page, 'lifeevent');
  await ctx.close();
});

// 7. 사건 결말(만원과 ￦가 한 화면에)
await step('epend', async () => {
  const { ctx, page } = await open();
  await setup(page);
  await page.evaluate(() => { const e = EPISODES[0]; EP = { e, i: e.beats.length, risk: 3, day: 1, spent: 300, picks: [e.beats[0].opts[1], e.beats[1].opts[0]] }; epEnd(); });
  await page.waitForTimeout(400);
  await shot(page, 'epend');
  await ctx.close();
});

// 8. 상점에서 돈이 모자란 줄
await step('shop-poor', async () => {
  const { ctx, page } = await open();
  await setup(page, { s: { coin: 10 } });
  await page.evaluate(() => { render('shop'); window.scrollTo(0, 0); const s = document.querySelector('#shop .scroll'); s.scrollTop = 400; });
  await shot(page, 'shop-poor');
  await ctx.close();
});

// 9. 광고 자리
await step('ad', async () => {
  const { ctx, page } = await open();
  await setup(page);
  await page.evaluate(() => { try { endTalk(); } catch (e) {} lockedDialog(QUESTS[QUESTS.length - 1]); });
  await shot(page, 'locked-quest');
  await ctx.close();
});

// 10. 알림 거부
await step('notif', async () => {
  const { ctx, page } = await open();
  await setup(page);
  await page.evaluate(() => { window.Notification = { permission: 'denied', requestPermission: () => Promise.resolve('denied') }; render('codex'); });
  await page.evaluate(() => { const rows = [...document.querySelectorAll('#csettings .item')]; const r = rows.find((b) => b.textContent.includes('출석 알림')); r.click(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => { document.getElementById('csettings').scrollIntoView({ block: 'start' }); });
  await shot(page, 'notif-denied');
  await ctx.close();
});

// 11. 줄인 움직임 설정에서 컷신 번쩍임이 남는지(메인 퀘스트 1장 첫 장면)
await step('reduced', async () => {
  const { ctx, page } = await open({ reduce: true });
  await setup(page);
  const has = await page.evaluate(() => typeof mqPlay === 'function' || typeof playMQ === 'function');
  audit._reduced = { mqfn: has, mm: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches) };
  await ctx.close();
});

// 12. 390, 412 폭에서 홈
for (const [w, h] of [[390, 844], [412, 915]]) {
  await step('home' + w, async () => {
    const { ctx, page } = await open({ w, h, dsf: 3 });
    await setup(page);
    await page.evaluate(() => { try { endTalk(); } catch (e) {} });
    await shot(page, 'home-' + w);
    await ctx.close();
  });
}

await browser.close();
fs.writeFileSync(OUT, JSON.stringify({ audit, errors }, null, 1));
console.log('errors', errors.length, errors.slice(0, 5));
