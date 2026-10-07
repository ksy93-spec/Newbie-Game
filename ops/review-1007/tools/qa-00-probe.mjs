import { open, closeBrowser, seed } from './qa-lib.mjs';
const { page, logs } = await open();
const info = await page.evaluate(() => ({
  ver: CONTENT.ver, nQuests: QUESTS.length, mapOrder: MAP_ORDER, mapLv: MAP_LV, maps: Object.keys(MAPS).length,
  drip: typeof DRIP_DAILY !== 'undefined' ? DRIP_DAILY : null, adCap: AD_CAP, adLim: AD_LIM,
  bosses: BOSSES.map(b => [b.id, b.stat, b.need, b.qs.length]), eps: EPISODES.map(e => e.id),
  tiers: TIERS.map(t => [t.name, t.need]),
  fullCost: FULL_COST,
  qplaceN: Object.keys(QPLACE).length,
  noPlace: QUESTS.filter(q => !QPLACE[q.id] && !q.trip).map(q => q.id + ':' + q.npc).slice(0, 40),
}));
console.log(JSON.stringify(info, null, 1));
console.log(logs);
await closeBrowser();
