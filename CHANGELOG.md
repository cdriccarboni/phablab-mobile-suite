# TwinLevel — journal

Les versions partent de la suite 1.0.0 (versionCode 1). Elles ne sont pas remises à zéro.

## 1.0.1 — 2026-09-27

- Parcours CAPTURE, déplacement, comparaison d’angle en degrés, avec indicateur d’affichage sous 1°.
- Zéro local (ZERO HERE) : la pose courante devient 0° sur les deux axes. Ce n’est pas un étalonnage d’usine.
- La référence, le zéro et l’écart restent sur le téléphone (stockage local). Une référence reçue dans la salle remplace la référence enregistrée.
- Le capteur d’orientation est arrêté à l’arrêt, quand l’app passe en arrière-plan, ou quand on quitte l’écran.
- La reconnexion de salle est manuelle. Aucune boucle de retry n’est lancée.
- Package Android inchangé par rapport à la spécification de la suite : `com.phablabphone.twinlevel`.
