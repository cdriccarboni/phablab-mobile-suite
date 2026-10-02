# CompareSound — règles spécifiques

Ce dossier contient **CompareSound**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Comparer deux situations acoustiques avant/après avec un seul téléphone.

## Règles spécifiques
- Présenter les résultats comme une comparaison pratique, pas comme une mesure certifiée.
- Conserver le même protocole de capture entre A et B.
- Les conditions de mesure doivent être visibles pour éviter les comparaisons trompeuses.
- Conserver une identité, version, package Android/Play, tests et documentation propres à CompareSound.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
