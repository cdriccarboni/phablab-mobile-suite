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

## Non testé

- Aucun téléphone physique, ni Android ni iOS.
- Pas de deuxième navigateur réel pour une salle PeerJS. L’appairage, le délai réseau et le classement multi-téléphones ne sont pas mesurés.
- Aucune exactitude d’angle, de dBFS, de m/s² ou de milliseconde n’a été comparée à un instrument.
- L’APK n’est pas encore produit dans cette reprise. Le workflow et les tags sont le prochain pas. Tant qu’un lien GitHub ne répond pas, l’APK reste non testé.
- Pas de signature Play Store, pas de capture d’écran store.

## Si on reprend

1. Pousser la branche et les tags `twinlevel-v1.0.1`, `sensorlink-v1.0.1`, `syncmark-v1.0.1`, `soundrace-v1.0.1` pour lancer `Build one Android test APK`.
2. Vérifier chaque URL de pré-version, la taille et le SHA-256. Ne pas inventer ces chiffres.
3. Avec un compte autorisé : `scripts/prepare-private-repo.sh <app>` puis `gh repo create cdriccarboni/<app> --private` et un push sans `--force`.
4. Sur deux téléphones : salle, reconnexion manuelle, et une seule mesure horodatée si on veut parler de latence.
