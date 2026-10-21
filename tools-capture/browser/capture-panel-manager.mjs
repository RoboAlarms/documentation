// Capture the Panel Manager (dark theme, 1440x960) from the staged mock behind the address proxies.
// Expects (see BROWSER-CAPTURE.md):
//   proxy 8571 -> mock 8561 (MOCK_AUTOLOGIN=master, MOCK_CLOCK=ok)
//   proxy 8572 -> mock 8562 (no autologin: sign-in page)
//   proxy 8573 -> mock 8563 (MOCK_AUTOLOGIN=installer, MOCK_CLOCK=ok)
// Usage: node capture-panel-manager.mjs [outDir] [only-name,...]
import {launch} from './cdp.mjs';
const out = (process.argv[2] || '.capture/panel-manager').replace(/\/?$/, '/');
const only = process.argv[3] ? process.argv[3].split(',') : null;
const BASE = 'http://192.0.2.10/';
const MASTER = '127.0.0.1:8571', SIGNIN = '127.0.0.1:8572', INSTALLER = '127.0.0.1:8573';

const shots = [
  ['sign-in', SIGNIN, '', async p => { await p.type('#login-name', 'Master'); await p.eval(`document.activeElement.blur()`); }],
  ['overview', MASTER, '#/overview'],
  ['remote-keypad', MASTER, '#/keypad', async p => { await p.sleep(2500); }],
  ['zones', MASTER, '#/zones'],
  ['activity', MASTER, '#/activity'],
  ['troubles', MASTER, '#/troubles'],
  ['people-and-codes', MASTER, '#/people'],
  ['people-edit-person', MASTER, '#/people', async p => { await p.click('Sam', {wait: 1200}); }],
  ['change-your-password', MASTER, '#/overview', async p => { await p.click('#change-password', {wait: 1200}); }],
  ['people-browser-sign-in', MASTER, '#/people', async p => { await p.click('Sam', {wait: 1200}); await p.eval(`[...document.querySelectorAll('#main button')].find(b => b.textContent.trim() === 'Set a new password').scrollIntoView({block: 'center'})`); return 'keep-scroll'; }],
  ['integrations', MASTER, '#/integrations'],
  ['integrations-home-assistant', MASTER, '#/integrations', async p => { await p.click('Set up', {wait: 1500}); }],
  ['automations-list', MASTER, '#/automations'],
  ['automations-ideas', MASTER, '#/automations', async p => { await p.click('Add an automation', {wait: 1200}); }],
  ['automations-editor', MASTER, '#/automations', async p => { await p.click('When Front Door opens', {wait: 1500}); }],
  ['display-and-sound', MASTER, '#/display'],
  ['network', MASTER, '#/network'],
  ['date-and-time', MASTER, '#/time'],
  ['storage', MASTER, '#/storage'],
  ['system-health', MASTER, '#/health'],
  ['walk-test', MASTER, '#/walk'],
  ['software-updates', MASTER, '#/updates', async p => { await p.click('Check now', {wait: 4000}); }],
  ['installer-overview', INSTALLER, '#/overview'],
  ['installer-zones', INSTALLER, '#/zone-setup'],
  ['installer-zone-editor', INSTALLER, '#/zone-setup', async p => { await p.click('1Front Door', {wait: 1500}); }],
  ['installer-z-wave', INSTALLER, '#/zwave'],
  ['installer-zigbee', INSTALLER, '#/zigbee'],
  ['installer-partitions-and-devices', INSTALLER, '#/partitions'],
  ['installer-system-options', INSTALLER, '#/options'],
  ['installer-access-and-maintenance', INSTALLER, '#/access'],
  ['installer-software-updates', INSTALLER, '#/updates'],
  ['installer-developer', INSTALLER, '#/developer'],
];

const groups = [...new Set(shots.map(s => s[1]))];
let port = 9350;
for (const proxy of groups) {
  const p = await launch({port: port++, proxy, scheme: 'dark'});
  await p.go(BASE, 2500);
  for (const [name, px, hash, act] of shots) {
    if (px !== proxy || (only && !only.includes(name))) continue;
    try {
      await p.go('about:blank', 200);
      await p.go(BASE + hash, 2500);
      const keep = act ? await act(p) : null;
      if (keep !== 'keep-scroll') await p.eval(`window.scrollTo(0,0); document.querySelector('#main')?.scrollTo?.(0,0)`);
      await p.shot(out + name + '.png');
    } catch (e) { console.error('FAILED', name, e.message); }
  }
  if (p.consoleLog.length) console.log(proxy, 'console:', p.consoleLog.join('\n'));
  await p.close();
}
