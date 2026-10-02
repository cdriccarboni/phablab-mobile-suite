# SoundRace — règles spécifiques

Ce dossier contient **SoundRace**, une application autonome même si son code vit encore dans le monorepo historique PhabLab Mobile Suite.

## Mission produit
Comparer quel téléphone détecte un son en premier.

## Règles spécifiques
- Les résultats doivent être présentés comme comparatifs et dépendants du matériel.
- Éviter de prétendre à une précision absolue entre appareils hétérogènes.
- La logique de départ, détection et classement doit être déterministe et testable.
- Conserver une identité, version, package Android/Play, tests et documentation propres à SoundRace.
- Ne pas fusionner fonctionnellement cette app avec une autre mini-app au seul motif qu’un moteur est partagé.
- Réutiliser le socle commun du dépôt sans casser les autres mini-apps.
- Toute extraction future vers un dépôt autonome doit emporter ce fichier et l’historique utile.

## Méthode
Les règles racine du dépôt `AGENTS.md` restent obligatoires : systematic debugging, TDD, verification-before-completion, état réel comme source de vérité, changements minimaux, Git comme mémoire commune.
