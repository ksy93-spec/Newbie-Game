// 컷신 형식 보기: 1장 컷신 몇 장면 캡처 + bg_ 배경 15장 한 장에 모으기
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path'; import url from 'node:url';
const { chromium } = await import('playwright');
const GAME = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href + '#nointro';
const OUT = 'ops/review-1008/img/';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 360, height: 640 } });
const page = await ctx.newPage(); const logs = [];
page.on('pageerror', e => logs.push(String(e)));
await page.addInitScript(() => { try { if (!localStorage.getItem('nq_demo')) localStorage.setItem('nq_demo', '0'); } catch (e) {} });
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
await page.evaluate(() => { Object.assign(S, { status: '직장인', years: 2, company: '중소기업', region: '수도권', age: 29 });
  S.onboarded = true; S.tut = 1; S.tuts = ['intro','afterq','travel','check','needs','hungry','doors','room','gear','lv2','ep','pet','car','boss'];
  S.done = QUESTS.slice(0, 3).map(q => q.id); save(); render('home'); });
await page.waitForTimeout(800);
// 배경 모음
const sheet = await page.evaluate(() => { const ks = Object.keys(CAST).filter(k => /^bg_/.test(k)); const cw = 250, ch = 100, cols = 3;
  const cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = Math.ceil(ks.length / cols) * (ch + 14); const g = cv.getContext('2d');
  g.fillStyle = '#111'; g.fillRect(0, 0, cv.width, cv.height);
  ks.forEach((k, i) => { const im = castCv(k), x = (i % cols) * cw, y = Math.floor(i / cols) * (ch + 14); if (im) g.drawImage(im, x + 2, y + 14, cw - 4, ch - 2);
    g.fillStyle = '#FFE79B'; g.font = '11px monospace'; g.fillText(k + ' ' + (im ? im.width + 'x' + im.height : 'X'), x + 4, y + 11); });
  return { ks, url: cv.toDataURL('image/png') }; });
const fs = await import('node:fs'); fs.writeFileSync(OUT + 'story-bg-sheet.png', Buffer.from(sheet.url.split(',')[1], 'base64'));
// 1장 컷신
await page.evaluate(() => mqStart('job')); await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + 'story-mq-title.png' });
const shoot = async (idx, name) => { await page.evaluate(i => { const st = MQP; while (st.cur() < i) { st.next(); st.next(); } st.next(); }, idx); await page.waitForTimeout(1600); await page.screenshot({ path: OUT + name }); };
await shoot(2, 'story-mq-halbae.png');
await shoot(5, 'story-mq-choice.png');
console.log(JSON.stringify({ bgs: sheet.ks, cur: await page.evaluate(() => MQP && MQP.cur()), logs }));
await b.close();
