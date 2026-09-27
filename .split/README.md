# Exports autonomes — vague P2

Ces dossiers sont générés par `scripts/export-standalone.mjs --apply` à partir du monorepo. Ils ne sont pas des dépôts Git séparés.

La création d’un dépôt privé `cdriccarboni/<id>` a été tentée avec `gh repo create --private`. L’intégration GitHub de l’agent a répondu `Resource not accessible by integration (createRepository)`. Aucun dépôt n’a été créé, aucun dépôt existant n’a changé de visibilité, rien n’a été supprimé ni forcé.

Les quatre applications suivies par l’autre agent (twinlevel, sensorlink, syncmark, soundrace) ne sont pas exportées ici.

Pour régénérer :

```bash
node scripts/export-standalone.mjs --apply --app=wallcheck
```

Chaque dossier doit passer `npm install && npm test` avant qu’un humain crée le dépôt privé correspondant.
