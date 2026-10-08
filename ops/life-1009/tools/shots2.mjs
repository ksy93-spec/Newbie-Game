// 본가 카드: 카드 화면과 시작 홈 화면
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => { lifeNew(); let p; for (let i = 0; i < 3000; i++) { p = lifeGen(lifeSeedNew()); if (p.living === '본가' && p.band === '광역시') break; }
  S.life.prof = p; S.life.seed = p.seed; S.life.rolls = 1; obStep = 0; stopWalk(); obRender(); go('onboard'); });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(ROOT, 'ops/life-1009/img/fix-card.png') });
await page.click('#obnext');
await page.waitForFunction(() => !!window.MQP); for (let i = 0; i < 200 && await page.evaluate(() => !!window.MQP); i++) { await page.evaluate(() => window.MQP && MQP.next({ type: 'test' })); await page.waitForTimeout(120); }
await page.waitForTimeout(1500);
await page.evaluate(() => { if (window.TUT) { TUT = null; document.getElementById('htutor') && (document.getElementById('htutor').hidden = true); } });
await page.screenshot({ path: path.join(ROOT, 'ops/life-1009/img/fix-home.png') });
console.log(JSON.stringify(errs), await page.evaluate(() => JSON.stringify([S.hero, S.life.prof.name, S.life.prof.hero, S.look.haircol])));  await b.close();
