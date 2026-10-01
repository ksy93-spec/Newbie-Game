# ChatGPT로 뽑을 에셋 시트 (2026-10-01)

무료 플랜은 하루에 뽑을 수 있는 이미지 수가 적어서, 한 장에 에셋 여러 개를 격자로 넣는다. 필수 9장, 여유 있을 때 3장이다. 하루 2~3장씩 나눠 뽑아도 된다.

## 쓰는 법

1. 새 대화창 하나를 열고 끝까지 그 창에서 뽑는다. 같은 창이어야 앞 이미지의 그림체를 이어 간다.
2. 첫 메시지에 `ops/art/style-ref.png`를 첨부하고, 아래 "공통 스타일" 문단과 시트 A 프롬프트를 같이 붙인다.
3. 다음 시트부터는 "공통 스타일" 문단 없이 시트 프롬프트만 붙여도 된다. 그림체가 흔들리면 공통 문단을 다시 붙이고 style-ref.png를 또 첨부한다.
4. 받은 이미지는 원본 그대로 `ops/art/raw/`에 시트 이름(`A.png`, `B.png` …)으로 넣는다. 자르기, 게임 크기로 줄이기, 팔레트 맞추기는 이쪽에서 한다.
5. 칸 순서가 이름표 역할을 한다. 왼쪽 위에서 오른쪽으로, 줄이 끝나면 다음 줄로 읽는다. ChatGPT가 순서를 바꾸면 결과를 보고 다시 맞출 테니, 칸 개수만 맞으면 된다.

`style-ref.png`에 들어 있는 것: 위 줄은 지금 게임의 주인공(남·여)과 대화창 인물(귀인 할배, 동네 할아버지, 알바 선배, 창구 직원, 전세 먹튀 집주인), 아래 줄은 지도용 작은 인물, 맨 아래는 게임 팔레트 18색이다. 배경 자홍색은 지울 색이다.

## 우선순위

| 순서 | 시트 | 내용 | 칸 | 비율 |
|---|---|---|---|---|
| 1 | A | 메인 인물 6 (귀인 할배, 결혼 상대 등) | 3×2 | 가로 1536×1024 |
| 2 | B | 조연 인물 8 | 4×2 | 가로 |
| 3 | C | 손에 드는 것(무기 칸) 16 | 4×4 | 정사각 |
| 4 | D | 윗옷 15 + 바지 10 | 5×5 | 정사각 |
| 5 | E | 머리 6 + 펫 3 + 탈것 6 | 4×4 (마지막 칸 비움) | 정사각 |
| 6 | F | 세간(가구·가전) 22 | 5×5 (마지막 세 칸 비움) | 정사각 |
| 7 | G | 거처 외관 15 | 4×4 (마지막 칸 비움) | 정사각 |
| 8 | H1 | 메인 퀘스트 컷신 배경 9 | 3×3 | 정사각 |
| 9 | H2 | 컷신 배경 6 | 3×2 | 가로 |
| 여유 | I | 화면 아이콘 16 | 4×4 | 정사각 |
| 여유 | J | 여행지 엽서 10 | 5×2 | 가로 |
| 여유 | K | 건물 외벽 질감 10 | 5×2 | 가로 |

주인공은 이번 목록에서 뺐다. 주인공 그림은 몸, 윗옷, 바지가 따로 겹쳐 있어서 장비를 바꾸면 옷만 갈아 끼운다. 통째로 그린 그림을 받으면 이 구조가 깨진다. 지도 바닥 타일도 뺐다. 이음새가 정확히 맞아야 하는데 이미지 생성으로는 맞추기 어렵다.

## 공통 스타일

모든 시트 프롬프트 앞에 붙인다(첫 장은 꼭, 이후에는 그림체가 흔들릴 때).

