# PaperCheck — règles spécifiques

Ce dossier contient **PaperCheck**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Transformer une liste papier photographiée en checklist utilisable sur téléphone.

## Règles spécifiques
- L’OCR doit rester corrigeable par l’utilisateur.
- Ne jamais supprimer silencieusement un item mal reconnu.
- Le flux photo → reconnaissance → checklist doit rester court et robuste.
- Conserver une identité, version, package Android/Play, tests et documentation propres à PaperCheck.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
