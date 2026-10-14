/* ══════════ 리뷰 1014 · 새 아이템 40개 ══════════
   게임 파일(prototype/newbie-quest-demo.html)에 그대로 붙이는 세 덩어리다.
   검사: node ops/review-1014/tools/items-check.mjs
   복사본에 붙여 보기: node ops/review-1014/tools/items-check.mjs --apply /tmp/copy.html
   - 블록 A(장비·펫·탈것 22개): `function allItems(id){` 줄 바로 위에 붙인다.
   - 블록 B(세간 17개, 쓰기 동작, 상점 순서, 도트 그림): `FURNI_ACT.bed2=FURNI_ACT.bed;` 줄 바로 아래에 붙인다.
   - 블록 C(도트 그림 연결 한 줄): drawObj의 `default:` 아래 첫 줄 앞에 넣는다.
   능력 키(perk)는 모두 지금 PERK_TEXT에 있는 것만 쓴다. mq는 지금 있는 장(job·lease·card·car·wedding·home)만 쓴다.
   표시: [도트] 지금 그림 코드로 바로 보인다. [그림 권장] 도트로도 보이지만 같은 모양의 기존 물건과 겹쳐 보여서
   그림 시트 L4의 칸 번호를 적었다. [그림 필요] 그림이 들어오기 전에는 붙이지 않는다(맨 아래 블록 D). */

/* ==== 블록 A ==== */
/* 1014: 30~50대 장비. 차·결혼·내 집 장을 깬 뒤에 열린다. 모양은 기존 장비를 쓰고 색과 능력만 다르다 */
ITEMS.carkey   ={slot:'weapon',perk:{fullSave:2},name:'자동차 스마트키',atk:19,def:2,gear:'card',cost:380,mq:'car',
  desc:'주머니에 넣은 채로 문이 열린다. 잃어버리면 새로 맞추는 값이 꽤 나온다.'};                    /* [그림 권장] L4-1 */
ITEMS.powder   ={slot:'weapon',perk:{fullMax:10},name:'분유 보온병',atk:14,def:6,gear:'tumbler',cost:330,mq:'wedding',
  desc:'새벽 세 시에도 물 온도가 딱 맞다.'};                                                        /* [그림 권장] L4-2 */
ITEMS.tablet   ={slot:'weapon',perk:{xp:5,fullSave:2},name:'태블릿',atk:26,gear:'laptop',cost:540,
  desc:'전자책, 회의 자료, 아이 동영상까지. 충전기는 늘 모자란다.'};                                 /* [그림 권장] L4-3 */
ITEMS.mortgage ={slot:'weapon',perk:{mak:1},name:'주담대 상환표',atk:24,def:6,gear:'board',cost:600,mq:'home',
  desc:'원금이 줄어드는 줄을 매달 형광펜으로 긋는다.'};                                            /* [그림 권장] L4-4 */
ITEMS.famcard  ={slot:'weapon',perk:{foodDisc:15},name:'가족카드',atk:28,def:2,gear:'card',cost:640,mq:'wedding',
  desc:'둘이 한 명세서를 같이 본다. 장보기가 한 줄로 모인다.'};                                     /* [그림 권장] L4-5 */
ITEMS.fountain ={slot:'weapon',perk:{kan:1},name:'승진 기념 만년필',atk:22,def:3,gear:'pen',cost:680,mq:'home',
  desc:'결재란에 이름 쓸 일이 많아졌다.'};                                                        /* [그림 권장] L4-6 */
ITEMS.pension  ={slot:'weapon',perk:{coin:10},name:'연금저축 통장',atk:30,def:6,gear:'card',cost:900,mq:'home',
  desc:'쉰다섯이 넘어야 연금으로 꺼낸다. 중간에 깨면 세금을 돌려 낸다.'};                             /* [그림 권장] L4-7 */
