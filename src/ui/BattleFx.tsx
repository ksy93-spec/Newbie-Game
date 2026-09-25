import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, View } from 'react-native';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { T } from './Pixel';

/* ══════════ 전투 연출 ══════════
   JRPG 전투에서 "붙었다"는 느낌은 세 가지가 만든다.
   가로 띠가 좌우에서 닫혔다 열리는 전환, 맞을 때 스프라이트가 깜빡이는 것,
   그리고 체력이 한 번에 줄지 않고 주르륵 흐르는 것. 셋 다 여기에 있다. */

const { width: SCREEN_W } = Dimensions.get('window');
const BANDS = 9;

/** 띠가 번갈아 닫히고 다시 열리는 전환 */
export function BattleWipe({ onCovered, onDone }: { onCovered?: () => void; onDone?: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(140),
      Animated.timing(v, { toValue: 2, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => onDone?.());
    const t = setTimeout(() => onCovered?.(), 430);
    return () => clearTimeout(t);
  }, [v, onCovered, onDone]);

  return (
    <View pointerEvents="none" style={{ ...StyleSheetAbsolute, flexDirection: 'column' }}>
      {Array.from({ length: BANDS }, (_, i) => {
        const fromLeft = i % 2 === 0;
        const x = v.interpolate({
          inputRange: [0, 1, 2],
          outputRange: fromLeft ? [-SCREEN_W, 0, SCREEN_W] : [SCREEN_W, 0, -SCREEN_W],
        });
        return (
          <Animated.View
            key={i}
            style={{ flex: 1, backgroundColor: COLORS.ink, transform: [{ translateX: x }] }}
          />
        );
      })}
    </View>
  );
}

const StyleSheetAbsolute = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  zIndex: 50,
};

/** 맞은 쪽이 몇 번 깜빡인다 */
export function useBlink(trigger: number) {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!trigger) return;
    Animated.sequence(
      Array.from({ length: 3 }).flatMap(() => [
        Animated.timing(o, { toValue: 0.15, duration: 70, easing: Easing.step0, useNativeDriver: true }),
        Animated.timing(o, { toValue: 1, duration: 70, easing: Easing.step0, useNativeDriver: true }),
      ]),
    ).start();
  }, [trigger, o]);
  return o;
}

/** 내가 맞으면 화면이 흔들린다 */
export function useShake(trigger: number) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!trigger) return;
    Animated.sequence(
      [6, -6, 4, -4, 2, 0].map((to) =>
        Animated.timing(x, { toValue: to, duration: 45, easing: Easing.linear, useNativeDriver: true }),
      ),
    ).start();
  }, [trigger, x]);
  return x;
}

