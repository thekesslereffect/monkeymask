// Renders extension toolbar / store PNGs from icons/icon.svg (same mark as
// monkeymask-website/src/app/icon.svg). Run from the repo root:
//
//   node extension/scripts/generate-icons.mjs

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(path.join(root, 'icons', 'icon.svg'), 'utf8');
const outDir = path.join(root, 'icons');
const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(out);
  console.log(`wrote ${out}`);
}
