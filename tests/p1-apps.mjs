import assert from 'node:assert/strict';
import {
  applyLevelZero, emptySensorLinkStore, isLevelReference, isSensorLinkStore, isSoundStore, isSyncStore, isTwinStore,
  levelDifference, raceDeltas, relativeMotion, restoreState, suggestRaceThreshold,
} from '../src/logic.ts';

assert.equal(isLevelReference({ b: 0, g: 120 }), true);
assert.equal(isLevelReference({ b: 0, g: 181 }), false);

const pose = { b: 12, g: -4 };
assert.deepEqual(applyLevelZero(pose, null), pose);
assert.deepEqual(applyLevelZero(pose, pose), { b: 0, g: 0 });
assert.equal(applyLevelZero({ b: 999, g: 0 }, null), null);
const zeroed = applyLevelZero({ b: 12, g: -4 }, { b: 10, g: -4 });
assert.ok(zeroed);
assert.equal(levelDifference(zeroed, { b: 2, g: 0 })?.match, true);

const twin = { version: 1, reference: { b: 1, g: 2 }, zero: null };
assert.equal(isTwinStore(twin), true);
assert.equal(isTwinStore({ version: 1, reference: { b: 1, g: 200 }, zero: null }), false);
assert.deepEqual(restoreState(JSON.stringify(twin), isTwinStore, { version: 1, reference: null, zero: null }).state, twin);
assert.equal(restoreState('{', isTwinStore, twin).restored, false);
assert.equal(restoreState('{"version":2}', isTwinStore, twin).restored, false);
assert.equal(restoreState(null, isTwinStore, twin).restored, false);

assert.equal(relativeMotion(9.81, 9.81), 0);
assert.equal(relativeMotion(9.81, null), 9.81);
assert.equal(relativeMotion(Number.NaN, 0), null);
const sensor = emptySensorLinkStore();
sensor.tare = 9.81;
sensor.lastRemote = { db: -20, motion: 0.2 };
sensor.stats = { db: { min: -20, max: -10 } };
assert.equal(isSensorLinkStore(sensor), true);
assert.equal(isSensorLinkStore({ ...sensor, lastRemote: { db: -20, extra: 1 } }), false);
assert.equal(isSensorLinkStore({ ...sensor, tare: Number.POSITIVE_INFINITY }), false);

assert.equal(isSyncStore({ version: 1, delay: 0, marks: [1000] }), true);
assert.equal(isSyncStore({ version: 1, delay: 1200, marks: [] }), false);
assert.equal(isSyncStore({ version: 1, delay: 1000, marks: [1, 2, 3, 4, 5, 6, 7, 8, 9] }), false);

assert.equal(suggestRaceThreshold(0)?.suggested, 0.05);
assert.equal(suggestRaceThreshold(0.1)?.suggested, 0.15);
assert.equal(suggestRaceThreshold(0.3)?.clipped, true);
assert.equal(suggestRaceThreshold(0.3)?.suggested, 0.35);
assert.equal(suggestRaceThreshold(Number.NaN), null);
assert.equal(isSoundStore({ version: 1, threshold: 0.18, heard: [{ id: 'a', t: 10 }] }), true);
assert.equal(isSoundStore({ version: 1, threshold: 0.04, heard: [] }), false);
assert.deepEqual(raceDeltas([]), []);

console.log('P1 app logic OK');
