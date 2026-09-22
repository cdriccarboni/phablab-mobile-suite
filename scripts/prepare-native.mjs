import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
const platform=process.argv[2];
const id=process.env.MOBILE_APP_ID||'phablabphone';
const catalog=JSON.parse(readFileSync(new URL('../apps.json',import.meta.url),'utf8'));
const meta=catalog.find((a)=>a.id===id);
if(!meta)throw new Error(`Unknown app id: ${id}`);
const name=process.env.MOBILE_APP_NAME||meta.name;
if(!['android','ios'].includes(platform))throw new Error('Use android or ios');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{stdio:'inherit',shell:process.platform==='win32',env:{...process.env,MOBILE_APP_ID:id,MOBILE_APP_NAME:name,VITE_APP_ID:id}});if(r.status!==0)process.exit(r.status||1)};
rmSync(new URL(`../${platform}`,import.meta.url),{recursive:true,force:true});
run('npx',['vite','build','--outDir',`dist/${id}`]);
run('npx',['cap','add',platform]);
run('npx',['cap','sync',platform]);

if(platform==='android'){
  const vars=new URL('../android/variables.gradle',import.meta.url);
  if(existsSync(vars)){
    let s=readFileSync(vars,'utf8');
    s=s.replace(/minSdkVersion\s*=\s*\d+/,'minSdkVersion = 26')
       .replace(/compileSdkVersion\s*=\s*\d+/,'compileSdkVersion = 36')
       .replace(/targetSdkVersion\s*=\s*\d+/,'targetSdkVersion = 36');
    writeFileSync(vars,s);
  }
  const gradle=new URL('../android/app/build.gradle',import.meta.url);
  if(existsSync(gradle)){
    let g=readFileSync(gradle,'utf8');
    g=g.replace(/versionCode\s+\d+/,'versionCode 1').replace(/versionName\s+"[^"]+"/,'versionName "1.0.0"');
    writeFileSync(gradle,g);
  }
  const manifest=new URL('../android/app/src/main/AndroidManifest.xml',import.meta.url);
  if(existsSync(manifest)){
    let s=readFileSync(manifest,'utf8');
    const perms=['android.permission.CAMERA','android.permission.RECORD_AUDIO'];
    for(const p of perms)if(!s.includes(p))s=s.replace('<application',`<uses-permission android:name="${p}" />\n    <application`);
    writeFileSync(manifest,s);
  }
}
if(platform==='ios'){
  const pod=new URL('../ios/App/Podfile',import.meta.url);
  if(existsSync(pod)){
    let s=readFileSync(pod,'utf8');
    s=s.replace(/platform :ios, '[^']+'/,"platform :ios, '15.5'");
    writeFileSync(pod,s);
  }
  const project=new URL('../ios/App/App.xcodeproj/project.pbxproj',import.meta.url);
  if(existsSync(project)){
    let p=readFileSync(project,'utf8');
    p=p.replace(/MARKETING_VERSION = [^;]+;/g,'MARKETING_VERSION = 1.0.0;').replace(/CURRENT_PROJECT_VERSION = [^;]+;/g,'CURRENT_PROJECT_VERSION = 1;');
    writeFileSync(project,p);
  }
  const plist=new URL('../ios/App/App/Info.plist',import.meta.url);
  if(existsSync(plist)){
    let s=readFileSync(plist,'utf8');
    const entries=[
      ['NSCameraUsageDescription','Camera access is used only when you choose a camera-based tool.'],
      ['NSMicrophoneUsageDescription','Microphone access is used only for sound measurement or speech tools you start.'],
      ['NSSpeechRecognitionUsageDescription','Speech recognition turns your voice into live captions when you start CaptionCast.'],
      ['NSPhotoLibraryUsageDescription','Photo access lets you choose or save visual references.'],
      ['NSMotionUsageDescription','Motion sensors are used for measurement tools you start.']
    ];
    for(const [k,v] of entries)if(!s.includes(`<key>${k}</key>`))s=s.replace('</dict>\n</plist>',`  <key>${k}</key>\n  <string>${v}</string>\n</dict>\n</plist>`);
    writeFileSync(plist,s);
  }
  run('npx',['cap','sync','ios']);
}
console.log(`Prepared ${name} (${id}) for ${platform}.`);
