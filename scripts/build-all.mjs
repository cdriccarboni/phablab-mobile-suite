import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
const apps=JSON.parse(readFileSync(new URL('../apps.json',import.meta.url),'utf8'));
rmSync(new URL('../dist',import.meta.url),{recursive:true,force:true});
for(const app of apps){
  console.log('\n=== BUILD',app.id,'===');
  const r=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['vite','build','--outDir',`dist/${app.id}`],{
    cwd:new URL('..',import.meta.url),
    stdio:'inherit',
    env:{...process.env,VITE_APP_ID:app.id}
  });
  if(r.status!==0)process.exit(r.status||1);
}
console.log(`Built ${apps.length} apps.`);
