export type Slot = 'weapon' | 'top' | 'head' | 'bottom' | 'pet' | 'mount';

export interface Item {
  slot: Slot; name: string; desc: string; cost: number;
  atk?: number; def?: number;
  color?: string; accent?: string;
  /** 상의 실루엣 변형: 후드 · 롱패딩 · 사원증 · 금장 라펠 */
  ts?: 'hood' | 'puff' | 'badge' | 'sharp';
  /** 하의 실루엣 변형: 옆선 · 스키니 · 청바지 솔기 */
  bs?: 'stripe' | 'slim' | 'seam';
  /** 머리 장비 · 무기 스프라이트 종류 */
  gear?: string;
  /** 펫 · 탈것 스프라이트 종류 */
  kind?: string;
}

export const ITEMS: Record<string, Item> = {
  "pen": {
    "slot": "weapon",
    "name": "3색 볼펜",
    "atk": 4,
    "gear": "pen",
    "cost": 0,
    "desc": "입사 첫날 지급. 검정 파랑 빨강."
  },
  "mouse": {
    "slot": "weapon",
    "name": "무소음 마우스",
    "atk": 9,
    "gear": "mouse",
    "cost": 120,
    "desc": "옆자리에 민폐 안 끼치는 배려."
  },
  "tumbler": {
    "slot": "weapon",
    "name": "대용량 텀블러",
    "atk": 12,
    "gear": "tumbler",
    "cost": 180,
    "desc": "카페인은 곧 지구력."
  },
  "keyb": {
    "slot": "weapon",
    "name": "기계식 키보드",
    "atk": 16,
    "gear": "keyb",
    "cost": 260,
    "desc": "청축. 사무실 전체가 당신의 타건을 듣는다."
  },
  "board": {
    "slot": "weapon",
    "name": "결재판",
    "atk": 20,
    "gear": "board",
    "cost": 340,
    "desc": "들고만 있어도 바빠 보인다."
  },
  "laptop": {
    "slot": "weapon",
    "name": "노트북",
    "atk": 25,
    "gear": "laptop",
    "cost": 460,
    "desc": "어디서든 일할 수 있다는 축복이자 저주."
  },
  "card": {
    "slot": "weapon",
    "name": "법인카드",
    "atk": 32,
    "gear": "card",
    "cost": 700,
    "desc": "한도가 곧 권력."
  },
  "shirt": {
    "slot": "top",
    "name": "네이비 재킷",
    "def": 6,
    "color": "#2C3A5E",
    "cost": 0,
    "desc": "면접부터 결혼식까지 이 한 벌."
  },
  "suit": {
    "slot": "top",
    "name": "차콜 정장",
    "def": 10,
    "color": "#5C5866",
    "cost": 110,
    "desc": "한 벌로 3년을 버틴다."
  },
  "badge": {
    "slot": "top",
    "name": "사원증 목걸이",
    "def": 9,
    "color": "#EDE2CC",
    "accent": "#6EC8F0",
    "ts": "badge",
    "cost": 140,
    "desc": "소속이 곧 방패. 셔츠 차림에 사원증만."
  },
  "hoodie": {
    "slot": "top",
    "name": "후드집업",
    "def": 12,
    "atk": 2,
    "color": "#2F8C39",
    "accent": "#FFF8EC",
    "ts": "hood",
    "cost": 200,
    "desc": "재택의 제복. 목 뒤에 후드가 접혀 있다."
  },
  "suitg": {
    "slot": "top",
    "name": "필살기 정장",
    "def": 17,
    "atk": 3,
    "color": "#3B3550",
    "accent": "#FFC53C",
    "ts": "sharp",
    "cost": 380,
    "desc": "금장 라펠. 중요한 날에만 꺼낸다."
  },
  "padded": {
    "slot": "top",
    "name": "출근용 롱패딩",
    "def": 22,
    "color": "#45434D",
    "accent": "#C9C3D6",
    "ts": "puff",
    "cost": 520,
    "desc": "무릎까지 오는 12월의 갑옷."
  },
  "hnone": {
    "slot": "head",
    "name": "없음",
    "cost": 0,
    "desc": "맨머리."
  },
  "glass": {
    "slot": "head",
    "name": "블루라이트 안경",
    "def": 10,
    "gear": "glass",
    "cost": 150,
    "desc": "눈과 평판을 동시에 지킨다."
  },
  "band": {
    "slot": "head",
    "name": "회식용 넥타이 머리띠",
    "atk": 7,
    "def": 2,
    "gear": "band",
    "cost": 190,
    "desc": "분위기는 살리는데 다음 날 기억이 없다."
  },
  "beanie": {
    "slot": "head",
    "name": "비니",
    "def": 8,
    "atk": 3,
    "gear": "beanie",
    "cost": 230,
    "desc": "머리 감을 시간을 벌어준다."
  },
  "beige": {
    "slot": "bottom",
    "name": "베이지 슬랙스",
    "def": 8,
    "color": "#C9B79A",
    "cost": 0,
    "desc": "무채색 상의에 뭘 입어도 맞는다."
  },
  "jeans": {
    "slot": "bottom",
    "name": "청바지",
    "def": 10,
    "color": "#3F5F87",
    "bs": "seam",
    "cost": 110,
    "desc": "금요일의 자유. 앞선이 살아 있다."
  },
  "slack": {
    "slot": "bottom",
    "name": "검정 슬랙스",
    "def": 12,
    "color": "#3A3746",
    "cost": 120,
    "desc": "무난함이 곧 생존."
  },
  "train": {
    "slot": "bottom",
    "name": "기모 트레이닝복",
    "def": 16,
    "atk": 2,
    "color": "#25603A",
    "accent": "#FFFDF6",
    "bs": "stripe",
    "cost": 210,
    "desc": "옆선 두 줄. 재택의 승리."
  },
  "skinny": {
    "slot": "bottom",
    "name": "스키니진 빌런",
    "atk": 14,
    "def": -5,
    "color": "#26406B",
    "bs": "slim",
    "cost": 170,
    "desc": "통이 한 뼘 좁다. 공격은 오르고 방어는 깎인다."
  }
};

