# SignMe — règles spécifiques

Ce dossier contient **SignMe**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Panneau/affichage plein écran piloté à distance depuis un autre téléphone.

## Règles spécifiques
- L’affichage distant doit rester instantanément lisible et utilisable en situation réelle.
- Préserver le mode plein écran et un contrôle distant simple.
- Ne pas multiplier les écrans de configuration au détriment de l’action principale.
- Conserver une identité, version, package Android/Play, tests et documentation propres à SignMe.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