ITEMS.hanbok   ={slot:'top',perk:{coin:5},name:'명절 한복',def:15,atk:2,color:'#3A6B8C',accent:'#F7DDB0',ts:'sharp',cost:450,mq:'wedding',
  desc:'명절과 돌잔치에 한 번씩. 빌리는 값보다 사는 게 싸질 때쯤 샀다.'};                            /* [도트] 그림 L4-8 */
ITEMS.teamlead ={slot:'top',perk:{mak:1,xp:5},name:'팀장 정장',def:24,atk:4,color:'#2C3A5E',accent:'#C9C3D6',ts:'sharp',cost:780,mq:'home',
  desc:'회의 끝에 "그럼 정리하면"을 말하는 사람이 됐다.'};                                          /* [도트] 그림 L4-9 */
ITEMS.hikejk   ={slot:'top',perk:{fullMax:10},name:'등산 재킷',def:20,atk:2,color:'#D9503E',accent:'#2E2740',ts:'hood',cost:560,mq:'car',
  desc:'주말 새벽 산 입구 주차장에서 같은 옷을 열 번 본다.'};                                       /* [도트] 그림 L4-10 */
ITEMS.downvest ={slot:'top',perk:{fullSave:2},name:'경량 패딩 조끼',def:18,color:'#26406B',accent:'#C9C3D6',ts:'puff',cost:480,
  desc:'셔츠 위에 하나. 마흔 넘은 사무실의 교복.'};                                               /* [도트] 그림 L4-11 */
ITEMS.hikepants={slot:'bottom',perk:{fullSave:2},name:'등산 바지',def:18,color:'#3A3746',bs:'seam',cost:380,mq:'car',
  desc:'무릎이 늘어나도 다시 돌아온다. 허리 고무줄이 고맙다.'};                                     /* [도트] 그림 L4-12 */
ITEMS.tlpants  ={slot:'bottom',perk:{coin:5},name:'팀장 정장 바지',def:17,atk:2,color:'#2C3A5E',bs:'seam',cost:420,mq:'home',
  desc:'윗옷과 같은 날 샀다. 따로 입어도 아무도 모른다.'};                                         /* [도트] 그림 L4-13 */
ITEMS.jogger   ={slot:'bottom',perk:{fullMax:10},name:'산책 조거 팬츠',def:15,color:'#6B6380',accent:'#FFFDF6',bs:'stripe',cost:300,
  desc:'저녁 먹고 동네 한 바퀴. 발목이 조여서 바람이 안 든다.'};                                   /* [도트] 그림 L4-14 */
ITEMS.reading  ={slot:'head',perk:{kan:1},name:'다초점 안경',def:13,gear:'glass',cost:420,mq:'home',
  desc:'마흔 넘어 처음 맞췄다. 약관 작은 글씨가 다시 보인다.'};                                     /* [그림 권장] L4-15 */
ITEMS.hikebeanie={slot:'head',perk:{fullMax:15},name:'등산 비니',def:11,atk:3,gear:'beanie',color:'#D9503E',color2:'#B93A2D',cost:360,mq:'car',
  desc:'정상 인증 사진마다 같은 모자다.'};                                                         /* [도트] 그림 L4-16 */
ITEMS.polar    ={slot:'head',perk:{fullSave:2},name:'편광 선글라스',def:8,atk:7,gear:'glass',dark:1,cost:520,mq:'car',
  desc:'해 질 녘 고속도로에서도 눈이 덜 부시다.'};                                                 /* [그림 권장] L4-17 */
PETS.penguin   ={slot:'pet',perk:{fullSave:2},name:'텀블러 펭귄',atk:5,def:9,kind:'penguin',cost:380,
  desc:'텀블러를 껴안고 다닌다. 퇴근길에 발맞춰 뒤뚱거린다.'};                                      /* [도트] 이미 있는 그림(petG penguin) */
PETS.slime     ={slot:'pet',perk:{xp:5},name:'커피 슬라임',atk:8,def:4,kind:'slime',cost:460,
  desc:'식은 아메리카노가 굳어서 생겼다는 소문. 옆에 있으면 졸음이 달아난다.'};                       /* [도트] 이미 있는 그림(petG slime) */
