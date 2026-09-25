import { P } from './palette';

/* 프로토타입의 디자인 규격을 그대로 옮긴다.
   모서리 반경 0, 정수 배율만, 비트맵 서체는 설계 크기의 정수배로만 쓴다. */

export const U = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32 } as const;

export const FONT = {
  display: 'Galmuri14',
  body: 'Galmuri14',
  ui: 'Galmuri11',
  uiBold: 'Galmuri11-Bold',
  micro: 'Galmuri9',
} as const;

/** 비트맵 서체는 이 크기(와 정수배)에서만 또렷하다. */
export const SIZE = { display: 15, body: 15, ui: 12, micro: 10 } as const;
export const LINE = { display: 22, body: 22, ui: 18, micro: 14 } as const;

export const COLORS = {
  bg: P.p1,
  card: P.p2,
  surface: P.p0,
  ink: P.s4,
  inkSoft: P.s2,
  line: P.s4,
  sky: P.k1,
  grass: P.g1,
  accent: P.y1,
  good: P.g2,
  bad: P.r1,
} as const;

/** 도트 UI의 입체감. 그림자 대신 아래쪽 단차를 쓴다. */
export const STEP = { shadow: P.s4, offset: 4 } as const;

export const border = (color: string = COLORS.line, width = 3) => ({
  borderWidth: width,
  borderColor: color,
  borderRadius: 0,
});
