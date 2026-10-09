#!/usr/bin/env node
// Validate the committed Android launcher PNGs before AAPT2 sees them.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const TABLE = Uint32Array.from({ length: 256 }, (_, i) => {
  let v = i;
  for (let j = 0; j < 8; j++) v = v & 1 ? (v >>> 1) ^ 0xedb88320 : v >>> 1;
  return v >>> 0;
});
function crc32(b) {
  let v = 0xffffffff;
  for (const byte of b) v = TABLE[(v ^ byte) & 255] ^ (v >>> 8);
  return (v ^ 0xffffffff) >>> 0;
}
export function checkPng(buffer, name) {
  if (buffer.length < 45 || !buffer.subarray(0, 8).equals(SIG)) throw new Error(`${name}: invalid PNG header`);
  let pos = 8, first = true, ended = false, width = 0, height = 0;
  const compressed = [];
  while (pos < buffer.length) {
    if (pos + 12 > buffer.length) throw new Error(`${name}: truncated PNG chunk`);
    const n = buffer.readUInt32BE(pos), end = pos + 12 + n;
    if (n > 15_000_000 || end > buffer.length) throw new Error(`${name}: invalid PNG chunk length`);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const payload = buffer.subarray(pos + 8, pos + 8 + n);
    const storedCrc = buffer.readUInt32BE(pos + 8 + n);
    const actualCrc = crc32(buffer.subarray(pos + 4, pos + 8 + n));
    if (storedCrc !== actualCrc) throw new Error(`${name}: invalid ${type} CRC`);
    if (first) {
      if (type !== 'IHDR' || n !== 13) throw new Error(`${name}: invalid IHDR`);
      width = payload.readUInt32BE(0); height = payload.readUInt32BE(4);
      if (width < 64 || height < 64 || width > 4096 || height > 4096)
        throw new Error(`${name}: unexpected launcher dimensions`);
    }
    first = false;
    if (type === 'IDAT') compressed.push(payload);
    pos = end;
    if (type === 'IEND') { ended = true; break; }
  }
  if (!ended || pos !== buffer.length || !compressed.length) throw new Error(`${name}: incomplete PNG`);
  if (!inflateSync(Buffer.concat(compressed)).length) throw new Error(`${name}: empty image stream`);
  return { width, height };
}
const logos = resolve('public/logos');
const files = readdirSync(logos).filter(x => x.endsWith('.png')).sort();
if (!files.length) throw new Error('No Android launcher PNG found');
for (const name of files) {
  const { width, height } = checkPng(readFileSync(resolve(logos, name)), name);
  console.log(`Launcher OK: ${name} ${width}x${height}`);
}
