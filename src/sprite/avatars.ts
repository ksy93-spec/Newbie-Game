/* ══════════ 레이어 아바타 ══════════
   손으로 그린 원본을 몸 · 하의 · 상의 · 손 · 머리카락 다섯 장으로 쪼갰다.
   각 장이 자기 옷감만 담고 있으므로 색을 바꾸면 반드시 눈에 보인다.
   숫자는 스프라이트 픽셀 좌표(원본 크기 기준)다. */

export type LayerName = 'body' | 'bot' | 'top' | 'hand' | 'hair';

export const LAYER_ORDER: LayerName[] = ['body', 'bot', 'top', 'hand', 'hair'];

export type RGB = [number, number, number];

export interface AvatarDef {
  name: string;
  /** 스프라이트 폭·높이 */
  w: number;
  h: number;
  /** 허리선. 이 아래가 걷기에서 움직이는 구간 */
  hip: number;
  /** 두 다리를 가르는 x. 다리 사이 골과 같은 자리다 */
  split: number;
  /** 눈 높이, 얼굴 중심 x. 3/4 측면이라 머리 중앙이 아니다 */
  eye: number;
  fcx: number;
  /** 무기를 쥐는 손 */
  hx: number;
  hy: number;
  /** 원본이 오른쪽을 보고 그려졌는지. 뒤집는 방향이 반대가 된다 */
  faceRight?: boolean;
  /** 목록에서 감출지. 그림체가 달라 물러난 아바타 */
  hide?: boolean;
  hairBase: RGB;
  topBase: RGB;
  botBase: RGB;
  layers: Record<LayerName, number>;
}

export type AvatarId = 'imgM' | 'imgF' | 'stuM' | 'stuF';

export const AVATARS: Record<AvatarId, AvatarDef> = {
  imgM: {
    name: '정장 · 남',
    hide: true,
    w: 36, h: 64,
    hip: 49, split: 17,
    eye: 21, fcx: 14,
    hx: 28, hy: 46,
    hairBase: [84, 68, 65],
    topBase: [53, 57, 76],
    botBase: [201, 172, 153],
    layers: {
      body: require('../../assets/sprites/imgM_body.png'),
      bot: require('../../assets/sprites/imgM_bot.png'),
      top: require('../../assets/sprites/imgM_top.png'),
      hand: require('../../assets/sprites/imgM_hand.png'),
      hair: require('../../assets/sprites/imgM_hair.png'),
    },
  },
  imgF: {
    name: '정장 · 여',
    hide: true,
    w: 37, h: 64,
    hip: 49, split: 17,
    eye: 21, fcx: 14,
    hx: 28, hy: 45,
    hairBase: [77, 61, 60],
    topBase: [49, 51, 67],
    botBase: [235, 203, 184],
    layers: {
      body: require('../../assets/sprites/imgF_body.png'),
      bot: require('../../assets/sprites/imgF_bot.png'),
      top: require('../../assets/sprites/imgF_top.png'),
      hand: require('../../assets/sprites/imgF_hand.png'),
      hair: require('../../assets/sprites/imgF_hair.png'),
    },
  },
  /* 대학생 기본. 가방을 멘 그림이라 소품 레이어가 따로 없고, 가방은 body에 들어 있어
     상의를 갈아입어도 색이 변하지 않는다. 옷이 아니니 변하면 안 된다. */
  stuM: {
    name: '남',
    faceRight: true,
    w: 30, h: 64,
    hip: 47, split: 15,
    eye: 19, fcx: 17,
    hx: 25, hy: 44,
    hairBase: [45, 52, 73],
    topBase: [51, 64, 96],
    botBase: [192, 158, 145],
    layers: {
      body: require('../../assets/sprites/stuM_body.png'),
      bot: require('../../assets/sprites/stuM_bot.png'),
      top: require('../../assets/sprites/stuM_top.png'),
      hand: require('../../assets/sprites/stuM_hand.png'),
      hair: require('../../assets/sprites/stuM_hair.png'),
    },
  },
  stuF: {
    name: '여',
    faceRight: true,
    w: 34, h: 64,
    hip: 48, split: 19,
    eye: 20, fcx: 21,
    hx: 28, hy: 45,
    hairBase: [41, 48, 68],
    topBase: [51, 63, 93],
    botBase: [212, 194, 184],
    layers: {
      body: require('../../assets/sprites/stuF_body.png'),
      bot: require('../../assets/sprites/stuF_bot.png'),
      top: require('../../assets/sprites/stuF_top.png'),
      hand: require('../../assets/sprites/stuF_hand.png'),
      hair: require('../../assets/sprites/stuF_hair.png'),
    },
  },
};

/** 캔버스 한 칸 = 64×64. 스프라이트를 가로 가운데에 놓는다. */
export const FRAME = 64;

export function offsetX(id: AvatarId): number {
  return Math.round((FRAME - AVATARS[id].w) / 2);
}

/** 고를 수 있는 아바타. 그림체가 달라 물러난 것은 빼고 준다. */
export function avatarList(): AvatarId[] {
  return (Object.keys(AVATARS) as AvatarId[]).filter((id) => !AVATARS[id].hide);
}

/** 옛 저장에 남은 아바타를 지금 쓰는 것으로 옮긴다 */
export function migrateAvatar(id: string): AvatarId {
  if (id === 'imgM') return 'stuM';
  if (id === 'imgF') return 'stuF';
  return (AVATARS as Record<string, AvatarDef>)[id] ? (id as AvatarId) : 'stuM';
}
