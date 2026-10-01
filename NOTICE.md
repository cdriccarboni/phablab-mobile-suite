# SoundRace 1.0.1

Armer les micros, produire un son confortable, voir quel téléphone l’a détecté en premier.

Le seuil est un RMS numérique (amplitude pleine échelle), pas un niveau en dB SPL. La calibration d’une seconde ne garantit ni la détection ni l’absence de faux déclenchement.

Les écarts sont en millisecondes, calculés avec l’horloge de chaque téléphone (`Date.now()`). Les horloges ne sont pas synchronisées. Aucun délai acoustique ni aucune précision de classement n’ont été mesurés.

Hors ligne : un téléphone peut s’armer seul. Le classement entre plusieurs téléphones demande une salle connectée. Le micro est coupé dès que l’écoute s’arrête.
