# data/ — Dati e flussi personali (DAT)

Un file `DAT-<slug>.yaml` per ogni flusso di dati personali: categorie,
base giuridica, retention. Validato da `schemas/data.schema.json`. Un
flusso di dati senza record DAT corrispondente fa fallire la build
(principio PRN-05).

Popolato in fase **M2 — Compliance Map** (vedi ARCHITECTURE.md §12).
