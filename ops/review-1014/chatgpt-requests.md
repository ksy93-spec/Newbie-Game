# ChatGPT로 뽑을 시트 · 리뷰 1014 (30대에서 60살까지)

대표 요청: 30대 이후가 텅 비어 있다. 컷신 배경, 새 인물, 새 아이템 그림이 있어야 37살에서 60살까지 이야기를 채울 수 있다.
이번 시트는 여섯 장이다. 이름은 `L1`부터 `L6`까지다(Life). 기존 A~K, P, H8과 겹치지 않는다.

## 쓰는 법

지난번(`ops/art/chatgpt-asset-sheets.md`)과 같다.

1. 새 대화창 하나를 연다.
2. 첫 메시지에 그림 두 장을 첨부한다.
   - `ops/art/style-ref.png`
   - `ops/art/A.png`(지난번 인물 시트)
3. 같은 첫 메시지에 아래 "공통 스타일" 문단과 시트 L1 프롬프트를 붙인다.
4. 다음 시트부터는 같은 창에서 프롬프트만 붙인다. 그림체가 흔들리면 공통 문단과 그림 두 장을 다시 붙인다.
5. 받은 그림은 원본 그대로 `ops/art/L1.png`, `ops/art/L2.png` … 로 저장한다. 파일 이름이 곧 자르기 설정의 이름이다.
6. 칸 순서가 이름표다. 왼쪽 위에서 오른쪽으로 읽고, 줄이 끝나면 다음 줄로 간다.

무료 플랜이면 하루에 L1·L2, 다음 날 L3·L4, 그다음 날 L5·L6 순서로 뽑는다.

## 우선순위

한 장으로 화면에 새로 보이는 것이 많은 순서다.

| 순서 | 시트 | 저장 이름 | 내용 | 칸 | 비율 | 왜 먼저 |
|---|---|---|---|---|---|---|
| 1 | L1 | `ops/art/L1.png` | 30~60대 사건 배경 9 | 3×3, 흰 줄 | 정사각 1024×1024 | 37살 이후 장·사건 컷신이 모두 이 배경을 쓴다. 지금 배경 15장은 20대 장소뿐이다 |
| 2 | L2 | `ops/art/L2.png` | 새 인물 8 (부모, 아이, 의사, 대출 상담사 등) | 4×2 | 가로 1536×1024 | 새 사건마다 말 거는 사람이 필요하다. 지금은 해시로 아무 얼굴이나 나온다 |
| 3 | L4 | `ops/art/L4.png` | 새 장비·탈것·펫 아이콘 25 | 5×5 | 정사각 1024×1024 | 새 장비 22개가 가방에서 기존 물건과 같은 모양으로 보인다. 옷은 도트 썸네일이 머리카락까지 잘려 보인다 |
| 4 | L3 | `ops/art/L3.png` | 새 세간 17 | 5×4 (마지막 3칸 비움) | 가로 1536×1024 | 도트 그림이 이미 있어서 급하지 않다. 상점 줄이 다른 세간(그림)과 맞춰진다 |
| 여유 | L5 | `ops/art/L5.png` | 사건 배경 6 | 3×2, 흰 줄 | 가로 1536×1024 | 40·50대 생활 배경(놀이터, 이삿날, 캠핑장) |
| 여유 | L6 | `ops/art/L6.png` | 나이 든 인물 6 (40대 배우자, 80대 부모 등) | 3×2 | 가로 1536×1024 | 같은 사람이 나이 드는 모습. 50대 이후 장면에 쓴다 |

## 공통 스타일

첫 장에는 꼭, 그 뒤로는 그림체가 흔들릴 때만 붙인다. 지난번 문단과 같고, 나이 든 인물 한 줄만 더했다.

