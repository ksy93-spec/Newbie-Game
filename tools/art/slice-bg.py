"""배경 시트(흰 줄로 나뉜 격자)를 잘라 assets/art/bg_<이름>.webp로 넣는다. 매끈한 일러스트라 원래 해상도 그대로 둔다.
실행: python3.13 tools/art/slice-bg.py L1   (그다음 node tools/art/embed.mjs)
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'assets/art')
SHEETS = {
    'L1': ['hospital', 'school', 'retire', 'loan', 'funeral', 'park', 'airport', 'dol', 'parents'],
}
sheet = sys.argv[1]
names = SHEETS[sheet]
im = Image.open(os.path.join(ROOT, 'ops/art', sheet + '.png')).convert('RGB')
a = np.asarray(im).astype(int)
white = (a.min(-1) > 238)


def runs(frac):          # 흰 줄이 아닌 구간
    on = frac < 0.97; out = []; s = None
    for i, v in enumerate(on):
        if v and s is None: s = i
        if not v and s is not None:
            if i - s > 60: out.append((s, i))
            s = None
    if s is not None and len(on) - s > 60: out.append((s, len(on)))
    return out


cols, rows = runs(white.mean(0)), runs(white.mean(1))
index = json.load(open(os.path.join(OUT, 'index.json')))
i = 0
for (y0, y1) in rows:
    for (x0, x1) in cols:
        if i >= len(names): break
        c = im.crop((x0 + 2, y0 + 2, x1 - 2, y1 - 2)); key = 'bg_' + names[i]
        c.save(os.path.join(OUT, key + '.webp'), 'WEBP', quality=88, method=6)
        index[key] = [c.width, c.height, c.width, c.height]; print(key, c.size); i += 1
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=0)
