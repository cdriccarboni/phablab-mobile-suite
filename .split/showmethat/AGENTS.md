# ShowMeThat — règles spécifiques

Ce dossier contient **ShowMeThat**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Envoyer une photo ou une annotation à un autre téléphone pour montrer précisément une zone ou un détail.

## Règles spécifiques
- Prioriser la vitesse photo → annotation → envoi.
- Préserver lisibilité et zoom de l’annotation.
- Une liaison perdue doit être signalée clairement et ne jamais faire croire à un envoi réussi.
- Conserver une identité, version, package Android/Play, tests et documentation propres à ShowMeThat.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
