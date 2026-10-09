// QA 공용 도우미. 저장소 루트에서 node로 실행하는 스크립트가 불러 쓴다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
const { chromium } = await import('playwright');
export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
export const BASE = process.env.QA_BASE || 'http://127.0.0.1:8765/prototype/newbie-quest-demo.html';
export const IMG = path.join(ROOT, 'ops/review-1009/img');
export const STATE = '/tmp/claude-0/-home-user-Newbie-Game/887117d1-4617-5cc3-8513-2fb8b844491c/scratchpad';
fs.mkdirSync(STATE, { recursive: true });

export async function launch(vw, vh, storage) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, hasTouch: true, storageState: storage || undefined });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  return { browser, ctx, page, logs };
}
export const tag = (vw) => (vw === 360 ? 's' : 'm');
export async function shot(page, name) { await page.screenshot({ path: path.join(IMG, 'qa-' + name + '.png') }); }
export const wait = (page, ms) => page.waitForTimeout(ms);

// 컷신을 실제 탭으로 넘긴다. 보기 장면은 탭으로 못 고르면 MQP.pick(0).
export async function tapCine(page, { max = 400, picks = [], onScene } = {}) {
  let n = 0, k = 0, used = [], seen = [];
  for (; n < max; n++) {
    const s = await page.evaluate(() => { const o = document.getElementById('opening'); if (!o) return null;
      if (!window.MQP) return { mq: false, menu: !!o.querySelector('.omenu:not([hidden])') };
      const p = MQP.list()[MQP.cur()] || {}; return { mq: true, choice: !!p.choice, picked: MQP.picked, text: (p.text || []).join(' '), type: p.type || '', who: p.who || '' }; });
    if (!s) break;
    if (s.menu) break;
    if (s.mq && s.text && seen[seen.length - 1] !== s.text) { seen.push(s.text); if (onScene) await onScene(s, seen.length); }
    if (s.mq && s.choice && s.picked === null) {
      await page.waitForTimeout(250);
      // 먼저 실제 탭으로 보기 위치를 눌러 본다는 건 캔버스 좌표라 어렵다. 필요할 때만 MQP.pick
      const j = picks[k++] ?? 0; used.push(j);
      await page.evaluate((j) => MQP.pick(j), j);
    } else {
      const box = await page.locator('#opening canvas').boundingBox().catch(() => null);
      if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.4);
      else await page.mouse.click(180, 300);
    }
    await page.waitForTimeout(120);
  }
  await page.waitForFunction(() => !document.getElementById('opening'), null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(300);
  return { taps: n, picks: used, scenes: seen };
}
// 부동산 사장 등 대화 상자를 탭으로 닫는다.
export async function tapTutor(page, { max = 60 } = {}) {
  const lines = [];
  for (let i = 0; i < max; i++) {
    const v = await page.evaluate(() => { const e = document.getElementById('htutor'); return e && !e.hidden ? { nm: document.getElementById('htutornm').textContent, tx: document.getElementById('htutortx').textContent, op: document.querySelectorAll('#htutorop:not([hidden]) .topt').length } : null; });
    if (!v) break;
    if (lines[lines.length - 1] !== v.tx) lines.push(v.nm + ': ' + v.tx);
    if (v.op) await page.locator('#htutorop .topt').first().click();
    else await page.locator('#htutor').click({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(150);
  }
  return lines;
}
// 가로 넘침: 화면 밖으로 나간 보이는 요소
export async function overflow(page, sel = 'body') {
  return page.evaluate((sel) => { const W = innerWidth, out = [];
    if (document.documentElement.scrollWidth > W + 1) out.push('page scrollWidth ' + document.documentElement.scrollWidth);
    document.querySelectorAll(sel + ' *').forEach((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if (!r.width || cs.visibility === 'hidden' || cs.display === 'none' || e.closest('[hidden]')) return;
      if (r.right > W + 1 || r.left < -1) { let p = e.parentElement, clip = false; while (p) { const c = getComputedStyle(p); if (/(hidden|auto|scroll|clip)/.test(c.overflowX)) { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1) { clip = true; break; } } p = p.parentElement; }
        if (!clip) out.push((e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + [...e.classList].join('.')) + ' ' + Math.round(r.left) + '..' + Math.round(r.right) + ' "' + (e.textContent || '').trim().slice(0, 30) + '"'); } });
    return [...new Set(out)].slice(0, 15); }, sel);
}
export async function visButtons(page) {
  return page.evaluate(() => [...document.querySelectorAll('button, [role=button], .chip')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && !b.closest('[hidden]') && getComputedStyle(b).visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight; })
    .map((b) => (b.id ? '#' + b.id : '') + '[' + (b.textContent || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 28) + ']').slice(0, 60));
}
// 점이 가리키는 요소가 정말 그 버튼인가(덮개가 탭을 먹는지)
export async function hitTest(page, selector) {
  return page.evaluate((sel) => { const b = document.querySelector(sel); if (!b) return 'missing'; const r = b.getBoundingClientRect(); if (!r.width) return 'zero-size';
    const x = r.left + r.width / 2, y = r.top + r.height / 2; if (y > innerHeight || y < 0) return 'offscreen y=' + Math.round(y);
    const t = document.elementFromPoint(x, y); return t === b || b.contains(t) ? 'ok' : 'covered by ' + (t ? (t.id ? '#' + t.id : t.tagName + '.' + t.className) : 'null'); }, selector);
}
export const st = (page) => page.evaluate(() => ({ slot: SLOT, mode: S.mode, age: S.life && S.life.age, tier: S.tier, tierName: TIERS[S.tier].name, peak: S.peak, status: S.status, coin: S.coin, lv: S.lv, done: S.done.length, tuts: S.tuts, mq: S.mq && S.mq.done, hud: (document.getElementById('hnm') || {}).textContent, hsub: (document.getElementById('hsub') || {}).textContent, living: S.living, prof: S.life && S.life.prof && S.life.prof.living }));
