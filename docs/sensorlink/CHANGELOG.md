# SensorLink — journal

Les versions partent de la suite 1.0.0 (versionCode 1). Elles ne sont pas remises à zéro.

## 1.0.1 — 2026-09-27

- Parcours PAIR, laisser le téléphone, lire les échantillons distants.
- Choix son / inclinaison / mouvement. Le flux local s’affiche sur le téléphone émetteur.
- Unités : son en dBFS (pas en dB SPL), inclinaison en degrés, mouvement en m/s² à partir de l’accélération incluant la gravité.
- Tare : soustrait la valeur courante en m/s². Valeur relative, pas un accéléromètre étalonné.
- La sélection, la tare et le dernier échantillon distant sont enregistrés sur le téléphone.
- Micro, orientation et mouvement sont coupés à l’arrêt ou quand l’app n’est plus visible.
- Envoi prévu environ toutes les 160 ms pendant le flux. Cet intervalle n’a pas été mesuré sur un appareil.
- Reconnexion manuelle, sans boucle.
- Package : `com.phablabphone.sensorlink`.
