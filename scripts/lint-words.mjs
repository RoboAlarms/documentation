// Report words and sentences that break docs/writing-guide.md. It reads the page text only:
// frontmatter, imports, components' attributes, code and link targets are left out.
// Run: node scripts/lint-words.mjs [--strict]   (--strict exits 1 when it finds something)
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('src/content/docs');
const rules = [
  [/\b(?:don't|doesn't|can't|won't|isn't|aren't|it's|you'll|you're|we're|didn't|wasn't|shouldn't|couldn't|wouldn't|that's|there's|let's)\b/i, 'contraction'],
  [/\b(?:should|may|might|could)\b/i, 'vague modal: use can, must or do not'],
  [/\b(?:please|simply|just|easily|seamless(?:ly)?|powerful|robust)\b/i, 'filler or marketing word'],
  [/\b(?:utilize|leverage|ensure|facilitate|initiate|terminate|prior to|via)\b/i, 'complex word'],
  [/\b(?:tap|taps|tapped|tapping|press|presses|pressed|hit)\b/i, 'use push (touchscreen) or click (browser)'],
  [/\b(?:7-inch|10\.1-inch|4-inch|screen size)\b/i, 'screen size'],
  [/\b(?:screenshot|edition|simulator|preview build|captured)\b/i, 'documentation about the documentation'],
];
const strip = (text) => text
  .replace(/^---[\s\S]*?\n---/, '')
  .replace(/^import .*$/gm, '')
  .replace(/```[\s\S]*?```/g, '')
  .replace(/`[^`]*`/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\]\([^)]*\)/g, ']')
  .replace(/^\|[\s|:-]+\|$/gm, '');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name))))).flat();
}
let count = 0;
for (const file of (await walk(root)).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))) {
  const lines = strip(await fs.readFile(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    // Quoted words on the screen (in bold or quotes) are labels, not our sentences.
    const prose = line.replace(/\*\*[^*]+\*\*/g, 'X').replace(/"[^"]*"/g, 'X').replace(/“[^”]*”/g, 'X');
    for (const [pattern, why] of rules) {
      const m = prose.match(pattern);
      if (m) { console.log(`${path.relative(root, file)}:${i + 1}: ${why}: "${m[0]}"`); count++; }
    }
    for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
      const words = sentence.replace(/^[\s|>*\d.-]+/, '').split(/\s+/).filter((w) => /[a-z]/i.test(w));
      if (words.length > 25 && !prose.trim().startsWith('|')) { console.log(`${path.relative(root, file)}:${i + 1}: long sentence (${words.length} words)`); count++; }
    }
  });
}
console.log(`${count} findings.`);
if (count && process.argv.includes('--strict')) process.exitCode = 1;
