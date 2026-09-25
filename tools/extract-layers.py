from PIL import Image
import numpy as np, base64, io, json
from collections import deque
import os
ARMDX=int(os.environ.get('ARMDX','2'))

CFG = {
 'imgM': dict(faceX=(10,26), eyeTop=17, faceBot=32, headBottom=33,
    cup=(0,34,8,47), case=[(21,49,33,58)], arm=(23,33,31,50), armDx=ARMDX,
    torso=(6,32,30,48), hipY=47, botBot=59, shoeTop=60, crease=(49,62),
    fist=(9,45), rhand=(23,43,30,49)),
 'imgF': dict(faceX=(12,26), eyeTop=18, faceBot=33, headBottom=34,
    cup=(0,34,8,47), case=[(21,49,33,58)], arm=(24,33,32,50), armDx=ARMDX,
    torso=(6,32,31,48), hipY=47, botBot=60, shoeTop=61, crease=(0,-1),
    fist=(9,45), rhand=(23,43,30,49)),
}
def lum(p): return 0.299*p[0]+0.587*p[1]+0.114*p[2]
def isSkin(p): return lum(p)>140 and p[0]>p[1]>p[2] and int(p[0])-int(p[2])>22
def isNavy(p): return int(p[2])>=int(p[0])+8 and lum(p)<125

