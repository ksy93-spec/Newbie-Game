// 주요 화면을 390×844에서 찍는다. 실행: node ops/polish-1110/shots.mjs [tag=before]
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const TAG = process.argv[2] || 'before';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage(); page.on('pageerror', (e) => console.log('ERR', e.message));
const shot = (n) => page.screenshot({ path: `/tmp/claude-0/-home-user-Newbie-Game/887117d1-4617-5cc3-8513-2fb8b844491c/scratchpad/g-${n}.png` });
await page.goto(BASE); await page.waitForSelector('#opening .omb', { timeout: 15000 }); await page.waitForTimeout(1200); await shot('01-opening');
await page.click('#opening .omb[data-k="life"]'); await page.waitForFunction(() => !document.getElementById('opening') && document.getElementById('onboard').classList.contains('on')); await page.waitForTimeout(800); await shot('02-birth');
await page.click('#obnext'); await page.waitForFunction(() => window.MQP, null, { timeout: 8000 }); await page.waitForTimeout(600); await shot('03-cine-title');
for (let i = 0; i < 3; i++) { await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(900); } await shot('04-cine-scene');
await page.evaluate(async () => { for (let i = 0; i < 200 && window.MQP; i++) { MQP.next({ type: 'test' }); await new Promise((r) => setTimeout(r, 30)); } });
await page.waitForTimeout(1500); await page.evaluate(() => { for (let i = 0; i < 20 && TUT; i++) endTalk(); }); await page.waitForTimeout(600); await shot('05-home');
await page.evaluate(() => { S.owned.push('beanie2', 'glass', 'shades'); S.equip.head = 'beanie2'; save(); render('shop'); }); await page.waitForTimeout(800); await shot('shop-beanie');
await page.evaluate(() => { S.equip.head = 'glass'; render('shop'); }); await page.waitForTimeout(600); await shot('shop-glass');
await page.evaluate(() => { S.equip.head = 'shades'; render('char'); }); await page.waitForTimeout(600); await shot('char-shades');
await page.evaluate(() => { hudRefresh(); render('home'); }); await page.waitForTimeout(600); await shot('home-shades');
await b.close();
