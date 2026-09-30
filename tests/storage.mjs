// 새로고침 전에 저장이 실제로 반영됐는지 확인한다.
// 크로미움은 localStorage 쓰기를 모아서 넘기기 때문에, 쓰자마자 새로고침하면 옛 값(또는 빈 값)을 읽는 일이 있다.
// 같은 file:// 저장소를 쓰는 다른 창에서 같은 값이 보일 때까지 기다린 뒤 새로고침한다.
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const PROBE = url.pathToFileURL(path.resolve(here, 'probe.html')).href;

export async function flushStorage(page, key = 'nq.v8') {
  const want = await page.evaluate((k) => localStorage.getItem(k), key);
  const probe = await page.context().newPage();
  try {
    await probe.goto(PROBE);
    for (let i = 0; i < 80; i++) {
      if ((await probe.evaluate((k) => localStorage.getItem(k), key)) === want) return true;
      await probe.waitForTimeout(100);
    }
    return false;
  } finally { await probe.close(); }
}

/** 저장이 넘어간 것을 확인하고 새로고침한 뒤, 게임이 다시 뜰 때까지 기다린다.
 *  부하가 크면 그래도 새 문서가 빈 저장소를 읽는 일이 있다(그러면 게임이 새 저장을 덮어쓴다).
 *  그때는 새로고침 직전 값을 되돌려 놓고 한 번 더 연다. 불러오기 자체를 시험하는 것은 그대로다. */
export async function reloadSaved(page, key = 'nq.v8') {
  const want = await page.evaluate((k) => localStorage.getItem(k), key);
  await flushStorage(page, key);
  for (let i = 0; i < 3; i++) {
    await page.reload();
    await page.waitForFunction(() => window.S && window.QUESTS, null, { polling: 100 });
    const ok = await page.evaluate(() => !!S.onboarded);
    if (ok || !want || !JSON.parse(want).onboarded) return;
    console.warn('[storage] 새로고침 뒤 빈 저장을 읽어 다시 엽니다');
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, want]);
    await flushStorage(page, key);
  }
}
