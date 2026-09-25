export type ObKey = 'status' | 'age' | 'living' | 'prep' | 'years' | 'company' | 'region';

export interface ObDef {
  q: string;
  hint: string;
  /** [값, 라벨, 부연] */
  o: [string | number, string, string][];
}

/* 온보딩은 세 문항까지만 받는다. 나이·회사는 첫 퀘스트를 끝낸 뒤 홈에서 채우게 미룬다.
   재미를 먼저 보여주고 질문은 나중에 하는 편이 이탈이 적다. */
export const OB: Record<ObKey, ObDef> = {
  "status": {
    "q": "지금 어떤 상황인가요?",
    "hint": "신분에 따라 급한 정보가 완전히 다릅니다.",
    "o": [
      [
        "대학생",
        "재학 중",
        "학자금·알바·자취"
      ],
      [
        "취준생",
        "취업 준비 중",
        "건강보험·연금·면접비"
      ],
      [
        "직장인",
        "일하는 중",
        "계약·급여·전월세"
      ]
    ]
  },
  "age": {
    "q": "나이가 어떻게 되세요?",
    "hint": "청년 정책 대부분이 만 19~34세를 기준으로 갈립니다.",
    "o": [
      [
        24,
        "만 24세 이하",
        "청년 정책 전부 해당"
      ],
      [
        29,
        "만 25~29세",
        "청약·주거 지원 핵심"
      ],
      [
        34,
        "만 30~34세",
        "청년 요건 마지막"
      ],
      [
        40,
        "만 35세 이상",
        "일반 요건"
      ]
    ]
  },
  "living": {
    "q": "어디서 지내세요?",
    "hint": "주거 형태에 따라 챙길 것이 다릅니다.",
    "o": [
      [
        "기숙사",
        "기숙사",
        "비용은 적고 제약은 많다"
      ],
      [
        "자취",
        "자취",
        "계약과 공과금이 생긴다"
      ],
      [
        "본가",
        "본가에서 통학",
        "이동 시간이 비용이다"
      ]
    ]
  },
  "prep": {
    "q": "준비한 지 얼마나 됐어요?",
    "hint": "기간에 따라 챙겨야 할 제도가 다릅니다.",
    "o": [
      [
        0,
        "6개월 미만",
        "건강보험·연금부터"
      ],
      [
        1,
        "6개월~1년",
        "장기전 준비"
      ],
      [
        2,
        "1년 이상",
        "지원 제도 총점검"
      ]
    ]
  },
  "years": {
    "q": "지금 몇 년차인가요?",
    "hint": "연차에 따라 급한 것이 달라집니다.",
    "o": [
      [
        0,
        "1년 미만",
        "계약·통장·집"
      ],
      [
        2,
        "1~3년차",
        "전세·목돈"
      ],
      [
        5,
        "4년차 이상",
        "청약·투자"
      ]
    ]
  },
  "company": {
    "q": "회사는 어떤 곳인가요?",
    "hint": "사내 제도와 챙겨야 할 것이 다릅니다.",
    "o": [
      [
        "제조·대기업",
        "제조 · 대기업",
        "기숙사·사내대출"
      ],
      [
        "중소기업",
        "중소기업",
        "청년 지원금"
      ],
      [
        "스타트업",
        "스타트업",
        "4대보험·스톡옵션"
      ],
      [
        "공공·금융",
        "공공 · 금융",
        "장기 재직 설계"
      ]
    ]
  },
  "region": {
    "q": "어느 권역에 사세요?",
    "hint": "전월세 시세와 지원 제도가 권역마다 다릅니다.",
    "o": [
      [
        "수도권",
        "수도권",
        "서울·경기·인천"
      ],
      [
        "광역시",
        "광역시",
        "부산·대구·대전 등"
      ],
      [
        "그 외",
        "그 외 지역",
        "시·군 지역"
      ]
    ]
  }
} as Record<ObKey, ObDef>;

export function obSteps(status: string | null): ObKey[] {
  if (status === '대학생') return ['status', 'living', 'region'];
  if (status === '취준생') return ['status', 'prep', 'region'];
  if (status === '직장인') return ['status', 'years', 'region'];
  return ['status'];
}

/** 온보딩에서 미룬 것 중 다음에 물어볼 하나 */
export function deferredKey(s: { age: number | null; status: string | null; company: string | null }): ObKey | null {
  if (s.age == null) return 'age';
  if (s.status === '직장인' && s.company == null) return 'company';
  return null;
}
