# gtf — Genesis Trust Framework

[![Genesis Trust Score](https://trust.spaziogenesi.org/badge.svg)](https://trust.spaziogenesi.org)

Registro, schemi e generatori attraverso cui **Spazio Genesi ETS** dimostra
pubblicamente perché il servizio [attestazione.spaziogenesi.org](https://attestazione.spaziogenesi.org)
merita fiducia — con evidenze verificabili da chiunque, non con dichiarazioni.

Questo repository è la **Single Source of Truth**: ogni documento, pagina del
Trust Center, matrice di conformità e punteggio (Open Trust Score) è
**generato** dal registro in `registry/`, mai scritto a mano.

Leggi prima [ARCHITECTURE.md](./ARCHITECTURE.md): non è documentazione del
servizio, è il progetto del sistema che la produce. Il Trust Center pubblico
è su [trust.spaziogenesi.org](https://trust.spaziogenesi.org).

## Struttura

- `registry/` — record atomici in YAML (principi, requisiti, controlli,
  implementazioni, evidenze, processi, decisioni, rischi, dati, metriche).
  Uno schema JSON per tipo in `schemas/`.
- `generators/` — script Node: `validate.mjs` (schema + integrità del grafo),
  `score.mjs` (Open Trust Score dal solo registro), `build-site.mjs`
  (genera `site/index.html`).
- `site/` — Trust Center pubblico, generato — non modificarlo a mano.
- `snapshots/` — bundle di evidenze raccolte nel tempo (non ancora popolato,
  vedi ADR-GTF-004).

## Sviluppo locale

```bash
npm install
npm run validate    # schema, integrità dei riferimenti, anti-segreti
npm run build       # validate + score + build-site (come in CI)
```

## Stato

**M3 v0** completata: Trust Center generato dal registro (missione, principi,
posizionamento eIDAS, Compliance Map, rischi, decisioni) + primo calcolo
dell'Open Trust Score (5 dei 10 indicatori calcolabili solo dal registro, gli
altri dichiaratamente `n/d`). Prossimi passi in
[ARCHITECTURE.md §12](./ARCHITECTURE.md#12-roadmap--wbs).

## Licenza

MIT.