```
Art style for every image in this conversation (match the attached reference images):
- 16-bit style pixel art for a cozy Korean life-sim RPG set in today's Seoul.
- Crisp hard-edged pixels, no anti-aliasing, no blur, no painterly gradients, no photo texture.
- Limited palette of about 24 colors close to the reference swatches. Warm neutral skin tones.
- 1-pixel dark charcoal outline (#2C2C31) around every object and character.
- Simple cel shading, light from the top-left, one highlight and one shadow tone per material.
- People are cute chibi proportions (head about 1/3 of body height), standing, front view turned slightly to the left, feet on the same baseline. Older people keep the same chibi proportions; show age with gray hair, wrinkles at the eyes, posture and clothes.
- Objects are clean front-facing icons, slightly from above, centered, filling about 80% of the cell.
- Lay assets out on an exact grid. Every cell the same size, one asset per cell, centered, nothing crossing cell borders.
- Background of every sprite cell is flat solid magenta #FF00FF with no gradient, no floor, no shadow on the background.
- No text, no letters, no numbers, no labels, no logos, no watermark anywhere.
```

## 시트 L1. 30~60대 사건 배경 9 (1순위)

컷신 배경이다. 인물이 아래쪽 1/3에 서니까 화면 아래는 바닥이나 길로 비워 둔다. 칸 사이는 흰 줄이다. 칸 순서와 게임 이름:

1. `bg_hospital` 병원 진료실과 복도. 건강검진, 출산, 부모님 입원 장면.
2. `bg_school` 초등학교 교실. 학부모 상담, 공개 수업.
3. `bg_retire` 식당 연회실. 퇴직 송별회, 회식.
4. `bg_loan` 은행 대출 상담 창구. 칸막이 책상과 의자 두 개. 주택담보대출, 전세대출.
5. `bg_funeral` 장례식장 빈소. 흰 국화 제단, 향, 조문객 자리. 종교 표시와 글자는 넣지 않는다.
6. `bg_park` 동네 공원. 산책길, 벤치, 운동 기구.
7. `bg_airport` 공항 출국장. 큰 유리창 너머 비행기.
8. `bg_dol` 돌잔치 연회장. 작은 무대와 돌상.
9. `bg_parents` 부모님 댁 거실. 오래된 소파, 벽에 걸린 가족사진, 명절 상.

```
Sheet L1: a 3 x 3 grid of background scenes, square 1024x1024, each cell separated by a thin white gutter. These are cutscene backdrops for the 30s to 60s of a Korean life, so leave the bottom third of each scene as plain floor or ground where characters will stand, and keep every scene empty of people.
Cell order left to right, top row first:
1. Korean hospital: a doctor's consultation room opening onto a bright corridor, examination bed with a curtain, a desk with a monitor.
2. Korean elementary school classroom: rows of small desks, a green chalkboard with no writing, children's drawings pinned on the back wall, afternoon light.
3. Restaurant banquet room for a retirement farewell party: long low tables with dishes, a bouquet of flowers on the head table, warm lights.
4. Bank loan consultation desk: a partitioned desk with two customer chairs, a monitor, document trays and a pen holder, calm blue and white interior.
5. Korean funeral hall memorial room: an altar covered with rows of white chrysanthemums, a framed photo frame left blank, incense, a quiet mourning area with low tables. No religious symbols, no text.
6. Neighborhood park: walking path, wooden benches, outdoor exercise equipment, trees and a small pavilion, sunny afternoon.
7. Airport departure hall: tall glass windows with an airplane outside, check-in counters, rows of seats, a departure board with no readable text.
8. First-birthday party (doljanchi) banquet hall: a small stage with a decorated table of rice cakes and fruit, balloons, round guest tables.
9. Elderly parents' living room in an old apartment: an old floral sofa, a low table set with holiday dishes, family photos on the wall left as blank frames, a wall clock.
Pixel art, same style as before. No text anywhere.
```

## 시트 L2. 새 인물 8 (2순위)

대화창, 퀘스트·사건 화면, 컷신에 쓰는 전신. 시트 A와 같은 키와 같은 배율이다. 칸 순서와 게임 이름:

