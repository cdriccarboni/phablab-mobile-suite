# RelayTap — règles spécifiques

Ce dossier contient **RelayTap**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Relayer une action/tap entre plusieurs téléphones avec un retour clair.

## Règles spécifiques
- Éviter les doubles déclenchements et boucles de relais.
- L’état de connexion et l’accusé de réception doivent être visibles.
- Le geste principal doit rester instantané, sans configuration lourde.
- Conserver une identité, version, package Android/Play, tests et documentation propres à RelayTap.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
