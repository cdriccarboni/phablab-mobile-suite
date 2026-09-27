import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P2_IDS, P2_ROOM_APPS, P2_VERSION_CODE, P2_VERSION_NAME } from './p2-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const uploads = process.env.PLAY_DOSSIERS || '/home/ubuntu/.cursor/projects/workspace/uploads';
const reportPath = join(root, 'release', 'p2-report.json');
if (!existsSync(reportPath)) throw new Error('release/p2-report.json manquant : lancer le build Android d’abord');
const report = new Map(JSON.parse(readFileSync(reportPath, 'utf8')).map((row) => [row.id, row]));

function findDossier(id) {
  return readdirSync(uploads).find((name) => name.startsWith(`${id}_`) && name.endsWith('.md'));
}

for (const id of P2_IDS) {
  const built = report.get(id);
  if (!built) throw new Error(`Rapport incomplet, manque ${id}`);
  const sourceName = findDossier(id);
  if (!sourceName) throw new Error(`Dossier Play introuvable pour ${id}`);
  let text = readFileSync(join(uploads, sourceName), 'utf8');
  const releaseUrl = `https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/${id}-v${P2_VERSION_NAME}-test/${id}-${P2_VERSION_NAME}-debug.apk`;
  const aabUrl = `https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/${id}-v${P2_VERSION_NAME}-test/${id}-${P2_VERSION_NAME}-unsigned.aab`;
  text = text.replace(
    /\| versionCode \/ versionName \|[^|\n]+\|/,
    `| versionCode / versionName | ${P2_VERSION_CODE} / ${P2_VERSION_NAME} |`,
  );
  text = text.replace(
    /\| APK analysé \|[^|\n]+\|/,
    `| APK analysé | \`${id}-${P2_VERSION_NAME}-debug.apk\` — SHA-256 \`${built.apkSha256}\` |`,
  );
  text = text.replace(
    /\| Lien de test \|[^|\n]+\|/,
    `| Lien de test | ${releaseUrl} |`,
  );
  text = text.replace(
    /\| Permissions \(manifeste fusionné\) \|[^|\n]+\|/,
    `| Permissions (manifeste fusionné) | ${built.permissions.join(', ')} |`,
  );
  text = text.replace(
    /- URL : https:\/\/cdriccarboni\.github\.io\/phablab-mobile-suite\/confidentialite\/[^\n]+/,
    `- URL : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/${id}.html (fichier versionné : \`docs/confidentialite/${id}.html\`. GitHub Pages sert \`/docs\` depuis \`main\` : la page est en ligne après fusion de la PR.)`,
  );
  text = text.replaceAll('1.0.0', P2_VERSION_NAME);
  text = text.replace(
    /versionCode actuel \d+ — chaque envoi Play doit avoir un versionCode strictement supérieur\./,
    `versionCode actuel ${P2_VERSION_CODE} (\`${P2_VERSION_NAME}\`) — chaque prochain envoi Play doit avoir un versionCode strictement supérieur.`,
  );
  text = text.replace(
    /- \*\*Clé d'importation\*\* : \*\*aucune\*\*\. Les APK de test sont signés debug ; aucun AAB release signé n'existe\. Cédric crée une clé d'importation \(une par app ou une commune\), jamais dans Git ; ensuite build `bundleRelease` signé\./,
    `- **Clé d'importation** : **aucune clé d'envoi Play**. L'APK debug est signé avec la clé debug Android (installable pour test). L'AAB \`${id}-${P2_VERSION_NAME}-unsigned.aab\` (SHA-256 \`${built.aabSha256}\`, ${aabUrl}) est produit par \`bundleRelease\` et **n'est pas signé avec une clé d'envoi Play**. Ne pas l'importer dans la Play Console. Cédric crée une clé d'importation hors Git, puis refait un \`bundleRelease\` signé.`,
  );
  text = text.replace(
    /\| Icône 512×512 \| obligatoire \| \*\*Manquant\*\*[^\n]+/,
    `| Icône 512×512 | obligatoire | **Présent** — \`store/play/${id}/icon-512.png\` (emoji de apps.json, fond propre). L'APK embarque cette icône (mipmap), plus l'icône Capacitor par défaut. |`,
  );
  text = text.replace(
    /\| Image de présentation 1024×500 \| obligatoire \| \*\*Manquant\*\* \|/,
    `| Image de présentation 1024×500 | obligatoire | **Présent** — \`store/play/${id}/feature-1024x500.png\` |`,
  );
  const qr = P2_ROOM_APPS.includes(id)
    ? 'CAMERA est conservée : le scan QR d’appairage (BarcodeDetector) du patch local est gardé.'
    : 'Cette app n’a pas de salle : CAMERA n’est déclarée que si la fonction elle-même utilise la caméra.';
  const banner = `> Mise à jour P2 du 27 septembre 2026, alignée sur l'APK debug réellement produit (versionCode ${P2_VERSION_CODE}, versionName ${P2_VERSION_NAME}). SHA-256 APK \`${built.apkSha256}\`. Permissions du manifeste fusionné : ${built.permissions.join(', ') || 'aucune permission gérée'}. ${qr} L'AAB n'est pas signé avec une clé d'envoi Play. Aucune publication Play n'a été faite.\n\n`;
  if (!text.startsWith('> Mise à jour P2')) text = banner + text;
  const dir = join(root, 'docs', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'PLAY-CONSOLE.md'), text);
  console.log(`docs/${id}/PLAY-CONSOLE.md`);
}
