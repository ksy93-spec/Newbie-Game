// 인생 모드 컷신 주인공(새 일러스트)을 나이·성별·장비별로 찍는다. 실행: node ops/review-1014/tools/hero-shot.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const BASE = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href;
const b = await chromium.launch();
for (const [sex, age, top] of [['M', 20, null], ['F', 33, 'shirt'], ['M', 47, 'suit'], ['F', 60, 'badge']]) {
  const page = await b.newPage({ viewport: { width: 360, height: 640 } });
  page.on('pageerror', (e) => console.log('ERR', e.message));
  await page.goto(BASE + '#nointro'); await page.waitForFunction(() => window.S && window.QUESTS);
  await page.evaluate(([sex, age, top]) => { lifeNew(); let p; for (let i = 0; i < 500; i++) { p = lifeGen(lifeSeedNew()); if (p.sex === sex) break; }
    S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.tut = 1; S.life.age = age; if (top) { S.owned.push(top); S.equip.top = top; } save(); render('home');
    playMQ({ kicker: 'TEST', title: '주인공', scenes: [{ bg: 'office', cast: [['hero', 'L'], ['halbae', 'R']], who: '귀인 할배', text: [age + '살 · ' + sex + ' · ' + (top || '기본')] }], endScenes: () => [] }); }, [sex, age, top]);
  await page.waitForTimeout(800); await page.evaluate(() => MQP.next({ type: 'test' })); await page.waitForTimeout(1500);
  await page.screenshot({ path: `ops/review-1014/img/hero-${sex}${age}.png` }); await page.close(); }
await b.close();
