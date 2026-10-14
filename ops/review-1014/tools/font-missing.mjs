// 게임 글꼴(갈무리 축소판)에 없는 글자를 찾는다. 실행: node ops/review-1014/tools/font-missing.mjs
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import fs from 'fs'; import path from 'path'; import url from 'url';
const FILE = process.argv[2] || 'prototype/newbie-quest-demo.html';
const html = fs.readFileSync(FILE, 'utf8');
const chars = [...new Set([...html.replace(/data:[^)'"]+/g, '')].filter((c) => /[ㄱ-ㆎ가-힣]/.test(c)))];
const b = await chromium.launch(); const page = await b.newPage();
await page.goto(url.pathToFileURL(path.resolve(FILE)).href + '#nointro'); await page.waitForFunction(() => window.S && document.fonts.status === 'loaded');
const res = await page.evaluate((chars) => { const c = document.createElement('canvas').getContext('2d'); const out = {};
  c.canvas.width = 40; c.canvas.height = 20;
  const img = (font, ch) => { c.clearRect(0, 0, 40, 20); c.font = font; c.textBaseline = 'top'; c.fillStyle = '#000'; c.fillText(ch, 2, 2); return c.getImageData(0, 0, 40, 20).data.join(''); };
  for (const fam of ['Galmuri14', 'Galmuri11', 'Galmuri9']) { out[fam] = chars.filter((ch) => img(`11px ${fam}, sans-serif`, ch) === img('11px sans-serif', ch)).join(''); }
  return out; }, chars);
console.log('한글 글자 수', chars.length); for (const k in res) console.log(k, '빠진 글자', [...res[k]].length, res[k]);
await b.close();