export const PETS: Record<string, Item> = {
  "pnone": { "slot": "pet", "name": "없음", "cost": 0, "desc": "혼자 다닙니다." },
  "bird": { "slot": "pet", "name": "출근 참새", "atk": 4, "def": 4, "kind": "bird", "cost": 300, "desc": "알람보다 먼저 깨운다." },
  "turtle": { "slot": "pet", "name": "스테이플러 거북", "def": 14, "kind": "turtle", "cost": 520, "desc": "느리지만 서류를 절대 놓치지 않는다." },
  "dog": { "slot": "pet", "name": "퇴근길 강아지", "atk": 6, "def": 8, "kind": "dog", "cost": 420, "desc": "집에 갈 이유가 하나 생긴다." }
};

export const MOUNTS: Record<string, Item> = {
  "mnone": {
    "slot": "mount",
    "name": "없음",
    "cost": 0,
    "desc": "두 발로 다닙니다."
  },
  "kick": {
    "slot": "mount",
    "name": "전동 킥보드",
    "atk": 6,
    "kind": "kick",
    "cost": 320,
    "desc": "헬멧은 쓰고 타세요."
  },
  "bike": {
    "slot": "mount",
    "name": "따릉이",
    "def": 8,
    "atk": 3,
    "kind": "bike",
    "cost": 420,
    "desc": "연간권이 제일 싸다."
  },
  "car": {
    "slot": "mount",
    "name": "중고 경차",
    "def": 16,
    "atk": 8,
    "kind": "car",
    "cost": 900,
    "desc": "유지비가 곧 월세다."
  }
};

export const SLOTS: [Slot, string][] = [
  [
    "weapon",
    "무기"
  ],
  [
    "top",
    "상의"
  ],
  [
    "head",
    "머리"
  ],
  [
    "bottom",
    "하의"
  ],
  [
    "pet",
    "펫"
  ],
  [
    "mount",
    "탈것"
  ]
];

export function poolFor(slot: Slot): Record<string, Item> {
  return slot === 'pet' ? PETS : slot === 'mount' ? MOUNTS : ITEMS;
}
export function allItems(id: string): Item | undefined {
  return ITEMS[id] ?? PETS[id] ?? MOUNTS[id];
}
