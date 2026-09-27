import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const android = join(root, 'android');
const catalog = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));

const run = (cmd, args, cwd = root) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
};

const outDir = join(root, 'release', 'aab');
mkdirSync(outDir, { recursive: true });
const gradleFile = join(android, 'app', 'build.gradle');
const stringsFile = join(android, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const configFile = join(android, 'app', 'src', 'main', 'assets', 'capacitor.config.json');
const publicDir = join(android, 'app', 'src', 'main', 'assets', 'public');
const gradlew = join(android, 'gradlew');
const manifest = [];

for (const app of catalog) {
  const pkg = `com.phablabphone.${app.id}`;
  console.log(`\n===== AAB ${app.name} · ${pkg} =====`);

  let g = readFileSync(gradleFile, 'utf8');
  g = g.replace(/namespace\s*=\s*"[^"]+"/, `namespace = "${pkg}"`)
       .replace(/applicationId\s+"[^"]+"/, `applicationId "${pkg}"`)
       .replace(/versionCode\s+\d+/, 'versionCode 1')
       .replace(/versionName\s+"[^"]+"/, 'versionName "1.0.0"');
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
    appId: pkg,
    appName: app.name,
    webDir: `dist/${app.id}`,
    server: { androidScheme: 'https' },
    android: { allowMixedContent: false },
    ios: { contentInset: 'automatic' }
  };
  mkdirSync(dirname(configFile), { recursive: true });
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  rmSync(publicDir, { recursive: true, force: true });
  cpSync(join(root, 'dist', app.id), publicDir, { recursive: true });

  run(gradlew, ['bundleRelease', '--console=plain'], android);
  const built = join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  if (!existsSync(built)) throw new Error(`Missing AAB for ${app.id}`);
  const target = join(outDir, `${app.id}-1.0.0-unsigned.aab`);
  copyFileSync(built, target);
  const hash = createHash('sha256').update(readFileSync(target)).digest('hex');
  manifest.push({
    id: app.id,
    name: app.name,
    packageName: pkg,
    versionCode: 1,
    versionName: '1.0.0',
    aab: `aab/${app.id}-1.0.0-unsigned.aab`,
    signed: false,
    sha256: hash
  });
  console.log(`OK ${app.name}: ${target}`);
}

writeFileSync(join(root, 'release', 'aab-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nDONE: ${manifest.length} release AABs prepared (unsigned, not uploaded).`);
