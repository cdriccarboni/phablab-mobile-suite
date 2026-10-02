# WallCheck — règles spécifiques

Ce dossier contient **WallCheck**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Mesurer avec deux téléphones l’effet acoustique d’une séparation ou d’une paroi.

## Règles spécifiques
- Mesure indicative et honnête : ne jamais présenter le résultat comme une mesure acoustique professionnelle ou certifiée.
- Préserver le fonctionnement à deux téléphones et la comparaison avant/après.
- La synchronisation et les permissions micro doivent échouer clairement plutôt que produire une mesure trompeuse.
- Conserver une identité, version, package Android/Play, tests et documentation propres à WallCheck.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
