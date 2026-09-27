# SoundRace — journal

Les versions partent de la suite 1.0.0 (versionCode 1). Elles ne sont pas remises à zéro.

## 1.0.1 — 2026-09-27

- Parcours ARM, son, classement.
- Calibration d’ambiance d’une seconde : seuil proposé = 1,5 × le pic RMS, borné entre 0,05 et 0,35. Le RMS est une amplitude pleine échelle, sans unité physique.
- Le classement affiche des écarts en millisecondes entre les horloges de chaque téléphone. Ce n’est pas un retard acoustique mesuré.
- Le seuil et le classement sont enregistrés sur le téléphone.
- Le micro est relâché après détection, à l’annulation, et quand l’app n’est plus visible.
- Reconnexion manuelle, sans boucle.
- Package : `com.phablabphone.soundrace`.
