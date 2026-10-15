// 출생 카드(스크롤 맨 아래), 예순 결산 카드, 가구 놓기 줄, 근처 줄, 첫 화면(오프닝 메뉴)을 네 크기에서 잰다.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
for (const [w, h] of L.SIZES) {
  // 출생 카드
  { const { ctx, page } = await L.openPage(browser, w, h);
    await page.waitForTimeout(1200); await page.click('#opening .omb[data-k="life"]'); await page.waitForTimeout(900);
    await L.shot(page, `s10-birth-top-${w}`);
    const sc = await page.evaluate(() => { const s = document.querySelector('#onboard .scroll'); s.scrollTop = s.scrollHeight; const nx = document.getElementById('obnext').getBoundingClientRect(), rt = document.getElementById('obretry'), rr = rt && rt.getBoundingClientRect();
      const sr = s.getBoundingClientRect(); return { sh: s.scrollHeight, ch: s.clientHeight, next: [nx.top, nx.bottom, nx.height].map(Math.round), retry: rr ? [rr.top, rr.bottom].map(Math.round) : null, vh: innerHeight, scr: [sr.top, sr.bottom].map(Math.round) }; });
    await page.waitForTimeout(300); await L.shot(page, `s10-birth-bottom-${w}`);
    console.log(`birth ${w}x${h}`, JSON.stringify(sc), sc.retry && sc.retry[1] > sc.next[0] && sc.retry[0] < sc.next[1] ? '<< 다시 태어나기가 다음 단추에 가려짐' : '');
    await ctx.close(); }
  // 결산 카드
  { const { ctx, page } = await L.openPage(browser, w, h, '#nointro');
    await L.homeSetup(page, 'S.mode="life"; S.life=lifeFresh(); S.life.prof=lifeGen(lifeSeedNew()); S.life.age=60;');
    await page.evaluate(() => { const sm = lifeSummary(false); openTip(lifeCardHtml(sm), '#FFC53C', [{ t: '친구에게 공유하기', f: function () {} }, { t: '다시 태어나기', f: function () {} }]); });
    await page.waitForTimeout(500); await L.shot(page, `s10-settle-${w}`);
    const r = await L.audit(page, { root: '#itip' });
    const m = await page.evaluate(() => { const b = document.getElementById('itipbox'), r = b.getBoundingClientRect(); const btns = [...b.querySelectorAll('.ibtns button')].map((x) => { const q = x.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.bottom)]; }); return { box: [r.top, r.bottom].map(Math.round), sh: b.scrollHeight, ch: b.clientHeight, ov: getComputedStyle(b).overflowY, btns, vh: innerHeight }; });
    console.log(L.fmt(`settle ${w}x${h}`, r), JSON.stringify(m));
    await ctx.close(); }
  // 가구 놓기 줄 + 근처 줄(방)
  { const { ctx, page } = await L.openPage(browser, w, h, '#nointro');
    await L.homeSetup(page, 'S.peak=S.paid=S.lastTier=S.tier=7; S.coin=3000;');
    await page.evaluate(() => { enterMap('room', 3, 3); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { try { var id = Object.keys(FURNI)[0]; startPlace(id, null, 0); } catch (e) { console.log('place err', e); } });
    await page.waitForTimeout(500); await L.shot(page, `s10-place-${w}`);
    const r = await L.audit(page, { root: '#home', ignore: ['#scene', '.mapfade', '.hud', '.hud *'] });
    console.log(L.fmt(`place ${w}x${h}`, r).split('\n').filter((x) => !/sceneinfo|htoday|[▲◀▶▼]/.test(x)).join('\n'));
    await ctx.close(); }
}
await browser.close();
