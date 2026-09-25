export interface Tier { name: string; def: number; need: number }

/* 주 스탯이 need를 넘으면 해금된다. 해금된 곳 중에서는 골라서 살 수 있다. */
export const TIERS: Tier[] = [
  {
    "name": "노숙",
    "def": 0,
    "need": 0
  },
  {
    "name": "움막",
    "def": 6,
    "need": 8
  },
  {
    "name": "텐트",
    "def": 12,
    "need": 16
  },
  {
    "name": "찜질방",
    "def": 18,
    "need": 24
  },
  {
    "name": "고시원",
    "def": 26,
    "need": 32
  },
  {
    "name": "반지하",
    "def": 34,
    "need": 42
  },
  {
    "name": "원룸 월세",
    "def": 44,
    "need": 52
  },
  {
    "name": "원룸 전세",
    "def": 58,
    "need": 64
  },
  {
    "name": "투룸 전세",
    "def": 74,
    "need": 78
  },
  {
    "name": "내 집",
    "def": 100,
    "need": 92
  }
];

export function tierFor(ju: number): number {
  let t = 0;
  for (let i = 0; i < TIERS.length; i++) if (ju >= TIERS[i].need) t = i;
  return t;
}
