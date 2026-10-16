# 인연 트랙 인물 시트 · 챗GPT 요청 (리뷰 1014)

인연 트랙(`ops/review-1014/romance.md`)에서 만나는 일곱 사람의 그림이다. 역할마다 여자·남자 판이 하나씩이라 14명이다. 지금은 동네 사람 그림(peerf, deskf 등)으로 대신하고 있어서, 대학 동기와 결혼정보회사에서 만난 사람이 같은 얼굴로 보일 수 있다.

그림체는 **새 매끈한 2D 판**이다. 주인공 시트 `ops/art/H1.png`를 기준으로 한다(치비 비율, 깔끔한 외곽선, 평평한 셀 음영, 자르기용 자홍 배경). 예전 도트 시트(A~K, L1~L6)와 다르니 섞어 붙이지 않는다.

## 쓰는 법

1. 새 대화창을 연다.
2. 첫 메시지에 `ops/art/H1.png`를 첨부한다(그림체 기준).
3. 같은 메시지에 아래 "공통 스타일"과 시트 LV1 프롬프트를 붙인다.
4. LV2, LV3는 같은 창에서 "Next image, same style and the same characters, older." 다음에 프롬프트만 붙인다. 그림체가 흔들리면 공통 문단과 H1.png를 다시 붙인다.
5. 받은 그림은 원본 그대로 `ops/art/LV1.png`, `ops/art/LV2.png`, `ops/art/LV3.png`로 올린다. 칸 순서가 곧 이름표다(왼쪽 위에서 오른쪽, 줄이 끝나면 다음 줄).
6. 잘라서 CAST에 `npc_lvSeoF` 같은 열쇠로 넣으면 코드 고침 없이 바로 쓰인다(`loveArt`, `loveSpouseArt`가 열쇠가 있는지 보고 고른다). 나이 든 판은 열쇠 끝에 `45`, `60`을 붙인다.

## 우선순위

| 순서 | 시트 | 저장 이름 | 내용 | 칸 | 비율 | 왜 |
|---|---|---|---|---|---|---|
| 1 | LV1 | `ops/art/LV1.png` | 첫 만남 나이의 14명 + 갓난아기 + 결정사 매니저 | 4×4 | 세로 1024×1536 | 만남 장면 22개가 모두 이 얼굴을 쓴다 |
| 2 | LV2 | `ops/art/LV2.png` | 마흔다섯 판 12명(은재·은호 빼고) | 4×3 | 가로 1536×1024 | 결혼한 사람은 마흔 검진, 마흔셋 교육비, 마흔여덟 대출 장면에 나온다 |
| 3 | LV3 | `ops/art/LV3.png` | 예순 판 14명 | 4×4(마지막 두 칸 비움) | 세로 1024×1536 | 예순 생일, 서랍 장면 |

나이 든 판이 필요한 사람: 은재·은호를 뺀 12명은 서른 전후에 결혼할 수 있으니 마흔다섯과 예순 판이 둘 다 필요하다. 은재·은호는 마흔 무렵에 처음 만나므로 LV1이 이미 40대이고 예순 판만 필요하다. 아이(boy, girl)는 지금 그림을 그대로 쓴다.

## 공통 스타일

```
Art style for every image in this conversation (match the attached reference image H1.png exactly):
- Smooth, clean 2D digital illustration of cute chibi characters for a cozy Korean life-sim game set in today's Korea. Not pixel art.
- Clean dark outline of even weight around every character, flat cel shading with one soft shadow tone, light from the top-left, soft blush on the cheeks.
- Chibi proportions like the reference: big head about 1/3 of body height, simple dot-and-line facial features, small hands, standing straight, front view turned very slightly to the left, arms relaxed.
- Every character is a distinct Korean person with a clearly different face, hairstyle, silhouette and outfit. Show age with hair color, wrinkles at the eyes, posture and clothes while keeping the same chibi proportions.
- Lay characters out on an exact grid, one per cell, all at exactly the same scale, feet on the same baseline, centered in the cell, nothing crossing cell borders.
- Background of every cell is flat solid magenta #FF00FF with no gradient, no floor, no shadow, no white border.
- No text, no letters, no numbers, no logos, no watermark anywhere.
```

## 시트 LV1. 첫 만남 (1순위)

칸 순서와 게임 열쇠

