# snapshots/ — Bundle di evidenze raccolte

Uno snapshot settimanale (`YYYY-WW/`) prodotto dal collettore automatico
(`.github/workflows/collect-evidence.yml`, GTF-ARCH §6.3): JSON grezzi +
`manifest.json` con SHA-256 di ogni file. Ancorato mensilmente in Bitcoin
via il servizio stesso (§6.4, "dogfooding").

Non ancora popolato: il collettore è pianificato per la fase **M1/M4**
(vedi ARCHITECTURE.md §12). Vedi anche ADR-GTF-004 (collocazione).