```
Art style for every image in this conversation (match the attached reference image):
- 16-bit style pixel art for a cozy Korean life-sim RPG set in today's Seoul.
- Crisp hard-edged pixels, no anti-aliasing, no blur, no painterly gradients, no photo texture.
- Limited palette of about 24 colors close to the reference swatches. Warm neutral skin tones.
- 1-pixel dark charcoal outline (#2C2C31) around every object and character.
- Simple cel shading, light from the top-left, one highlight and one shadow tone per material.
- People are cute chibi proportions (head about 1/3 of body height), standing, front view turned slightly to the left, feet on the same baseline.
- Objects are clean front-facing icons, slightly from above, centered, filling about 80% of the cell.
- Lay assets out on an exact grid. Every cell the same size, one asset per cell, centered, nothing crossing cell borders.
- Background of every sprite cell is flat solid magenta #FF00FF with no gradient, no floor, no shadow on the background.
- No text, no letters, no numbers, no labels, no logos, no watermark anywhere.
```

## 시트 A. 메인 인물 6

대화창과 컷신에 쓰는 전신. 칸 순서:

1. 귀인 할배: 70대, 흰 머리와 길게 내려온 흰 수염, 실눈으로 웃는 얼굴, 옥색 두루마기(개량 한복 겉옷)에 자주색 고름, 아이보리 한복 바지, 나무 지팡이. 주인공의 40년 뒤 모습이라 주인공(남)과 얼굴형이 닮았으면 좋다.
2. 동네 할아버지: 회색 가디건, 갈색 바지, 지팡이, 대머리에 옆머리만 흰색. 부동산 사장, 경비 아저씨 등 동네 어른 역을 두루 맡는다.
3. 결혼 상대(여): 20대 후반, 갈색 긴 머리, 아이보리 블라우스, 연보라 치마, 분홍 액세서리.
4. 결혼 상대(남): 20대 후반, 짧은 검은 머리, 푸른 셔츠, 짙은 회색 바지.
5. 아이(남): 초등학생, 노란 티셔츠, 반바지, 책가방.
6. 아이(여): 초등학생, 양갈래 머리, 분홍 원피스, 책가방.

```
Sheet A: a 3 columns x 2 rows grid of full-body character portraits, landscape 1536x1024.
Cell order left to right, top row first:
1. "Gwiin Halbae", a kind Korean grandfather in his 70s: white hair, long flowing white beard, smiling closed eyes, jade-green traditional Korean overcoat (durumagi) with a deep red-violet ribbon tie (goreum) on the chest, ivory hanbok trousers, dark rubber shoes, wooden walking cane in his right hand. Make his face resemble an aged version of the young man in the reference.
2. Neighborhood grandfather: bald top with white side hair, gray cardigan over a beige shirt, brown trousers, wooden cane.
3. Bride-to-be, late 20s woman: long brown hair, ivory blouse, lavender skirt, small pink hair accessory, gentle smile.
4. Groom-to-be, late 20s man: short black hair, blue button shirt, dark gray trousers, friendly smile.
5. Elementary school boy: yellow T-shirt, navy shorts, small backpack.
6. Elementary school girl: twin pigtails, pink dress, small backpack.
All six at the same scale and the same pixel density, full body, standing, feet on one baseline. Magenta #FF00FF background in every cell.
```

## 시트 B. 조연 인물 8

퀘스트 화면, 사건, 보스전에 쓰는 사람들. 칸 순서:

1. 동네 할머니(주민센터 직원, 장학팀 역): 짧은 회색 파마, 카디건, 친근한 얼굴.
2. 또래 남(동기, 선배 역): 20대, 후드티나 셔츠, 편한 차림.
3. 또래 여(알바 선배, 3년차 선배 역): 20대, 단발, 베이지 니트, 숄더백.
4. 창구 직원(은행, 공단 상담원 역): 30대 여성, 흰 셔츠에 남색 조끼, 서류철.
5. 인사팀 회사원(고용센터 상담원 역): 30대 남성, 셔츠에 넥타이, 사원증.
6. 보스, 전세 먹튀 집주인: 50대 남성, 검은 정장, 팔짱, 뻔뻔한 웃음.
7. 보스, 다단계 선배: 30대 여성, 화려한 정장, 손에 팸플릿, 과하게 밝은 미소.
8. 보스, 자칭 재무설계사: 40대 남성, 안경, 번쩍이는 넥타이, 태블릿을 든 채 엄지척.