| 칸 | 열쇠 | 누구 | 나이 | 생김새와 옷 |
|---|---|---|---|---|
| 1 | lvSeoF | 서윤 · 대학 사진 동아리 동기 | 20 | 어깨 길이 검은 생머리, 앞머리 없음, 차분한 눈매. 크림색 니트 카디건, 연청바지, 목에 작은 필름 카메라 |
| 2 | lvSeoM | 서준 · 같은 역 | 20 | 단정한 검은 짧은 머리, 얇은 안경. 회색 맨투맨, 베이지 면바지, 목에 필름 카메라 |
| 3 | lvHanF | 하은 · 카페 알바 선배 | 21 | 갈색 단발에 한쪽만 귀 뒤로, 활짝 웃는 얼굴. 흰 티 위 카페 앞치마(짙은 초록), 검은 바지 |
| 4 | lvHanM | 한결 · 같은 역 | 21 | 살짝 곱슬한 갈색 머리, 장난스러운 웃음. 흰 티 위 카페 앞치마(짙은 초록), 검은 바지, 손목에 고무줄 |
| 5 | lvJiF | 지민 · 입사 동기 | 24 | 높게 묶은 포니테일, 또렷한 눈썹, 자신감 있는 표정. 남색 블레이저, 흰 셔츠, 슬랙스, 목에 사원증 |
| 6 | lvJiM | 지훈 · 같은 역 | 24 | 옆으로 넘긴 짧은 머리, 자신감 있는 표정. 남색 정장, 흰 셔츠, 넥타이 없음, 목에 사원증 |
| 7 | lvSoF | 소연 · 대학병원 간호사 | 29 | 단정하게 묶은 낮은 머리, 다정한 눈. 연하늘 간호복 위 회색 가디건, 흰 운동화 |
| 8 | lvSoM | 승우 · 같은 역 | 29 | 짧게 친 검은 머리, 순한 인상. 연하늘 간호복 위 회색 가디건, 흰 운동화 |
| 9 | lvYoonF | 윤아 · IT 개발자 | 32 | 짧은 보브컷, 둥근 금속테 안경, 솔직한 표정. 회색 후드 집업, 검은 바지, 노트북 가방 |
| 10 | lvYoonM | 윤호 · 같은 역 | 32 | 덥수룩한 짧은 머리, 둥근 금속테 안경. 체크 셔츠 위 회색 후드 집업, 노트북 가방 |
| 11 | lvMinF | 민서 · 세무사 | 34 | 어깨 아래 단정한 웨이브, 작은 진주 귀걸이, 은근한 미소. 베이지 트렌치코트, 서류 파일 |
| 12 | lvMinM | 민재 · 같은 역 | 34 | 깔끔한 가르마 머리, 은테 안경, 은근한 미소. 차콜 정장, 하늘색 셔츠, 서류 파일 |
| 13 | lvEunF | 은재 · 물리치료사, 러닝 모임 | 41 | 하나로 묶은 머리에 흰머리 몇 가닥, 눈가 웃음 주름. 러닝 재킷(주황), 레깅스, 러닝화 |
| 14 | lvEunM | 은호 · 같은 역 | 41 | 짧은 머리 옆쪽에 흰머리, 눈가 웃음 주름. 러닝 재킷(주황), 러닝 반바지 위 타이츠, 러닝화 |
| 15 | lvBaby | 갓난아기 | 0 | 연노랑 속싸개에 싸여 잠든 아기, 칸 가운데 바닥 높이에 놓인 모습(다른 인물 키의 1/3) |
| 16 | lvMgr | 오 실장 · 결혼정보회사 매니저 | 45 | 단정한 단발, 큰 미소, 영업용 표정. 자주색 정장 재킷, 태블릿을 안음 |

