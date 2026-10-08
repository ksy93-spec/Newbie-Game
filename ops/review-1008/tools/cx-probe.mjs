process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const GAME = url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 360, height: 640 } })).newPage();
await p.goto(GAME); await p.waitForFunction(() => window.S && window.QUESTS);
const r = await p.evaluate(() => {
  const o = {};
  for (const k of Object.keys(MAPS)) o[k] = { spawn: MAPS[k].spawn, warps: (MAPS[k].warps||[]).map(w=>[w.x,w.y,w.to]), spots: (MAPS[k].spots||[]).map(s => [s.kind, s.id||s.who||'', s.label||'', s.x, s.y, s.menu||s.food||'']) };
  return { maps: o, onboarded: S.onboarded, home: document.querySelector('.screen.on')?.id, tiers: TIERS.map(t=>[t.name,t.need,t.def]) };
});
console.log(JSON.stringify(r).slice(0, 9000));
await b.close();