/** 이름 · 체력 판. 체력은 한 번에 줄지 않고 흐른다. */
export function HpPlate({
  name,
  hp,
  max,
  align = 'left',
  sub,
}: {
  name: string;
  hp: number;
  max: number;
  align?: 'left' | 'right';
  sub?: string;
}) {
  const w = useRef(new Animated.Value(hp / max)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: Math.max(0, hp / max),
      duration: 520,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [hp, max, w]);

  const ratio = Math.max(0, hp / max);
  const color = ratio > 0.5 ? P.g1 : ratio > 0.2 ? P.y1 : P.r1;

  return (
    <View
      style={{
        backgroundColor: P.p1,
        borderWidth: 3,
        borderColor: COLORS.line,
        paddingHorizontal: U[2],
        paddingVertical: 6,
        minWidth: 150,
        gap: 3,
        alignSelf: align === 'left' ? 'flex-start' : 'flex-end',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: U[2] }}>
        <T size="uiBold" numberOfLines={1} style={{ flexShrink: 1 }}>
          {name}
        </T>
        <T size="micro" color={COLORS.inkSoft}>
          {Math.max(0, hp)} / {max}
        </T>
      </View>
      <View style={{ height: 10, borderWidth: 2, borderColor: COLORS.line, backgroundColor: P.p0 }}>
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: color,
            width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
      {sub ? (
        <T size="micro" color={COLORS.inkSoft}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

/* ══════════ 무대 ══════════
   하늘만 깔면 인물 위가 텅 빈다. 먼 건물과 바닥을 한 층씩 넣어
   "길가에서 말을 건다"는 장면으로 만든다. 전부 사각형이라 도트가 깨지지 않는다. */

export const GROUND = 44;
/** 인물을 바닥에 세울 때 쓰는 아래 여백 */
export const STAND = GROUND - 16;
/** 3배 스프라이트(64px)가 머리를 안 잘리고 서는 최소 높이 */
export const STAGE_H = 244;
/** 멀리 보이는 건물. 폭·높이는 고정 배열이라 매번 같은 스카이라인이 뜬다. */
const SKYLINE: [number, number][] = [
  [26, 34],
  [18, 52],
  [34, 26],
  [22, 44],
  [30, 60],
  [16, 30],
  [38, 40],
  [20, 54],
  [28, 24],
  [24, 46],
  [34, 32],
  [18, 58],
];

/** 구름 한 덩이. 계단식 사각형 셋이면 도트 구름이 된다. */
function Cloud({ w, top, left }: { w: number; top: string; left: string }) {
  return (
    <View style={{ position: 'absolute', top: top as never, left: left as never, alignItems: 'center' }}>
      <View style={{ width: Math.round(w * 0.42), height: 5, backgroundColor: P.p0 }} />
      <View style={{ width: Math.round(w * 0.76), height: 5, backgroundColor: P.p0 }} />
      <View style={{ width: w, height: 6, backgroundColor: P.p0 }} />
    </View>
  );
}

/** 배경만. 어떤 배치를 얹든 뒤에 깔린다. ground를 키우면 지평선이 올라간다. */
export function StageBack({ ground = GROUND }: { ground?: number }) {
  return (
    <View pointerEvents="none" style={{ ...StyleSheetAbsolute, zIndex: 0, justifyContent: 'flex-end', overflow: 'hidden' }}>
      <Cloud w={56} top="5%" left="7%" />
      <Cloud w={38} top="14%" left="63%" />
      <Cloud w={70} top="26%" left="28%" />
      <Cloud w={44} top="38%" left="76%" />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: -2 }}>
        {[...SKYLINE, ...SKYLINE].map(([w, h], i) => (
          <View
            key={i}
            style={{ width: w, height: h, backgroundColor: i % 2 ? P.k2 : P.k3, borderTopWidth: 2, borderTopColor: P.k1 }}
          />
        ))}
      </View>
      <View style={{ height: ground, backgroundColor: P.b1, borderTopWidth: 3, borderTopColor: P.b3 }}>
        {/* 지평선 쪽 인도, 그 아래로 아스팔트 이음매 */}
        <View style={{ height: 9, backgroundColor: P.b2 }} />
        <View style={{ height: 3, backgroundColor: P.b3, opacity: 0.5 }} />
        {ground > 80
          ? [0.46, 0.8].map((f, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: Math.round(ground * f),
                  height: 3 + i,
                  backgroundColor: P.b2,
                }}
              />
            ))
          : null}
      </View>
    </View>
  );
}

/* 무대가 길어지면 하늘만 늘어나 인물이 화면 밑에 처박힌다.
   지평선을 높이의 3분의 1쯤으로 잡아 인물이 길 한가운데 서게 한다. */
export function Stage({ children, minHeight = STAGE_H }: { children: React.ReactNode; minHeight?: number }) {
  const [h, setH] = useState(minHeight);
  const ground = Math.min(300, Math.max(GROUND, Math.round(h * 0.42)));
  return (
    <View
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
      style={{ flex: 1, minHeight, backgroundColor: COLORS.sky, justifyContent: 'flex-end', overflow: 'hidden' }}
    >
      <StageBack ground={ground} />
      <View pointerEvents="box-none" style={{ alignItems: 'center', marginBottom: Math.round(ground * 0.42) }}>
        {children}
      </View>
    </View>
  );
}

/** 발밑 그림자. 인물이 바닥에 붙어 보이게 하는 최소한의 장치. */
export function Shadow({ width = 46 }: { width?: number }) {
  return (
    <View style={{ alignItems: 'center', marginTop: -3 }}>
      <View style={{ width, height: 4, backgroundColor: 'rgba(43,38,60,0.18)' }} />
      <View style={{ width: Math.max(8, width - 14), height: 3, backgroundColor: 'rgba(43,38,60,0.12)' }} />
    </View>
  );
}

/** 전투원이 서 있는 발판. 도트라 둥근 모서리 대신 계단식 막대를 쌓는다. */
export function Platform({ width = 132, tone = P.g1 }: { width?: number; tone?: string }) {
  const rows = [width, width - 14, width - 30];
  return (
    <View style={{ alignItems: 'center', marginTop: -6 }}>
      {rows.map((w, i) => (
        <View
          key={i}
          style={{
            width: w,
            height: 5,
            backgroundColor: i === 0 ? P.g2 : tone,
            borderTopWidth: i === 0 ? 2 : 0,
            borderTopColor: COLORS.line,
          }}
        />
      ))}
    </View>
  );
}

/** 피해 숫자가 떠올랐다 사라진다 */
export function DamagePop({ value, trigger, tone }: { value: number; trigger: number; tone: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!trigger) return;
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [trigger, v]);
  const style = useMemo(
    () => ({
      opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }],
    }),
    [v],
  );
  if (!trigger) return null;
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, alignSelf: 'center' }, style]}>
      <T size="display" color={tone}>
        -{value}
      </T>
    </Animated.View>
  );
}