```
Sheet B: a 4 columns x 2 rows grid of full-body character portraits, landscape 1536x1024, same style and scale as Sheet A.
Cell order left to right, top row first:
1. Friendly neighborhood grandmother in her 60s: short gray permed hair, knit cardigan, warm smile.
2. Young man in his 20s, a coworker: casual hoodie over a T-shirt, jeans, relaxed pose.
3. Young woman in her 20s, a part-time senior: bob haircut, beige knit sweater, navy skirt, shoulder bag, arms loosely crossed.
4. Bank teller woman in her 30s: neat ponytail, white shirt with a navy vest, holding a document folder.
5. HR office worker man in his 30s: white shirt, navy tie, ID badge on a lanyard, holding papers.
6. Villain landlord in his 50s: slicked-back hair, black suit, arms crossed, smug grin. Slightly larger presence than the others.
7. Villain multi-level-marketing woman in her 30s: flashy magenta suit, gold accessories, holding a pamphlet, overly bright smile.
8. Villain fake financial planner man in his 40s: glasses, shiny tie, holding a tablet, giving a thumbs up.
Magenta #FF00FF background in every cell.
```

## 시트 C. 손에 드는 것 16

가방·도감·상점에 보이는 아이콘. 칸 순서:

1. 3색 볼펜
2. 무소음 마우스(흰색)
3. 대용량 텀블러
4. 기계식 키보드
5. 결재판(검은 가죽 서류판)
6. 노트북
7. 법인카드(짙은 남색 카드)
8. 연말정산 영수증 파일(영수증이 삐져나온 클리어 파일)
9. OTP 카드
10. 보온 도시락통
11. 황금 볼펜(숨은 보상)
12. 고양이 머그(숨은 보상)
13. 황금 인감도장(숨은 보상)
14. 확정일자 받은 계약서(메인 2장 보상, 빨간 도장이 찍힌 종이)
15. 한도 낮춘 첫 카드(메인 3장 보상, 하늘색 카드에 작은 자물쇠 스티커)
16. 카드지갑

```
Sheet C: a 4 x 4 grid of item icons, square 1024x1024.
Cell order left to right, top row first:
1. three-color ballpoint pen (red, blue, black clicker tips)
2. white silent computer mouse
3. large stainless travel tumbler
4. compact mechanical keyboard with colored keycaps
5. black leather document approval folder, closed
6. silver laptop, half open
7. dark navy corporate credit card with gold chip
8. clear plastic file folder stuffed with paper receipts
9. small OTP security card with a tiny display
10. insulated lunch box with a carry handle
11. shiny golden ballpoint pen with sparkles (rare item)
12. white mug with a cute cat face (rare item)
13. golden Korean name seal stamp (dojang) with red ink pad (rare item)
14. lease contract paper with a round red official date stamp, slightly rolled corner
15. pale blue starter credit card with a small padlock sticker
16. slim brown leather card wallet
Magenta #FF00FF background in every cell. No text on any item.
```

## 시트 D. 윗옷 15, 바지 10

캐릭터 창 가방과 도감 아이콘. 옷은 접거나 펼쳐서 정면으로. 칸 순서:

1. 네이비 재킷
2. 차콜 정장 재킷
3. 사원증 목걸이
4. 회색 후드집업
5. 필살기 정장(검은 정장, 금색 배지)
6. 출근용 롱패딩(검정)
7. 노무사 정장(짙은 갈색, 서류 배지)
8. 바람막이(초록)
9. 니트 조끼(베이지)
10. 넌센스 왕 티셔츠(왕관 그림, 숨은 보상)
11. 정규직 사원증(파란 줄, 메인 1장 보상)
12. 상견례 정장(남색 쓰리피스, 메인 5장 보상)
13. 옥스퍼드 셔츠(하늘색)
14. 사무실 가디건(오트밀)
15. 집주인 정장(보라 줄무늬, 보스 정장)
16. 베이지 슬랙스
17. 청바지
18. 검정 슬랙스
19. 기모 트레이닝 바지(회색)
20. 스키니진(검정)
21. 카고 팬츠(카키)
22. 린넨 바지(오트밀)
23. 행운의 체크 바지(빨강·초록 체크, 숨은 보상)
24. 집들이 실내복 바지(연한 하늘색 줄무늬, 메인 6장 보상)
25. 와이드 슬랙스(차콜)

