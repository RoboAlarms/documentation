// Copy and crop the chosen screenshots into public/images, and record them in image-manifest.json.
//
// Each file in tools-capture/shots/*.json is a list of entries:
//   { "out": "panel/arm-away.png", "from": "panel/03_pad_arm_away.png",
//     "crop": { "left": 0, "top": 0, "width": 1024, "height": 600 } }   // crop is optional
//   { "out": "home-assistant/connect.png", "keep": true }                // a file already in public/images
// "from" is relative to the capture folder (default .capture/, from tools-capture/capture-panel.ps1
// and the browser captures). Run from the repository root: node tools-capture/curate.mjs [captureDir]
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve('.');
const captures = path.resolve(process.argv[2] ?? '.capture');
const images = path.join(root, 'public/images');
const specDir = path.join(root, 'tools-capture/shots');

const entries = [];
for (const name of (await fs.readdir(specDir)).filter((f) => f.endsWith('.json')).sort()) {
  for (const entry of JSON.parse(await fs.readFile(path.join(specDir, name), 'utf8'))) entries.push({ ...entry, spec: name });
}
const seen = new Map();
for (const entry of entries) {
  if (seen.has(entry.out) && JSON.stringify({ ...seen.get(entry.out), spec: 0 }) !== JSON.stringify({ ...entry, spec: 0 })) {
    throw new Error(`${entry.out} is defined differently in ${seen.get(entry.out).spec} and ${entry.spec}`);
  }
  seen.set(entry.out, entry);
}

const manifest = [];
for (const entry of seen.values()) {
  const target = path.join(images, entry.out);
  if (!entry.keep) {
    const source = path.join(captures, entry.from);
    let image = sharp(source);
    if (entry.crop) image = image.extract(entry.crop);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await image.png({ compressionLevel: 9 }).toFile(target);
  }
  const bytes = await fs.readFile(target);
  const { width, height } = await sharp(bytes).metadata();
  manifest.push({
    file: entry.out,
    source: entry.keep ? 'retained' : entry.from,
    crop: entry.crop ?? null,
    width,
    height,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
manifest.sort((a, b) => a.file.localeCompare(b.file));
await fs.writeFile(path.join(root, 'image-manifest.json'), JSON.stringify({ images: manifest }, null, 2) + '\n');
console.log(`Curated ${manifest.length} images into public/images and image-manifest.json.`);
