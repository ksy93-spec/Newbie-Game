// 앱 밖으로 나가는 주소는 전부 여기서 처리한다. 웹뷰가 남의 사이트로 넘어가면 안 된다.
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { BASE_URL } from './injected.mjs';

export function isInApp(url: string): boolean {
  return url === 'about:blank' || url.startsWith(BASE_URL) || url.startsWith('data:') || url.startsWith('blob:');
}

export async function openExternal(url: string): Promise<void> {
  try {
    if (/^https?:\/\//i.test(url)) await WebBrowser.openBrowserAsync(url);   // Chrome Custom Tabs
    else if (/^(mailto:|tel:)/i.test(url)) await Linking.openURL(url);
    // 그 밖의 스킴(intent:, market: 등)은 열지 않는다
  } catch { /* 열 앱이 없으면 조용히 무시 */ }
}
