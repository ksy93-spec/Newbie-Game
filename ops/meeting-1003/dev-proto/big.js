/* ===== 시안: 큰 도트 사람 (31x48 칸, z=2면 62x96) =====
   모든 도형은 칸 좌표(연속값)로 적고, 그릴 때 z배로 찍는다. 같은 묘사로 지도(z=1)와 캐릭터 화면(z=2)을 그린다. */
var BW=31,BH=48,BCX=15.5;
function bF(g,z,fn,c){ for(var y=0;y<g.h;y++) for(var x=0;x<g.w;x++) if(fn((x+.5)/z,(y+.5)/z)) g.d[y][x]=c; }
function pE(cx,cy,rx,ry){ return function(x,y){ var a=(x-cx)/rx,b=(y-cy)/ry; return a*a+b*b<=1; }; }
function pR(x0,y0,x1,y1){ return function(x,y){ return x>=x0&&x<x1+1&&y>=y0&&y<y1+1; }; }
function pPoly(pts){ return function(x,y){ var ins=false; for(var i=0,j=pts.length-1;i<pts.length;j=i++){ var xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) ins=!ins; } return ins; }; }
function pOr(){ var a=arguments; return function(x,y){ for(var i=0;i<a.length;i++) if(a[i](x,y)) return true; return false; }; }
function pAnd(a,b){ return function(x,y){ return a(x,y)&&b(x,y); }; }
function pNot(a){ return function(x,y){ return !a(x,y); }; }
function pMir(a){ return function(x,y){ return a(31-x,y); }; }
function pBoth(a){ return pOr(a,pMir(a)); }
function pShift(a,dx,dy){ return function(x,y){ return a(x-dx,y-dy); }; }

/* 머리 모양. fr: x=6..25 열마다 머리가 덮는 아래 끝(y, 이 값 아래는 이마). side: 구레나룻 끝, back: 뒤통수·옆 머리 끝 */
var HSTYLE={
 crop:  {fr:[13,12,11,10,9,9,8,8,8,8,9,9,10,9,8,8,9,10,12,13],side:13,back:19,cap:[15.5,10,11.4,9.6]},
 sweep: {fr:[13,12,11,9,8,8,9,9,10,10,10,9,9,8,8,8,9,10,12,13],side:14,back:19,cap:[15.5,10,11.6,9.9]},
 bob:   {fr:[19,19,18,13,10,9,9,9,9,9,9,9,9,9,9,9,10,13,19,19],side:20,back:21,cap:[15.5,10.2,11.8,9.8],long:1},
 block: {fr:[11,10,9,9,8,8,8,8,8,8,8,8,8,8,8,8,9,9,10,11],side:11,back:16,cap:[15.5,9.4,11.2,9.2]},
 pony:  {fr:[15,14,12,10,9,9,9,9,8,8,8,8,9,9,9,9,10,12,14,15],side:15,back:18,cap:[15.5,10,11.4,9.6],tail:1},
 ash:   {fr:[14,13,12,11,10,9,8,8,8,9,10,10,9,9,9,9,10,11,12,13],side:14,back:18,cap:[15.5,10,11.4,9.6]},
 curly: {fr:[12,11,10,9,8,9,8,9,8,9,8,9,8,9,8,9,9,10,11,12],side:12,back:17,cap:[15.5,9.4,12,9.6],curl:1},
 wave:  {fr:[22,21,19,15,11,9,9,9,9,9,9,9,9,9,9,9,11,15,19,21],side:27,back:28,cap:[15.5,10.2,11.8,9.8],long:2},
 long:  {fr:[22,21,19,15,11,9,9,9,9,9,9,9,9,9,9,9,11,15,19,21],side:25,back:27,cap:[15.5,10.2,11.8,9.8],long:2},
 bun:   {fr:[14,13,12,11,10,9,9,9,9,9,9,9,9,9,9,9,10,11,12,13],side:14,back:18,cap:[15.5,10,11.4,9.6],bun:1},
 thin:  {fr:[16,15,13,11,8,4,3,3,3,3,3,3,3,3,3,3,4,8,11,13],side:16,back:17,cap:[15.5,9.5,11,8.6],thin:1}
};
function bigHairKey(p){ var h=p.hs||'crop'; if(h==='short') return 'crop'; if(h==='bald') return 'thin'; return HSTYLE[h]?h:'crop'; }

function bigPal(p){
  var q=pPal(p); q.blush=mixHex(q.s,'#F4705A',.35); q.lip=mixHex(q.S,'#B93A2D',.5);
  q.hd=mixHex(q.h,'#000000',.25); q.sd=q.S; q.sl=mixHex(q.s,'#FFFFFF',.35);
  q.jl=q.J; q.jd=q.k; q.jdd=mixHex(q.j,'#000000',.4);
  q.pl=mixHex(q.p,'#FFFFFF',.14); q.pd=q.P; q.cl=mixHex('#FFFFFF',q.c,.5);
  q.out=P.s5; return q; }

/* ─ 머리: 바깥 모양과 얼굴 ─ */
function headShape(dir){
  if(dir===2) return pOr(pE(14.6,11.6,9.8,8.8),pE(15.6,14,8,7.4));
  return pOr(pE(15.5,11.6,10.2,8.8),pE(15.5,14,8.6,7.4)); }
