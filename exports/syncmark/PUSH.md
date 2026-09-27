# Pousser SyncMark vers un dépôt privé

Ce dossier est un export autonome. Il n'a pas été publié par l'agent si la création de dépôt a été refusée.

1. Créer le dépôt privé vide `cdriccarboni/syncmark` (droits requis).
2. Depuis ce dossier, sans réécrire l'historique publié de la suite et sans `--force` :

```sh
git init --branch grok/syncmark-finalisation-20260927
git add -A
git commit -m "feat: standalone SyncMark 1.0.1"
git remote add origin git@github.com:cdriccarboni/syncmark.git
git push -u origin grok/syncmark-finalisation-20260927
```

La branche de la suite qui porte le même nom conserve l'historique du monorepo plus un commit de découpage. `git filter-repo` n'est pas lancé ici : il réécrirait des commits déjà publiés. L'historique pertinent avant le découpage reste dans `cdriccarboni/phablab-mobile-suite`.

