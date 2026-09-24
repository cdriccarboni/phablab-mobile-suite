import assert from 'node:assert/strict';
import { normalizeRoom, SeenMessages, emptyCounter, reduceCounter, summarize, angleDelta, avOffset } from '../src/logic.ts';

assert.equal(normalizeRoom(' PHAB:abc123 '), 'ABC123');
assert.equal(normalizeRoom('phab-abc123'), 'ABC123');
assert.equal(normalizeRoom('abc12'), null);
assert.equal(normalizeRoom('abc12!'), null);

const seen = new SeenMessages();
assert.equal(seen.accept('one'), true);
assert.equal(seen.accept('one'), false);
seen.clear();
assert.equal(seen.accept('one'), true);

let counter = emptyCounter();
counter = reduceCounter(counter, { delta: 1 }, 'phone-abcdef');
assert.equal(counter.value, 1);
assert.equal(counter.revision, 1);
assert.match(counter.history[0], /\+1$/);
const stale = reduceCounter(counter, { reset: true, revision: 0 }, 'phone-abcdef');
assert.deepEqual(stale, counter);
counter = reduceCounter(counter, { reset: true, revision: 1 }, 'phone-abcdef');
assert.equal(counter.value, 0);
assert.equal(counter.revision, 2);
assert.deepEqual(reduceCounter(counter, { delta: 2 }, 'x'), counter);

assert.deepEqual(summarize([]), null);
assert.deepEqual(summarize([3,1,2]), { count: 3, median: 2, min: 1, max: 3 });
assert.equal(summarize([Number.MAX_VALUE, Number.MAX_VALUE])?.median, Number.MAX_VALUE);
assert.equal(angleDelta(10, 350), 20);
assert.equal(angleDelta(350, 10), -20);
assert.equal(angleDelta(-10, 10), -20);
assert.equal(avOffset(120, 100), 20);
assert.equal(avOffset(null, 100), null);
assert.equal(avOffset(Number.NaN, 100), null);

console.log('Core logic OK');
