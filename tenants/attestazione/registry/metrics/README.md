# metrics/ — Metriche e indicatori (MET)

Un file `MET-<slug>.yaml` per ogni indicatore, inclusi i dieci assi
dell'Open Trust Score (GTF-ARCH §8) con la loro formula pubblica calcolabile
da chiunque. Validato da `schemas/metric.schema.json`.

Popolato (10/10 indicatori documentati). 5 sono calcolati oggi solo dal
registro (`generators/score.mjs`); 5 restano dichiaratamente `n/d` finché
non esisteranno un collettore di evidenze live, uno scanner privacy, dati
GitHub o il primo ciclo di audit/restore-drill — ciascun record spiega
cosa manca per attivarsi.
