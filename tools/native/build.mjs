// prototype/newbie-quest-demo.html 을 안드로이드 셸이 웹뷰로 여는 문자열 모듈로 만든다.
// 결과: src/game/gameHtml.ts (저장소에는 넣지 않는다. .gitignore)
// 사용: npm run build:game   (start, android, typecheck, EAS 빌드 전에 자동으로 돈다)
// 웹 배포용(tools/pages/build.mjs)은 건드리지 않는다. 서비스 워커·매니페스트는 그쪽에서만 붙는다.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const srcPath = path.join(root, 'prototype/newbie-quest-demo.html');
let html = fs.readFileSync(srcPath, 'utf8');
const removed = [];

// 앱 안에서는 서비스 워커·웹 매니페스트가 필요 없다. 지금 소스에는 없지만 나중에 들어와도 걸러 낸다.
const rules = [
  ['manifest 링크', /<link\b[^>]*rel=["']manifest["'][^>]*>\s*/gi],
  ['apple-touch-icon 링크', /<link\b[^>]*rel=["']apple-touch-icon["'][^>]*>\s*/gi],
  ['서비스 워커 등록', /<script>\s*if\s*\(\s*['"]serviceWorker['"] in navigator\s*\)[^<]*<\/script>\s*/gi],
];
for (const [name, re] of rules) {
  const n = (html.match(re) || []).length;
  if (n) { html = html.replace(re, ''); removed.push(`${name} ${n}건`); }
}
if (/serviceWorker\.register/.test(html)) throw new Error('서비스 워커 등록 코드가 남아 있습니다. tools/native/build.mjs 의 규칙을 확인하세요.');
if (!/<meta name="viewport"/.test(html)) throw new Error('viewport meta를 찾지 못했습니다.');

const hash = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
const outDir = path.join(root, 'src/game');
fs.mkdirSync(outDir, { recursive: true });
const body =
  '// 자동 생성 파일. 고치지 마세요. npm run build:game (tools/native/build.mjs)\n' +
  `export const GAME_HASH = ${JSON.stringify(hash)};\n` +
  `export const GAME_HTML: string = ${JSON.stringify(html)};\n`;
fs.writeFileSync(path.join(outDir, 'gameHtml.ts'), body);
console.log(`src/game/gameHtml.ts 갱신 ${(html.length / 1024).toFixed(0)}KB sha1:${hash}` + (removed.length ? ` (제거: ${removed.join(', ')})` : ''));
