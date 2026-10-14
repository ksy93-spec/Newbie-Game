process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
const { chromium } = await import('playwright');
const path = await import('node:path');
const { fileURLToPath, pathToFileURL } = await import('node:url');
const fs = await import('node:fs');

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const demo = path.join(root, 'prototype/newbie-quest-demo.html');
const imgDir = path.join(root, 'ops/review-1014/img');
const outJson = path.join(process.env.SCRATCH_DIR || path.join(root, 'ops/review-1014/tmp'), 'mid-shots-result.json');
fs.mkdirSync(imgDir, { recursive: true });
fs.mkdirSync(path.dirname(outJson), { recursive: true });

// Canvas text hook: record every fillText drawn inside the cutscene overlay (logical coords = user space).
const HOOK = `
window.__mqLog = [];
(function () {
  var orig = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
    try {
      var cv = this.canvas, ov = cv && cv.closest && cv.closest('#opening');
      if (ov && window.__mqLog.length < 20000) {
        var m = this.getTransform(), w = this.measureText(String(text)).width;
        window.__mqLog.push({ t: String(text), x: x, y: y, w: w, cw: cv.width / m.a, ch: cv.height / m.d });
      }
    } catch (e) {}
    return orig.apply(this, arguments);
  };
})();`;

function checkOverlay() {
  return `(() => {
    const out = { dom: [], canvas: [], viewport: [] };
    const vw = innerWidth, vh = innerHeight;
    const ov = document.getElementById('opening');
    if (!ov) return { missing: true, ...out };
    const els = [...ov.querySelectorAll('*')];
    for (const e of els) {
      const r = e.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      const name = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '') + (e.id ? '#' + e.id : '');
      const label = (e.textContent || '').trim().slice(0, 30);
      if (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2)
        out.dom.push({ el: name, text: label, sh: e.scrollHeight, ch: e.clientHeight, sw: e.scrollWidth, cw: e.clientWidth });
      if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1)
        out.viewport.push({ el: name, text: label, rect: [r.left, r.top, r.right, r.bottom].map(v => Math.round(v)) });
    }
    const st = window.MQP;
    const opts = (st && st.opts) || [];
    const seen = new Set();
    for (const e of (window.__mqLog || [])) {
      const key = e.t + '|' + e.x + '|' + e.y;
      if (seen.has(key)) continue; seen.add(key);
      if (e.x < 0 || e.x + e.w > e.cw + 0.5)
        out.canvas.push({ text: e.t, why: 'canvas edge', x: +e.x.toFixed(1), right: +(e.x + e.w).toFixed(1), cw: e.cw });
      for (const b of opts) {
        if (e.y >= b.y - 1 && e.y <= b.y + b.h && e.x >= b.x - 1 && e.x <= b.x + b.w &&
            e.x + e.w > b.x + b.w - 1)
          out.canvas.push({ text: e.t, why: 'choice box right edge', right: +(e.x + e.w).toFixed(1), boxRight: b.x + b.w });
      }
    }
    out.optCount = opts.length;
    return out;
  })()`;
}

const browser = await chromium.launch({ headless: true });
const url = pathToFileURL(demo).href + '#nointro';

// Event ids: read from the page itself so the list matches LIFE_MID.
const probe = await browser.newPage({ viewport: { width: 360, height: 640 } });
await probe.goto(url);
await probe.waitForFunction(() => window.S && window.QUESTS, null, { timeout: 15000 });
const ids = await probe.evaluate(() => Object.keys(LIFE_MID));
await probe.close();

const results = [];
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.addInitScript(HOOK);
  await page.goto(url);
  await page.waitForFunction(() => window.S && window.QUESTS, null, { timeout: 15000 });

  // Same setup as the brief. A random profile can lack the flags an event needs, so retry with a new seed.
  let started = false, attempts = 0;
  for (; attempts < 20 && !started; attempts++) {
    if (attempts > 0) await page.reload();
    await page.waitForFunction(() => window.S && window.QUESTS, null, { timeout: 15000 });
    started = await page.evaluate((id) => {
      lifeNew(); const p = lifeGen(lifeSeedNew()); S.life.prof = p; S.life.seed = p.seed; birthApply();
      S.onboarded = true; S.tut = 1; render('home');
      return lifeMidPlay(id, { age: LIFE_MID[id].age });
    }, id);
  }

  // Fallback (recorded as forced): an event whose need-flag a random profile never produces is started with
  // that one flag forced true. Only lifeMidFlags is patched; the rest of the cutscene path is unchanged.
  let forced = null;
  if (!started) {
    forced = await page.evaluate((id) => Object.keys(LIFE_MID[id].need || {}).filter(k => LIFE_MID[id].need[k]), id);
    await page.reload();
    await page.waitForFunction(() => window.S && window.QUESTS, null, { timeout: 15000 });
    started = await page.evaluate((args) => {
      const [id, keys] = args;
      const orig = lifeMidFlags;
      lifeMidFlags = function () { const f = orig(); keys.forEach(k => { f[k] = true; }); return f; };
      lifeNew(); const p = lifeGen(lifeSeedNew()); S.life.prof = p; S.life.seed = p.seed; birthApply();
      S.onboarded = true; S.tut = 1; render('home');
      return lifeMidPlay(id, { age: LIFE_MID[id].age });
    }, [id, forced]);
  }
  const rec = { id, started, attempts, forced, choices: [], steps: 0, stoppedBy: null, errors };
  if (!started) { rec.stoppedBy = 'not-started'; results.push(rec); await page.close(); console.log(id, 'not-started'); continue; }

  let n = 0;
  for (let step = 0; step < 200; step++) {
    const s = await page.evaluate(() => {
      if (!window.MQP) return null;
      const sc = window.MQP.list()[window.MQP.cur()];
      return { hasChoice: !!(sc && sc.choice), picked: window.MQP.picked, title: sc && sc.type };
    });
    rec.steps = step + 1;
    if (s === null) { rec.stoppedBy = 'mqp-null'; break; }
    if (s.hasChoice && s.picked === null) {
      n++;
      await page.evaluate(() => { window.__mqLog = []; });
      await page.waitForFunction(() => window.MQP && window.MQP.opts && window.MQP.opts.length > 0, null, { timeout: 15000 });
      await page.waitForTimeout(1500);
      const check = await page.evaluate(checkOverlay());
      const shot = `mid-${id}-${n}.png`;
      await page.screenshot({ path: path.join(imgDir, shot) });
      rec.choices.push({ n, shot, check });
      await page.evaluate(() => window.MQP.pick(0));
    } else {
      await page.evaluate(() => { if (window.MQP) window.MQP.next({ type: 'test' }); });
      await page.waitForTimeout(60);
    }
  }
  if (!rec.stoppedBy) rec.stoppedBy = 'step-limit';
  results.push(rec);
  await page.close();
  console.log(id, 'choices=' + rec.choices.length, 'steps=' + rec.steps, rec.stoppedBy);
}

await browser.close();
fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
console.log('events=' + ids.length, 'json=' + outJson);
