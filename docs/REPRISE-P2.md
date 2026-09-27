# Reprise P2 — 27 septembre 2026

Douze applications finalisées sur la branche `grok/phablab-p2-finalisation-20260927`, à partir de `main` (`091b3a8`). Les apps twinlevel, sensorlink, syncmark et soundrace ne sont pas traitées ici.

Aucune publication Google Play n'a été faite. Aucun testeur n'a été contacté. Aucun secret, keystore ni `local.properties` n'est dans Git.

## Patch local non publié

Les commits Mac `3460c01` et `084ff25` (fichier joint) s'appliquent sans conflit sur `main` au moment de cette branche. Ils sont repris tels quels (`git am`), sans réécriture d'historique. La branche P1 n'existait pas encore sur le remote. Le script non suivi `build-aab-shared.mjs` n'a pas été ajouté : il reconstruisait les 16 apps en 1.0.0, y compris les quatre apps P1. Le build des 12 apps est `scripts/build-p2-android.mjs`.

Le scan QR d'appairage (BarcodeDetector) est conservé. CAMERA reste donc pour les apps à salle.

## Dépôts privés

`gh repo create cdriccarboni/<id> --private` a répondu `Resource not accessible by integration (createRepository)`. Aucun dépôt n'a été créé, la visibilité d'aucun dépôt existant n'a changé, rien n'a été supprimé ni forcé. L'export autonome est dans `.split/<id>/` (12 apps). L'export WallCheck passe `npm ci && npm test`. Les 12 exports passent `tsc --noEmit`. Twinlevel, sensorlink, syncmark et soundrace ne sont pas dans `.split/`.

## Preuve commune

- Branche : `grok/phablab-p2-finalisation-20260927`

- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)

- PR brouillon : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2

- `npm test`, `npm run typecheck` et `npm run build:all` : réussis en local.

- `assembleDebug` + `bundleRelease` : réussis pour les 12 apps. APK debug signé avec la clé **Android Debug** (installable). AAB : `jarsigner` indique `jar is unsigned`. Ce n'est pas une clé d'envoi Play. Ne pas importer cet AAB dans la Play Console.

- Permissions : `aapt dump permissions` sur chaque APK. La permission signature AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` est présente partout (bibliothèque), en plus de la liste ci-dessous.

- Icônes : le PNG `mipmap-xxxhdpi` de l'APK WallCheck est identique à `store/play/wallcheck/res/mipmap-xxxhdpi/ic_launcher.png`. WallCheck et RelayTap n'ont pas le même PNG.

- PWA : fichiers dans `docs/<id>/` (manifeste, service worker, icône). GitHub Pages publie `/docs` depuis `main`. Aujourd'hui, `https://cdriccarboni.github.io/phablab-mobile-suite/wallcheck/` répond **200** (ancienne build) et `.../confidentialite/wallcheck.html` répond **404**. Les nouvelles pages ne seront en ligne qu'après fusion de la PR. Statut Pages : **partiel**.

- Fonctions micro, caméra, WebRTC, OCR, capteurs : **non testé** sur appareil physique. Les tests unitaires couvrent la logique pure, pas le matériel.
- Rendu local : Chrome headless a ouvert `docs/wallcheck/` (serveur statique). Le bundle contient « CREATE ROOM », « ISOLATION TEST », « SCAN ROOM QR » et « OTHER PHONES ». Le bouton de scan n'apparaît que si `BarcodeDetector` existe.

- CI : `.github/workflows/build-p2.yml` lance test, typecheck, build web, assembleDebug et bundleRelease. Le résultat GitHub de cette PR est à lire sur l'onglet Actions ; le build local ci-dessous est la preuve utilisée pour les empreintes.


## Par application

