# CaptionCast — règles spécifiques

Ce dossier contient **CaptionCast**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Transcription vocale en direct diffusée vers un autre écran ou téléphone.

## Règles spécifiques
- La lisibilité du texte distant est prioritaire.
- Préserver un chemin local/peer-to-peer lorsque possible et ne pas imposer de compte.
- Une perte de reconnaissance ou de liaison doit être visible, jamais silencieuse.
- Conserver une identité, version, package Android/Play, tests et documentation propres à CaptionCast.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
