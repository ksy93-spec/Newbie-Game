// CX 점검 2: 성공 결과(보상 순간), 레벨 업, 시트 위 토스트, 지도 픽셀 배율, 탭 전환 시간.
// 실행: node ops/review-1007/tools/cx-shots2.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../..');
const BASE = url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro';
const IMG = path.resolve(here, '../img');
const OUT = path.resolve(here, 'cx-metrics2.json');
const browser = await chromium.launch();
const res = {};

const base = () => {
  S = fresh(); S.status = '직장인'; applyStarter();
  Object.assign(S, { years: 2, living: '자취', region: '수도권', age: 27, company: '중소기업' });
  S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.prologue = 1; S.coin = 1240; S.lv = 4; S.xp = 270; S.tipTools = 1;
  S.done = QUESTS.slice(0, 6).map((q) => q.id);
  save(); rollDay(); S.todayQ = pickDaily(); save();
};

for (const vp of [{ w: 360, h: 640, k: '360' }, { w: 390, h: 844, k: '390' }, { w: 412, h: 915, k: '412', dpr: 2.625 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr || 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(base);
  await page.evaluate(() => render('home'));
  await page.waitForTimeout(1500);
  await page.evaluate(() => { closeTip(); if (window.TUT) endTalk(); });

  // 지도 배율
  res['map-' + vp.k] = await page.evaluate(() => {
    const cv = document.getElementById('scene'); const r = cv.getBoundingClientRect();
    return { canvasW: cv.width, cssW: r.width, dpr: devicePixelRatio, cssPerArtPx: +(r.width / SW).toFixed(3),
      devPerArtPx: +(r.width * devicePixelRatio / SW).toFixed(3), devPerCanvasPx: +(r.width * devicePixelRatio / cv.width).toFixed(3), RES, SW, SH };
  });
  if (vp.k === '412') { await page.screenshot({ path: path.join(IMG, 'cx-home-mid-412.png') }); }

  // 탭 전환: 눌러서 화면이 바뀌기까지, 전환 연출 여부
  res['tab-' + vp.k] = await page.evaluate(async () => {
    const t0 = performance.now(); document.querySelector('#tab-home .tab:nth-child(4)').click();
    const t1 = performance.now();
    const shop = document.getElementById('shop'); const cs = getComputedStyle(shop);
    return { ms: +(t1 - t0).toFixed(1), transition: cs.transition, animation: cs.animationName, on: shop.classList.contains('on') };
  });

  if (vp.k === '412') { await ctx.close(); continue; }

  // 성공 결과: 정답만 고른다
  await page.evaluate(() => render('home'));
  await page.waitForTimeout(500);
  await page.evaluate(() => { const q = todayList().find((q) => qOpen(q)) || QUESTS.find((q) => qOpen(q) && S.done.indexOf(q.id) < 0); startQuest(q); });
  await page.waitForFunction(() => document.getElementById('quest').classList.contains('on'), null, { timeout: 8000 });
  for (let i = 0; i < 40; i++) {
    const on = await page.evaluate(() => document.querySelector('.screen.on').id);
    if (on === 'result') break;
    await page.evaluate(() => {
      typeSkip();
      const n = document.getElementById('qnext');
      const ch = [...document.querySelectorAll('#qchoices .choice')];
      if (ch.length && !document.getElementById('qchoices').hidden && !ch.some((b) => b.disabled)) {
        const ok = RUN.q.qs[RUN.i].ok; const b = ch.find((b) => +b.dataset.orig === ok); b.click(); return; }
      if (n && !n.hidden) n.click();
    });
    await page.waitForTimeout(500);
  }
  // 결과가 뜬 직후 0.1초, 0.6초에 찍어 연출이 있는지 본다
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(IMG, `cx-result-win-a-${vp.k}.png`) });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(IMG, `cx-result-win-${vp.k}.png`) });
  res['result-' + vp.k] = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#result .scroll > *')].filter((e) => e.offsetParent);
    return els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return { id: e.id || e.className, y: Math.round(r.y), h: Math.round(r.height), anim: cs.animationName, txt: e.textContent.trim().slice(0, 30) }; });
  });
  await page.evaluate(() => { document.getElementById('rback').click(); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(IMG, `cx-home-after-${vp.k}.png`) });

  // 시트 위에 토스트
  await page.evaluate(() => { closeTip(); if (window.TUT) endTalk(); render('char'); houseTip(8); toast('코인이 모자라요.'); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(IMG, `cx-sheet-toast-${vp.k}.png`) });
  res['sheettoast-' + vp.k] = await page.evaluate(() => {
    const t = document.getElementById('htoast'), b = document.getElementById('itip');
    const tr = t.getBoundingClientRect(); const x = tr.x + tr.width / 2, y = tr.y + tr.height / 2;
    const top = document.elementFromPoint(x, y);
    return { toastZ: getComputedStyle(t).zIndex, sheetZ: getComputedStyle(b).zIndex, topAtToast: top && (top.id || top.className), toastRect: [Math.round(tr.x), Math.round(tr.y), Math.round(tr.width), Math.round(tr.height)] };
  });
  await page.evaluate(() => closeTip());
  await ctx.close();
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
await browser.close();
console.log(JSON.stringify(res, null, 1));
