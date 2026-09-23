import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('../apps.json', import.meta.url), 'utf8'));
mkdirSync(new URL('../release/apk/', import.meta.url), { recursive: true });
mkdirSync(new URL('../release/aab/', import.meta.url), { recursive: true });

const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, {
    cwd: new URL('..', import.meta.url),
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
  if (r.status !== 0) throw new Error(`${cmd} failed with ${r.status}`);
};
for (const app of catalog) {
  console.log(`\n===== ANDROID ${app.name} (${app.id}) =====`);
  run('node', ['scripts/prepare-native.mjs', 'android'], {
    MOBILE_APP_ID: app.id,
    MOBILE_APP_NAME: app.name,
    VITE_APP_ID: app.id
  });

  const androidDir = new URL('../android/', import.meta.url);
  const gradlew = new URL('gradlew', androidDir).pathname;
  const g = spawnSync(gradlew, ['assembleDebug'], {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env
  });
  if (g.status !== 0) throw new Error(`${gradlew} failed with ${g.status}`);

  const apk = new URL('../android/app/build/outputs/apk/debug/app-debug.apk', import.meta.url);
  if (!existsSync(apk)) throw new Error(`Missing APK for ${app.id}`);
  copyFileSync(apk, new URL(`../release/apk/${app.id}-1.0.0.apk`, import.meta.url));
}

console.log('\nBuilt Android artifacts for all 16 apps.');
