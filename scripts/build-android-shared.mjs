import { spawnSync } from 'node:child_process';
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync
} from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const android = join(root, 'android');
const catalog = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));
const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
if (!sdk) throw new Error('ANDROID_SDK_ROOT is required');

const run = (cmd, args, cwd = root) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
};
const outDir = join(root, 'release', 'apk');
mkdirSync(outDir, { recursive: true });
const gradleFile = join(android, 'app', 'build.gradle');
const stringsFile = join(android, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const configFile = join(android, 'app', 'src', 'main', 'assets', 'capacitor.config.json');
const publicDir = join(android, 'app', 'src', 'main', 'assets', 'public');
const gradlew = join(android, 'gradlew');
const aapt = join(sdk, 'build-tools', '36.0.0', 'aapt');
const signer = join(sdk, 'build-tools', '36.0.0', 'apksigner');
const manifest = [];

for (const app of catalog) {
  const pkg = `com.phablabphone.${app.id}`;
  console.log(`\n===== ${app.name} · ${pkg} =====`);

  let g = readFileSync(gradleFile, 'utf8');
  g = g.replace(/applicationId "[^"]+"/, `applicationId "${pkg}"`);
  writeFileSync(gradleFile, g);
  const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  writeFileSync(stringsFile, `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${esc(app.name)}</string>
    <string name="title_activity_main">${esc(app.name)}</string>
    <string name="package_name">${pkg}</string>
    <string name="custom_url_scheme">${pkg}</string>
</resources>
`);

  const config = {
    appId: pkg, appName: app.name, webDir: `dist/${app.id}`,
    server: { androidScheme: 'https' },
    android: { allowMixedContent: false },
    ios: { contentInset: 'automatic' }
  };
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  rmSync(publicDir, { recursive: true, force: true });
  cpSync(join(root, 'dist', app.id), publicDir, { recursive: true });

  run(gradlew, ['assembleDebug', '--console=plain'], android);
  const built = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const target = join(outDir, `${app.id}-1.0.0.apk`);
  copyFileSync(built, target);

  run(signer, ['verify', '--verbose', target]);
  const badging = spawnSync(aapt, ['dump', 'badging', target], { encoding: 'utf8' });
  if (badging.status !== 0 || !badging.stdout.includes(`package: name='${pkg}'`)) {
    throw new Error(`Package verification failed for ${app.id}`);
  }
  const hash = createHash('sha256').update(readFileSync(target)).digest('hex');
  manifest.push({ id: app.id, name: app.name, packageName: pkg, apk: `apk/${app.id}-1.0.0.apk`, sha256: hash });
  console.log(`OK ${app.name}: ${target}`);
}

writeFileSync(join(root, 'release', 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nDONE: ${manifest.length} verified APKs.`);
