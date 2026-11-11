// 지도 도트 인물 비교판. 실행: node ops/polish-1110/dot-sheet.mjs <out.png>
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1180, height: 760 } });
p.on('pageerror', (e) => { if (!/classList/.test(e.message)) console.log('ERR', e.message); });
await p.goto(url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href); await p.waitForTimeout(1500);
await p.evaluate(() => {
  S.mode = 'life'; var Z = 5, rows = [];
  [['M', 20], ['M', 45], ['M', 60], ['F', 20], ['F', 45], ['F', 60]].forEach(function (sa) {
    S.life = { prof: { sex: sa[0] }, age: sa[1] }; if (typeof pickHero === 'function') pickHero(sa[0] === 'F' ? 'mukbang' : 'newbie'); TOPC = {};
    var fr = [[0, 0], [0, 1], [0, 2], [0, 3], [2, 0], [2, 1], [2, 3], [3, 0], [0, 'b']].map(function (df) { try { return heroTop(df[0], df[1]); } catch (e) { return heroTop(df[0], 0); } });
    rows.push(fr); });
  rows.push(['gpa', 'gma', 'halbae', 'peerf', 'peerm', 'deskf', 'boss', 'fp', 'officem', 'mlmf', 'boy', 'girl'].map(function (k) { return npcTop(k, 0, 0); }));
  rows.push(['gpa', 'gma', 'halbae', 'peerf', 'peerm', 'deskf', 'boss', 'fp', 'officem', 'mlmf', 'boy', 'girl'].map(function (k) { return npcTop(k, 2, 1); }));
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#9bb38a';
  var cv = document.createElement('canvas'); cv.width = 1180; cv.height = 760; document.body.appendChild(cv); var x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#b9c7a8'; x.fillRect(0, 0, 1180, 760); x.fillStyle = '#d8d4cc'; x.fillRect(0, 380, 1180, 380);
  rows.forEach(function (r, i) { r.forEach(function (im, j) { var k = im.hd || 1, w = im.width / k, hh = im.height / k; x.drawImage(im, 0, 0, im.width, im.height, 8 + j * 96, 6 + i * 94, w * 2.5, hh * 2.5); }); });
});
await p.screenshot({ path: process.argv[2] }); await b.close();
