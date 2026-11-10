// 결산 공유 이미지와 결산 카드를 찍는다. 실행: node ops/polish-1110/share-shot.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import fs from 'fs'; import path from 'path'; import url from 'url';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(BASE + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS && document.fonts.status === 'loaded');
await page.evaluate(() => { lifeNew(); let p; for (let i = 0; i < 500; i++) { p = lifeGen(lifeSeedNew()); if (p.sex === 'F') break; } S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.tut = 1;
  ['job', 'lease', 'card', 'car', 'wedding', 'home'].forEach((id) => { S.mq.done[id] = 'good'; }); S.life.yrs = { job: 24, lease: 26, card: 27, car: 29, wedding: 31, home: 37 };
  const L = loveS(); L.stage = 'married'; L.partner = { id: 'seo', name: '서준', since: 21 }; L.married = 31; L.kids = 2; L.kidAges = [33, 36];
  S.tier = S.peak = 11; S.coin = 4210; S.life.age = 60; S.life.over = true; S.life.title = lifeTitleId(); save(); render('home'); });
await page.waitForTimeout(800);
const data = await page.evaluate(() => { const sm = lifeSummary(false); window.__sm = sm; return lifeShareCv(sm).toDataURL('image/png'); });
fs.writeFileSync('ops/polish-1110/img/share-card.png', Buffer.from(data.split(',')[1], 'base64'));
await page.evaluate(() => { for (let i = 0; i < 10 && TUT; i++) endTalk(); lifeAfter(window.__sm); }); await page.waitForTimeout(700);
await page.screenshot({ path: 'ops/polish-1110/img/a3-lifecard.png' });
await b.close();
