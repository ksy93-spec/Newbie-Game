#!/usr/bin/env python3
"""한 장에 여럿 그려진 원화에서 조연 스프라이트를 잘라낸다.

배경이 밝은 벽과 어두운 건물 두 가지라 한 가지 방법으로는 안 된다.

  outline_free  테두리에서 시작해 어둡지 않은 픽셀만 따라 채운다. 인물의 검은 외곽선에
                막혀 안쪽은 남으므로 할머니의 흰머리가 살아남는다. 대신 어두운 건물이 남는다.
  color_bg      테두리에서 시작해 같은 색만 따라 채운다. 평평한 건물은 떼어내지만
                밝은 벽과 색이 가까운 흰머리를 먹는다.

둘을 교차시키면 서로의 약점을 덮는다. 인물에 둘러싸여 테두리에서 닿지 않는 건물 조각은
색으로 한 번 더 지운다.

상자는 인물보다 넉넉하게 잡는다. 상자 변이 인물을 스치면 그 변에서 시작한 채우기가 몸 안으로
흘러들어 지팡이나 손에 든 물건이 통째로 사라진다.

    python3 tools/cut-cast.py 원화.png 출력폴더
"""
import sys
from collections import deque

import numpy as np
from PIL import Image
from scipy import ndimage

# (이름, 상자, 목표 높이, 배경으로 지울 색)
FIGURES = [
    ('npc_gpa', (60, 186, 278, 662), 64, (51, 58, 76)),
    ('npc_gma', (266, 194, 470, 660), 64, None),
    ('pet_dog', (462, 436, 662, 660), 30, None),
    ('pet_turtle', (652, 540, 826, 660), 20, None),
    ('pet_bird', (828, 486, 1002, 662), 28, None),
    ('npc_boy', (946, 300, 1150, 660), 54, None),
    ('npc_girl', (1156, 304, 1354, 664), 54, None),
]
# 줄이고 난 뒤에도 몸에 8방향으로 붙어 있어 어떤 자동 방법으로도 안 떨어지는 벽 조각.
# 좌표는 최종 크기 기준 (y0, y1, x0, x1), 양끝 포함.
ERASE = {
    'npc_girl': [(11, 16, 0, 4), (43, 43, 0, 3), (44, 44, 0, 4), (45, 45, 0, 6), (46, 46, 0, 8)],
}
DARK = 104   # 이 밝기 아래를 외곽선으로 본다
TOL = 28     # 같은 색으로 볼 차이(RGB 절대차 합)
NCOL = 22    # 줄인 뒤 남길 색 수


def _seeds(h, w):
    return (
        [(0, i) for i in range(w)]
        + [(h - 1, i) for i in range(w)]
        + [(i, 0) for i in range(h)]
        + [(i, w - 1) for i in range(h)]
    )


def outline_free(lum, dark=DARK):
    h, w = lum.shape
    free = np.zeros((h, w), bool)
    q = deque()
    for y, x in _seeds(h, w):
        if not free[y, x] and lum[y, x] >= dark:
            free[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not free[ny, nx] and lum[ny, nx] >= dark:
                free[ny, nx] = True
                q.append((ny, nx))
    return free


def color_bg(rgb, tol=TOL):
    h, w = rgb.shape[:2]
    bg = np.zeros((h, w), bool)
    q = deque()
    for y, x in _seeds(h, w):
        if not bg[y, x]:
            bg[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        c = rgb[y, x]
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and abs(rgb[ny, nx] - c).sum() <= tol:
                bg[ny, nx] = True
                q.append((ny, nx))
    return bg


def cut(rgb_all, lum_all, box, erase_rgb):
    x0, y0, x1, y1 = box
    rgb = rgb_all[y0:y1, x0:x1]
    lum = lum_all[y0:y1, x0:x1]
    keep = (~outline_free(lum)) & (~color_bg(rgb))
    keep = ndimage.binary_fill_holes(keep)
    if erase_rgb is not None:  # 몸에 둘러싸여 남은 건물 조각
        keep &= ~(np.abs(rgb - np.array(erase_rgb)).sum(2) <= 46)
        keep = ndimage.binary_opening(keep, np.ones((2, 2)))
    lab, n = ndimage.label(keep, np.ones((3, 3)))
    if n:
        sz = ndimage.sum(keep, lab, range(1, n + 1))
        big = int(np.argmax(sz)) + 1
        cx = np.where(lab == big)[1].mean()
        near = np.abs(np.arange(keep.shape[1])[None, :] - cx) < 90
        keep = (lab == big) | ((lab > 0) & (sz[lab - 1] > sz[big - 1] * 0.02) & near)
        keep = ndimage.binary_fill_holes(keep)
    ys, xs = np.where(keep)
    sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    return Image.fromarray(
        np.dstack([rgb[sl], np.where(keep[sl], 255, 0)]).astype('uint8'), 'RGBA'
    )


def shrink(im, target_h, erase=()):
    """정수 배율이 아니라 BOX 평균으로 줄인 뒤 알파를 이진화한다.
    반투명 가장자리를 남기면 확대할 때 뿌옇게 번진다."""
    w = max(1, round(im.width * target_h / im.height))
    arr = np.array(im.resize((w, target_h), Image.BOX))
    alpha = arr[:, :, 3] > 120
    rgb = Image.fromarray(arr[:, :, :3], 'RGB').quantize(colors=NCOL, method=Image.MEDIANCUT)
    out = np.dstack([np.array(rgb.convert('RGB')), np.zeros_like(alpha, 'uint8')])
    # 이웃이 하나뿐인 점은 잘라내다 남은 먼지다
    op = alpha.astype(int)
    pad = np.pad(op, 1)
    nb = sum(
        pad[1 + dy : 1 + dy + op.shape[0], 1 + dx : 1 + dx + op.shape[1]]
        for dy in (-1, 0, 1)
        for dx in (-1, 0, 1)
    ) - op
    out[:, :, 3] = np.where(alpha & (nb >= 2), 255, 0)
    for y0, y1, x0, x1 in erase:
        out[y0 : y1 + 1, x0 : x1 + 1, 3] = 0
    img = Image.fromarray(out, 'RGBA')
    ys, xs = np.where(np.array(img)[:, :, 3] > 0)
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def main():
    src, out = sys.argv[1], sys.argv[2].rstrip('/')
    rgb_all = np.array(Image.open(src).convert('RGB')).astype(int)
    lum_all = 0.299 * rgb_all[:, :, 0] + 0.587 * rgb_all[:, :, 1] + 0.114 * rgb_all[:, :, 2]
    for name, box, h, erase in FIGURES:
        im = shrink(cut(rgb_all, lum_all, box, erase), h, ERASE.get(name, ()))
        im.save(f'{out}/{name}.png')
        print(f'{name:12s} {im.width}x{im.height}   → sprite/cast.ts 의 w, h 에 그대로 적는다')


if __name__ == '__main__':
    main()
