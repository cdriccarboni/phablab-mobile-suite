import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const backgrounds = {
  twinlevel: '#0B1220',
  sensorlink: '#081C16',
  syncmark: '#201808',
  soundrace: '#240C10',
};

export function stampLauncher(resDir, appId, root) {
  const png = join(root, 'public', 'logos', `${appId}.png`);
  if (!existsSync(png)) return false;
  for (const entry of readdirSync(resDir)) {
    if (!entry.startsWith('mipmap-') || entry.includes('anydpi')) continue;
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      const dest = join(resDir, entry, name);
      if (existsSync(dest)) copyFileSync(png, dest);
    }
  }
  const background = backgrounds[appId];
  const colorFile = join(resDir, 'values', 'ic_launcher_background.xml');
  if (background && existsSync(colorFile)) {
    const xml = readFileSync(colorFile, 'utf8').replace(/#[0-9A-Fa-f]{6}/, background);
    writeFileSync(colorFile, xml);
  }
  return true;
}
