/* 리뷰 1014 · 페이싱 제안 (게임 디자인·페이싱 담당, 2026-10-14)
   인생 모드를 "한 해 한 해" 사는 구조로 바꾼다. 설명은 ops/review-1014/pacing.md.
   이 파일은 게임 안 형식(ES5) 그대로다. apply.mjs가 아래 [PLAN] 블록을
   `var LIFE_AGES=...;` 줄 바로 뒤에 넣고, 기존 함수 몇 곳을 정확한 글자로 고친다.
   LIFE_AGES(메인 여섯 장의 나이)는 그대로 둔다: job 24, lease 26, card 27, car 29, wedding 32, home 37, end 60.

   다른 담당이 채울 곳
   - 이야기: LIFE_STAGES 각 칸의 ykey(예: 'y40')로 LIFE_YEARS에 장면을 쓴다(지금 y24~y37과 같은 형식).
             장면이 아직 없으면 게임은 알림 한 줄과 보상만 주고 넘어간다(멈추지 않는다).
             y60의 sub '마흔, 쉰, 그리고'는 이제 맞지 않으니 '정년, 예순' 쪽으로 고친다.
   - 퀘스트: LIFE_QUEST_BANDS의 fit 그대로 새 퀘스트를 쓴다(fits가 ageMin을 새로 읽는다).
   - 생활 이벤트: 인생 모드에서는 한 해에 하나씩 나온다. 40대·50대에 맞는 LIFE_EV를 늘리면 반복이 준다. */

/* [PLAN] 시작 */
/* 한 해를 채우는 활동 수. 활동 = 퀘스트(처음 깬 것) + 사건(처음) + 보스(처음) + 생활 이벤트(한 해에 하나).
   n:2 이면 보통 "생활 이벤트 하나 + 퀘스트 하나"가 한 해다. 메인 장의 조건(집 스탯, 레벨)이 막으면
   그 해에 머물며 퀘스트를 더 푼다. */
var LIFE_PACE=[{to:23,n:2},{to:29,n:2},{to:39,n:1.5},{to:49,n:1.5},{to:59,n:1.5}];
/* n:1.5 는 "생활 이벤트만 있는 해"와 "생활 이벤트 + 퀘스트 하나인 해"가 번갈아 온다는 뜻이다(lifeAgeRaw가 남는 0.5를 다음 해로 넘긴다). */
/* 메인 3·4·5장의 레벨 조건. 인생 모드는 나이가 먼저 막으므로 한 단계 낮춘다(6→5, 8→7, 10→9). 일반 모드는 그대로 */
function mqLv(n){ return lifeOn()?n-1:n; }
/* 중간 장: 메인 장 사이의 빈 해를 메우는 짧은 장. 세월 컷신(LIFE_YEARS[ykey]) + 보상.
   age살이 될 차례(앞 해의 활동을 다 채움)이고 after가 끝났으면 홈에서 저절로 열린다.
   열리기 전까지 나이는 age-1에서 멈춘다(메인 장과 같은 규칙). */