function bigHairCap(st,dir){ var c=st.cap; return pE(c[0]-(dir===2?1.2:0),c[1],c[2],c[3]); }
function bigHairMask(st,dir,hatOn){
  var cap=bigHairCap(st,dir),fr=st.fr;
  if(dir===3){ var cap2=pOr(cap,pR(5,9,26,st.back-1)); return cap2; }
  if(dir===2){
    var sideAllow=pOr(cap,pE(13.5,12,8.6,6.6));
    return function(x,y){ if(!sideAllow(x,y)&&!(st.long&&x>=4&&x<10&&y<st.back)) return false;
      if(x<9.6) return y<st.back;               /* 뒷머리 */
      if(x<14) return y<(st.long?st.back:12.2); /* 귀 위쪽은 머리, 귀 높이부터는 귀가 보인다 */
      if(x<17) return y<(st.long?st.back-2:13.4);   /* 귀 앞 구레나룻 */
      var f=st.fr[Math.min(19,10+Math.floor((x-14)))]||9;
      return y<Math.min(f,13); }; }
  var helm=pOr(cap,pE(15.5,13.2,11.3,7.9));
  return function(x,y){ if(!(st.long?helm(x,y):cap(x,y))) return false;
    var i=Math.floor(x)-6; if(i<0||i>19) return y<st.side;
    return y<fr[i]; };
}

/* ─ 다리와 아랫도리 ─ */
function bigLegs(g,z,pal,p,dir,f,o){
  var w=o.wide?5:o.slim?3:4,bot=pal.p,pl=pal.pl,pd=pal.pd;
  var ln=(o.long)?3:0;                                  /* 롱코트면 다리가 짧게 보인다 */
  if(dir===2){
    var sw=(f===1)?4:(f===3)?-4:0;
    function leg(sx,dark,lift){ var c=dark?pd:bot,bt=44-(lift||0);
      for(var y=35;y<=bt;y++){ var t=(y-35)/10,off=sx*t;
        bF(g,z,pR(13.4+off,y,13.4+off+3.2,y),c); if(!dark) bF(g,z,pR(13.4+off,y,13.4+off+.9,y),pl); }
      var fo=sx;
      bF(g,z,pR(12.6+fo,bt+1,17.6+fo,bt+2),dark?mixHex(pal.f,'#000',.15):pal.f);
      bF(g,z,pR(12.6+fo,bt+2,17.6+fo,bt+2),pal.F); }
    leg(-sw,1,(f===2)?1:0); leg(sw,0,0);
    if(o.stripe) { for(var y=36;y<=43;y++){ var off=sw*(y-35)/10; bF(g,z,pR(13.4+off+1.2,y,13.4+off+1.9,y),o.stripe); } }
    return; }
  var dl=(f===1)?1:(f===3)?-1:0;       /* 앞발이 내려온다 */
  var Lb=44+(f===1?1:f===3?-2:0),Rb=44+(f===3?1:f===1?-2:0);
  var lx=o.slim?12:11,rx=o.slim?18:17;
  function legF(x0,bottom,far){
    bF(g,z,pR(x0,35,x0+w-1,bottom),far?pd:bot);
    bF(g,z,pR(x0,35,x0,bottom),pl);
    bF(g,z,pR(x0+w-1,35,x0+w-1,bottom),pd);
    if(o.stripe&&dir===0) bF(g,z,pR(x0+(x0<15?0:w-1),36,x0+(x0<15?0:w-1),bottom),o.stripe);
    if(o.cuff) bF(g,z,pR(x0,bottom-1,x0+w-1,bottom-1),o.cuff);
    if(o.pocket&&dir===0){ var px=(x0<15)?x0-0:x0+w-3; bF(g,z,pR(px,38,px+2,40),pd); bF(g,z,pR(px,38,px+2,38),pl); }
    if(o.seam&&dir===0) bF(g,z,pR(x0+(x0<15?w-2:1),36,x0+(x0<15?w-2:1),bottom-1),pl);
    bF(g,z,pR(x0-(x0<15?1:0),bottom+1,x0+w-1+(x0<15?0:1),bottom+2),dir===3?mixHex(pal.f,'#000',.1):pal.f);
    bF(g,z,pR(x0-(x0<15?1:0),bottom+2,x0+w-1+(x0<15?0:1),bottom+2),pal.F); }
  bF(g,z,pR(lx,33,rx+w-1,38),bot);                       /* 엉덩이 */
  legF(lx,Lb-2,f===3); legF(rx,Rb-2,f===1);
}

/* ─ 윗옷 ─ */
function torsoPred(w0,w1,y0,y1,cut){ return function(x,y){ if(y<y0||y>=y1+1) return false; var t=(y-y0)/(y1+1-y0),hw=w0+(w1-w0)*t;
  if(cut&&y<y0+1&&Math.abs(x-BCX)>hw-1) return false; return Math.abs(x-BCX)<=hw; }; }