1. `npc_mom` 주인공 어머니, 60대 초반. 짧은 갈색 파마에 흰머리가 섞였다. 꽃무늬 블라우스, 장바구니.
2. `npc_dad` 주인공 아버지, 60대 초반. 희끗한 짧은 머리, 등산 조끼, 회색 바지.
3. `npc_toddler` 우리 아이, 세 살. 노란 우비, 장화, 작은 인형.
4. `npc_teen` 우리 아이, 중학생. 교복, 이어폰, 시큰둥한 얼굴. (초등학생 boy·girl은 시트 A에 있다)
5. `npc_doctor` 의사, 40대 여성. 흰 가운, 청진기, 차트.
6. `npc_banker` 대출 상담사, 40대 남성. 남색 정장, 안경, 서류철과 계산기.
7. `npc_teamlead` 팀장, 40대 여성. 단정한 단발, 회색 정장, 태블릿.
8. `npc_teacher` 담임 선생님, 30대 남성. 카디건, 출석부, 친절한 얼굴.

```
Sheet L2: a 4 columns x 2 rows grid of full-body character portraits, landscape 1536x1024, same style, same scale and same pixel density as Sheet A in the reference. Adults the same height as Sheet A adults; children shorter.
Cell order left to right, top row first:
1. Korean mother in her early 60s: short brown permed hair with some gray, floral blouse, beige trousers, holding a cloth shopping bag, warm smile.
2. Korean father in his early 60s: short gray-streaked hair, outdoor hiking vest over a checked shirt, gray trousers, hands behind his back, gentle stern face.
3. Three-year-old toddler: yellow raincoat, small rain boots, holding a plush toy, round cheeks.
4. Middle school student around 14: Korean school uniform (navy blazer, white shirt), wired earphones, a backpack on one shoulder, a bored teenage expression.
5. Doctor, woman in her 40s: white coat, stethoscope around the neck, holding a clipboard chart, hair tied back, reassuring look.
6. Bank loan officer, man in his 40s: navy suit, glasses, holding a document folder and a calculator, polite smile.
7. Team leader, woman in her 40s: neat bob haircut, gray pantsuit, ID badge, holding a tablet, confident posture.
8. Elementary school homeroom teacher, man in his 30s: knit cardigan over a shirt, holding an attendance binder, kind face.
All eight at the same scale as Sheet A, full body, standing, feet on one baseline. Magenta #FF00FF background in every cell.
```

## 시트 L4. 새 장비·탈것·펫 아이콘 25 (3순위)

`ops/review-1014/items/items.js`의 물건이다. 가방, 상점, 수집 노트 아이콘으로 쓴다. 칸 순서와 게임 이름:

1. `it_carkey` 자동차 스마트키
2. `it_powder` 분유 보온병
3. `it_tablet` 태블릿
4. `it_mortgage` 주담대 상환표(형광펜 줄이 그어진 표가 끼워진 파일)
5. `it_famcard` 가족카드(연두색 카드에 하트 두 개)
6. `it_fountain` 승진 기념 만년필(검정과 금색, 선물 상자)
7. `it_pension` 연금저축 통장(두꺼운 초록 통장)
8. `it_hanbok` 명절 한복(파란 저고리, 베이지 고름)
9. `it_teamlead` 팀장 정장(남색 재킷, 은색 핀)
10. `it_hikejk` 등산 재킷(빨강)
11. `it_downvest` 경량 패딩 조끼(남색)
12. `it_hikepants` 등산 바지(짙은 회색)
13. `it_tlpants` 팀장 정장 바지(남색)
14. `it_jogger` 산책 조거 팬츠(회보라, 옆줄)
15. `it_reading` 다초점 안경(갈색 뿔테)
16. `it_hikebeanie` 등산 비니(빨강)
17. `it_polar` 편광 선글라스
18. `it_foldbike` 접이식 자전거(은색, 옆모습)
19. `it_hybrid` 하이브리드 세단(진주색, 옆모습)
20. `it_suv` 패밀리 SUV(은회색, 옆모습)
21. `it_cat` 집고양이(앉은 모습, 아이콘)
22. `pet_cat` 집고양이(지도에서 따라다니는 작은 그림, 옆모습으로 걷는 자세)
23. `it_penguin` 텀블러 펭귄
24. `it_slime` 커피 슬라임
25. 비움

