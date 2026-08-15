# controls/ — Controlli (CTL)

Un file `CTL-<slug>.yaml` per ogni controllo attivo o pianificato, validato
da `schemas/control.schema.json`. Un controllo `active` deve avere almeno
un'implementazione (IMP) e un'evidenza (EVD) non scadute — altrimenti la CI
lo marca `stale`. Vedi GTF-ARCH §3.3, §3.4.

Popolato in fase **M1 — Import dell'esistente** (vedi ARCHITECTURE.md §12).