function bigTop(g,z,pal,p,dir,f,o){
  var j=pal.j,J=pal.jl,k=pal.jd,sleeve=o.sleeve||j,hw=o.broad?7.9:7.0,bw=o.broad?6.2:5.3;
  var ty1=o.long?41:34;
  if(dir===2){ return bigTopSide(g,z,pal,p,f,o); }
  /* 몸통 */
  var tp=torsoPred(hw,o.long?hw+1.4:bw,23,ty1,1);
  bF(g,z,tp,j);
  bF(g,z,pAnd(tp,pR(0,23,16,ty1)),dir===0?j:j);
  bF(g,z,pAnd(tp,pR(9,23,13,25)),J);                                       /* 어깨 빛 */
  bF(g,z,pAnd(tp,pR(20,24,23,ty1)),k);                                    /* 오른쪽 그늘 */
  bF(g,z,pAnd(tp,pR(0,ty1,31,ty1)),k);
  /* 팔 */
  var aL=(f===1)?-1:(f===3)?1:0,aR=-aL; if(dir===3){ var t0=aL; aL=aR; aR=t0; }
  var sx=o.broad?5:6;
  function arm(side,off){ var x0=side?31-sx-3:sx; var y1=(o.shortSleeve?27:32)+off,hy=y1+1;
    bF(g,z,pR(x0,24,x0+2,y1),sleeve); bF(g,z,pR(x0,24,x0,y1),side?pal.jd:pal.jl); if(side) bF(g,z,pR(x0+2,24,x0+2,y1),pal.jd);
    if(o.cuff2) bF(g,z,pR(x0,y1-1,x0+2,y1),o.cuff2);
    if(o.shortSleeve) bF(g,z,pR(x0,y1+1,x0+2,31+off),pal.s);
    bF(g,z,pR(x0,hy,x0+2,hy+2),pal.s); bF(g,z,pR(x0+(side?2:0),hy+1,x0+(side?2:0),hy+2),pal.S); bF(g,z,pR(x0,hy+3,x0+2,hy+3),pal.S);
    return [x0,hy]; }
  var ha=arm(0,aL),hb=arm(1,aR);
  return [ha,hb];
}
function bigTopSide(g,z,pal,p,f,o){
  var j=pal.j,sw=(f===1)?-3:(f===3)?3:0,hw=o.long?5.6:4.8;
  var tp=function(x,y){ if(y<23||y>=(o.long?42:35)) return false; return x>=BCX-hw&&x<=BCX+hw+(o.puff?1:0); };
  bF(g,z,tp,j); bF(g,z,pAnd(tp,pR(0,23,13.5,42)),pal.jl);  bF(g,z,pAnd(tp,pR(19.5,23,22,42)),pal.jd);
  /* 팔(가까운 쪽) */
  var ax=13.5+Math.round(sw*0.7);
  for(var y=24;y<=31;y++){ var off=Math.round(sw*0.5*((y-24)/7)); bF(g,z,pR(ax+off,y,ax+off+2.99,y),o.sleeve||j); }
  var ho=Math.round(sw*0.5);
  bF(g,z,pR(ax+ho,24,ax+ho,31),pal.jl); bF(g,z,pR(ax+ho+2,24,ax+ho+2,31),pal.jd);
  bF(g,z,pR(ax+ho,32,ax+ho+2,34),pal.s); bF(g,z,pR(ax+ho+2,33,ax+ho+2,34),pal.S);
  return [[ax+ho,32],[ax+ho,32]];
}

