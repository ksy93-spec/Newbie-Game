// 컷신 대표 장면(제목 카드, 선택지+이름표, 서류 상자, 긴 대사, 보상 카드)을 두 크기에서 찍는다.
const L = await import('./ui-lib.mjs');
const browser = await L.chromium.launch();
const SIZES = process.argv[2] ? L.SIZES.filter(([w]) => process.argv[2].split(',').map(Number).includes(w)) : [[360, 640], [390, 844]];
const targets = [
  ['title', `mqData(MQ_LIST.find(c=>c.id==='job')).scenes`, (s, i) => i === 0, 'title'],
  ['choice-who', `mqData(MQ_LIST.find(c=>c.id==='job')).scenes`, (s) => s.choice && s.who, 'choice'],
  ['doc', `mqData(MQ_LIST.find(c=>c.id==='job')).scenes`, (s) => s.doc, 'doc'],
  ['doc-choice', `(function(){var a=[];MQ_LIST.forEach(function(c){var d=c.id==='lease'?{scenes:[]}:mqData(c); if(d) a=a.concat(d.scenes);}); return a;})()`, (s) => s.doc && s.choice, 'docchoice'],
  ['longest', `(function(){var a=[];MQ_LIST.forEach(function(c){var d=c.id==='lease'?{scenes:[]}:mqData(c); if(d) a=a.concat(d.scenes);}); return a;})()`, (s, i, all) => { const m = Math.max(...all.filter((x) => !x.choice && x.text).map((x) => x.text.join('').length)); return !s.choice && s.text && s.text.join('').length === m; }, 'long'],
  ['choice-3', `(function(){var a=[];MQ_LIST.forEach(function(c){var d=c.id==='lease'?{scenes:[]}:mqData(c); if(d) a=a.concat(d.scenes);}); return a;})()`, (s, i, all) => { const m = Math.max(...all.filter((x) => x.choice).map((x) => x.choice.opts.map((o) => o.a.length).reduce((a, b) => a + b, 0))); return s.choice && s.choice.opts.map((o) => o.a.length).reduce((a, b) => a + b, 0) === m; }, 'choicemax'],
];
for (const [w, h] of SIZES) {
  for (const [name, getter, match, tag] of targets) {
    const { ctx, page, logs } = await L.openPage(browser, w, h, '#nointro');
    await L.homeSetup(page, '');
    const idx = await page.evaluate(([getter, matchSrc]) => {
      lifeNew(); const p = lifeGen(lifeSeedNew()); S.life.prof = p; S.life.seed = p.seed; birthApply(); S.onboarded = true; S.tut = 1; render('home');
      const sc = eval(getter), m = eval('(' + matchSrc + ')'); const i = sc.findIndex((s, k) => m(s, k, sc)); if (i < 0) return -1;
      const upto = sc.slice(Math.max(0, i), i + 1);
      window.__t = sc[i]; playMQ({ no: 1, title: '점검', sub: name, scenes: upto, endScenes: function () { return []; }, onDone: function () {} }); return i;
    }, [getter, match.toString()]);
    if (idx < 0) { console.log(name, '찾지 못함'); await ctx.close(); continue; }
    // 제목 카드 → 장면으로
    if (name !== 'title') { await page.waitForTimeout(500); await page.evaluate(() => MQP.next({ type: 'test' })); }
    await page.waitForFunction(() => { const p = MQP && MQP.list()[MQP.cur()]; return p && (p.type === 'title' || !p.choice || (MQP.opts && MQP.opts.length)); }, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(name === 'title' ? 1800 : 4500);
    await L.shot(page, `s9-cine-${tag}-${w}`);
    const info = await page.evaluate(() => ({ who: window.__t && window.__t.who, text: window.__t && (window.__t.text || []).join(' ').slice(0, 50), opts: MQP && MQP.opts && MQP.opts.map((o) => [o.x, o.y, o.w, o.h]) }));
    console.log(w + 'x' + h, name, 'idx', idx, JSON.stringify(info));
    await ctx.close();
  }
}
await browser.close();