```
Sheet L4: a 5 x 5 grid of item icons, square 1024x1024. Clothing is shown flat and front-facing like an inventory icon, no person wearing it. Vehicles share one consistent scale and all face right.
Cell order left to right, top row first:
1. black smart car key fob with two small buttons
2. insulated baby formula thermos bottle, pastel
3. tablet computer with a stylus, screen showing simple colored blocks
4. clear document folder holding a loan repayment table striped with yellow highlighter lines (no readable text)
5. light green family credit card with two small hearts
6. black and gold fountain pen lying on an open gift box
7. thick green bank savings passbook
8. Korean hanbok top (jeogori), deep blue with a beige ribbon tie
9. navy suit jacket with a small silver lapel pin
10. red hiking jacket with a hood
11. navy lightweight quilted padded vest
12. dark gray hiking trousers with knee panels
13. navy suit trousers
14. gray-purple jogger pants with white side stripes and cuffed ankles
15. brown tortoiseshell reading glasses
16. red knit hiking beanie with a small fold
17. sporty polarized sunglasses with a dark gray tint
18. silver folding bicycle with small wheels, side view
19. pearl white hybrid sedan, side view
20. silver gray family SUV, side view, larger than the sedan
21. pet: tabby cat sitting, calm face, icon
22. pet: the same tabby cat walking, small side view sprite for a top-down map, facing right
23. pet: small penguin hugging a stainless tumbler
24. pet: cute round slime made of iced coffee, with a straw and foam on top
25. leave this cell empty magenta
Magenta #FF00FF background in every cell. No text, no brand logos, no license plate characters.
```

## 시트 L3. 새 세간 17 (4순위)

방에 놓는 가구와 가전. 지난번 시트 F와 같이 위에서 비스듬히 본 모습이다. 칸 순서와 게임 이름:

1. `fu_ricecook` 전기밥솥
2. `fu_water` 정수기
3. `fu_monitor2` 듀얼 모니터 책상
4. `fu_wedphoto` 웨딩 액자(이젤 위)
5. `fu_crib` 아기 침대(모빌)
6. `fu_coffee` 홈카페 머신
7. `fu_medkit` 상비약 상자와 혈압계
8. `fu_kiddesk` 아이 책상(연두색, 스탠드)
9. `fu_kimchi` 김치냉장고(서랍 세 칸)
10. `fu_piano` 디지털 피아노
11. `fu_treadmill` 러닝머신
12. `fu_camping` 캠핑 장비 선반(텐트 가방, 랜턴, 아이스박스)
13. `fu_garden` 베란다 텃밭 상자(상추, 방울토마토)
14. `fu_table6` 6인 식탁(의자 여섯, 반찬)
15. `fu_baduk` 바둑판(다리 달린 나무판, 바둑돌)
16. `fu_recliner` 3인 리클라이너 소파(갈색 가죽)
17. `fu_familyphoto` 가족사진 장식장(낮은 장 위에 액자들)
18~20. 비움

```
Sheet L3: a 5 columns x 4 rows grid of furniture and home appliance sprites for a Korean apartment, landscape 1536x1024, same three-quarter top-down view as the furniture sheet before (seen from slightly above and in front).
Cell order left to right, top row first:
1. electric rice cooker with steam
2. countertop water purifier dispenser
3. desk with two computer monitors and a keyboard
4. wedding photo in a wooden frame on a small easel (couple as tiny simple figures)
5. white wooden baby crib with a hanging mobile
6. home espresso machine with a cup
7. white first-aid box with a red cross and a blood pressure monitor beside it
8. light green children's study desk with a desk lamp and pencil cup
9. kimchi refrigerator, a waist-high chest with three drawers, pale rose color
10. digital piano with a music sheet stand
11. treadmill
12. wooden storage shelf with camping gear: tent bag, lantern, cooler box, folding chair
13. long balcony planter box with lettuce and a cherry tomato plant
14. dining table for six with six chairs and many side dishes
15. traditional Go (baduk) board on legs with black and white stones
16. three-seat brown leather recliner sofa
17. low white cabinet with several family photo frames on top (tiny simple figures)
18, 19, 20. leave empty magenta
Magenta #FF00FF background in every cell. No text, no brand logos.
```

