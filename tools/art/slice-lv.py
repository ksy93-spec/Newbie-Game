"""인연 인물 시트(LV1 등)를 잘라 assets/art/npc_<열쇠>.webp로 넣는다.
H1과 같은 방식: 자홍 배경을 지우고, 게임 안 키 64 기준으로 4배 크기로 부드럽게 줄인다.
키는 시트 안 인물 키의 중앙값을 64로 잡아 사람마다 키 차이(아기는 작게)를 살린다.
실행: python3.13 tools/art/slice-lv.py LV1   (그다음 node tools/art/embed.mjs). 시트는 LV1, L2, T1
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'assets/art')
SHEETS = {
    'LV1': dict(cols=4, rows=4, names=['lvSeoF', 'lvSeoM', 'lvHanF', 'lvHanM', 'lvJiF', 'lvJiM', 'lvSoF', 'lvSoM',
                                      'lvYoonF', 'lvYoonM', 'lvMinF', 'lvMinM', 'lvEunF', 'lvEunM', 'lvBaby', 'lvMgr']),
    'L2': dict(cols=4, rows=2, names=['mom', 'dad', 'toddler', 'teen', 'doctor', 'banker', 'teamlead', 'teacher'], small=['toddler'], scale={'teen': 0.88}),
    'T1': dict(cols=4, rows=4, names=['boss', 'boy', 'deskf', 'fp', 'girl', 'gma', 'gpa', 'halbae', 'mlmf', 'officem', 'partnerF', 'partnerM', 'peerf', 'peerm'],
               small=['boy', 'girl'], scale={'boy': 0.82, 'girl': 0.82}),
}
LH, HI = 64, 4
OUTLINE = np.array([44, 44, 49])
sheet = sys.argv[1]
cfg = SHEETS[sheet]
a = np.asarray(Image.open(os.path.join(ROOT, 'ops/art', sheet + '.png')).convert('RGB')).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
m = np.minimum(r, b) - g
bg = (m > 90) & (r > 150) & (b > 150)
fg = ~bg
edge = fg & ndimage.binary_dilation(bg, iterations=2) & (m > 30)
a = a.copy(); a[edge] = OUTLINE
H, W = fg.shape
cw, ch = W // cfg['cols'], H // cfg['rows']
index = json.load(open(os.path.join(OUT, 'index.json')))


def shrink(rgb, alpha, w, h):
    pm = rgb.astype(np.float32) * alpha[..., None]
    chans = [np.asarray(Image.fromarray(pm[..., i]).resize((w, h), Image.BOX)) for i in range(3)]
    al = np.asarray(Image.fromarray(alpha.astype(np.float32)).resize((w, h), Image.BOX))
    out = np.stack(chans, -1) / np.maximum(al, 1e-6)[..., None]
    return np.clip(out, 0, 255).astype(np.uint8), al


cells = []
for i, name in enumerate(cfg['names']):
    cx, cy = (i % cfg['cols']) * cw, (i // cfg['cols']) * ch
    f = fg[cy:cy + ch, cx:cx + cw]
    lab, n = ndimage.label(f)
    sizes = ndimage.sum(f, lab, range(1, n + 1))
    keep = np.isin(lab, [j + 1 for j, s in enumerate(sizes) if s > 200])
    ys, xs = np.where(keep)
    cells.append((name, cx, cy, ys.min(), ys.max() + 1, xs.min(), xs.max() + 1, keep))
ref = float(np.median([c[4] - c[3] for c in cells if c[0] not in cfg.get('small', ['lvBaby'])]))
for name, cx, cy, y0, y1, x0, x1, keep in cells:
    rgb = a[cy + y0:cy + y1, cx + x0:cx + x1]
    k = keep[y0:y1, x0:x1].astype(np.float32)
    bh, bw = y1 - y0, x1 - x0
    lh = max(8, round(LH * bh / ref * cfg.get('scale', {}).get(name, 1))); lw = max(1, round(lh * bw / bh))
    o_rgb, o_al = shrink(rgb, k, lw * HI, lh * HI)
    im = Image.fromarray(np.dstack([o_rgb, (np.clip(o_al * 1.1, 0, 1) * 255).astype(np.uint8)]), 'RGBA')
    key = 'npc_' + name
    im.save(os.path.join(OUT, key + '.webp'), 'WEBP', quality=92, alpha_quality=100, method=6)
    index[key] = [lw, lh, lw * HI, lh * HI]
    print(key, (bw, bh), '→', (lw, lh))
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=0)
