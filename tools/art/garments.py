#!/usr/bin/env python3
"""마네킹 옷 시트와 뒷모습(ops/art/P3.png)을 잘라 assets/art/에 저장한다.

실행: python3 tools/art/garments.py  → node tools/art/embed.mjs
P3 한 장에 세 묶음이 있다(흰 줄로 나뉨).
  위(4×4): 윗옷 16벌을 입은 회색 마네킹 → gt_<장비 id>
  가운데(5×2): 바지 10벌 → gb_<장비 id>
  아래(4×2): 주인공 여덟 명의 뒷모습 → hb_<주인공 id>
마네킹 회색(#D2D2D0 언저리)과 자홍 배경을 지우고 옷만 남긴다. 게임은 마네킹의 어깨·발 줄을 주인공의 어깨·발 줄에 맞춰
옷을 늘려 입힌다(index.json에 [옷 너비, 높이, 저장 너비, 높이, 어깨 y, 발 y, 가운데 x], 모두 옷 그림 좌표).
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
OUT = os.path.join(ROOT, 'assets', 'art')
TOPS = ['shirt', 'suit', 'badge', 'hoodie', 'suitg', 'padded', 'nomu', 'windbrk', 'knitvest', 'quiztee', 'mq_badge', 'mq_suit',
        'oxford', 'cardigan', 'bosssuit', 'knit']
BOTS = ['beige', 'jeans', 'slack', 'train', 'skinny', 'cargo', 'linen', 'luckypants', 'mq_homepants', 'wideslk']
HEROES = ['doyun', 'haeun', 'junhyuk', 'seoyun', 'woojin', 'jimin', 'taeyang', 'narae']
UP = 3                        # 옷 그림은 원본이 작아 세 배로 키워 저장한다(부드럽게)


def runs(v, thr=20):
    out, s = [], None
    for i, x in enumerate(list(v) + [False]):
        if x and s is None:
            s = i
        if not x and s is not None:
            if i - s > thr:
                out.append((s, i))
            s = None
    return out


def cells(a, y0, y1):
    sub = a[y0:y1]
    white = np.all(sub > 225, axis=-1)
    return [(y0 + r0, y0 + r1, c0, c1) for (r0, r1) in runs(white.mean(1) < 0.6) for (c0, c1) in runs(white.mean(0) < 0.6)]


def figure(c):
    bg, _ = SL.magenta_mask(c)
    fg = ndimage.binary_opening(~bg, iterations=1)
    lab, n = ndimage.label(fg)
    if not n:
        return fg
    size = ndimage.sum(fg, lab, range(1, n + 1))
    return lab == (int(size.argmax()) + 1)


def landmarks(fig):
    """마네킹의 목 줄(머리와 어깨 사이 가장 좁은 줄), 발 줄, 가운데"""
    ys = np.where(fig.any(1))[0]
    top, feet = ys.min(), ys.max()
    width = fig.sum(1)
    H = feet - top
    lo, hi = top + int(H * 0.15), top + int(H * 0.40)
    sh = int(lo + np.argmin(width[lo:hi]))
    xs = np.where(fig[sh + 2:sh + 10].any(0))[0]
    return int(sh), int(feet), float((xs.min() + xs.max()) / 2)


def garment(c, fig, kind, sh, feet):
    """옷만 남긴다. 윗옷은 어깨 줄 위(머리)를, 바지는 허리 줄 위(티셔츠)를 지운다.
    마네킹 회색은 밝은 회색(살)과, 정해진 줄 바깥의 옅은 회색(마네킹 바지·티셔츠)이다. 회색 후드·트레이닝복은 줄 안이라 남는다."""
    r, g, b = [c[..., i].astype(int) for i in range(3)]
    lum = r * .3 + g * .59 + b * .11
    sat = np.max(c, -1).astype(int) - np.min(c, -1).astype(int)
    H, W = fig.shape
    rows = np.arange(H)[:, None] * np.ones((1, W), int)
    hip = sh + int(round((feet - sh) * 0.50))
    grayish = (sat < 16) & (lum >= 140)
    skin = grayish & (lum >= 196) & (lum <= 228)
    if kind == 'top':
        band = rows >= sh - 1                                    # 목 줄 아래가 옷
        body = fig & (rows >= sh) & (rows < hip)
        gray_cloth = (grayish & ~skin & body).sum() > 0.35 * body.sum()   # 회색 옷(후드)인지
        mann = skin | (grayish & (rows >= hip)) | (grayish & ~gray_cloth)  # 아니면 옅은 회색은 모두 마네킹(손)
        mann |= (sat < 16) & (lum >= 105) & (rows < sh + 3)          # 목 둘레 회색 그늘은 마네킹
    else:
        band = rows >= hip - 1
        mann = skin & (rows < hip + 2) | (grayish & (rows < hip))
    dark = lum < 70
    thick = ndimage.binary_opening(dark, iterations=2)          # 검은 옷감(두꺼운 어둠)은 옷, 가는 선은 외곽선
    cloth = fig & band & ~mann & (~dark | thick)
    near = ndimage.binary_dilation(cloth, iterations=1)
    k = np.ones((5, 5))
    mann_n = ndimage.convolve(mann.astype(float), k, mode='constant')
    cloth_n = ndimage.convolve(cloth.astype(float), k, mode='constant')
    line = dark & near & (mann_n <= cloth_n)                    # 손·다리 외곽선(마네킹 쪽이 더 많은 선)은 뺀다
    if kind == 'top':
        line &= rows < hip + 3
    keep = fig & band & ~mann & (cloth | line)
    lab, n = ndimage.label(keep)
    if n:
        size = ndimage.sum(keep, lab, range(1, n + 1))
        ok = np.zeros(n + 1, bool)
        ok[1:] = size >= size.max() * 0.08
        keep = ok[lab]
    return keep


def save(img, name):
    img.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=92, alpha_quality=100, method=6)


def main():
    a = np.asarray(Image.open(os.path.join(ROOT, 'ops', 'art', 'P3.png')).convert('RGB'))
    ip = os.path.join(OUT, 'index.json')
    index = json.load(open(ip)) if os.path.exists(ip) else {}
    groups = [(0, 556, TOPS, 'gt_', 'top'), (558, 800, BOTS, 'gb_', 'bot'), (800, 1024, HEROES, 'hb_', 'back')]
    for y0, y1, names, pre, kind in groups:
        cs = cells(a, y0, y1)
        if len(cs) != len(names):
            print('칸 수가 다르다', pre, len(cs))
        for name, (r0, r1, c0, c1) in zip(names, cs):
            c = a[r0 + 2:r1 - 2, c0 + 2:c1 - 2]
            fig = figure(c)
            sh, feet, cx = landmarks(fig)
            mask = fig if kind == 'back' else garment(c, fig, kind, sh, feet)
            if kind == 'bot':                                   # 신발은 주인공 것을 쓴다: 발목 아래를 자른다
                mask[feet - max(4, (feet - sh) // 7):] = False
            ys, xs = np.nonzero(mask)
            if not len(ys):
                print('비었다', pre + name)
                continue
            y_0, y_1, x_0, x_1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            crop, m = c[y_0:y_1, x_0:x_1], mask[y_0:y_1, x_0:x_1]
            w, h = x_1 - x_0, y_1 - y_0
            rgb, al = SL.shrink(crop, m, w * UP, h * UP) if UP == 1 else (None, None)
            # 배경색이 가장자리로 번지지 않게, 알파를 곱해 키운 뒤 다시 나눈다
            af = m.astype(np.float32)
            chans = [np.asarray(Image.fromarray(crop[..., i].astype(np.float32) * af).resize((w * UP, h * UP), Image.BICUBIC)) for i in range(3)]
            al = np.clip(np.asarray(Image.fromarray(af).resize((w * UP, h * UP), Image.BICUBIC)), 0, 1)
            rgb = np.clip(np.stack(chans, -1) / np.maximum(al, 1e-3)[..., None], 0, 255).astype(np.uint8)
            img = Image.fromarray(np.dstack([rgb, (np.clip(al * 1.1, 0, 1) * 255).astype(np.uint8)]), 'RGBA')
            save(img, pre + name)
            w, h = int(w), int(h)
            index[pre + name] = [w, h, w * UP, h * UP, int(sh - y_0), int(feet - y_0), round(cx - x_0, 1)]
        print(pre, len(cs))
    json.dump(dict(sorted(index.items())), open(ip, 'w'), ensure_ascii=False, indent=0)


if __name__ == '__main__':
    main()
