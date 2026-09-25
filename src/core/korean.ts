/* 한글 조사 고르기. "집주인이(가)" 같은 괄호 표기는 게임 대사에서 눈에 거슬린다. */

function hasFinal(word: string): boolean {
  const c = word.charCodeAt(word.length - 1);
  if (Number.isNaN(c) || c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}

/** 받침에 따라 조사를 고른다. josa('집주인', '이', '가') → '집주인이' */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  return word + (hasFinal(word) ? withFinal : withoutFinal);
}

export const 이가 = (w: string) => josa(w, '이', '가');
export const 은는 = (w: string) => josa(w, '은', '는');
export const 을를 = (w: string) => josa(w, '을', '를');