### WallCheck (`wallcheck`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/wallcheck/`. Dépôt privé `cdriccarboni/wallcheck` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/wallcheck-v1.0.1-beta.1-test — APK debug `wallcheck-1.0.1-beta.1-debug.apk` SHA-256 `0e0987c5378c43f309ba34c0fb13fa40beaaf8987998a797323d70a8380f1095` ; AAB non signé clé Play `wallcheck-1.0.1-beta.1-unsigned.aab` SHA-256 `aeaa79075a84bbfb55a3b87d3d078f385ebb851ae71a251d0299a49355f72c53`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/wallcheck/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/wallcheck.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.wallcheck`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, INTERNET, RECORD_AUDIO + permission signature AndroidX.
- Fonctions : Salle, micro 1,2 s, différence relative de niveau. Logique `relativeLevelChange` testée.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### CaptionCast (`captioncast`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/captioncast/`. Dépôt privé `cdriccarboni/captioncast` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/captioncast-v1.0.1-beta.1-test — APK debug `captioncast-1.0.1-beta.1-debug.apk` SHA-256 `007c9f5465b01987eccb7201114467a190c74e545f7f594bba1b9d72fe7a86b3` ; AAB non signé clé Play `captioncast-1.0.1-beta.1-unsigned.aab` SHA-256 `b1c363ad788a62dd05e3682f05c30d9cb5343e2d918b20e5a32652cdea3fdb04`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/captioncast/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/captioncast.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.captioncast`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, INTERNET, RECORD_AUDIO + permission signature AndroidX.
- Fonctions : Salle, sous-titres, normalisation du texte. Reconnaissance vocale native non testée sur appareil.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### SignMe (`signme`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/signme/`. Dépôt privé `cdriccarboni/signme` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/signme-v1.0.1-beta.1-test — APK debug `signme-1.0.1-beta.1-debug.apk` SHA-256 `ae289ab2133d458017f78921ebf15c42ae6ce08fa2d9b7ff03527c90a24fba2d` ; AAB non signé clé Play `signme-1.0.1-beta.1-unsigned.aab` SHA-256 `2057db62a4e84fe3df75ba74145599ca1584dc319587318c2116b03f79226281`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/signme/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/signme.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.signme`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, INTERNET + permission signature AndroidX.
- Fonctions : Salle, envoi de message et ton. `parseSignPayload` testé.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### LagCheck (`lagcheck`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/lagcheck/`. Dépôt privé `cdriccarboni/lagcheck` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/lagcheck-v1.0.1-beta.1-test — APK debug `lagcheck-1.0.1-beta.1-debug.apk` SHA-256 `70b2ef6d8cf0c77be72e462e79ade02fd0092e58e31b1dcd9b4895b8687691ad` ; AAB non signé clé Play `lagcheck-1.0.1-beta.1-unsigned.aab` SHA-256 `a0aa2b6355419cc5ff91fcc0ba233820d5b5c59a807324c0f484cb6986d94ac6`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/lagcheck/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/lagcheck.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.lagcheck`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, RECORD_AUDIO + permission signature AndroidX.
- Fonctions : Caméra + micro, décalage A/V. `avOffset` testé. Pas de salle, pas d'INTERNET.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### TapBack (`tapback`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/tapback/`. Dépôt privé `cdriccarboni/tapback` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/tapback-v1.0.1-beta.1-test — APK debug `tapback-1.0.1-beta.1-debug.apk` SHA-256 `a2607776b2f8dafa33c9a7669d861619113ea88e3c02bd82c63fe5710790c464` ; AAB non signé clé Play `tapback-1.0.1-beta.1-unsigned.aab` SHA-256 `05a01f9b836d8f6db7e34a265a75ed0aab84517721f7fc624141b75e18c3cb0e`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/tapback/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/tapback.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.tapback`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, INTERNET, VIBRATE + permission signature AndroidX.
- Fonctions : Salle, compteur de tapes, vibration. `nextSignalCount` testé.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### Paper → Checklist (`papercheck`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/papercheck/`. Dépôt privé `cdriccarboni/papercheck` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/papercheck-v1.0.1-beta.1-test — APK debug `papercheck-1.0.1-beta.1-debug.apk` SHA-256 `3174b75696661a934634221dda2c7e5960e15b439efb6a267923205941e5ad6a` ; AAB non signé clé Play `papercheck-1.0.1-beta.1-unsigned.aab` SHA-256 `56b9f34c6691a55c5c3a8ee08f1388edd73b3ab114ad0636b138fd43858c5120`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/papercheck/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/papercheck.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.papercheck`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : ACCESS_NETWORK_STATE, CAMERA, INTERNET + permission signature AndroidX.
- Fonctions : Photo, OCR ML Kit, liste. `checklistLines` testé. OCR natif non testé sur appareil.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### CompareSound (`comparesound`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/comparesound/`. Dépôt privé `cdriccarboni/comparesound` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/comparesound-v1.0.1-beta.1-test — APK debug `comparesound-1.0.1-beta.1-debug.apk` SHA-256 `62f92e5609d23103821cfc96342f1912eb67603f8f518cd4c37f583661bbb3d5` ; AAB non signé clé Play `comparesound-1.0.1-beta.1-unsigned.aab` SHA-256 `cd5d597d5af2016cfd156748c377caf748f04e45a740d4ab0a0e8538f6d87df2`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/comparesound/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/comparesound.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.comparesound`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : RECORD_AUDIO + permission signature AndroidX.
- Fonctions : Micro avant/après. `relativeLevelChange` testé. Pas de caméra ni de réseau.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### ShowMeThat (`showmethat`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/showmethat/`. Dépôt privé `cdriccarboni/showmethat` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/showmethat-v1.0.1-beta.1-test — APK debug `showmethat-1.0.1-beta.1-debug.apk` SHA-256 `478548c340dc9866ff7517b7a15ab7accd67060132b4826ecc04ab31c7290689` ; AAB non signé clé Play `showmethat-1.0.1-beta.1-unsigned.aab` SHA-256 `ea91ac838d7df96dd290eff908238b52e94f976cdc9229fcaf255e62d090c99d`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/showmethat/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/showmethat.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.showmethat`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, INTERNET + permission signature AndroidX.
- Fonctions : Photo, marqueur, salle. `isPhotoDataUrl`, `isMarker`, `nudgeMarker` testés.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### CountTogether (`counttogether`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/counttogether/`. Dépôt privé `cdriccarboni/counttogether` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/counttogether-v1.0.1-beta.1-test — APK debug `counttogether-1.0.1-beta.1-debug.apk` SHA-256 `c411f2fd136e3fbd5520a838e682de4296f4f570ae454b115c23dc5ad305817f` ; AAB non signé clé Play `counttogether-1.0.1-beta.1-unsigned.aab` SHA-256 `b5859676c9292a6b01f6ec054cc84c2a808e10e8f1e5ff8d71ed2e74cf2b303c`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/counttogether/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/counttogether.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.counttogether`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, INTERNET, VIBRATE + permission signature AndroidX.
- Fonctions : Compteur de salle. `reduceCounter` testé.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### PhabLabPhone (`phablabphone`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/phablabphone/`. Dépôt privé `cdriccarboni/phablabphone` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/phablabphone-v1.0.1-beta.1-test — APK debug `phablabphone-1.0.1-beta.1-debug.apk` SHA-256 `4fbd22ecaf12c0d5dfa13d7cf62bc7b2614525218d536e4addcd722449d43a03` ; AAB non signé clé Play `phablabphone-1.0.1-beta.1-unsigned.aab` SHA-256 `8ec39fde45184ce9063d11f07700602f4ce0071a33eec0b7b462b934bd1d91a9`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/phablabphone/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/phablabphone.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.phablabphone`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : RECORD_AUDIO + permission signature AndroidX.
- Fonctions : Micro, orientation, mouvement, ton 660 Hz. Constante `POCKET_TONE_HZ` testée. Capteurs non testés sur appareil.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### FrameMatch (`framematch`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/framematch/`. Dépôt privé `cdriccarboni/framematch` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/framematch-v1.0.1-beta.1-test — APK debug `framematch-1.0.1-beta.1-debug.apk` SHA-256 `f26d9bd59d84cf3ff4ea9638752db29c9ad48148267f89134bc7da196381b0a3` ; AAB non signé clé Play `framematch-1.0.1-beta.1-unsigned.aab` SHA-256 `558e2f075a81822ea758631f84c626f1d2d32000fc0ddcb673b67ff5f115fcee`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/framematch/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/framematch.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.framematch`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA + permission signature AndroidX.
- Fonctions : Photo de référence et caméra live. `clampOpacity` testé.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

