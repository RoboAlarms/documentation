// Minimal headless-Chrome driver over the DevTools protocol (no npm packages; Node >= 22 for WebSocket).
// Used by the capture scripts: launch(), then page.go(url), page.eval(js), page.shot(file[, clip]).
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch({width = 1440, height = 960, scheme = 'dark', port = 9333, proxy = ''} = {}) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'docs-capture-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', ...(proxy ? [`--proxy-server=${proxy}`, '--proxy-bypass-list=<-loopback>'] : []),`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb',
    '--disable-extensions', '--lang=en-US', `--window-size=${width},${height}`, 'about:blank'], {stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch { await sleep(200); }
  }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const {res, rej} = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) listeners.forEach(l => l(m));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, {res, rej}); ws.send(JSON.stringify({id: i, method, params})); });
  const consoleLog = [];
  listeners.push(m => {
    if (m.method === 'Runtime.exceptionThrown') consoleLog.push('EXC ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text));
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) consoleLog.push(m.params.type + ' ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});
  await send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-color-scheme', value: scheme}, {name: 'prefers-reduced-motion', value: 'reduce'}]});
  const api = {
    send, consoleLog, sleep,
    async go(url, wait = 1500) { await send('Page.navigate', {url}); await sleep(wait); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true});
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) + '\n' + expr.slice(0, 200));
      return r.result.value;
    },
    async click(selectorOrText, {within = 'document', wait = 600} = {}) {
      const ok = await api.eval(`(() => { const all = [...${within === 'document' ? 'document' : `document.querySelector(${JSON.stringify(within)})`}.querySelectorAll('button, a, [role=tab], [role=button], summary, label, input[type=radio], input[type=checkbox]')];
        const want = ${JSON.stringify(selectorOrText)};
        let el = null; try { el = document.querySelector(want); } catch {}
        if (!el) el = all.find(e => e.offsetParent !== null && (e.textContent || e.value || '').trim() === want) || all.find(e => e.offsetParent !== null && (e.textContent || '').trim().startsWith(want));
        if (!el) return false; el.scrollIntoView({block: 'center'}); el.click(); return true; })()`);
      if (!ok) throw new Error('click: not found: ' + selectorOrText);
      await sleep(wait);
    },
    async type(selector, text) {
      await api.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus(); el.value = ''; })()`);
      await send('Input.insertText', {text});
    },
    async resize(w, h) { await send('Emulation.setDeviceMetricsOverride', {width: w, height: h, deviceScaleFactor: 1, mobile: false}); },
    async shot(file, clip) {
      await sleep(300);
      const r = await send('Page.captureScreenshot', {format: 'png', ...(clip ? {clip: {...clip, scale: 1}} : {}), captureBeyondViewport: false});
      await fs.mkdir(path.dirname(file), {recursive: true});
      await fs.writeFile(file, Buffer.from(r.data, 'base64'));
      console.log('saved', file);
    },
    async close() { try { await send('Browser.close'); } catch {} proc.kill(); await sleep(500); await fs.rm(profile, {recursive: true, force: true}).catch(() => {}); },
  };
  return api;
}
