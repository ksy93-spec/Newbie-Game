// 아이폰(예전 사파리)에서 문법 오류로 스크립트가 통째로 죽지 않는지 본다. 실행: node ops/review-1009/tools/syntax-check.mjs
import fs from 'fs'; import * as acorn from 'acorn';
const html = fs.readFileSync(process.argv[2] || 'prototype/newbie-quest-demo.html', 'utf8');
const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m, i = 0, bad = 0;
while ((m = re.exec(html))) { i++;
  for (const v of [2017, 2018, 2019, 2020]) {
    try { acorn.parse(m[1], { ecmaVersion: v, sourceType: 'script' }); console.log('script', i, 'ok at', v); break; }
    catch (e) { if (v === 2020) { bad++; console.log('script', i, 'FAIL 2020', e.message); } else if (v === 2017) { const l = m[1].split('\n')[e.loc.line - 1]; console.log('script', i, 'needs >', v, e.message, '|', l.slice(Math.max(0, e.loc.column - 60), e.loc.column + 60)); } }
  }
  const lb = m[1].match(/\(\?<[=!]/g); if (lb) console.log('script', i, 'regex lookbehind x' + lb.length);
}
process.exit(bad ? 1 : 0);
