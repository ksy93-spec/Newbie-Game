import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { OB, obSteps, type ObKey , STARTER } from '@/data/onboarding';
import { pickDaily } from '@/core/daily';
import { Avatar } from '@/sprite/Avatar';
import { useGame } from '@/store';
import { COLORS, U } from '@/theme/tokens';
import { Card, PixelButton, T } from '@/ui/Pixel';

/* 세 문항까지만 받는다. 나이·회사는 첫 퀘스트 뒤에 홈에서 채운다. */
export function Onboarding() {
  const { s, set, ev, quests } = useGame();
  const [step, setStep] = useState(0);
  const steps = obSteps(s.status);
  const key = steps[Math.min(step, steps.length - 1)] as ObKey;
  const def = OB[key];
  const last = step === steps.length - 1;
  const value = s[key] as string | number | null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: U[4], gap: U[4], backgroundColor: COLORS.bg, flexGrow: 1 }}
    >
      <View style={{ alignItems: 'center', gap: U[2] }}>
        <Avatar state={s} pose="idle" scale={2} />
        <T size="display">뉴비 퀘스트</T>
        <T size="micro" color={COLORS.inkSoft} style={{ textAlign: 'center' }}>
          대학생·취준생·사회초년생이{'\n'}실제로 손해 보는 지점만 골라 배우는 도트 RPG
        </T>
      </View>

      <View style={{ gap: U[2] }}>
        <T size="body">{def.q}</T>
        <T size="micro" color={COLORS.inkSoft}>
          {def.hint}
        </T>
      </View>

      <View style={{ gap: U[2] }}>
        {def.o.map(([val, label, note]) => (
          <PixelButton
            key={String(val)}
            tone={value === val ? 'primary' : 'plain'}
            sound="pick"
            onPress={() => {
              set((st) => {
                (st as unknown as Record<string, unknown>)[key] = val;
                /* 신분을 고르면 그에 맞는 옷을 입혀 준다. 몸은 하나이고 옷이 신분을 말한다.
                   캐릭터 화면에서 언제든 바꿀 수 있으니 강제는 아니다. */
                if (key === 'status') {
                  const outfit = STARTER[String(val)];
                  if (outfit) {
                    outfit.forEach((id) => {
                      if (st.owned.indexOf(id) < 0) st.owned.push(id);
                    });
                    st.equip.top = outfit[0];
                    st.equip.bottom = outfit[1];
                  }
                }
              });
              ev('onboard_pick', { k: key });
              if (key === 'status') setStep(0);
            }}
          >
            <View style={{ width: '100%', gap: 2 }}>
              <T size="uiBold">{label}</T>
              <T size="micro" color={COLORS.inkSoft}>
                {note}
              </T>
            </View>
          </PixelButton>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderWidth: 2,
              borderColor: COLORS.line,
              backgroundColor: i <= step ? COLORS.accent : COLORS.surface,
            }}
          />
        ))}
      </View>

      <PixelButton
        label={last ? '시작하기' : '다음'}
        disabled={value == null}
        onPress={() => {
          if (!last) {
            setStep(step + 1);
            ev('onboard_step', { i: step + 1, k: steps[step + 1] });
            return;
          }
          set((st) => {
            st.onboarded = true;
            st.todayQ = pickDaily(quests(), st);
          });
          ev('onboard_done', { status: s.status, steps: steps.length });
        }}
      />

      <Card>
        <T size="micro" color={COLORS.inkSoft}>
          제도는 자주 바뀝니다. 문항마다 기준일과 확인처를 함께 보여 드리며, 법률·세무 자문이 아니라 정보
          제공입니다.
        </T>
      </Card>
    </ScrollView>
  );
}