```
Sheet D: a 5 x 5 grid of clothing item icons, square 1024x1024. Each garment shown flat and front-facing like an inventory icon, no person wearing it.
Cell order left to right, top row first:
1. navy blazer jacket
2. charcoal suit jacket
3. employee ID badge on a lanyard
4. gray zip-up hoodie
5. sharp black suit jacket with a small gold pin
6. long black puffer coat
7. dark brown formal suit jacket with a small document pin
8. green windbreaker jacket
9. beige knit vest
10. white T-shirt with a cute pixel crown print (rare item)
11. blue lanyard with a glossy full-time employee ID card (special item)
12. navy three-piece suit with vest (special item)
13. light blue oxford button-down shirt
14. oatmeal office cardigan
15. purple pinstripe flashy suit jacket (villain outfit)
16. beige slacks
17. blue jeans
18. black slacks
19. gray fleece track pants
20. tight black skinny jeans
21. khaki cargo pants with side pockets
22. oatmeal linen trousers
23. red and green checked trousers (lucky rare item)
24. pale blue striped loungewear pants (special item)
25. charcoal wide-leg slacks
Magenta #FF00FF background in every cell. No text.
```

## 시트 E. 머리 6, 펫 3, 탈것 6

칸 순서:

1. 블루라이트 안경
2. 회식용 넥타이 머리띠(넥타이를 머리에 두른 모양)
3. 남색 비니
4. 주황 비니
5. 선글라스
6. 초보운전 선글라스(노란 테, 메인 4장 보상)
7. 출근 참새(펫)
8. 퇴근길 강아지(펫, 크림색 시바 느낌)
9. 스테이플러 거북(펫, 등딱지가 스테이플러 모양)
10. 전동 킥보드(옆모습)
11. 따릉이(서울 공공자전거, 흰색 몸체에 초록 포인트, 옆모습)
12. 중고 경차(빨간 작은 해치백, 옆모습)
13. 전기자전거(옆모습)
14. 중형 세단(짙은 회색, 옆모습)
15. 소형 전기차(흰색에 하늘색 포인트, 옆모습)
16. 비움

```
Sheet E: a 4 x 4 grid of icons, square 1024x1024.
Cell order left to right, top row first:
1. blue-light blocking glasses with thin frames
2. a necktie tied around the forehead like a party headband (Korean office dinner joke)
3. navy knit beanie
4. orange knit beanie
5. black sunglasses
6. yellow-framed sunglasses with a small green leaf sticker (beginner driver mark)
7. pet: plump little sparrow, sitting
8. pet: cream-colored puppy like a shiba inu, sitting, happy
9. pet: small turtle whose shell is shaped like an office stapler
10. electric kick scooter, side view
11. Seoul public rental bicycle, white frame with green accents and a front basket, side view
12. small red used hatchback car, side view, a little worn
13. electric bicycle with a battery on the frame, side view
14. dark gray mid-size sedan, side view
15. small white electric car with sky-blue accents, side view
16. leave this cell empty magenta
Vehicles share one consistent scale and all face right. Magenta #FF00FF background in every cell. No text, no license plate characters.
```

## 시트 F. 세간 22

방에 놓는 가구와 가전. 지도 방 안에서는 위에서 비스듬히 내려다본 모습으로 쓴다. 칸 순서:

1. 라면 5봉지 묶음
2. 접이식 매트(하늘색)
3. 선풍기
4. 접이식 책상(좌식, 나무)
5. 소형 냉장고
6. 접이식 침대
7. 드럼 세탁기
8. 바퀴 달린 TV 거치대
9. 옷 관리기(세로로 긴 캐비닛)
10. 2인용 소파(보라)
11. 스탠드 에어컨
12. 건조기
13. 로봇청소기
14. 식기세척기
15. 안마의자
16. 75인치 TV
17. 양문형 냉장고
18. 공기청정기
19. 퀸 침대(분홍 이불)
20. 2인 식탁
21. 거실 책장
22. 큰 화분
23~25. 비움

