import { readFileSync, existsSync } from 'node:fs';
const apps=JSON.parse(readFileSync(new URL('../apps.json',import.meta.url),'utf8'));
if(apps.length!==16)throw new Error(`Expected 16 apps, got ${apps.length}`);
const ids=new Set();
for(const a of apps){
  if(!a.id||!a.name||!a.tagline)throw new Error('Invalid catalog entry '+JSON.stringify(a));
  if(ids.has(a.id))throw new Error('Duplicate id '+a.id);
  ids.add(a.id);
}
for(const a of apps){
  const p=new URL(`../dist/${a.id}/index.html`,import.meta.url);
  if(process.env.CHECK_DIST==='1'&&!existsSync(p))throw new Error('Missing build '+a.id);
}
console.log('Catalog OK:',apps.length,'apps, unique IDs, required metadata present.');
