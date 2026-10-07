// 마케팅·첫인상: 첫 홈에서 안내 칩·방향키·알림이 겹치는지 잰다
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path';
import url from 'node:url';
const { chromium } = await import('playwright');
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(root, 'prototype/newbie-quest-demo.html')).href;
const browser = await chromium.launch();
for (const [w, h] of [[360, 640], [390, 844], [412, 915]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await page.goto(BASE + '#nointro');
  await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
  await page.evaluate(() => { S = fresh(); S.status = '취준생'; applyStarter(); Object.assign(S, { prep: 0, region: '수도권' }); S.onboarded = true; S.tut = 1; S.tuts = ['intro']; S.prologue = 1; S.todayQ = pickDaily(); save(); render('home'); autoClaim(); });
  await page.waitForTimeout(1700);
  const r = await page.evaluate(() => {
    const R = (e) => { if (!e || e.hidden) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) }; };
    const pad = [...document.querySelectorAll('#hdpad button')].map(R);
    const chip = R(document.getElementById('hguide')), toast = R(document.getElementById('htoast')), mini = R(document.getElementById('hmini'));
    const hit = (a, b) => a && b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
    const stage = R(document.querySelector('#home .stagebox'));
    return { chip, toast, mini, pad, stage, chipHitsPad: pad.some((p) => hit(p, chip)), toastHitsChip: hit(toast, chip), mapShare: stage ? +((stage.b - stage.t) / innerHeight).toFixed(2) : null };
  });
  console.log(w + 'x' + h, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
