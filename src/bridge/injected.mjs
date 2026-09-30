// 웹뷰에 주입하는 브릿지 스크립트 문자열. 게임 HTML(prototype/newbie-quest-demo.html)은 고치지 않는다.
// 앱(GameShell)과 테스트(tests/bridge.test.mjs)가 똑같은 이 파일을 쓴다.
// 주의: 함수의 toString()으로 만들지 않는다. Hermes 번들에서는 소스가 남지 않기 때문에 문자열로 적는다.
// 그래서 아래 스크립트 본문에는 백틱과 ${ 를 쓰지 않는다.

export const SAVE_KEY = 'nq.v8';            // 게임이 쓰는 localStorage 키
export const MIRROR_KEY = 'nq.v8.mirror';   // 네이티브 AsyncStorage 백업 키
export const BASE_URL = 'https://newbie-quest.app/';
// 요청 -> 광고가 화면에 뜰 때까지. 실제 8초 제한은 네이티브(config/ads.ts AD_LOAD_TIMEOUT_MS)가 걸고,
// 여기는 네이티브가 응답이 없을 때를 위한 여유 있는 안전장치다.
export const AD_START_TIMEOUT_MS = 9000;
export const AD_SHOWN_TIMEOUT_MS = 300000;  // 광고가 뜬 뒤 결과가 안 올 때의 안전장치

const BEFORE_BODY = `
if (window.__nqBridge) return;
window.__nqBridge = true;
function post(m) { try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {} }
function toastMsg(t) { try { if (typeof toast === 'function') toast(t); } catch (e) {} }

/* 1. 저장 복원: 게임 저장이 비어 있을 때만 네이티브 백업을 되살린다 */
try {
  if (CFG.mirror && !localStorage.getItem(CFG.saveKey)) localStorage.setItem(CFG.saveKey, CFG.mirror);
} catch (e) {}

/* 2. 안전 영역(상태바·내비게이션바) -> CSS 변수 */
var curInsets = CFG.insets;
function applyInsets() {
  var de = document.documentElement;        /* 문서 시작 시점에는 아직 없을 수 있다 */
  if (!de) return;
  var s = de.style, i = curInsets;
  s.setProperty('--sat', (i.top || 0) + 'px');
  s.setProperty('--sab', (i.bottom || 0) + 'px');
  s.setProperty('--sal', (i.left || 0) + 'px');
  s.setProperty('--sar', (i.right || 0) + 'px');
}
window.__nqSetInsets = function (i) { curInsets = i; applyInsets(); };
applyInsets();
document.addEventListener('readystatechange', applyInsets);

var CSS = 'html,body{overscroll-behavior:none;}' +
  'body{padding-block:0!important;align-items:stretch!important;touch-action:manipulation;}' +
  '#app{height:100%!important;max-width:none!important;border:0!important;box-shadow:none!important;' +
  'padding:var(--sat,0px) var(--sar,0px) var(--sab,0px) var(--sal,0px);}' +
  '#opening .cskip{top:calc(10px + var(--sat,0px))!important;}';
function addCss() {
  if (document.getElementById('nq-shell-css')) return;
  var st = document.createElement('style'); st.id = 'nq-shell-css'; st.textContent = CSS;
  (document.head || document.documentElement).appendChild(st);
}

/* 3. 외부 링크: 앱 밖 주소는 전부 네이티브(Custom Tabs)로 넘긴다 */
function isExternal(u) {
  return (/^https?:$/.test(u.protocol) && u.origin !== location.origin) || /^(mailto:|tel:)$/.test(u.protocol);
}
window.open = function (url) {
  try {
    var u = new URL(String(url), location.href);
    if (isExternal(u)) post({ type: 'open_url', url: u.href });
  } catch (e) {}
  return null;
};
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
  if (isExternal(u)) { e.preventDefault(); post({ type: 'open_url', url: u.href }); }
}, true);

/* 4. 공유: navigator.share를 네이티브 공유창으로. 파일 공유는 v1.0에서 지원하지 않는다 */
try {
  Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: function (d) {
    d = d || {};
    if (d.files && d.files.length) return Promise.reject(new DOMException('files unsupported', 'NotAllowedError'));
    post({ type: 'share', text: d.text, title: d.title, url: d.url });
    return Promise.resolve();
  } });
  Object.defineProperty(navigator, 'canShare', { configurable: true, writable: true, value: function (d) {
    return !(d && d.files && d.files.length);
  } });
} catch (e) {}

/* 5. 저장 미러: save() 뒤 최대 1초에 한 번 네이티브로 사본을 보낸다 */
var lastSent = null, timer = null, lastAt = 0;
function flushSave() {
  if (timer) { clearTimeout(timer); timer = null; }
  var raw = null;
  try { raw = localStorage.getItem(CFG.saveKey); } catch (e) {}
  if (raw == null || raw === lastSent) return;
  lastSent = raw; lastAt = Date.now();
  post({ type: 'save', data: raw });
}
function scheduleSave() {
  if (timer) return;
  timer = setTimeout(flushSave, Math.max(0, 1000 - (Date.now() - lastAt)));
}
window.__nqFlush = flushSave;
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushSave(); });
window.addEventListener('pagehide', flushSave);

/* 6. 광고: showAd(cb)를 네이티브 보상형 광고로 바꾼다. cb()는 보상을 받았을 때만 부른다 */
var pending = null;
function adDone(rewarded) {
  var p = pending; if (!p) return;
  pending = null; clearTimeout(p.t);
  if (rewarded === true) { try { p.cb(); } catch (e) {} }
  else toastMsg('지금은 광고가 없어요');
}
window.__nqAdShown = function (id) {
  if (!pending || pending.id !== id) return;
  clearTimeout(pending.t);
  pending.t = setTimeout(function () { adDone(false); }, CFG.adShownMs);
};
window.__nqAdResult = function (id, rewarded) {
  if (!pending || pending.id !== id) return;
  adDone(rewarded === true);
};
function nqShowAd(cb) {
  if (pending) return;                       /* 이미 요청 중이면 더 누르는 것은 무시 */
  var id = 'ad' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  pending = { id: id, cb: cb, t: setTimeout(function () { adDone(false); }, CFG.adStartMs) };
  post({ type: 'ad_request', id: id });
}
nqShowAd.__nq = 1;

/* 7. 뒤로가기: 가장 위에 뜬 것부터 하나 닫는다. 닫았으면 true */
function visible(id) { var e = document.getElementById(id); return !!e && !e.hidden; }
function clickId(id) { var e = document.getElementById(id); if (e) { e.click(); return true; } return false; }
var SCREEN_BACK = { quest: 'qback', ep: 'epback', check: 'chkback', codex: 'cback',
  result: 'rback', bossend: 'beback', epend: 'eeback' };
var TAB_SCREENS = { wiki: 1, char: 1, shop: 1, quests: 1 };
function nqBack() {
  if (window.MQP && typeof window.MQP.skip === 'function') { window.MQP.skip(); return true; }   /* 메인 퀘스트 컷신: 다음 선택까지 넘긴다 */
  if (document.getElementById('opening')) return false;          /* 오락실 타이틀 */
  if (visible('mg')) return clickId('mgquit');                   /* 도장 미니게임 */
  if (visible('itip')) {                                         /* 물건·장비 자세히 보기 */
    if (typeof closeTip === 'function') closeTip(); else document.getElementById('itip').hidden = true;
    return true;
  }
  if (visible('hplace')) {                                       /* 가구 놓는 중 -> 취소 */
    var no = document.querySelector('#hplace .no');
    if (no) { no.click(); return true; }
  }
  if (visible('htutor') && typeof endTalk === 'function') { endTalk(); return true; }   /* 대화 상자 */
  var on = document.querySelector('.screen.on'); var sid = on && on.id;
  if (sid && SCREEN_BACK[sid]) return clickId(SCREEN_BACK[sid]);
  if (sid && TAB_SCREENS[sid] && typeof render === 'function') { render('home'); return true; }
  return false;
}
window.__nqBack = nqBack;
window.__nqBackRequest = function () {
  var h = false; try { h = !!nqBack(); } catch (e) {}
  post({ type: 'back_result', handled: h });
};

/* 8. 설치: 게임 스크립트가 끝난 뒤에 함수 선언을 덮어쓴다(전역 함수 선언은 window 속성이라 덮어쓸 수 있다) */
function install() {
  applyInsets();
  addCss();
  try { if (typeof window.showAd === 'function' && !window.showAd.__nq) window.showAd = nqShowAd; } catch (e) {}
  try {
    if (typeof window.save === 'function' && !window.save.__nq) {
      var orig = window.save;
      var wrapped = function () { var r = orig.apply(this, arguments); try { scheduleSave(); } catch (e) {} return r; };
      wrapped.__nq = 1; window.save = wrapped;
    }
  } catch (e) {}
  /* v1.0에서는 알림이 없다. 설정의 "출석 알림" 줄을 만들지 않고, 웹에서 켜 둔 값도 끈다 */
  try {
    if (typeof window.toggleRow === 'function' && !window.toggleRow.__nq) {
      var tr = window.toggleRow;
      var tw = function (host, label) { if (label === '출석 알림') return null; return tr.apply(this, arguments); };
      tw.__nq = 1; window.toggleRow = tw;
    }
    if (window.S && window.S.notif) window.S.notif.on = false;
  } catch (e) {}
  scheduleSave();
}
window.__nqInstall = install;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
else install();
`;

