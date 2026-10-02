# PhabLabPhone — règles spécifiques

Ce dossier contient **PhabLabPhone**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Laboratoire multi-capteurs de téléphone pour expérimenter son, lumière, mouvement et autres capteurs.

## Règles spécifiques
- Chaque capteur doit exposer honnêtement sa disponibilité et ses permissions.
- Ne pas simuler un capteur absent.
- Préserver une lecture pédagogique/simple malgré la diversité des capteurs.
- Conserver une identité, version, package Android/Play, tests et documentation propres à PhabLabPhone.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
