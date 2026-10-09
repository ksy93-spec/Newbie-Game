// 태어남 카드 난이도 점수 분포(2000장). 실행: node ops/review-1009/tools/cx-diff.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import url from 'node:url';
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(url.pathToFileURL(process.cwd() + '/prototype/newbie-quest-demo.html').href + '#nointro');
await p.waitForFunction(() => window.S && window.lifeGen);
console.log(JSON.stringify(await p.evaluate(() => { const sc = []; for (let i = 0; i < 2000; i++) { const pr = lifeGen(lifeSeedNew()), fx = lifeFx(pr); const ss = Object.values(fx.stat).reduce((a, c) => a + c, 0); sc.push(fx.coin + 10 * ss + (fx.tier >= 4 ? 100 : 0)); }
  sc.sort((a, b) => a - b); return { p10: sc[200], p33: sc[660], p50: sc[1000], p66: sc[1320], p90: sc[1800], min: sc[0], max: sc[1999] }; })));
await b.close();
