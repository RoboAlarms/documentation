// Stage the CURRENT Panel Manager frontend + its engineering mock with documentation-safe data.
// Production HTML/CSS/JS are copied byte-for-byte; only the mock backend (mock-panel.cjs,
// mock-screen.cjs) gets checked text replacements. Output: <alarm-panel>/build/docs-capture/panel-manager
// (git-ignored). Usage: node stage-panel-manager.mjs [alarm-panel root] [remote-keypad-frame.png]
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const repo = path.resolve(process.argv[2] || '../alarm-panel');
const frame = path.resolve(process.argv[3] ||
  '.capture/panel/01_home_ready.png'); // a 1024x600 panel frame for the remote keypad
const source = path.join(repo, 'components/services/panel_web/web');
const target = path.join(repo, 'build/docs-capture/panel-manager');
await fs.mkdir(target, {recursive: true});
const digest = d => createHash('sha256').update(d).digest('hex');
function replace(text, from, to) {
  if (!text.includes(from)) throw new Error(`Capture fixture drift, not found: ${from}`);
  return text.replaceAll(from, to);
}
const hashes = [];
for (const name of ['panel.html', 'panel.css', 'panel.js', 'panel-pages.js', 'panel-words.js', 'panel-keypad.js',
  'mock-panel.cjs', 'mock-screen.cjs']) {
  const original = await fs.readFile(path.join(source, name));
  let output = original;
  if (name === 'mock-panel.cjs') {
    let t = original.toString();
    for (const [from, to] of [
      // a placeholder panel id instead of an Espressif-style MAC
      ["panel_id: '30eda0123456'", "panel_id: 'd0c000000001'"], ["id: '30eda0123456'", "id: 'd0c000000001'"],
      // the master user is shown as "Master" (matches the genuine LVGL remote frame's banner)
      ["{number: 2, name: 'Alex', authority: 2", "{number: 2, name: 'Master', authority: 2"],
      ["'By Alex · keypad'", "'By Master · keypad'"], ["'Disarmed by Alex'", "'Disarmed by Master'"],
      ["auArm('night', 5, 'Alex')", "auArm('night', 5, 'Master')"], ["auArm('stay', 5, 'Alex')", "auArm('stay', 5, 'Master')"],
      ["auArm('away', 10, 'Alex',", "auArm('away', 10, 'Master',"], ["auArm('away', 15, 'Alex')", "auArm('away', 15, 'Master')"],
      ["auDisarm('Alex')", "auDisarm('Master')"], ["name: 'Alex’s key fob'", "name: 'Master’s key fob'"],
      // documentation zone names (title case, as in the guides)
      ["'Front door', 1, 1, 1]", "'Front Door', 1, 1, 1]"], ["'Garage door', 2, 3, 1]", "'Garage Door', 2, 3, 1]"],
      ["'Kitchen window', 3, 2, 1]", "'Kitchen Window', 3, 2, 1]"], ["'Hallway motion', 4, 4, 0]", "'Hallway Motion', 4, 4, 0]"],
      ["'Living room motion', 4, 4, 2]", "'Living Room Motion', 4, 4, 2]"], ["'Back door', 3, 1, 1]", "'Back Door', 3, 1, 1]"],
      ["'Hallway smoke', 9, 6, 0]", "'Hallway Smoke', 9, 6, 0]"], ["'Water heater leak', 8, 10, 0]", "'Water Heater Leak', 8, 10, 0]"],
      ["[18, 'Keyfob', 21", "[18, 'Key Fob', 21"], ["['Burglary alarm', 'Back door',", "['Burglary alarm', 'Back Door',"],
    ]) t = replace(t, from, to);
    // healthy power: the documentation's normal state has a charged backup battery
    t = replace(t, "power: {battery: 'absent', percent: 0,", "power: {battery: 'present', percent: 82,");
    output = Buffer.from(t);
  }
  if (name === 'mock-screen.cjs') {
    let t = original.toString();
    const start = t.indexOf('    let type, data;');
    const end = t.indexOf('    me.key = false;', start);
    if (start < 0 || end < 0) throw new Error('Screen transport fixture changed');
    // send a genuine 1024x600 LVGL frame as a still picture (type 4 = PNG) instead of the painted scene
    t = t.slice(0, start) + "    const type = 4;\n    const data = require('node:fs').readFileSync(require('node:path').join(__dirname, 'remote-keypad-frame.png'));\n" + t.slice(end);
    t = replace(t, "me.codec = m.codec === 'h264' ? 'h264' : 'jpeg';", "me.codec = 'jpeg'; // still-picture transport");
    t = replace(t, "in_use:Alex", "in_use:Master");
    output = Buffer.from(t);
  }
  await fs.writeFile(path.join(target, name), output);
  hashes.push({file: name, sourceSha256: digest(original), stagedSha256: digest(output), modified: !original.equals(output)});
}
await fs.copyFile(frame, path.join(target, 'remote-keypad-frame.png'));
await fs.writeFile(path.join(target, 'capture-manifest.json'), JSON.stringify({
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'}).trim(),
  staged: new Date().toISOString(), files: hashes, frame, frameSha256: digest(await fs.readFile(frame)),
}, null, 2) + '\n');
console.log(`Staged ${target}`);
