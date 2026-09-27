# Réconciliation P1 — historique Mac et GitHub

Date : 2026-09-27. Dépôt public `cdriccarboni/phablab-mobile-suite`. Aucun secret n’est ajouté.

## Ce qui avait divergé

Base commune : `4c9b1c3` « build: optimize independent Android test APKs ».

Le clone Mac avait deux commits qui n’étaient pas sur GitHub, fournis par `git format-patch --stdout 4c9b1c3..084ff25` :

| SHA d’origine (Mac, objets absents de ce clone) | Message |
| --- | --- |
| `3460c0135f75e38da99bbb024bbfd96d40c7348a` | refactor(core): harden mobile sessions and resource lifecycle |
| `084ff253418e3fa9d2155fc41f1d830638181b16` | feat(apps): advance ultimate mobile workflows |

GitHub, de son côté, avait avancé sur la même base :

| SHA conservé tel quel | Message |
| --- | --- |
| `9402f87f773e8f2764c6be3ebaef828f0a38e320` | chore: add safe standalone mini-app exporter |
| `091b3a88e1c9f673281d6788ffcb74de57839134` | ci: validate standalone mini-app split plan |

Les deux lignes touchaient des fichiers différents (`scripts/export-standalone.mjs` et le workflow d’un côté, `src/` et `package.json` de l’autre). Rien de ces diffs n’a été écarté.

## Comment les deux lignes sont réunies

1. Les deux patches ont été rejoués avec `git am` sur `4c9b1c3`, en conservant auteur, date et message. Les SHA d’origine ne peuvent pas réapparaître : ce clone n’a que le patch, pas les objets Git du Mac, et le parent GitHub n’est plus seulement `4c9b1c3`.
2. Commits rejoués : `2a9fa99` (refactor core) et `d30e73d` (workflows apps).
3. Fusion sans fast-forward dans `grok/phablab-p1-finalisation-20260927` : `1bae845`. Les deux parents restent joignables. Pas de rebase, pas de reset, pas de force-push.
4. Le fichier non suivi du Mac, après le marqueur `=====UNTRACKED build-aab-shared.mjs=====`, a été ajouté tel quel dans `9c4abff` : `scripts/build-aab-shared.mjs`.

## Ajustement après récupération

Le script AAB récupéré forçait `versionCode 1` et `versionName 1.0.0` pour toutes les apps. Cela remettait à zéro les compteurs. Il lit maintenant `store/app-versions.json`. Les douze autres apps restent sur la base 1.0.0 / versionCode 1. TwinLevel, SensorLink, SyncMark et SoundRace passent à 1.0.1 / versionCode 2.

Les tests `.ts` du patch Mac sont lancés avec `node --experimental-strip-types`, requis par Node 22.14. Le constructeur de `Session` n’utilise plus les parameter properties, que ce mode ne sait pas exécuter. Le comportement (usine de Peer, identité, app, rappel, délai de 15 s) est le même.

## Ce qui n’est pas réécrit

`git filter-repo` n’a pas été lancé sur la branche publiée : il réécrirait des commits déjà sur GitHub et exigerait un force-push. L’historique de la suite reste intact. Le découpage autonome est un export de fichiers plus, pour chaque app, une branche dont la pointe ne contient que cette app, avec l’historique précédent toujours accessible.