def build(tag):
    c=CFG[tag]
    A=np.array(Image.open(f'base_{tag}.png').convert('RGBA')).astype(int)
    H,W=A.shape[0],A.shape[1]
    op=A[:,:,3]>128
    # 소품
    prop=np.zeros((H,W),bool)
    for (x0,y0,x1,y1) in [c['cup']]+c['case']:
        for y in range(y0,min(y1,H-1)+1):
            for x in range(x0,min(x1,W-1)+1):
                if op[y,x] and not isNavy(A[y,x][:3]): prop[y,x]=True
    # 머리카락
    fx0,fx1=c['faceX']; hair=np.zeros((H,W),bool)
    def hairish(x,y):
        if not op[y,x] or prop[y,x]: return False
        p=A[y,x][:3]
        if isSkin(p) or lum(p)>150 or isNavy(p): return False
        if fx0<=x<=fx1 and c['eyeTop']<=y<=c['faceBot']: return False
        return y<=c['headBottom']+18
    q=deque()
    for x in range(W):
        for y in range(0,8):
            if hairish(x,y) and not hair[y,x]: hair[y,x]=True; q.append((x,y))
    while q:
        x,y=q.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny=x+dx,y+dy
            if 0<=nx<W and 0<=ny<H and not hair[ny,nx] and hairish(nx,ny):
                hair[ny,nx]=True; q.append((nx,ny))
    # 상의
    top=np.zeros((H,W),bool); tx0,ty0,tx1,ty1=c['torso']
    for y in range(ty0,ty1+1):
        for x in range(tx0,tx1+1):
            if op[y,x] and not prop[y,x] and not hair[y,x] and isNavy(A[y,x][:3]): top[y,x]=True
    for _ in range(2):
        add=[]
        for y in range(max(ty0-1,0),min(ty1+2,H)):
            for x in range(max(tx0-2,0),min(tx1+3,W)):
                if top[y,x] or not op[y,x] or prop[y,x] or hair[y,x]: continue
                if lum(A[y,x][:3])>95 or isSkin(A[y,x][:3]): continue
                if any(0<=x+dx<W and 0<=y+dy<H and top[y+dy,x+dx] for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))): add.append((x,y))
        for x,y in add: top[y,x]=True
    # 신발 / 하의
    shoe=np.zeros((H,W),bool)
    for y in range(c['shoeTop'],H):
        for x in range(W):
            if op[y,x] and not prop[y,x]: shoe[y,x]=True
    bot=np.zeros((H,W),bool)
    for y in range(c['hipY'],min(c['botBot'],H-1)+1):
        for x in range(W):
            if op[y,x] and not prop[y,x] and not top[y,x] and not shoe[y,x]: bot[y,x]=True
    # 소품을 지우면 그 소품이 겸하던 외곽선까지 사라진다. 드러난 밝은 가장자리에 1px을 다시 찍는다.
    dk0=[A[y,x][:3] for y in range(H) for x in range(W) if op[y,x] and lum(A[y,x][:3])<26]
    OUTL=dk0[len(dk0)//2] if dk0 else [4,4,4]
    edge=[]
    for y in range(H):
        for x in range(W):
            if not prop[y,x]: continue
            own=None
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny=x+dx,y+dy
                if not(0<=nx<W and 0<=ny<H) or not op[ny,nx] or prop[ny,nx]: continue
                if lum(A[ny,nx][:3])<=95: continue
                if bot[ny,nx]: own='bot'
                elif shoe[ny,nx] or rest[ny,nx]: own='rest'
                elif top[ny,nx]: own='top'
                elif hand[ny,nx]: own='hand'
                if own: break
            if own: edge.append((x,y,own))
    # 이웃이 하나뿐인 픽셀은 삐죽 튀어나온 가시가 되므로 빼 둔다
    eset={(x,y) for x,y,_ in edge}
    def nb_count(x,y):
        n=0
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny=x+dx,y+dy
            if 0<=nx<W and 0<=ny<H and op[ny,nx] and (not prop[ny,nx] or (nx,ny) in eset): n+=1
        return n
    edge=[e for e in edge if nb_count(e[0],e[1])>=2]
    for x,y,own in edge:
        A[y,x]=[OUTL[0],OUTL[1],OUTL[2],255]; op[y,x]=True; prop[y,x]=False
        if own=='bot': bot[y,x]=True
        elif own=='rest': rest[y,x]=True
        elif own=='top': top[y,x]=True
        else: hand[y,x]=True

    # 원본은 두 다리가 붙어 있고 사타구니 아래로 갈수록만 골이 깊다. 허벅지 쪽 골이 거의 없어서
    # 한 덩어리로 보이고, 왼다리가 잘려 나간 것처럼 읽힌다. 골을 세로로 끝까지 파 준다.
    cy0,cy1=c['crease']
    for y in range(cy0,min(cy1,H-1)+1):
        xs=[x for x in range(W) if (bot[y,x] or shoe[y,x]) and op[y,x]]
        if len(xs)<6: continue
        lo,hi=min(xs),max(xs); mid=(lo+hi)/2.0
        cand=[x for x in xs if abs(x-mid)<=2.2]
        if not cand: continue
        cx=min(cand,key=lambda x:(lum(A[y,x][:3]),abs(x-mid)))
        p=A[y,cx][:3]
        if lum(p)<=105: continue        # 이미 골이 파여 있으면 그대로 둔다
        A[y,cx]=[max(20,int(p[0]*0.44)),max(18,int(p[1]*0.44)),max(20,int(p[2]*0.44)),255]
    rest=op&~prop&~hair&~top&~bot&~shoe

    # ── 손 레이어: 오른손(가방 손잡이 자리) + 왼쪽에 새로 그린 주먹
    sk=[A[y,x][:3] for y in range(H) for x in range(W) if rest[y,x] and isSkin(A[y,x][:3])]
    sk.sort(key=lum)
    skB=sk[int(len(sk)*.86)]; skM=sk[int(len(sk)*.55)]; skD=sk[int(len(sk)*.22)]
    dk=[A[y,x][:3] for y in range(H) for x in range(W) if op[y,x] and lum(A[y,x][:3])<26]
    outl=dk[len(dk)//2] if dk else [4,4,4]
    hand=np.zeros((H,W),bool)
    rx0,ry0,rx1,ry1=c['rhand']
    for y in range(ry0,min(ry1,H-1)+1):
        for x in range(rx0,min(rx1,W-1)+1):
            if op[y,x] and not prop[y,x] and not top[y,x] and not shoe[y,x]:
                hand[y,x]=True; bot[y,x]=False; rest[y,x]=False
    # 커피를 지우면서 왼팔 전체가 같이 날아갔다. 오른팔을 좌우 반전해 왼쪽에 붙인다.
    ax0,ay0,ax1,ay1=c['arm']
    for y in range(ay0,ay1+1):                      # 먼저 남아 있던 왼쪽 잔해를 지운다
        for x in range(0,W-1-ax1+1+c.get('armDx',0)):
            if op[y,x] and (top[y,x] or hand[y,x]):
                op[y,x]=False; A[y,x]=[0,0,0,0]
                top[y,x]=False; hand[y,x]=False; rest[y,x]=False; bot[y,x]=False
    for y in range(ay0,ay1+1):
        for x in range(ax0,min(ax1,W-1)+1):
            if not op[y,x] or prop[y,x]: continue
            mx=W-1-x+c.get('armDx',0)
            if mx<0 or mx>=W: continue
            src=None
            if top[y,x]: src='top'
            elif hand[y,x]: src='hand'
            else: continue
            A[y,mx]=A[y,x].copy(); op[y,mx]=True
            prop[y,mx]=False; rest[y,mx]=False; bot[y,mx]=False
            top[y,mx]=(src=='top'); hand[y,mx]=(src=='hand')
    print('  왼팔 복원', tag, 'x', W-1-ax1, '~', W-1-ax0)
    return A,op,dict(prop=prop,hair=hair,top=top,bot=bot,shoe=shoe,rest=rest,hand=hand),(skB,skM,skD,outl)

def png_b64(A,mask):
    H,W=A.shape[0],A.shape[1]
    im=Image.new('RGBA',(W,H),(0,0,0,0)); p=im.load()
    for y in range(H):
        for x in range(W):
            if mask[y,x]: p[x,y]=tuple(int(v) for v in A[y,x])
    b=io.BytesIO(); im.save(b,'PNG',optimize=True)
    return im, base64.b64encode(b.getvalue()).decode()

OUT={}
sheets=[]
for tag in ['imgM','imgF']:
    A,op,M,pal=build(tag); H,W=A.shape[0],A.shape[1]
    body = M['rest']|M['shoe']
    parts={'body':body,'hair':M['hair'],'top':M['top'],'bot':M['bot'],'hand':M['hand']}
    ent={'w':W,'h':H,'layers':{}}
    ims={}
    for n,m in parts.items():
        im,b64=png_b64(A,m); ims[n]=im; ent['layers'][n]=b64
        im.save(f'X_{tag}_{n}.png')
    # 기준색 (틴트용)
    def basecol(m):
        px=[A[y,x][:3] for y in range(H) for x in range(W) if m[y,x] and lum(A[y,x][:3])>40]
        px.sort(key=lum); return [int(v) for v in px[int(len(px)*.62)]]
    ent['hairBase']=basecol(M['hair']); ent['topBase']=basecol(M['top']); ent['botBase']=basecol(M['bot'])
    OUT[tag]=ent
    print(tag,{n:int(m.sum()) for n,m in parts.items()},'hair',ent['hairBase'],'top',ent['topBase'],'bot',ent['botBase'])
    order=['body','bot','top','hand','hair']
    comp=Image.new('RGBA',(W,H),(0,0,0,0))
    for n in order: comp=Image.alpha_composite(comp,ims[n])
    sh=Image.new('RGBA',((W+2)*8,H),(0,0,0,0))
    sh.paste(Image.fromarray(np.array(Image.open(f'base_{tag}.png'))),(0,0))
    sh.paste(comp,(W+2,0))
    for i,n in enumerate(order): sh.paste(ims[n],((i+2)*(W+2),0))
    sheets.append(sh)
tw=max(s.width for s in sheets); o=Image.new('RGBA',(tw,sum(s.height for s in sheets)+8),(255,255,255,255))
y=0
for s in sheets: o.paste(s,(0,y),s); y+=s.height+8
o.resize((o.width*7,o.height*7),Image.NEAREST).save('layer_check.png')
json.dump(OUT,open('layers.json','w'))
print('json bytes', len(open('layers.json').read()))
