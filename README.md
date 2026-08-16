# gtf — Genesis Trust Framework

[![Genesis Trust Score](https://trust.spaziogenesi.org/badge.svg)](https://trust.spaziogenesi.org)

Motore e registri attraverso cui **Spazio Genesi ETS** dimostra pubblicamente
perché il servizio [attestazione.spaziogenesi.org](https://attestazione.spaziogenesi.org)
merita fiducia — con evidenze verificabili da chiunque, non con dichiarazioni.
Il motore è generico (nessun nome di progetto al suo interno, vedi §15 di
ARCHITECTURE.md): questo repo ospita oggi un solo pacchetto di dati
(`attestazione`), ma è costruito per applicarsi a più di un progetto.

Questo repository è la **Single Source of Truth**: ogni documento, pagina del
Trust Center, matrice di conformità e punteggio (Open Trust Score) è
**generato** dai registri in `tenants/<id>/registry/`, mai scritto a mano.

Leggi prima [ARCHITECTURE.md](./ARCHITECTURE.md): non è documentazione del
servizio, è il progetto del sistema che la produce. Dal 16 agosto 2026 (P45)
[trust.spaziogenesi.org](https://trust.spaziogenesi.org) è la pagina del
framework, con un riepilogo dei tenant; il Trust Center pubblico di
attestazione è su
[attestazione.trust.spaziogenesi.org](https://attestazione.trust.spaziogenesi.org).

## Struttura

- `core/` — il motore, generico per qualunque progetto (nessun nome di
  progetto al suo interno, sorvegliato da una guardia CI, vedi ARCHITECTURE.md
  §15):
  - `schemas/` — uno schema JSON per tipo di record del registro (principi,
    requisiti, controlli, implementazioni, evidenze, processi, decisioni,
    rischi, dati, metriche, glossario, azioni).
  - `generators/` — script Node: `validate.mjs` (schema + integrità del
    grafo), `collect-evidence.mjs` (snapshot settimanale da endpoint
    pubblici, tag di release inclusi), `check-cadences.mjs` (avviso Telegram
    se un processo ricorrente supera la sua cadenza dichiarata),
    `anchor-monthly.mjs` (bundle mensile da attestare col servizio stesso,
    §6.4), `score.mjs` (Open Trust Score dal registro + ultimo snapshot),
    `build-site.mjs` (genera `site/index.html`), `build-changelog.mjs`
    (genera `CHANGELOG.md` e `site/changelog.html` da `content/changelog.yaml`),
    `check-core-isolation.mjs` (la guardia anti-contaminazione di `core/`).
- `tenants/<id>/` — i dati di un progetto applicato: `registry/` (i record
  YAML veri e propri), `snapshots/` (evidenze raccolte settimanalmente,
  ADR-GTF-004), `tenant.config.json` (testi del Trust Center, URL esterni,
  elenco repo di codice, endpoint del collettore). Un solo tenant esiste
  oggi: `tenants/attestazione/`.
- `content/` — testi curati del prodotto, non derivati dal registro
  (`changelog.yaml`, sorgente unica a doppia resa).
- `site/` — Trust Center pubblico, generato — non modificarlo a mano.
- `default-tenant.json` — quale tenant usare se `GTF_TENANT` non è
  impostata (configurazione di bootstrap, fuori da `core/` apposta).

## Sviluppo locale

```bash
npm install
GTF_TENANT=attestazione npm run validate   # schema, integrità dei riferimenti, anti-segreti
GTF_TENANT=attestazione npm run build      # validate + check-core + score + build-site + build-changelog (come in CI)
```

`GTF_TENANT` è facoltativa finché esiste un solo tenant (`default-tenant.json`
la imposta di default), ma va sempre passata esplicitamente non appena ne
esiste più di uno.

## Stato

**M4 in corso, M5 avviata (P44, dal 2026-08-15)**: canary HMAC (P17-B) attivo
e verificato in produzione; collettore di evidenze settimanale attivo;
`autart-signer` pubblicato (P11). Primo ancoraggio dogfooding eseguito
(2026-07, ADR-GTF-008); convenzione di tag `vX.Y.Z` adottata sui tre repo
pubblici (imgauth, imgauthweb, autart-signer) e monitoraggio automatico delle
cadenze ricorrenti con avviso Telegram attivo e verificato (ADR-GTF-009).
Restore drill e prima revisione trimestrale completati senza rilievi (P33).
Score 91-94/100 (fluttua onestamente con i dati reali raccolti), 10/10
indicatori disponibili.
Dal 15 agosto 2026 il motore si sta separando dai dati del progetto
attestazione (P44, `core/` ↔ `tenants/attestazione/`, ADR-GTF-014) per poter
applicare lo stesso framework a un secondo progetto (RADART, P46) senza
duplicare codice — vedi [ARCHITECTURE.md §15](./ARCHITECTURE.md#15-multi-progetto--core-e-tenantsid)
e `docs/ROADMAP-trust-multiprogetto.md`.
Dettagli fase per fase in [ARCHITECTURE.md §12](./ARCHITECTURE.md#12-roadmap--wbs).

## Licenza

MIT.
