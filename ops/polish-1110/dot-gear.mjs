// 도트 주인공에 머리 장비를 얹은 확인판. 실행: node ops/polish-1110/dot-gear.mjs <out.png>
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1260, height: 1140 } });
p.on('pageerror', (e) => { if (!/classList/.test(e.message)) console.log('ERR', e.message); });
await p.goto(url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href); await p.waitForTimeout(1500);
await p.evaluate(() => {
  S.mode = 'life'; var rows = [];
  [['M', 20, 'hnone'], ['M', 20, 'glass'], ['F', 32, 'shades'], ['F', 20, 'beanie2'], ['M', 45, 'band'], ['F', 60, 'glass']].forEach(function (c) {
    S.life = { prof: { sex: c[0] }, age: c[1] }; S.equip.head = c[2];
    rows.push([[0, 0], [0, 1], [0, 3], [2, 0], [2, 1], [1, 1], [3, 0], [0, 'b']].map(function (df) { return heroDot(df[0], df[1]); })); });
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0';
  var cv = document.createElement('canvas'); cv.width = 1260; cv.height = 1140; document.body.appendChild(cv); var x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#c9d2bd'; x.fillRect(0, 0, 1260, 1140);
  rows.forEach(function (r, i) { r.forEach(function (im, j) { if (im) x.drawImage(im, 0, 0, 48, 68, 8 + j * 156, 4 + i * 187, 144, 204); }); });
});
await p.screenshot({ path: process.argv[2] }); await b.close();
