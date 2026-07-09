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
  `collect-evidence.mjs` (snapshot settimanale da endpoint pubblici, tag di
  release inclusi), `check-cadences.mjs` (avviso Telegram se un processo
  ricorrente supera la sua cadenza dichiarata), `anchor-monthly.mjs`
  (bundle mensile da attestare col servizio stesso, §6.4), `score.mjs`
  (Open Trust Score dal registro + ultimo snapshot), `build-site.mjs`
  (genera `site/index.html`).
- `site/` — Trust Center pubblico, generato — non modificarlo a mano.
- `snapshots/` — bundle di evidenze raccolte settimanalmente dal collettore
  (vedi ADR-GTF-004 per la collocazione nel repo invece che su R2).

## Sviluppo locale

```bash
npm install
npm run validate          # schema, integrità dei riferimenti, anti-segreti
npm run collect-evidence  # snapshot da endpoint pubblici (sola lettura)
npm run build             # validate + score + build-site (come in CI)
```

## Stato

**M4 in corso**: canary HMAC (P17-B) attivo e verificato in produzione;
collettore di evidenze settimanale attivo; `autart-signer` pubblicato (P11).
Primo ancoraggio dogfooding eseguito (2026-07, ADR-GTF-008); convenzione di
tag `vX.Y.Z` adottata sui tre repo pubblici (imgauth, imgauthweb,
autart-signer) e monitoraggio automatico delle cadenze ricorrenti con
avviso Telegram attivo e verificato (ADR-GTF-009) — nessuna cadenza
dipende più dalla sola memoria umana. Score ≈92-94/100, 6/10 indicatori
disponibili. Restano operative: restore drill, prima revisione trimestrale,
review esterna annuale (indipendenza del revisore ancora da risolvere).
Dettagli in [ARCHITECTURE.md §12](./ARCHITECTURE.md#12-roadmap--wbs).

## Licenza

MIT.
