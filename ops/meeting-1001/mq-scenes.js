/* 메인 퀘스트 컷신 배경 (개발 리드, 2026-10-01)
   MQ_BG[이름](ctx,t,W,H). 화면은 가로 160칸, 세로 H(240~356). 사람이 서는 바닥선은 gy=H-104,
   대사 상자는 H-92부터 덮는다. 배경은 캔버스 전체를 칠하고 사람은 그리지 않는다(엔진이 위에 세운다).
   게임에 이미 있는 rcx · hrand · mixHex · ctext · sceneStars · TC · P · SKIN · houseCv · ridingCv · heroDesc · MOUNTS · S만 쓴다.
   도우미 함수는 바깥에 새 전역을 만들지 않게 즉시 실행 함수 안에 둔다. */
var MQ_BG = (function(){
  function bands(ctx,cols,y0,y1,W){ var n=cols.length,h=(y1-y0)/n; for(var i=0;i<n;i++) rcx(ctx,cols[i],0,Math.round(y0+i*h),W,Math.ceil(h)+1); }
  function skyDay(ctx,t,W,y1){ bands(ctx,['#7FC3E4','#9AD2F0','#B4E1F5','#CDEEFF','#DDF2FB'],0,y1,W);
    for(var i=0;i<3;i++){ var x=Math.round((hrand(i,4,1)*W+t*(2+i))%(W+40))-24,y=10+i*16+Math.floor(hrand(i,5,1)*8);
      rcx(ctx,'#FFFFFF',x+4,y,12,3); rcx(ctx,'#FFFFFF',x,y+3,24,4); rcx(ctx,'#E4F2FA',x+2,y+7,20,1); } }
  /* 건물 줄. 창에 불이 켜지는 비율은 lit */
  function skyline(ctx,t,W,base,col,win,seed,lo,hi,lit){ var x=-3;
    while(x<W){ var w=10+Math.floor(hrand(x,seed,4)*14),h=lo+Math.floor(hrand(x,seed,5)*(hi-lo));
      rcx(ctx,col,x,base-h,w,h);
      if(win) for(var yy=base-h+4;yy<base-4;yy+=6) for(var xx=x+2;xx<x+w-2;xx+=4)
        if(hrand(xx*3+seed,yy,7)<lit&&((Math.floor(t/2)+xx+yy)%11)!==0) rcx(ctx,win,xx,yy,2,3);
      x+=w+(hrand(x,seed,6)<.3?2:0); } }
  function planks(ctx,W,y0,H,c){ rcx(ctx,c[1],0,y0,W,H-y0); var r=0;
    for(var y=y0;y<H;y+=6,r++){ rcx(ctx,c[0],0,y+5,W,1); rcx(ctx,c[2],0,y,W,1);
      for(var x=(r%3)*14-20;x<W;x+=40) rcx(ctx,c[0],x,y,1,5); } }
  function tiles(ctx,W,y0,H,a,b,s){ for(var y=y0,r=0;y<H;y+=s,r++) for(var x=0,k=0;x<W;x+=s,k++){ rcx(ctx,(r+k)%2?a:b,x,y,s,s); } }
  function base(ctx,W,gy,c){ rcx(ctx,c,0,gy-3,W,3); rcx(ctx,'rgba(30,26,48,.25)',0,gy,W,2); }
  function plant(ctx,x,y){ rcx(ctx,'#8A6240',x+2,y-8,10,8); rcx(ctx,'#A87B52',x+1,y-9,12,2);
    var L=TC.leaf; rcx(ctx,L[1],x+5,y-22,4,13); rcx(ctx,L[2],x,y-19,6,4); rcx(ctx,L[2],x+8,y-24,6,4); rcx(ctx,L[3],x+2,y-15,5,3); rcx(ctx,L[3],x+7,y-17,6,3); rcx(ctx,L[4],x+9,y-24,3,1); }
  function winCity(ctx,t,x,y,w,h,night){ rcx(ctx,'#6B6380',x-2,y-2,w+4,h+4);
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
    if(night) bands(ctx,['#241E44','#2E2756','#3A3068'],y,y+h,x+w); else bands(ctx,['#9AD2F0','#B4E1F5','#CDEEFF'],y,y+h,x+w);
    skyline(ctx,t,x+w,y+h,night?'#1D1934':'#9BB8CC',night?'#FFD66B':'#DDEEF7',x+7,Math.floor(h*.3),Math.floor(h*.8),.4);
    ctx.restore();
    rcx(ctx,'rgba(255,255,255,.35)',x+2,y+2,2,h-4); rcx(ctx,'#8C889B',x+Math.floor(w/2),y,2,h); rcx(ctx,'#B3AFC0',x-3,y+h+2,w+6,2); }
  /* 옆모습 차 한 대, y는 바퀴 바닥 */
  function carS(ctx,x,y,col,tag){ var d=mixHex(col,'#1B1826',.35),l=mixHex(col,'#FFFFFF',.3);
    rcx(ctx,'rgba(20,18,30,.25)',x+1,y-1,38,2);
    rcx(ctx,col,x,y-11,38,7); rcx(ctx,l,x,y-11,38,1); rcx(ctx,d,x,y-5,38,2);
    rcx(ctx,col,x+8,y-18,22,7); rcx(ctx,l,x+8,y-18,22,1);
    rcx(ctx,TC.glass[1],x+10,y-17,8,5); rcx(ctx,TC.glass[1],x+20,y-17,8,5); rcx(ctx,TC.glass[3],x+11,y-17,2,1);
    rcx(ctx,'#FFE79B',x+36,y-10,2,2); rcx(ctx,'#F4705A',x,y-10,2,2);
    [6,26].forEach(function(o){ rcx(ctx,'#1B1826',x+o,y-6,7,6); rcx(ctx,'#9B93A8',x+o+2,y-4,3,2); });
    if(tag){ rcx(ctx,'#FFFDF6',x+21,y-16,6,4); rcx(ctx,'#F4705A',x+22,y-15,4,1); rcx(ctx,'#2E2740',x+22,y-13,3,1); } }
  function glow(ctx,x,y,r,c){ var g=ctx.createRadialGradient(x,y,1,x,y,r); g.addColorStop(0,c); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2); }
  function flags(ctx,t,x0,x1,y,cols){ rcx(ctx,'#6B6380',x0,y,x1-x0,1);
    for(var x=x0+2,i=0;x<x1-4;x+=7,i++){ var c=cols[i%cols.length],sw=Math.floor(t*4+i)%2;
      rcx(ctx,c,x,y+1,5,2); rcx(ctx,c,x+1,y+3,3,2+sw); rcx(ctx,c,x+2,y+5+sw,1,1); } }
  function crane(ctx,t,x,y,h,dir){ var c='#EDA523',d='#D98A16';
    rcx(ctx,c,x,y-h,4,h); for(var k=y-h+3;k<y;k+=6) rcx(ctx,d,x,k,4,1);
    var jl=dir>0?38:-26; rcx(ctx,c,Math.min(x,x+jl),y-h-2,Math.abs(jl)+4,3); rcx(ctx,'#453D5C',x-1,y-h-6,6,4);
    var hx=x+(dir>0?16+Math.round(Math.sin(t*.6)*8):-14),hl=12+Math.round(Math.sin(t*.8)*4);
    rcx(ctx,'#453D5C',hx,y-h+1,1,hl); rcx(ctx,'#9B93A8',hx-3,y-h+1+hl,7,3); }
  /* 세로로 긴 화면(H가 크면)에서는 위쪽을 천장으로 덮어 벽이 텅 비지 않게 한다. 벽 위 끝 y를 돌려준다 */
  function ceil(ctx,W,gy,c,lc,plain){ var ct=Math.max(0,gy-160); if(ct<=0) return 0;
    rcx(ctx,c,0,0,W,ct); var d=mixHex(c,'#1B1826',.15),r=0;
    if(!plain) for(var y=ct-2;y>0;y-=22,r++){ rcx(ctx,d,0,y-1,W,1);
      for(var x=(r%2)*20;x<W;x+=40) rcx(ctx,d,x,Math.max(0,y-22),1,22);
      if(lc&&r%2===0) [30,110].forEach(function(cx){ rcx(ctx,mixHex(c,'#1B1826',.25),cx-13,y-15,26,10); rcx(ctx,lc,cx-12,y-14,24,8); rcx(ctx,mixHex(lc,'#9B93A8',.3),cx-12,y-10,24,1); }); }
    rcx(ctx,mixHex(c,'#FFFFFF',.3),0,ct-2,W,2); return ct; }
  function paveFloor(ctx,W,gy,H){ rcx(ctx,TC.sw[0],0,gy,W,H-gy);
    for(var y=gy,r=0;y<H;y+=8,r++) for(var x=(r%2)*8-8;x<W;x+=16){ rcx(ctx,TC.sw[2],x,y,15,7); rcx(ctx,TC.sw[3],x,y,15,1); } }

  return {
  /* 밤 도시. 가로등 아래 골목 */
  night:function(ctx,t,W,H){ var gy=H-104;
    bands(ctx,['#141026','#1B1733','#241E44','#2E2756','#3A3068'],0,gy,W); sceneStars(ctx,t,W,H,40);
    rcx(ctx,'#FFF4C4',122,18,12,12); rcx(ctx,'#FFE79B',120,20,2,8); rcx(ctx,'#FFE79B',134,20,2,8); rcx(ctx,'#FFE79B',124,16,8,2); rcx(ctx,'#FFE79B',124,30,8,2);
    rcx(ctx,'#1B1733',126,18,8,9);
    skyline(ctx,t,W,gy-12,'#2A2447','#6B5E9C',1,34,80,.3);
    skyline(ctx,t,W,gy,'#1D1934','#FFD66B',2,22,58,.35);
    rcx(ctx,'#3F3A55',0,gy,W,H-gy); rcx(ctx,'#57517A',0,gy,W,2);
    for(var x=0;x<W;x+=16) rcx(ctx,'#2E2740',x,gy+2,1,H-gy);
    glow(ctx,22,gy-50,40,'rgba(255,214,107,.28)');
    rcx(ctx,'#453D5C',20,gy-52,3,52); rcx(ctx,'#453D5C',20,gy-54,12,3); rcx(ctx,'#FFE79B',26,gy-51,6,2);
    ctx.fillStyle='rgba(255,231,155,.10)'; for(var k=0;k<40;k++) ctx.fillRect(29-Math.round(k*.35),gy-49+k,1+Math.round(k*.7),1); },

  /* 스마트폰 화면 가까이. 새 문자가 온다(글은 엔진이 대사 상자에 찍는다) */
  phone:function(ctx,t,W,H){
    bands(ctx,['#0B0A14','#100E1C','#161327','#1B1733'],0,H,W);
    glow(ctx,W/2,H*.38,95,'rgba(120,180,255,.28)');
    var sh=t<0.9?(Math.floor(t*24)%2)*2-1:0,px=34+sh,py=12,pw=92,pb=H-60,ph=pb-py;
    if(sh){ ctx.fillStyle='#9BDCF7'; [[-6,0],[-9,4]].forEach(function(o){ ctx.fillRect(px+o[0],py+40+o[1],1,14-o[1]*2); ctx.fillRect(px+pw-1-o[0],py+40+o[1],1,14-o[1]*2); }); }
    rcx(ctx,'#57517A',px+2,py,pw-4,ph); rcx(ctx,'#57517A',px,py+2,pw,ph-4);
    rcx(ctx,'#1B1826',px+2,py+2,pw-4,ph-4); rcx(ctx,'#6B6380',px+2,py,pw-4,1);
    rcx(ctx,'#2E2740',px+pw/2-8,py+5,16,2);
    var sx=px+5,sy=py+10,sw=pw-10,sb=pb-10;
    rcx(ctx,'#F2F0F7',sx,sy,sw,sb-sy);
    rcx(ctx,'#E4E0EC',sx,sy,sw,11); ctext(ctx,'9:00',sx+3,sy+1,8,'#2E2740');
    rcx(ctx,'#2E2740',sx+sw-13,sy+3,10,5); rcx(ctx,'#62C85C',sx+sw-12,sy+4,6,3); rcx(ctx,'#2E2740',sx+sw-3,sy+4,1,3);
    rcx(ctx,'#FFFFFF',sx,sy+11,sw,16); rcx(ctx,'#D2CFDC',sx,sy+27,sw,1);
    ctext(ctx,'<',sx+3,sy+14,8,'#6B6380');
    rcx(ctx,'#9BDCF7',sx+12,sy+14,10,10); rcx(ctx,'#3A9BC9',sx+15,sy+16,4,4); rcx(ctx,'#3A9BC9',sx+14,sy+21,6,3);
    rcx(ctx,'#453D5C',sx+25,sy+15,26,3); rcx(ctx,'#B9B5C6',sx+25,sy+20,34,2);
    var nb=H-104-26,ob=nb-28,j=0;
    if(ob-14>sy+30){ rcx(ctx,'#D2CFDC',sx+sw/2-14,ob-14,28,8); rcx(ctx,'#9F9BAD',sx+sw/2-10,ob-11,20,2); }
    for(ob=nb-28;ob>sy+30;ob-=(j===1?38:28),j++){ if(j===1){ ob-=10; if(ob<=sy+30) break; }
      if(j%2===0){ rcx(ctx,'#E2E0EA',sx+4,ob,54,20); rcx(ctx,'#E2E0EA',sx+2,ob+14,2,3); rcx(ctx,'#B9B5C6',sx+8,ob+5,44,2); rcx(ctx,'#B9B5C6',sx+8,ob+11,30,2); }
      else { rcx(ctx,'#FFE79B',sx+sw-50,ob+4,46,14); rcx(ctx,'#FFE79B',sx+sw-4,ob+12,2,3); rcx(ctx,'#D9B44A',sx+sw-44,ob+9,34,2); } }
    var k=Math.min(1,Math.max(0,(t-0.35)*5));
    if(k>0){ var bw=Math.round(66*k),bh=Math.round(24*k);
      rcx(ctx,'#FFFFFF',sx+4,nb,bw,bh); rcx(ctx,'#FFC53C',sx+4,nb,2,bh); rcx(ctx,'#D2CFDC',sx+4,nb+bh,bw,1);
      if(k>=1){ rcx(ctx,'#453D5C',sx+10,nb+5,54,2); rcx(ctx,'#453D5C',sx+10,nb+11,48,2); rcx(ctx,'#453D5C',sx+10,nb+17,30,2);
        if(Math.floor(t*2)%2===0){ rcx(ctx,'#F4705A',sx+sw-12,nb-4,8,7); rcx(ctx,'#FFFFFF',sx+sw-9,nb-3,2,3); rcx(ctx,'#FFFFFF',sx+sw-9,nb+1,2,1); } } }
    rcx(ctx,'#FFFFFF',sx,sb-14,sw,14); rcx(ctx,'#E2E0EA',sx+4,sb-11,sw-22,8); rcx(ctx,'#FFC53C',sx+sw-15,sb-11,11,8);
    var sk=SKIN[0]; try{ sk=heroDesc().skin||sk; }catch(e){}
    for(var i=0;i<3;i++){ rcx(ctx,sk.b,px-4,H-118+i*9,7,7); rcx(ctx,sk.s,px-4,H-112+i*9,7,1); }
    rcx(ctx,sk.b,px+pw-6,H-112,10,16); rcx(ctx,sk.s,px+pw-6,H-97,10,1); },

  /* 사무실. 창밖 빌딩, 뒤쪽 책상 줄, 형광등 */
  office:function(ctx,t,W,H){ var gy=H-104;
    rcx(ctx,'#DAD6E3',0,0,W,gy); var ct=ceil(ctx,W,gy,'#B9B5C6','#FFFDF6'),wt=Math.max(ct+16,gy-128),wb=gy-38; rcx(ctx,'#C9C3D6',0,ct,W,8);
    [14,64,114].forEach(function(x,i){ rcx(ctx,(Math.floor(t*7)%37===i)?'#E4E0EC':'#FFFDF6',x,ct+2,32,4); rcx(ctx,'#B9B5C6',x,ct+6,32,1); });
    winCity(ctx,t,8,wt,62,wb-wt,0); winCity(ctx,t,90,wt,62,wb-wt,0);
    rcx(ctx,'#FFFDF6',74,wt+4,12,12); rcx(ctx,'#453D5C',75,wt+5,10,10); rcx(ctx,'#FFFDF6',76,wt+6,8,8); rcx(ctx,'#2E2740',79,wt+7,1,4); rcx(ctx,'#2E2740',80,wt+10,3,1);
    base(ctx,W,gy,'#9B93A8');
    for(var x=4;x<W;x+=52){ rcx(ctx,'#8A6240',x,gy-22,46,3); rcx(ctx,'#A87B52',x,gy-22,46,1); rcx(ctx,'#6B4A31',x+2,gy-19,2,16); rcx(ctx,'#6B4A31',x+42,gy-19,2,16);
      rcx(ctx,'#2E2740',x+8,gy-36,18,12); rcx(ctx,Math.floor(t*2+x)%5?'#6EC8F0':'#9BDCF7',x+9,gy-35,16,9); rcx(ctx,'#CDEEFF',x+10,gy-34,8,1); rcx(ctx,'#CDEEFF',x+10,gy-32,11,1);
      rcx(ctx,'#2E2740',x+16,gy-24,2,2); rcx(ctx,'#FFFDF6',x+30,gy-25,9,3); rcx(ctx,'#C9C3D6',x+31,gy-26,7,1); }
    plant(ctx,W-16,gy-1);
    tiles(ctx,W,gy,H,'#7D8299','#8A8FA8',8); rcx(ctx,'#6B6380',0,gy,W,1); },

  /* 회의실. 화면에 막대그래프, 긴 탁자, 블라인드 */
  meeting:function(ctx,t,W,H){ var gy=H-104;
    rcx(ctx,'#E7E0D4',0,0,W,gy); for(var x=0;x<W;x+=20) rcx(ctx,'#DDD5C6',x,0,1,gy);
    var ct=ceil(ctx,W,gy,'#CFC6B6','#FFF8EC'),st=Math.max(ct+12,gy-116),sb=gy-46;
    rcx(ctx,'#B9A88C',0,gy-40,W,2);
    rcx(ctx,'#6B6380',6,st,20,sb-st+10); for(var y=st+2;y<sb+8;y+=3) rcx(ctx,y%6?'#E4E0EC':'#C9C3D6',8,y,16,2);
    rcx(ctx,'#2E2740',34,st,112,sb-st); rcx(ctx,'#FFFDF6',36,st+2,108,sb-st-4);
    var ch=sb-st-18,k=Math.min(1,t/1.2);
    [.35,.55,.45,.8,.95].forEach(function(v,i){ var h=Math.round(ch*v*k); rcx(ctx,i===4?'#F4705A':'#6EC8F0',46+i*14,sb-6-h,9,h); rcx(ctx,i===4?'#FFAF9E':'#CDEEFF',46+i*14,sb-6-h,9,1); });
    rcx(ctx,'#453D5C',42,sb-6,70,1); rcx(ctx,'#453D5C',42,st+8,1,sb-st-14);
    rcx(ctx,'#FFC53C',120,st+10,16,16); rcx(ctx,'#F4705A',128,st+10,8,8); rcx(ctx,'#FFFDF6',120,st+30,16,2); rcx(ctx,'#C9C3D6',120,st+34,12,2);
    rcx(ctx,'#6B6380',86,sb,8,4);
    for(var c=10;c<W;c+=30){ rcx(ctx,'#3F3A55',c,gy-40,16,14); rcx(ctx,'#57517A',c+1,gy-39,14,2); }
    rcx(ctx,'#6B4A31',0,gy-28,W,14); rcx(ctx,'#A87B52',0,gy-28,W,3); rcx(ctx,'#C4966A',0,gy-28,W,1); rcx(ctx,'#4E3524',0,gy-16,W,2);
    [20,58,100,136].forEach(function(x,i){ rcx(ctx,'#FFFDF6',x,gy-29,10,2); if(i%2){ rcx(ctx,'#9BDCF7',x+13,gy-34,3,6); rcx(ctx,'#3A9BC9',x+13,gy-34,3,1); } });
    rcx(ctx,'#4E3524',8,gy-14,4,14); rcx(ctx,'#4E3524',W-12,gy-14,4,14);
    planks(ctx,W,gy,H,['#8A6240','#A87B52','#C4966A']); },

  /* 은행 창구. 번호표 전광판, 유리 칸막이 */
  bank:function(ctx,t,W,H){ var gy=H-104;
    rcx(ctx,'#EFE8DA',0,0,W,gy); for(var x=0;x<W;x+=32) rcx(ctx,'#E3DAC7',x,0,16,gy);
    var top=Math.max(ceil(ctx,W,gy,'#D6CCB8','#FFFDF6')+10,gy-120);
    rcx(ctx,'#26406B',0,top,W,18); rcx(ctx,'#FFC53C',0,top+18,W,2);
    rcx(ctx,'#FFC53C',8,top+3,12,12); rcx(ctx,'#D98A16',11,top+6,6,6); rcx(ctx,'#FFE79B',9,top+4,3,2);
    ctext(ctx,'BANK',26,top+5,8,'#FFFDF6');
    rcx(ctx,'#1B1826',96,top+2,56,14); var n=127+Math.floor(t/3);
    ctext(ctx,('000'+n).slice(-4),124,top+5,8,Math.floor(t*3)%2?'#FF5A4A':'#FF8A6A','c');
    var pt=top+26;
    for(var i=0;i<3;i++){ var bx=8+i*50;
      rcx(ctx,'#CDEEFF',bx,pt+10,44,gy-30-pt-10); rcx(ctx,'rgba(255,255,255,.6)',bx+3,pt+12,2,gy-44-pt); rcx(ctx,'#9B93A8',bx-2,pt+8,48,2);
      rcx(ctx,'#26406B',bx+14,pt,16,8); ctext(ctx,String(i+1),bx+22,pt,8,'#FFFDF6','c'); }
    rcx(ctx,'#A5927A',0,gy-30,W,30); rcx(ctx,'#D6C6A8',0,gy-32,W,5); rcx(ctx,'#EFE3CB',0,gy-32,W,1); rcx(ctx,'#8A7A64',0,gy-27,W,1);
    for(var j=0;j<3;j++){ rcx(ctx,'#B9A88C',14+j*50,gy-22,32,12); rcx(ctx,'#C9B79A',14+j*50,gy-22,32,1); }
    rcx(ctx,'#8A7A64',0,gy-2,W,2);
    tiles(ctx,W,gy,H,'#D8D4E0','#E9E6EF',16); rcx(ctx,'#B9B5C6',0,gy,W,1); },

  /* 중고차 매장 앞마당. 만국기, 값표 붙은 차 */
  carlot:function(ctx,t,W,H){ var gy=H-104;
    skyDay(ctx,t,W,gy);
    rcx(ctx,'#E9E6EF',6,gy-62,148,42); rcx(ctx,'#B4E1F5',10,gy-50,140,28); for(var x=10;x<150;x+=14) rcx(ctx,'#8C889B',x,gy-50,1,28);
    rcx(ctx,'rgba(255,255,255,.5)',14,gy-48,3,24); rcx(ctx,'#3A6FB0',6,gy-66,148,12); rcx(ctx,'#2C4668',6,gy-55,148,1);
    ctext(ctx,'중고차',W/2,gy-65,8,'#FFFDF6','c');
    rcx(ctx,'#9B93A8',4,gy-100,2,80); rcx(ctx,'#9B93A8',W-6,gy-100,2,80);
    flags(ctx,t,5,W-5,gy-99,[P.r1,P.y1,P.g1,P.k3,P.v1]);
    rcx(ctx,TC.road[1],0,gy-20,W,H-gy+20);
    for(var i=0;i<5;i++) rcx(ctx,'#E9E4F0',-6+i*44,gy-20,2,20);
    carS(ctx,-2,gy-2,'#F4705A',1); carS(ctx,60,gy-2,'#FFFDF6',1); carS(ctx,122,gy-2,'#3A6FB0',1);
    rcx(ctx,'#B3AFC0',0,gy,W,2); rcx(ctx,TC.road[0],0,gy+2,W,1);
    for(var k=0;k<24;k++) rcx(ctx,hrand(k,3,2)<.5?TC.road[0]:TC.road[2],Math.floor(hrand(k,4,2)*W),gy+4+Math.floor(hrand(k,5,2)*(H-gy-4)),1,1); },

  /* 달리는 차. 언덕이 흘러가고 초록 표지판이 지나간다 */
  road:function(ctx,t,W,H){ var gy=H-104,rt=gy-26;
    skyDay(ctx,t,W,rt);
    function hills(sp,col,b,amp,seed){ ctx.fillStyle=col; var off=(t*sp)%W;
      for(var x=0;x<W+2;x+=2){ var xx=x+off,h=Math.round(amp*(0.6+0.4*Math.sin(xx/19+seed))+amp*0.3*Math.sin(xx/7+seed*2)); ctx.fillRect(x,b-h,2,h+2); } }
    hills(8,'#8FB6A8',rt-16,26,1); hills(18,'#5E9C6E',rt-4,16,3);
    rcx(ctx,'#46964A',0,rt-6,W,6);
    var po=Math.floor(t*70)%24; for(var x=-24;x<W+24;x+=24){ rcx(ctx,'#9B93A8',x-po,rt-10,2,8); } rcx(ctx,'#C9C3D6',0,rt-10,W,2);
    var sgx=Math.round(W+20-((t*40)%(W+120))); rcx(ctx,'#9B93A8',sgx+18,rt-40,2,34);
    rcx(ctx,'#2F7A3A',sgx,rt-54,40,16); rcx(ctx,'#FFFDF6',sgx+2,rt-52,36,1); rcx(ctx,'#FFFDF6',sgx+2,rt-41,36,1); rcx(ctx,'#FFFDF6',sgx+6,rt-48,18,2); rcx(ctx,'#FFFDF6',sgx+30,rt-49,4,4);
    rcx(ctx,'#403D4B',0,rt,W,40); rcx(ctx,'#B3AFC0',0,rt,W,2); rcx(ctx,'#B3AFC0',0,rt+38,W,2);
    var so=Math.floor(t*120)%24; for(var x2=-24;x2<W+24;x2+=24) rcx(ctx,'#E8D9A8',x2-so,rt+19,12,2);
    rcx(ctx,'#3B8A43',0,rt+40,W,H-rt-40); for(var k=0;k<30;k++){ var gx=(Math.floor(hrand(k,1,3)*W*2)-Math.floor(t*120))%W; if(gx<0) gx+=W; rcx(ctx,k%3?'#52A64E':'#2B6E36',gx,rt+44+Math.floor(hrand(k,2,3)*(H-rt-48)),2,1); }
    try{ var mo=(S.equip&&MOUNTS[S.equip.mount])||{},rc=ridingCv(heroDesc(),'car',2,[1,2,3,2][Math.floor(t*8)%4],mo.kind==='car'?mo.top:undefined),bob=Math.floor(t*10)%2;
      ctx.drawImage(rc,0,0,rc.width,rc.height,Math.round(W*.32),gy+2-rc.height*2+bob,rc.width*2,rc.height*2); }catch(e){}
    for(var s=0;s<4;s++){ var ly=rt+8+s*8,lx=(Math.floor(hrand(s,7,1)*W)-Math.floor(t*200))%W; if(lx<0) lx+=W; rcx(ctx,'rgba(255,255,255,.35)',lx,ly,10,1); } },

  /* 결혼식장. 꽃 아치, 샹들리에, 버진로드 */
  weddinghall:function(ctx,t,W,H){ var gy=H-104,at=Math.max(24,gy-110);
    rcx(ctx,'#F6E3E6',0,0,W,gy); for(var x=4;x<W;x+=24){ rcx(ctx,'#EFD3D8',x,0,2,gy); rcx(ctx,'#FBEEF0',x+2,0,1,gy); }
    rcx(ctx,'#FFF8EC',40,at,80,gy-at); glow(ctx,80,at+30,60,'rgba(255,231,155,.45)');
    for(var a=0;a<=28;a++){ var ang=Math.PI*a/28,cx=80-Math.cos(ang)*42,cy=at+30-Math.sin(ang)*26;
      var c=[TC.fl[0],'#FFFFFF','#FFAF9E','#FFFFFF'][a%4]; rcx(ctx,TC.leaf[2],Math.round(cx)-3,Math.round(cy)-1,7,5); rcx(ctx,c,Math.round(cx)-2,Math.round(cy)-2,5,5); rcx(ctx,'#FFE79B',Math.round(cx),Math.round(cy),1,1); }
    [34,120].forEach(function(x){ rcx(ctx,'#FFFFFF',x,at+30,6,gy-at-30); rcx(ctx,'#EFD3D8',x+5,at+30,1,gy-at-30);
      for(var y=at+34;y<gy;y+=10){ rcx(ctx,TC.leaf[2],x-1,y,8,3); rcx(ctx,y%20?TC.fl[0]:'#FFFFFF',x+1,y-1,3,3); } });
    var cy2=Math.max(4,at-18); rcx(ctx,'#D98A16',79,0,2,cy2); rcx(ctx,'#FFC53C',70,cy2,20,3); rcx(ctx,'#FFE79B',72,cy2+3,16,2);
    for(var i=0;i<5;i++){ rcx(ctx,'#CDEEFF',71+i*4,cy2+5,2,3+(i%2)*2); if(Math.floor(t*4+i)%3===0) rcx(ctx,'#FFFFFF',71+i*4,cy2+5,1,1); }
    [14,138].forEach(function(x){ rcx(ctx,'#D9C9A8',x+2,gy-24,4,24); rcx(ctx,'#EFE3CB',x-2,gy-26,12,3);
      rcx(ctx,TC.leaf[1],x-3,gy-34,14,8); rcx(ctx,'#FFFFFF',x-2,gy-36,4,4); rcx(ctx,TC.fl[0],x+3,gy-37,4,4); rcx(ctx,'#FFAF9E',x+7,gy-35,3,3); });
    rcx(ctx,'#F2E6DA',0,gy,W,H-gy); for(var y=gy+6;y<H;y+=10) rcx(ctx,'#E6D6C4',0,y,W,1);
    for(var r=gy;r<H;r++){ var w=24+Math.round((r-gy)*.55); rcx(ctx,'#FFFFFF',80-w/2-2,r,w+4,1); rcx(ctx,'#D9503E',80-w/2,r,w,1); }
    rcx(ctx,'#FFFFFF',0,gy,W,1);
    for(var p=0;p<14;p++){ var px=Math.floor(hrand(p,1,5)*W)+Math.round(Math.sin(t*1.5+p)*4),py=Math.floor((hrand(p,2,5)*gy+t*(12+p%4*4))%gy);
      rcx(ctx,p%3?'#FFAF9E':'#FFFFFF',px,py,2,1); } },

  /* 카페. 메뉴판, 조명, 김이 오르는 커피 머신 */
  cafe:function(ctx,t,W,H){ var gy=H-104;
    rcx(ctx,'#F3E3CC',0,0,W,gy); var ct=ceil(ctx,W,gy,'#6B4A31',null),mt=Math.max(ct+18,gy-110);
    for(var b=0;b<ct-4;b+=6) rcx(ctx,'#5A3D29',0,b,W,1); rcx(ctx,'#6B4A31',0,gy-40,W,40); for(var x=0;x<W;x+=8) rcx(ctx,'#5A3D29',x,gy-40,1,40); rcx(ctx,'#A87B52',0,gy-42,W,3);
    winCity(ctx,t,8,mt+6,44,gy-mt-54,0);
    rcx(ctx,'#4E3524',64,mt,64,40); rcx(ctx,'#2E3A33',66,mt+2,60,36);
    ctext(ctx,'MENU',96,mt+4,8,'#FFE79B','c');
    for(var i=0;i<3;i++){ rcx(ctx,'#E9E4F0',70,mt+16+i*7,30,2); rcx(ctx,'#FFC53C',112,mt+16+i*7,10,2); }
    [58,92,126].forEach(function(x,i){ rcx(ctx,'#2E2740',x,ct,1,mt-4+i*3-ct); rcx(ctx,'#2E2740',x-4,mt-4+i*3,9,4); rcx(ctx,'#FFE79B',x-3,mt+i*3,7,1); glow(ctx,x,mt+2+i*3,16,'rgba(255,214,107,.35)'); });
    rcx(ctx,'#FFFDF6',134,gy-70,22,2); for(var c=0;c<3;c++){ rcx(ctx,['#FFFDF6','#9BDCF7','#FFAF9E'][c],136+c*7,gy-76,5,6); }
    rcx(ctx,'#C9C3D6',108,gy-60,26,18); rcx(ctx,'#9B93A8',108,gy-60,26,3); rcx(ctx,'#453D5C',114,gy-50,3,6); rcx(ctx,'#453D5C',124,gy-50,3,6);
    for(var s=0;s<5;s++){ var sy=gy-62-((t*14+s*5)%20),sx=118+Math.round(Math.sin(t*3+s)*2); ctx.globalAlpha=1-((t*14+s*5)%20)/20; rcx(ctx,'#FFFFFF',sx,Math.round(sy),2,2); } ctx.globalAlpha=1;
    rcx(ctx,'#8A6240',96,gy-42,64,4); rcx(ctx,'#C4966A',96,gy-42,64,1);
    plant(ctx,4,gy-1);
    planks(ctx,W,gy,H,['#6B4A31','#8A6240','#A87B52']); },

  /* 견본주택. 현수막, 깃발, 멀리 짓는 중인 단지와 크레인 */
  modelhouse:function(ctx,t,W,H){ var gy=H-104;
    skyDay(ctx,t,W,gy);
    rcx(ctx,'#B9C6D6',96,gy-118,34,100); for(var y=gy-114;y<gy-20;y+=8) rcx(ctx,'#8C9AB0',96,y,34,1); for(var x=100;x<130;x+=8) rcx(ctx,'#8C9AB0',x,gy-118,1,100);
    rcx(ctx,'#CFCCD9',30,gy-88,26,70); for(var y2=gy-84;y2<gy-20;y2+=8) rcx(ctx,'#A9A5B8',30,y2,26,1);
    crane(ctx,t,62,gy-40,90,1); crane(ctx,t,138,gy-40,100,-1);
    rcx(ctx,'#FFFDF6',12,gy-52,136,52); rcx(ctx,'#E4E0EC',12,gy-52,136,2);
    rcx(ctx,'#26406B',8,gy-66,144,16); rcx(ctx,'#FFC53C',8,gy-51,144,2);
    ctext(ctx,'견본주택',W/2,gy-63,8,'#FFFDF6','c');
    for(var i=0;i<4;i++){ rcx(ctx,'#7FC3E4',18+i*32,gy-44,26,28); rcx(ctx,'#B4E1F5',18+i*32,gy-44,26,6); rcx(ctx,'#6B6380',30+i*32,gy-44,2,28); }
    rcx(ctx,'#453D5C',62,gy-30,36,30); rcx(ctx,'#9BDCF7',64,gy-28,15,28); rcx(ctx,'#9BDCF7',81,gy-28,15,28); rcx(ctx,'#FFC53C',77,gy-16,2,4); rcx(ctx,'#FFC53C',81,gy-16,2,4);
    [2,W-6].forEach(function(x,j){ rcx(ctx,'#9B93A8',x,gy-80,2,80);
      for(var k=0;k<3;k++){ var c=[P.r1,P.y1,P.k3][(k+j)%3],w=Math.floor(t*5+k)%2; rcx(ctx,c,j?x-8:x+2,gy-78+k*9,8,6-w); } });
    paveFloor(ctx,W,gy,H);
    [28,52,108,132].forEach(function(x){ rcx(ctx,'#C9A33C',x,gy+2,2,10); rcx(ctx,'#FFC53C',x-1,gy+1,4,2); }); rcx(ctx,'#F4705A',30,gy+4,22,1); rcx(ctx,'#F4705A',110,gy+4,22,1); },

  /* 아파트 단지. 게임의 84㎡ 구축·신축 그림을 그대로 세운다 */
  apartment:function(ctx,t,W,H){ var gy=H-104;
    skyDay(ctx,t,W,gy);
    skyline(ctx,t,W,gy-14,'#B4C8DA','#D8E6F0',3,50,90,.5);
    try{ var a=houseCv(12),b=houseCv(14),c=houseCv(13);
      ctx.drawImage(a,-8,gy-8-a.height); ctx.drawImage(b,W-b.width+6,gy-8-b.height); ctx.drawImage(c,Math.round(W/2-c.width/2)+2,gy-4-c.height); }catch(e){}
    rcx(ctx,TC.g[1],0,gy-10,W,10);
    for(var x=-4;x<W;x+=20){ var L=TC.leaf; rcx(ctx,L[0],x,gy-20,14,12); rcx(ctx,L[2],x+2,gy-22,10,8); rcx(ctx,L[3],x+3,gy-21,4,2); }
    rcx(ctx,'#E2E0EA',0,gy-4,W,4); for(var f=0;f<W;f+=6) rcx(ctx,'#9F9BAD',f,gy-8,1,6); rcx(ctx,'#9F9BAD',0,gy-8,W,1);
    paveFloor(ctx,W,gy,H); },

  /* 거실. 창과 커튼, 소파, 스탠드, 러그 */
  livingroom:function(ctx,t,W,H){ var gy=H-104;
    rcx(ctx,'#FFF3E0',0,0,W,gy); for(var x=0;x<W;x+=10) rcx(ctx,'#F6E6CC',x,0,4,gy);
    var ct=ceil(ctx,W,gy,'#F2E3C8',null,1),wt=Math.max(ct+18,gy-110); rcx(ctx,'#EAD8BA',0,ct,W,4);
    if(ct>30){ rcx(ctx,'#FFFDF6',60,ct-10,40,6); rcx(ctx,'#FFE79B',62,ct-4,36,2); glow(ctx,80,ct,40,'rgba(255,231,155,.3)'); }
    winCity(ctx,t,12,wt,52,gy-wt-44,1);
    rcx(ctx,'#D9503E',6,wt-6,8,gy-wt-30); rcx(ctx,'#D9503E',62,wt-6,8,gy-wt-30); rcx(ctx,'#B93A2D',8,wt-6,2,gy-wt-30); rcx(ctx,'#B93A2D',64,wt-6,2,gy-wt-30);
    rcx(ctx,'#8A6240',4,wt-8,68,3);
    rcx(ctx,'#A87B52',96,wt+2,24,18); rcx(ctx,'#CDEEFF',98,wt+4,20,14); rcx(ctx,'#62C85C',98,wt+12,20,6); rcx(ctx,'#FFC53C',112,wt+6,4,4);
    rcx(ctx,'#A87B52',126,wt+8,16,12); rcx(ctx,'#FFAF9E',128,wt+10,12,8); rcx(ctx,'#FFFDF6',131,wt+12,6,4);
    rcx(ctx,'#453D5C',146,gy-58,1,56); rcx(ctx,'#453D5C',142,gy-2,9,2); rcx(ctx,'#FFE79B',140,gy-66,13,8); rcx(ctx,'#FFF4C4',142,gy-60,9,2);
    glow(ctx,146,gy-58,30,'rgba(255,214,107,.35)');
    rcx(ctx,'#3A6FB0',30,gy-34,94,14); rcx(ctx,'#4F86C8',30,gy-34,94,2); rcx(ctx,'#2C4668',30,gy-20,94,14);
    rcx(ctx,'#3A6FB0',24,gy-28,8,22); rcx(ctx,'#3A6FB0',122,gy-28,8,22); rcx(ctx,'#4F86C8',24,gy-28,8,2); rcx(ctx,'#4F86C8',122,gy-28,8,2);
    rcx(ctx,'#FFC53C',40,gy-30,10,8); rcx(ctx,'#FFAF9E',104,gy-30,10,8);
    rcx(ctx,'#2C4668',34,gy-6,86,1); rcx(ctx,'#4E3524',34,gy-6,2,6); rcx(ctx,'#4E3524',118,gy-6,2,6);
    planks(ctx,W,gy,H,['#B8996A','#D8B98A','#E6CDA2']);
    rcx(ctx,'#F4705A',16,gy+6,128,H-gy-6); rcx(ctx,'#FFAF9E',20,gy+10,120,H-gy-14); rcx(ctx,'#F4705A',24,gy+14,112,H-gy-22);
    for(var i=0;i<W;i+=8) rcx(ctx,'#FFFDF6',i+18,gy+5,2,1); },

  /* 동네 거리. 가게 차양, 전봇대와 전깃줄, 보도와 찻길 */
  town:function(ctx,t,W,H){ var gy=H-104;
    skyDay(ctx,t,W,gy-40);
    skyline(ctx,t,W,gy-40,'#B4C8DA','#D8E6F0',5,20,60,.4);
    var sh=[{x:0,w:52,h:70,c:TC.brick[2],a:P.r1},{x:52,w:56,h:58,c:'#E9E4F0',a:P.g2},{x:108,w:52,h:76,c:TC.brick[1],a:P.k4}];
    sh.forEach(function(b,i){ var y=gy-b.h; rcx(ctx,b.c,b.x,y,b.w,b.h); rcx(ctx,mixHex(b.c,'#1B1826',.25),b.x,y,b.w,2);
      for(var wy=y+6;wy<gy-34;wy+=14) for(var wx=b.x+6;wx<b.x+b.w-10;wx+=14){ rcx(ctx,TC.wood[0],wx,wy,10,9); rcx(ctx,TC.glass[1],wx+1,wy+1,8,7); rcx(ctx,TC.glass[3],wx+2,wy+2,2,2); }
      rcx(ctx,'#FFFDF6',b.x+6,gy-32,b.w-12,7); rcx(ctx,b.a,b.x+8,gy-30,b.w-30,3);
      for(var s=0;s<b.w-4;s+=6){ rcx(ctx,s%12?'#FFFDF6':b.a,b.x+2+s,gy-24,6,6); } rcx(ctx,'rgba(30,26,48,.2)',b.x+2,gy-18,b.w-4,1);
      rcx(ctx,TC.glass[0],b.x+8,gy-17,b.w-16,17); rcx(ctx,TC.glass[2],b.x+10,gy-15,4,8); rcx(ctx,TC.wood[1],b.x+Math.floor(b.w/2)-1,gy-17,2,17); });
    rcx(ctx,TC.wood[1],46,gy-96,4,96); rcx(ctx,TC.wood[0],40,gy-90,16,2); rcx(ctx,'#9B93A8',48,gy-80,6,6);
    ctx.fillStyle='#2E2740'; for(var x=0;x<W;x++){ ctx.fillRect(x,gy-89+Math.round(Math.pow((x-46)/60,2)*8),1,1); ctx.fillRect(x,gy-85+Math.round(Math.pow((x-46)/70,2)*10),1,1); }
    var bx=(Math.floor(t*14)%(W+20))-10; if(Math.floor(t*3)%2===0){ rcx(ctx,'#453D5C',bx,gy-92+Math.round(Math.pow((bx-46)/60,2)*8)-2,3,2); }
    paveFloor(ctx,W,gy,gy+16); rcx(ctx,TC.curb[1],0,gy+16,W,3); rcx(ctx,TC.curb[2],0,gy+16,W,1);
    rcx(ctx,TC.road[1],0,gy+19,W,H-gy-19); for(var k=0;k<W;k+=24) rcx(ctx,'#E8D9A8',k+(Math.floor(t*8)%24)-24,gy+34,12,2); },

  /* 지하철 승강장. 스크린도어 뒤로 열차가 들어와 선다 */
  station:function(ctx,t,W,H){ var gy=H-104,top=Math.max(8,gy-112);
    rcx(ctx,'#E4E6EE',0,0,W,gy); for(var y=0;y<gy;y+=8) rcx(ctx,'#D2D5E0',0,y,W,1); for(var x=0;x<W;x+=8) rcx(ctx,'#D8DBE6',x,0,1,gy);
    rcx(ctx,'#2C3A5E',0,0,W,Math.max(6,top-2));
    for(var cy=top-14;cy>0;cy-=34){ rcx(ctx,'#1C2540',0,cy-6,W,2); rcx(ctx,'#453D5C',10,cy-4,60,4); rcx(ctx,'#E9F4FF',11,cy,58,3); rcx(ctx,'#453D5C',90,cy-4,60,4); rcx(ctx,'#E9F4FF',91,cy,58,3); glow(ctx,40,cy+2,26,'rgba(233,244,255,.18)'); glow(ctx,120,cy+2,26,'rgba(233,244,255,.18)'); }
    rcx(ctx,'#1C2540',24,top,112,18); rcx(ctx,'#3FA548',28,top+4,10,10); rcx(ctx,'#FFFFFF',31,top+7,4,4);
    ctext(ctx,'뉴비역',86,top+5,8,'#FFFDF6','c'); ctext(ctx,'→',128,top+5,8,'#FFE79B','c');
    rcx(ctx,'#1B1826',48,top+22,64,10); var ld=Math.floor(t*6)%12; for(var i=0;i<12;i++) if(i<=ld) rcx(ctx,'#FF9A3C',51+i*5,top+26,3,2);
    var dt=gy-66,cyc=t%8,tx=cyc<2?Math.round((1-cyc/2)*(1-cyc/2)*-200):cyc<6?0:Math.round(((cyc-6)/2)*((cyc-6)/2)*220);
    rcx(ctx,'#2E2740',0,dt,W,62);
    rcx(ctx,'#C9C3D6',tx-20,dt+4,200,56); rcx(ctx,'#E4E0EC',tx-20,dt+4,200,3); rcx(ctx,'#3FA548',tx-20,dt+34,200,5);
    for(var w=0;w<6;w++){ rcx(ctx,'#1C2540',tx-14+w*32,dt+12,20,18); rcx(ctx,'#48598A',tx-13+w*32,dt+13,6,4); }
    rcx(ctx,'#9B93A8',0,dt-4,W,4); rcx(ctx,'#3FA548',0,dt-6,W,2);
    for(var p=0;p<W;p+=40){ rcx(ctx,'#6B6380',p,dt,4,gy-dt); rcx(ctx,'rgba(205,238,255,.35)',p+4,dt,36,gy-dt); rcx(ctx,'rgba(255,255,255,.5)',p+8,dt+4,2,gy-dt-12);
      rcx(ctx,'#9B93A8',p+21,dt,1,gy-dt); rcx(ctx,'#FFC53C',p+12,dt+26,18,3); }
    rcx(ctx,'#6B6380',0,gy-4,W,4);
    tiles(ctx,W,gy,H,'#9F9BAD','#B9B5C6',12); rcx(ctx,'#FFC53C',0,gy+2,W,5); for(var d=2;d<W;d+=4) rcx(ctx,'#D98A16',d,gy+3,2,1); }
  };
})();
