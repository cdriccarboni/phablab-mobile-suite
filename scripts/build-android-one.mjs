import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appVersion } from './app-version.mjs';
import { stampLauncher } from './stamp-launcher.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const id = process.env.APP_ID;
if (!id) throw new Error('APP_ID is required');
const catalog = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));
const app = catalog.find((item) => item.id === id);
if (!app) throw new Error(`Unknown app ${id}`);
const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
if (!sdk) throw new Error('ANDROID_SDK_ROOT is required');

const run = (cmd, args, cwd = root) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw new Error(`${cmd} exited ${result.status}`);
};

const android = join(root, 'android');
const version = appVersion(app.id);
const pkg = `com.phablabphone.${app.id}`;
const outDir = join(root, 'release', 'apk');
mkdirSync(outDir, { recursive: true });
const gradleFile = join(android, 'app', 'build.gradle');
const stringsFile = join(android, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const configFile = join(android, 'app', 'src', 'main', 'assets', 'capacitor.config.json');
const publicDir = join(android, 'app', 'src', 'main', 'assets', 'public');
mkdirSync(dirname(configFile), { recursive: true });

let gradle = readFileSync(gradleFile, 'utf8');
gradle = gradle.replace(/namespace\s*=\s*"[^"]+"/, `namespace = "${pkg}"`)
  .replace(/applicationId\s+"[^"]+"/, `applicationId "${pkg}"`)
  .replace(/versionCode\s+\d+/, `versionCode ${version.versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${version.versionName}"`);
writeFileSync(gradleFile, gradle);
stampLauncher(join(android, 'app', 'src', 'main', 'res'), app.id, root);

const esc = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
writeFileSync(stringsFile, `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${esc(app.name)}</string>
    <string name="title_activity_main">${esc(app.name)}</string>
    <string name="package_name">${pkg}</string>
    <string name="custom_url_scheme">${pkg}</string>
</resources>
`);
writeFileSync(configFile, JSON.stringify({
  appId: pkg,
  appName: app.name,
  webDir: `dist/${app.id}`,
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' },
}, null, 2));
rmSync(publicDir, { recursive: true, force: true });
cpSync(join(root, 'dist', app.id), publicDir, { recursive: true });

run(join(android, 'gradlew'), ['assembleDebug', '--console=plain'], android);
const built = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const target = join(outDir, `${app.id}-${version.versionName}.apk`);
copyFileSync(built, target);

const signer = join(sdk, 'build-tools', '36.0.0', 'apksigner');
const aapt = join(sdk, 'build-tools', '36.0.0', 'aapt');
run(signer, ['verify', '--verbose', target]);
const badging = spawnSync(aapt, ['dump', 'badging', target], { encoding: 'utf8' });
if (badging.status !== 0 || !badging.stdout.includes(`package: name='${pkg}'`) || !badging.stdout.includes(`versionCode='${version.versionCode}'`) || !badging.stdout.includes(`versionName='${version.versionName}'`)) {
  throw new Error(`Package verification failed for ${app.id}\n${badging.stdout}\n${badging.stderr}`);
}
const hash = createHash('sha256').update(readFileSync(target)).digest('hex');
const record = { id: app.id, name: app.name, packageName: pkg, versionName: version.versionName, versionCode: version.versionCode, apk: `apk/${app.id}-${version.versionName}.apk`, sha256: hash };
writeFileSync(join(root, 'release', `${app.id}-manifest.json`), JSON.stringify(record, null, 2));
console.log(`OK ${app.name}: ${target}`);
console.log(`SHA-256 ${hash}`);
