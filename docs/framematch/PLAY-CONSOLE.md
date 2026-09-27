> Mise à jour P2 du 27 septembre 2026, alignée sur l'APK debug réellement produit (versionCode 2, versionName 1.0.1-beta.1). SHA-256 APK `f26d9bd59d84cf3ff4ea9638752db29c9ad48148267f89134bc7da196381b0a3`. Permissions du manifeste fusionné : CAMERA. Cette app n’a pas de salle : CAMERA n’est déclarée que si la fonction elle-même utilise la caméra. L'AAB n'est pas signé avec une clé d'envoi Play. Aucune publication Play n'a été faite.

# FrameMatch — Dossier Google Play Console (test fermé)

Dossier initial du 27/09/2026 (APK 1.0.1-beta.1, androguard), mis à jour après le build 1.0.1-beta.1. Manifeste fusionné revérifié avec `aapt dump permissions` et `aapt dump badging`. Statuts : **vérifié** / **partiel** / **bloqué** / **non testé**. Les inconnues sont marquées **à confirmer par Cédric**.

## 0. Identité technique (vérifié sur l'APK)

| Champ | Valeur |
|---|---|
| Package | `com.phablabphone.framematch` |
| versionCode / versionName | 2 / 1.0.1-beta.1 |
| minSdk / targetSdk | 26 / 36 — **conforme** (exigence Play 2026 pour nouvelle app : API 35+) |
| APK analysé | `framematch-1.0.1-beta.1-debug.apk` — SHA-256 `f26d9bd59d84cf3ff4ea9638752db29c9ad48148267f89134bc7da196381b0a3` |
| Lien de test | https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/framematch-v1.0.1-beta.1-test/framematch-1.0.1-beta.1-debug.apk |
| Permissions (manifeste fusionné) | CAMERA, com.phablabphone.framematch.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION (AndroidX) |
| SDK / bibliothèques | Capacitor 8 (WebView), React 19, @capacitor/camera 8 |
| SDK pub / analytics / crash | Aucun (vérifié : pas de com.google.android.gms.ads, Firebase Analytics/Crashlytics, AD_ID) |
| allowBackup | true |

## 1. Fiche Play Store principale

**Nom de l'application** (10/30) :
```
FrameMatch
```
**Description courte** (76/80) :
```
Superposez une photo de référence pour retrouver exactement le même cadrage.
```
**Description longue** (421/4000) :
```
FrameMatch superpose une photo de référence semi-transparente sur l'image de la caméra pour refaire exactement le même plan : raccords, avant/après, suivi de chantier.

Sans compte, sans publicité, sans suivi. Les mesures sont relatives et indicatives : elles dépendent du micro, de la caméra et des capteurs de chaque téléphone.

Application de la suite PhabLab (outils de poche pour le plateau, l'atelier et la classe).
```
**Type** : Application · **Catégorie** : Photographie · **Tags** : choisir jusqu'à 5 tags proposés par la Console proches de : mesure, son, capteurs, outils (**à confirmer par Cédric**).
**Langue par défaut** : Français (France) – fr-FR. Anglais optionnel.

## 2. Coordonnées

- E-mail (obligatoire, public) : **à confirmer par Cédric** (candidats vus : cdric.carboni@gmail.com, acousmatictheatre@gmail.com)
- Site web : https://cdriccarboni.github.io/phablab-mobile-suite/framematch/
- Téléphone : facultatif — laisser vide.

## 3. Accès à l'application

Réponse : **Toutes les fonctionnalités sont disponibles sans accès spécial** (pas de connexion, pas de compte).

## 4. Annonces

