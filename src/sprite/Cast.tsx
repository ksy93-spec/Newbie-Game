import React from 'react';
import { Canvas, FilterMode, Image, MipmapMode, useImage } from '@shopify/react-native-skia';
import { npcFor, petSprite, type CastSprite } from './cast';

/* 한 장짜리 그림을 정수 배율로만 키운다. 도트는 보간하는 순간 죽는다. */

const SAMPLING = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;

function Sheet({ sprite, scale }: { sprite: CastSprite; scale: number }) {
  const img = useImage(sprite.src);
  const w = sprite.w * scale;
  const h = sprite.h * scale;
  return (
    <Canvas style={{ width: w, height: h }}>
      <Image image={img} x={0} y={0} width={w} height={h} fit="fill" sampling={SAMPLING} />
    </Canvas>
  );
}

export function NpcSprite({ name, scale = 3 }: { name: string; scale?: number }) {
  return <Sheet sprite={npcFor(name)} scale={scale} />;
}

export function PetSprite({ kind, scale = 2 }: { kind?: string; scale?: number }) {
  const s = petSprite(kind);
  if (!s) return null;
  return <Sheet sprite={s} scale={scale} />;
}
