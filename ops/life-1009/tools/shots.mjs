// 인생 모드 화면 찍기: 시작 메뉴, 태어남 카드, 태어남 컷신, 결산 카드
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const BASE = url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href;
const shot = (p, n) => p.screenshot({ path: path.join(ROOT, 'ops/life-1009/img', n + '.png') });
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(BASE); await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 }); S.onboarded = true; S.prologue = 1; save(); });
await page.reload(); await page.waitForSelector('#opening .omb', { timeout: 10000 }); await page.waitForTimeout(600);
await shot(page, 'menu');
await page.click('#opening .omb[data-k="life"]'); await page.waitForTimeout(2500);
await page.evaluate(() => { S.life.prof = lifeGen(process_seed()); function process_seed(){ return 'v1-K7Q2MX'; } S.life.seed = S.life.prof.seed; obRender(); });
await page.waitForTimeout(400); await shot(page, 'card');
await page.evaluate(() => { document.getElementById('obbody').scrollTop = 9999; const sc = document.querySelector('#onboard .scroll') || document.getElementById('obbody'); sc.scrollTop = 9999; });
await page.waitForTimeout(300); await shot(page, 'card2');
await page.click('#obnext'); await page.click('#obnext');
await page.waitForFunction(() => !!window.MQP, null, { timeout: 8000 });
for (let i = 0; i < 2; i++) await page.evaluate(() => MQP.next({ type: 'test' }));
await page.waitForTimeout(2600); await shot(page, 'birth-doc');
for (let i = 0; i < 60 && await page.evaluate(() => !!window.MQP); i++) { await page.evaluate(() => MQP && MQP.next({ type: 'test' })); await page.waitForTimeout(60); }
await page.waitForFunction(() => !window.MQP && !document.getElementById('opening')); await page.waitForTimeout(800);
await page.evaluate(() => { MQ_LIST.forEach((c) => { S.mq.done[c.id] = 'good'; }); S.tier = S.peak = 9; S.coin = 2400; save(); lifeEnd(); });
await page.waitForFunction(() => !!window.MQP);
for (let i = 0; i < 80 && await page.evaluate(() => !!window.MQP); i++) { await page.evaluate(() => MQP && MQP.next({ type: 'test' })); await page.waitForTimeout(60); }
await page.waitForSelector('#itip:not([hidden]) .lcard', { timeout: 10000 }); await page.waitForTimeout(400);
await shot(page, 'settle');
console.log(JSON.stringify(errs)); await b.close();
