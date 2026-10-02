# SensorLink — règles spécifiques

Ce dossier contient **SensorLink**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Transformer un ancien téléphone en capteur distant SOUND / LIGHT / MOVEMENT / TILT / VIBRATION.

## Règles spécifiques
- Aucun compte ni cloud ne doit être nécessaire au fonctionnement normal.
- Les capacités réellement disponibles du téléphone doivent être détectées, pas supposées.
- La reconnexion locale doit être robuste et l’état de liaison visible.
- Conserver une identité, version, package Android/Play, tests et documentation propres à SensorLink.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