/* ─ 옷 종류별 덧그림 ─ */
function bigTopDeco(g,z,pal,p,dir,f,o){
  var c=pal.c,C=pal.C,J=pal.jl,k=pal.jd;
  if(dir===3){
    if(o.hood){ bF(g,z,pE(15.5,25.4,8,4.6),pal.jd); bF(g,z,pE(15.5,24.6,8,4.4),pal.jl); bF(g,z,pE(15.5,25.6,5.4,2.6),pal.j); bF(g,z,pR(15,27,16,30),pal.jd); }
    if(o.puffy){ bF(g,z,pR(8,28,23,28),k); bF(g,z,pR(8,33,23,33),k); bF(g,z,pR(8,38,23,38),k); bF(g,z,pE(15.5,23.6,5,2),pal.jl); }
    if(o.blazer){ bF(g,z,pR(15,24,16,34),k); }
    if(p.prop==='tote'||p.prop==='bag'){ bF(g,z,pPoly([[9,23],[11,23],[22,32],[20,33]]),'#6E5334'); }
    return; }
  var side=(dir===2);
  if(o.blazer&&!side){
    bF(g,z,pPoly([[12.6,22.6],[18.4,22.6],[15.5,29.5]]),o.inner||c);
    bF(g,z,pPoly([[11,22.6],[12.7,22.6],[15.5,29.6],[14,31],[11.4,26.6]]),o.lapel||J);
    bF(g,z,pPoly([[20,22.6],[18.3,22.6],[15.5,29.6],[17,31],[19.6,26.6]]),o.lapelR||pal.j);
    bF(g,z,pPoly([[18.3,22.6],[19.2,22.6],[16.2,29.6],[15.5,29.6]]),k);
    if(o.gold){ bF(g,z,pPoly([[11,22.6],[11.8,22.6],[14.6,29.5],[14,30.4]]),o.gold); bF(g,z,pPoly([[20,22.6],[19.2,22.6],[16.4,29.5],[17,30.4]]),mixHex(o.gold,'#000',.2));
      bF(g,z,pR(11,30,13,30),o.gold); bF(g,z,pR(11,29,12,29),'#FFFFFF'); }
    bF(g,z,pR(15,31,16,32),pal.jdd);                                      /* 단추 */
    bF(g,z,pR(11,29,13,29),k);                                           /* 가슴 주머니 */
    if(p.tie){ bF(g,z,pR(14.5,23,16.5,24),dimHex(p.tie)); bF(g,z,pR(15,25,16,30),p.tie); bF(g,z,pR(15,30,16,31),dimHex(p.tie)); }
  }
  if(o.shirtOnly&&!side){        /* 셔츠·티: 둥근 깃 */
    bF(g,z,pPoly([[12.2,22.6],[18.8,22.6],[17.6,25],[15.5,26.4],[13.4,25]]),pal.s);
    bF(g,z,pPoly([[11.4,22.4],[13,22.4],[15.5,26.6],[14.6,26.8],[12,24]]),c); bF(g,z,pPoly([[19.6,22.4],[18,22.4],[15.5,26.6],[16.4,26.8],[19,24]]),C);
    bF(g,z,pR(15,27,15,34),mixHex(c,'#000',.12)); bF(g,z,pR(16,27,16,34),mixHex(c,'#000',.04));
    for(var by=28;by<=33;by+=3) bF(g,z,pR(15,by,16,by),'#FFFFFF');
  }
  if(o.hood&&!side){
    /* 목 뒤 후드 */
    bF(g,z,pE(15.5,23.8,8.6,3.6),pal.jd); bF(g,z,pE(15.5,23.3,8.6,3.4),pal.jl); bF(g,z,pE(15.5,24.4,5.6,2.4),pal.s);
    bF(g,z,pR(11.2,25,11.2,29),'#FFF8EC'); bF(g,z,pR(19.8,25,19.8,29),'#FFF8EC'); bF(g,z,pR(11.2,29,11.2,29),'#C9C3D6'); bF(g,z,pR(19.8,29,19.8,29),'#C9C3D6');
    bF(g,z,pPoly([[10.5,30],[20.5,30],[21.5,34.4],[9.5,34.4]]),k); bF(g,z,pPoly([[10.5,30],[20.5,30],[20,30.9],[11,30.9]]),pal.jl);
    bF(g,z,pR(15,31,16,34),pal.jdd);
  }
  if(o.puffy&&!side){
    bF(g,z,pR(8,28,23,28),k); bF(g,z,pR(8,33,23,33),k); bF(g,z,pR(8,38,23,38),k); bF(g,z,pR(15,24,16,41),mixHex(pal.j,'#000',.35));
    bF(g,z,pR(9,24,13,27),pal.jl);
    /* 높은 깃 */
    bF(g,z,pPoly([[10,22.4],[21,22.4],[19.8,25.4],[11.2,25.4]]),pal.jl); bF(g,z,pE(15.5,23.2,3.6,1.8),pal.s);
    bF(g,z,pR(8,28,8,40),pal.jl);
  }
  if(o.cardi&&!side){
    bF(g,z,pPoly([[12.4,22.6],[18.6,22.6],[18.8,34.4],[12.2,34.4]]),o.inner||c);
    bF(g,z,pR(12,23,12.9,34),pal.jl); bF(g,z,pR(18.1,23,19,34),k);
    bF(g,z,pPoly([[12.4,22.6],[18.6,22.6],[15.5,26.5]]),pal.s);
    for(var by2=28;by2<=33;by2+=2.5) bF(g,z,pR(13,by2,13.8,by2+.9),pal.jdd);
  }
  if(o.vest&&!side){
    bF(g,z,pPoly([[12.6,22.6],[18.4,22.6],[15.5,27]]),pal.s);
    bF(g,z,pR(9,23,11.9,34),o.inner||c); bF(g,z,pR(19.1,23,22,34),o.inner||c);
    bF(g,z,pPoly([[11.6,22.8],[12.8,22.6],[15.5,27.2],[14.6,27.8],[11.6,25]]),o.inner||c);
    bF(g,z,pPoly([[19.4,22.8],[18.2,22.6],[15.5,27.2],[16.4,27.8],[19.4,25]]),o.inner||c);
    for(var vy=29;vy<=33;vy+=2) bF(g,z,pR(13,vy,18,vy),k);
  }
  if(p.badge&&!side&&o.shirtOnly){
    bF(g,z,pPoly([[12.4,23],[13.4,23],[15.4,27],[15.6,27],[17.6,23],[18.6,23],[16.4,28],[14.6,28]]),'#3A9BC9');
    bF(g,z,pR(13.6,28,17.4,32),'#FFFDF6'); bF(g,z,pR(13.6,28,17.4,28.8),'#6EC8F0'); bF(g,z,pR(14.4,29.8,16.6,31.2),'#9BDCF7');
  }
  if(p.lanyard&&!p.badge&&!side&&!o.hood&&!o.puffy){ bF(g,z,pR(15,23,16,25),'#62C85C'); }
  if(p.apron&&!side){ bF(g,z,pR(10,27,21,36),p.apron); bF(g,z,pR(10,27,21,27),mixHex(p.apron,'#FFFFFF',.25)); bF(g,z,pR(14,25,17,26),p.apron); }
  if(p.robe&&!side){ bF(g,z,pPoly([[12.4,22.6],[18.6,22.6],[15.5,29]]),'#F3EEE2'); bF(g,z,pPoly([[17.5,24.5],[20.5,28],[20,33],[17.4,29]]),p.gorum||'#B8344A');
    bF(g,z,pR(15,29,16,41),pal.jd); }
  if(side){
    if(o.hood){ bF(g,z,pE(11.5,24,4.4,3),o.hc); }
    if(o.blazer||o.cardi||o.shirtOnly||o.vest){ bF(g,z,pPoly([[17,22.6],[19.8,22.6],[19.8,26],[18,25]]),o.blazer?pal.jl:pal.c); }
    if(o.puffy){ bF(g,z,pR(10.5,28,20.5,28),k); bF(g,z,pR(10.5,33,20.5,33),k); bF(g,z,pR(10.5,38,20.5,38),k); bF(g,z,pE(15.5,23.2,4.6,1.8),pal.jl); }
    if(p.tie&&o.blazer) bF(g,z,pR(19,25,19.9,31),p.tie);
  }
}

