# Reprise P1 — 2026-09-27

Branche de travail : `grok/phablab-p1-finalisation-20260927`. Rien n’a été mergé. Pas de force-push.

Ce fichier décrit ce qui est vraiment vérifié. Une simulation dans Chrome n’est pas un essai sur téléphone.

## Fait dans la suite

- Historique Mac rejoué puis fusionné. Détail : `docs/MIGRATION-P1.md`.
- Parcours des quatre apps branché sur la spec (`apps.json`, `store/growth.json`) : capture d’angle, capteur distant, marque, course au son.
- Sauvegarde locale, zéro / tare / seuil, arrêt des capteurs et du micro, reconnexion manuelle sans boucle.
- Versions 1.0.1, versionCode 2, sans revenir à 0. Les autres apps restent à 1.0.0 / versionCode 1 (`store/app-versions.json`).
- Packages inchangés par rapport à `STORE_RELEASE.md` : `com.phablabphone.<id>`.
- Exports prêts à pousser : `exports/twinlevel`, `exports/sensorlink`, `exports/syncmark`, `exports/soundrace`, plus `scripts/prepare-private-repo.sh`.
- Workflow `.github/workflows/build-apk-one.yml` pour un APK debug par tag `twinlevel-v*`, `sensorlink-v*`, `syncmark-v*`, `soundrace-v*`.

## Dépôts privés — bloqué

`gh repo view` : `cdriccarboni/twinlevel`, `sensorlink`, `syncmark`, `soundrace` n’existent pas.

`gh repo create --private` pour les quatre : `Resource not accessible by integration (createRepository)`.

Le jeton de cet agent ne peut pas créer de dépôt. Aucun dépôt privé n’a été créé. La marche à suivre est dans `exports/<app>/PUSH.md`.

`git filter-repo` n’a pas été utilisé : il réécrirait des commits déjà publiés.

## Preuves locales

`npm test` passe (logique, session, libération de `ResourceScope`, catalogue, export autonome des 16 apps avec contrôle que chaque export P1 ne contient que son composant).

Navigateur : Chrome headless, `http://127.0.0.1:5173`, script `tests/browser-p1.mjs`. Aucun téléphone.

| Contrôle | État | Preuve |
| --- | --- | --- |
| TwinLevel degrés après événement injecté beta 10 / gamma 4 | vérifié | texte `10.0°` et `4.0°` |
| Zéro local | vérifié | la même pose passe à `0.0°` ; zéro enregistré `{b:10,g:4}` |
| Référence après zéro puis beta 12 | vérifié | référence sauvée `{b:2,g:0}`, rechargée |
| Arrêt du capteur | vérifié | après STOP, l’affichage redevient `—°` malgré un nouvel événement |
| SensorLink unités et sélection | vérifié | dBFS, degrés, m/s² ; case SOUND restaurée décochée |
| Mouvement injecté 9.81 m/s² puis tare | vérifié | affichage `9.81 m/s²` puis `0.00 m/s²`, tare 9.81 en localStorage |
| SyncMark délai 0 ms | vérifié | une marque locale sauvée et restaurée. Pas une latence entre téléphones |
| SoundRace seuil 0.25 | vérifié | restauré après rechargement |
| Calibration micro factice | vérifié sur le faux périphérique seulement | pic RMS 0.464 (amplitude pleine échelle, sans unité physique), seuil plafonné à 0.35. Ce n’est pas un dB SPL et pas un téléphone |
| Quatre identités écran | vérifié | quatre noms et quatre `src` de logo distincts |

## APK — vérifié comme fichier, pas sur téléphone

Le premier push des tags n’a pas lancé le workflow : GitHub ne l’a pas enregistré tant qu’il n’était pas sur `main`. Un push de la branche `grok/phablab-p1-finalisation-20260927` a lancé la run [36315238591](https://github.com/cdriccarboni/phablab-mobile-suite/actions/runs/36315238591), conclusion `success`, quatre jobs. Chaque job a exécuté `aapt` / `apksigner` dans `scripts/build-android-one.mjs` ; le job échoue si le package, le versionCode 2 ou le versionName 1.0.1 ne correspondent pas. Le journal du job TwinLevel contient `OK TwinLevel: .../twinlevel-1.0.1.apk`.

Les quatre URL répondent HTTP 302 puis HTTP 200, `content-type: application/vnd.android.package-archive`. Le SHA-256 ci-dessous est recalculé après téléchargement, et il est identique à la note de pré-version. Le manifeste binaire contient le package et `1.0.1`. `aapt` n’a pas été relancé sur cette machine : pas de SDK Android ici.

| App | Lien vérifié | Octets | SHA-256 |
| --- | --- | --- | --- |
| TwinLevel | https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/twinlevel-v1.0.1/twinlevel-1.0.1.apk | 4601368 | `ab0359986ed1e7806f3a21e2afdc7e8ba692423604476ee4f4fbce1be4c92e0d` |
| SensorLink | https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/sensorlink-v1.0.1/sensorlink-1.0.1.apk | 4608476 | `10ffc215e9b638aa1cc61216b52af32e16af3ee20d5fe5a43226abc1f036e85a` |
| SyncMark | https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/syncmark-v1.0.1/syncmark-1.0.1.apk | 4606756 | `5b27dcf51c63d79f406e2da3a05edeee840d3621358a52f267c2c44ef833d9ae` |
| SoundRace | https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/soundrace-v1.0.1/soundrace-1.0.1.apk | 4606796 | `8d0e7755442521a7cb2f67237802e7e4a6c23872b2bcb2a65d7abac06210d6da` |

Construit depuis `912df9a`. Les tags pointent vers `ec79cad` (le commit d’app, avant le correctif de déclenchement CI). L’APK n’a pas été installé.

## Non testé

- Aucun téléphone physique, ni Android ni iOS. Les APK n’ont pas été installés.
- Pas de deuxième navigateur réel pour une salle PeerJS. L’appairage, le délai réseau et le classement multi-téléphones ne sont pas mesurés.
- Aucune exactitude d’angle, de dBFS, de m/s² ou de milliseconde n’a été comparée à un instrument.
- Pas de signature Play Store, pas de capture d’écran store.

## Si on reprend

1. Avec un compte autorisé : `scripts/prepare-private-repo.sh <app>` puis `gh repo create cdriccarboni/<app> --private` et un push sans `--force`.
2. Sur deux téléphones : installer les APK, ouvrir une salle, tenter une reconnexion manuelle, et noter une seule mesure horodatée si on veut parler de latence.
3. Ne pas merger les branches `grok/<app>-finalisation-20260927` dans `main` : leur pointe est une seule app.
