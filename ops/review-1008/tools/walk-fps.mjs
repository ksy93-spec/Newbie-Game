// 걷는 동안 초당 그리기 횟수와 한 번 그리는 시간(CPU 4배 감속)
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.tut = 1; S.tuts = ['intro','afterq','travel','check','needs','hungry','doors','room','gear','lv2','ep','pet','car','boss']; save(); render('home'); });
await page.waitForTimeout(800);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const r = await page.evaluate(async () => {
  const orig = drawScene; let n = 0, t = 0; window.drawScene = function () { const a = performance.now(); orig(); t += performance.now() - a; n++; };
  HOLD.dir = 2; await new Promise((r) => setTimeout(r, 3000)); HOLD.dir = null;
  window.drawScene = orig; return { perSec: +(n / 3).toFixed(1), ms: +(t / n).toFixed(2), tile: ME.tx }; });
console.log(JSON.stringify(r)); await b.close();
