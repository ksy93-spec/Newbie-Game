export type ThemeKey = 'ju' | 'sik' | 'ui' | 'geum' | 'jik';

export interface ThemeDef { k: string; full: string; color: string; role: string; desc: string }

/* 의식주에 금(돈)과 직(일)을 더한 다섯. 어려운 제도 이름 대신 이 다섯으로 묶는다. */
export const THEMES: Record<ThemeKey, ThemeDef> = {
  "ju": {
    "k": "주",
    "full": "집",
    "color": "#6EC8F0",
    "role": "방어력",
    "desc": "월세·전세 계약, 전세사기, 기숙사와 자취. 찬바람과 더위를 막아주는 갑옷."
  },
  "sik": {
    "k": "식",
    "full": "밥",
    "color": "#62C85C",
    "role": "체력",
    "desc": "식비, 배달, 자취 살림. 버티는 힘을 만드는 자원."
  },
  "ui": {
    "k": "의",
    "full": "옷",
    "color": "#A87BE0",
    "role": "매력",
    "desc": "면접 복장, 옷값, 관리. 회당 비용으로 따지는 습관."
  },
  "geum": {
    "k": "금",
    "full": "돈",
    "color": "#FFC53C",
    "role": "자금",
    "desc": "학자금, 앱테크, 청약통장, 신용점수, 첫 투자."
  },
  "jik": {
    "k": "직",
    "full": "일",
    "color": "#F4705A",
    "role": "경험",
    "desc": "주휴수당, 연차, 4대보험, 근로계약, 실업급여."
  }
};

export const THEME_ORDER: ThemeKey[] = [
  "ju",
  "sik",
  "ui",
  "geum",
  "jik"
];