const DEFAULT_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * injectedJavaScriptBeforeContentLoaded 용
 * @param {{ insets?: { top?: number, bottom?: number, left?: number, right?: number }, mirror?: string | null }} [opts]
 */
export function buildBeforeScript({ insets = DEFAULT_INSETS, mirror = null } = {}) {
  const cfg = JSON.stringify({
    insets: { ...DEFAULT_INSETS, ...insets },
    mirror: typeof mirror === 'string' && mirror.length ? mirror : null,
    saveKey: SAVE_KEY,
    adStartMs: AD_START_TIMEOUT_MS,
    adShownMs: AD_SHOWN_TIMEOUT_MS,
  });
  return '(function(){var CFG=' + cfg + ';' + BEFORE_BODY + '})();true;';
}

/** injectedJavaScript(로드 뒤) 용. 이미 설치됐으면 아무 일도 안 한다 */
export const AFTER_SCRIPT = "(function(){ if (window.__nqInstall) window.__nqInstall(); })();true;";

/** @param {{ top: number, bottom: number, left: number, right: number }} i */
export const setInsetsJs = (i) => 'window.__nqSetInsets&&window.__nqSetInsets(' + JSON.stringify(i) + ');true;';
/** @param {string} id */
export const adShownJs = (id) => 'window.__nqAdShown&&window.__nqAdShown(' + JSON.stringify(id) + ');true;';
/** @param {string} id @param {boolean} rewarded */
export const adResultJs = (id, rewarded) =>
  'window.__nqAdResult&&window.__nqAdResult(' + JSON.stringify(id) + ',' + (rewarded === true ? 'true' : 'false') + ');true;';
export const BACK_REQUEST_JS = 'window.__nqBackRequest?window.__nqBackRequest():window.ReactNativeWebView.postMessage(JSON.stringify({type:"back_result",handled:false}));true;';
export const FLUSH_JS = 'window.__nqFlush&&window.__nqFlush();true;';
