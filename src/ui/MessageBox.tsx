import React from 'react';
import { Pressable, View } from 'react-native';
import { P } from '@/theme/palette';
import { COLORS, U } from '@/theme/tokens';
import { T } from './Pixel';
import { AdvanceCaret, useTypewriter } from './Typewriter';

/* 화면 아래에 고정되는 대사 상자. 눌러서 넘긴다.
   다 찍히기 전에 누르면 전체가 즉시 뜨고, 다 찍힌 뒤 누르면 다음으로 간다. */

export function MessageBox({
  text,
  speaker,
  onAdvance,
  minHeight = 104,
}: {
  text: string;
  speaker?: string;
  onAdvance?: () => void;
  minHeight?: number;
}) {
  const { shown, done, skip } = useTypewriter(text);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={() => (done ? onAdvance?.() : skip())}
      style={{
        minHeight,
        margin: U[3],
        padding: U[3],
        backgroundColor: P.p0,
        borderWidth: 4,
        borderColor: COLORS.line,
        justifyContent: 'space-between',
      }}
    >
      <View>
        {speaker ? (
          <T size="uiBold" color={P.g3}>
            {speaker}
          </T>
        ) : null}
        <T size="body">{shown}</T>
      </View>
      <AdvanceCaret visible={done && !!onAdvance} />
    </Pressable>
  );
}

/** 기술 고르기처럼 생긴 선택지 상자 */
export function ChoiceBox({
  options,
  onPick,
  disabled,
  revealed,
  correct,
  picked,
}: {
  options: string[];
  onPick: (i: number) => void;
  disabled?: boolean;
  revealed?: boolean;
  correct?: number;
  picked?: number | null;
}) {
  return (
    <View
      style={{
        margin: U[3],
        marginTop: 0,
        padding: U[2],
        backgroundColor: P.p0,
        borderWidth: 4,
        borderColor: COLORS.line,
        gap: 2,
      }}
    >
      {options.map((label, i) => {
        const isRight = revealed && i === correct;
        const isWrong = revealed && i === picked && i !== correct;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            onPress={() => onPick(i)}
            style={({ pressed: down }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: U[2],
              minHeight: 44,
              paddingVertical: 6,
              paddingHorizontal: U[2],
              backgroundColor: isRight ? P.g1 : isWrong ? P.r1 : down ? P.p2 : 'transparent',
            })}
          >
            <T size="uiBold">{'\u25B6'}</T>
            <T size="body" style={{ flex: 1 }}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
