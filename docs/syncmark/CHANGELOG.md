# SyncMark — journal

Les versions partent de la suite 1.0.0 (versionCode 1). Elles ne sont pas remises à zéro.

## 1.0.1 — 2026-09-27

- Parcours PAIR, choix du compte à rebours (0, 1, 3 ou 5 s), marque flash + bip + vibration.
- Le compte à rebours est propre à chaque téléphone, à partir de la réception du message. Ce n’est pas un timecode commun.
- Les marques déjà parties et le délai choisi sont enregistrés sur le téléphone (heure locale).
- Une marque en attente est annulée si l’app passe en arrière-plan. Le bip utilise un contexte audio fermé ensuite.
- La marque part aussi sur le téléphone qui appuie, même sans autre participant.
- Reconnexion manuelle, sans boucle.
- Package : `com.phablabphone.syncmark`.
