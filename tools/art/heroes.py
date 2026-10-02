#!/usr/bin/env python3
"""주인공 시트(ops/art/P1.png)를 캐릭터별 겹(몸·윗옷·바지)으로 나눠 assets/art/hero/에 저장한다.

실행: python3 tools/art/heroes.py  (pillow, numpy, scipy)  → 그다음 node tools/art/embed-heroes.mjs
게임 안 키는 64칸(예전 주인공과 같다)이고, 그림은 그 4배(256)로 색을 깎지 않고 저장한다. 게임이 화면 해상도에 맞춰 줄여 그린다.
윗옷은 초록(#38C95A), 바지는 파랑(#3B6FE8) 기본 옷이라 색으로 겹을 가른다. 게임은 이 두 겹을 장비 색으로 다시 칠한다.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
import slice as SL  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'art', 'hero')
H = 64                       # 게임 안 키(예전 주인공과 같다)
K = 4                        # 저장 배율
IDS = ['doyun', 'haeun', 'junhyuk', 'seoyun', 'woojin', 'jimin', 'taeyang', 'narae']


def labels(a):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    bg, _ = SL.magenta_mask(a)
    top = (g > r + 45) & (g > b + 25)
    bot = (b > r + 45) & (b > g + 20)
    lab = np.ones(a.shape[:2], np.int8)          # 1 몸
    lab[top] = 2
    lab[bot] = 3
    lab[bg] = 0
    return lab


def clean(mask, keep=0.03):
    """윗옷·바지 겹에서 머리카락 반사광 같은 작은 조각을 뺀다"""
    lab, n = ndimage.label(mask)
    if not n:
        return mask
    size = ndimage.sum(mask, lab, range(1, n + 1))
    ok = np.zeros(n + 1, bool)
    ok[1:] = size >= size.max() * keep
    return ok[lab]


def main():
    os.makedirs(OUT, exist_ok=True)
    a = np.asarray(Image.open(os.path.join(ROOT, 'ops', 'art', 'P1.png')).convert('RGB'))
    _, fg = SL.clean_fg(a)
    boxes, labmap = SL.components(fg, len(IDS), 6)
    lab = labels(a)
    tallest = max(b[2] - b[0] for b in boxes)
    s = H / tallest
    meta = {}
    for cid, (y0, x0, y1, x1, li) in zip(IDS, boxes):
        own = labmap[y0:y1, x0:x1] == li
        L = lab[y0:y1, x0:x1].copy()
        L[~own] = 0
        crop = a[y0:y1, x0:x1]
        masks = {'top': clean(L == 2), 'bot': clean(L == 3)}
        masks['body'] = (L > 0) & ~masks['top'] & ~masks['bot']
        hh, ww = round((y1 - y0) * s), round((x1 - x0) * s)          # 게임 안 크기
        W, HH = ww + 2, H                                              # 양옆 한 칸 여유
        out = {}
        for k in ('body', 'top', 'bot'):
            rgb, al = SL.shrink(crop, masks[k], ww * K, hh * K)
            im = SL.to_img(rgb, al)
            cv = Image.new('RGBA', (W * K, HH * K), (0, 0, 0, 0))
            cv.paste(im, (K, (HH - hh) * K), im)
            out[k] = cv
            cv.save(os.path.join(OUT, cid + '_' + k + '.webp'), 'WEBP', quality=92, alpha_quality=100, method=6)
        Image.new('RGBA', (W * K, HH * K), (0, 0, 0, 0)).save(os.path.join(OUT, cid + '_empty.webp'), 'WEBP', lossless=True)
        # 자리 잡기(게임 안 좌표): 바지 시작 줄(hip), 두 다리 사이(split), 눈 줄(eye), 얼굴 가운데(fcx), 손(hx, hy)
        lo = {k: np.asarray(out[k].resize((W, HH), Image.BOX))[..., 3] > 100 for k in out}
        body_lo = np.asarray(out['body'].resize((W, HH), Image.BOX))
        allm = lo['body'] | lo['top'] | lo['bot']
        botrows = np.where(lo['bot'].any(1))[0]
        toprows = np.where(lo['top'].any(1))[0]
        hip = int(botrows.min()) if len(botrows) else HH - 16
        head0 = int(np.where(allm.any(1))[0].min())
        neck = int(toprows.min()) if len(toprows) else hip - 14
        eye = head0 + int(round((neck - head0) * 0.62))
        bh = np.asarray(out['body']).astype(int)                 # 눈 찾기: 살색 사이에 낀 짙은 점이 가장 많은 줄
        lumh = bh[..., 0] * .3 + bh[..., 1] * .59 + bh[..., 2] * .11
        skinh = (bh[..., 3] > 200) & (bh[..., 0] > 200) & (bh[..., 1] > 150)
        darkh = (bh[..., 3] > 200) & (lumh < 90)
        best, by = 0, None
        for yy in range((head0 + (neck - head0) // 3) * K, neck * K):
            row = darkh[yy]; sk = skinh[yy]
            xs_ = np.where(row)[0]
            n = sum(1 for x in xs_ if sk[max(0, x - 6):x].any() and sk[x + 1:x + 7].any())
            if n > best:
                best, by = n, yy
        if by is not None:
            eye = int(round(by / K))
        cols = np.where(allm[head0:neck].any(0))[0]
        fcx = int(round((cols.min() + cols.max()) / 2))
        lowleg = lo['bot'][HH - 8]
        xs = np.where(lowleg)[0]
        split = fcx
        if len(xs):
            gaps = [x for x in range(xs.min(), xs.max()) if not lowleg[x]]
            split = int(round(np.mean(gaps))) if gaps else int(round((xs.min() + xs.max()) / 2))
        skin = lo['body'] & (body_lo[..., 0].astype(int) > 200) & (body_lo[..., 1].astype(int) > 150)
        band = skin[neck:hip + 8, :fcx]
        ys, xs2 = np.nonzero(band)
        if len(ys):
            sel = ys >= ys.max() - 3
            hx, hy = int(round(xs2[sel].mean())), int(neck + ys[sel].mean())
        else:
            hx, hy = 4, hip
        def base(k):
            px = np.asarray(out[k])
            v = px[..., :3][px[..., 3] > 200]
            return [int(t) for t in np.median(v, 0)] if len(v) else [128, 128, 128]
        meta[cid] = dict(w=W, h=HH, k=K, hip=hip, split=split, eye=eye, fcx=fcx, hx=hx, hy=hy, topBase=base('top'), botBase=base('bot'))
        print(cid, meta[cid])
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
