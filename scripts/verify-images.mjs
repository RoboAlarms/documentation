// Verify every curated screenshot's manifest, dimensions and optional content hash.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root = path.resolve('.');
let count=0;
for (const [manifestName,folder] of [['image-manifest.json','panel'],['home-assistant-manifest.json','home-assistant'],['browser-image-manifest.json','']]) {
  const manifest=JSON.parse(await fs.readFile(path.join(root,manifestName),'utf8'));
  for (const item of manifest.images) {
    const location=path.join(root,'public/images',folder,item.file);
    const bytes=await fs.readFile(location);
    const metadata=await sharp(bytes).metadata();
    const width=item.crop?.width ?? item.width ?? 1024;
    const height=item.crop?.height ?? item.height ?? 600;
    if(metadata.width!==width || metadata.height!==height) throw new Error(`${location}: dimensions differ from manifest`);
    if(item.sha256 && createHash('sha256').update(bytes).digest('hex')!==item.sha256) throw new Error(`${location}: hash differs from manifest`);
    const stats=await sharp(bytes).stats();
    if(stats.channels.every(c=>c.stdev<1)) throw new Error(`${location}: image appears blank`);
    count++;
  }
}
console.log(`Verified ${count} screenshot files, dimensions, recorded hashes and nonblank pixels. Visual review remains required.`);
