// 3장 → 새로고침 → 일반 모드 새로 시작 → 두 칸 오가기(누수 확인) → 예순 결산 → 다시 태어나기 → 앨범.
// 사용: node ops/review-1009/tools/qa-f-modes.mjs 390 844   (qa-e-chapters.mjs 다음에)
import { launch, BASE, shot, tag, st, wait, STATE, overflow, hitTest, tapCine, visButtons } from './lib.mjs';
import { settle, scr } from './drive.mjs';
const vw = +process.argv[2] || 390, vh = +process.argv[3] || 844, T = tag(vw), log = [];
const L = (k, v) => log.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
const { browser, ctx, page, logs } = await launch(vw, vh, STATE + '/after-ch3-' + vw + '.json');
const menu = async () => { await page.goto(BASE); await page.waitForSelector('.omenu:not([hidden]) .omb'); await wait(page, 300); return page.$$eval('.omb', (bs) => bs.map((b) => b.dataset.k + '=' + b.innerText.replace(/\n/g, ' / '))); };
const enter = async (k) => { await page.locator(`.omb[data-k="${k}"]`).click(); await page.waitForFunction(() => !document.getElementById('opening') || window.MQP, null, { timeout: 10000 }).catch(() => {}); await wait(page, 600); await settle(page, log); };
const leak = () => page.evaluate(() => ({ slot: SLOT, mode: S.mode, hasLife: !!S.life, t0: TIERS[0].name, t3: TIERS[3].name, hud: document.getElementById('hnm').textContent, hsub: (document.getElementById('hsub') || {}).textContent, tier: TIERS[S.tier].name, lv: S.lv, coin: S.coin, keys: Object.keys(localStorage).filter((k) => /^nq/.test(k)) }));
try {
  L('menu1', await menu());
  await enter('lcont');
  L('life st', await st(page));
  L('chip', await page.evaluate(() => document.getElementById('hmq').textContent));
  L('chip hit', await hitTest(page, '#hmq'));
  await page.locator('#hmq').click({ timeout: 5000 });
  await wait(page, 700);
  for (let i = 0; i < 3 && (await scr(page)).cine; i++) { const c = await tapCine(page, { max: 600 }); L('ch3 cine' + i + ' picks ' + c.picks.length, c.scenes.slice(0, 3).join(' / ').slice(0, 260)); await wait(page, 900); }
  await settle(page, log, T + '-ch3');
  await shot(page, T + '-17ch3done');
  const b = await st(page); L('after ch3', b);
  // 새로고침
  L('menu reload', await menu());
  await enter('lcont');
  const a = await st(page);
  L('reload diff', Object.keys(b).filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k])).map((k) => k + ': ' + JSON.stringify(b[k]) + ' -> ' + JSON.stringify(a[k])));
  // 일반 모드 새로 시작
  await menu();
  await page.locator('.omb[data-k="new"]').click();
  await wait(page, 1200);
  L('normal onboarding leak', await leak());
  await shot(page, T + '-18normalOb');
  for (let i = 0; i < 40; i++) {
    const s = await scr(page);
    if (s.cine || s.tut || s.tip) { await settle(page, log, null, 800); continue; }
    if (s.on.includes('home')) break;
    const opt = page.locator('#obbody .opt:visible, #obbody .herocard:visible, #obbody button:visible').first();
    const nx = page.locator('#obnext:visible:not([disabled])');
    if (await nx.count()) await nx.click(); else if (await opt.count()) await opt.click();
    await wait(page, 700);
  }
  await settle(page, log);
  L('normal home leak', await leak());
  await shot(page, T + '-19normalHome');
  // 두 칸 오가기
  L('menu both', await menu());
  await enter('lcont');
  L('life after normal', await leak());
  await shot(page, T + '-20lifeAgain');
  await menu(); await enter('cont');
  L('normal again', await leak());
  // 예순 결산
  await menu(); await enter('lcont');
  await page.evaluate(() => { MQ_LIST.forEach((c) => { S.mq.done[c.id] = 'good'; }); save(); lifeEnd(); });
  await wait(page, 700);
  const e1 = await tapCine(page, { max: 600 }); L('y60 cine', e1.scenes.join(' / ').slice(0, 500));
  await page.waitForSelector('#itip:not([hidden]) .lcard', { timeout: 8000 });
  await wait(page, 500);
  await shot(page, T + '-21card');
  L('card overflow', await overflow(page, '#itip'));
  L('card text', (await page.textContent('#itipbox')).replace(/\s+/g, ' ').slice(0, 400));
  L('card btns', await page.$$eval('#itipbox button', (bs) => bs.map((x) => x.textContent)));
  L('card btn hit', await hitTest(page, '#itipbox button'));
  await page.locator('#itipbox button', { hasText: '계속' }).click();
  await wait(page, 700);
  const e2 = await tapCine(page, { max: 600 }); L('part2 cine', e2.scenes.join(' / ').slice(0, 500));
  await page.waitForSelector('#itip:not([hidden]) .lcard', { timeout: 8000 });
  await shot(page, T + '-22after');
  L('after btns', await page.$$eval('#itipbox button', (bs) => bs.map((x) => x.textContent)));
  L('ended st', await st(page));
  await page.locator('#itipbox button', { hasText: '다시 태어나기' }).click();
  await wait(page, 1200);
  L('reborn', await page.evaluate(() => ({ on: [...document.querySelectorAll('.screen.on, section.on')].map((e) => e.id), card: (document.querySelector('#obbody .bch') || {}).textContent, rolls: S.life && S.life.rolls, mode: S.mode, slot: SLOT, obnext: document.getElementById('obnext').textContent })));
  await shot(page, T + '-23reborn');
  L('reborn obnext hit', await hitTest(page, '#obnext'));
  // 앨범
  L('menu after reborn', await menu());
  const al = page.locator('.omb[data-k="album"]');
  if (await al.count()) { await al.click(); await wait(page, 500); L('album', await page.$$eval('.omenu .omq, .omenu .omb', (bs) => bs.map((x) => x.innerText.replace(/\n/g, ' / ')))); await shot(page, T + '-24album'); L('album overflow', await overflow(page, '#opening')); }
} catch (e) { L('CRASH', String(e).slice(0, 400)); await shot(page, T + '-fcrash'); L('crash buttons', await visButtons(page)); L('crash scr', await scr(page)); }
console.log(JSON.stringify({ log, logs }, null, 1));
await browser.close();