/* 손에 든 것·가방 */
function bigProps(g,z,pal,p,dir,f,hands,o){
  var pr=p.prop,wp=p.weapon;
  var hb=hands?hands[1]:[24,32],ha=hands?hands[0]:[6,32];
  if(dir===3){ if(pr==='tote'||pr==='bag'){ bF(g,z,pR(8,33,14,40),'#252D41'); bF(g,z,pR(8,33,14,34),'#3A4764'); } return; }
  if(dir===2){ ha=hands[0]; }
  if(pr==='tote'||pr==='bag'){ var bx=(dir===2)?ha[0]+2:ha[0]-3,by=ha[1]+1,bc=(pr==='tote')?'#252D41':'#6E5334',bl=(pr==='tote')?'#3A4764':'#8A6A44';
    bF(g,z,pR(bx,by,bx+5,by+6),bc); bF(g,z,pR(bx,by,bx+5,by+1),bl); bF(g,z,pR(bx+1,by-2,bx+1,by),bc); bF(g,z,pR(bx+4,by-2,bx+4,by),bc); bF(g,z,pR(bx+1,by-3,bx+4,by-3),bc); }
  if(pr==='cane'){ var cx=(dir===2)?ha[0]+1:ha[0]+1; bF(g,z,pR(cx,ha[1]-1,cx,45),'#8A6A44'); bF(g,z,pR(cx-1,ha[1]-2,cx+1,ha[1]-1),'#6E5334'); }
  if(pr==='clip'){ var qx=hb[0]-2; bF(g,z,pR(qx,hb[1]-3,qx+5,hb[1]+3),P.b2); bF(g,z,pR(qx+1,hb[1]-2,qx+4,hb[1]+2),P.p0); }
  if(pr==='files'){ var qx2=ha[0]-2; bF(g,z,pR(qx2,ha[1]-2,qx2+5,ha[1]+4),P.k1); bF(g,z,pR(qx2,ha[1]-2,qx2+5,ha[1]-1),P.k4); }
  if(wp){ var hx=hb[0]+1,hy=hb[1]+1;
    if(dir===2){ hx=hb[0]+1; }
    if(wp==='pen'||wp==='goldpen'){ bF(g,z,pR(hx,hy-7,hx+1,hy+1),wp==='goldpen'?P.y1:'#3A4764'); bF(g,z,pR(hx,hy-7,hx+1,hy-6),wp==='goldpen'?P.y3:P.r1); bF(g,z,pR(hx,hy-5,hx,hy-4),P.p0); }
    if(wp==='mouse'){ bF(g,z,pE(hx+.5,hy,2.3,3),P.p0); bF(g,z,pR(hx+.5,hy-3,hx+.5,hy-1),P.s2); }
    if(wp==='tumbler'){ bF(g,z,pR(hx-1,hy-5,hx+2,hy+2),'#6EC8F0'); bF(g,z,pR(hx-1,hy-6,hx+2,hy-5),P.s3); bF(g,z,pR(hx-1,hy-2,hx+2,hy-2),P.p1); }
    if(wp==='board'){ bF(g,z,pR(hx-2,hy-6,hx+4,hy+4),P.s3); bF(g,z,pR(hx-1,hy-5,hx+3,hy+3),P.b1); bF(g,z,pR(hx,hy-7,hx+2,hy-6),P.s2); bF(g,z,pR(hx-1,hy-3,hx+3,hy-3),P.s1); bF(g,z,pR(hx-1,hy-1,hx+2,hy-1),P.s1); }
    if(wp==='laptop'){ bF(g,z,pR(hx-3,hy-5,hx+4,hy+1),P.s3); bF(g,z,pR(hx-2,hy-4,hx+3,hy),P.k2); bF(g,z,pR(hx-3,hy+1,hx+5,hy+2),P.s1); }
    if(wp==='card'){ bF(g,z,pR(hx-2,hy-3,hx+3,hy+1),P.y1); bF(g,z,pR(hx-2,hy-2,hx+3,hy-2),P.s3); bF(g,z,pR(hx-2,hy,hx,hy),P.y3); }
    if(wp==='keyb'){ bF(g,z,pR(hx-4,hy-2,hx+5,hy+2),P.s3); bF(g,z,pR(hx-3,hy-1,hx+4,hy+1),P.s0); for(var i=-3;i<=4;i+=2) bF(g,z,pR(hx+i,hy,hx+i,hy),P.s2); }
  }
}