```
Sheet F: a 5 x 5 grid of furniture and home appliance sprites for a small Korean apartment, square 1024x1024. Three-quarter top-down view (seen from slightly above and in front), like furniture in a top-down pixel RPG room.
Cell order left to right, top row first:
1. bundle of five instant ramen packs
2. thin folding floor mattress, sky blue
3. standing electric fan
4. low wooden folding floor desk
5. small single-door mini fridge
6. folding single bed
7. front-loading washing machine
8. TV on a rolling stand
9. tall clothes-care steam cabinet (like an LG Styler, no logo)
10. two-seater sofa, purple
11. tall standing air conditioner
12. front-loading clothes dryer
13. round robot vacuum cleaner
14. compact dishwasher
15. massage chair
16. very large wall TV on a low cabinet
17. side-by-side double-door refrigerator
18. tall air purifier
19. queen bed with a pink blanket
20. small dining table for two with two chairs
21. living room bookshelf filled with books
22. large potted plant
23, 24, 25. leave empty magenta
Magenta #FF00FF background in every cell. No text, no brand logos.
```

## 시트 G. 거처 외관 15

캐릭터 창 거처 카드와 거처 도감. 정면에서 본 건물 한 채씩, 아래로 갈수록 좋아진다. 칸 순서:

1. 노숙(지하도 벽 앞 종이상자 잠자리)
2. 움막(판자와 비닐로 엮은 오두막)
3. 텐트
4. 찜질방(온천 표시가 있는 낮은 건물)
5. 고시원(좁은 창이 다닥다닥 붙은 좁은 건물)
6. 반지하(빌라 아래쪽, 길바닥 높이의 작은 창)
7. 원룸 월세(작은 붉은 벽돌 빌라)
8. 원룸 전세(조금 더 깔끔한 벽돌 빌라)
9. 투룸 전세(베란다가 있는 빌라)
10. 도시형생활주택(1층이 기둥만 있는 필로티 주차장)
11. 빌라 자가(새 빌라, 밝은 외벽)
12. 오피스텔 자가(유리 외벽의 높은 건물)
13. 59㎡ 구축 아파트(오래된 아파트 동)
14. 84㎡ 구축 아파트(더 큰 오래된 아파트 동)
15. 84㎡ 신축 아파트(현대적인 새 아파트 동, 조경)
16. 비움

```
Sheet G: a 4 x 4 grid of Korean housing exteriors, square 1024x1024. Front view of one building per cell, sitting on a small patch of ground, showing a clear step-by-step improvement in living conditions.
Cell order left to right, top row first:
1. cardboard box bed against an underpass wall at night
2. makeshift shack of plywood and plastic sheets
3. small camping tent
4. low Korean public bathhouse (jjimjilbang) building with a hot-spring steam symbol, no text
5. narrow budget dormitory building (gosiwon) with many tiny windows
6. semi-basement flat: the lower part of a brick villa with a small window at street level
7. small old red-brick villa building
8. slightly newer, cleaner brick villa building
9. brick villa with balconies, two-room size
10. small studio apartment building with an open pilotis parking ground floor
11. new bright villa building with clean walls
12. tall officetel tower with a glass facade
13. old 1990s apartment block, beige with faded paint
14. larger old apartment block
15. brand-new modern apartment block with landscaping
16. leave empty magenta
Same scale for 7 to 15 so buildings grow taller in order. Magenta #FF00FF background in every cell. No text or signs with letters.
```

## 시트 H1. 컷신 배경 9

메인 퀘스트 컷신 배경. 인물이 아래쪽 1/3에 서므로 화면 아래는 바닥이나 길로 비워 둔다. 칸 사이는 흰 선으로 나눈다. 칸 순서:

1. night: 밤의 달동네 언덕과 도시 불빛, 별
2. phone: 어두운 방, 휴대폰 화면 빛
3. office: 사무실 책상 줄
4. meeting: 회의실, 화이트보드
5. bank: 은행 창구, 번호표 기계
6. carlot: 중고차 매매단지, 깃발
7. road: 해 질 녘 고속도로
8. cafe: 카페 안
9. station: 기차역 대합실

