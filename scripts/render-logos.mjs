import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'logos');
mkdirSync(root, { recursive: true });

const apps = {
  twinlevel: { bg: [11, 18, 32], fg: [22, 200, 255] },
  sensorlink: { bg: [8, 28, 22], fg: [61, 214, 140] },
  syncmark: { bg: [32, 24, 8], fg: [255, 221, 60] },
  soundrace: { bg: [36, 12, 16], fg: [255, 90, 54] },
};

function crc(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc(body), 8 + body.length);
  return out;
}
function png(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function blend(bg, fg, amount) {
  return [
    Math.round(bg[0] + (fg[0] - bg[0]) * amount),
    Math.round(bg[1] + (fg[1] - bg[1]) * amount),
    Math.round(bg[2] + (fg[2] - bg[2]) * amount),
    255,
  ];
}
function mark(id, x, y, size) {
  const nx = x / size; const ny = y / size;
  if (id === 'twinlevel') return Math.abs((ny - 0.72) - (nx - 0.22) * 0.15) < 0.035 && nx > 0.18 && nx < 0.78 || Math.abs((ny - 0.72) - (0.82 - nx) * 0.95) < 0.035 && nx > 0.22 && nx < 0.84;
  if (id === 'sensorlink') {
    const d = Math.hypot(nx - 0.5, ny - 0.5);
    return Math.abs(d - 0.12) < 0.03 || Math.abs(d - 0.24) < 0.025 || Math.abs(d - 0.36) < 0.02;
  }
  if (id === 'syncmark') return Math.hypot(nx - 0.5, ny - 0.5) < 0.08 || (Math.abs(nx - 0.5) < 0.025 && ny > 0.18 && ny < 0.82) || (Math.abs(ny - 0.5) < 0.025 && nx > 0.18 && nx < 0.82);
  const left = Math.abs((ny - 0.3) - Math.abs(nx - 0.38) * 1.1) < 0.03 && nx > 0.2 && nx < 0.56;
  const right = Math.abs((ny - 0.3) - Math.abs(nx - 0.62) * 1.1) < 0.03 && nx > 0.44 && nx < 0.8;
  return left || right;
}

for (const [id, color] of Object.entries(apps)) {
  const file = png(192, (x, y, size) => {
    const pad = 18;
    const inside = x >= pad && y >= pad && x < size - pad && y < size - pad;
    if (!inside) return [0, 0, 0, 0];
    return mark(id, x, y, size) ? [...color.fg, 255] : blend(color.bg, color.fg, 0);
  });
  writeFileSync(join(root, `${id}.png`), file);
  console.log(`wrote ${id}.png ${file.length} bytes`);
}
