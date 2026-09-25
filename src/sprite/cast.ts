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

/* 누가 말을 거는지에 따라 얼굴을 고른다.
   제도를 오래 겪은 쪽은 노인, 또래 이야기는 아이 쪽으로 붙였다. */
const BY_NAME: Record<string, NpcId> = {
  '부동산 사장': 'gpa',
  '세탁소 사장': 'gpa',
  '주민센터 직원': 'gma',
  '공단 상담원': 'gma',
  '고용센터 상담원': 'gma',
  '은행 창구 직원': 'gma',
  '장학팀': 'gma',
  '인사팀': 'gpa',
  '동기': 'boy',
  '알바 선배': 'girl',
  '3년차 선배': 'girl',
  '자취 선배': 'girl',
  '선배': 'girl',
  '복습 노트': 'boy',
};

/** 이름이 표에 없으면 이름을 해시해 늘 같은 얼굴이 나오게 한다. */
export function npcFor(name: string): CastSprite {
  const hit = BY_NAME[name];
  if (hit) return NPC[hit];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const ids: NpcId[] = ['gpa', 'gma', 'boy', 'girl'];
  return NPC[ids[h % ids.length]];
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
