/* ══════════ 조연 ══════════
   플레이어 아바타는 레이어로 갈아입히지만, NPC와 펫은 한 장짜리 그림이다.
   갈아입힐 일이 없으니 쪼갤 이유도 없다. 크기는 원본 픽셀 그대로 적어 두고
   화면에서는 정수 배율로만 키운다. */

export interface CastSprite {
  src: number;
  w: number;
  h: number;
}

export type NpcId = 'gpa' | 'gma' | 'boy' | 'girl' | 'peerm' | 'peerf' | 'deskf' | 'officem' | 'boss';

export const NPC: Record<NpcId, CastSprite> = {
  gpa: { src: require('../../assets/sprites/npc_gpa.png'), w: 30, h: 64 },
  gma: { src: require('../../assets/sprites/npc_gma.png'), w: 27, h: 64 },
  boy: { src: require('../../assets/sprites/npc_boy.png'), w: 33, h: 54 },
  girl: { src: require('../../assets/sprites/npc_girl.png'), w: 30, h: 54 },
  peerm: { src: require('../../assets/sprites/npc_peerm.png'), w: 24, h: 64 },
  peerf: { src: require('../../assets/sprites/npc_peerf.png'), w: 24, h: 64 },
  deskf: { src: require('../../assets/sprites/npc_deskf.png'), w: 29, h: 64 },
  officem: { src: require('../../assets/sprites/npc_officem.png'), w: 24, h: 64 },
  boss: { src: require('../../assets/sprites/npc_boss.png'), w: 22, h: 64 },
};

/* 이제 역마다 얼굴이 있다. 노인 둘은 동네 가게와 창구, 나머지는 또래와 직장인.
   아이 둘(boy·girl)은 아직 맡길 역이 없어 쉰다. */
const BY_NAME: Record<string, NpcId> = {
  '부동산 사장': 'gpa',
  '세탁소 사장': 'gpa',
  '주민센터 직원': 'gma',
  '장학팀': 'gma',
  '동기': 'peerm',
  '선배': 'peerm',
  '자취 선배': 'peerm',
  '복습 노트': 'peerm',
  '알바 선배': 'peerf',
  '3년차 선배': 'peerf',
  '은행 창구 직원': 'deskf',
  '공단 상담원': 'deskf',
  '인사팀': 'officem',
  '고용센터 상담원': 'officem',
  '집주인': 'boss',
  '전세 먹튀 집주인': 'boss',
};

/** 표에 없는 이름은 해시해서 늘 같은 어른이 나오게 한다 */
export function npcFor(name: string): CastSprite {
  const hit = BY_NAME[name];
  if (hit) return NPC[hit];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const ids: NpcId[] = ['peerm', 'peerf', 'deskf', 'officem', 'gpa', 'gma'];
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
