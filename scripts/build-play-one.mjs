import { spawnSync } from 'node:child_process';
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync, existsSync, chmodSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionFor, isP2, P2_PERMISSIONS, applyAndroidManifest } from './p2-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
if (!sdk) throw new Error('ANDROID_SDK_ROOT ou ANDROID_HOME est requis');

const play = JSON.parse(readFileSync(join(root, 'play-app.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));
const app = catalog.find((entry) => entry.id === play.id);
if (!app) throw new Error(`Application inconnue: ${play.id}`);
const id = app.id;
const pkg = `com.phablabphone.${id}`;
if (play.packageName !== pkg) throw new Error(`Package Play incohérent: ${play.packageName} != ${pkg}`);
const version = versionFor(id);

const android = join(root, 'android');
const outDir = join(root, 'release', 'play', id);
const aapt = join(sdk, 'build-tools', '36.0.0', 'aapt');
const run = (cmd, args, cwd = root, env = process.env) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', env });
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} a quitté ${result.status}`);
};

rmSync(android, { recursive: true, force: true });
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'android-base'), android, { recursive: true });
chmodSync(join(android, 'gradlew'), 0o755);
writeFileSync(join(android, 'local.properties'), `sdk.dir=${sdk.replaceAll('\\\\', '\\\\\\\\')}\n`);

run('npx', ['vite', 'build', '--outDir', `dist/${id}`], root, { ...process.env, VITE_APP_ID: id });
run('npx', ['cap', 'sync', 'android'], root, {
  ...process.env,
  MOBILE_APP_ID: id,
  MOBILE_APP_NAME: app.name,
  VITE_APP_ID: id,
});

const gradleFile = join(android, 'app', 'build.gradle');
let gradle = readFileSync(gradleFile, 'utf8');
gradle = gradle.replace(/applicationId "[^"]+"/, `applicationId "${pkg}"`)
  .replace(/versionCode\s+\d+/, `versionCode ${version.versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${version.versionName}"`);
writeFileSync(gradleFile, gradle);

const esc = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
writeFileSync(join(android, 'app', 'src', 'main', 'res', 'values', 'strings.xml'), `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${esc(app.name)}</string>
    <string name="title_activity_main">${esc(app.name)}</string>
    <string name="package_name">${pkg}</string>
    <string name="custom_url_scheme">${pkg}</string>
</resources>
`);

const manifestFile = join(android, 'app', 'src', 'main', 'AndroidManifest.xml');
if (isP2(id)) {
  writeFileSync(manifestFile, applyAndroidManifest(readFileSync(manifestFile, 'utf8'), id));
}

const configFile = join(android, 'app', 'src', 'main', 'assets', 'capacitor.config.json');
mkdirSync(dirname(configFile), { recursive: true });
writeFileSync(configFile, JSON.stringify({
  appId: pkg,
  appName: app.name,
  webDir: `dist/${id}`,
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' },
}, null, 2));

const publicDir = join(android, 'app', 'src', 'main', 'assets', 'public');
rmSync(publicDir, { recursive: true, force: true });
cpSync(join(root, 'dist', id), publicDir, { recursive: true });

const storeRes = join(root, 'store', 'play', id, 'res');
const androidRes = join(android, 'app', 'src', 'main', 'res');
if (existsSync(storeRes)) {
  rmSync(join(androidRes, 'drawable-v24', 'ic_launcher_foreground.xml'), { force: true });
  cpSync(storeRes, androidRes, { recursive: true });
} else {
  run('python3', ['scripts/prepare-android-launcher.py', androidRes, id], root);
}

run(join(android, 'gradlew'), [':app:clean', ':app:assembleDebug', ':app:bundleRelease', '--console=plain'], android);

const apkBuilt = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const aabBuilt = join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
if (!existsSync(apkBuilt) || !existsSync(aabBuilt)) throw new Error(`Artefact manquant pour ${id}`);

const badging = spawnSync(aapt, ['dump', 'badging', apkBuilt], { encoding: 'utf8' });
if (badging.status !== 0 || !badging.stdout.includes(`package: name='${pkg}'`)) {
  throw new Error(`Package Android incorrect pour ${id}`);
}
if (!badging.stdout.includes(`versionCode='${version.versionCode}'`) || !badging.stdout.includes(`versionName='${version.versionName}'`)) {
  throw new Error(`Version Android incorrecte pour ${id}`);
}

if (isP2(id)) {
  const perms = spawnSync(aapt, ['dump', 'permissions', apkBuilt], { encoding: 'utf8' });
  if (perms.status !== 0) throw new Error(`Permissions illisibles pour ${id}`);
  const dynamic = `${pkg}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`;
  const uses = [...perms.stdout.matchAll(/uses-permission: name='([^']+)'/g)].map((m) => m[1]);
  const actual = uses.filter((name) => name !== dynamic).sort();
  const expected = [...P2_PERMISSIONS[id]].sort();
  if (actual.join('\n') !== expected.join('\n') || !uses.includes(dynamic)) {
    throw new Error(`Permissions inattendues pour ${id}: ${uses.join(', ')}`);
  }
}

const signing = {
  store: process.env.PHABLAB_UPLOAD_STORE_FILE,
  storePassword: process.env.PHABLAB_UPLOAD_STORE_PASSWORD,
  alias: process.env.PHABLAB_UPLOAD_KEY_ALIAS,
  keyPassword: process.env.PHABLAB_UPLOAD_KEY_PASSWORD,
};
const signingReady = Object.values(signing).every(Boolean);
const unsignedName = `${app.name.replace(/[^A-Za-z0-9._-]+/g, '-')}-${version.versionName}-unsigned.aab`;
const playName = `${app.name.replace(/[^A-Za-z0-9._-]+/g, '-')}-${version.versionName}-PLAY.aab`;
const aabTarget = join(outDir, signingReady ? playName : unsignedName);
copyFileSync(aabBuilt, aabTarget);

if (signingReady) {
  run('jarsigner', [
    '-keystore', signing.store,
    '-storepass', signing.storePassword,
    '-keypass', signing.keyPassword,
    aabTarget,
    signing.alias,
  ]);
  run('jarsigner', ['-verify', '-verbose', '-certs', aabTarget]);
}

const aabSha = createHash('sha256').update(readFileSync(aabTarget)).digest('hex');
const result = {
  id,
  name: app.name,
  packageName: pkg,
  versionCode: version.versionCode,
  versionName: version.versionName,
  aab: aabTarget.slice(root.length + 1),
  aabSha256: aabSha,
  playUploadSigned: signingReady,
  track: 'closed-testing',
  listing: play.listing,
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

if (process.env.REQUIRE_PLAY_SIGNING === '1' && !signingReady) {
  throw new Error('AAB construit mais non publiable Play : secrets PHABLAB_UPLOAD_* absents.');
}
