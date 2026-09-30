// 메인 퀘스트 컷신(MQP)을 테스트에서 넘긴다. 선택 장면이 나오면 picks 순서대로 고르고, 나머지는 눌러서 넘긴다.
export async function playCine(page, picks = [], { timeout = 20000 } = {}) {
  await page.waitForFunction(() => !!window.MQP, null, { timeout: 8000, polling: 50 });
  let k = 0; const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const s = await page.evaluate(() => { if (!window.MQP) return null; const p = MQP.list()[MQP.cur()] || {};
      return { type: p.type || '', choice: !!p.choice, picked: MQP.picked }; });
    if (!s) break;
    if (s.choice && s.picked === null) {
      if (k >= picks.length) throw new Error('선택이 더 남았다 (picks ' + picks.length + '개)');
      await page.evaluate((j) => MQP.pick(j), picks[k++]);
    } else await page.evaluate(() => MQP && MQP.next({ type: 'test' }));
    await page.waitForTimeout(40);
  }
  await page.waitForFunction(() => !window.MQP && !document.getElementById('opening'), null, { timeout: 5000, polling: 50 });
  await page.waitForTimeout(150);
  return k;
}
/** 지금 컷신의 첫 대본 장면(제목 카드 다음) */
export const cineScene = (page, i = 0) => page.evaluate((i) => { const p = MQP.o.scenes[i]; return { text: (p.text || []).join(' '), doc: p.doc ? JSON.stringify(p.doc) : '', opts: p.choice ? p.choice.opts.length : 0, sub: MQP.o.sub }; }, i);
