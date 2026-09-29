import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Keyboard, Platform, Share, StyleSheet, ToastAndroid, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { GAME_HTML } from './game/gameHtml';
import { parseWebMessage } from './bridge/protocol';
import { readMirror, writeMirror } from './bridge/mirror';
import { isInApp, openExternal } from './bridge/external';
import { rewarded, startAds } from './bridge/ads';
import {
  AFTER_SCRIPT,
  BACK_REQUEST_JS,
  BASE_URL,
  FLUSH_JS,
  adResultJs,
  adShownJs,
  buildBeforeScript,
  setInsetsJs,
} from './bridge/injected.mjs';

const BG = '#2E2740';
const BACK_REPLY_TIMEOUT_MS = 600;   // 게임이 답이 없으면 "처리 안 함"으로 본다
const EXIT_WINDOW_MS = 2000;

export function GameShell() {
  const insets = useSafeAreaInsets();
  const web = useRef<WebView>(null);
  const [mirror, setMirror] = useState<string | null | undefined>(undefined);   // undefined = 읽는 중
  const [webKey, setWebKey] = useState(0);
  const [kb, setKb] = useState(0);

  // 시작: 백업 읽기(웹뷰를 띄우기 전에 끝내야 로드 전 스크립트에 넣을 수 있다) + 광고 동의/초기화
  useEffect(() => {
    let alive = true;
    readMirror().then((m) => { if (alive) setMirror(m); });
    startAds();
    return () => { alive = false; };
  }, []);

  // 키보드(백과 검색창): 전체 화면 모드에서는 창이 줄지 않으므로 키보드 높이만큼 띄운다
  useEffect(() => {
    const s = Keyboard.addListener('keyboardDidShow', (e) => setKb(e.endCoordinates.height));
    const h = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { s.remove(); h.remove(); };
  }, []);

  const bottom = kb > 0 ? 0 : insets.bottom;
  const insetsNow = { top: insets.top, bottom, left: insets.left, right: insets.right };

  // 로드 전 스크립트는 웹뷰를 만들 때 한 번만 쓴다(값이 바뀌어도 페이지를 다시 읽지 않는다)
  // (웹뷰 프로세스가 죽어 다시 만들 때는 그 시점의 값을 쓴다)
  const latest = useRef<{ insets: typeof insetsNow; mirror: string | null | undefined }>({ insets: insetsNow, mirror });
  latest.current.insets = insetsNow;
  if (latest.current.mirror === undefined && mirror !== undefined) latest.current.mirror = mirror;
  const before = useMemo(
    () => (mirror === undefined ? '' : buildBeforeScript({ insets: latest.current.insets, mirror: latest.current.mirror ?? null })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mirror === undefined, webKey],
  );

  // 이후 안전 영역 변화는 CSS 변수만 바꾼다
  useEffect(() => { web.current?.injectJavaScript(setInsetsJs(insetsNow)); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insets.top, bottom, insets.left, insets.right]);

  // 백그라운드로 가기 전에 저장 사본을 넘긴다
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') web.current?.injectJavaScript(FLUSH_JS);
    });
    return () => sub.remove();
  }, []);

  // 뒤로가기: 게임에 먼저 묻고, 닫을 게 없으면 두 번 눌러 종료
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBackAt = useRef(0);
  const onBackResult = useCallback((handled: boolean) => {
    if (backTimer.current) { clearTimeout(backTimer.current); backTimer.current = null; }
    if (handled) { lastBackAt.current = 0; return; }
    const now = Date.now();
    if (now - lastBackAt.current < EXIT_WINDOW_MS) { BackHandler.exitApp(); return; }
    lastBackAt.current = now;
    if (Platform.OS === 'android') ToastAndroid.show('한 번 더 누르면 종료', ToastAndroid.SHORT);
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'android') return;   // 아이폰에는 뒤로가기 버튼이 없다
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (backTimer.current) return true;    // 앞선 물음에 아직 답을 기다리는 중
      backTimer.current = setTimeout(() => onBackResult(false), BACK_REPLY_TIMEOUT_MS);
      web.current?.injectJavaScript(BACK_REQUEST_JS);
      return true;
    });
    return () => sub.remove();
  }, [onBackResult]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    const m = parseWebMessage(e.nativeEvent.data);
    if (!m) return;
    switch (m.type) {
      case 'save':
        if (typeof m.data === 'string') { latest.current.mirror = m.data; writeMirror(m.data); }
        break;
      case 'ad_request':
        rewarded.request({
          onShown: () => web.current?.injectJavaScript(adShownJs(m.id)),
          onDone: (ok) => web.current?.injectJavaScript(adResultJs(m.id, ok)),
        });
        break;
      case 'back_result':
        onBackResult(m.handled === true);
        break;
      case 'share': {
        const message = [m.text, m.url].filter(Boolean).join('\n');
        if (message) Share.share({ message, title: m.title }).catch(() => {});
        break;
      }
      case 'open_url':
        if (typeof m.url === 'string') openExternal(m.url);
        break;
    }
  }, [onBackResult]);

  const onShouldStart = useCallback((req: ShouldStartLoadRequest) => {
    if (isInApp(req.url)) return true;
    openExternal(req.url);
    return false;
  }, []);

  const hideSplash = useCallback(() => { SplashScreen.hideAsync().catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(hideSplash, 6000); return () => clearTimeout(t); }, [hideSplash]);

  if (mirror === undefined) return <View style={styles.root} />;

  return (
    <View style={[styles.root, { paddingBottom: Platform.OS === 'android' ? kb : 0 }]}>
      <WebView
        key={webKey}
        ref={web}
        style={styles.web}
        source={{ html: GAME_HTML, baseUrl: BASE_URL }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScriptBeforeContentLoaded={before}
        injectedJavaScript={AFTER_SCRIPT}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStart}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        onLoadEnd={hideSplash}
        onRenderProcessGone={() => setWebKey((k) => k + 1)}
        textZoom={100}
        overScrollMode="never"
        mixedContentMode="never"
        allowFileAccess={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        webviewDebuggingEnabled={__DEV__}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        bounces={false}
        contentInsetAdjustmentBehavior="never"
        allowsBackForwardNavigationGestures={false}
        keyboardDisplayRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  web: { flex: 1, backgroundColor: BG },
});
