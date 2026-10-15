// 첫 화면부터 홈까지(세이브 없이). 열린 메뉴, 출생 카드, 컷신, 홈.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
for (const [w, h] of L.SIZES) {
  const { ctx, page, logs } = await L.openPage(browser, w, h);
  await page.waitForTimeout(1500);
  const ids = await page.evaluate(() => [...document.querySelectorAll('#opening, #onboard')].map(e => e.id + ':' + getComputedStyle(e).display + ' ' + e.className));
  console.log(w, h, ids);
  await L.shot(page, `s1-open-${w}`);
  console.log(L.fmt(`open ${w}x${h}`, await L.audit(page, { root: '#opening' })));
  await ctx.close();
}
await browser.close();
