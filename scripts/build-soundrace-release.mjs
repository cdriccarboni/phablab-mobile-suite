import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appVersion } from './app-version.mjs';
import { stampLauncher } from './stamp-launcher.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const id = 'soundrace';
const pkg = `com.phablabphone.${id}`;
const name = 'SoundRace';
const version = appVersion(id);
const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
const javaHome = process.env.JAVA_HOME;

if (!sdk) throw new Error('ANDROID_SDK_ROOT is required');
if (!javaHome) throw new Error('JAVA_HOME is required');

const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  PATH: `${join(javaHome, 'bin')}:${process.env.PATH}`,
};
const run = (command, args, cwd = root, extraEnv = {}) => {
  const result = spawnSync(command, args, { cwd, env: { ...env, ...extraEnv }, encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
  return result;
};

const android = join(root, 'android');
const gradleFile = join(android, 'app', 'build.gradle');
if (existsSync(android)) {
  if (!existsSync(gradleFile) || !readFileSync(gradleFile, 'utf8').includes(`applicationId "${pkg}"`)) {
    throw new Error('android/ belongs to another generated app; use a clean worktree');
  }
} else {
  run('npx', ['cap', 'add', 'android'], root, { MOBILE_APP_ID: id, MOBILE_APP_NAME: name });
}

run('npx', ['vite', 'build', '--outDir', `dist/${id}`], root, { VITE_APP_ID: id });
run('npx', ['cap', 'sync', 'android'], root, { MOBILE_APP_ID: id, MOBILE_APP_NAME: name });

let gradle = readFileSync(gradleFile, 'utf8');
gradle = gradle.replace(/namespace\s*=\s*"[^"]+"/, `namespace = "${pkg}"`)
  .replace(/applicationId\s+"[^"]+"/, `applicationId "${pkg}"`)
  .replace(/versionCode\s+\d+/, `versionCode ${version.versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${version.versionName}"`);
writeFileSync(gradleFile, gradle);
stampLauncher(join(android, 'app', 'src', 'main', 'res'), id, root);

run('./gradlew', [':app:assembleDebug', ':app:bundleRelease', '--console=plain'], android);

const apk = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const aab = join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
if (!existsSync(apk) || !existsSync(aab)) throw new Error('Missing SoundRace Android artifact');

const aapt = join(sdk, 'build-tools', '36.0.0', 'aapt');
const badging = run(aapt, ['dump', 'badging', apk]);
if (!badging.stdout.includes(`package: name='${pkg}'`) || !badging.stdout.includes(`versionCode='${version.versionCode}'`) || !badging.stdout.includes(`versionName='${version.versionName}'`)) {
  throw new Error('SoundRace APK package or version verification failed');
}

const listing = run(join(javaHome, 'bin', 'jar'), ['tf', aab]);
if (!listing.stdout.includes('BundleConfig.pb') || !listing.stdout.includes('base/manifest/AndroidManifest.xml')) {
  throw new Error('SoundRace AAB structure verification failed');
}
const signature = run(join(javaHome, 'bin', 'jarsigner'), ['-verify', '-strict', '-certs', aab]);
if (!`${signature.stdout}${signature.stderr}`.includes('jar is unsigned.')) {
  throw new Error('SoundRace release AAB must stay unsigned before upload signing');
}

const output = join(root, 'release', 'aab');
mkdirSync(output, { recursive: true });
const filename = `${id}-${version.versionName}-unsigned.aab`;
const target = join(output, filename);
copyFileSync(aab, target);
const sha256 = createHash('sha256').update(readFileSync(target)).digest('hex');
writeFileSync(join(root, 'release', `${id}-release.json`), JSON.stringify({
  id,
  packageName: pkg,
  versionName: version.versionName,
  versionCode: version.versionCode,
  aab: `aab/${filename}`,
  sha256,
  signed: false,
}, null, 2));

console.log(`OK ${name}: ${target}`);
console.log(`SHA-256 ${sha256}`);
