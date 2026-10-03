/* ===== 시안: 이름 있는 캐릭터 프리셋과 연결 ===== */
var HEROES={
 doyun:{name:'김도윤',hs:'crop', hair:{b:'#26232E',s:'#17141D',h:'#4A4560'},skin:SKIN[1],glasses:1,glassround:1,glassc:'#5B4B6E',face:{eye:'round'},build:'slim'},
 haeun:{name:'이하은',hs:'bob',  hair:{b:'#6B4A32',s:'#4A3322',h:'#946B4A'},skin:SKIN[0],face:{eye:'round',blush:1}},
 junhyuk:{name:'박준혁',hs:'block',hair:{b:'#1F1C26',s:'#131119',h:'#3E3950'},skin:SKIN[1],face:{eye:'sharp',thick:1,grin:1},broad:1},
 seoyun:{name:'최서윤',hs:'pony',hair:{b:'#1F1C26',s:'#131119',h:'#3E3950'},skin:SKIN[0],face:{eye:'sharp',flat:0}},
 woojin:{name:'정우진',hs:'sweep',hair:{b:'#6B4A32',s:'#4A3322',h:'#9A7452'},skin:SKIN[1],glasses:1,glassc:'#A9A3BC',face:{eye:'round'}},
 jimin:{name:'한지민',hs:'ash',  hair:{b:'#9A9AA8',s:'#72727E',h:'#C9C9D4'},skin:SKIN[0],face:{eye:'round',blush:1,earring:'#C9C3D6'}},
 taeyang:{name:'오태양',hs:'curly',hair:{b:'#1F1C26',s:'#131119',h:'#3E3950'},skin:SKIN[2],face:{eye:'smile',grin:1,freckle:1}},
 narae:{name:'윤나래',hs:'wave', hair:{b:'#5A3E2C',s:'#3E2A1E',h:'#80593F'},skin:SKIN[0],face:{eye:'round',earring:'#F2EEE8'}}
};
function heroOf(id){ return HEROES[id]||HEROES.doyun; }
/* 장비 -> 그리기 묘사 */
var TOPKIND={shirt:'jacket',suit:'blazer',suitg:'blazer',nomu:'blazer',mq_suit:'blazer',badge:'shirt',mq_badge:'shirt',oxford:'shirt',quiztee:'tee',
  hoodie:'hood',windbrk:'hood',padded:'puff',cardigan:'cardi',knitvest:'vest'};
function heroDesc2(id,equip){
  var E=equip||S.equip,H=heroOf(id||S.hero),top=ITEMS[E.top]||{},bot=ITEMS[E.bottom]||{},hd=ITEMS[E.head]||{},wp=ITEMS[E.weapon]||{};
  var p={hair:H.hair,skin:H.skin,hs:H.hs,face:H.face,glasses:H.glasses,glassround:H.glassround,glassc:H.glassc,broad:H.broad==='x'?0:(H.broad||0),
    top:top.color||'#2C3A5E',bot:bot.color||'#C9B79A',acc:top.accent||bot.accent,prop:'tote',
    tkind:TOPKIND[E.top]||'jacket',shirt:1,hood:TOPKIND[E.top]==='hood',puff:top.ts==='puff',sharp:top.ts==='sharp',badge:top.ts==='badge',
    stripe:bot.bs==='stripe',seam:bot.bs==='seam',slim:bot.bs==='slim',pocket:E.bottom==='cargo',wide:E.bottom==='wideslk',cuff:(E.bottom==='jeans')?'#6C8DB5':null,
    weapon:(wp&&wp.gear)||null};
  if(E.top==='shirt'||!E.top){ p.tkind='jacket'; }
  if(E.top==='badge'||E.top==='mq_badge'||E.top==='oxford'||E.top==='quiztee'){ p.shirt=0; p.lanyard=1; }
  if(p.hood) p.hoodc=top.color;
  if(E.top==='hoodie'){ p.hoodc=top.color; }
  if(hd.gear==='glass'){ if(hd.dark){ p.shades=1; } else { p.glasses=1; p.glassround=0; p.glassc=null; } }
  if(hd.gear==='beanie'){ p.hat=hd.color||'#3A5F8C'; p.hatband=hd.color2||'#2C4668'; }
  if(hd.gear==='band') p.band='#2C3A5E';
  return p; }
