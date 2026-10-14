// Validate the generated site's local links, anchors and image assets.
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
async function walk(dir) {
  const entries = await fs.readdir(dir, {withFileTypes:true});
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir,e.name)) : path.join(dir,e.name)))).flat();
}
const files = await walk(root);
const available = new Set(files);
const html = new Map(await Promise.all(files.filter(f=>f.endsWith('.html')).map(async f=>[f,await fs.readFile(f,'utf8')])));
const failures = [];
let checked = 0;
for (const [file,text] of html) {
  for (const match of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1].replaceAll('&amp;','&');
    if (/^(?:https?:|mailto:|data:|javascript:)/.test(ref)) continue;
    const [pathname, fragment] = ref.split('#');
    const clean = pathname.split('?')[0];
    let target = clean ? path.resolve(clean.startsWith('/') ? root : path.dirname(file), '.' + (clean.startsWith('/') ? clean : '/' + clean)) : file;
    if (!available.has(target)) target = path.join(target, 'index.html');
    checked++;
    if (!available.has(target)) failures.push(`${path.relative(root,file)}: missing ${ref}`);
    else if (fragment && html.has(target) && !html.get(target).includes(`id="${decodeURIComponent(fragment)}"`)) failures.push(`${path.relative(root,file)}: missing anchor ${ref}`);
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode=1; }
else console.log(`Verified ${checked} local references across ${html.size} pages.`);
