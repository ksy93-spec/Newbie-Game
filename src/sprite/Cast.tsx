import React from 'react';
import { Canvas, FilterMode, Image, MipmapMode, useImage } from '@shopify/react-native-skia';
import { npcFor, petSprite, type CastSprite } from './cast';

/* 한 장짜리 그림을 정수 배율로만 키운다. 도트는 보간하는 순간 죽는다. */

const SAMPLING = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;

function Sheet({ sprite, scale, flip }: { sprite: CastSprite; scale: number; flip?: boolean }) {
  const img = useImage(sprite.src);
  const w = sprite.w * scale;
  const h = sprite.h * scale;
  return (
    <Canvas style={{ width: w, height: h, transform: flip ? [{ scaleX: -1 }] : undefined }}>
      <Image image={img} x={0} y={0} width={w} height={h} fit="fill" sampling={SAMPLING} />
    </Canvas>
  );
}

export function NpcSprite({ name, scale = 3, flip }: { name: string; scale?: number; flip?: boolean }) {
  return <Sheet sprite={npcFor(name)} scale={scale} flip={flip} />;
}

/* 펫 손그림은 셋 다 왼쪽을 본다. 아바타가 오른쪽을 보는 그림이면 같이 돌려세워야
   서로 등지고 서 있지 않는다. */
export const PET_FACES_RIGHT = false;

export function PetSprite({ kind, scale = 2, flip }: { kind?: string; scale?: number; flip?: boolean }) {
  const s = petSprite(kind);
  if (!s) return null;
  return <Sheet sprite={s} scale={scale} flip={flip} />;
}
