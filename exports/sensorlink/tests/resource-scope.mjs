import assert from 'node:assert/strict';
import { ResourceScope, openMedia, resourceScope, stopResources } from '../src/runtime.ts';

const scope = new ResourceScope();
let runs = 0;
scope.own(() => { runs += 1; });
scope.close();
assert.equal(runs, 1);
scope.close();
assert.equal(runs, 1);
assert.equal(scope.closed, true);
assert.throws(() => scope.check(), /Stopped/);
scope.own(() => { runs += 1; });
assert.equal(runs, 2);

const live = resourceScope();
let stopped = 0;
live.own(() => { stopped += 1; });
stopResources();
assert.equal(live.closed, true);
assert.equal(stopped, 1);

const unused = resourceScope();
await assert.rejects(() => openMedia(unused, { audio: true }), /unavailable/);
unused.close();
assert.equal(unused.closed, true);

console.log('Resource scope OK');
