// 보스 계산 확인: 공격력별로 이기려면 몇 개를 맞혀야 하는지(문항 수보다 많으면 못 이긴다), 오답 몇 번 버티는지
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const GAME = url.pathToFileURL(path.resolve(process.cwd(), 'prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch(); const page = await (await b.newContext()).newPage();
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
const r = await page.evaluate(() => {
  const out = [];
  S = fresh(); S.status = '직장인'; applyStarter(); S.onboarded = true;
  for (const [tier, weapon] of [[0, 'pen'], [2, 'pen'], [5, 'mouse'], [6, 'keyb'], [6, 'board'], [7, 'laptop'], [8, 'card']]) {
    S.tier = tier; S.equip.weapon = weapon; if (!S.owned.includes(weapon)) S.owned.push(weapon);
    const tt = totals();
    out.push({ tier, weapon, atk: tt.atk, def: tt.def, kan: Math.min(4, 1 + Math.floor(tt.atk / 15)), mak: Math.min(3, Math.floor(tt.def / 30)),
      bosses: BOSSES.map(x => { const p = bossPlan(x); return x.id + ' 필요' + p.need + '/' + x.qs.length + '문항 버팀' + p.survive; }).join(' | ') });
  }
  return out;
});
r.forEach(x => console.log(JSON.stringify(x)));
await b.close();
