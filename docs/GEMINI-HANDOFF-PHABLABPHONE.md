# MISSION GEMINI — PHABLABPHONE → APPLICATION AUTONOME + GOOGLE PLAY

MISSION: extraire PhabLabPhone du monorepo historique et en faire une application autonome, testée et préparée pour Google Play.

## RÈGLE ABSOLUE : NE PAS REMÉLANGER LES MINI-APPS

Le bug historique du projet a été le mélange du contenu des 16 mini-applications dans GitHub. Cela ne doit absolument pas se reproduire.

Ne jamais recopier aveuglément le monorepo. Ne jamais embarquer le code métier de TwinLevel, SensorLink, SyncMark, SoundRace, WallCheck, CaptionCast, SignMe, LagCheck, TapBack, Paper → Checklist, CompareSound, ShowMeThat, CountTogether, FrameMatch ou RelayTap.

Supprimer imports, composants, styles, dépendances et logique inutiles provenant de ces applications. Ne déclarer l'extraction terminée qu'après audit des dépendances.

## SOURCE DE VÉRITÉ

Dépôt historique:
https://github.com/cdriccarboni/phablab-mobile-suite

Branche préparée:
feat/phonelab-suite-foundation

Racine d'extraction:
.split/phablabphone/

Documents déjà préparés:
- brand/phonelab-suite/BRAND.md
- brand/phonelab-suite/DESIGN-TOKENS.md
- brand/phonelab-suite/COLORS.md
- brand/phonelab-suite/APP-IDENTITY.md
- docs/PHONELAB_MIGRATION_ARCHITECTURE.md
- docs/PHABLABPHONE-EXTRACTION-AUDIT.md

La racine historique est une source de migration, pas la destination finale.

## IDENTITÉ

Nom: PhabLabPhone
Famille: PHONELAB SUITE
Tagline: Turn your phones into a laboratory.
Sous-titre: Pocket experiments with phone sensors
Catégorie: Education
Version de départ: 1.0.0
Application ID Android exact: com.phablabphone.phablabphone
Cible historique: compile/target SDK 36, min SDK 26.

Ne change pas l'applicationId sans raison technique et sans le signaler.

## PRODUIT

PhabLabPhone est une application pédagogique qui transforme le téléphone en laboratoire de poche.

Fonctions réelles:
- niveau sonore relatif via microphone;
- orientation du téléphone;
- mouvement/accélération relative;
- émission d'un ton de test à 660 Hz;
- explication claire que les mesures sont pédagogiques/relatives et non certifiées.

UX:
- mobile first;
- une action principale claire;
- mesures lisibles;
- états permission/refus/absence de capteur honnêtes;
- aucune valeur inventée;
- aucune simulation présentée comme mesure réelle;
- fonctionnement local/offline autant que possible;
- aucun compte inutile.

## CONTAMINATION DÉJÀ IDENTIFIÉE

.split/phablabphone n'est PAS encore garanti propre.

apps.tsx importe actuellement beaucoup de symboles historiques sans rapport direct, notamment ActionShare, BigMetric, RoomPanel, speechStart, takePhotoDataUrl, useRoom, addRaceResult, raceDeltas, markDelay, counters, level comparison, caption, checklist, markers et reaction timing.

core.tsx contient notamment PeerJS, rooms, QR, caméra, speech recognition, haptics, microphone, orientation, motion et audio.

logic.ts contient rooms, messages, counters, race results, level comparison et sensor stats.

app-logic.ts contient captions, sign payloads, checklist, markers et réaction/timing.

shell.tsx et runtime.ts doivent aussi être audités. styles.css est une feuille multi-apps et doit être réduite à ce qui appartient réellement à PhabLabPhone.

Règle: conserver uniquement le code réellement nécessaire au produit. Ne pas conserver PeerJS, rooms, QR, caméra ou speech recognition sauf justification explicite par le périmètre produit.

## ARCHITECTURE CIBLE

Créer une vraie application autonome, par exemple:

phablabphone/
  src/
  public/
  android/
  docs/
  store/
  package.json
  capacitor.config.ts
  vite.config.ts
  tsconfig.json
  README.md
  AGENTS.md
  PRIVACY.md
  STORE_RELEASE.md

Adapter si nécessaire, mais aucun code métier d'une autre mini-app.

## IDENTITÉ VISUELLE

Utiliser:
- brand/phonelab-suite/BRAND.md
- brand/phonelab-suite/DESIGN-TOKENS.md
- brand/phonelab-suite/COLORS.md
- brand/phonelab-suite/APP-IDENTITY.md

Direction PhabLabPhone: laboratoire / cyan-violet / technique / pédagogique.

Exiger contraste élevé, clair/sombre lisibles, cibles tactiles >=44x44 CSS px, information non dépendante uniquement de la couleur et vérification WCAG.

Créer un vrai logo/icône PhabLabPhone, sans réutiliser l'identité d'une autre mini-app.

## GITHUB

Avant toute création:
1. chercher si un dépôt indépendant PhabLabPhone existe déjà;
2. chercher les variantes raisonnables;
3. ne jamais créer un doublon;
4. si un dépôt existe, l'auditer et l'utiliser;
5. sinon créer le dépôt indépendant, idéalement phablabphone.

Le dépôt historique ne doit pas devenir le dépôt final.

Si l'environnement ne permet pas la création GitHub directe, ne simule pas la création: préparer le contenu et indiquer précisément l'action restante.

## TESTS ET BUILD

