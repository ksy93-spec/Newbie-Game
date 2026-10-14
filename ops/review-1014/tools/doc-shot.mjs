// 컷신 서류 상자에서 긴 줄이 겹치지 않는지 찍어 본다. 실행: node ops/review-1014/tools/doc-shot.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 360, height: 640 } });
await page.goto(BASE + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS);
await page.evaluate(() => { S.onboarded = true; S.tut = 1; render('home');
  playMQ({ kicker: 'TEST', title: '서류', scenes: [{ bg: 'office', cast: [['hero', 'C']], text: ['긴 줄'], doc: { t: '병원비 (요약)', rows: [['본인부담상한제', '넘은 돈 돌려줌'], ['늦게 받기', '5년까지 · 연 7.2%↑'], ['신고 기한', '사망한 달 말일+6개월'], ['문의', '국민건강보험공단']], bad: [1] } }], endScenes: () => [] }); });
await page.waitForTimeout(800); await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(1500);
await page.screenshot({ path: 'ops/review-1014/img/doc-wrap-360.png' }); await b.close();
