process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
import path from 'node:path'; import url from 'node:url';
const { chromium } = await import('playwright');
const R = [['villa', 17, 1, 12, 7, '주택가 입구→구축 아파트 B 문 앞'], ['villa', 17, 1, 4, 7, '주택가 입구→신축 빌라 A 문 앞'],
  ['market', 2, 9, 11, 9, '시장 아랫줄 서쪽→칼국숫집 문 앞'], ['market', 0, 3, 6, 3, '시장 윗줄 서쪽 끝→수산물 가게 문 앞'],
  ['office', 8, 14, 7, 15, '회사 앞 횡단보도→바로 왼쪽 잔디'], ['center', 1, 16, 9, 15, '학교 앞에서 넘어온 남쪽 잔디→횡단보도 아래'],
  ['jeonju_market', 8, 6, 11, 6, '전주 야시장 가운데 통로'], ['busan_gamcheon', 3, 9, 6, 9, '감천 9행 골목'], ['busan_gamcheon', 14, 6, 17, 6, '감천 6행 골목'],
  ['busan_jagalchi', 4, 5, 8, 5, '자갈치 아랫줄 보도'], ['busan_jagalchi', 15, 3, 18, 3, '자갈치 윗줄 보도'], ['rest', 19, 11, 21, 10, '휴게소 주유소 오른쪽']];
const b = await chromium.launch(); const out = {};
for (const f of process.argv.slice(2)) { const p = await b.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('nq_demo', '0'); } catch (e) {} });
  await p.goto(url.pathToFileURL(path.resolve(f)).href + '#nointro'); await p.waitForFunction(() => window.S && window.MAPS && window.pathTo);
  out[f] = await p.evaluate((R) => R.map(([m, sx, sy, gx, gy]) => { ME.map = m; const r = pathTo(MAPS[m], gx, gy, 'foot', sx, sy); return r ? r.length : -1; }), R); await p.close(); }
await b.close();
const [A, B] = Object.values(out);
R.forEach((r, i) => console.log(`| ${r[5]} | ${Math.abs(r[1]-r[3])+Math.abs(r[2]-r[4])} | ${A[i]} | ${B[i]} |`));
