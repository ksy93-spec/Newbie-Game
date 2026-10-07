// 경제 표 덤프: 퀘스트·상점·세간·사건·보스·메인 퀘스트 수치를 JSON으로 뽑는다.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
import path from 'node:path'; import url from 'node:url'; import fs from 'node:fs';
const root = process.cwd();
const GAME = url.pathToFileURL(path.resolve(root, 'prototype/newbie-quest-demo.html')).href + '#nointro';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(GAME); await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
const d = await page.evaluate(() => {
  const qs = QUESTS.map(q => ({ id: q.id, th: q.theme, xp: q.xp, coin: q.coin, n: q.qs.length, stat: q.stat, fit: q.fit, trip: !!q.trip, reward: q.reward, place: (typeof QPLACE!=='undefined'?QPLACE[q.id]:null) }));
  const items = {}; [ITEMS, PETS, MOUNTS].forEach(T => Object.keys(T).forEach(k => { const i = T[k]; items[k] = { slot: i.slot, name: i.name, cost: i.cost, atk: i.atk||0, def: i.def||0, perk: i.perk||null, special: !!i.special, mq: i.mq||null, from: i.from||null }; }));
  const furni = {}; Object.keys(FURNI).forEach(k => { const f = FURNI[k]; furni[k] = { name: f.name, cost: f.cost, need: f.need, atk: f.atk||0, def: f.def||0, perk: f.perk||null, mq: f.mq||null, ad: !!f.ad }; });
  const eps = EPISODES.map(e => ({ id: e.id, title: e.title, stat: e.stat, beats: e.beats.length, keys: Object.keys(e).filter(k=>!['beats','src'].includes(k)) }));
  const bosses = BOSSES.map(x => ({ id: x.id, name: x.name, stat: x.stat, need: x.need, hp: x.hp, atk: x.atk, n: x.qs.length }));
  const eggs = []; Object.keys(MAPS).forEach(k => (MAPS[k].eggs||[]).forEach(e => eggs.push({ map: k, id: e.id, coin: e.coin||0, xp: e.xp||0, item: e.item||null, ramen: e.ramen||0 })));
  const life = LIFE_EV.map(e => ({ id: e.id, d: e.choices.map(c => c.d) }));
  return { qs, items, furni, eps, bosses, eggs, life, MAP_LV, TIER_DEP, TIERS: TIERS.map(t => [t.name, t.need, t.def]), MQ_REWARD, FURNI_ORDER, FOODS_N: Object.keys(FOODS).length,
    globals: Object.keys(window).filter(k => /EP|STAMP|GAME|CHECK|CHK|LEASE|CB|DOG|SEASON|AD_/.test(k)).slice(0,80) };
});
fs.writeFileSync(path.resolve(root, 'ops/review-1007/tools/econ-dump.json'), JSON.stringify(d, null, 1));
console.log('quests', d.qs.length, 'items', Object.keys(d.items).length, 'furni', Object.keys(d.furni).length, 'eggs', d.eggs.length, 'life', d.life.length, 'errs', errs);
console.log(d.globals.join(' '));
await b.close();
