import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));
const brands = {
  wallcheck: '#1E3A2F', captioncast: '#10243A', signme: '#1A1C24', lagcheck: '#241838',
  tapback: '#0E332C', papercheck: '#1C2E24', comparesound: '#2A2416', showmethat: '#3A1824',
  counttogether: '#15243E', phablabphone: '#123028', framematch: '#2C2618', relaytap: '#3A2412',
  twinlevel: '#0B1220', sensorlink: '#081C16', syncmark: '#201808', soundrace: '#240C10',
};

const sw = `const CACHE = 'phablab-suite-16-1';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html'))));
});
`;

function iconPath(id, size) {
  const play = join(root, 'store', 'play', id, `icon-${size}.png`);
  if (existsSync(play)) return play;
  const logo = join(root, 'public', 'logos', `${id}.png`);
  if (size === 192 && existsSync(logo)) return logo;
  return null;
}

for (const app of catalog) {
  const id = app.id;
  const dist = join(root, 'dist', id);
  if (!existsSync(join(dist, 'index.html'))) throw new Error(`Build web manquant: ${id}`);
  const icon192 = iconPath(id, 192);
  const icon512 = iconPath(id, 512);
  if (!icon192) throw new Error(`Icône 192 manquante: ${id}`);
  cpSync(icon192, join(dist, 'icon-192.png'));
  if (icon512) cpSync(icon512, join(dist, 'icon-512.png'));
  writeFileSync(join(dist, 'sw.js'), sw);
  const icons = [
    { src: './icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  ];
  if (icon512) icons.push({ src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' });
  writeFileSync(join(dist, 'manifest.webmanifest'), JSON.stringify({
    name: app.name,
    short_name: app.name,
    description: app.tagline,
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#080b10',
    theme_color: brands[id] || '#10243A',
    icons,
  }, null, 2));
  let html = readFileSync(join(dist, 'index.html'), 'utf8');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${app.name}</title>`);
  html = html.replace(/<meta name="theme-color" content="[^"]*" \/>/, `<meta name="theme-color" content="${brands[id] || '#10243A'}" />`);
  if (!html.includes('manifest.webmanifest')) {
    html = html.replace('</head>', `  <link rel="manifest" href="./manifest.webmanifest" />\n  <link rel="icon" href="./icon-192.png" />\n  <link rel="apple-touch-icon" href="./icon-192.png" />\n</head>`);
  }
  if (!html.includes('serviceWorker.register')) {
    html = html.replace('</body>', `  <script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');</script>\n</body>`);
  }
  writeFileSync(join(dist, 'index.html'), html);
  const docs = join(root, 'docs', id);
  mkdirSync(docs, { recursive: true });
  rmSync(join(docs, 'assets'), { recursive: true, force: true });
  cpSync(join(dist, 'assets'), join(docs, 'assets'), { recursive: true });
  for (const file of ['index.html', 'manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png']) {
    const from = join(dist, file);
    if (existsSync(from)) cpSync(from, join(docs, file));
  }
  console.log(`PWA ${id} -> docs/${id}`);
}
console.log(`Published ${catalog.length} PWAs into docs/.`);
