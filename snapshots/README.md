# snapshots/ — Bundle di evidenze raccolte

Uno snapshot settimanale (`YYYY-Www/`, ISO week) prodotto dal collettore
automatico (`generators/collect-evidence.mjs`, eseguito da
`.github/workflows/collect-evidence.yml` ogni lunedì + `workflow_dispatch`,
GTF-ARCH §6.3): stato live, storico 90gg, health-log degli ultimi 7 giorni,
issue del monitor, ultimi commit dei repo pubblici — JSON grezzi +
`manifest.json` con SHA-256 di ogni file. Il collettore aggiorna anche il
campo `last_seen` delle evidenze (EVD) corrispondenti nel registro.

Non ancora presente: l'ancoraggio dogfooding mensile in Bitcoin (§6.4) —
resta nel backlog di M4. Collocazione decisa in ADR-GTF-004 (nel repo,
non R2, finché il volume resta basso).
