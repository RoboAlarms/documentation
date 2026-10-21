// Capture the RoboAlarms Flasher (dark theme, 1440x960) driven against the MockWorld fixture
// (flasher-mock.py). Usage: node capture-flasher.mjs <flasher url> [outDir] [phase]
//   phase "install" (default): guided Plan -> Wire -> Connect (factory panel COM5) -> Install -> Test
//   phase "update": guided flow against COM6 (an older RoboAlarms) -> update review/progress
//   phase "tools": Advanced tools pages (backups, connected parts, diagnostics)
import {launch} from './cdp.mjs';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// Each phase starts its own fresh mock Flasher (the Flasher remembers choices for as long as it runs).
const [phase = 'install', outArg] = process.argv.slice(2);
const out = (outArg || '.capture/flasher').replace(/\/?$/, '/');
const DEBUG = !!process.env.DEBUG;
const REPO = process.env.ALARM_PANEL || '../alarm-panel';
const PY = process.env.FLASHER_PY || 'python';
const urlFile = path.join(REPO, 'build/docs-capture/flasher-url-' + phase + '.txt');
fs.rmSync(urlFile, {force: true});
// Backups are named after the chip's MAC: the tools phase shows the Backups page empty instead.
if (phase === 'tools') for (const f of fs.readdirSync(path.join(REPO, 'build/docs-capture/flasher/Backups'), {withFileTypes: true}).filter(d => d.name.endsWith('.bin'))) fs.rmSync(path.join(REPO, 'build/docs-capture/flasher/Backups', f.name));
const ports = {install: 'COM5', update: 'COM6', tools: 'COM5,COM6'}[phase];
const flasher = spawn(PY, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'flasher-mock.py'), REPO, urlFile, '0'],
  {env: {...process.env, DOCS_FLASHER_PORTS: ports}, stdio: DEBUG ? 'inherit' : 'ignore'});
for (let i = 0; i < 100 && !fs.existsSync(urlFile); i++) await new Promise(r => setTimeout(r, 200));
const url = fs.readFileSync(urlFile, 'utf8').trim();
const p = await launch({port: 9370, scheme: 'dark'});
await p.go(url, 3000);

const dump = async tag => {
  if (!DEBUG) return;
  console.log('---', tag, await p.eval(`JSON.stringify({main: (document.querySelector('main')||document.body).innerText.slice(0, 900), buttons: [...document.querySelectorAll('button, a, [role=button], label')].filter(e => e.offsetParent).map(e => (e.textContent || '').trim().replace(/\\s+/g,' ').slice(0,50)).filter(Boolean)})`));
};
const shot = async (name, clip) => { await p.eval(`document.activeElement?.blur?.()`); await p.shot(out + name + '.png', clip); await dump(name); };
const top = () => p.eval(`window.scrollTo(0,0); document.querySelectorAll('*').forEach(e => { if (e.scrollTop) e.scrollTop = 0; })`);
const next = async (wait = 1500) => {
  const ok = await p.eval(`(() => { const b = [...document.querySelectorAll('button')].filter(e => e.offsetParent && !e.disabled && /^Next|^Continue|^Install|^Update|^Start/.test(e.textContent.trim()));
    const pick = b[b.length - 1]; if (!pick) return null; pick.click(); return pick.textContent.trim(); })()`);
  if (DEBUG) console.log('next ->', ok);
  if (!ok) throw new Error('no Next button');
  await p.sleep(wait);
};
const tickAll = async () => { // the list re-renders after each tick: find the next unticked box each time
  for (let i = 0; i < 60; i++) {
    const did = await p.eval(`(() => { const c = [...document.querySelectorAll('main input[type=checkbox]')].find(c => !c.checked && c.offsetParent !== null && !c.disabled); if (!c) return false; c.click(); return true; })()`);
    if (!did) return i;
    await p.sleep(120);
  }
};
const waitText = async (re, ms = 60000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await p.eval(`${re}.test(document.body.innerText)`)) return true;
    await p.sleep(500);
  }
  throw new Error('timeout waiting for ' + re);
};
const clickText = (t, wait = 1500) => p.click(t, {wait});