var LIFE_STAGES=[
 {id:'m22',age:22,ykey:'y22',title:'스물둘, 갈림길',after:null,
  trigger:'21살 몫(활동 2개)을 채우면',
  reward:{xp:120,coin:100,stat:{jik:3}},unlock:[],
  note:'대학생은 졸업 준비·휴학 고민, 전문대는 졸업, 고졸은 두 번째 일자리. 카드(path)마다 한 줄씩 바꾼다.'},
 {id:'m30',age:30,ykey:'y30',title:'서른, 연봉 협상',after:'car',
  trigger:'4장 첫 차를 깨고 29살 몫을 채우면',
  reward:{xp:200,coin:200,stat:{jik:4,geum:2}},unlock:['30대 퀘스트'],
  note:'첫 연봉 협상과 연말정산 환급. 30대 퀘스트가 열린다.'},
 {id:'m34',age:34,ykey:'y34',title:'두 번째 회사',after:'wedding',
  trigger:'5장 결혼 준비를 깨고 33살 몫을 채우면',
  reward:{xp:250,coin:250,stat:{jik:6,geum:3}},unlock:[],
  note:'이직 제안. 퇴직금 정산, 4대보험 이어 가기. 청년 기준(만 34세)이 끝나는 해라 청약 조건도 바뀐다.'},
 {id:'m40',age:40,ykey:'y40',title:'마흔, 생애전환기 검진',after:'home',
  trigger:'6장 내 집 마련을 깨고 39살 몫을 채우면',
  reward:{xp:300,coin:300,stat:{ui:6,sik:4}},unlock:['40대 퀘스트'],
  note:'만 40세 생애전환기 건강진단(국민건강보험공단). 몸과 보험을 다시 본다.'},
 {id:'m45',age:45,ykey:'y45',title:'부모님 곁',after:'m40',
  trigger:'44살 몫을 채우면',
  reward:{xp:300,coin:300,stat:{ui:4,ju:4}},unlock:[],
  note:'부모님 병원·돌봄. 노인장기요양보험 등급 신청(국민건강보험공단). 형제와 돈 나누기.'},
 {id:'m50',age:50,ykey:'y50',title:'쉰, 노후 설계',after:'m45',
  trigger:'49살 몫을 채우면',
  reward:{xp:350,coin:350,stat:{geum:8}},unlock:['50대 퀘스트'],
  note:'국민연금 예상 수령액 조회, 퇴직연금 점검(국민연금공단 노후준비서비스).'},
 {id:'m55',age:55,ykey:'y55',title:'퇴직 준비',after:'m50',
  trigger:'54살 몫을 채우면',
  reward:{xp:350,coin:400,stat:{geum:6,jik:4}},unlock:[],
  note:'희망퇴직 제안과 퇴직금 IRP, 두 번째 일 준비. 정년은 60세 이상(고령자고용법).'},
 {id:'end',age:60,ykey:'y60',title:'정년, 예순',after:'m55',
  trigger:'59살 몫을 채우면 결산(lifeEnd)',
  reward:null,unlock:[],note:'지금의 예순 결산을 그대로 쓴다.'}];
/* 퀘스트 담당이 쓸 나이 띠. 시뮬에서 한 띠에 퀘스트 4~9개를 푼다(정답률 85~65%). 지금은 20대에 남은 청년 퀘스트로 채워지므로 띠마다 최소 6개, 바라는 수 8개 */
var LIFE_QUEST_BANDS=[
 {band:'30s',fit:{status:['직장인'],ageMin:30,ageMax:39},need:8,hint:'연봉 협상, 연말정산, 이직과 퇴직금, 육아휴직·출산 지원, 대출 갈아타기'},
 {band:'40s',fit:{status:['직장인'],ageMin:40,ageMax:49},need:8,hint:'건강검진·실손보험, 부모님 병원비, 자녀 교육비, 주택담보대출 금리, 연금저축'},
 {band:'50s',fit:{status:['직장인'],ageMin:50,ageMax:59},need:8,hint:'국민연금 수령 나이, 퇴직연금·IRP, 희망퇴직, 재취업, 상속·증여 기초, 보이스피싱'}];

function lifePer(age){ for(var i=0;i<LIFE_PACE.length;i++) if(age<=LIFE_PACE[i].to) return LIFE_PACE[i].n; return 2; }
/* 나이를 미는 활동 수: 처음 깬 퀘스트·사건·보스와 인생 모드 생활 이벤트 */
function lifeActs(){ return (S.done||[]).length+Object.keys(S.epBest||{}).length+(S.bossDone||[]).length+((S.life&&S.life.evn)||0); }
/* 막는 것 없이 활동만으로 닿는 나이 */
function lifeAgeRaw(){ var a=S.life.anch,age=a.age,n=lifeActs()-a.done; while(age<60&&n>=lifePer(age)){ n-=lifePer(age); age++; } return age; }
/* age살에 닿으려면 활동이 몇 개 더 필요한가 */
function lifeActsTo(age){ var a=S.life.anch,cur=a.age,n=lifeActs()-a.done,need=0;
  while(cur<age){ var p=lifePer(cur); if(n>=p) n-=p; else { need+=p-n; n=0; } cur++; } return need; }
function lifeAgeOk(id){ return !lifeOn()||!S.life||!LIFE_AGES[id]||lifeAgeRaw()>=LIFE_AGES[id]; }
/* 집 스탯으로 막히는 2장·6장: 그 장의 나이를 두 해 넘길 만큼 활동을 더 했는데도 못 열면 할배가 먼저 부른다.
   (1009에서 넣은 lifeNoQuests는 퀘스트가 바닥나야 열려서, 한 해 한 해 구조에서는 25살에 20~30분 머문다) */
