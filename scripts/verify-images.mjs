// Verify the screenshots: each file in public/images is in image-manifest.json with its size and
// hash, is used by a page, and is not blank.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve('.');
const images = path.join(root, 'public/images');
const { images: manifest } = JSON.parse(await fs.readFile(path.join(root, 'image-manifest.json'), 'utf8'));

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name))))).flat();
}
const pages = (await walk(path.join(root, 'src/content/docs'))).filter((f) => /\.mdx?$/.test(f));
const text = (await Promise.all(pages.map((f) => fs.readFile(f, 'utf8')))).join('\n');

const failures = [];
const listed = new Set(manifest.map((item) => item.file));
for (const file of await walk(images)) {
  const name = path.relative(images, file).replaceAll('\\', '/');
  if (!listed.has(name)) failures.push(`${name}: not in image-manifest.json`);
}
for (const item of manifest) {
  const location = path.join(images, item.file);
  let bytes;
  try { bytes = await fs.readFile(location); } catch { failures.push(`${item.file}: missing`); continue; }
  const metadata = await sharp(bytes).metadata();
  if (metadata.width !== item.width || metadata.height !== item.height) failures.push(`${item.file}: size differs from the manifest`);
  if (createHash('sha256').update(bytes).digest('hex') !== item.sha256) failures.push(`${item.file}: hash differs from the manifest`);
  if ((await sharp(bytes).stats()).channels.every((c) => c.stdev < 1)) failures.push(`${item.file}: image looks blank`);
  if (!text.includes(`/images/${item.file}`)) failures.push(`${item.file}: no page uses it`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Verified ${manifest.length} screenshots: listed, used, sizes, hashes and nonblank pixels.`);
