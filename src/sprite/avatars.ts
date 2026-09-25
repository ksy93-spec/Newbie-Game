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
  hairBase: RGB;
  topBase: RGB;
  botBase: RGB;
  layers: Record<LayerName, number>;
}

export type AvatarId = 'imgM' | 'imgF';

export const AVATARS: Record<AvatarId, AvatarDef> = {
  imgM: {
    name: '정장 · 남',
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
};

/** 캔버스 한 칸 = 64×64. 스프라이트를 가로 가운데에 놓는다. */
export const FRAME = 64;

export function offsetX(id: AvatarId): number {
  return Math.round((FRAME - AVATARS[id].w) / 2);
}
