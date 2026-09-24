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


const logic = await import('../src/logic.ts');
assert.equal(logic.isLevelReference({b:0,g:0}), true);
assert.equal(logic.isLevelReference({b:181,g:0}), false);
assert.deepEqual(logic.levelDifference({b:0,g:0},{b:0,g:0}), {x:0,y:0,total:0,match:true});
assert.deepEqual(logic.sensorSample({db:-20,beta:10,gamma:Number.NaN,motion:2}), {db:-20,beta:10,motion:2});
assert.deepEqual(logic.updateSensorStats({}, {db:-20}), {db:{min:-20,max:-20}});
assert.deepEqual(logic.updateSensorStats({db:{min:-20,max:-10}}, {db:-30}), {db:{min:-30,max:-10}});
assert.equal(logic.markDelay(0), 0);
assert.equal(logic.markDelay(3000), 3000);
assert.equal(logic.markDelay(1200), null);
let race=[];
race=logic.addRaceResult(race,'b',200);
race=logic.addRaceResult(race,'a',100);
race=logic.addRaceResult(race,'a',300);
assert.deepEqual(race,[{id:'a',t:100},{id:'b',t:200}]);
assert.deepEqual(logic.raceDeltas(race),[{id:'a',t:100,delta:0},{id:'b',t:200,delta:100}]);
