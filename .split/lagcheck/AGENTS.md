# LagCheck — règles spécifiques

Ce dossier contient **LagCheck**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Mesurer un décalage audio/vidéo de façon pratique avec un téléphone.

## Règles spécifiques
- Afficher clairement l’incertitude et les limites de la mesure.
- Ne pas présenter une estimation comme un instrument de laboratoire.
- Préserver un parcours de test court, répétable et compréhensible.
- Conserver une identité, version, package Android/Play, tests et documentation propres à LagCheck.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
