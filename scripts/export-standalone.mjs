import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { appVersion } from './app-version.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const outArg = process.argv.find((x) => x.startsWith('--out='))?.split('=')[1] || null;
const OUT = outArg ? resolve(outArg) : join(ROOT, '.split');
const APPLY = process.argv.includes('--apply');
const appArg = process.argv.find((x) => x.startsWith('--app='))?.split('=')[1] || null;

const apps = JSON.parse(readFileSync(join(ROOT, 'apps.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const source = readFileSync(join(ROOT, 'src/apps.tsx'), 'utf8');

const functionById = {
  wallcheck: 'WallCheck',
  captioncast: 'CaptionCast',
  signme: 'SignMe',
  lagcheck: 'LagCheck',
  tapback: 'TapBack',
  papercheck: 'PaperCheck',
  comparesound: 'CompareSound',
  showmethat: 'ShowMeThat',
  counttogether: 'CountTogether',
  phablabphone: 'PhabLabPhone',
  twinlevel: 'TwinLevel',
  sensorlink: 'SensorLink',
  syncmark: 'SyncMark',
  soundrace: 'SoundRace',
  framematch: 'FrameMatch',
  relaytap: 'RelayTap',
};

function extractFunction(text, name) {
  const marker = `function ${name}(`;
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`Missing component ${name}`);
  const brace = text.indexOf('{', start);
  if (brace < 0) throw new Error(`Missing opening brace for ${name}`);
  let depth = 0;
  let quote = null;
  let template = false;
  let escape = false;
  for (let i = brace; i < text.length; i++) {
    const ch = text[i];
    const prev = text[i - 1];
    if (escape) { escape = false; continue; }
    if (ch === '\\\\') { escape = true; continue; }
    if (template) {
      if (ch === '`' && prev !== '\\\\') template = false;
      continue;
    }
    if (quote) {
      if (ch === quote && prev !== '\\\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '`') { template = true; continue; }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`Unterminated component ${name}`);
}

function makeAppsTsx(id, fnName) {
  const firstImportEnd = source.indexOf('\n\n');
  const imports = source.slice(0, firstImportEnd).trim();
  const body = extractFunction(source, fnName);
  return `${imports}\n\nexport function AppRouter({appId}:{appId:string}) {\n  return <${fnName}/>;\n}\n\n${body}\n`;
}

function safeWrite(path, content) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, content);
}

function exportOne(app) {
  const fnName = functionById[app.id];
  if (!fnName) throw new Error(`No component mapping for ${app.id}`);
  const dest = join(OUT, app.id);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(join(dest, 'src'), { recursive: true });

  for (const file of ['index.html', 'tsconfig.json', 'vite.config.ts', '.gitignore']) {
    cpSync(join(ROOT, file), join(dest, file));
  }
  for (const file of ['core.tsx', 'shell.tsx', 'styles.css', 'vite-env.d.ts', 'logic.ts', 'runtime.ts', 'session.ts', 'app-logic.ts']) {
    const from = join(ROOT, 'src', file);
    if (existsSync(from)) cpSync(from, join(dest, 'src', file));
  }
  if (existsSync(join(ROOT, 'package-lock.json'))) {
    cpSync(join(ROOT, 'package-lock.json'), join(dest, 'package-lock.json'));
  }
  mkdirSync(join(dest, 'tests'), { recursive: true });
  for (const file of ['core-logic.mjs', 'app-logic.mjs', 'p1-apps.mjs', 'session-lifecycle.mjs', 'resource-scope.mjs']) {
    const from = join(ROOT, 'tests', file);
    if (existsSync(from)) cpSync(from, join(dest, 'tests', file));
  }
  const logo = join(ROOT, 'public', 'logos', `${app.id}.svg`);
  if (existsSync(logo)) {
    mkdirSync(join(dest, 'public', 'logos'), { recursive: true });
    cpSync(logo, join(dest, 'public', 'logos', `${app.id}.svg`));
    const png = join(ROOT, 'public', 'logos', `${app.id}.png`);
    if (existsSync(png)) cpSync(png, join(dest, 'public', 'logos', `${app.id}.png`));
  }
  for (const file of ['CHANGELOG.md', 'NOTICE.md']) {
    const from = join(ROOT, 'docs', app.id, file);
    if (existsSync(from)) cpSync(from, join(dest, file));
  }
  const listing = join(ROOT, 'store', 'listings', `${app.id}.json`);
  if (existsSync(listing)) cpSync(listing, join(dest, 'store-listing.json'));
  const version = appVersion(app.id);

  safeWrite(join(dest, 'src/apps.tsx'), makeAppsTsx(app.id, fnName));
  safeWrite(join(dest, 'apps.json'), JSON.stringify([app], null, 2) + '\n');

  const main = readFileSync(join(ROOT, 'src/main.tsx'), 'utf8')
    .replace("const requested = import.meta.env.VITE_APP_ID || params.get('app') || 'phablabphone';",
             `const requested = import.meta.env.VITE_APP_ID || params.get('app') || '${app.id}';`)
    .replace("(catalog as AppMeta[]).find((a) => a.id === requested) ?? (catalog as AppMeta[]).find((a) => a.id === 'phablabphone')!",
             "(catalog as AppMeta[]).find((a) => a.id === requested) ?? (catalog as AppMeta[])[0]!");
  safeWrite(join(dest, 'src/main.tsx'), main);

  const pkg = {
    ...packageJson,
    name: app.id === 'papercheck' ? 'paper-checklist' : app.id,
    version: version.versionName,
    private: true,
    scripts: {
      dev: 'vite',
      typecheck: 'tsc --noEmit',
      build: 'vite build',
      test: 'node --experimental-strip-types tests/core-logic.mjs && node --experimental-strip-types tests/app-logic.mjs && node --experimental-strip-types tests/p1-apps.mjs && node --experimental-strip-types tests/session-lifecycle.mjs && node --experimental-strip-types tests/resource-scope.mjs && tsc --noEmit',
    },
  };
  delete pkg.scripts['build:all'];
  safeWrite(join(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  const cap = `import type { CapacitorConfig } from '@capacitor/cli';\n\nconst config: CapacitorConfig = {\n  appId: 'com.phablabphone.${app.id}',\n  appName: ${JSON.stringify(app.name)},\n  webDir: 'dist',\n  server: { androidScheme: 'https' },\n  android: { allowMixedContent: false },\n  ios: { contentInset: 'automatic' }\n};\n\nexport default config;\n`;
  safeWrite(join(dest, 'capacitor.config.ts'), cap);

  safeWrite(join(dest, 'MIGRATION.md'),
`# Migration provenance

- Source repository: \`cdriccarboni/phablab-mobile-suite\`
- Source suite package version: \`${packageJson.version}\`
- App version: \`${version.versionName}\` (versionCode ${version.versionCode})
- Source app id: \`${app.id}\`
- App name: \`${app.name}\`
- Android package: \`com.phablabphone.${app.id}\`
- Generated by: \`scripts/export-standalone.mjs\`

This snapshot is generated from the canonical monorepo. It must pass \`npm install && npm test\` before a GitHub repository is created or updated.
\n`);
  safeWrite(join(dest, 'README.md'),
`# ${app.name}

${app.tagline}

${app.subtitle}

- Package Android : \`com.phablabphone.${app.id}\`
- Version : ${version.versionName} (versionCode ${version.versionCode})
- Branche prévue : \`grok/${app.id}-finalisation-20260927\`

Projet autonome généré depuis \`cdriccarboni/phablab-mobile-suite\`. Le script ne crée pas de dépôt et ne pousse rien.

\`\`\`sh
npm install
npm test
npm run build
\`\`\`

Pour un dépôt privé vide, sans force-push : voir \`PUSH.md\`.
\n`);
  safeWrite(join(dest, 'PUSH.md'),
`# Pousser ${app.name} vers un dépôt privé

Ce dossier est un export autonome. Il n'a pas été publié par l'agent si la création de dépôt a été refusée.

1. Créer le dépôt privé vide \`cdriccarboni/${app.id}\` (droits requis).
2. Depuis ce dossier, sans réécrire l'historique publié de la suite et sans \`--force\` :

\`\`\`sh
git init --branch grok/${app.id}-finalisation-20260927
git add -A
git commit -m "feat: standalone ${app.name} ${version.versionName}"
git remote add origin git@github.com:cdriccarboni/${app.id}.git
git push -u origin grok/${app.id}-finalisation-20260927
\`\`\`

La branche de la suite qui porte le même nom conserve l'historique du monorepo plus un commit de découpage. \`git filter-repo\` n'est pas lancé ici : il réécrirait des commits déjà publiés. L'historique pertinent avant le découpage reste dans \`cdriccarboni/phablab-mobile-suite\`.
\n`);

  return dest;
}

const selected = appArg ? apps.filter((a) => a.id === appArg) : apps;
if (appArg && selected.length !== 1) throw new Error(`Unknown app: ${appArg}`);

console.log(APPLY ? 'EXPORT MODE' : 'DRY RUN');
console.log(`Will prepare ${selected.length} standalone project(s) under ${basename(OUT)}/`);
if (!APPLY) {
  for (const app of selected) console.log(`- ${app.id} -> ${functionById[app.id]}`);
  console.log('Re-run with --apply to write generated projects.');
  process.exit(0);
}

if (!appArg) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const app of selected) {
  const dest = exportOne(app);
  console.log(`Prepared ${app.id}: ${dest}`);
}
console.log('Prepared standalone sources. No repository was created and nothing was pushed.');