```
Sheet LV1: a 4 x 4 grid of full-body chibi characters, portrait 1024x1536, one character per cell, same scale, feet on the same baseline, flat magenta #FF00FF background in every cell.
Cell order left to right, top row first:
1. Korean woman, 20, college photo-club member: shoulder-length straight black hair with no bangs, calm eyes, cream knit cardigan, light-blue jeans, a small film camera on a strap around her neck.
2. Korean man, 20, college photo-club member: neat short black hair, thin glasses, gray sweatshirt, beige cotton pants, a small film camera on a strap around his neck.
3. Korean woman, 21, cafe part-timer: brown bob with one side tucked behind the ear, big bright smile, white T-shirt under a dark green cafe apron, black pants.
4. Korean man, 21, cafe part-timer: slightly curly brown hair, playful grin, white T-shirt under a dark green cafe apron, black pants, a hair tie on his wrist.
5. Korean woman, 24, new office worker: high ponytail, sharp eyebrows, confident look, navy blazer over a white shirt, slacks, an employee ID card on a lanyard.
6. Korean man, 24, new office worker: short hair swept to the side, confident look, navy suit with a white shirt and no tie, an employee ID card on a lanyard.
7. Korean woman, 29, hospital nurse: hair in a neat low bun, kind eyes, light blue nurse scrubs with a gray cardigan, white sneakers.
8. Korean man, 29, hospital nurse: short cropped black hair, gentle face, light blue nurse scrubs with a gray cardigan, white sneakers.
9. Korean woman, 32, software developer: short bob, round metal-frame glasses, frank expression, gray zip-up hoodie, black pants, a laptop bag on her shoulder.
10. Korean man, 32, software developer: tousled short hair, round metal-frame glasses, plaid shirt under a gray zip-up hoodie, a laptop bag on his shoulder.
11. Korean woman, 34, tax accountant: neat wavy hair below the shoulders, small pearl earrings, subtle smile, beige trench coat, holding a document folder.
12. Korean man, 34, tax accountant: tidy side-parted hair, silver-rim glasses, subtle smile, charcoal suit with a light blue shirt, holding a document folder.
13. Korean woman, 41, physical therapist and runner: hair tied back with a few gray strands, smile lines at the eyes, orange running jacket, leggings, running shoes.
14. Korean man, 41, physical therapist and runner: short hair graying at the sides, smile lines at the eyes, orange running jacket, running shorts over tights, running shoes.
15. A newborn baby asleep, wrapped in a pale yellow swaddle blanket, lying at the bottom center of the cell, about one third the height of the other characters.
16. Korean woman, 45, matchmaking agency manager: neat bob, big sales smile, plum-colored suit jacket, holding a tablet against her chest.
Same style as H1.png. No text anywhere.
```

## 시트 LV2. 마흔다섯 (2순위)

LV1의 1~12번과 같은 사람을 마흔다섯으로 그린다. 열쇠는 LV1 열쇠 끝에 `45`(lvSeoF45 …). 칸 순서도 LV1과 같다.

```
Sheet LV2: a 4 x 3 grid, landscape 1536x1024. The same twelve characters as cells 1 to 12 of the previous sheet, in the same order, now about 45 years old.
Keep each person's face, hairstyle shape and color theme recognizable. Show age with a few gray hairs, light smile lines, slightly softer build and grown-up everyday clothes:
1. photo-club woman: same hair now with a few gray strands, cream knit cardigan over a blouse, slacks.
2. photo-club man: same glasses, short hair with gray at the temples, gray knit sweater, chinos.
3. cafe woman: same brown bob, now owner-barista apron over a striped shirt.
4. cafe man: same curly hair a little shorter, owner-barista apron over a denim shirt.
5. office woman: low ponytail, team-leader blazer, ID card.
6. office man: same side-swept hair with gray at the sides, suit without tie, ID card.
7. nurse woman: low bun with a few gray hairs, head-nurse scrubs with a navy cardigan.
8. nurse man: short hair with a few gray hairs, scrubs with a navy cardigan.
9. developer woman: same bob and glasses, comfortable knit and jeans.
10. developer man: same glasses, short neat hair, hoodie over a polo shirt.
11. tax accountant woman: shorter wavy hair, pearl earrings, camel coat.
12. tax accountant man: same silver glasses, graying side part, gray suit.
Same style as H1.png, magenta #FF00FF background in every cell, same scale, feet on the same baseline. No text anywhere.
```

## 시트 LV3. 예순 (3순위)

LV1의 1~14번을 예순으로. 열쇠는 끝에 `60`(lvSeoF60 …). 15·16번 칸은 비운다.

```
Sheet LV3: a 4 x 4 grid, portrait 1024x1536. Cells 1 to 14 are the same fourteen characters as cells 1 to 14 of the first sheet, in the same order, now about 60 years old. Cells 15 and 16 stay empty flat magenta.
Keep each face and color theme recognizable. Show age like the 60-year-old hero in H1.png: mostly gray or white hair, gentle wrinkles at the eyes, relaxed posture, comfortable clothes (cardigans, knit vests, walking shoes). The two runners still wear running jackets, now with gray hair.
Same style as H1.png, magenta #FF00FF background, same scale, feet on the same baseline. No text anywhere.
```

## 받은 뒤 할 일

- 칸을 잘라 CAST에 `npc_` + 열쇠로 넣는다(예: `npc_lvSeoF`, `npc_lvSeoF45`, `npc_lvSeoF60`).
- `lvBaby`는 첫아이·둘째 장면(`LOVE_EVENTS.birth1`, `birth2`) 첫 장면 cast에 `['lvBaby','C']`를 더한다. `lvMgr`는 `LOVE_PEOPLE.manager.key`를 `'lvMgr'`로 바꾼다.
- 검사: `node ops/review-1014/tools/romance-check.mjs`. 새 열쇠가 게임 파일에 있으면 인물 열쇠 검사도 통과한다.
