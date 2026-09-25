/* ══════════ 조연 ══════════
   플레이어 아바타는 레이어로 갈아입히지만, NPC와 펫은 한 장짜리 그림이다.
   갈아입힐 일이 없으니 쪼갤 이유도 없다. 크기는 원본 픽셀 그대로 적어 두고
   화면에서는 정수 배율로만 키운다. */

export interface CastSprite {
  src: number;
  w: number;
  h: number;
}

export type NpcId = 'gpa' | 'gma' | 'boy' | 'girl';

export const NPC: Record<NpcId, CastSprite> = {
  gpa: { src: require('../../assets/sprites/npc_gpa.png'), w: 30, h: 64 },
  gma: { src: require('../../assets/sprites/npc_gma.png'), w: 27, h: 64 },
  boy: { src: require('../../assets/sprites/npc_boy.png'), w: 33, h: 54 },
  girl: { src: require('../../assets/sprites/npc_girl.png'), w: 30, h: 54 },
};

/* 손그림이 있는 얼굴은 나이가 맞는 역에만 쓴다. 동네 가게 주인은 노인이 어울리지만
   알바 선배가 초등학생으로 나오면 게임이 무너진다. 아이 둘은 지금 맡길 역이 없어 쉰다. */
const BY_NAME: Record<string, NpcId> = {
  '부동산 사장': 'gpa',
  '세탁소 사장': 'gpa',
  '주민센터 직원': 'gma',
  '장학팀': 'gma',
};

/** 손그림 얼굴이 없는 이름은 해시해서 늘 같은 어른이 나오게 한다. 아이는 뽑히지 않는다. */
export function npcFor(name: string): CastSprite {
  const hit = BY_NAME[name];
  if (hit) return NPC[hit];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const ids: NpcId[] = ['gpa', 'gma'];
  return NPC[ids[h % ids.length]];
}

/* 또래와 직장인은 아직 손그림이 없다. 레이어 아바타를 다시 칠해 세운다. 보스와 같은 방식이다. */
export interface NpcLook {
  avatar: 'imgM' | 'imgF' | 'stuM' | 'stuF';
  haircol: number;
  top: string;
  bottom: string;
}
export const NPC_LOOK: Record<string, NpcLook> = {
  '동기': { avatar: 'stuM', haircol: 2, top: 'hoodie', bottom: 'jeans' },
  '알바 선배': { avatar: 'stuF', haircol: 3, top: 'shirt', bottom: 'jeans' },
  '3년차 선배': { avatar: 'imgF', haircol: 0, top: 'suitg', bottom: 'slack' },
  '자취 선배': { avatar: 'stuF', haircol: 1, top: 'hoodie', bottom: 'beige' },
  '선배': { avatar: 'imgM', haircol: 0, top: 'shirt', bottom: 'slack' },
  '인사팀': { avatar: 'imgM', haircol: 4, top: 'suitg', bottom: 'slack' },
  '공단 상담원': { avatar: 'imgF', haircol: 0, top: 'shirt', bottom: 'slack' },
  '고용센터 상담원': { avatar: 'imgM', haircol: 4, top: 'shirt', bottom: 'beige' },
  '은행 창구 직원': { avatar: 'imgF', haircol: 0, top: 'suitg', bottom: 'slack' },
};
/** 이 이름에 쓸 다시 칠한 아바타가 있으면 그것을, 없으면 null */
export function npcLook(name: string): NpcLook | null {
  return NPC_LOOK[name] ?? null;
}

export type PetKind = 'dog' | 'turtle' | 'bird';

export const PET_SPRITE: Record<PetKind, CastSprite> = {
  dog: { src: require('../../assets/sprites/pet_dog.png'), w: 27, h: 30 },
  turtle: { src: require('../../assets/sprites/pet_turtle.png'), w: 32, h: 20 },
  bird: { src: require('../../assets/sprites/pet_bird.png'), w: 29, h: 28 },
};

export function petSprite(kind?: string): CastSprite | null {
  if (!kind) return null;
  return PET_SPRITE[kind as PetKind] ?? null;
}
