import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { P } from '@/theme/palette';
import { COLORS, FONT, LINE, SIZE, U, border } from '@/theme/tokens';
import { cue, type Cue } from './feedback';

export function T({
  children,
  size = 'body',
  color,
  style,
  numberOfLines,
  onPress,
}: {
  children: React.ReactNode;
  size?: 'display' | 'body' | 'ui' | 'micro' | 'uiBold';
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onPress?: () => void;
}) {
  const key = size === 'uiBold' ? 'ui' : size;
  return (
    <Text
      onPress={onPress}
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: size === 'uiBold' ? FONT.uiBold : FONT[key],
          fontSize: SIZE[key],
          lineHeight: LINE[key],
          color: color ?? COLORS.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <T size="ui" color={COLORS.inkSoft} style={{ marginBottom: U[2] }}>
      {children}
    </T>
  );
}

export function Card({
  children,
  style,
  tone = 'card',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'card' | 'surface';
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tone === 'card' ? COLORS.card : COLORS.surface },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PixelButton({
  label,
  onPress,
  tone = 'primary',
  disabled,
  sound = 'tap',
  style,
  children,
}: {
  label?: string;
  onPress?: () => void;
  tone?: 'primary' | 'plain' | 'danger';
  disabled?: boolean;
  sound?: Cue | null;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const bg = tone === 'primary' ? P.g1 : tone === 'danger' ? P.r1 : COLORS.card;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (sound) cue(sound);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: disabled ? P.s0 : bg },
        pressed && !disabled ? { transform: [{ translateY: 2 }] } : null,
        style,
      ]}
    >
      {children ?? (
        <T size="uiBold" color={disabled ? P.s2 : COLORS.ink}>
          {label}
        </T>
      )}
    </Pressable>
  );
}

export function Chip({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <View style={[styles.chip, tone ? { backgroundColor: tone } : null]}>
      <T size="ui">{children}</T>
    </View>
  );
}

export function Bar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View style={styles.barOuter}>
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

/** 연속 일수 칸. 7칸이 차면 보너스 3배. */
export function StreakPips({ streak }: { streak: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: 7 }, (_, i) => {
        const n = i + 1;
        const on = n <= Math.min(streak, 7);
        const cur = n === Math.min(streak, 7);
        return (
          <View
            key={n}
            style={{
              width: 12,
              height: 12,
              backgroundColor: cur ? P.y1 : on ? P.g2 : COLORS.surface,
              borderWidth: 2,
              borderColor: COLORS.line,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...border(),
    padding: U[3],
    gap: U[2],
  },
  btn: {
    ...border(),
    minHeight: 48,
    paddingHorizontal: U[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
  },
  chip: {
    ...border(),
    backgroundColor: COLORS.surface,
    paddingHorizontal: U[2],
    paddingVertical: 2,
  },
  barOuter: {
    height: 14,
    ...border(),
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
});
