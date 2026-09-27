// prototype/newbie-quest-demo.html 을 GitHub Pages용 docs/ 로 만든다.
// 폰에서 "홈 화면에 추가"하면 주소창 없이 앱처럼 열리게 머리말과 설치 파일을 붙인다.
// 사용: node tools/pages/build.mjs
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const src = fs.readFileSync(path.join(root, 'prototype/newbie-quest-demo.html'), 'utf8');
const head = `
<meta name="theme-color" content="#2E2740">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="뉴비 퀘스트">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<style>
/* 설치해서 열면 화면 끝까지 쓴다. 아래 홈 막대 자리만 비운다. */
body{overscroll-behavior:none;touch-action:manipulation;}
@media (display-mode: fullscreen), (display-mode: standalone){
  body{padding-block:0!important;align-items:stretch!important;}
  #app{height:100%!important;max-width:none;border:0!important;box-shadow:none!important;
    padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);}
}
</style>`;
const reg = `
<script>if('serviceWorker' in navigator) addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });</script>`;
let out = src.replace('<meta name="viewport"', head.trim() + '\n<meta name="viewport"');
if (out === src) throw new Error('viewport meta not found');
out = out.replace(/<\/body>\s*<\/html>\s*$/i, reg + '\n</body></html>\n');
if (!out.includes("serviceWorker.register")) out += reg + '\n';
const docs = path.join(root, 'docs');
fs.mkdirSync(docs, { recursive: true });
fs.writeFileSync(path.join(docs, 'index.html'), out);
for (const f of ['manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png'])
  fs.copyFileSync(path.join(root, 'tools/pages', f), path.join(docs, f));
fs.writeFileSync(path.join(docs, '.nojekyll'), '');
console.log('docs/ 갱신 완료', (out.length / 1024).toFixed(0) + 'KB');
