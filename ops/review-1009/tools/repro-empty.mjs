// 시작 화면이 비고 다음 버튼이 안 눌리는 상태 재현: 남아 있던 저장 여러 경우
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const URL0 = url.pathToFileURL(path.join(ROOT, 'prototype/newbie-quest-demo.html')).href;
const cases = {
  lifeNoProfMaxRolls: { 'nq.slot': 'life', 'nq.life.v1': JSON.stringify({ mode: 'life', onboarded: false, life: { v: 1, rolls: 3, prof: null, prev: [], anch: { age: 20, done: 0 }, yrs: {} } }) },
  lifeNullLife: { 'nq.slot': 'life', 'nq.life.v1': JSON.stringify({ mode: 'life', onboarded: false, life: null }) },
  lifeSlotNoSave: { 'nq.slot': 'life' },
  normalModeLifeSlot: { 'nq.slot': 'life', 'nq.life.v1': JSON.stringify({ mode: 'normal', onboarded: false }) },
};
const b = await chromium.launch();
for (const [name, ls] of Object.entries(cases)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  await page.addInitScript((ls) => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); for (const k in ls) localStorage.setItem(k, ls[k]); } }, ls);
  await page.goto(URL0 + '#nointro'); await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({ body: document.getElementById('obbody').textContent.slice(0, 30), dis: document.getElementById('obnext').disabled, txt: document.getElementById('obnext').textContent, mode: S.mode, slot: SLOT }));
  console.log(name, JSON.stringify(r), JSON.stringify(errs)); await ctx.close();
}
await b.close();
