// 홈(동네 지도): D-pad, 미니맵, 안내 칩, 존 태그, 메뉴 칩을 네 크기에서 잰다. 세이브 없이 시작해 인생 모드로 들어간다.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
const ONLY = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const out = {};
for (const [w, h] of L.SIZES) {
  if (ONLY && !ONLY.includes(w)) continue;
  const { ctx, page, logs } = await L.openPage(browser, w, h, '#nointro');
  
  await page.waitForTimeout(800);
  await L.homeSetup(page);
  const stage = await page.evaluate(() => { const r = document.querySelector('#home .stagebox').getBoundingClientRect(); const c = document.getElementById('scene').getBoundingClientRect(); return { stage: [r.left, r.top, r.right, r.bottom], scene: [c.left, c.top, c.right, c.bottom], map: S.map || S.where, keys: Object.keys(window).filter(k => /^(MAPS|CUR|ME|CAM|cam|TS|ZOOM|VIEW)/.test(k)) }; });
  console.log(w, h, JSON.stringify(stage));
  await L.shot(page, `s3-home-${w}`);
  const res = await L.audit(page, { root: '#home', ignore: ['#scene', '.mapfade', '.hud', '.hud *'] });
  console.log(L.fmt(`home ${w}x${h}`, res));
  out[w] = res.els.filter(e => /dpad|guide|minimap|zonetag|menuchip|chk|mq|near|place|tutor|travel|today/.test(e.n)).map(e => e.n + ' ' + e.r.join(','));
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
