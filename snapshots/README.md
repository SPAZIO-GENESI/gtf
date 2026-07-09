# snapshots/ — Bundle di evidenze raccolte

Uno snapshot settimanale (`YYYY-Www/`, ISO week) prodotto dal collettore
automatico (`generators/collect-evidence.mjs`, eseguito da
`.github/workflows/collect-evidence.yml` ogni lunedì + `workflow_dispatch`,
GTF-ARCH §6.3): stato live, storico 90gg, health-log degli ultimi 7 giorni,
issue del monitor, ultimi commit dei repo pubblici — JSON grezzi +
`manifest.json` con SHA-256 di ogni file. Il collettore aggiorna anche il
campo `last_seen` delle evidenze (EVD) corrispondenti nel registro.

L'ancoraggio dogfooding mensile in Bitcoin (§6.4, `generators/anchor-monthly.mjs`)
scrive in `anchors/<periodo>-bundle.json` il bundle cumulativo attestato col
servizio stesso; primo ancoraggio: periodo 2026-07 (vedi CTL-dogfooding-anchor,
EVD-dogfooding-anchor nel registro). Collocazione decisa in ADR-GTF-004 (nel
repo, non R2, finché il volume resta basso).
