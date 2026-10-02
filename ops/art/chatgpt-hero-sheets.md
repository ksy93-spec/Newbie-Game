# 주인공 캐릭터 시트 (ChatGPT, 2026-10-02)

지금 주인공은 남·여 두 가지뿐이다. 이름과 성격이 있는 주인공 여덟 명을 만들어 처음 시작할 때 고르게 한다. 장비를 입히는 구조는 그대로 쓴다.

## 장비가 입혀지는 방식

게임은 주인공을 한 장의 그림으로 쓰지 않는다. 그림을 다섯 겹으로 나눠 쓴다.

- 몸: 얼굴, 피부, 신발
- 머리카락
- 윗옷
- 바지
- 손

장비를 바꾸면 윗옷과 바지 겹의 색과 모양만 바뀐다. 모자, 안경, 손에 든 물건은 그 위에 따로 그린다.

그래서 이번 시트에서는 모든 캐릭터에게 같은 "기본 옷"을 입힌다.

- 윗옷: 선명한 초록 티셔츠
- 바지: 선명한 파랑 바지

이 두 색을 기준으로 윗옷과 바지 겹을 자동으로 잘라 낸다. 화면에는 초록·파랑이 그대로 나오지 않고, 입은 장비의 색으로 바뀌어 나온다. 캐릭터마다 다른 개성은 얼굴, 머리 모양, 몸에 붙은 소품(안경, 귀걸이, 주근깨 등)으로 낸다.

## 여덟 명

신분(대학생, 취준생, 직장인)은 따로 고르므로 캐릭터 소개에는 성격과 습관만 적는다. 시작할 때 능력치 하나에 +5를 준다.

| 번호 | 이름 | 나이 | 한 줄 소개 | 생김새 | 시작 보너스 |
|---|---|---|---|---|---|
| 1 | 김도윤 | 24 | 가계부 앱만 세 개 쓰는 알뜰파 | 짧은 검정 머리, 동그란 뿔테 안경, 마른 체형 | 금 +5 |
| 2 | 이하은 | 23 | 동네 맛집 지도가 머릿속에 있는 먹짱 | 갈색 단발에 앞머리, 볼이 발그레, 작은 키 | 식 +5 |
| 3 | 박준혁 | 27 | 면접 스무 번에도 웃는 체대 출신 | 짧은 투블럭, 굵은 눈썹, 어깨 넓은 체형 | 직 +5 |
| 4 | 최서윤 | 26 | 자격증 수집이 취미인 계획형 | 검은 긴 생머리를 높게 묶은 포니테일, 또렷한 눈매 | 의 +5 |
| 5 | 정우진 | 28 | 계약서는 끝까지 읽는 신중파 | 갈색 웨이브 머리를 넘긴 스타일, 은테 안경 | 주 +5 |
| 6 | 한지민 | 25 | 방 꾸미기에 진심인 디자이너 지망생 | 애쉬 그레이 숏컷, 한쪽 귀에 작은 귀걸이 | 의 +5 |
| 7 | 오태양 | 22 | 부산에서 막 올라온 넉살 좋은 막내 | 짧은 곱슬머리, 주근깨, 활짝 웃는 얼굴 | 식 +5 |
| 8 | 윤나래 | 29 | 3년차, 이직 준비하며 적금 붓는 현실파 | 어깨 아래 긴 웨이브, 단정한 얼굴, 작은 진주 귀걸이 | 금 +5 |

지도 위 작은 인물(위에서 내려다본 도트)은 이 표의 머리 모양과 색으로 따로 맞춰 그린다.

## 뽑는 순서

새 대화창 하나에서 순서대로 뽑는다. 무료 플랜이면 하루 한두 장씩 나눠도 된다.

1. 첫 메시지에 `ops/art/A.png`(지난번에 뽑은 인물 시트)를 그림체 기준으로 첨부한다. 그다음 아래 "공통 스타일" 문단과 시트 P1 프롬프트를 붙인다.
2. 시트 P2는 같은 창에서 "Next image, same style and same eight characters." 다음에 프롬프트만 붙인다.
3. 받은 그림은 `ops/art/P1.png`, `ops/art/P2.png`로 올린다. 올렸다고 알려 주면 겹을 나누고 게임에 넣는다.

## 공통 스타일

