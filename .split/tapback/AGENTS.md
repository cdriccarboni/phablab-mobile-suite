# TapBack — règles spécifiques

Ce dossier contient **TapBack**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Bouton distant minimal, appairé par QR, qui déclenche un retour clair (vibration, flash ou son) sur un autre téléphone.

## Règles spécifiques
- Préserver un appairage simple et rapide.
- Le feedback distant doit être explicite et fiable.
- Éviter les écrans superflus : l’action principale doit rester immédiatement accessible.
- Conserver une identité, version, package Android/Play, tests et documentation propres à TapBack.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
