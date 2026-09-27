import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const root = new URL('..', import.meta.url);
const versions = JSON.parse(readFileSync(new URL('../store/app-versions.json', import.meta.url), 'utf8'));
assert.equal(versions.baseline.versionName, '1.0.0');
assert.equal(versions.baseline.versionCode, 1);
for (const id of ['twinlevel', 'sensorlink', 'syncmark', 'soundrace']) {
  assert.equal(versions.apps[id].versionName, '1.0.1');
  assert.ok(versions.apps[id].versionCode > versions.baseline.versionCode);
}

const out = mkdtempSync(join(tmpdir(), 'phab-export-'));
const ids = ['twinlevel', 'sensorlink', 'syncmark', 'soundrace'];
const exported = spawnSync(process.execPath, ['scripts/export-standalone.mjs', '--apply', `--out=${out}`, ...ids.flatMap((id) => [])], {
  cwd: new URL(root).pathname,
  stdio: 'inherit',
});
if (exported.status !== 0) process.exit(exported.status ?? 1);

const forbidden = {
  twinlevel: ['function SensorLink', 'function SyncMark', 'function SoundRace'],
  sensorlink: ['function TwinLevel', 'function SyncMark', 'function SoundRace'],
  syncmark: ['function TwinLevel', 'function SensorLink', 'function SoundRace'],
  soundrace: ['function TwinLevel', 'function SensorLink', 'function SyncMark'],
};
const hashes = [];
for (const id of ids) {
  const dir = join(out, id);
  for (const file of ['src/logic.ts', 'src/runtime.ts', 'src/session.ts', 'src/apps.tsx', 'CHANGELOG.md', 'NOTICE.md', 'store-listing.json', 'PUSH.md', `public/logos/${id}.svg`]) {
    assert.equal(existsSync(join(dir, file)), true, `missing ${id}/${file}`);
  }
  const source = readFileSync(join(dir, 'src/apps.tsx'), 'utf8');
  assert.match(source, new RegExp(`function ${id === 'twinlevel' ? 'TwinLevel' : id === 'sensorlink' ? 'SensorLink' : id === 'syncmark' ? 'SyncMark' : 'SoundRace'}`));
  for (const needle of forbidden[id]) assert.equal(source.includes(needle), false, `${id} still contains ${needle}`);
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '1.0.1');
  assert.equal(pkg.private, true);
  const cap = readFileSync(join(dir, 'capacitor.config.ts'), 'utf8');
  assert.match(cap, new RegExp(`com\\.phablabphone\\.${id}`));
  const logo = readFileSync(join(dir, `public/logos/${id}.svg`));
  hashes.push(createHash('sha256').update(logo).digest('hex'));
  symlinkSync(join(new URL(root).pathname, 'node_modules'), join(dir, 'node_modules'), 'dir');
  const test = spawnSync(process.execPath, ['--experimental-strip-types', 'tests/p1-apps.mjs'], { cwd: dir, stdio: 'inherit' });
  if (test.status !== 0) process.exit(test.status ?? 1);
}
assert.equal(new Set(hashes).size, ids.length);
rmSync(out, { recursive: true, force: true });
console.log('Standalone export OK');
