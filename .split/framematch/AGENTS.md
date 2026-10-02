# FrameMatch — règles spécifiques

Ce dossier contient **FrameMatch**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Aider à reproduire un cadrage entre téléphones ou prises de vue.

## Règles spécifiques
- Prioriser les repères visuels simples et immédiatement lisibles.
- Ne pas dégrader l’image avec une UI envahissante.
- Le cadrage de référence doit rester clairement distinct du flux caméra courant.
- Conserver une identité, version, package Android/Play, tests et documentation propres à FrameMatch.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