MOUNTS.foldbike={slot:'mount',perk:{speed:1,fullSave:3},name:'접이식 자전거',def:9,atk:5,kind:'bike',cost:540,
  pal:{g1:'s0',g2:'s1',g3:'s2'},top:{frame:'#9B93A8',frameL:'#C9C3D6',frameD:'#6B6380'},
  desc:'접어서 현관 구석에 세워 둔다. 마흔에 다시 시작한 운동.'};                                   /* [도트] 그림 L4-18 */
MOUNTS.hybrid  ={slot:'mount',perk:{speed:1,road:1,fullSave:4},name:'하이브리드 세단',def:26,atk:11,kind:'car',cost:2200,mq:'home',
  pal:{r1:'p1',r2:'p3',r3:'b3'},top:{car:'#F7F3EA',carL:'#FFFDF6',carD:'#C9B79A'},
  desc:'시내에서는 엔진 소리가 안 난다. 연비 숫자 보는 게 취미가 됐다.'};                            /* [도트] 그림 L4-19 */
MOUNTS.suv     ={slot:'mount',perk:{speed:1,road:1,fullSave:3},name:'패밀리 SUV',def:28,atk:10,kind:'car',cost:2400,mq:'wedding',
  pal:{r1:'s0',r2:'s1',r3:'s2'},top:{car:'#C9C3D6',carL:'#E4E0EC',carD:'#9B93A8'},
  desc:'카시트 두 개와 유모차가 한 번에 들어간다.'};                                               /* [그림 권장] L4-20, 도트는 경차 모양 */
/* ==== 블록 A 끝 ==== */

