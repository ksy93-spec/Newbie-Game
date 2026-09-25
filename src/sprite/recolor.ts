import { Skia, type SkImage } from '@shopify/react-native-skia';
import type { RGB } from './avatars';

/* ══════════ 색 교체 ══════════
   레이어 한 장이 한 가지 옷감이므로, 밝기비만 유지하면 원본의 명암이 그대로 살아난다.
   검은 외곽선(밝기 26 미만)은 건드리지 않아야 도트가 뭉개지지 않는다.

   Skia의 ColorMatrix로는 "어두운 픽셀만 빼고" 같은 조건을 걸 수 없어서
   픽셀을 직접 읽어 새 이미지를 만든다. 결과는 캐시한다. */

const LUM = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

export function hexRgb(hex: string): RGB {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const cache = new Map<string, SkImage>();

export function clearRecolorCache(): void {
  cache.forEach((img) => img.dispose?.());
  cache.clear();
}

/**
 * 한 레이어를 targetHex 색으로 갈아 끼운다.
 * @param key   캐시 키(아바타 id + 레이어 이름 + 색)
 * @param src   원본 레이어 이미지
 * @param base  원본 옷감의 기준색. 이 밝기를 1로 두고 비율을 유지한다
 * @param hex   바꿀 색. null이면 원본 그대로
 */
export function recolor(key: string, src: SkImage, base: RGB, hex: string | null): SkImage {
  if (!hex) return src;
  const hit = cache.get(key);
  if (hit) return hit;

  const w = src.width();
  const h = src.height();
  const bytes = src.readPixels();
  if (!bytes) return src;

  const px = new Uint8Array(bytes.buffer ?? (bytes as unknown as ArrayBuffer));
  const baseLum = Math.max(20, LUM(base[0], base[1], base[2]));
  const [tr, tg, tb] = hexRgb(hex);

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const l = LUM(px[i], px[i + 1], px[i + 2]);
    if (l < 26) continue; // 외곽선은 그대로 둔다
    const ratio = Math.max(0.42, Math.min(1.85, l / baseLum));
    px[i] = Math.min(255, Math.round(tr * ratio));
    px[i + 1] = Math.min(255, Math.round(tg * ratio));
    px[i + 2] = Math.min(255, Math.round(tb * ratio));
  }

  const data = Skia.Data.fromBytes(px);
  const info = { width: w, height: h, colorType: src.getImageInfo().colorType, alphaType: src.getImageInfo().alphaType };
  const out = Skia.Image.MakeImage(info, data, w * 4);
  if (!out) return src;
  cache.set(key, out);
  return out;
}
