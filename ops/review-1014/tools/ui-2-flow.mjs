// 열린 메뉴 → 인생 모드 → 출생 카드 → 출생 컷신 → 홈. 단계마다 겹침을 잰다.
const L = await import('./ui-lib.mjs');
const { playCine } = await import('../../../tests/cine.mjs');
const browser = await L.chromium.launch();
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
for (const [w, h] of L.SIZES) {
  if (only && !only.includes(w)) continue;
  const { ctx, page, logs } = await L.openPage(browser, w, h);
  await page.waitForTimeout(1200);
  await page.click('#opening .omb[data-k="life"]');
  await page.waitForTimeout(800);
  const st = async (name, opts = {}) => { await page.waitForTimeout(400); await L.shot(page, `s2-${name}-${w}`);
    console.log(L.fmt(`${name} ${w}x${h}`, await L.audit(page, opts))); };
  console.log('after click', await page.evaluate(() => ({ op: !!document.getElementById('opening'), mq: !!window.MQP, onb: document.getElementById('onboard').className, body: (document.getElementById('obbody').innerText || '').slice(0, 80) })));
  await st('after-life-click');
  // 온보딩 카드 단계들
  for (let i = 0; i < 12; i++) {
    const info = await page.evaluate(() => { const b = document.getElementById('obnext'); const onb = document.getElementById('onboard');
      return { on: onb.classList.contains('on'), dis: b && b.disabled, txt: b && b.textContent, opening: !!document.getElementById('opening'), mq: !!window.MQP, body: (document.getElementById('obbody').innerText || '').slice(0, 40) }; });
    console.log(i, JSON.stringify(info));
    if (!info.on || info.opening || info.mq) break;
    await st('onb' + i, { root: '#onboard' });
    // 선택지 있으면 첫 번째를 고른다
    await page.evaluate(() => { const o = document.querySelector('#obbody .opt, #obbody .choice, #obbody button'); if (o && document.getElementById('obnext').disabled) o.click(); });
    await page.waitForTimeout(200);
    const d = await page.evaluate(() => document.getElementById('obnext').disabled);
    if (d) { console.log('next disabled'); break; }
    await page.click('#obnext'); await page.waitForTimeout(500);
  }
  await ctx.close();
}
await browser.close();
