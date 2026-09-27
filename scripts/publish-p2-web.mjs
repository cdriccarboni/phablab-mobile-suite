import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P2_IDS } from './p2-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));
const brands = {
  wallcheck: '#1E3A2F', captioncast: '#10243A', signme: '#1A1C24', lagcheck: '#241838',
  tapback: '#0E332C', papercheck: '#1C2E24', comparesound: '#2A2416', showmethat: '#3A1824',
  counttogether: '#15243E', phablabphone: '#123028', framematch: '#2C2618', relaytap: '#3A2412',
};

const sw = `const CACHE = 'phablab-p2-1';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html', './manifest.webmanifest', './icon-512.png'])));
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

for (const id of P2_IDS) {
  const app = catalog.find((entry) => entry.id === id);
  const dist = join(root, 'dist', id);
  if (!existsSync(join(dist, 'index.html'))) throw new Error(`Build web manquant: ${id}`);
  const icon = join(root, 'store', 'play', id, 'icon-512.png');
  cpSync(icon, join(dist, 'icon-512.png'));
  cpSync(join(root, 'store', 'play', id, 'icon-192.png'), join(dist, 'icon-192.png'));
  writeFileSync(join(dist, 'sw.js'), sw);
  writeFileSync(join(dist, 'manifest.webmanifest'), JSON.stringify({
    name: app.name,
    short_name: app.name,
    description: app.tagline,
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#080b10',
    theme_color: brands[id],
    icons: [
      { src: './icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }, null, 2));
  let html = readFileSync(join(dist, 'index.html'), 'utf8');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${app.name}</title>`);
  html = html.replace(/<meta name="theme-color" content="[^"]*" \/>/, `<meta name="theme-color" content="${brands[id]}" />`);
  html = html.replace('</head>', `  <link rel="manifest" href="./manifest.webmanifest" />\n  <link rel="icon" href="./icon-512.png" />\n  <link rel="apple-touch-icon" href="./icon-512.png" />\n</head>`);
  html = html.replace('</body>', `  <script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');</script>\n</body>`);
  writeFileSync(join(dist, 'index.html'), html);
  const docs = join(root, 'docs', id);
  rmSync(docs, { recursive: true, force: true });
  mkdirSync(docs, { recursive: true });
  cpSync(dist, docs, { recursive: true });
  console.log(`PWA ${id} -> docs/${id}`);
}
console.log(`Published ${P2_IDS.length} PWAs into docs/.`);
