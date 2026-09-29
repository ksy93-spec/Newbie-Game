// 웹뷰(게임) -> 네이티브 메시지
export type WebMessage =
  | { type: 'save'; data: string }
  | { type: 'ad_request'; id: string }
  | { type: 'back_result'; handled: boolean }
  | { type: 'share'; text?: string; title?: string; url?: string }
  | { type: 'open_url'; url: string };

export function parseWebMessage(raw: string): WebMessage | null {
  try {
    const m = JSON.parse(raw);
    if (!m || typeof m.type !== 'string') return null;
    return m as WebMessage;
  } catch {
    return null;
  }
}