function LINEUP(){ return Object.keys(HEROES).map(function(id){ return heroDesc2(id,{top:'shirt',bottom:'slack',head:'hnone',weapon:'pen'}); }); }

function EQTOPS(){ return ['shirt','suit','suitg','badge','hoodie','padded','cardigan','knitvest','windbrk','quiztee','oxford','mq_suit'].map(function(t){ return heroDesc2('junhyuk',{top:t,bottom:'slack',head:'hnone',weapon:'pen'}); }); }
function EQBOTS(){ return ['beige','jeans','slack','train','skinny','cargo','linen','wideslk','luckypants'].map(function(b){ return heroDesc2('woojin',{top:'oxford',bottom:b,head:'hnone',weapon:'card'}); }); }
function EQHEAD(){ var a=[['hnone','pen'],['glass','mouse'],['shades','tumbler'],['beanie','board'],['beanie2','laptop'],['band','keyb'],['hnone','card'],['hnone','goldpen']]; return a.map(function(x){ return heroDesc2('haeun',{top:'cardigan',bottom:'jeans',head:x[0],weapon:x[1]}); }); }
function WALK(){ return [heroDesc2('narae',{top:'shirt',bottom:'beige',head:'hnone',weapon:null})]; }

/* ── 게임에 연결(시안): 지도 위 모든 사람이 큰 도트로 ── */
var __oldPersonTop=personTopCv;
personTopCv=function(p,dir,f){ return bigPerson(p,dir,f,1); };
var __oldHeroDesc=heroDesc;
heroDesc=function(){ return heroDesc2(S.hero||'doyun'); };
/* 캐릭터 화면: 같은 묘사를 두 배 해상도로 */
var __oldRenderChar=renderChar;
renderChar=function(){
  __oldRenderChar.apply(this,arguments);
  var cv=document.getElementById('charbig'); if(!cv) return;
  cv.width=BW*2; cv.height=BH*2; cv.style.width=(BW*4)+'px'; cv.style.height=(BH*4)+'px';
  var cx=cv.getContext('2d'); cx.imageSmoothingEnabled=false; cx.clearRect(0,0,cv.width,cv.height);
  cx.drawImage(bigPerson(heroDesc2(S.hero||'doyun'),0,0,2),0,0);
  var pa=document.getElementById('pavatar'); if(!pa) return; pa.innerHTML='';
  Object.keys(HEROES).forEach(function(id){
    var b=document.createElement('button'); b.className='pick pix';
    b.style.cssText+='width:78px;height:88px;flex-direction:column;gap:1px;justify-content:flex-start;padding-top:2px';
    b.setAttribute('aria-pressed',(S.hero||'doyun')===id?'true':'false');
    var c=document.createElement('canvas'); c.width=BW; c.height=34; c.style.width=(BW*2)+'px'; c.style.height='68px'; b.appendChild(c);
    c.getContext('2d').drawImage(bigPerson(heroDesc2(id),0,0,1),0,0);
    var nm=document.createElement('span'); nm.className='micro'; nm.style.cssText='font-size:10px;line-height:11px'; nm.textContent=HEROES[id].name; b.appendChild(nm);
    b.onclick=function(){ S.hero=id; TOPC={}; save(); renderChar(); };
    pa.appendChild(b); });
};
var __oldPaintHero=paintHero;
paintHero=function(cv,pose,frame,ox,oy){
  if(cv&&cv.id==='hudchar'){ var cx=cv.getContext('2d'); cx.imageSmoothingEnabled=false; cx.clearRect(0,0,cv.width,cv.height);
    cx.drawImage(bigPerson(heroDesc2(S.hero||'doyun'),0,0,1),4,2); return; }
  return __oldPaintHero.apply(this,arguments); };
var BIGMODE='full';
personTopCv=function(p,dir,f){ var c=bigPerson(p,dir,f,1); return (BIGMODE==='compact')?bigCompact(c,BDROP):c; };

function NPCS(){ return Object.keys(NPC_TOP).map(function(k){ return NPC_TOP[k]; }); }