/* ─ 얼굴 ─ */
function bigFace(g,z,pal,p,dir){
  var F=p.face||{},E=pal.e,S=pal.S;
  if(dir===3) return;
  if(dir===2){
    var ex=19.5;
    var shape=F.eye||'round';
    if(shape==='smile'){ bF(g,z,pR(18.6,14.8,18.6,15.4),E); bF(g,z,pR(19.5,14.2,20.4,14.2),E); bF(g,z,pR(20.6,14.8,20.6,15.4),E); }
    else { bF(g,z,pR(ex,13,ex+1,16),E); bF(g,z,pR(ex+1,13,ex+1,13.9),pal.w); if(shape==='sharp') bF(g,z,pR(ex-1,13,ex+2,13),E); }
    bF(g,z,pR(ex-1.5,11,ex+2.5,11.9),F.thick?pal.hd:pal.d);
    bF(g,z,pR(24,15.6,25.4,17.4),pal.s); bF(g,z,pR(24.6,16.8,25.4,17.4),S);
    if(F.grin) bF(g,z,pR(21.5,19,23.4,19.9),'#6B2A2A'); else bF(g,z,pR(22,19.4,23.4,19.9),pal.lip);
    if(F.blush!==0&&F.blush) bF(g,z,pR(19,17.2,21.2,18.2),pal.blush);
    bF(g,z,pE(11.4,14.6,1.5,2.1),pal.s); bF(g,z,pR(10.6,14,11.4,15.2),S);
    if(F.earring) bF(g,z,pR(11,16.8,12,18),F.earring);
    return; }
  var ex2=[10,19];
  ex2.forEach(function(x0,i){
    var outer=(i===0)?-1:1,inner=(i===0)?x0+2.1:x0;           /* 눈빛은 안쪽 위 */
    if(F.eye==='smile'){ bF(g,z,pE(x0+1.5,15.4,1.7,1.5),E); bF(g,z,pE(x0+1.5,16.2,1.7,1.4),pal.s); bF(g,z,pR(x0-.2,16.9,x0+3.2,17.2),pal.blush); return; }
    var eyeS=pE(x0+1.5,14.6,1.62,2.1);
    if(F.eye==='sharp') eyeS=pE(x0+1.5,14.9,1.75,1.85);
    bF(g,z,eyeS,E);
    bF(g,z,pAnd(eyeS,pR(0,16,31,17)),mixHex(E,'#6B6380',.2));          /* 아래쪽 홍채가 한 단 밝다 */
    bF(g,z,pR(inner,13.5,inner+.9,14.4),pal.w); 
    if(F.eye==='sharp'&&z>=2){ bF(g,z,pR(x0-.1,12.9,x0+2.1,13.3),E); bF(g,z,(outer<0)?pR(x0-1,13.4,x0-.1,13.9):pR(x0+2.1,13.4,x0+3.1,13.9),E); }
    bF(g,z,pR(x0-.2,11.1,x0+2.2,11.9),F.thick?pal.hd:pal.d); if(F.thick) bF(g,z,pR(x0-.4,10.5,x0+2.4,11.3),pal.hd);
  });
  bF(g,z,pR(15,17.4,16,17.9),S);
  if(F.grin){ bF(g,z,pR(13.2,18.8,17.8,20.2),'#6B2A2A'); bF(g,z,pR(13.8,18.8,17.2,19.3),'#FFFFFF'); }
  else if(F.flat) bF(g,z,pR(14,19.4,17,19.9),pal.lip);
  else { bF(g,z,pR(14,19.4,17,19.9),pal.lip); bF(g,z,pR(13.2,18.8,13.8,19.4),pal.lip); bF(g,z,pR(17.2,18.8,17.8,19.4),pal.lip); }
  if(F.blush){ bF(g,z,pR(7.6,17.2,9.6,18.4),pal.blush); bF(g,z,pR(21.4,17.2,23.4,18.4),pal.blush); }
  if(F.freckle){ [[8.5,16.2],[10.4,17.4],[20.5,17.4],[22.4,16.2],[12,17.8],[19,17.8]].forEach(function(q){ bF(g,z,pR(q[0],q[1],q[0]+.9,q[1]+.9),pal.S); }); }
  if(F.earring){ bF(g,z,pR(5.3,16.4,6.1,17.8),F.earring); }
}

/* ─ 머리카락 ─ */
function bigHair(g,z,pal,p,dir,hat){
  var key=bigHairKey(p),st=HSTYLE[key],h=pal.h,d=pal.d,H=pal.H;
  var mask=bigHairMask(st,dir);
  if(hat){ var m0=mask; mask=function(x,y){ return m0(x,y)&&(y>=hat.y||Math.abs(x-BCX)>(dir===2?99:7.8)&&false)&&true; }; }
  if(hat){ var m1=bigHairMask(st,dir); mask=function(x,y){ return m1(x,y)&&y>=hat.y; }; }
  /* 긴 머리: 몸 뒤로 내려오는 부분은 따로 */
  bF(g,z,mask,h);
  if(st.curl&&!hat){ [[8,4.2,3.2],[12,2.6,3.2],[16,2,3.4],[20,2.6,3.2],[23.5,4.4,3.2],[6.2,8,2.6],[25,8.4,2.6]].forEach(function(q){ bF(g,z,pE(q[0],q[1]+1.6,q[2],q[2]),h); bF(g,z,pE(q[0]-1,q[1]+.4,q[2]*.5,q[2]*.4),H); }); }
  if(dir!==3) bF(g,z,pAnd(mask,pOr(pR(0,0,31,9.3),pR(0,0,31,0))),h);
  /* 빛 한 줄, 아래 그늘 */
  var cp=st.cap,top=cp[1]-cp[3];
  if(dir===0||dir===3) bF(g,z,pAnd(mask,pOr(pR(8,top+1.4,14,top+3.2),pR(12,top+.8,13,top+1.4))),H);
  else bF(g,z,pAnd(mask,pR(8,top+1.6,15,top+3.4)),H);
  bF(g,z,pAnd(mask,pR(0,st.back-1.4,31,st.back)),d);
  if(dir===0&&!st.long) bF(g,z,pAnd(mask,function(x,y){ var i=Math.floor(x)-6; return i>=0&&i<20&&y>=st.fr[i]-1.2&&y<st.fr[i]; }),d);
  if(dir===0&&st.long) bF(g,z,pAnd(mask,function(x,y){ var i=Math.floor(x)-6; return i>=0&&i<20&&y>=st.fr[i]-1.2&&y<st.fr[i]&&y<14; }),d);
  if(dir===0&&!hat&&!st.thin){ bF(g,z,function(x,y){ var i=Math.floor(x)-6; if(i<0||i>19) return false; if(!headShape(0)(x,y)) return false; return y>=st.fr[i]&&y<st.fr[i]+1.1&&st.fr[i]<14; },pal.S); }
  if(st.bun&&!hat){ bF(g,z,pE(15.5,1.6,4.2,3),h); bF(g,z,pE(14.5,1,2,1.4),H); }
}
function bigHairBack(g,z,pal,p,dir){            /* 몸 뒤로 내려오는 긴 머리 */
  var key=bigHairKey(p),st=HSTYLE[key],h=pal.h,d=pal.d;
  if(dir===2){
    if(st.long===2){ bF(g,z,pR(5,10,13,29),h); bF(g,z,pR(5,28,13,29),d); bF(g,z,pR(5,12,6,28),pal.hd); }
    if(st.tail){ bF(g,z,pPoly([[7,6],[3,8],[2,18],[3,29],[6,27],[6,17],[8,10]]),h); bF(g,z,pR(5.5,3.5,8,6),'#E04A5A'); }
    return; }
  if(dir===3){
    if(st.long===2){ bF(g,z,pR(5,10,26,30),h); bF(g,z,pR(5,29,26,30),d); bF(g,z,pR(14,12,17,29),pal.hd); }
    if(st.long===1){ bF(g,z,pR(5,10,26,20),h); }
    if(st.tail){ bF(g,z,pPoly([[13,5],[18,5],[19,20],[17.5,29],[15.5,31],[13.5,29],[12,20]]),h); bF(g,z,pR(14.4,13,16.6,27),pal.H); bF(g,z,pR(13,5,18,6.5),'#E04A5A'); }
    return; }
  if(st.long===2){ bF(g,z,pPoly([[4,10],[7,9],[8,29],[6,31],[4,29]]),h); bF(g,z,pPoly([[27,10],[24,9],[23,29],[25,31],[27,29]]),h);
    bF(g,z,pR(5,17,6,29),pal.hd); }
  if(st.long===1){ bF(g,z,pR(4,10,7,19),h); bF(g,z,pR(24,10,27,19),h); }
  if(st.tail){ bF(g,z,pPoly([[22,3],[27,4],[29,12],[28.5,24],[26.5,30],[25,24],[25.5,12],[23,7]]),h); bF(g,z,pR(26.4,9,27,25),pal.H); bF(g,z,pR(22,3,25,5),'#E04A5A'); }
}

