#!/usr/bin/env python3
"""ChatGPT로 뽑은 에셋 시트(ops/art/*.png)를 칸별로 잘라 assets/art/에 저장한다.

실행: pip install pillow numpy scipy && python3 tools/art/slice.py
결과: assets/art/<이름>.webp, assets/art/index.json(이름: [게임 안 너비, 높이, 저장 너비, 높이]).
게임에 넣는 것은 tools/art/embed.mjs.

게임 안 크기(논리 크기)는 예전 도트 그림과 같게 두고, 그림은 그 4배 해상도로(원본보다 크게는 키우지 않는다)
색을 깎지 않고 저장한다. 게임은 화면 해상도에 맞춰 부드럽게 줄여 그린다. 칸마다 자홍색 배경을 지우고
배경 쪽으로 번진 보라색 테두리만 외곽선 색으로 바꾼다.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'ops', 'art')
OUT = os.path.join(ROOT, 'assets', 'art')
OUTLINE = (44, 44, 49)
HI = 4          # 저장 해상도 = 게임 안 크기 × HI (원본이 더 작으면 원본 크기)

# 시트마다 칸 순서대로 붙일 이름. None은 버리는 칸이다.
# join: 이 거리(픽셀) 안의 조각은 한 칸으로 묶는다(기본 6, 반짝이가 떨어진 C는 14).
# pad: 인물은 이 크기 캔버스 가운데 아래에 놓는다(대화창·퀘스트 화면 비율을 고정).
# fit: ('h', 64)는 시트 전체를 같은 배율로 줄여 가장 큰 것의 높이를 64로, ('box', 40)은 칸마다 40×40 안에 맞춘다.
SHEETS = {
    'A': dict(fit=('h', 64), pad=(36, 64), names=['npc_halbae', 'npc_gpa', 'npc_partnerF', 'npc_partnerM', 'npc_boy', 'npc_girl']),
    'B': dict(fit=('h', 64), pad=(36, 64), names=['npc_gma', 'npc_peerm', 'npc_peerf', 'npc_deskf', 'npc_officem', 'npc_boss', 'npc_mlmf', 'npc_fp']),
    'C': dict(fit=('box', 26), join=14, names=['it_pen', 'it_mouse', 'it_tumbler', 'it_keyb', 'it_board', 'it_laptop', 'it_card', 'it_receipt',
                                      'it_otp', 'it_lunchbox', 'it_goldpen', 'it_catmug', 'it_goldstamp', 'it_mq_lease', 'it_mq_card', 'it_wallet']),
    'D': dict(fit=('box', 26), names=['it_shirt', 'it_suit', 'it_badge', 'it_hoodie', 'it_suitg', 'it_padded', 'it_nomu', 'it_windbrk',
                                      'it_knitvest', 'it_quiztee', 'it_mq_badge', 'it_mq_suit', 'it_oxford', 'it_cardigan', 'it_bosssuit',
                                      'it_beige', 'it_jeans', 'it_slack', 'it_train', 'it_skinny', 'it_cargo', 'it_linen', 'it_luckypants',
                                      'it_mq_homepants', 'it_wideslk']),
    'E': dict(fit=('box', 26), names=['it_glass', 'it_band', 'it_beanie', 'it_beanie2', 'it_shades', 'it_mq_shades',
                                      'it_bird', 'it_dog', 'it_turtle', 'it_kick', 'it_bike', 'it_car', 'it_ebike', 'it_sedan', 'it_evcar']),
    'F': dict(fit=('box', 30), names=['fu_ramen', 'fu_mat', 'fu_fan', 'fu_desk2', 'fu_fridge', 'fu_bed', 'fu_wash', 'fu_tv', 'fu_styler',
                                      'fu_sofa', 'fu_aircon', 'fu_dryer', 'fu_robot', 'fu_dish', 'fu_massage', 'fu_bigtv', 'fu_fridge2',
                                      'fu_purifier', 'fu_bed2', 'fu_table2', 'fu_shelf', 'fu_plant']),
    'G': dict(fit=('h', 88), names=['ho_%d' % i for i in range(15)]),
}
# 흰 줄로 나뉜 그림 칸(배경, 엽서, 질감). region은 원본에서 그 묶음이 있는 범위(x0, y0, x1, y1).
PANELS = {
    'H1 AND H2': [dict(region=None, names=['bg_night', 'bg_phone', 'bg_office', 'bg_meeting', 'bg_bank', 'bg_carlot', 'bg_road', 'bg_cafe',
                                           'bg_station', 'bg_weddinghall', 'bg_modelhouse', 'bg_apartment', 'bg_livingroom', 'bg_town',
                                           'bg_hometown'], scale=1.0)],
    'I J K': [dict(region=(0, 0, 512, 440), names=['ui_home', 'ui_wiki', 'ui_char', 'ui_shop', 'ui_coin', 'ui_heart', 'ui_star', 'ui_lock',
                                                    'ui_key', 'ui_job', 'ui_money', 'ui_food', 'ui_cloth', 'ui_study', 'ui_alert', 'ui_pin'],
                   icon=20),
              dict(region=(514, 0, 1536, 498), names=['pc_gangneung', 'pc_ojuk', 'pc_jeonju', 'pc_jeonju_market', 'pc_haeundae',
                                                       'pc_gamcheon', 'pc_jagalchi', 'pc_gyeongju', 'pc_seomun', 'pc_kimgwangseok'], scale=1.0),
              dict(region=(0, 500, 1536, 1024), names=['tx_brick', 'tx_redbrick', 'tx_glass', 'tx_concrete', 'tx_hanok', 'tx_shop',
                                                        'tx_wood', 'tx_apt', 'tx_tile', 'tx_stone'], scale=1.0)],
}


def magenta_mask(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    m = np.minimum(r, b) - g
    return (m > 90) & (r > 150) & (b > 150), m


def clean_fg(a):
    """자홍 배경을 지우고 배경과 맞닿은 보라색 테두리를 외곽선 색으로 바꾼다."""
    bg, m = magenta_mask(a)
    fg = ~bg
    edge = fg & ndimage.binary_dilation(bg, iterations=2) & (m > 30)
    a = a.copy()
    a[edge] = OUTLINE
    return a, fg


def shrink(rgb, fg, w, h):
    """배경을 뺀 평균으로 줄인다. 반 넘게 배경인 칸은 투명."""
    pm = rgb.astype(np.float32) * fg[..., None]
    chans = [np.asarray(Image.fromarray(pm[..., i]).resize((w, h), Image.BOX)) for i in range(3)]
    al = np.asarray(Image.fromarray(fg.astype(np.float32)).resize((w, h), Image.BOX))
    out = np.stack(chans, -1) / np.maximum(al, 1e-6)[..., None]
    return np.clip(out, 0, 255).astype(np.uint8), al


def to_img(rgb, alpha):
    a = np.clip(alpha * 1.15, 0, 1)                    # 가장자리만 살짝 또렷하게
    return Image.fromarray(np.dstack([rgb, (a * 255).astype(np.uint8)]), 'RGBA')


def save(im, name, q=92):
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=q, alpha_quality=100, method=6)


def components(fg, expect, join=6):
    """가까운 조각(반짝이, 도장과 인주)은 하나로 묶고, 줄 단위로 왼쪽부터 정렬한다."""
    lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=join))
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        part = fg[sl] & (lab[sl] == i + 1)
        if part.sum() < 800:
            continue
        ys, xs = np.nonzero(part)
        boxes.append((sl[0].start + ys.min(), sl[1].start + xs.min(), sl[0].start + ys.max() + 1, sl[1].start + xs.max() + 1, i + 1))
    if len(boxes) != expect:
        print('  칸 수가 다르다: %d개 찾음, %d개 기대' % (len(boxes), expect))
    hs = np.median([b[2] - b[0] for b in boxes])
    boxes.sort(key=lambda b: (b[0] + b[2]) / 2)
    rows, cur = [], []
    for b in boxes:
        if cur and (b[0] + b[2]) / 2 - (cur[0][0] + cur[0][2]) / 2 > hs * 0.6:
            rows.append(cur)
            cur = []
        cur.append(b)
    rows.append(cur)
    return [b for r in rows for b in sorted(r, key=lambda b: b[1])], lab


def do_sheet(key, spec, index):
    path = os.path.join(SRC, key + '.png')
    a = np.asarray(Image.open(path).convert('RGB'))
    a, fg = clean_fg(a)
    boxes, lab = components(fg, len(spec['names']), spec.get('join', 6))
    kind, size = spec['fit']
    tallest = max(b[2] - b[0] for b in boxes)
    for name, (y0, x0, y1, x1, li) in zip(spec['names'], boxes):
        if not name:
            continue
        mask = fg[y0:y1, x0:x1] & ndimage.binary_dilation(lab[y0:y1, x0:x1] == li, iterations=2)
        h, w = y1 - y0, x1 - x0
        s = size / tallest if kind == 'h' else size / max(h, w)          # 게임 안 배율
        lw, lh = max(1, round(w * s)), max(1, round(h * s))
        k = min(HI, 1 / s)                                               # 저장 배율(원본보다 키우지 않는다)
        W, H = max(1, round(w * s * k)), max(1, round(h * s * k))
        rgb, al = shrink(a[y0:y1, x0:x1], mask, W, H)
        im = to_img(rgb, al)
        if 'pad' in spec:                          # 인물은 같은 캔버스에 발끝을 맞춰 넣는다
            PW, PH = spec['pad']
            cw, ch = round(PW * k), round(PH * k)
            cv = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
            cv.paste(im, ((cw - W) // 2, ch - H), im)
            im, W, H, lw, lh = cv, cw, ch, PW, PH
        save(im, name)
        index[name] = [lw, lh, W, H]
    print('%s: %d개' % (key, min(len(boxes), len(spec['names']))))


def runs(v, thr):
    """True가 이어지는 구간(시작, 끝) 목록"""
    out, s = [], None
    for i, x in enumerate(list(v) + [False]):
        if x and s is None:
            s = i
        if not x and s is not None:
            if i - s > thr:
                out.append((s, i))
            s = None
    return out


def do_panels(key, groups, index):
    im = Image.open(os.path.join(SRC, key + '.png')).convert('RGB')
    full = np.asarray(im)
    for g in groups:
        x0, y0, x1, y1 = g['region'] or (0, 0, im.width, im.height)
        a = full[y0:y1, x0:x1]
        white = np.all(a > 232, axis=-1)
        cols = runs(white.mean(0) < 0.6, 20)
        rows = runs(white.mean(1) < 0.6, 20)
        cells = [(r, c) for r in rows for c in cols]
        if len(cells) != len(g['names']):
            print('  %s: 칸 %d개 찾음(%d×%d), %d개 기대' % (key, len(cells), len(cols), len(rows), len(g['names'])))
        for name, ((ry0, ry1), (cx0, cx1)) in zip(g['names'], cells):
            c = a[ry0 + 2:ry1 - 2, cx0 + 2:cx1 - 2]
            if 'icon' in g:
                c2, fg = clean_fg(c)
                ys, xs = np.nonzero(fg)
                c2, fg = c2[ys.min():ys.max() + 1, xs.min():xs.max() + 1], fg[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
                s = g['icon'] / max(c2.shape[:2])
                lw, lh = max(1, round(c2.shape[1] * s)), max(1, round(c2.shape[0] * s))
                k = min(HI, 1 / s)
                W, H = max(1, round(c2.shape[1] * s * k)), max(1, round(c2.shape[0] * s * k))
                rgb, al = shrink(c2, fg, W, H)
                save(to_img(rgb, al), name)
                index[name] = [lw, lh, W, H]
            else:
                W, H = round(c.shape[1] * g['scale']), round(c.shape[0] * g['scale'])
                img = Image.fromarray(c)
                if (W, H) != img.size:
                    img = img.resize((W, H), Image.LANCZOS)
                save(img, name, 88)
                index[name] = [W, H, W, H]
        print('%s: %d개' % (key, min(len(cells), len(g['names']))))


def patch():
    """상표처럼 보이는 곳을 덮는다. 상자는 그림 크기에 대한 비율(x0, y0, x1, y1)."""
    def recolor(n, rel, pick, to):
        path = os.path.join(OUT, n + '.webp')
        if not os.path.exists(path):
            return
        im = Image.open(path).convert('RGBA')
        a = np.asarray(im).copy()
        x0, y0, x1, y1 = [int(round(v * (im.width if i % 2 == 0 else im.height))) for i, v in enumerate(rel)]
        sub = a[y0:y1, x0:x1]
        r, g, b, al = [sub[..., i].astype(int) for i in range(4)]
        sel = pick(r, g, b) & (al > 0)
        lum = (r * 3 + g * 6 + b) / 10.0
        for (tr, tg, tb), cond in to(r, g, b, sel):
            k = np.clip(lum / 160.0, 0.6, 1.25)
            sub[cond, 0] = np.clip(tr * k[cond], 0, 255)
            sub[cond, 1] = np.clip(tg * k[cond], 0, 255)
            sub[cond, 2] = np.clip(tb * k[cond], 0, 255)
        save(Image.fromarray(a, 'RGBA'), n, 88 if n.startswith(('bg_', 'pc_', 'tx_')) else 92)

    # 법인카드 오른쪽 아래 두 원(카드사 표시)을 카드 바탕색으로
    recolor('it_card', (0.62, 0.42, 1.0, 0.97), lambda r, g, b: (r > b + 8) & (r > g + 8), lambda r, g, b, s: [((40, 58, 98), s)])
    # 노트북 덮개 가운데 과일 모양을 덮개 색으로
    recolor('it_laptop', (0.44, 0.30, 0.71, 0.61), lambda r, g, b: (r + g + b) / 3 < 200, lambda r, g, b, s: [((196, 198, 204), s)])
    # 동네 배경 편의점 띠(주황·초록 줄)를 옥색으로. 특정 편의점처럼 보이지 않게
    recolor('bg_town', (0.07, 0.18, 0.36, 0.33), lambda r, g, b: (r > g + 40) | (g > r + 20),
            lambda r, g, b, s: [((96, 170, 150), s & (r > g + 40)), ((44, 104, 92), s & (g > r + 20))])


def main():
    os.makedirs(OUT, exist_ok=True)
    index = {}
    only = set(sys.argv[1:])
    for k, spec in SHEETS.items():
        if not only or k in only:
            do_sheet(k, spec, index)
    for k, groups in PANELS.items():
        if not only or k in only:
            do_panels(k, groups, index)
    patch()
    ip = os.path.join(OUT, 'index.json')
    old = json.load(open(ip)) if os.path.exists(ip) else {}
    old.update(index)
    json.dump(dict(sorted(old.items())), open(ip, 'w'), ensure_ascii=False, indent=0)


if __name__ == '__main__':
    main()
