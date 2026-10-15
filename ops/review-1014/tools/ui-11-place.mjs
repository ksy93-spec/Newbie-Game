// 가구 놓기 모드: 위 줄(placebar)이 ☰, 존 태그, 미니맵, 십자키와 겹치는지 잰다.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
for (const [w, h] of L.SIZES) {
  const { ctx, page } = await L.openPage(browser, w, h, '#nointro');
  await L.homeSetup(page, 'S.peak=S.paid=S.lastTier=S.tier=7; S.coin=3000;');
  const ok = await page.evaluate(() => { const id = Object.keys(FURNI).find((k) => FURNI[k].w && furnTier() >= FURNI[k].need); if (!id) return 'no furni'; startPlace(id, null, 0); return id + ' PLACE=' + !!PLACE; });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const g = (id) => { const e = document.getElementById(id); if (!e || e.hidden) return null; const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom].map(Math.round); }; return { place: g('hplace'), menu: g('hmenu'), zone: g('hzone'), mini: g('hmini'), dpad: g('hdpad'), mq: g('hmq'), guide: g('hguide'), near: g('hnear') }; });
  console.log(w + 'x' + h, ok, JSON.stringify(r));
  await L.shot(page, `s11-place-${w}`);
  await ctx.close();
}
await browser.close();