```
Art style for every image in this conversation (match the attached reference image):
- Clean, high-resolution pixel-art style chibi characters for a cozy Korean life-sim RPG set in today's Seoul.
- Crisp edges, 1-pixel dark charcoal outline (#2C2C31) around every character, simple cel shading with light from the top-left.
- Cute chibi proportions: head about 1/3 of body height.
- Every character is a distinct young Korean adult (22 to 29 years old) with a clearly different face, hairstyle and silhouette.
- Lay characters out on an exact grid, one per cell, all at exactly the same scale, feet on the same baseline.
- Background of every cell is flat solid magenta #FF00FF with no gradient, no floor, no shadow.
- No text, no letters, no numbers, no logos anywhere.
```

## 시트 P1. 게임용 몸 그림 8명 (가장 중요)

장비 겹을 잘라 낼 그림이다. 자세와 옷을 꼭 지켜야 한다.

- 정면을 보고 똑바로 서 있다.
- 팔은 몸통에서 살짝 떨어뜨려 아래로 내린다. 손이 옷에 가려지지 않게 한다.
- 두 다리는 살짝 벌린다. 걷는 동작을 만들 때 다리를 나눠 쓰기 때문이다.
- 모두 같은 옷을 입는다. 선명한 초록 반팔 티셔츠, 선명한 파랑 긴바지, 어두운 회색 운동화.
- 가방, 들고 있는 물건, 모자, 겉옷은 없다. 안경과 귀걸이는 캐릭터 특징이니 그대로 둔다.

```
Sheet P1: a 4 columns x 2 rows grid of full-body game sprites, landscape 1536x1024.
IMPORTANT for every character:
- Exact same pose: standing straight, facing the viewer, arms hanging down slightly away from the torso so both hands are fully visible, legs slightly apart.
- Exact same outfit: a plain bright green short-sleeve T-shirt (#38C95A, simple shading, no print), plain bright blue long trousers (#3B6FE8, simple shading), dark gray sneakers.
- No bag, no hat, no jacket, nothing held in the hands. Glasses and earrings listed below are part of the character, keep them.
- Same height for all eight, feet on one baseline.
Cell order left to right, top row first:
1. Doyun, man, 24: short neat black hair, round dark-framed glasses, slim build, calm smile.
2. Haeun, woman, 23: brown bob with bangs, rosy cheeks, petite, bright cheerful smile.
3. Junhyuk, man, 27: short two-block haircut, thick eyebrows, broad shoulders, sporty, confident grin.
4. Seoyun, woman, 26: long straight black hair tied in a high ponytail, sharp determined eyes, small smile.
5. Woojin, man, 28: wavy brown hair swept back, thin silver-rimmed glasses, gentle careful expression.
6. Jimin, woman, 25: ash-gray short pixie cut, one small silver earring, cool relaxed expression.
7. Taeyang, man, 22: short curly black hair, freckles, big open laugh, energetic.
8. Narae, woman, 29: long wavy dark-brown hair past the shoulders, small pearl earrings, neat calm face.
Magenta #FF00FF background in every cell.
```

## 시트 P2. 캐릭터 고르기 화면용 8명

같은 여덟 명을 각자 어울리는 평상복으로 그린 가슴 위 초상이다. 시작 화면에서 캐릭터를 고를 때와 캐릭터 소개 카드에 쓴다. 이 그림의 옷은 게임 안 장비와 상관없다.

```
Sheet P2: a 4 columns x 2 rows grid of bust portraits (head and shoulders), landscape 1536x1024, the same eight characters in the same order as Sheet P1, each facing slightly toward the viewer with a personality pose.
Each wears their own signature everyday outfit:
1. Doyun: gray knit sweater over a collared shirt, holding a phone showing a budget chart (no readable text).
2. Haeun: cream hoodie, holding a skewer of tteokbokki, happy.
3. Junhyuk: navy track jacket, thumbs up.
4. Seoyun: white blouse and beige cardigan, holding a small planner.
5. Woojin: light blue shirt with sleeves rolled up, holding a pen.
6. Jimin: oversized black T-shirt with a small paint stain, holding a tiny color swatch.
7. Taeyang: red zip-up windbreaker, waving.
8. Narae: navy blazer over a striped top, holding a coffee cup.
Magenta #FF00FF background in every cell. No text.
```

## 뽑은 뒤 확인할 것

- P1에서 옷 색이 초록·파랑에서 벗어나면 이렇게 다시 요청한다: "Same image, but every T-shirt must be the same bright green #38C95A and every pair of trousers the same bright blue #3B6FE8."
- 손이 몸에 붙어 있거나 옷 속으로 들어가 있으면 이렇게 다시 요청한다: "Same image, but arms slightly away from the body with both hands fully visible."
- 키가 서로 다르면 이렇게 다시 요청한다: "Make all eight characters the same height as cell 1."
- 글자가 들어갔으면 이렇게 고쳐 달라고 한다: "Remove every letter and number, keep everything else the same."
