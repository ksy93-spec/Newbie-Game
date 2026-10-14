"""게임에 넣은 갈무리 글꼴(축소판)을 다시 만든다.
게임 글자 + 자주 쓰는 한글 2,350자(KS X 1001) + 영문·숫자·문장부호만 담는다.
새 대사에 처음 나온 글자가 다른 글꼴로 그려져 도트 느낌이 깨지는 것을 막는다.

준비: pip install fonttools brotli
      npm pack galmuri@2.40.3 && tar xzf galmuri-2.40.3.tgz   (package/dist 안의 ttf를 쓴다)
실행: python3 tools/fonts/subset.py <galmuri dist 폴더> [게임 html=prototype/newbie-quest-demo.html]
"""
import sys, re, io, base64
from fontTools import subset
from fontTools.ttLib import TTFont

DIST = sys.argv[1]
HTML = sys.argv[2] if len(sys.argv) > 2 else 'prototype/newbie-quest-demo.html'
src = open(HTML, encoding='utf-8').read()

text = re.sub(r'data:[^)\'"]+', '', src)
chars = set(c for c in text if ord(c) >= 0x20)
for cp in range(0xAC00, 0xD7A4):                      # 자주 쓰는 한글 2,350자
    try:
        if len(chr(cp).encode('euc-kr')) == 2: chars.add(chr(cp))   # 조합 시퀀스(8바이트)로만 되는 글자는 뺀다
    except UnicodeEncodeError:
        pass
chars.update(chr(c) for c in range(0x20, 0x7F))
chars.update('·…“”‘’「」『』《》〈〉←→↑↓▶◀▲▼○●◆◇□■★☆♥♡✓✗✦￦₩%°~·')
unicodes = sorted(ord(c) for c in chars)

FILES = {('Galmuri14', '400'): 'Galmuri14.ttf', ('Galmuri11', '400'): 'Galmuri11.ttf',
         ('Galmuri11', '700'): 'Galmuri11-Bold.ttf', ('Galmuri9', '400'): 'Galmuri9.ttf'}

def build(path):
    f = TTFont(f'{DIST}/{path}')
    opt = subset.Options(); opt.flavor = 'woff2'; opt.layout_features = ['*']
    sub = subset.Subsetter(opt); sub.populate(unicodes=unicodes); sub.subset(f)
    buf = io.BytesIO(); f.flavor = 'woff2'; f.save(buf)
    return base64.b64encode(buf.getvalue()).decode()

def repl(m):
    fam = m.group(1); w = re.search(r'font-weight:(\d+)', m.group(0)); key = (fam, w.group(1) if w else '400')
    if key not in FILES: return m.group(0)
    b64 = build(FILES[key]); print(key, len(b64) * 3 // 4, 'bytes')
    return re.sub(r'base64,[A-Za-z0-9+/=]+', 'base64,' + b64, m.group(0), count=1)

out = re.sub(r"@font-face\{font-family:'([^']+)'[^}]*\}", repl, src)
open(HTML, 'w', encoding='utf-8').write(out)
print('글자', len(unicodes))
