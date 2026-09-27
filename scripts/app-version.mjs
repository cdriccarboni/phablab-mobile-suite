import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const catalog = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'store', 'app-versions.json'), 'utf8'));

export function appVersion(id) {
  const found = catalog.apps?.[id];
  if (!found) return { versionName: catalog.baseline.versionName, versionCode: catalog.baseline.versionCode };
  return { versionName: found.versionName, versionCode: found.versionCode };
}
