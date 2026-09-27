import assert from 'node:assert/strict';
import { emptyCounter, reduceCounter, avOffset } from '../src/logic.ts';
import {
  relativeLevelChange, normalizeCaption, pushCaption, parseSignPayload, checklistLines,
  isPhotoDataUrl, isMarker, nudgeMarker, clampOpacity, reactionMs, rankByMs, nextSignalCount, POCKET_TONE_HZ,
} from '../src/app-logic.ts';

assert.equal(relativeLevelChange(-20, -35), -15);
assert.equal(relativeLevelChange(null, -35), null);
assert.equal(relativeLevelChange(1, Number.NaN), null);

assert.equal(normalizeCaption('  hello   world '), 'hello world');
assert.deepEqual(pushCaption(['déjà'], '  déjà '), ['déjà']);
assert.deepEqual(pushCaption(['old'], 'new'), ['new', 'old']);
assert.equal(pushCaption([], '   ').length, 0);

assert.deepEqual(parseSignPayload({ text: 'STOP', tone: 'alert' }), { text: 'STOP', tone: 'alert' });
assert.equal(parseSignPayload({ text: 'STOP', tone: 'blue' }), null);
assert.equal(parseSignPayload(null), null);

assert.equal(avOffset(1200, 1000), 200);
assert.equal(avOffset(null, 1000), null);

assert.deepEqual(checklistLines('- lait\n• pain\n1. œufs\n\n  '), ['lait', 'pain', 'œufs']);

const jpeg = `data:image/jpeg;base64,${'A'.repeat(8)}==`;
assert.equal(isPhotoDataUrl(jpeg), true);
assert.equal(isPhotoDataUrl('data:text/plain;base64,QQ=='), false);
assert.equal(isMarker(null), true);
assert.equal(isMarker({ x: 0.2, y: 0.4, shape: 'ARROW', color: '#ffdd3c' }), true);
assert.equal(isMarker({ x: 2, y: 0.4, shape: 'ARROW', color: '#ffdd3c' }), false);
assert.deepEqual(nudgeMarker(0.5, 0.5, 'ArrowRight'), { x: 0.52, y: 0.5 });
assert.deepEqual(nudgeMarker(0, 0, 'ArrowLeft'), { x: 0, y: 0 });

assert.equal(clampOpacity(1.4), 1);
assert.equal(clampOpacity(-1), 0);
assert.equal(clampOpacity(Number.NaN), 0.5);

let counter = emptyCounter();
counter = reduceCounter(counter, { delta: 1 }, 'phone-abcdef');
counter = reduceCounter(counter, { delta: 1 }, 'phone-abcdef');
assert.equal(counter.value, 2);
assert.equal(counter.revision, 2);

assert.equal(POCKET_TONE_HZ, 660);
assert.equal(nextSignalCount(3), 4);

assert.equal(reactionMs(1500, 1000, true), 500);
assert.equal(reactionMs(1500, 1000, false), null);
assert.equal(reactionMs(500, 1000, true), null);
assert.deepEqual(rankByMs([{ id: 'b', ms: 40 }, { id: 'a', ms: 12 }]).map((row) => row.id), ['a', 'b']);

console.log('App logic OK');
