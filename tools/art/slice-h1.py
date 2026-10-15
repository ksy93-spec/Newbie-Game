"""시트 H1(나이 드는 인생 모드 주인공, 남 4 · 여 4)을 잘라 assets/art/에 넣는다.
매끈한 일러스트라서 도트 시트와 달리 점을 맞추지 않고, 게임 안 크기의 4배로 부드럽게 줄인다.
장비 색을 바꿀 수 있게 윗옷(흰 티)과 바지(회색) 부분을 따로 뽑아 _t, _b 그림으로도 저장한다.
실행: python3 tools/art/slice-h1.py  (그다음 node tools/art/embed.mjs)
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(ROOT, 'ops/art/H1.png')
OUT = os.path.join(ROOT, 'assets/art')
NAMES = ['lh_m20', 'lh_m32', 'lh_m45', 'lh_m60', 'lh_f20', 'lh_f32', 'lh_f45', 'lh_f60']
LH = 64          # 게임 안 키(npc_ 대화 그림과 같다)
HI = 4           # 저장 배율
OUTLINE = np.array([44, 44, 49])

a = np.asarray(Image.open(SRC).convert('RGB')).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
m = np.minimum(r, b) - g
bg = (m > 90) & (r > 150) & (b > 150)
fg = ~bg
# 자홍이 섞인 가장자리는 외곽선 색으로
edge = fg & ndimage.binary_dilation(bg, iterations=2) & (m > 30)
a = a.copy(); a[edge] = OUTLINE

H, W = fg.shape
cw, ch = W // 4, H // 2
index = json.load(open(os.path.join(OUT, 'index.json')))


def shrink(rgb, alpha, w, h):
    pm = rgb.astype(np.float32) * alpha[..., None]
    chans = [np.asarray(Image.fromarray(pm[..., i]).resize((w, h), Image.BOX)) for i in range(3)]
    al = np.asarray(Image.fromarray(alpha.astype(np.float32)).resize((w, h), Image.BOX))
    out = np.stack(chans, -1) / np.maximum(al, 1e-6)[..., None]
    return np.clip(out, 0, 255).astype(np.uint8), al


def save(rgb, al, name):
    im = Image.fromarray(np.dstack([rgb, (np.clip(al * 1.1, 0, 1) * 255).astype(np.uint8)]), 'RGBA')
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=92, alpha_quality=100, method=6)


def biggest(mask):
    lab, n = ndimage.label(mask)
    if not n: return mask
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    return ndimage.binary_fill_holes(lab == (1 + int(np.argmax(sizes))))


for i, name in enumerate(NAMES):
    cx, cy = (i % 4) * cw, (i // 4) * ch
    f = fg[cy:cy + ch, cx:cx + cw]
    lab, n = ndimage.label(f)
    sizes = ndimage.sum(f, lab, range(1, n + 1))
    keep = np.isin(lab, [j + 1 for j, s in enumerate(sizes) if s > 200])
    ys, xs = np.where(keep)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb = a[cy + y0:cy + y1, cx + x0:cx + x1]
    k = keep[y0:y1, x0:x1].astype(np.float32)
    bh, bw = y1 - y0, x1 - x0
    lh = max(40, round(LH * bh / 465))     # 시트 안 키 차이(여자가 조금 작다)를 살린다
    lw = max(1, round(lh * bw / bh))
    # 윗옷: 몸통 띠의 흰색, 바지: 아래 띠의 회색. 머리(흰머리·회색 머리)와 신발은 띠로 거른다
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * R + 0.587 * G + 0.114 * B
    sat = np.max(rgb, -1) - np.min(rgb, -1)
    yy = np.arange(bh)[:, None] / bh
    gray = (sat < 26) & (lum > 120) & (lum < 222) & (yy > 0.6) & (yy < 0.94) & (k > 0)
    bot = biggest(gray)
    btop = np.where(bot.any(1))[0].min() / bh if bot.any() else 0.7
    white = (sat < 30) & (lum > 200) & (yy > 0.33) & (yy < btop + 0.02) & (k > 0)
    top = biggest(white)
    W4, H4 = lw * HI, lh * HI
    o_rgb, o_al = shrink(rgb, k, W4, H4)
    save(o_rgb, o_al, name)
    for suf, msk in (('_t', top), ('_b', bot)):
        ref = np.median(lum[msk]) if msk.any() else 255
        L = np.clip(lum / max(ref, 1) * 255, 0, 255)
        lrgb = np.repeat(L[..., None], 3, -1).astype(np.uint8)
        m_rgb, m_al = shrink(lrgb, msk.astype(np.float32), W4, H4)
        save(m_rgb, m_al, name + suf)
        index[name + suf] = [lw, lh, W4, H4]
    index[name] = [lw, lh, W4, H4]
    print(name, 'cell bbox', (bw, bh), '→', (lw, lh), 'top px', int(top.sum()), 'bot px', int(bot.sum()))

json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=0)