```
Sheet H1: a 3 x 3 grid of background scenes, square 1024x1024, each cell separated by a thin white gutter. These are cutscene backdrops, so leave the bottom third of each scene as plain floor or ground where characters will stand, and keep the scene empty of people.
Cell order left to right, top row first:
1. hillside neighborhood of small houses at night with city lights below and stars above
2. dark small bedroom lit only by a glowing phone screen on a desk
3. open-plan Korean office with rows of desks and monitors, daytime
4. small meeting room with a whiteboard and a long table
5. bank branch interior with teller counters and a queue number ticket machine
6. used car lot with colorful bunting flags and parked cars, daytime
7. highway at sunset with mountains, view from the roadside
8. cozy cafe interior with a counter and wooden tables
9. train station concourse with a departure board (no readable text) and benches
Pixel art, same style as before. No text anywhere.
```

## 시트 H2. 컷신 배경 6

칸 순서:

1. weddinghall: 결혼식장 버진로드
2. modelhouse: 아파트 모델하우스
3. apartment: 낮의 아파트 단지
4. livingroom: 아늑한 거실
5. town: 편의점이 있는 동네 골목
6. 프롤로그용 고향 마을: 밤, 산 아래 작은 집 몇 채와 시골 버스 정류장

```
Sheet H2: a 3 columns x 2 rows grid of background scenes, landscape 1536x1024, thin white gutters between cells, same rules as Sheet H1 (bottom third is empty floor or ground, no people, no text).
Cell order left to right, top row first:
1. wedding hall aisle with flowers and soft lights
2. apartment sales model house showroom with a scale model of the complex
3. apartment complex exterior on a sunny day with trees
4. cozy small living room with a sofa, rug and window light
5. narrow Korean neighborhood street with a convenience store and a small real estate office
6. quiet countryside village at night under mountains, a few small houses and a rural bus stop
```

## 시트 I. 화면 아이콘 16 (여유 있을 때)

아래 탭, 재화, 능력치 칸에 쓰는 작은 아이콘. 칸 순서: 홈(집), 백과(책), 캐릭터(사람), 상점(가방), 코인, 하트(목숨), 별, 자물쇠, 주거(집 열쇠), 직장(서류가방), 금융(동전 더미), 식생활(밥그릇), 의생활(셔츠), 학업(연필), 느낌표 말풍선, 지도 핀.

```
Sheet I: a 4 x 4 grid of small UI icons, square 1024x1024, bold and readable at 24 pixels, thick outlines, two-tone shading.
Order: house, open book, person silhouette, shopping bag, gold coin, red heart, yellow star, padlock, house key, briefcase, stack of coins, rice bowl with chopsticks, folded shirt, pencil, speech bubble with an exclamation mark, map pin.
Magenta #FF00FF background in every cell. No text.
```

## 시트 J. 여행지 엽서 10 (여유 있을 때)

전국 지도와 여행지 입구에 띄울 작은 그림. 칸 순서: 강릉 안목해변 커피거리, 강릉 오죽헌, 전주 한옥마을 지붕, 전주 남부시장 야시장, 부산 해운대, 부산 감천문화마을, 부산 자갈치시장, 경주 대릉원과 첨성대, 대구 서문시장 야시장, 대구 김광석 다시그리기길 벽화 골목.

```
Sheet J: a 5 columns x 2 rows grid of small postcard scenes of Korean travel spots, landscape 1536x1024, thin white gutters, no people in front, no text.
Order: Gangneung Anmok beach with seaside cafes; Ojukheon traditional house with black bamboo; Jeonju hanok village rooftops; Jeonju night market stalls; Busan Haeundae beach with high-rise skyline; Busan Gamcheon colorful hillside village; Busan Jagalchi fish market by the harbor; Gyeongju royal tomb mounds and Cheomseongdae observatory; Daegu Seomun night market stalls; Daegu mural alley with a painted wall and a guitar statue.
```

