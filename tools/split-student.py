"""대학생 아바타를 레이어로 쪼갠다.

옛 아바타(imgM/imgF)와 달리 이 그림은 손을 모으고 가방을 멨다. 커피잔이나 서류가방을
지울 일이 없으니 hand 레이어도 필요 없다. 색을 바꿔야 하는 건 머리 · 상의 · 하의 셋뿐이고,
나머지(살 · 셔츠 · 가방 · 끈 · 신발 · 외곽선)는 전부 body에 둔다.
가방은 재킷과 같은 남색이라 색으로는 못 가른다. 자리로 가른다.
"""
from PIL import Image
import numpy as np
from collections import deque

CFG = {
    'stuF': dict(headBottom=30, faceX=(13, 29), eyeTop=16, faceBot=28,
                 bag=(3, 41, 13, 53), torsoY=(28, 50), hipY=47, shoeTop=58),
    'stuM': dict(headBottom=27, faceX=(8, 27), eyeTop=15, faceBot=27,
                 bag=(2, 36, 12, 50), torsoY=(25, 51), hipY=47, shoeTop=58),
}


def lum(p):
    return .299 * p[0] + .587 * p[1] + .114 * p[2]


def navy(p):
    return p[2] >= p[0] + 6 and lum(p) < 105


def khaki(p):
    return p[0] > p[1] > p[2] and 120 < lum(p) < 225 and p[0] - p[2] > 20


def split(tag):
    c = CFG[tag]
    A = np.array(Image.open(tag + '64.png').convert('RGBA')).astype(int)
    H, W = A.shape[:2]
    op = A[:, :, 3] > 128

    # ── 머리카락: 정수리에서 흘려 채운다. 얼굴 칸과 머리 아래는 건드리지 않는다.
    fx0, fx1 = c['faceX']
    hair = np.zeros((H, W), bool)

    def hairish(x, y):
        if not op[y, x] or y > c['headBottom']:
            return False
        p = A[y, x][:3]
        if lum(p) > 110:
            return False
        if fx0 <= x <= fx1 and c['eyeTop'] <= y <= c['faceBot']:
            return False
        return True

    q = deque()
    for x in range(W):
        for y in range(0, 6):
            if hairish(x, y) and not hair[y, x]:
                hair[y, x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and not hair[ny, nx] and hairish(nx, ny):
                hair[ny, nx] = True
                q.append((nx, ny))

    # ── 상의: 몸통 줄의 남색. 가방 자리는 뺀다.
    bx0, by0, bx1, by1 = c['bag']
    ty0, ty1 = c['torsoY']
    top = np.zeros((H, W), bool)
    for y in range(ty0, min(ty1, H - 1) + 1):
        for x in range(W):
            if not op[y, x] or hair[y, x]:
                continue
            if bx0 <= x <= bx1 and by0 <= y <= by1:
                continue
            if navy(A[y, x][:3]):
                top[y, x] = True

    # ── 하의: 엉덩이 아래 신발 위의 카키
    bot = np.zeros((H, W), bool)
    for y in range(c['hipY'], min(c['shoeTop'], H - 1) + 1):
        for x in range(W):
            if op[y, x] and not top[y, x] and not hair[y, x] and khaki(A[y, x][:3]):
                bot[y, x] = True

    body = op & ~hair & ~top & ~bot

    # 원본 배경의 반짝임 조각이 몇 점 따라 들어왔다. 몸에서 떨어진 작은 덩어리는 버린다.
    from scipy import ndimage
    lab, n = ndimage.label(op, np.ones((3, 3)))
    if n:
        sz = ndimage.sum(op, lab, range(1, n + 1))
        main = int(np.argmax(sz)) + 1
        stray = (lab > 0) & (lab != main)
        for m in (body, bot, top, hair):
            m &= ~stray

    return A, {'body': body, 'bot': bot, 'top': top, 'hair': hair}


def png(A, m):
    H, W = A.shape[:2]
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    p = im.load()
    for y in range(H):
        for x in range(W):
            if m[y, x]:
                p[x, y] = tuple(int(v) for v in A[y, x])
    return im


def basecol(A, m):
    px = [A[y, x][:3] for y in range(A.shape[0]) for x in range(A.shape[1])
          if m[y, x] and lum(A[y, x][:3]) > 40]
    px.sort(key=lum)
    return [int(v) for v in px[int(len(px) * .62)]] if px else [0, 0, 0]


if __name__ == '__main__':
    order = ['body', 'bot', 'top', 'hair']
    sheets = []
    for tag in ['stuM', 'stuF']:
        A, M = split(tag)
        H, W = A.shape[:2]
        ims = {}
        for n in order:
            ims[n] = png(A, M[n])
            ims[n].save(f'L_{tag}_{n}.png')
        comp = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for n in order:
            comp = Image.alpha_composite(comp, ims[n])
        print(tag, {n: int(M[n].sum()) for n in order},
              'hair', basecol(A, M['hair']), 'top', basecol(A, M['top']), 'bot', basecol(A, M['bot']))
        sh = Image.new('RGBA', ((W + 2) * (len(order) + 2), H), (0, 0, 0, 0))
        sh.paste(Image.open(tag + '64.png'), (0, 0))
        sh.paste(comp, (W + 2, 0))
        for i, n in enumerate(order):
            sh.paste(ims[n], ((i + 2) * (W + 2), 0))
        sheets.append(sh)
    tw = max(s.width for s in sheets)
    o = Image.new('RGBA', (tw, sum(s.height for s in sheets) + 8), (255, 0, 255, 255))
    y = 0
    for s in sheets:
        o.paste(s, (0, y), s)
        y += s.height + 8
    o.resize((o.width * 6, o.height * 6), Image.NEAREST).save('layer_check.png')
    print('wrote layer_check.png')
