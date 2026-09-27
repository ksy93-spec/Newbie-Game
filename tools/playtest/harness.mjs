// 플레이테스트 하네스. 새 브라우저로 프로토타입을 열고 page를 돌려준다.
// 사용: node my-run.mjs  (my-run.mjs에서 import { open } from './harness.mjs')
// 환경변수 CHROMIUM 으로 크로미움 경로, GAME 으로 HTML 경로를 바꿀 수 있다.
import { chromium } from 'playwright';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const GAME = process.env.GAME || path.resolve(here, '../../prototype/newbie-quest-demo.html');

export async function open({ width = 390, height = 844, fresh = true } = {}) {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url.pathToFileURL(GAME).href);
  await page.waitForTimeout(800);
  if (fresh) { await page.evaluate(() => { localStorage.clear(); location.reload(); }); await page.waitForTimeout(900); }
  return { browser, page, errors };
}
