# CountTogether — règles spécifiques

Ce dossier contient **CountTogether**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Compteur partagé entre plusieurs téléphones pour compter ensemble sans doublons ni pertes.

## Règles spécifiques
- La cohérence du compteur partagé est prioritaire.
- Prévoir les reconnexions et éviter les doubles incréments.
- L’interface doit montrer clairement qui compte et l’état de synchronisation lorsque c’est pertinent.
- Conserver une identité, version, package Android/Play, tests et documentation propres à CountTogether.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
