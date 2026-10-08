// 카드의 주인공 그림(hero)이 적용되는지 확인
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const b = await chromium.launch(); const page = await (await b.newContext()).newPage();
await page.goto(url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href + '#nointro');
await page.waitForFunction(() => window.S && window.QUESTS);
console.log(await page.evaluate(() => { lifeNew(); const p = lifeGen('v1-587NPC'); S.life.prof = p; S.life.seed = p.seed;
  const a = { hero: p.hero, trait: p.trait, sex: p.sex, glasses: p.glasses }; birthApply(); return JSON.stringify([a, S.hero, S.avatar]); }));
await b.close();