## 시트 L5. 사건 배경 6 (여유)

칸 순서와 게임 이름:

1. `bg_playground` 저녁 아파트 놀이터
2. `bg_realtor` 부동산 사무실 안
3. `bg_moving` 이삿날 골목, 사다리차와 이삿짐 트럭
4. `bg_exec` 팀장·임원 자리가 있는 사무실 창가
5. `bg_camp` 밤 캠핑장, 텐트와 모닥불
6. `bg_river` 노을 지는 강변 공원, 다리와 자전거 길

```
Sheet L5: a 3 columns x 2 rows grid of background scenes, landscape 1536x1024, thin white gutters between cells, same rules as Sheet L1 (bottom third is empty floor or ground, no people, no text).
Cell order left to right, top row first:
1. apartment complex playground in the evening: slide, swings, sandbox, apartment windows lit behind
2. small Korean real estate agency office interior: desk, wall of apartment listing sheets with no readable text, a map board, a water dispenser
3. moving day in a residential alley: a moving truck with a ladder lift reaching a window, stacked boxes
4. corner office by a large window over the city: a bigger desk, a plant, a small sofa
5. campsite at night: a tent, a campfire, a folding table and a lantern, stars above
6. riverside park at sunset: a long bridge across a wide river, a bicycle path, grass and benches
Pixel art, same style as before. No text anywhere.
```

## 시트 L6. 나이 든 인물 6 (여유)

같은 사람이 나이 드는 모습이다. 1, 2는 시트 A의 결혼 상대(3, 4번 칸)를, 3, 4는 L2의 부모(1, 2번 칸)를 같은 얼굴로 나이 들게 한다. 칸 순서와 게임 이름:

1. `npc_partnerF40` 결혼 상대(여) 40대 중반
2. `npc_partnerM40` 결혼 상대(남) 40대 중반
3. `npc_mom80` 어머니 80대, 지팡이
4. `npc_dad80` 아버지 80대, 휠체어 대신 보행 보조기
5. `npc_junior` 회사 후배, 20대 신입
6. `npc_realtor` 공인중개사, 50대 여성

```
Sheet L6: a 3 columns x 2 rows grid of full-body character portraits, landscape 1536x1024, same style and same scale as Sheet A and Sheet L2.
Cell order left to right, top row first:
1. The bride-to-be from Sheet A cell 3, now in her mid 40s: same face, shoulder-length brown hair, a few smile lines, cream knit top, navy slacks, tote bag.
2. The groom-to-be from Sheet A cell 4, now in his mid 40s: same face, slightly receding short black hair with gray at the temples, light blue shirt, gray slacks, a small belly.
3. The mother from Sheet L2 cell 1, now in her 80s: same face, white short permed hair, slightly bent posture, cardigan, walking cane.
4. The father from Sheet L2 cell 2, now in his 80s: same face, thin white hair, cardigan, holding a walking frame, gentle smile.
5. New junior employee in his 20s: fresh short haircut, white shirt with a new ID badge, eager nervous smile, holding a notebook.
6. Real estate agent woman in her 50s: short permed hair, pink cardigan, reading glasses on a neck chain, holding a contract folder.
Magenta #FF00FF background in every cell.
```

## 받은 뒤 우리 쪽에서 할 일

`tools/art/slice.py`의 표에 아래를 더한다. 그다음 `python3 tools/art/slice.py`, `node tools/art/embed.mjs` 순서로 돌린다.