/* ==== 블록 B ==== */
/* 1014: 30~50대 세간. need 10 이상은 메인 6장(내 집)을 깬 뒤 자가가 넓어질 때 놓을 수 있다 */
FURNI.ricecook   ={name:'전기밥솥',perk:{foodBoost:10},cost:260,need:5,def:5,w:1,h:1,desc:'밥을 해 두면 라면 먹는 날이 줄어든다.'};
FURNI.water      ={name:'정수기',perk:{fullSave:1},cost:450,need:7,def:6,w:1,h:1,mq:'lease',desc:'생수 묶음을 계단으로 나르던 날은 끝났다.'};
FURNI.monitor2   ={name:'듀얼 모니터 책상',perk:{xp:5},cost:980,need:8,atk:10,w:2,h:1,mq:'job',desc:'재택 날에도 회사 자리와 같은 화면이다.'};
FURNI.wedphoto   ={name:'웨딩 액자',perk:{coin:5},cost:320,need:8,def:4,w:1,h:1,mq:'wedding',desc:'싸운 날에도 눈에 들어오는 자리에 걸었다.'};
FURNI.crib       ={name:'아기 침대',perk:{fullSave:2},cost:760,need:9,def:10,w:2,h:1,mq:'wedding',desc:'난간 높이를 두 번 바꿨다. 이제 혼자 일어선다.'};
FURNI.coffee     ={name:'홈카페 머신',perk:{fullSave:2},cost:880,need:9,atk:6,w:1,h:1,desc:'출근 전 한 잔. 카페값이 석 달이면 빠진다.'};
FURNI.medkit     ={name:'상비약 상자',perk:{fullMax:10},cost:340,need:9,def:6,w:1,h:1,desc:'해열제, 소화제, 혈압계. 밤에 약국 찾아 헤매지 않는다.'};
FURNI.kiddesk    ={name:'아이 책상',perk:{xp:5},cost:820,need:10,atk:6,def:6,w:2,h:1,mq:'home',desc:'높이를 올리는 손잡이가 있다. 해마다 한 칸씩.'};
FURNI.kimchi     ={name:'김치냉장고',perk:{foodBoost:15},cost:1500,need:10,def:14,w:1,h:2,mq:'home',desc:'김장 김치가 봄까지 간다.'};
FURNI.piano      ={name:'디지털 피아노',perk:{coin:5},cost:1150,need:10,atk:8,def:4,w:2,h:1,desc:'헤드폰을 끼면 밤에도 친다. 아랫집은 모른다.'};
FURNI.treadmill  ={name:'러닝머신',perk:{fullMax:15},cost:1700,need:11,def:18,w:1,h:2,desc:'건강검진 결과지를 받은 다음 날 샀다.'};
FURNI.camping    ={name:'캠핑 장비 선반',perk:{fullSave:2},cost:1250,need:11,atk:8,def:8,w:2,h:1,mq:'car',desc:'텐트, 랜턴, 아이스박스. 차가 생기니 짐도 생겼다.'};
FURNI.garden     ={name:'베란다 텃밭',perk:{foodBoost:10},cost:680,need:12,def:6,w:2,h:1,desc:'상추는 사는 것보다 비싸게 먹힌다. 그래도 키운다.'};
FURNI.table6     ={name:'6인 식탁',perk:{foodBoost:20},cost:1900,need:12,def:14,w:3,h:2,mq:'wedding',desc:'명절에 양가가 한 상에 앉는다.'};
FURNI.baduk      ={name:'바둑판',perk:{kan:1},cost:620,need:12,atk:4,w:1,h:1,desc:'한 수 물러 달라는 사람이 꼭 있다.'};
FURNI.recliner   ={name:'리클라이너 소파',perk:{fullMax:20},cost:2600,need:13,def:26,w:3,h:1,mq:'home',desc:'버튼 하나로 다리가 올라온다. 주말이 짧아진다.'};
FURNI.familyphoto={name:'가족사진 장식장',perk:{coin:5},cost:1600,need:14,def:12,w:2,h:1,mq:'home',desc:'해마다 한 장씩 늘었다. 맨 왼쪽은 첫 원룸 앞.'};
FURNI_ACT.ricecook=[{t:'밥 짓기',cd:60,d:{full:30},msg:'갓 지은 밥 냄새가 난다. 포만감 +30'}];
FURNI_ACT.water=[{t:'물 한 잔',cd:20,d:{energy:10,mood:5},msg:'시원한 물 한 잔. 체력 +10 · 기분 +5'}];
FURNI_ACT.monitor2=[{t:'재택 근무',daily:1,d:{xp:30,energy:-15},msg:'출퇴근 두 시간을 아꼈다. 경험치 +30'}];
FURNI_ACT.wedphoto=[{t:'사진 보기',cd:120,d:{mood:20},msg:'그날은 둘 다 긴장해서 웃는 얼굴이 어색하다. 기분 +20'}];
FURNI_ACT.crib=[{t:'아기 재우기',cd:60,d:{mood:20,energy:-10},msg:'자장가 세 곡 만에 잠들었다. 기분 +20'}];
FURNI_ACT.coffee=[{t:'커피 내리기',cd:60,d:{energy:20,mood:10},msg:'원두 가는 소리에 잠이 깬다. 체력 +20 · 기분 +10'}];
FURNI_ACT.medkit=[{t:'혈압 재기',daily:1,d:{xp:10,mood:5},msg:'숫자를 수첩에 적었다. 건강검진 때 보여 준다. 경험치 +10'}];
FURNI_ACT.kiddesk=[{t:'숙제 봐 주기',daily:1,d:{xp:20,mood:10},msg:'분수 나눗셈을 다시 배웠다. 경험치 +20 · 기분 +10'}];
FURNI_ACT.kimchi=[{t:'김치 꺼내기',cd:60,d:{full:30},msg:'잘 익은 김치에 밥 한 공기. 포만감 +30'}];
FURNI_ACT.piano=[{t:'피아노 치기',cd:40,d:{mood:30,energy:-5},msg:'어릴 때 배운 곡이 손에서 나온다. 기분 +30'}];
FURNI_ACT.treadmill=[{t:'30분 걷기',cd:60,d:{mood:20,energy:-15,xp:5},msg:'땀이 나니 머리가 맑다. 기분 +20 · 경험치 +5'}];
FURNI_ACT.camping=[{t:'장비 손질',cd:120,d:{mood:25},msg:'다음 주말 일기예보부터 봤다. 기분 +25'}];
FURNI_ACT.garden=[{t:'상추 따기',cd:120,d:{full:15,mood:15},msg:'오늘 저녁은 쌈이다. 포만감 +15 · 기분 +15'}];
FURNI_ACT.table6=[{t:'다 같이 밥 먹기',cd:60,d:{full:40,mood:20},msg:'반찬 그릇이 식탁을 다 채웠다. 포만감 +40 · 기분 +20'}];
FURNI_ACT.baduk=[{t:'기보 한 판 놓기',daily:1,d:{xp:30,mood:10},msg:'한 수 앞이 아니라 세 수 앞을 봤다. 경험치 +30'}];
FURNI_ACT.recliner=[{t:'등 기대기',cd:30,d:{energy:30,mood:20},msg:'다리가 올라오니 하루가 내려간다. 체력 +30 · 기분 +20'}];
FURNI_ACT.familyphoto=[{t:'사진 보기',cd:120,d:{mood:25},msg:'첫 원룸 앞 사진의 나는 지금보다 말랐다. 기분 +25'}];
/* 상점 세간 줄 순서. 놓을 수 있는 거처 순, 같으면 값 순 */
FURNI_ORDER=['ramen','mat','fan','desk2','fridge','ricecook','fridge2','bed','wash','water','tv','purifier','styler','sofa','monitor2','bed2','table2','wedphoto',
 'aircon','plant','shelf','medkit','crib','coffee','dryer','kiddesk','piano','kimchi','robot','treadmill','camping','dish','garden','baduk','table6',
 'massage','recliner','bigtv','familyphoto'];
