// 게임 HTML의 스크립트에서 한글이 든 문자열을 모두 뽑아 묶음 파일로 나눈다.
// 실행: node ops/text-1024/extract.mjs [묶음 수=12]
import fs from 'fs'; import * as acorn from 'acorn'; const FILE = 'prototype/newbie-quest-demo.html', N = +(process.argv[2] || 12);
const html = fs.readFileSync(FILE, 'utf8');
const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m; const out = [];
while ((m = re.exec(html))) {
  const base = m.index + m[0].indexOf('>') + 1, src = m[1];
  for (const tk of acorn.tokenizer(src, { ecmaVersion: 2020 })) {
    if (tk.type.label === 'string' && /[가-힣]/.test(tk.value) && [...tk.value].length >= 4) out.push({ s: base + tk.start, e: base + tk.end, q: src[tk.start], t: tk.value });
    if (tk.type.label === 'template' && /[가-힣]/.test(tk.value || '')) out.push({ s: base + tk.start, e: base + tk.end, q: '`', t: tk.value, tpl: 1 });
  }
}
out.sort((a, b) => a.s - b.s);
out.forEach((o, i) => { o.id = 'T' + i; o.line = html.slice(0, o.s).split('\n').length; });
fs.writeFileSync('ops/text-1024/strings.json', JSON.stringify(out));
const per = Math.ceil(out.length / N);
for (let c = 0; c < N; c++) {
  const part = out.slice(c * per, (c + 1) * per).filter((o) => !o.tpl).map((o) => ({ id: o.id, line: o.line, t: o.t }));
  fs.writeFileSync(`ops/text-1024/chunks/c${String(c + 1).padStart(2, '0')}.json`, JSON.stringify(part, null, 0).replace(/\},\{/g, '},\n{'));
}
console.log('문자열', out.length, '글자', out.reduce((a, o) => a + o.t.length, 0), '묶음당', per);