## 시트 K. 건물 외벽 질감 10 (여유 있을 때)

지도 건물 벽에 깔 무늬. 이음새 없이 반복되는 정사각 견본. 칸 순서: 갈색 벽돌, 붉은 벽돌, 유리 커튼월, 노출 콘크리트, 한옥 흙벽과 나무 기둥, 가게 앞 유리문과 차양, 나무 판자, 아파트 외벽(창 격자), 흰 타일, 화강석.

```
Sheet K: a 5 columns x 2 rows grid of seamless repeating wall texture swatches for building facades, landscape 1536x1024, each cell a flat front-facing square tile that repeats without seams, thin white gutters.
Order: brown brick, red brick, glass curtain wall, raw concrete, Korean hanok clay wall with wooden posts, shop front glass door with an awning, wooden planks, apartment facade with a window grid, white ceramic tiles, granite stone.
```

## 뽑은 뒤 확인할 것

- 칸 개수가 맞는지. 모자라면 "Same image, but exactly N cells in a C x R grid"로 다시 요청한다.
- 글자가 들어갔으면 "Remove every letter and number, keep everything else the same"로 한 번 고친다.
- 인물 시트(A, B)는 머리 크기와 키가 칸마다 같은지. 다르면 "Make all characters the same height as cell 1"로 고친다.
- 배경이 자홍색 단색이 아니어도 괜찮다. 지우는 건 이쪽에서 한다. 다만 그림자가 배경에 번지면 지우기 어려우니 "no cast shadows"를 더한다.

## 반영 (2026-10-01)

받은 시트 9장(A~G, `H1 AND H2`, `I J K`)을 잘라 게임에 넣었다.

- 자르기: `python3 tools/art/slice.py` (pillow, numpy, scipy 필요). 자홍 배경을 지우고 칸을 찾아 자른다. 결과는 `assets/art/*.webp`와 `index.json`. 시트를 다시 뽑으면 같은 이름으로 덮어쓰고 다시 돌리면 된다. 칸 수가 다르면 스크립트가 알려 준다.
- 넣기: `node tools/art/embed.mjs`. 게임 HTML의 ART_DATA_BEGIN/END 사이에 붙인다.
- 화질: 색을 깎거나 도트 크기로 줄이지 않는다. 게임 안 크기(인물 36×64, 장비 26칸, 세간 30칸, 거처 높이 88, 탭 아이콘 20칸)는 예전 도트 그림과 같고, 그림은 그 4배 해상도로 저장해 화면에서 부드럽게 줄여 그린다. 배경·엽서·외벽은 원본 해상도 그대로.
- 상표처럼 보이는 곳(법인카드의 두 원, 노트북 덮개의 과일, 동네 배경 편의점 띠)은 `slice.py`의 `patch()`에서 덮는다.

쓰는 곳:

| 시트 | 게임에서 |
|---|---|
| A, B 인물 | 대화창, 퀘스트·사건·보스 화면, 메인 퀘스트 컷신, 프롤로그·엔딩의 주인공 옆 할배 |
| C, D, E 장비·펫·탈것 | 캐릭터 창 가방과 장비 칸, 상세 시트, 수집 노트 |
| F 세간 | 상점 세간 줄, 창고 썸네일 (방 안 지도에는 아직 도트 그림) |
| G 거처 | 캐릭터 창 거처 칸과 상세, 캐릭터 카드, 결과 화면의 새 거처, 이사 배너 |
| H 배경 | 메인 퀘스트 컷신 배경(천천히 좌우로 훑음), 프롤로그 고향 마을 |
| I 아이콘 | 아래 탭 네 개 |
| J 엽서, K 외벽 | 잘라만 두었다(`assets/art/pc_*`, `tx_*`). 쓰는 곳이 생기면 `embed.mjs`의 USE에 더한다 |

지도 위를 걷는 작은 인물, 방 안 세간, 건물 외벽은 지도 칸(16px)에 맞춘 도트 그림 그대로다. 이것까지 바꾸려면 위에서 내려다본 작은 도트 시트를 따로 뽑아야 한다.
