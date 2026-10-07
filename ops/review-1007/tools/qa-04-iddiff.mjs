// 옛 버전마다 아이템·펫·탈것·세간·맵·거처 id 를 뽑아, 지금 버전에서 사라진 id 를 찾는다(옛 저장이 그 id 를 들고 오면 깨질 수 있다).
import { getBrowser, closeBrowser, GAME } from './qa-lib.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import url from 'node:url';
import { execSync } from 'node:child_process';
const commits = execSync('git log --format=%h -- prototype/newbie-quest-demo.html').toString().trim().split('\n').slice(0, 45);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nq-ids-'));
const b = await getBrowser();
const grab = async (u) => { const ctx = await b.newContext(); const p = await ctx.newPage(); await p.goto(u); await p.waitForFunction(() => window.S && window.QUESTS, null, { timeout: 20000 }).catch(() => {});
  const r = await p.evaluate(() => { const k = (o) => (typeof o === 'object' && o ? Object.keys(o) : []); return { items: k(window.ITEMS), pets: k(window.PETS), mounts: k(window.MOUNTS), furni: k(window.FURNI), maps: k(window.MAPS), tiers: (window.TIERS || []).length, quests: (window.QUESTS || []).map((q) => q.id), avatars: k(window.AVATARS), heroes: (window.HEROES || []).map((h) => h.id), eps: (window.EPISODES || []).map((e) => e.id), bosses: (window.BOSSES || []).map((x) => x.id) }; }).catch((e) => ({ err: String(e) }));
  await ctx.close(); return r; };
const now = await grab(GAME);
const gone = {};
for (const c of commits) {
  const f = path.join(dir, c + '.html'); fs.writeFileSync(f, execSync(`git show ${c}:prototype/newbie-quest-demo.html`, { maxBuffer: 1 << 28 }));
  const o = await grab(url.pathToFileURL(f).href + '#nointro');
  if (o.err || !o.items) { console.log(c, 'skip', o.err); continue; }
  for (const key of ['items', 'pets', 'mounts', 'furni', 'maps', 'quests', 'avatars', 'heroes', 'eps', 'bosses']) {
    const all = new Set([...(now.items || []), ...(now.pets || []), ...(now.mounts || [])]);
    (o[key] || []).forEach((id) => { const have = ['items', 'pets', 'mounts'].includes(key) ? all.has(id) : (now[key] || []).includes(id); if (!have) { gone[key] = gone[key] || {}; gone[key][id] = gone[key][id] || c; } });
  }
  if (o.tiers > now.tiers) { gone.tiers = gone.tiers || {}; gone.tiers[o.tiers] = c; }
  fs.unlinkSync(f);
}
console.log('now tiers', now.tiers, 'items', now.items.length);
console.log(JSON.stringify(gone, null, 1));
fs.writeFileSync(new URL('./out/04-iddiff.json', import.meta.url), JSON.stringify(gone, null, 1));
await closeBrowser();