### RelayTap (`relaytap`)

- Dépôt : monorepo `cdriccarboni/phablab-mobile-suite`, export `.split/relaytap/`. Dépôt privé `cdriccarboni/relaytap` : **bloqué** (intégration sans droit `createRepository`).
- Branche : `grok/phablab-p2-finalisation-20260927`
- Commits : 6e4fdf6 (patch sessions), 35c6199 (patch apps), 23a79f2 (préparation P2), e0556f9 (build Android)
- PR : https://github.com/cdriccarboni/phablab-mobile-suite/pull/2
- Pré-release : https://github.com/cdriccarboni/phablab-mobile-suite/releases/tag/relaytap-v1.0.1-beta.1-test — APK debug `relaytap-1.0.1-beta.1-debug.apk` SHA-256 `4fbb5b95ea28ecd007c0fbc2d6d22cd8e4ce9d45fb5234cda3025678e7ff77d7` ; AAB non signé clé Play `relaytap-1.0.1-beta.1-unsigned.aab` SHA-256 `9c61ec2412c43ce9a42ebd0581d18d550cf8443d03e3e5e36d29bc9b49b0c981`.
- PWA : https://cdriccarboni.github.io/phablab-mobile-suite/relaytap/ — **partiel** tant que la PR n'est pas dans `main`. Confidentialité : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/relaytap.html — fichier présent, URL encore 404 sur Pages.
- Build : **vérifié** — versionCode 2, versionName 1.0.1-beta.1, package `com.phablabphone.relaytap`, targetSdk 36, minSdk 26.
- Permissions du manifeste fusionné : CAMERA, INTERNET, VIBRATE + permission signature AndroidX.
- Fonctions : Salle, temps de réaction. `reactionMs` et `rankByMs` testés.
- Tests : `npm test` (logique) **vérifié**. Build web **vérifié**. APK/AAB **vérifié**. Parcours matériel **non testé**.
- Limites : pas de captures Play réelles ; pas de clé d'envoi Play ; e-mail public et liste de testeurs encore **à confirmer par Cédric** ; mesures relatives, pas un instrument certifié.
- Statut : **partiel** — binaires et dossier Play prêts pour un test local, PWA/confidentialité pas encore publiées par Pages, pré-release GitHub selon le résultat de publication, aucun envoi Play.

## Hors périmètre

twinlevel, sensorlink, syncmark, soundrace : aucun dossier Play, aucune pré-release, aucune icône, aucun bump de version dans le template partagé (`android-base` reste en versionCode 1 / 1.0.0 pour le build des 16). Le patch partagé modifie quand même leur code source dans `src/apps.tsx`, parce que ces fonctions étaient dans les commits Mac. Pas d'autre travail P2 sur ces quatre apps.