```python
# SHEETS에 더한다
'L2': dict(fit=('h', 64), pad=(36, 64), names=['npc_mom', 'npc_dad', 'npc_toddler', 'npc_teen', 'npc_doctor', 'npc_banker', 'npc_teamlead', 'npc_teacher']),
'L3': dict(fit=('box', 30), names=['fu_ricecook', 'fu_water', 'fu_monitor2', 'fu_wedphoto', 'fu_crib', 'fu_coffee', 'fu_medkit', 'fu_kiddesk', 'fu_kimchi',
                                   'fu_piano', 'fu_treadmill', 'fu_camping', 'fu_garden', 'fu_table6', 'fu_baduk', 'fu_recliner', 'fu_familyphoto']),
'L4': dict(fit=('box', 26), names=['it_carkey', 'it_powder', 'it_tablet', 'it_mortgage', 'it_famcard', 'it_fountain', 'it_pension',
                                   'it_hanbok', 'it_teamlead', 'it_hikejk', 'it_downvest', 'it_hikepants', 'it_tlpants', 'it_jogger',
                                   'it_reading', 'it_hikebeanie', 'it_polar', 'it_foldbike', 'it_hybrid', 'it_suv',
                                   'it_cat', 'pet_cat', 'it_penguin', 'it_slime']),
'L6': dict(fit=('h', 64), pad=(36, 64), names=['npc_partnerF40', 'npc_partnerM40', 'npc_mom80', 'npc_dad80', 'npc_junior', 'npc_realtor']),
# PANELS에 더한다
'L1': [dict(region=None, names=['bg_hospital', 'bg_school', 'bg_retire', 'bg_loan', 'bg_funeral', 'bg_park', 'bg_airport', 'bg_dol', 'bg_parents'], scale=1.0)],
'L5': [dict(region=None, names=['bg_playground', 'bg_realtor', 'bg_moving', 'bg_exec', 'bg_camp', 'bg_river'], scale=1.0)],
```

주의할 것:

- L2의 3번(세 살 아이)은 다른 칸보다 작다. `fit=('h', 64)`는 시트에서 가장 큰 인물에 맞추니 그대로 두면 키 차이가 살아난다.
- L4의 22번 `pet_cat`은 지도 위 펫 그림이다. `embed.mjs`의 `USE`에 `'pet_'`가 없으니 더해야 들어간다. `fit`은 시트 전체가 26이라 크기는 강아지(27×30)와 비슷하게 나온다. 하나 더 고칠 곳이 있다. ART 그림은 게임 안 크기의 4배 해상도(`hi:1`)인데 `petCv`는 원래 크기로 그려서 잘린다. `petCv`의 `ctx.drawImage(im,0,f?0:1);`를 `ctx.drawImage(im,0,f?0:1,c.w,c.h);`로 바꾼다(기존 강아지 `pet_dog`는 CAST라 영향 없음). 그다음 `items.js`의 블록 D(집고양이)를 붙인다.
- 새 인물을 이름으로 부르려면 `NPC_BY_NAME`에 더한다. 예: `'어머니':'mom','엄마':'mom','아버지':'dad','아빠':'dad','의사':'doctor','대출 상담사':'banker','팀장':'teamlead','담임 선생님':'teacher'`. 컷신 대본에서는 `"cast":[["mom","R"]]`처럼 `npc_` 뒤 이름을 쓴다.
- 장례식장 배경(L1-5)은 빈소 사진 자리를 비운 액자로 요청했다. 글자나 종교 표시가 들어왔으면 "Remove every letter and symbol, keep everything else the same"로 한 번 고친다.
- 칸 개수가 맞지 않으면 "Same image, but exactly N cells in a C x R grid"로 다시 요청한다(지난번과 같음).

## 이번에 뺀 것

- 주인공의 30~50대 모습. 주인공은 몸·머리·윗옷·바지·손 다섯 겹으로 나뉘어 있어서 통그림으로 받으면 장비 구조가 깨진다. 나이 든 주인공을 하려면 `chatgpt-hero-sheets.md`의 P1과 같은 방식(초록 티, 파랑 바지)으로 따로 한 장을 뽑아야 한다. 이야기 담당이 정하면 그때 요청서를 쓴다.
- 지도 방 안의 세간. 방 안에서는 16px 도트 그림을 쓴다. 새 세간 17개의 도트 그림은 `items.js`에 이미 넣었다.
