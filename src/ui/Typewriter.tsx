import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { COLORS } from '@/theme/tokens';
import { T } from './Pixel';

/* ══════════ 한 글자씩 찍는 대사 ══════════
   JRPG 전투의 리듬은 글자가 찍히는 속도에서 나온다. 다 찍히기 전에 한 번 더 누르면
   전체가 즉시 뜨고, 다 찍힌 뒤 누르면 다음 줄로 넘어간다. */

export const CHAR_MS = 26;

export function useTypewriter(text: string, enabled = true) {
  const [shown, setShown] = useState(enabled ? '' : text);
  const done = shown.length >= text.length;

  useEffect(() => {
    if (!enabled) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, CHAR_MS);
    return () => clearInterval(id);
  }, [text, enabled]);

  return { shown, done, skip: () => setShown(text) };
}

/** 다음 줄이 있다는 깜빡이는 삼각형 */
export function AdvanceCaret({ visible }: { visible: boolean }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 380, easing: Easing.step0, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 380, easing: Easing.step0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, blink]);
  if (!visible) return null;
  return (
    <Animated.View style={{ opacity: blink, alignSelf: 'flex-end' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderTopWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: COLORS.ink,
        }}
      />
    </Animated.View>
  );
}

export function TypedLine({ text, enabled = true }: { text: string; enabled?: boolean }) {
  const { shown } = useTypewriter(text, enabled);
  return <T size="body">{shown}</T>;
}