/* ─ 얼굴에 쓰는 것, 머리에 쓰는 것 ─ */
function bigGear(g,z,pal,p,dir,hatOut){
  if(dir!==3&&p.glasses){ var fc=p.glassc||P.s3,round=p.glassround;
    if(dir===2){ bF(g,z,pR(17.6,12,21.4,16.6),fc); bF(g,z,pR(18.4,12.8,20.6,15.8),'#E4F6FF'); bF(g,z,pR(18.4,12.8,18.9,13.4),'#FFFFFF'); bF(g,z,pR(13,13,17.6,13.6),fc); }
    else if(round){ [[11.5,14.7],[19.5,14.7]].forEach(function(q){ bF(g,z,pE(q[0],q[1],3.5,3.4),fc); bF(g,z,pE(q[0],q[1],2.75,2.65),'#EAF7FF'); });
      bF(g,z,pR(14.5,13.6,16.5,14.2),fc);
      [[10,13],[19,13]].forEach(function(q){ bF(g,z,pR(q[0],q[1],q[0]+2,q[1]+3),pal.e); bF(g,z,pR(q[0]+(q[0]<15?2:0),q[1],q[0]+(q[0]<15?2:0),q[1]+1),pal.w); });
      bF(g,z,pR(5.6,13.6,7.9,14.2),fc); bF(g,z,pR(23.1,13.6,25.4,14.2),fc); }
    else { [[8.8,12],[18.2,12]].forEach(function(q){ bF(g,z,pR(q[0],q[1],q[0]+4.4,q[1]+4.6),fc); bF(g,z,pR(q[0]+.8,q[1]+.8,q[0]+3.6,q[1]+3.8),'#EAF7FF'); });
      [[10,13],[19,13]].forEach(function(q){ bF(g,z,pR(q[0],q[1],q[0]+2,q[1]+3),pal.e); bF(g,z,pR(q[0]+(q[0]<15?2:0),q[1],q[0]+(q[0]<15?2:0),q[1]+1),pal.w); });
      bF(g,z,pR(13.2,13,17.8,13.8),fc); } }
  if(dir!==3&&p.shades){
    if(dir===2){ bF(g,z,pR(17.6,12,21.6,15.6),P.s5); bF(g,z,pR(13,12.6,17.6,13.2),P.s5); bF(g,z,pR(18.2,12.4,19,13),'#6B6380'); }
    else { bF(g,z,pR(8.6,12,14,15.6),P.s5); bF(g,z,pR(17,12,22.4,15.6),P.s5); bF(g,z,pR(14,12.6,17,13.2),P.s5); bF(g,z,pR(9.2,12.4,10.4,13.2),'#6B6380'); bF(g,z,pR(17.6,12.4,18.8,13.2),'#6B6380'); } }
  if(p.band){ var bc=p.band; if(dir===2) bF(g,z,pR(5,6,23,8.4),'#2C3A5E'); else bF(g,z,pR(4,6,27,8.4),'#2C3A5E');
    bF(g,z,pR(4,7,27,7.4),'#F4705A'); if(dir!==3){ bF(g,z,pR(21,4,25,8),'#1C2540'); bF(g,z,pR(22,5,24,7),'#F4705A'); bF(g,z,pR(24.5,8,26.5,11),'#2C3A5E'); } }
  if(p.hat){ var hb=p.hatband||dimHex(p.hat),hl=mixHex(p.hat,'#FFFFFF',.22),cx=(dir===2)?14.4:15.5;
    bF(g,z,pAnd(pE(cx,9,11.9,9.2),pR(0,0,31,10.6)),p.hat);
    bF(g,z,pR(cx-12,8.4,cx+12,11.4),hb); for(var rx=cx-11;rx<cx+11.5;rx+=2.2) bF(g,z,pR(rx,8.6,rx+.7,11.2),dimHex(hb));
    bF(g,z,pR(cx-9,2.4,cx-3,3.6),hl); bF(g,z,pE(cx,0.9,2.2,1.6),mixHex(p.hat,'#FFFFFF',.5)); }
}

