import numpy as np, base64, io
from PIL import Image
from scipy import ndimage
UP='/root/.claude/uploads/88baa43b-ed0c-5587-8c7b-7c3c67786df6/'

def extract(path, out, target_h=64):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    lum = (0.299*a[:,:,0] + 0.587*a[:,:,1] + 0.114*a[:,:,2])
    dark = lum < 72                                  # 캐릭터를 두르는 굵은 검은 외곽선
    lab, n = ndimage.label(dark)
    if n == 0: return None
    sizes = ndimage.sum(dark, lab, range(1, n+1))
    H, W = lum.shape
    # 화면 중앙에 있고 세로로 긴 덩어리를 캐릭터 외곽선으로 본다
    best, bi = -1, None
    for i in range(1, n+1):
        ys, xs = np.where(lab == i)
        if len(ys) < 500: continue
        cx = xs.mean()/W
        h = (ys.max()-ys.min())/H
        if abs(cx-0.5) > 0.22 or h < 0.4: continue
        sc = sizes[i-1] * h
        if sc > best: best, bi = sc, i
    if bi is None: return None
    ys, xs = np.where(lab == bi)
    y0,y1,x0,x1 = ys.min()-2, ys.max()+3, xs.min()-2, xs.max()+3
    y0,x0 = max(0,y0), max(0,x0); y1,x1 = min(H,y1), min(W,x1)
    sub_dark = dark[y0:y1, x0:x1]
    # 외곽선을 막고 테두리에서 밀려 들어가면 남는 영역이 캐릭터 내부
    free = ~sub_dark
    lab2, n2 = ndimage.label(free)
    border = set(lab2[0,:]) | set(lab2[-1,:]) | set(lab2[:,0]) | set(lab2[:,-1])
    border.discard(0)
    exterior = np.isin(lab2, list(border))
    char = ~exterior
    char = ndimage.binary_fill_holes(char)
    ys2, xs2 = np.where(char)
    cy0,cy1,cx0,cx1 = ys2.min(), ys2.max()+1, xs2.min(), xs2.max()+1
    rgb = a[y0:y1, x0:x1][cy0:cy1, cx0:cx1].astype(np.uint8)
    m   = char[cy0:cy1, cx0:cx1]
    rgba = np.dstack([rgb, (m*255).astype(np.uint8)])
    img = Image.fromarray(rgba, 'RGBA')
    w = max(1, round(img.width * target_h / img.height))
    small = img.resize((w, target_h), Image.BOX)
    # 반투명 가장자리를 잘라 도트 경계를 살린다
    arr = np.asarray(small).copy()
    arr[:,:,3] = np.where(arr[:,:,3] > 130, 255, 0)
    small = Image.fromarray(arr, 'RGBA')
    # 색 수를 줄여 도트처럼 정리
    rgbq = small.convert('RGB').quantize(colors=22, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    arr2 = np.dstack([np.asarray(rgbq), np.asarray(small)[:,:,3]])
    final = Image.fromarray(arr2.astype(np.uint8), 'RGBA')
    final.save(out)
    buf = io.BytesIO(); final.save(buf, 'PNG', optimize=True)
    return final.size, len(buf.getvalue()), base64.b64encode(buf.getvalue()).decode()

for name, tag in [('ecd3490d-image.png','m'), ('c731d34a-image.png','f')]:
    r = extract(UP+name, f'sprite_{tag}.png')
    print(tag, r[0], f'{r[1]}B' if r else 'FAIL')
    open(f'sprite_{tag}.b64','w').write(r[2])
