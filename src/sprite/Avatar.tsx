import React, { useMemo } from 'react';
import { Canvas, FilterMode, Image, MipmapMode, Group, useImage } from '@shopify/react-native-skia';
import { ITEMS, allItems } from '@/data/items';
import { HAIRC } from '@/data/hair';
import type { GameState } from '@/core/state';
import { AVATARS, FRAME, offsetX, type AvatarId, type LayerName } from './avatars';
import { recolor } from './recolor';

/* ══════════ 아바타 그리기 ══════════
   Skia로 레이어를 순서대로 쌓는다. 확대는 FilterMode.Nearest로만 해야 도트가 살아 있다.
   걷기는 허리 아래를 좌우로 나눠 1px씩 엇갈리게 들어 올리고 몸 전체를 들썩인다.
   두 다리가 붙어 있는 원본이라 split(다리 사이 골)에서 정확히 갈라야 이음매가 안 보인다. */

export type Pose = 'idle' | 'walk' | 'ride' | 'cheer';

const BOB: Record<Pose, number[]> = {
  idle: [0, -1, 0, -1],
  walk: [0, -1, 0, -1],
  ride: [0, 0, 0, 0],
  cheer: [-1, -2, -1, 0],
};
const LEG_L = [0, 0, -1, 0];
const LEG_R = [-1, 0, 0, 0];

export interface AvatarProps {
  state: GameState;
  pose?: Pose;
  frame?: number;
  /** 정수 배율만. 1.5배 같은 건 도트를 무너뜨린다. */
  scale?: number;
  flip?: boolean;
}

function useLayer(id: AvatarId, name: LayerName) {
  return useImage(AVATARS[id].layers[name]);
}

export function Avatar({ state, pose = 'idle', frame = 0, scale = 3, flip = false }: AvatarProps) {
  const id = state.avatar;
  const av = AVATARS[id];

  const body = useLayer(id, 'body');
  const bot = useLayer(id, 'bot');
  const top = useLayer(id, 'top');
  const hand = useLayer(id, 'hand');
  const hair = useLayer(id, 'hair');

  const topItem = ITEMS[state.equip.top];
  const botItem = ITEMS[state.equip.bottom];
  const hairHex = state.haircol >= 0 ? HAIRC[state.haircol].b : null;
  const topHex = topItem?.color ?? null;
  const botHex = botItem?.color ?? null;

  const tinted = useMemo(() => {
    if (!body || !bot || !top || !hair || !hand) return null;
    return {
      body,
      hand,
      bot: recolor(`${id}|bot|${botHex}`, bot, av.botBase, botHex),
      top: recolor(`${id}|top|${topHex}`, top, av.topBase, topHex),
      hair: recolor(`${id}|hair|${hairHex}`, hair, av.hairBase, hairHex),
    };
  }, [body, bot, top, hand, hair, id, topHex, botHex, hairHex, av]);

  const f = ((frame % 4) + 4) % 4;
  const bob = BOB[pose][f];
  const walking = pose === 'walk';
  const lL = walking ? LEG_L[f] : 0;
  const lR = walking ? LEG_R[f] : 0;

  const ox = offsetX(id);
  const size = FRAME * scale;
  const hip = av.hip;
  const legH = av.h - hip;
  const sp = av.split;

  if (!tinted) return <Canvas style={{ width: size, height: size }} />;

  const sampling = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;

  // 상체 한 덩어리 + 다리 두 쪽. 아래에서 레이어를 같은 방식으로 세 번 그린다.
  const parts = (img: Parameters<typeof Image>[0]['image']) => (
    <>
      {/* 상체 */}
      <Group
        clip={{ x: ox * scale, y: 0, width: av.w * scale, height: hip * scale }}
        key="torso"
      >
        <Image
          image={img}
          x={ox * scale}
          y={bob * scale}
          width={av.w * scale}
          height={av.h * scale}
          fit="fill"
          sampling={sampling}
        />
      </Group>
      {/* 왼다리 */}
      <Group clip={{ x: ox * scale, y: hip * scale, width: sp * scale, height: legH * scale }} key="legL">
        <Image
          image={img}
          x={ox * scale}
          y={(bob + lL) * scale}
          width={av.w * scale}
          height={av.h * scale}
          fit="fill"
          sampling={sampling}
        />
      </Group>
      {/* 오른다리 */}
      <Group
        clip={{ x: (ox + sp) * scale, y: hip * scale, width: (av.w - sp) * scale, height: legH * scale }}
        key="legR"
      >
        <Image
          image={img}
          x={ox * scale}
          y={(bob + lR) * scale}
          width={av.w * scale}
          height={av.h * scale}
          fit="fill"
          sampling={sampling}
        />
      </Group>
    </>
  );

  const content = (
    <>
      {parts(tinted.body)}
      {parts(tinted.bot)}
      {parts(tinted.top)}
      {parts(tinted.hand)}
      {parts(tinted.hair)}
    </>
  );

  /* 그림마다 보는 쪽이 다르다. 오른쪽을 보고 그려진 아바타는 반대로 뒤집어야 앞으로 걷는다.
     이걸 놓쳐서 대학생 캐릭터가 뒷걸음질쳤다. */
  const mirrored = av.faceRight ? !flip : flip;

  return (
    <Canvas style={{ width: size, height: size }}>
      {mirrored ? (
        <Group transform={[{ translateX: size }, { scaleX: -1 }]}>{content}</Group>
      ) : (
        content
      )}
    </Canvas>
  );
}

/** 머리만 보여 주는 작은 초상 (HUD·아바타 고르기에서 쓴다) */
export function AvatarHead({ state, scale = 2 }: { state: GameState; scale?: number }) {
  const id = state.avatar;
  const av = AVATARS[id];
  const body = useLayer(id, 'body');
  const hair = useLayer(id, 'hair');
  const hairHex = state.haircol >= 0 ? HAIRC[state.haircol].b : null;
  const tintedHair = useMemo(
    () => (hair ? recolor(`${id}|hair|${hairHex}`, hair, av.hairBase, hairHex) : null),
    [hair, id, hairHex, av],
  );
  const w = 34 * scale;
  const h = 34 * scale;
  const sampling = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;
  return (
    <Canvas style={{ width: w, height: h }}>
      <Image
        image={body}
        x={-2 * scale}
        y={-1 * scale}
        width={av.w * scale}
        height={av.h * scale}
        fit="fill"
        sampling={sampling}
      />
      <Image
        image={tintedHair}
        x={-2 * scale}
        y={-1 * scale}
        width={av.w * scale}
        height={av.h * scale}
        fit="fill"
        sampling={sampling}
      />
    </Canvas>
  );
}

export function equippedGearName(state: GameState): string {
  return allItems(state.equip.top)?.name ?? '';
}