/* 전체 */
function bigDesc(p){ return p; }
function bigPerson(p,dir,f,z){
  z=z||1; if(dir===1) return mirrorCv(bigPerson(p,2,f,z));
  var g=Gr(BW*z,BH*z),pal=bigPal(p);
  var o={};
  var ts=p.ts||'';
  if(p.hood){ o.hood=1; o.hc=p.hoodc||pal.j; }
  if(p.puff){ o.puffy=1; o.long=1; }
  if(p.robe){ o.long=1; }
  if(p.stripe){ o.stripe=p.acc||'#FFFDF6'; }
  if(p.seam){ o.seam=1; } if(p.cuff){ o.cuff=p.cuff; } if(p.pocket){ o.pocket=1; } if(p.slim) o.slim=1; if(p.wide) o.wide=1;
  var kind=p.tkind||(p.hood?'hood':p.puff?'puff':p.badge?'shirt':p.sharp?'blazer':p.cardi?'cardi':p.vest?'vest':(p.shirt||p.tie)?'blazer':'jacket');
  if(kind==='blazer'||kind==='jacket'){ o.blazer=1; o.inner=pal.c; if(p.sharp){ o.gold=p.acc||P.y1; o.lapel=pal.jl; } }
  if(kind==='shirt'||kind==='tee'){ o.shirtOnly=1; o.sleeve=pal.j; if(kind==='tee') o.shortSleeve=1; }
  if(kind==='cardi'){ o.cardi=1; o.inner=pal.c; }
  if(kind==='vest'){ o.vest=1; o.sleeve=pal.c; o.inner=pal.j; }
  if(p.broad) o.broad=1;
  if(p.hood||p.puff||p.robe) o.blazer=0;
  var st=HSTYLE[bigHairKey(p)];
  var hat=p.hat?{y:(dir===2?10.8:10.6)}:null;
  var hands=null;
  /* 뒤 */
  bigHairBack(g,z,pal,p,dir);
  if(p.puff||p.robe){ bigLegs(g,z,pal,p,dir,f,o); }
  else bigLegs(g,z,pal,p,dir,f,o);
  /* 목 */
  bF(g,z,pR(13,21,18,24),pal.s); bF(g,z,pR(13,22.5,18,23.5),pal.S);
  hands=bigTop(g,z,pal,p,dir,f,o);
  if(p.puff||p.robe){ /* 롱코트 아랫단 위로 다리 신발이 보이게 이미 그림 */ }
  bigTopDeco(g,z,pal,p,dir,f,o);
  if(o.hood&&dir!==2){ /* 후드는 머리 뒤에 */ }
  /* 머리 */
  var hs=headShape(dir);
  bF(g,z,hs,pal.s);
  bF(g,z,pAnd(hs,pOr(pR(0,18,31,22),function(x,y){ return y>=16.4&&Math.abs(x-BCX)>7.2; })),pal.s);
  bF(g,z,pAnd(hs,pR(0,19.6,31,22)),pal.sl);
  bF(g,z,pAnd(hs,pR(0,20.4,31,22)),pal.S);
  if(dir===0){ bF(g,z,pE(5.2,14,1.5,2.2),pal.s); bF(g,z,pE(25.8,14,1.5,2.2),pal.s); bF(g,z,pR(4.8,13.4,5.4,15),pal.S); bF(g,z,pR(25.6,13.4,26.2,15),pal.S); }
  if(dir===3){ bF(g,z,pE(5.2,14,1.2,1.8),pal.s); bF(g,z,pE(25.8,14,1.2,1.8),pal.s); }
  bigFace(g,z,pal,p,dir);
  bigHair(g,z,pal,p,dir,hat);
  if(p.beard&&dir!==3){ var b=p.beard; if(dir===2) bF(g,z,pPoly([[19,18],[24,18],[23,22.5],[19,25]]),b); else bF(g,z,pPoly([[8,17.5],[23,17.5],[21,23],[15.5,26.5],[10,23]]),b);
    if(dir!==2){ bF(g,z,pR(14,19.2,17,19.9),pal.lip); } }
  bigGear(g,z,pal,p,dir);
  if(z>=2) bigDetail(g,z,pal,p,dir,f,st,o);
  bigProps(g,z,pal,p,dir,f,hands,o);
  outline(g,P.s5);
  return toCanvas(g);
}

/* 세로 압축판: 3칸 높이에 가까운 48줄이 지도에서 너무 커서, 얼굴·손 줄은 두고 단색 구간 몇 줄만 뺀 시험판 */
function bigCompact(cv,drop){
  var keep=[],i; for(i=0;i<cv.height;i++) if(drop.indexOf(i)<0) keep.push(i);
  var o=document.createElement('canvas'); o.width=cv.width; o.height=keep.length; var x=o.getContext('2d'); x.imageSmoothingEnabled=false;
  keep.forEach(function(sy,dy){ x.drawImage(cv,0,sy,cv.width,1,0,dy,cv.width,1); }); return o; }
var BDROP=[6,19,26,30,38,41];

/* 2배 해상도에서만 넣는 잔무늬: 머리 결, 옷 주름, 신발 끈 */
function bigDetail(g,z,pal,p,dir,f,st,o){
  var hm=bigHairMask(st,dir),H=pal.H,d=pal.d;
  bF(g,z,function(x,y){ return hm(x,y)&&y>4&&y<12&&((x*1.5+y*.22)%4.6<.5); },d);
  bF(g,z,function(x,y){ return hm(x,y)&&y>2.4&&y<7&&((x*1.5-y*.5+2)%7<.5); },H);
  var j=pal.j,k=pal.jd;
  if(dir!==2){
    bF(g,z,pR(6,28.2,8.9,28.6),k); bF(g,z,pR(22.1,28.2,25,28.6),k);
    bF(g,z,pR(11,33.4,20,33.8),k);
    bF(g,z,pPoly([[10,27],[11,27],[12,33],[11,33]]),pal.jl);
  }
  bF(g,z,pR(12,38,14,38.4),pal.pl); bF(g,z,pR(17.5,38,19.5,38.4),pal.pl);
}