/* 새 세간 도트 그림. drawObj와 같은 좌표계(왼쪽 위 0,0, 한 칸 TS=16px). R(색,x,y,너비,높이), shadow()는 drawObj 안의 것을 받는다 */
var FURNI_DRAW={
 ricecook:function(R,shadow,W,H){ shadow();
   R('#C9C3D6',2,3,12,2); R('#9B93A8',6,1,4,2); R('#6B6380',2,5,12,9); R('#E4E0EC',3,5,10,8); R('#FFFDF6',3,5,10,1);
   R('#2E2740',5,8,6,3); R('#62C85C',6,9,2,1); R('#F4705A',9,9,1,1); R('#FFFFFF',12,0,1,2); },
 water:function(R,shadow,W,H){ shadow();
   R('#9B93A8',3,0,10,14); R('#FFFDF6',4,1,8,12); R('#6EC8F0',5,3,6,2); R('#CDEEFF',5,3,2,1);
   R('#2E2740',6,7,4,3); R('#9BDCF7',7,8,2,2); R('#C9C3D6',4,12,8,1); },
 monitor2:function(R,shadow,W,H){ shadow();
   R('#4E3524',1,12,2,2); R('#4E3524',W-3,12,2,2); R('#8A6240',0,8,W,4); R('#C4966A',0,8,W,2);
   R('#2E2740',2,0,13,8); R('#3A9BC9',3,1,11,6); R('#9BDCF7',4,2,4,1);
   R('#2E2740',17,0,13,8); R('#62C85C',18,1,11,6); R('#CDEEFF',19,2,4,1); R('#E4E0EC',10,9,12,2); },
 wedphoto:function(R,shadow,W,H){ R('rgba(30,26,48,.22)',3,14,10,2);
   R('#8A6240',4,10,1,5); R('#8A6240',11,10,1,5); R('#C4966A',2,1,12,11); R('#FFFDF6',3,2,10,9);
   R('#2E2740',5,3,2,2); R('#2C3A5E',5,5,2,5); R('#4A3628',9,3,2,2); R('#FFFFFF',8,5,4,5); R('#E4E0EC',8,9,4,1); R('#F4705A',7,7,1,1); },
 crib:function(R,shadow,W,H){ var i; shadow();
   R('#C4966A',1,12,2,2); R('#C4966A',W-3,12,2,2); R('#FFFDF6',1,2,W-2,11); R('#9BDCF7',3,6,W-6,5); R('#FFFDF6',4,7,6,3);
   for(i=3;i<W-2;i+=3) R('#E0B585',i,3,1,9); R('#E0B585',1,2,W-2,1); R('#E0B585',1,12,W-2,1);
   R('#FFC53C',14,0,1,2); R('#F4705A',17,0,1,2); R('#9B93A8',14,0,4,1); },
 coffee:function(R,shadow,W,H){ shadow();
   R('#2E2740',3,1,10,12); R('#9B93A8',4,2,8,3); R('#C9C3D6',4,2,8,1); R('#6B6380',7,5,2,2);
   R('#FFFDF6',6,9,4,3); R('#8A6240',7,9,2,1); R('#62C85C',10,3,1,1); },
 medkit:function(R,shadow,W,H){ shadow();
   R('#9B93A8',6,3,4,2); R('#C9C3D6',2,5,12,9); R('#FFFDF6',3,6,10,7); R('#F4705A',7,7,2,5); R('#F4705A',5,8,6,2); },
 kiddesk:function(R,shadow,W,H){ shadow();
   R('#3FA548',1,12,2,2); R('#3FA548',W-3,12,2,2); R('#62C85C',0,4,W,8); R('#7ADB74',0,4,W,1); R('#3FA548',0,11,W,1);
   R('#F4705A',3,5,6,4); R('#FFFDF6',4,6,4,2); R('#9B93A8',15,2,1,3); R('#FFE79B',13,1,5,2);
   R('#FFC53C',W-7,1,3,4); R('#6EC8F0',W-6,0,1,2); },
 kimchi:function(R,shadow,W,H){ shadow();
   R('#6B6380',2,0,12,H-2); R('#E4D6CF',3,1,10,H-4); R('#FFFFFF',3,1,1,H-4);
   R('#B4786A',3,9,10,1); R('#B4786A',3,18,10,1); R('#9B93A8',5,4,6,1); R('#9B93A8',5,13,6,1); R('#9B93A8',5,22,6,1);
   R('#2E2740',4,2,3,1); R('#D98A8A',10,26,2,2); },
 piano:function(R,shadow,W,H){ var i; shadow();
   R('#1B1826',1,12,2,2); R('#1B1826',W-3,12,2,2); R('#1B1826',0,1,W,11); R('#2E2740',1,2,W-2,4); R('#FFFDF6',12,2,8,3);
   R('#FFFDF6',1,6,W-2,4); for(i=2;i<W-2;i+=3) R('#1B1826',i,6,1,2); R('#C9C3D6',1,9,W-2,1); },
 treadmill:function(R,shadow,W,H){ var i; shadow();
   R('#6B6380',2,0,12,3); R('#6EC8F0',5,1,6,1); R('#9B93A8',2,3,1,6); R('#9B93A8',13,3,1,6);
   R('#2E2740',3,8,10,H-11); R('#453D5C',4,9,8,H-13); for(i=0;i<5;i++) R('#57517A',4,11+i*4,8,1); },
 camping:function(R,shadow,W,H){ shadow();
   R('#6B4A31',0,2,W,12); R('#8A6240',1,3,W-2,10); R('#6B4A31',1,8,W-2,1);
   R('#2F8C39',2,3,8,5); R('#62C85C',2,3,8,1); R('#F4705A',12,4,5,4); R('#FFFDF6',12,4,5,1);
   R('#FFC53C',20,3,3,4); R('#FFE79B',21,4,1,2); R('#3A9BC9',24,3,6,5);
   R('#C9B79A',2,9,10,3); R('#9B93A8',14,9,6,3); },
 garden:function(R,shadow,W,H){ var i; shadow();
   R('#B4786A',1,8,W-2,6); R('#D08A77',1,8,W-2,1); R('#6B4A31',2,7,W-4,2);
   for(i=0;i<4;i++){ R('#46964A',3+i*6,2,4,6); R('#63B35B',4+i*6,2,2,2); }
   R('#C4966A',W-4,0,1,8); R('#F4705A',W-6,2,2,2); },
 table6:function(R,shadow,W,H){ var i; shadow();
   for(i=0;i<3;i++){ R('#6B4A31',6+i*14,0,8,4); R('#6B4A31',6+i*14,26,8,3); }
   R('#A87B52',2,4,W-4,22); R('#C4966A',2,4,W-4,2); R('#8A6240',2,25,W-4,1);
   for(i=0;i<3;i++){ R('#FFFDF6',7+i*14,8,6,5); R('#FFFDF6',7+i*14,18,6,5); }
   R('#F4705A',21,13,6,4); R('#62C85C',23,14,2,2); },
 baduk:function(R,shadow,W,H){ var i; R('rgba(30,26,48,.22)',2,13,12,3);
   R('#8A6240',3,10,10,4); R('#E0B585',2,2,12,9); R('#C4966A',2,10,12,1);
   for(i=0;i<4;i++){ R('#8A6240',3,3+i*2,10,1); R('#8A6240',4+i*3,3,1,7); }
   R('#1B1826',6,4,2,2); R('#FFFFFF',9,6,2,2); R('#1B1826',10,3,1,1); },
 recliner:function(R,shadow,W,H){ var i; shadow();
   R('#4E3524',1,2,W-2,13); R('#8A6240',2,2,W-4,5); R('#A87B52',2,2,W-4,1);
   for(i=0;i<3;i++){ R('#A87B52',3+i*16,8,10,5); R('#C4966A',3+i*16,8,10,1); }
   R('#6B4A31',1,5,2,9); R('#6B4A31',W-3,5,2,9); R('#2E2740',14,9,2,2); R('#2E2740',30,9,2,2); },
 familyphoto:function(R,shadow,W,H){ shadow();
   R('#E4E0EC',1,10,W-2,4); R('#FFFDF6',1,10,W-2,1); R('#C4966A',4,0,16,10); R('#FFFDF6',5,1,14,8);
   R('#F7DDB0',7,2,2,2); R('#2C3A5E',7,4,2,4); R('#F7DDB0',10,3,2,2); R('#F4705A',10,5,2,3);
   R('#F7DDB0',13,4,2,2); R('#62C85C',13,6,2,2); R('#F7DDB0',16,2,2,2); R('#8E7BB0',16,4,2,4);
   R('#8A6240',23,3,6,7); R('#9BDCF7',24,4,4,5); }
};
/* ==== 블록 B 끝 ==== */

/* ==== 블록 C ==== (drawObj의 `default:` 바로 아래 첫 줄 앞에 넣는다. break가 있어 주석으로 둔다)
      if(typeof FURNI_DRAW!=='undefined'&&FURNI_DRAW[o.id]){ FURNI_DRAW[o.id](R,shadow,W,H); break; }
==== 블록 C 끝 ==== */

/* ==== 블록 D (그림 필요: 시트 L4-21, L4-22가 들어온 뒤 블록 A 끝에 붙인다) ====
   고양이는 지도 위를 따라다니는 그림(CAST.pet_cat)이 없으면 아무것도 안 그려진다.
PETS.cat={slot:'pet',perk:{fullMax:10},name:'집고양이',atk:6,def:10,kind:'cat',cost:480,
  desc:'부르면 안 오고, 노트북을 펴면 그 위에 온다.'};
==== 블록 D 끝 ==== */