**Votre application contient-elle des annonces ?** → **Non** (aucun SDK publicitaire dans l'APK, vérifié).

## 5. Identifiant publicitaire

**Votre application utilise-t-elle l'identifiant publicitaire ?** → **Non** (permission `com.google.android.gms.permission.AD_ID` absente du manifeste fusionné, vérifié).

## 6. Classification du contenu (questionnaire IARC)

- Adresse e-mail pour l'IARC : **à confirmer par Cédric**
- Catégorie : **Toutes les autres catégories d’applications (Utilitaire, productivité, communication ou autre)**
- Violence, peur, sexualité, langage grossier, substances contrôlées, jeux d'argent/simulés, humour cru : **Non** à tout.
- Les utilisateurs peuvent-ils interagir ou échanger du contenu ? → **Non**
- Partage de la position de l'utilisateur avec d'autres : **Non**.
- Achats numériques : **Non**.
- Accès Internet non restreint (navigateur, moteur de recherche) : **Non**.
- Classification attendue : PEGI 3 / USK 0 / ESRB Everyone (résultat final attribué par l'IARC).

## 7. Public cible et contenu

- Tranches d'âge cibles : **13-15, 16-17, 18 ans et plus** (**à confirmer par Cédric**). Ne pas cocher de tranche < 13 ans (sinon règlement Familles).
- L'application pourrait-elle attirer involontairement les enfants ? → **Non**.
- Fiche Play : pas de contenu destiné aux enfants.

## 8. Règles de confidentialité

- URL : https://cdriccarboni.github.io/phablab-mobile-suite/confidentialite/framematch.html (fichier versionné : `docs/confidentialite/framematch.html`. GitHub Pages sert `/docs` depuis `main` : la page est en ligne après fusion de la PR.)
- Texte prêt à publier (à placer aussi en `docs/confidentialite.md`) :

```markdown
# Politique de confidentialité — FrameMatch

Dernière mise à jour : 27 septembre 2026. Éditeur : Cédric Carboni (**à confirmer par Cédric** : nom/raison sociale et e-mail de contact).

FrameMatch fonctionne sans compte, sans publicité et sans outil de mesure d'audience.
**Fonctions utilisées** : Caméra : photo de référence (@capacitor/camera) + aperçu en direct (getUserMedia), rien n'est enregistré ni envoyé. Le traitement se fait en mémoire sur le téléphone ; rien n'est enregistré par le développeur.
**Suppression** : aucune donnée n'est conservée par le développeur ; désinstaller l'app efface les données locales.

Contact : **à confirmer par Cédric** (adresse e-mail publique de support).
```

## 9. Sécurité des données

**L'application collecte-t-elle ou partage-t-elle des données utilisateur ?** → **Non**.
Justification : tout le traitement (micro / caméra / capteurs) se fait en mémoire sur l'appareil, rien n'est enregistré ni envoyé (code `src/apps.tsx` + chaînes de l'APK : aucun appel réseau hors bibliothèques inutilisées).
Création de compte : aucune → pas d'URL de suppression de compte.

Pratiques de sécurité : chiffrement en transit — voir ci-dessus ; « Engagement Familles » : Non ; « Examen de sécurité indépendant » : Non.

## 10. Autres déclarations de la section « Contenu de l'appli »

| Déclaration | Réponse |
|---|---|
| Application gouvernementale | Non |
| Fonctionnalités financières | « Mon application ne propose aucune fonctionnalité financière » |
| Applications de santé | Non / aucune fonctionnalité de santé |
| Application d'actualités | Non |
| Applications COVID-19 / Health Connect / VPN / accessibilité / gestion d'appareil | Non concerné |
| Autorisations photos et vidéos (READ_MEDIA_*) | Non concerné (absentes ; sélecteur photo système) |
| Service de premier plan (types FGS) | Non concerné (aucun service FGS dans le manifeste fusionné) |
| Alarmes exactes / intention plein écran | Non concerné (SCHEDULE_EXACT_ALARM / USE_FULL_SCREEN_INTENT absents) |
| Localisation (y compris arrière-plan) | Non concerné (aucune permission de localisation) |
| Notifications (POST_NOTIFICATIONS) | Non concerné |

## 11. Autorisations sensibles et écarts code ↔ déclaration

Aucune des permissions présentes ne requiert de formulaire de déclaration Play (caméra, micro, Bluetooth, vibration ne sont pas « permissions à haut risque »). Justifications à garder pour les testeurs / l'examen :

- Caméra : photo de référence (@capacitor/camera) + aperçu en direct (getUserMedia), rien n'est enregistré ni envoyé

Permissions **nécessaires** : CAMERA.
**Écart 1.0.0 corrigé.** Le manifeste fusionné de l'APK 1.0.1-beta.1 contient : CAMERA, plus la permission signature AndroidX `com.phablabphone.framematch.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Cette app n’a pas de salle : CAMERA n’est déclarée que si la fonction elle-même utilise la caméra.
Icône Capacitor par défaut remplacée. L'APK embarque l'icône de `store/play/framematch/` (emoji de apps.json). Les PNG mipmap diffèrent d'une app à l'autre ; pour WallCheck, le PNG xxxhdpi de l'APK est identique au fichier du dépôt.

## 12. Niveau d'API, version, signature

- targetSdk 36 : **conforme**. versionCode actuel 2 (`1.0.1-beta.1`) — chaque prochain envoi Play doit avoir un versionCode strictement supérieur.
- **Play App Signing** : obligatoire pour une nouvelle app (format AAB). Choisir « Laisser Google gérer et protéger la clé de signature ».
- **Clé d'importation** : **aucune clé d'envoi Play**. L'APK debug est signé avec la clé debug Android (installable pour test). L'AAB `framematch-1.0.1-beta.1-unsigned.aab` (SHA-256 `558e2f075a81822ea758631f84c626f1d2d32000fc0ddcb673b67ff5f115fcee`, https://github.com/cdriccarboni/phablab-mobile-suite/releases/download/framematch-v1.0.1-beta.1-test/framematch-1.0.1-beta.1-unsigned.aab) est produit par `bundleRelease` et **n'est pas signé avec une clé d'envoi Play**. Ne pas l'importer dans la Play Console. Cédric crée une clé d'importation hors Git, puis refait un `bundleRelease` signé.

## 13. Notes de version (test fermé)

```
<fr-FR>
Première version de test fermé de FrameMatch 1.0.1-beta.1. Merci de tester les fonctions principales et de signaler tout bug ou blocage via le lien de commentaires de la fiche.
</fr-FR>
<en-US>
First closed-test build of FrameMatch 1.0.1-beta.1. Please try the main features and report any bug via the feedback link.
</en-US>
```

## 14. Éléments graphiques

| Élément | Exigence | État |
|---|---|---|
| Icône 512×512 | obligatoire | **Présent** — `store/play/framematch/icon-512.png`. L'APK debug embarque le même visuel en mipmap (vérifié : le PNG est dans l'APK, distinct d'une app à l'autre). |
| Image de présentation 1024×500 | obligatoire | **Présent** — `store/play/framematch/feature-1024x500.png` |
| Captures téléphone (2 min.) | obligatoire | **Manquant** — captures réelles uniquement (règle GROWTH.md) |

## 15. Checklist test fermé

1. [ ] Play Console > **Créer une application** : nom ci-dessus, langue fr-FR, Application, Gratuite (prix : **à confirmer par Cédric**, rien n'a été modifié), accepter les déclarations.
2. [ ] Remplir « Contenu de l'appli » (§3 à §10) et la fiche (§1, §2, §14).
3. [ ] **Test fermé** > créer un canal (ex. « Bêta fermée ») > Pays : France (+ autres au choix).
4. [ ] Testeurs : **liste d'e-mails** (comptes Google) ou **Google Group** — **à confirmer par Cédric** (liste à fournir par Cédric ; aucun testeur n'a été contacté).
5. [ ] Créer une release : activer **Play App Signing**, importer l'**AAB signé avec la clé d'importation**, coller les notes §13.
6. [ ] Envoyer en examen, puis partager le **lien d'adhésion** (Test fermé > Testeurs > « Copier le lien ») aux testeurs.
7. [ ] **Compte développeur personnel créé après le 13/11/2023** : au moins **12 testeurs inscrits pendant 14 jours consécutifs** avant de pouvoir demander l'accès production. Type de compte : **à confirmer par Cédric**.
8. [ ] Suivre les retours, publier un nouveau versionCode si correctif.

## 16. Ce que seul Cédric peut faire

- Se connecter à la Play Console, créer l'app, remplir/valider les formulaires, soumettre.
- Créer/fournir la clé d'importation (ou utiliser l'existante pour Patat'Outils) et accepter Play App Signing.
- Fournir l'e-mail de contact public, la liste de testeurs (≥ 12) ou un Google Group, et confirmer les points **à confirmer par Cédric**.
