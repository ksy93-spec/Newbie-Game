// UI 겹침 점검 공용 도구. 저장소 루트에서 실행한다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
const here = path.dirname(url.fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../../..');
export const DEMO = url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href;
export const IMG = path.join(ROOT, 'ops/review-1014/img');
export const TMP = path.join(ROOT, 'ops/review-1014/tmp');
fs.mkdirSync(IMG, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
export const SIZES = [[360, 640], [390, 844], [375, 667], [412, 915]];
export { chromium };

export async function openPage(browser, w, h, hash = '') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage(); const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e));
  await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(DEMO + hash);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  return { ctx, page, logs };
}

// 화면에 보이는 요소를 모아 겹침/잘림/글자넘침/작은 터치 칸을 계산한다. root: CSS 선택자(없으면 body)
export const AUDIT_SRC = `(opts) => {
  const vw = innerWidth, vh = innerHeight, out = { els: [], overlaps: [], off: [], overflow: [], small: [] };
  const root = opts.root ? document.querySelector(opts.root) : document.body;
  if (!root) return { missing: true, ...out };
  const nameOf = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 3).join('.') : '');
  const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    for (let p = e; p && p !== document.body; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || p.hidden || +c.opacity === 0) return false; }
    return true; };
  const sel = opts.sel || 'button, [role=button], .chip, .cchip, .guidechip, .mqchip, .menuchip, .zonetag, .nearbar, .placebar, .tutor, .toast, .dpad, .minimap, .tabbar, .hud, .sceneinfo, .itip, .travel, canvas, .mvbanner, .opt, .omb, .tb, input, a, [data-k]';
  const list = [...root.querySelectorAll(sel)].filter(vis);
  // 화면 바깥을 덮는 전체 배경은 비교에서 뺀다
  const clip = (e) => { const r0 = e.getBoundingClientRect(); let r = [r0.left, r0.top, r0.right, r0.bottom];
    for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) { const c = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(c.overflowX + c.overflowY) && p !== document.body) { const q = p.getBoundingClientRect();
        r = [Math.max(r[0], q.left), Math.max(r[1], q.top), Math.min(r[2], q.right), Math.min(r[3], q.bottom)]; } }
    return r; };
  for (const e of list) { const r0 = e.getBoundingClientRect(); const cr = clip(e); if (cr[2] - cr[0] < 2 || cr[3] - cr[1] < 2) continue;
    const r = { left: cr[0], top: cr[1], right: cr[2], bottom: cr[3], full: r0 };
    out.els.push({ n: nameOf(e), t: (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24), r: [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v * 10) / 10), full: [r.full.left, r.full.top, r.full.right, r.full.bottom], e }); }
  const skip = new Set((opts.skipPairs || []));
  const A = out.els;
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
    const a = A[i], b = A[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    if (opts.ignore && (opts.ignore.some((s) => a.e.matches(s) || b.e.matches(s)))) continue;
    const ix = Math.min(a.r[2], b.r[2]) - Math.max(a.r[0], b.r[0]), iy = Math.min(a.r[3], b.r[3]) - Math.max(a.r[1], b.r[1]);
    if (ix > 2 && iy > 2) out.overlaps.push({ a: a.n + '「' + a.t + '」', b: b.n + '「' + b.t + '」', w: Math.round(ix), h: Math.round(iy), ra: a.r, rb: b.r });
  }
  for (const a of A) { const [l, t, r, b] = a.r; const fr = a.full;
    if (a.e.tagName === 'CANVAS' && a.e.id !== 'hminicv' && !opts.canvasOff) continue;
    if (l < -1 || t < -1 || r > vw + 1 || b > vh + 1 || (fr[0] < -1 || fr[2] > vw + 1)) out.off.push({ n: a.n, t: a.t, r: a.r });
    const e = a.e; if (e.tagName !== 'CANVAS' && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) && getComputedStyle(e).overflow !== 'auto' && getComputedStyle(e).overflowY !== 'auto' && getComputedStyle(e).overflowY !== 'scroll')
      out.overflow.push({ n: a.n, t: a.t, sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight });
    if ((e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') && (fr[2] - fr[0] < 40 || fr[3] - fr[1] < 40)) out.small.push({ n: a.n, t: a.t, w: Math.round(fr[2] - fr[0]), h: Math.round(fr[3] - fr[1]) });
  }
  out.els = out.els.map((x) => ({ n: x.n, t: x.t, r: x.r }));
  return out; }`;

export async function audit(page, opts = {}) { return page.evaluate(`(${AUDIT_SRC})(${JSON.stringify(opts)})`); }

export function fmt(label, res) {
  const lines = [];
  for (const o of res.overlaps) lines.push(`  겹침 ${o.a} x ${o.b} ${o.w}x${o.h}px`);
  for (const o of res.off) lines.push(`  화면밖 ${o.n}「${o.t}」 ${o.r.join(',')}`);
  for (const o of res.overflow) lines.push(`  글자넘침 ${o.n}「${o.t}」 sw${o.sw}/cw${o.cw} sh${o.sh}/ch${o.ch}`);
  for (const o of res.small) lines.push(`  작은칸 ${o.n}「${o.t}」 ${o.w}x${o.h}`);
  return `[${label}]` + (lines.length ? '\n' + lines.join('\n') : ' 문제 없음');
}
export const shot = (page, name) => page.screenshot({ path: path.join(IMG, 'ui-' + name + '.png') });

// 홈을 만든다. 튜토리얼 말풍선은 기본으로 닫는다(dismiss=false면 그대로 둔다).
export async function homeSetup(page, extra, dismiss = true) {
  await page.evaluate(([extra, dismiss]) => { Object.assign(S, { status: '대학생', living: '자취', region: '수도권', age: 24, onboarded: true, tut: 1, tuts: dismiss ? TUT_STEPS.map((t) => t.id) : [] });
    S.tier = S.peak = S.paid = S.lastTier = 5; S.coin = 1000; S.claimed = dayKey(); if (extra) new Function('S', extra)(S); save(); render('home'); }, [extra || '', dismiss]);
  await page.waitForTimeout(600);
  await page.evaluate(() => { try { clearTimeout(toast.t); const t = document.getElementById('htoast'); if (t) t.hidden = true; } catch (e) {} });
  if (dismiss) { await page.evaluate(() => { try { if (typeof TUT !== 'undefined' && TUT) endTalk(); } catch (e) {} }); await page.waitForTimeout(300); }
}
