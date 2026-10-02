# SyncMark — règles spécifiques

Ce dossier contient **SyncMark**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Créer une marque commune flash / son / timestamp entre plusieurs téléphones pour faciliter une resynchronisation.

## Règles spécifiques
- Ne jamais présenter SyncMark comme un système de timecode professionnel.
- La marque doit être simple à déclencher et facile à retrouver.
- Les écarts et limites de synchronisation doivent être visibles plutôt que masqués.
- Conserver une identité, version, package Android/Play, tests et documentation propres à SyncMark.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
