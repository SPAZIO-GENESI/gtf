# gtf — Genesis Trust Framework

Registro, schemi e generatori attraverso cui **Spazio Genesi ETS** dimostra
pubblicamente perché il servizio [attestazione.spaziogenesi.org](https://attestazione.spaziogenesi.org)
merita fiducia — con evidenze verificabili da chiunque, non con dichiarazioni.

Questo repository è la **Single Source of Truth**: ogni documento, pagina del
Trust Center, matrice di conformità e punteggio (Open Trust Score) è
**generato** dal registro in `registry/`, mai scritto a mano.

Leggi prima [ARCHITECTURE.md](./ARCHITECTURE.md): non è documentazione del
servizio, è il progetto del sistema che la produce.

## Struttura

- `registry/` — record atomici in YAML (principi, requisiti, controlli,
  implementazioni, evidenze, processi, decisioni, rischi, incidenti, azioni,
  dati, metriche, glossario). Uno schema JSON per tipo in `schemas/`.
- `generators/` — script Node che validano il registro e (dalla fase M3)
  generano il Trust Center, la Compliance Map e l'Open Trust Score.
- `site/` — sorgente statica del Trust Center pubblico (non ancora costruita).
- `snapshots/` — bundle di evidenze raccolte automaticamente, ancorati
  periodicamente col servizio stesso.

## Sviluppo locale

```bash
npm install
npm run validate   # valida schema, integrità dei riferimenti, anti-segreti
```

## Stato

Fase **M0 — Fondazione**: registro seed (missione + 10 principi), schemi,
validatore e CI attivi. Le fasi successive sono descritte in
[ARCHITECTURE.md §12](./ARCHITECTURE.md#12-roadmap--wbs).

## Licenza

MIT.