// Progress screens list the chip's MAC and a backup file named after it: crop to the headline, the
// progress bar and the first check (as the website did), never repaint.
const PROGRESS_CLIP = {x: 456, y: 90, width: 800, height: 285};
// The lower half of the step list, from a step that comes after the chip/backup lines down to Stop.
const stepsClip = title => p.eval(`(() => { const leaf = [...document.querySelectorAll('main *')].find(e => e.children.length === 0 && e.textContent.trim() === ${JSON.stringify(title)});
  const stop = [...document.querySelectorAll('main button')].find(b => b.textContent.trim().startsWith('Stop'));
  const y0 = Math.round(leaf.getBoundingClientRect().top - 16), y1 = Math.round(stop.getBoundingClientRect().bottom + 22);
  return {x: 456, y: y0, width: 800, height: y1 - y0}; })()`);
const mainText = () => p.eval(`(document.querySelector('main')||document.body).innerText`);
const install = phase === 'install';
const N = name => (install ? 'install-' : 'update-') + name;

try {
  if (phase === 'install' || phase === 'update') {
    if (install) await shot(N('01-plan-choose-panel'));
    await clickText('Elecrow CrowPanel Advanced 7');
    await clickText('Wireless sensors (433 MHz)');
    await clickText('Battery-backed clock');
    await top();
    if (install) {
      await shot(N('02-plan-panel-chosen'));
      await p.eval(`[...document.querySelectorAll('main *')].find(e => e.children.length === 0 && /WHAT DO YOU WANT TO CONNECT/i.test(e.textContent)).scrollIntoView({block: 'start'})`);
      await shot(N('03-plan-parts'));
      await top();
    }
    await next();
    if (install) { await top(); await shot(N('04-wire-get-ready')); }
    await tickAll(); await next();
    if (install) { await top(); await shot(N('05-wire-full-wiring')); }
    await tickAll(); await next();
    if (install) { await top(); await shot(N('06-wire-check-before-power')); }
    await tickAll(); await next(2500);
    await p.sleep(4000); // let the Flasher identify the plugged-in pretend panel
    await top(); await shot(N(install ? '07-connect' : '01-connect'));
    if (process.env.STOP === 'connect') throw new Error('stop');
    await next(4000);
    if (install) { await top(); await shot(N('08-check-the-panel')); }
    if (await p.eval(`[...document.querySelectorAll('button')].some(b => b.offsetParent && b.textContent.trim() === 'Check this panel')`)) {
      await clickText('Check this panel', 8000); await top(); await shot(N(install ? '09-check-the-panel-board' : '02-check-the-panel'));
    }
    if (process.env.STOP === 'checked') throw new Error('stop');
    await next(3000);
    await top(); await shot(N(install ? '10-review' : '03-review'));
    if (process.env.STOP === 'review') throw new Error('stop');
    await next(2000);
    const want = install
      ? [[t => /Back up the whole flash\nreading/.test(t) && /\b1\d %/.test(t), '11-progress-backup'],
         [t => /Write the firmware\nbootloader/.test(t), '12-progress-writing'],
         [t => /Setting it up for your parts/.test(t), '13-progress-parts-setup']]
      : [[t => /\b[2-6]\d %/.test(t), '04-progress']];
    const got = new Set();
    for (let i = 0; i < 600; i++) {
      const t = await mainText();
      for (const [test, name] of want) if (!got.has(name) && test(t)) {
        got.add(name); await top(); await shot(N(name), PROGRESS_CLIP);
        if (name === '12-progress-writing') await shot(N('12b-progress-writing-steps'), await stepsClip('Erase the flash'));
        if (name === '04-progress') await shot(N('04b-progress-steps'), await stepsClip('Compare the layout'));
      }
      if (/STEP 8 OF 8/.test(t.slice(0, 100)) || /went wrong|failed/i.test(t.slice(0, 300))) break;
      if (DEBUG && i % 20 === 0) await shot(N('progress-debug-' + i));
      await p.sleep(500);
    }
    await p.sleep(1500); await top(); await shot(N(install ? '14-test-and-finish' : '05-finished'));
  }
  if (phase === 'tools') {
    await clickText('Advanced tools', 2500);
    await p.eval(`[...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Choose').click()`); await p.sleep(1500);
    await clickText('Look again', 6000);
    await shot('tools-01-panels-and-ports');
    for (const [nav, name] of [['Console', 'tools-02-console'], ['Hardware', 'tools-03-hardware'], ['Zigbee module', 'tools-04-zigbee-module'], ['Backups', 'tools-05-backups'], ['Software', 'tools-06-software'], ['Logs', 'tools-07-logs']]) {
      await clickText(nav, 3000); await top(); await shot(name);
    }
  }
} catch (e) { console.error('STOPPED:', e.message); await dump('at stop'); }
if (p.consoleLog.length) console.log('console:', p.consoleLog.join('\n'));
await p.close();
flasher.kill();