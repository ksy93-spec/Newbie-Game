"""챗GPT가 그린 도트 시트를 게임 격자의 진짜 도트로 바꾼다.
시트의 '한 점'은 화면 4~8픽셀이라 그대로는 못 쓴다. 인물 키가 64칸이 되게 시트를 통째로 줄이고(칸마다 평균),
색을 서른 개 안팎으로 묶은 다음, 인물마다 48×68칸 판에 발끝을 맞춰 올린다.
 - 주인공(DOT-HERO-M/F): 나이 4줄 × 자세 6칸(앞, 앞 왼발, 앞 오른발, 옆, 옆 걷기, 뒤)을 한 줄 띠(288×68)로 저장.
   흰 티와 회색 바지 자리는 _t, _b 띠로 따로 뽑아 장비 색을 입힌다. 눈 자리는 dot-anch.json에 적는다.
 - 조연(DOT-REF-1 첫 줄, DOT-REF-2): 앞모습 한 장씩 dn_<열쇠>.
실행: python3.13 tools/art/slice-dot.py  (그다음 node tools/art/embed.mjs)
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'assets/art')
CW, CH, BASE, TH = 48, 68, 64, 64          # 판 크기, 발끝 줄, 인물 키
index = json.load(open(os.path.join(OUT, 'index.json')))
anch = {}


def load(name):
    a = np.asarray(Image.open(os.path.join(ROOT, 'ops/art', name)).convert('RGB')).astype(np.float32)
    m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    fg = ~((m > 80) & (a[..., 0] > 140) & (a[..., 2] > 140))
    return a, fg


def bands(fg, minlen=60):
    out, s = [], None
    for i, v in enumerate(list(fg) + [False]):
        if v and s is None: s = i
        if not v and s is not None:
            if i - s > minlen: out.append((s, i))
            s = None
    return out


def native(a, fg, scale, ncol=44):
    """통째로 줄인다. 배경 자홍이 섞이지 않게 알파를 곱해서 평균 낸다."""
    H, W = fg.shape; w, h = round(W / scale), round(H / scale)
    al = fg.astype(np.float32)
    ch = [np.asarray(Image.fromarray(a[..., i] * al).resize((w, h), Image.BOX)) for i in range(3)]
    A = np.asarray(Image.fromarray(al).resize((w, h), Image.BOX))
    rgb = np.clip(np.stack(ch, -1) / np.maximum(A, 1e-6)[..., None], 0, 255).astype(np.uint8)
    mask = A > 0.5
    # 색 묶기: 인물 칸만 모아서 서른 색으로
    px = rgb[mask]
    pal = Image.fromarray(px.reshape(1, -1, 3)).quantize(colors=ncol, method=Image.MEDIANCUT, dither=Image.NONE)
    rgb2 = rgb.copy(); rgb2[mask] = np.asarray(pal.convert('RGB')).reshape(-1, 3)
    return rgb2, mask


def place(rgb, mask):
    """인물 하나를 48×68 판에: 가로는 가운데, 발끝은 BASE 줄."""
    ys, xs = np.where(mask); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    c = np.zeros((CH, CW, 4), np.uint8)
    w, h = x1 - x0, y1 - y0
    sx0 = x0 + max(0, (w - CW) // 2); w = min(w, CW); sy0 = y0 + max(0, h - BASE); h = min(h, BASE)
    dx, dy = (CW - w) // 2, BASE - h
    c[dy:dy + h, dx:dx + w, :3] = rgb[sy0:sy0 + h, sx0:sx0 + w]
    c[dy:dy + h, dx:dx + w, 3] = mask[sy0:sy0 + h, sx0:sx0 + w] * 255
    return c


def cells(mask, n_rows, n_cols):
    """줄(가로 띠)마다 인물을 왼쪽부터 n_cols명 찾는다."""
    out = []
    for (ya, yb) in bands(mask.any(1), 20)[:n_rows]:
        cols = bands(mask[ya:yb].any(0), 8)[:n_cols]
        out.append([(ya, yb, xa, xb) for (xa, xb) in cols])
    return out


def save(arr, key):
    Image.fromarray(arr, 'RGBA').save(os.path.join(OUT, key + '.webp'), 'WEBP', lossless=True, method=6)
    index[key] = [arr.shape[1] // 2, arr.shape[0] // 2, arr.shape[1], arr.shape[0]]


def eyes(c, side):
    """눈: 얼굴 살색 안에 든 가장 어두운 덩어리. 앞은 둘, 옆은 하나."""
    rgb = c[..., :3].astype(int); a = c[..., 3] > 0
    lum = rgb.sum(-1) / 3
    dark = a & (lum < 70); dark[:12] = False; dark[36:] = False
    lab, n = ndimage.label(dark); found = []
    for j in range(1, n + 1):
        ys, xs = np.where(lab == j)
        if 6 <= len(ys) <= 40 and (ys.max() - ys.min()) >= 3 and (xs.max() - xs.min()) <= 6:
            # 둘레가 외곽선이 아니라 살색이어야 눈이다
            y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
            ring = rgb[max(0, y0 - 1):y1 + 2, max(0, x0 - 2):x1 + 3].reshape(-1, 3)
            if (ring[:, 0] > 200).mean() > 0.25: found.append([int(x0), int(x1), int(y0), int(y1), len(ys)])
    found.sort(key=lambda e: -e[4])
    return sorted([e[:4] for e in found[:1 if side else 2]])


def hero(name, sex):
    a, fg = load(name)
    rows = bands(fg.any(1))
    r0 = rows[0]; first = bands(fg[r0[0]:r0[1]].any(0), 20)[0]
    hh = np.where(fg[r0[0]:r0[1], first[0]:first[1]].any(1))[0]
    scale = (hh.max() - hh.min() + 1) / TH
    rgb, mask = native(a, fg, scale)
    grid = cells(mask, 4, 6)
    for age, row in zip([20, 32, 45, 60], grid):
        assert len(row) == 6, (name, age, len(row))
        strip = np.zeros((CH, CW * 6, 4), np.uint8); st = strip.copy(); sb = strip.copy()
        key = 'dh_%s%d' % (sex, age); A = {}
        for i, (ya, yb, xa, xb) in enumerate(row):
            c = place(rgb[ya:yb, xa:xb], mask[ya:yb, xa:xb]); strip[:, i * CW:(i + 1) * CW] = c
            R = c[..., :3].astype(int); lum = R.sum(-1) / 3; sat = R.max(-1) - R.min(-1); on = c[..., 3] > 0
            yy = np.arange(CH)[:, None]
            top = on & (lum > 196) & (sat < 34) & (yy >= 30) & (yy < 52)
            bot = on & (lum > 96) & (lum <= 196) & (sat < 34) & (yy >= 42) & (yy < 61)
            for msk, dst in ((top, st), (bot, sb)):
                if not msk.any(): continue
                ref = np.percentile(lum[msk], 90)
                L = np.clip(lum / max(ref, 1) * 255, 0, 255).astype(np.uint8)
                m4 = np.dstack([L, L, L, msk * 255]).astype(np.uint8); m4[~msk] = 0
                dst[:, i * CW:(i + 1) * CW] = m4
            if i in (0, 3): A['f' if i == 0 else 's'] = eyes(c, i == 3)
        save(strip, key); save(st, key + '_t'); save(sb, key + '_b'); anch[key] = A
        print(key, 'scale %.2f' % scale, A)


def npcs(name, band_names):
    a, fg = load(name)
    for (ya0, yb0), names in zip(bands(fg.any(1)), band_names):          # 줄마다 키를 따로 맞춘다
        sa, sf = a[ya0:yb0], fg[ya0:yb0]
        hs = [np.ptp(np.where(sf[:, xa:xb].any(1))[0]) + 1 for (xa, xb) in bands(sf.any(0), 40)]
        rgb, mask = native(sa, sf, float(np.median(hs)) / TH, 80)
        for (ya, yb, xa, xb), nm in zip(cells(mask, 1, 12)[0], names):
            if not nm: continue
            save(place(rgb[ya:yb, xa:xb], mask[ya:yb, xa:xb]), 'dn_' + nm); print('dn_' + nm, (xb - xa, yb - ya))


hero('DOT-HERO-M.png', 'm'); hero('DOT-HERO-F.png', 'f')
npcs('DOT-REF-2.png', [['gpa', 'gma', 'halbae', 'realtor', 'deskf', 'alba'], ['boss', 'peerf', 'peerm', 'rider', 'boy', 'girl']])
npcs('DOT-REF-1.png', [['', 'officem', 'fp', 'dad', '', 'mlmf', 'mom', 'gma2']])
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=0)
json.dump(anch, open(os.path.join(OUT, 'dot-anch.json'), 'w'))
