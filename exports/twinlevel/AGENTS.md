# TwinLevel — règles spécifiques

Ce dossier contient **TwinLevel**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Reproduire ou comparer une inclinaison entre deux téléphones.

## Règles spécifiques
- La calibration et le zéro doivent être compréhensibles.
- Éviter les faux niveaux de précision.
- Préserver un appairage simple et un retour visuel immédiat de l’écart.
- Conserver une identité, version, package Android/Play, tests et documentation propres à TwinLevel.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
