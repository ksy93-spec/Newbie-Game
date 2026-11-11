// 지도 도트 인물 확대판(한 점 = 4화면점). 실행: node ops/polish-1110/dot-zoom.mjs <out.png>
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright'); import path from 'path'; import url from 'url';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1240, height: 1130 } });
p.on('pageerror', (e) => { if (!/classList/.test(e.message)) console.log('ERR', e.message); });
await p.goto(url.pathToFileURL(path.resolve('prototype/newbie-quest-demo.html')).href); await p.waitForTimeout(1500);
await p.evaluate(() => {
  S.mode = 'life'; var ims = [];
  [['M', 20], ['F', 20], ['M', 60]].forEach(function (sa) { S.life = { prof: { sex: sa[0] }, age: sa[1] }; pickHero(sa[0] === 'F' ? 'mukbang' : 'newbie'); TOPC = {};
    [[0, 0], [2, 1], [3, 0], [0, 'b']].forEach(function (df) { ims.push(heroTop(df[0], df[1])); }); });
  var r2 = ['gpa', 'gma', 'halbae', 'peerf', 'peerm', 'deskf', 'boss', 'fp', 'officem', 'mlmf', 'boy', 'girl'].map(function (k) { return npcTop(k, 0, 0); });
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0';
  var cv = document.createElement('canvas'); cv.width = 1240; cv.height = 1130; document.body.appendChild(cv); var x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#c9d2bd'; x.fillRect(0, 0, 1240, 1130);
  [ims, r2].forEach(function (r, i) { r.forEach(function (im, j) { var k = im.hd || 1, Z = 8 / k; x.drawImage(im, 0, 0, im.width, im.height, 6 + (j % 6) * 204, 6 + (i * 2 + Math.floor(j / 6)) * 280, im.width * Z, im.height * Z); }); });
});
await p.screenshot({ path: process.argv[2] }); await b.close();
