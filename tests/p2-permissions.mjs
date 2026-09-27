import assert from 'node:assert/strict';
import {
  P2_IDS, P2_PERMISSIONS, P2_PLUGINS, P2_ROOM_APPS, P2_VERSION_CODE, P2_VERSION_NAME, MANAGED_PERMISSIONS, isP2,
} from '../scripts/p2-config.mjs';

assert.equal(P2_IDS.length, 12);
assert.equal(P2_VERSION_CODE, 2);
assert.equal(P2_VERSION_NAME, '1.0.1-beta.1');
for (const id of ['twinlevel', 'sensorlink', 'syncmark', 'soundrace']) {
  assert.equal(isP2(id), false);
}
for (const id of P2_IDS) {
  assert.ok(P2_PERMISSIONS[id]?.length, id);
  for (const perm of P2_PERMISSIONS[id]) assert.ok(MANAGED_PERMISSIONS.includes(perm), perm);
  if (P2_ROOM_APPS.includes(id)) {
    assert.ok(P2_PERMISSIONS[id].includes('android.permission.CAMERA'), `${id} keeps CAMERA for QR pairing`);
    assert.ok(P2_PERMISSIONS[id].includes('android.permission.INTERNET'), `${id} needs INTERNET`);
  }
}
assert.deepEqual(P2_PERMISSIONS.comparesound, ['android.permission.RECORD_AUDIO']);
assert.deepEqual(P2_PERMISSIONS.phablabphone, ['android.permission.RECORD_AUDIO']);
assert.deepEqual(P2_PERMISSIONS.framematch, ['android.permission.CAMERA']);
assert.deepEqual(P2_PERMISSIONS.lagcheck, ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO']);
assert.ok(!P2_PERMISSIONS.signme.includes('android.permission.RECORD_AUDIO'));
assert.ok(P2_PLUGINS.papercheck.includes('mlkit'));
assert.ok(P2_PLUGINS.captioncast.includes('speech'));
assert.deepEqual(P2_PLUGINS.wallcheck, []);
console.log('P2 permission map OK');
