/**
 * Convex CLI resolves packages from monkeymask-website/node_modules only.
 * In this npm workspace, `convex` is hoisted to the repo root — link it so
 * `npx convex dev|deploy` works from monkeymask-website/.
 */
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const websiteNodeModules = join(root, 'monkeymask-website', 'node_modules');
const packages = ['convex'];

for (const name of packages) {
  const target = join(root, 'node_modules', name);
  const link = join(websiteNodeModules, name);
  if (!existsSync(target)) continue;
  mkdirSync(websiteNodeModules, { recursive: true });
  if (existsSync(link)) rmSync(link, { recursive: true, force: true });
  symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`Linked ${name} → monkeymask-website/node_modules/${name}`);
}
