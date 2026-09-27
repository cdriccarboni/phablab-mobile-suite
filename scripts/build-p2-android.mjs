import { spawnSync } from 'node:child_process';
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync, existsSync, chmodSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  P2_IDS, P2_VERSION_CODE, P2_VERSION_NAME, P2_PERMISSIONS, applyAndroidManifest,
} from './p2-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
if (!sdk) throw new Error('ANDROID_SDK_ROOT ou ANDROID_HOME est requis');
const only = process.argv.find((arg) => arg.startsWith('--app='))?.split('=')[1] || null;
const catalog = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));
const selected = catalog.filter((app) => P2_IDS.includes(app.id) && (!only || app.id === only));
if (only && selected.length !== 1) throw new Error(`App P2 inconnue: ${only}`);

const android = join(root, 'android');
const aapt = join(sdk, 'build-tools', '36.0.0', 'aapt');
const run = (cmd, args, cwd = root, env = process.env) => {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', env });
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} a quitté ${result.status}`);
};

rmSync(android, { recursive: true, force: true });
cpSync(join(root, 'android-base'), android, { recursive: true });
chmodSync(join(android, 'gradlew'), 0o755);
writeFileSync(join(android, 'local.properties'), `sdk.dir=${sdk.replaceAll('\\', '\\\\')}\n`);

const apkDir = join(root, 'release', 'apk');
const aabDir = join(root, 'release', 'aab');
mkdirSync(apkDir, { recursive: true });
mkdirSync(aabDir, { recursive: true });
const report = [];

function installIcons(appId) {
  const res = join(root, 'store', 'play', appId, 'res');
  const target = join(android, 'app', 'src', 'main', 'res');
  rmSync(join(target, 'drawable-v24', 'ic_launcher_foreground.xml'), { force: true });
  cpSync(res, target, { recursive: true });
}

function shortPermission(name) {
  return name.replace('android.permission.', '');
}

for (const app of selected) {
  const pkg = `com.phablabphone.${app.id}`;
  console.log(`\n===== ${app.name} · ${pkg} · ${P2_VERSION_NAME} =====`);
  run('npx', ['cap', 'sync', 'android'], root, {
    ...process.env,
    MOBILE_APP_ID: app.id,
    MOBILE_APP_NAME: app.name,
    VITE_APP_ID: app.id,
  });
  const gradleFile = join(android, 'app', 'build.gradle');
  let gradle = readFileSync(gradleFile, 'utf8');
  gradle = gradle.replace(/applicationId "[^"]+"/, `applicationId "${pkg}"`)
    .replace(/versionCode\s+\d+/, `versionCode ${P2_VERSION_CODE}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${P2_VERSION_NAME}"`);
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
  const rewritten = applyAndroidManifest(readFileSync(manifestFile, 'utf8'), app.id);
  writeFileSync(manifestFile, rewritten);

  const configFile = join(android, 'app', 'src', 'main', 'assets', 'capacitor.config.json');
  mkdirSync(dirname(configFile), { recursive: true });
  writeFileSync(configFile, JSON.stringify({
    appId: pkg,
    appName: app.name,
    webDir: `dist/${app.id}`,
    server: { androidScheme: 'https' },
    android: { allowMixedContent: false },
    ios: { contentInset: 'automatic' },
  }, null, 2));
  const publicDir = join(android, 'app', 'src', 'main', 'assets', 'public');
  rmSync(publicDir, { recursive: true, force: true });
  cpSync(join(root, 'dist', app.id), publicDir, { recursive: true });
  installIcons(app.id);

  run(join(android, 'gradlew'), [':app:clean', ':app:assembleDebug', ':app:bundleRelease', '--console=plain'], android);

  const apkBuilt = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const aabBuilt = join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  if (!existsSync(apkBuilt) || !existsSync(aabBuilt)) throw new Error(`Artefact manquant pour ${app.id}`);
  const apkName = `${app.id}-${P2_VERSION_NAME}-debug.apk`;
  const aabName = `${app.id}-${P2_VERSION_NAME}-unsigned.aab`;
  const apkTarget = join(apkDir, apkName);
  const aabTarget = join(aabDir, aabName);
  copyFileSync(apkBuilt, apkTarget);
  copyFileSync(aabBuilt, aabTarget);

  const badging = spawnSync(aapt, ['dump', 'badging', apkTarget], { encoding: 'utf8' });
  const perms = spawnSync(aapt, ['dump', 'permissions', apkTarget], { encoding: 'utf8' });
  if (badging.status !== 0 || perms.status !== 0) throw new Error(`aapt a échoué pour ${app.id}`);
  if (!badging.stdout.includes(`package: name='${pkg}'`)) throw new Error(`Mauvais package pour ${app.id}`);
  if (!badging.stdout.includes(`versionCode='${P2_VERSION_CODE}'`) || !badging.stdout.includes(`versionName='${P2_VERSION_NAME}'`)) {
    throw new Error(`Mauvaise version pour ${app.id}: ${badging.stdout.split('\n')[0]}`);
  }
  const dynamic = `${pkg}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`;
  const uses = [...perms.stdout.matchAll(/uses-permission: name='([^']+)'/g)].map((match) => match[1]);
  const actual = uses.filter((name) => name !== dynamic).sort();
  const expected = [...P2_PERMISSIONS[app.id]].sort();
  if (actual.join('\n') !== expected.join('\n') || !uses.includes(dynamic)) {
    throw new Error(`Permissions fusionnées inattendues pour ${app.id}\nattendu: ${expected.join(', ')} + ${dynamic}\nobtenu: ${uses.join(', ')}`);
  }
  const aabListing = spawnSync('jar', ['tf', aabTarget], { encoding: 'utf8' });
  const signedEntries = (aabListing.stdout || '').split('\n').filter((line) => /^META-INF\/.*\.(SF|RSA|DSA|EC)$/.test(line));
  const apkSha = createHash('sha256').update(readFileSync(apkTarget)).digest('hex');
  const aabSha = createHash('sha256').update(readFileSync(aabTarget)).digest('hex');
  report.push({
    id: app.id,
    name: app.name,
    packageName: pkg,
    versionCode: P2_VERSION_CODE,
    versionName: P2_VERSION_NAME,
    apk: `apk/${apkName}`,
    aab: `aab/${aabName}`,
    apkSha256: apkSha,
    aabSha256: aabSha,
    permissions: actual.map(shortPermission),
    androidxDynamicReceiver: true,
    aabPlayUploadSigned: false,
    aabSignatureEntries: signedEntries,
    icon: badging.stdout.includes('application-icon'),
  });
  console.log(`OK ${app.id} permissions=${actual.map(shortPermission).join(',')} apk=${apkSha.slice(0, 12)}`);
  writeFileSync(join(root, 'release', 'p2-report.json'), JSON.stringify(report, null, 2));
}

writeFileSync(join(root, 'release', 'p2-report.json'), JSON.stringify(report, null, 2));
console.log(`\nDONE: ${report.length} APK debug + AAB release (AAB non signé clé Play).`);