Exécuter réellement:
- npm install
- npm test
- npm run typecheck
- npm run build
- Capacitor sync
- build Android
- APK de test
- AAB release

Vérifier applicationId, versionName et versionCode.

Ajouter ou corriger les tests pour:
- microphone disponible/permission/refus;
- orientation;
- mouvement;
- absence de capteur;
- valeurs indisponibles;
- ton 660 Hz;
- nettoyage des listeners;
- absence d'importation de code des autres mini-apps.

Ne jamais dire qu'un build ou un test est réussi sans résultat réel.

## ANDROID RÉEL

Si un téléphone est disponible, vérifier microphone, mouvement, orientation, permissions, rotation, clair/sombre et refus de permissions.

Si aucun appareil réel n'est disponible, ne jamais prétendre avoir effectué le test physique.

## PRIVACY / DATA SAFETY

Privacy-first.

Pas d'analytics, tracking, compte, serveur distant, cloud ou collecte inutile.

Le microphone ne doit pas enregistrer en permanence ni envoyer le son à un serveur. Expliquer clairement la permission. Les mesures ne sont pas certifiées.

Les documents Play/Data Safety doivent refléter exactement le comportement réel.

## GOOGLE PLAY

Vérifier en parallèle l'existence de l'application dans Google Play / Play Console avec:
- PhabLabPhone
- com.phablabphone.phablabphone

Si une fiche Play Console existe déjà avec ce package, ne surtout pas créer de seconde application. Reprendre la fiche existante, vérifier statut, version, track et erreurs.

Une recherche publique Play Store sans résultat ne prouve pas qu'une fiche privée/non publiée n'existe pas.

Ne jamais prétendre avoir accès à Play Console si l'authentification n'est pas réellement disponible.

Préparer:
- package exact;
- version 1.0.0;
- versionCode monotone;
- target SDK 36;
- min SDK 26;
- AAB release;
- Play App Signing;
- fiche store;
- description courte/longue;
- catégorie Education;
- icône;
- screenshots réels;
- privacy policy si nécessaire;
- Data Safety;
- Content Rating;
- audience;
- permissions;
- app access;
- release notes;
- internal testing.

Ne jamais mettre keystore, mot de passe, service account JSON, token ou API key dans Git.

## STORE COPY

Nom: PhabLabPhone

Short description:
Turn your phone into a pocket laboratory.

Description longue à construire autour de sound experiments, movement, orientation, sensor exploration, relative measurements, usage éducatif et privacy/local-first.

Ne jamais présenter PhabLabPhone comme instrument scientifique certifié.

## CI/CD

Préparer si possible GitHub Actions pour test, typecheck, web build et Android build/AAB.

Secrets uniquement dans GitHub Secrets ou système sécurisé.

Si une authentification Google réelle est nécessaire, s'arrêter à cette frontière et indiquer précisément ce qui doit être authentifié.

## CRITÈRE DE FIN

La mission est terminée uniquement avec un rapport réel contenant:
1. dépôt GitHub indépendant;
2. URL exacte;
3. commit/tag final;
4. applicationId;
5. versionName;
6. versionCode;
7. tests + résultats;
8. typecheck;
9. web/PWA;
10. Android;
11. chemin AAB;
12. SHA-256 AAB;
13. preuve qu'aucun code d'autre mini-app n'est embarqué;
14. permissions réellement utilisées;
15. Data Safety;
16. store assets;
17. statut Play réel;
18. track réel si uploadé;
19. erreur exacte si bloqué;
20. prochaine action unique.

## RÈGLE DE VÉRITÉ

Toujours distinguer:
- FAIT;
- VÉRIFIÉ;
- PRÊT MAIS NON EXÉCUTÉ;
- BLOQUÉ PAR AUTHENTIFICATION;
- BLOQUÉ PAR ERREUR TECHNIQUE.

Ne jamais écrire publié, build réussi, AAB généré, Google Play configuré, repo créé ou tests OK sans preuve réelle.

## ORDRE D'EXÉCUTION

A. Auditer source et extraction.
B. Vérifier dépôt GitHub indépendant.
C. Nettoyer toute contamination multi-app.
D. Faire fonctionner web/PWA.
E. Faire passer tests.
F. Faire fonctionner Capacitor Android.
G. Générer et vérifier AAB.
H. Préparer assets et fiche Play.
I. Vérifier Play Console.
J. Réutiliser la fiche existante si elle existe.
K. Internal testing.
L. Production seulement après validation réelle.

## SAUVEGARDE

Ne supprimer .split/phablabphone ni les sources historiques tant que dépôt autonome, tests, AAB, applicationId et publication ne sont pas sécurisés.

## RAPPORT FINAL

Fournir un tableau:
Élément | Statut | Preuve

Lignes minimum:
Audit source; Dépôt GitHub; Extraction autonome; Tests; TypeScript; Web/PWA; Android; AAB; Package ID; Permissions; Privacy/Data Safety; Store assets; Play Console; Internal testing; Production.

Puis:
BLOQUANTS RÉELS

Uniquement les blocages nécessitant réellement une action humaine, authentification ou décision.

Puis:
PROCHAINE ACTION UNIQUE

Une seule action, la plus utile.

OBJECTIF FINAL:
Transformer PhabLabPhone en application mobile autonome, propre, légère, testée, identifiable, publiable et réellement prête pour Google Play, sans jamais réintroduire le mélange historique des 16 mini-applications.

Commence maintenant par l'audit réel et l'extraction. Ne demande pas de confirmation pour les opérations techniques non destructives.