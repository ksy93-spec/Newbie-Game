#!/usr/bin/env python3
"""효과음 WAV를 만든다.

프로토타입(prototype/newbie-quest-demo.html)은 웹오디오로 사각파를 그 자리에서 만든다.
네이티브에는 그런 게 없으니 같은 악보를 같은 파형으로 미리 구워 둔다. 소리가 서로 달라지면
"웹에서 듣던 그 앱"이 아니게 된다.

    python3 tools/make-sfx.py assets/sfx
"""
import math
import pathlib
import struct
import sys
import wave

RATE = 22050        # 짧은 삑 소리에 44.1k는 낭비다
ATTACK = 0.008      # 프로토타입의 exponentialRamp와 같은 값
VOL = 0.25          # 파일은 브라우저처럼 덧붙는 게인이 없어 더 크게 굽는다 (약 -12dBFS)
VOL_HIT = 0.27

# (주파수, 시작초, 길이초, 파형) — HTML의 SFX 표와 같은 값이다
SFX = {
    'tap':   [(660, 0, .05, 'square')],
    'pick':  [(880, 0, .05, 'square'), (1175, .04, .06, 'square')],
    'good':  [(784, 0, .07, 'square'), (1047, .07, .11, 'square')],
    'bad':   [(311, 0, .09, 'square'), (233, .09, .15, 'square')],
    'coin':  [(1319, 0, .05, 'square'), (1760, .05, .09, 'square')],
    'level': [(523, 0, .07, 'square'), (659, .07, .07, 'square'),
              (784, .14, .07, 'square'), (1047, .21, .16, 'square')],
    'open':  [(392, 0, .06, 'square'), (523, .06, .06, 'square'), (659, .12, .13, 'square')],
    'hit':   [(196, 0, .12, 'sawtooth')],
    'win':   [(659, 0, .08, 'square'), (784, .08, .08, 'square'),
              (988, .16, .08, 'square'), (1319, .24, .22, 'square')],
}


def wave_at(kind, phase):
    """phase는 0~1. 사각파는 반씩, 톱니는 -1에서 1로 훑는다."""
    if kind == 'sawtooth':
        return 2.0 * phase - 1.0
    return 1.0 if phase < 0.5 else -1.0


def envelope(t, dur):
    """웹오디오의 지수 램프를 흉내낸다. 딱 끊으면 '틱' 하는 잡음이 남는다."""
    if t < ATTACK:
        return t / ATTACK
    k = (t - ATTACK) / max(1e-6, dur - ATTACK)
    return math.exp(-5.0 * k)


def render(notes, vol):
    end = max(s + d for _, s, d, _ in notes) + 0.03
    n = int(RATE * end)
    buf = [0.0] * n
    for freq, start, dur, kind in notes:
        i0 = int(RATE * start)
        for i in range(int(RATE * dur)):
            t = i / RATE
            phase = (freq * t) % 1.0
            j = i0 + i
            if j < n:
                buf[j] += wave_at(kind, phase) * envelope(t, dur) * vol
    return buf


def save(path, buf):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(
            struct.pack('<h', max(-32768, min(32767, int(v * 32767)))) for v in buf))


def main():
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'assets/sfx')
    out.mkdir(parents=True, exist_ok=True)
    for name, notes in SFX.items():
        p = out / (name + '.wav')
        save(p, render(notes, VOL_HIT if name == 'hit' else VOL))
        print(f'{name:6s} {p.stat().st_size:>6d} bytes')


if __name__ == '__main__':
    main()