function lifeLate(id){ return lifeOn()&&!!S.life&&((id==='lease'&&mqDone('job'))||(id==='home'&&mqDone('wedding')))&&lifeAgeRaw()>=LIFE_AGES[id]+2; }
function lifeAgeWait(id){ var k=lifeActsTo(LIFE_AGES[id]); return k>0?(LIFE_AGES[id]-1)+'살을 마저 살면 · 퀘스트나 생활 이벤트 '+k+'개 더':null; }
function lifeStageDone(id){ return !!(S.life&&S.life.st&&S.life.st[id]); }
function lifeStageNext(){ for(var i=0;i<LIFE_STAGES.length;i++) if(!lifeStageDone(LIFE_STAGES[i].id)) return LIFE_STAGES[i]; return null; }
function lifeStageAfterOk(st){ return !st.after||(mqById(st.after)?mqDone(st.after):lifeStageDone(st.after)); }
function lifeStageReady(st){ return !!(st&&lifeOn()&&S.life&&!S.life.over&&!lifeStageDone(st.id)&&lifeStageAfterOk(st)&&(st.id!=='end'||!mqNext())&&lifeAgeRaw()>=st.age); }
/* 나이 상한: 다음 메인 장과 다음 중간 장 중 먼저 오는 것의 한 해 전 */
function lifeCapAge(){ var nx=(typeof mqNext==='function')?mqNext():null,c=59,st=lifeStageNext();
  if(nx) c=Math.min(c,lifeChAge(nx.id)-1); if(st) c=Math.min(c,st.age-1); return c; }
function lifeEndReady(){ var st=lifeStageNext(); return !!(st&&st.id==='end'&&lifeStageReady(st)); }
function lifeStagePlay(st){
  var L=S.life; L.st=L.st||{}; if(L.st[st.id]) return; L.st[st.id]=1;
  if(st.id==='end'){ save(); return lifeEnd(); }
  if(L.anch.age<st.age) L.anch={age:st.age,done:lifeActs()};
  var R=st.reward||{},rows=[];
  if(R.xp){ S.xp+=R.xp; rows.push(['경험치','+'+R.xp]); } if(R.coin){ S.coin+=R.coin; rows.push(['코인','￦'+R.coin]); }
  Object.keys(R.stat||{}).forEach(function(k){ S.stats[k]=Math.min(100,(S.stats[k]||0)+R.stat[k]); rows.push([(THEMES[k]?THEMES[k].k:k)+' 스탯','+'+R.stat[k]]); });
  (st.unlock||[]).forEach(function(u){ rows.push(['열림 · '+u,'','#6EC8F0']); });
  while(S.xp>=need(S.lv)){ S.xp-=need(S.lv); S.lv++; }
  lifeTick(); save(); ev('life_stage',{id:st.id,age:st.age});
  var y=LIFE_YEARS[st.ykey];
  if(!y||typeof playMQ!=='function'){ hudRefresh(); toast(st.age+'살 · '+st.title); return; }
  playMQ({kicker:'LIFE',title:y.title||st.title,sub:y.sub||st.title,scenes:lifeFill(y.scenes,lifeFillVals()),
    endScenes:function(){ return [{type:'reward',grade:'good',rows:rows.slice(0,8),card:[st.title,st.age+'살'],end:1}]; },
    onDone:function(){ render('home'); hudRefresh(); }}); }
/* 홈에 돌아올 때 부른다. 창이 다 닫힐 때까지 기다렸다가 중간 장(또는 예순 결산)을 연다 */
function lifeStageCheck(){
  if(!lifeOn()||!S.life||!S.onboarded||S.life.over||lifeStageCheck.t) return;
  if(!lifeStageReady(lifeStageNext())) return;
  lifeStageCheck.t=setTimeout(function(){ lifeStageCheck.t=0;
    var st=lifeStageNext(); if(!lifeStageReady(st)) return;
    if(!mqIdle()) return lifeStageCheck();
    lifeStagePlay(st); },1200); }
/* [PLAN] 끝 */
